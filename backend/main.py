"""
main.py - FastAPI server entry point.
Run with: uvicorn main:app --reload --port 8000
"""

import csv
import hashlib
import io
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import Body, FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware

import counterfactual as cf_module
import db
import explainer as explainer_module
import fairness as fairness_module
import model as model_module
from schemas import ApplicantInput, BiasResponse, DashboardResponse, PredictionResponse

BASE_DIR = Path(__file__).parent

# -------------------------------------------------------------------
# Cached results computed once at startup
# -------------------------------------------------------------------
_fairness_cache: dict | None = None
_dashboard_cache: dict | None = None

INCOME_BUCKETS = [
    (0, 15_000, "<15k"),
    (15_000, 30_000, "15k-30k"),
    (30_000, 60_000, "30k-60k"),
    (60_000, 100_000, "60k-100k"),
    (100_000, float("inf"), "100k+"),
]


# -------------------------------------------------------------------
# Startup / shutdown lifecycle
# -------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global _fairness_cache, _dashboard_cache

    print("=" * 50)
    print("[0/5] Initializing MongoDB...")
    db.init_mongodb()

    print("[1/5] Loading model and encoders...")
    m = model_module.load_model()
    encoders = model_module.get_encoders()
    feature_names = model_module.get_feature_names()
    print(f"      Model loaded. Features: {feature_names}")

    print("[2/5] Building SHAP explainer...")
    try:
        X_test = pd.read_csv(BASE_DIR / "X_test.csv")
        explainer_module.build_explainer(m, X_test.values)
        print("      SHAP explainer ready.")
    except Exception as e:
        print(f"      WARNING - SHAP build failed: {e}")

    print("[3/5] Running fairness audit...")
    _fairness_cache = fairness_module.run_audit(m, encoders, feature_names)

    print("[4/5] Computing dashboard statistics...")
    _dashboard_cache = _compute_dashboard(m)

    print("=" * 50)
    print("Application startup complete. API running on http://localhost:8000")
    print("=" * 50)
    yield
    db.close_mongodb()


def _compute_dashboard(model) -> dict:
    """Compute summary stats from the test set to populate the dashboard."""
    try:
        X_test = pd.read_csv(BASE_DIR / "X_test.csv")
        probs = model.predict_proba(X_test.values)[:, 1]

        total = len(probs)
        approved = int((probs >= 0.60).sum())
        reviewed = int(((probs >= 0.40) & (probs < 0.60)).sum())
        rejected = int((probs < 0.40).sum())

        avg_cs = round(float(X_test["Credit_Score"].mean()))

        return {
            "total_applications": 7501,
            "approval_rate": round(approved / total * 100, 1),
            "rejection_rate": round(rejected / total * 100, 1),
            "review_rate": round(reviewed / total * 100, 1),
            "avg_credit_score": avg_cs,
        }
    except Exception as e:
        print(f"Dashboard compute failed: {e}. Using defaults.")
        return {
            "total_applications": 7501,
            "approval_rate": 50.0,
            "rejection_rate": 40.0,
            "review_rate": 10.0,
            "avg_credit_score": 680,
        }


def _parse_range_days(range_value: str) -> int | None:
    normalized = (range_value or "30d").strip().lower()
    if normalized == "all":
        return None
    if normalized.endswith("d") and normalized[:-1].isdigit():
        return int(normalized[:-1])
    raise HTTPException(status_code=400, detail="Invalid range. Use 7d, 30d, 90d, or all.")


