"""
main.py — FastAPI server entry point.
Run with:  uvicorn main:app --reload --port 8000
"""
from contextlib import asynccontextmanager
from typing import Any

import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from schemas import ApplicantInput, PredictionResponse, BiasResponse, DashboardResponse
import model as model_module
import explainer as explainer_module
import counterfactual as cf_module
import fairness as fairness_module

BASE_DIR = Path(__file__).parent

# -------------------------------------------------------------------
# Cached results computed once at startup
# -------------------------------------------------------------------
_fairness_cache: dict | None = None
_dashboard_cache: dict | None = None


# -------------------------------------------------------------------
# Startup / shutdown lifecycle
# -------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global _fairness_cache, _dashboard_cache

    print("=" * 50)
    print("[1/4] Loading model and encoders…")
    m = model_module.load_model()
    encoders = model_module.get_encoders()
    feature_names = model_module.get_feature_names()
    print(f"      Model loaded. Features: {feature_names}")

    print("[2/4] Building SHAP explainer…")
    try:
        X_test = pd.read_csv(BASE_DIR / "X_test.csv")
        explainer_module.build_explainer(m, X_test.values)
        print("      SHAP explainer ready.")
    except Exception as e:
        print(f"      WARNING — SHAP build failed: {e}")

    print("[3/4] Running fairness audit…")
    _fairness_cache = fairness_module.run_audit(m, encoders, feature_names)

    print("[4/4] Computing dashboard statistics…")
    _dashboard_cache = _compute_dashboard(m)

    print("=" * 50)
    print("Application startup complete.  API running on http://localhost:8000")
    print("=" * 50)
    yield
    # Cleanup (if needed) goes here


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
            "total_applications": 7501,           # full dataset size
            "approval_rate":  round(approved / total * 100, 1),
            "rejection_rate": round(rejected / total * 100, 1),
            "review_rate":    round(reviewed / total * 100, 1),
            "avg_credit_score": avg_cs,
        }
    except Exception as e:
        print(f"Dashboard compute failed: {e}. Using defaults.")
        return {
            "total_applications": 7501,
            "approval_rate":  50.0,
            "rejection_rate": 40.0,
            "review_rate":    10.0,
            "avg_credit_score": 680,
        }


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

@app.get("/health")
def health():
    return {"status": "ok", "model": "loaded"}


@app.get("/dashboard", response_model=DashboardResponse)
def dashboard():
    if _dashboard_cache is None:
        raise HTTPException(status_code=503, detail="Dashboard not yet computed")
    return _dashboard_cache


@app.get("/bias", response_model=BiasResponse)
def bias():
    if _fairness_cache is None:
        raise HTTPException(status_code=503, detail="Fairness audit not yet computed")
    return _fairness_cache


@app.post("/predict", response_model=PredictionResponse)
def predict(applicant: ApplicantInput):
    """
    Main prediction endpoint.
    Accepts applicant financial + demographic data.
    Returns: credit_score, decision, SHAP explanations, feature_importance, counterfactuals (if rejected).
    """
    try:
        m             = model_module.get_model()
        encoders      = model_module.get_encoders()
        feature_names = model_module.get_feature_names()

        # 1. Score + decision
        score, decision, prob, arr = model_module.predict(
            applicant, m, encoders, feature_names
        )

        # 2. SHAP explanation
        feature_importance, explanations = explainer_module.explain(
            arr, feature_names, applicant
        )

        # 3. Counterfactuals (rejected only)
        counterfactuals = None
        if decision == "Rejected":
            counterfactuals = cf_module.get_counterfactuals(applicant, score, prob)

        return PredictionResponse(
            credit_score=score,
            decision=decision,
            explanations=explanations,
            feature_importance=feature_importance,
            counterfactuals=counterfactuals,
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------------------------------
# Auth stubs (demo — no real database)
# -------------------------------------------------------------------

@app.post("/auth/login")
def login(body: dict = Body(...)):
    email = body.get("email", "user@demo.com")
    return {"access_token": "demo-token", "email": email}


@app.post("/auth/signup")
def signup(body: dict = Body(...)):
    email = body.get("email", "user@demo.com")
    return {"access_token": "demo-token", "email": email}


# -------------------------------------------------------------------
# Dev entrypoint
# -------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
