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
    credit_score_input: int = Field(..., ge=300, le=850, description="Applicant's current credit score")

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

    # --- Optional (used for explanation text only) ---
    existing_debt: Optional[float] = Field(None, description="Total existing outstanding debt in USD")


class PredictionResponse(BaseModel):
    credit_score: int
    decision: str               # "Approved" | "Review" | "Rejected"
    explanations: List[str]
    feature_importance: Dict[str, float]
    counterfactuals: Optional[List[str]] = None  # Only populated for "Rejected"


class BiasResponse(BaseModel):
    fairness_score: float
    gender: Dict[str, Dict[str, int]]
    income_groups: List[Dict[str, Any]]


class DashboardResponse(BaseModel):
    total_applications: int
    approval_rate: float
    rejection_rate: float
    review_rate: float
    avg_credit_score: float
