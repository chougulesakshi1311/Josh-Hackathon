"""
counterfactual.py — SHAP-aware counterfactual engine.
For rejected applicants, identifies the top negative SHAP contributors
and generates targeted, actionable improvement suggestions.
"""
from typing import List, Optional, Dict


# Features the applicant CANNOT change — skip when generating suggestions
_NON_ACTIONABLE = {"race", "gender", "age", "disability_status", "citizenship_status", "language_proficiency"}


def _advice_for_feature(feat: str, val: float, applicant) -> Optional[str]:
    """Return a targeted suggestion for a specific negative SHAP feature."""
    abs_val = abs(val)

    if feat == "credit_score":
        current = applicant.credit_score_input
        target = 580 if current < 560 else 660
        gap = target - current
        return (
            f"Improve your credit score by at least {gap} points (current: {current}, target: {target}+) — "
            f"this is your highest-impact change (SHAP drag: {val:.3f}). "
            "Pay down revolving balances and ensure 6+ months of on-time payments."
        )

    if feat in ("income", "loan_amount"):
        if applicant.income > 0:
            lti = applicant.loan_amount / applicant.income
            if lti > 3.0:
                suggested = int(applicant.income * 3.0)
                reduction = int(applicant.loan_amount - suggested)
                return (
                    f"Reduce the requested loan amount by ₹{reduction:,} "
                    f"(from ₹{int(applicant.loan_amount):,} to ₹{suggested:,}). "
                    f"Your loan-to-income ratio of {lti:.1f}× is a key drag on this decision (SHAP: {val:.3f})."
                )
            else:
                return (
                    f"Income relative to loan size is flagged (SHAP: {val:.3f}). "
                    "Adding a co-applicant with verifiable income or reducing the loan by 15–20% would help."
                )

    if feat == "employment_type":
        emp = applicant.employment_type
        if emp in ("Unemployed", "Gig"):
            return (
                f"Employment instability is the primary risk factor in this decision (SHAP drag: {val:.3f}). "
                "Securing stable full-time employment for 6+ months before reapplying would be the single highest-impact change."
            )
        elif emp == "Part-time":
            return (
                f"Part-time employment is flagged as an income-instability risk (SHAP: {val:.3f}). "
                "Transitioning to full-time, or documenting consistent additional income, would significantly strengthen your application."
            )
        else:
            return (
                f"Your employment category is weighing on this decision (SHAP: {val:.3f}). "
                "Providing additional proof of income stability (contracts, pay stubs) may help."
            )

    if feat == "criminal_record" and applicant.criminal_record:
        return (
            f"A criminal record is flagged as a risk factor (SHAP drag: {val:.3f}). "
            "While this cannot be changed, strengthening all other factors — especially credit score and income stability — "
            "can offset this impact. Consider applying for a smaller loan amount first."
        )

    if feat == "zip_code_group":
        return (
            f"Your geographic region is associated with elevated risk in the model (SHAP: {val:.3f}). "
            "Applying with a co-applicant from a lower-risk area or providing additional collateral may help."
        )

    if feat == "education_level":
        return (
            f"Education level is a minor drag (SHAP: {val:.3f}). "
            "While you cannot change this immediately, completing a degree or certification program "
            "would improve your profile on future applications."
        )

    return None


def get_counterfactuals(
    applicant,
    score: int,
    prob: float,
    feature_importance: Optional[Dict[str, float]] = None,
) -> List[str]:
    """
    Return 2–3 actionable improvement suggestions for a rejected applicant.

    If feature_importance (SHAP values dict) is provided, suggestions are
    targeted at the actual top-negative contributors from the model.
    Falls back to rule-based heuristics if SHAP data is unavailable.
    """
    suggestions = []

    # --- SHAP-aware path ---
    if feature_importance:
        # Rank features by most negative SHAP value (excluding non-actionable)
        neg_features = sorted(
            [(f, v) for f, v in feature_importance.items()
             if v < -0.01 and f not in _NON_ACTIONABLE],
            key=lambda x: x[1],  # most negative first
        )

        for feat, val in neg_features:
            advice = _advice_for_feature(feat, val, applicant)
            if advice:
                suggestions.append(advice)
            if len(suggestions) >= 3:
                break

    # --- Rule-based fallback (or supplement if SHAP gave fewer than 2) ---
    if len(suggestions) < 2:
        # Credit score gap
        if applicant.credit_score_input < 580:
            gap = 580 - applicant.credit_score_input
            s = (
                f"Improve your credit score by at least {gap} points "
                f"(current: {applicant.credit_score_input}, target: 580+). "
                "Pay down existing credit card balances and ensure all bill payments are on time for 6+ months."
            )
            if s not in suggestions:
                suggestions.append(s)

        # Loan-to-income ratio
        if applicant.income > 0:
            lti = applicant.loan_amount / applicant.income
            if lti > 4.0:
                suggested_amount = int(applicant.income * 3.5)
                reduction = int(applicant.loan_amount - suggested_amount)
                s = (
                    f"Reduce the requested loan amount by ₹{reduction:,} "
                    f"(from ₹{int(applicant.loan_amount):,} to ₹{suggested_amount:,}). "
                    "A loan-to-income ratio below 3.5× significantly improves approval chances."
                )
                if s not in suggestions:
                    suggestions.append(s)

        # Debt-to-income ratio
        if applicant.existing_debt and applicant.income > 0:
            dti = applicant.existing_debt / applicant.income
            if dti > 0.43:
                s = (
                    f"Your debt-to-income ratio ({dti:.0%}) exceeds the 43% threshold. "
                    f"Paying down ₹{int(applicant.existing_debt * 0.3):,} in existing debt before reapplying "
                    "would lower this to an acceptable range."
                )
                if s not in suggestions:
                    suggestions.append(s)

        # Employment
        if applicant.employment_type in ("Unemployed", "Gig"):
            s = (
                "Securing stable full-time employment before reapplying would be the single highest-impact change. "
                "Lenders require proof of consistent income for 6+ months."
            )
            if s not in suggestions:
                suggestions.append(s)

    # --- Generic fallback if still empty ---
    if not suggestions:
        pts_needed = max(50, 660 - applicant.credit_score_input)
        suggestions.append(
            f"Your profile is close to the approval threshold (probability: {prob:.0%}). "
            f"Increasing your credit score by {pts_needed}+ points and maintaining 6 months of stable employment "
            "would very likely result in approval on reapplication."
        )

    return suggestions[:3]