def _parse_iso_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _safe_number(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _filter_apps_by_range(apps: list[dict], range_value: str) -> list[dict]:
    days = _parse_range_days(range_value)
    if days is None:
        return apps

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    filtered = []

    for app_record in apps:
        created_at = _parse_iso_datetime(app_record.get("created_at"))
        if created_at is None:
            continue
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        if created_at >= cutoff:
            filtered.append(app_record)

    return filtered


def _build_bias_metrics_from_apps(apps: list[dict]) -> dict | None:
    if not apps:
        return None

    gender = {
        "male": {"approved": 0, "total": 0},
        "female": {"approved": 0, "total": 0},
    }
    income_groups = [
        {"range": label, "approved": 0, "total": 0}
        for _, _, label in INCOME_BUCKETS
    ]

    for app_record in apps:
        input_data = app_record.get("input", {})
        prediction = app_record.get("prediction", {})
        approved = prediction.get("decision") == "Approved"

        gender_value = str(input_data.get("gender", "")).strip().lower()
        if gender_value in gender:
            gender[gender_value]["total"] += 1
            if approved:
                gender[gender_value]["approved"] += 1

        income = _safe_number(input_data.get("income"))
        for index, (lower, upper, _) in enumerate(INCOME_BUCKETS):
            if lower <= income < upper:
                income_groups[index]["total"] += 1
                if approved:
                    income_groups[index]["approved"] += 1
                break

    rates = []
    normalized_groups = []
    for group in income_groups:
        total = group["total"]
        approval_rate = round(group["approved"] / total, 2) if total else 0.0
        rates.append(approval_rate)
        normalized_groups.append(
            {"range": group["range"], "approval_rate": approval_rate}
        )

    fairness_score = round(max(0.0, 100.0 - ((max(rates) - min(rates)) * 100)), 1) if rates else 0.0

    return {
        "fairness_score": fairness_score,
        "gender": gender,
        "income_groups": normalized_groups,
    }


def _get_bias_metrics(range_value: str, user_email: str | None = None) -> dict:
    if user_email and user_email != "anonymous":
        apps = db.get_user_applications(user_email)
    else:
        apps = db.get_all_applications(limit=10000)
    filtered_apps = _filter_apps_by_range(apps, range_value)
    derived_metrics = _build_bias_metrics_from_apps(filtered_apps)
    if derived_metrics is not None:
        return derived_metrics
    if _fairness_cache is None:
        raise HTTPException(status_code=503, detail="Fairness audit not yet computed")
    return _fairness_cache


def _csv_response(content: str, filename: str) -> Response:
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# -------------------------------------------------------------------
# FastAPI app
# -------------------------------------------------------------------
app = FastAPI(
    title="Explainable Credit Scoring API",
    description="XGBoost + SHAP credit scoring system with fairness audit",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------------------
# Routes
# -------------------------------------------------------------------
@app.get("/api/health")
def health():
    return {"status": "ok", "model": "loaded"}


def _get_dashboard_metrics(user_email: str | None = None) -> dict:
    if user_email and user_email != "anonymous":
        apps = db.get_user_applications(user_email)
    else:
        apps = db.get_all_applications(limit=10000)

    if not apps:
        if _dashboard_cache is None:
            raise HTTPException(status_code=503, detail="Dashboard not yet computed")
        return _dashboard_cache

    total = len(apps)
    approved = 0
    rejected = 0
    reviewed = 0
    total_credit_score = 0

    for app_record in apps:
        input_data = app_record.get("input", {})
        prediction = app_record.get("prediction", {})
        decision = prediction.get("decision", "")
        
        # Read the applicant's submitted FICO score, not the AI's generated risk probability
        score = _safe_number(input_data.get("credit_score_input", 0))

        if decision == "Approved":
            approved += 1
        elif decision == "Rejected":
            rejected += 1
        elif decision in ("Review", "Manual Review"):
            reviewed += 1

        total_credit_score += score

    return {
        "total_applications": total,
        "approval_rate": round(approved / total * 100, 1) if total > 0 else 0.0,
        "rejection_rate": round(rejected / total * 100, 1) if total > 0 else 0.0,
        "review_rate": round(reviewed / total * 100, 1) if total > 0 else 0.0,
        "avg_credit_score": round(total_credit_score / total) if total > 0 else 0.0,
    }


@app.get("/api/dashboard", response_model=DashboardResponse)
def dashboard(request: Request):
    user_email = request.headers.get("X-User-Email")
    return _get_dashboard_metrics(user_email)


@app.get("/api/bias", response_model=BiasResponse)
def bias(request: Request, range: str = Query("30d")):
    user_email = request.headers.get("X-User-Email")
    return _get_bias_metrics(range, user_email)


@app.get("/api/bias-metrics", response_model=BiasResponse)
def bias_metrics(request: Request, range: str = Query("30d")):
    user_email = request.headers.get("X-User-Email")
    return _get_bias_metrics(range, user_email)


@app.get("/api/history")
def history(request: Request):
    """Fetch user-specific evaluation history."""
    user_email = request.headers.get("X-User-Email")
    if user_email and user_email != "anonymous":
        return db.get_user_applications(user_email)
    return db.get_all_applications(limit=200)


@app.get("/api/export-report")
def export_report(request: Request):
    user_email = request.headers.get("X-User-Email")
    dashboard_metrics = _get_dashboard_metrics(user_email)
    bias_metrics_data = _get_bias_metrics("30d", user_email)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["metric", "value"])
    writer.writerow(["generated_at_utc", datetime.now(timezone.utc).isoformat()])
    writer.writerow(["total_applications", dashboard_metrics["total_applications"]])
    writer.writerow(["approval_rate", dashboard_metrics["approval_rate"]])
    writer.writerow(["rejection_rate", dashboard_metrics["rejection_rate"]])
    writer.writerow(["review_rate", dashboard_metrics["review_rate"]])
    writer.writerow(["avg_credit_score", dashboard_metrics["avg_credit_score"]])
    writer.writerow(["fairness_score_30d", bias_metrics_data["fairness_score"]])

    for segment, stats in bias_metrics_data["gender"].items():
        writer.writerow([f"gender_{segment}_approved", stats["approved"]])
        writer.writerow([f"gender_{segment}_total", stats["total"]])

    for group in bias_metrics_data["income_groups"]:
        writer.writerow([f"income_{group['range']}_approval_rate", group["approval_rate"]])

    filename = f"dashboard-report-{datetime.now().strftime('%Y%m%d-%H%M%S')}.csv"
    return _csv_response(output.getvalue(), filename)


@app.get("/api/export-audit-log")
def export_audit_log(request: Request, range: str = Query("30d")):
    user_email = request.headers.get("X-User-Email")
    if user_email and user_email != "anonymous":
        apps = db.get_user_applications(user_email)
    else:
        apps = db.get_all_applications(limit=10000)
    apps = _filter_apps_by_range(apps, range)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "application_id",
        "created_at",
        "user_email",
        "decision",
        "credit_score",
        "gender",
        "income",
        "loan_amount",
        "selected_range",
    ])

    if not apps:
        writer.writerow(["", "", "", "No audit records found for selected range", "", "", "", "", range])
    else:
        for app_record in apps:
            input_data = app_record.get("input", {})
            prediction = app_record.get("prediction", {})
            writer.writerow([
                app_record.get("_id", ""),
                app_record.get("created_at", ""),
                app_record.get("user_email", ""),
                prediction.get("decision", ""),
                prediction.get("credit_score", ""),
                input_data.get("gender", ""),
                input_data.get("income", ""),
                input_data.get("loan_amount", ""),
                range,
            ])

    filename = f"audit-log-{range}-{datetime.now().strftime('%Y%m%d-%H%M%S')}.csv"
    return _csv_response(output.getvalue(), filename)


