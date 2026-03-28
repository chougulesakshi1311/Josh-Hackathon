"""
Pydantic schemas for all API input/output contracts.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any


class ApplicantInput(BaseModel):
    # --- Core financial ---
    age: int = Field(..., ge=18, le=100, description="Applicant age")
    income: float = Field(..., gt=0, description="Annual gross income in USD")
    loan_amount: float = Field(..., gt=0, description="Requested loan amount in USD")
    credit_score_input: Optional[int] = Field(None, ge=300, le=850, description="Applicant's current credit score (optional — estimated if not provided)")

    # --- Employment & education ---
    employment_type: str = Field(..., description="Full-time | Part-time | Self-employed | Unemployed | Gig")
    education_level: str = Field(..., description="High School | Some College | Bachelor's | Graduate")

    # --- Demographics (used for fairness audit, not for discriminatory decisions) ---
    gender: str = Field(..., description="Male | Female | Non-binary")
    race: str = Field(..., description="White | Black | Hispanic | Asian | Native American | Multiracial")
    citizenship_status: str = Field(..., description="Citizen | Permanent Resident | Visa Holder")

    # --- Risk flags ---
    criminal_record: bool = Field(..., description="Does the applicant have a criminal record?")
    disability_status: bool = Field(..., description="Does the applicant have a disability?")

# --- Location & Other ---
    zip_code_group: str = Field(..., description="Urban Professional | High-income Suburban | Working Class Urban | Rural | Historically Redlined")
    loan_purpose: str = Field("Other", description="Home | Auto | Business | Education | Medical | Other")

    # --- Optional fields ---
    existing_debt: Optional[float] = Field(None, description="Total existing outstanding debt")
    language: str = Field("en", description="UI language: en | hi | ta | te | mr")


class PredictionResponse(BaseModel):
    credit_score: int
    decision: str               # "Approved" | "Review" | "Rejected"
    explanations: List[str]
    feature_importance: Dict[str, float]
    counterfactuals: Optional[List[str]] = None
    shap_waterfall_image: Optional[str] = None
    base_value: Optional[float] = None
    explanation_signs: Optional[List[bool]] = None
    nl_explanation: Optional[str] = None       # Groq plain-language decision explanation
    path_forward: Optional[str] = None         # Groq advice (all decisions)
    path_forward_title: Optional[str] = None   # Title varies by decision + language


class BiasResponse(BaseModel):
    fairness_score: float
    gender: Dict[str, Dict[str, int]]
    income_groups: List[Dict[str, Any]]
    demographic_parity_diff: Optional[float] = None
    equalized_odds_diff: Optional[float] = None


class DashboardResponse(BaseModel):
    total_applications: int
    approval_rate: float
    rejection_rate: float
    review_rate: float
    avg_credit_score: float
