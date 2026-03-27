"""
explainer.py — SHAP-based explanation engine.
Builds a TreeExplainer at startup, then explains each individual prediction.
"""
import shap
import numpy as np

# Module-level SHAP explainer (built once at startup)
_explainer = None

# Human-readable display names for feature columns
FEATURE_DISPLAY_NAMES = {
    "Age":                   "age",
    "Income":                "income",
    "Credit_Score":          "credit_score",
    "Loan_Amount":           "loan_amount",
    "Gender":                "gender",
    "Race":                  "race",
    "Employment_Type":       "employment_type",
    "Education_Level":       "education_level",
    "Citizenship_Status":    "citizenship_status",
    "Language_Proficiency":  "language_proficiency",
    "Disability_Status":     "disability_status",
    "Criminal_Record":       "criminal_record",
    "Zip_Code_Group":        "zip_code_group",
}

# Plain-English templates for top POSITIVE SHAP contributors
POSITIVE_TEMPLATES = {
    "credit_score":       "Your credit score of {score} is a strong positive indicator for loan approval.",
    "income":             "Your annual income demonstrates solid repayment capacity.",
    "employment_type":    "Your employment status positively supports application stability.",
    "education_level":    "Your education level is a favourable factor in the credit assessment.",
    "citizenship_status": "Your citizenship status presents no residency-related risk flags.",
    "age":                "Your age profile falls within a preferred lending demographic.",
    "zip_code_group":     "Your geographic region is associated with lower overall loan risk.",
    "disability_status":  "No additional risk flags were raised from your disability status.",
    "criminal_record":    "A clean criminal record contributes positively to your profile.",
    "loan_amount":        "The loan amount requested is proportionate to your income level.",
    "race":               "No racial bias flags were detected in this evaluation.",
    "language_proficiency": "Language proficiency did not negatively impact your assessment.",
}

# Plain-English templates for top NEGATIVE SHAP contributors
NEGATIVE_TEMPLATES = {
    "credit_score":       "Your credit score is below the minimum threshold, which significantly lowered your rating.",
    "income":             "Your income level raises concerns about repayment capacity relative to the loan size.",
    "loan_amount":        "The loan amount is high relative to your income and credit standing.",
    "employment_type":    "Your employment type introduces income instability — a primary risk factor.",
    "criminal_record":    "A prior criminal record is flagged as a risk factor in this assessment.",
    "zip_code_group":     "Your geographic area carries elevated historical credit risk indicators.",
    "education_level":    "Your education profile contributes marginally negatively to the risk score.",
    "citizenship_status": "Your residency status introduces additional underwriting risk considerations.",
    "age":                "Your age bracket is associated with slightly higher lending risk in this model.",
    "disability_status":  "Your disability status introduced a minor risk flag in the assessment.",
    "race":               "The model may reflect historical disparities — review the fairness report for details.",
    "language_proficiency": "Limited language proficiency is flagged as a minor risk indicator.",
}


def build_explainer(model, X_train_values=None):
    """Build and cache a SHAP TreeExplainer.
    Does NOT use background data to avoid slow interventional SHAP computation.
    """
    global _explainer
    _explainer = shap.TreeExplainer(model)
    return _explainer


def get_explainer():
    return _explainer


def explain(arr: np.ndarray, feature_names: list, applicant=None):
    """
    Compute SHAP values for a single applicant and return:
      - feature_importance: dict mapping display_name → SHAP value
      - explanations: list of plain-English sentences
    """
    if _explainer is None:
        raise RuntimeError("SHAP explainer not initialised. Run build_explainer() first.")

    shap_values = _explainer.shap_values(arr)

    # shap_values shape depends on XGB version:
    # list[2] → binary classification → take index 1 (positive class)
    # or 2D array → take row 0
    if isinstance(shap_values, list):
        sv = shap_values[1][0]
    else:
        sv = shap_values[0]

    display_names = [FEATURE_DISPLAY_NAMES.get(f, f.lower()) for f in feature_names]

    feature_importance = {
        display_names[i]: round(float(sv[i]), 4)
        for i in range(len(feature_names))
    }

    # Sort by absolute SHAP value (most impactful first)
    sorted_features = sorted(feature_importance.items(), key=lambda x: abs(x[1]), reverse=True)

    explanations = []
    pos_count, neg_count = 0, 0

    for feat, val in sorted_features[:10]:
        if val > 0.005 and pos_count < 3:
            tmpl = POSITIVE_TEMPLATES.get(feat)
            if tmpl:
                if feat == "credit_score" and applicant:
                    tmpl = tmpl.format(score=applicant.credit_score_input)
                else:
                    tmpl = tmpl.format(**{})  # no placeholders
                explanations.append(tmpl)
                pos_count += 1

        elif val < -0.005 and neg_count < 3:
            tmpl = NEGATIVE_TEMPLATES.get(feat)
            if tmpl:
                explanations.append(tmpl)
                neg_count += 1

    if not explanations:
        explanations = ["Multiple financial factors were evaluated. The model found insufficient evidence to strongly support approval."]

    return feature_importance, explanations
