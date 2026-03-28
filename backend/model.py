"""
model.py — Load trained model, preprocess applicant input, run predictions.
"""
import joblib
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).parent

# Module-level singletons loaded at server startup
_model = None
_encoders = None
_feature_names = None


def load_model():
    global _model, _encoders, _feature_names
    _model = joblib.load(BASE_DIR / "model.pkl")
    _encoders = joblib.load(BASE_DIR / "encoders.pkl")
    _feature_names = joblib.load(BASE_DIR / "feature_names.pkl")
    return _model


def get_model():
    return _model


def get_encoders():
    return _encoders


def get_feature_names():
    return _feature_names


def _encode_value(col: str, value: str, encoders: dict) -> int:
    """Safely encode a categorical value using the trained LabelEncoder."""
    le = encoders.get(col)
    if le is None:
        return 0
    try:
        return int(le.transform([str(value)])[0])
    except ValueError:
        # Unseen label — return the most common class index (0)
        return 0


def preprocess(applicant, encoders: dict, feature_names: list) -> np.ndarray:
    """
    Convert an ApplicantInput Pydantic object into a model-ready numpy array.
    Column order must match feature_names saved during training.
    """
    disability_str = "Yes" if applicant.disability_status else "No"
    criminal_str = "Yes" if applicant.criminal_record else "No"

    lti_ratio = applicant.loan_amount / (applicant.income + 1)

    raw = {
        "LTI_Ratio": lti_ratio,
        "Age":                _encode_free("Age",                applicant.age,               encoders),
        "Income":             applicant.income,
        "Credit_Score":       applicant.credit_score_input,
        "Loan_Amount":        applicant.loan_amount,
        "Gender":             _encode_value("Gender",             applicant.gender,             encoders),
        "Race":               _encode_value("Race",               applicant.race,               encoders),
        "Employment_Type":    _encode_value("Employment_Type",    applicant.employment_type,    encoders),
        "Education_Level":    _encode_value("Education_Level",    applicant.education_level,    encoders),
        "Citizenship_Status": _encode_value("Citizenship_Status", applicant.citizenship_status, encoders),
        "Language_Proficiency": _encode_value("Language_Proficiency", "Fluent",               encoders),
        "Disability_Status":  _encode_value("Disability_Status",  disability_str,              encoders),
        "Criminal_Record":    _encode_value("Criminal_Record",    criminal_str,                encoders),
        "Zip_Code_Group":     _encode_value("Zip_Code_Group",     applicant.zip_code_group,    encoders),
        "Loan_Purpose":       _encode_value("Loan_Purpose",       applicant.loan_purpose,      encoders),
    }

    row = [raw.get(f, 0) for f in feature_names]
    return np.array(row, dtype=float).reshape(1, -1)


def _encode_free(col: str, value, encoders: dict):
    """Numeric columns are passed through; categorical ones are encoded."""
    if col in encoders:
        return _encode_value(col, str(value), encoders)
    return value


def predict(applicant, model=None, encoders=None, feature_names=None):
    """
    Returns: (credit_score: int, decision: str, probability: float, arr: np.ndarray)
    """
    if model is None:
        model = _model
    if encoders is None:
        encoders = _encoders
    if feature_names is None:
        feature_names = _feature_names

    arr = preprocess(applicant, encoders, feature_names)
    prob = float(model.predict_proba(arr)[0][1])   # probability of "Approved"

    # Map probability → credit score band 300–850
    score = int(300 + prob * 550)
    score = max(300, min(850, score))

    # Decision thresholds — calibrated to model's probability distribution
    # Model probs range ~0.11–0.76, actual approval rate ~43%
    if prob >= 0.48:
        decision = "Approved"
    elif prob >= 0.35:
        decision = "Review"
    else:
        decision = "Rejected"

    return score, decision, prob, arr