@app.post("/api/predict", response_model=PredictionResponse)
def predict(applicant: ApplicantInput, request: Request):
    """
    Main prediction endpoint.
    Accepts applicant financial + demographic data.
    Returns: credit_score, decision, SHAP explanations, feature_importance,
    counterfactuals (if rejected). Saves application to MongoDB.
    """
    try:
        user_email = request.headers.get("X-User-Email", "anonymous")

        m = model_module.get_model()
        encoders = model_module.get_encoders()
        feature_names = model_module.get_feature_names()

        score, decision, prob, arr = model_module.predict(
            applicant, m, encoders, feature_names
        )

        feature_importance, explanations = explainer_module.explain(
            arr, feature_names, applicant
        )

        counterfactuals = None
        if decision == "Rejected":
            counterfactuals = cf_module.get_counterfactuals(applicant, score, prob)

        response = PredictionResponse(
            credit_score=score,
            decision=decision,
            explanations=explanations,
            feature_importance=feature_importance,
            counterfactuals=counterfactuals,
        )

        db.save_application(
            user_email=user_email,
            input_data=applicant.dict(),
            prediction=response.dict(),
        )

        return response

    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------------------------------
# Auth stubs (demo - no real database)
# -------------------------------------------------------------------
@app.post("/api/auth/login")
def login(body: dict = Body(...)):
    email = body.get("email", "").strip()
    password = body.get("password", "").strip()

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    user = db.get_user(email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    pwd_hash = hashlib.sha256(password.encode()).hexdigest()
    if user["password_hash"] != pwd_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    db.update_user_login(email)

    token = hashlib.sha256(f"{email}|{pwd_hash}".encode()).hexdigest()
    return {"access_token": token, "email": email}


@app.post("/api/auth/signup")
def signup(body: dict = Body(...)):
    email = body.get("email", "").strip()
    password = body.get("password", "").strip()

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    pwd_hash = hashlib.sha256(password.encode()).hexdigest()

    try:
        db.create_user(email, pwd_hash)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    token = hashlib.sha256(f"{email}|{pwd_hash}".encode()).hexdigest()
    return {"access_token": token, "email": email}


# -------------------------------------------------------------------
# Dev entrypoint
# -------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
