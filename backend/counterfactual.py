"""
counterfactual.py — Rule-based counterfactual engine.
For rejected applicants, suggests the minimum realistic changes to flip the decision.
"""
from typing import List


def get_counterfactuals(applicant, score: int, prob: float) -> List[str]:
    """
    Analyse the applicant's data and return 2–3 actionable improvement suggestions.
    Only called for 'Rejected' decisions.
    """
    suggestions = []

    # 1. Credit score gap
    if applicant.credit_score_input < 580:
        gap = 580 - applicant.credit_score_input
        suggestions.append(
            f"Improve your credit score by at least {gap} points (current: {applicant.credit_score_input}, target: 580+). "
            "Pay down existing credit card balances and ensure all bill payments are on time for 6+ months."
        )
    elif applicant.credit_score_input < 660:
        gap = 660 - applicant.credit_score_input
        suggestions.append(
            f"Raising your credit score by {gap} more points (to 660+) would move you into the 'Review' tier. "
            "Avoid new hard inquiries and reduce your credit utilisation below 30%."
        )

    # 2. Loan-to-income ratio
    if applicant.income > 0:
        lti = applicant.loan_amount / applicant.income
        if lti > 4.0:
            suggested_amount = int(applicant.income * 3.5)
            reduction = int(applicant.loan_amount - suggested_amount)
            suggestions.append(
                f"Reduce the requested loan amount by ${reduction:,} "
                f"(from ${int(applicant.loan_amount):,} to ${suggested_amount:,}). "
                "A loan-to-income ratio below 3.5× significantly improves approval chances."
            )
        elif lti > 3.0:
            suggestions.append(
                f"Your loan-to-income ratio is {lti:.1f}×. Increasing your declared income (e.g. by adding a co-applicant) "
                "or reducing the loan by 15–20% would help."
            )

    # 3. Existing debt-to-income ratio
    if applicant.existing_debt and applicant.income > 0:
        dti = applicant.existing_debt / applicant.income
        if dti > 0.43:
            suggestions.append(
                f"Your debt-to-income ratio ({dti:.0%}) exceeds the 43% danger threshold. "
                f"Paying down ${int(applicant.existing_debt * 0.3):,} in existing debt before reapplying would lower this to an acceptable range."
            )

    # 4. Employment type
    if applicant.employment_type in ["Unemployed", "Gig"]:
        suggestions.append(
            "Securing stable full-time employment before reapplying would be the single highest-impact change. "
            "Lenders require proof of consistent income for 6+ months."
        )
    elif applicant.employment_type == "Part-time":
        suggestions.append(
            "Transitioning from part-time to full-time employment, or providing documentation of additional income sources, "
            "would significantly strengthen your application."
        )

    # 5. Generic fallback
    if not suggestions:
        pts_needed = max(50, 660 - applicant.credit_score_input)
        suggestions.append(
            f"Your profile is close to the approval threshold (probability: {prob:.0%}). "
            f"Increasing your credit score by {pts_needed}+ points and maintaining 6 months of stable employment "
            "would very likely result in approval on reapplication."
        )

    return suggestions[:3]
