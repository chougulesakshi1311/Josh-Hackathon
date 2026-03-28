"""
groq_explainer.py — Plain-language explanation generator using Groq LLM.
Converts SHAP values into human-readable explanations in the user's language.
"""
import os
from groq import Groq

_client = None

FEATURE_LABELS = {
    "income": "annual income",
    "credit_score_input": "credit history score",
    "loan_amount": "loan amount requested",
    "existing_debt": "existing debt",
    "employment_type": "employment type",
    "education_level": "education level",
    "lti_ratio": "loan-to-income ratio",
    "dti_ratio": "debt-to-income ratio",
    "zip_code_group": "location type",
    "loan_purpose": "loan purpose",
    "age": "age",
    "gender": "gender",
    "race": "race / ethnicity",
    "criminal_record": "criminal record",
    "disability": "disability status",
}

def _readable(feat: str) -> str:
    return FEATURE_LABELS.get(feat, feat.replace("_", " "))

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "ta": "Tamil",
    "te": "Telugu",
    "mr": "Marathi",
}

PATH_FORWARD_TITLES = {
    "Approved": {
        "en": "How to Keep Your Score Strong",
        "hi": "अपना स्कोर मजबूत कैसे रखें",
        "ta": "உங்கள் மதிப்பெண்ணை வலுவாக வைத்திருப்பது எப்படி",
        "te": "మీ స్కోర్‌ను బలంగా ఉంచుకోవడం ఎలా",
        "mr": "तुमचा स्कोर मजबूत कसा ठेवाल",
    },
    "Review": {
        "en": "What to Watch Out For",
        "hi": "किन बातों का ध्यान रखें",
        "ta": "எதை கவனிக்க வேண்டும்",
        "te": "దేన్ని జాగ్రత్తగా గమనించాలి",
        "mr": "कशाकडे लक्ष द्यावे",
    },
    "Rejected": {
        "en": "Your Path to Approval",
        "hi": "स्वीकृति की आपकी राह",
        "ta": "ஒப்புதலுக்கான உங்கள் பாதை",
        "te": "ఆమోదానికి మీ మార్గం",
        "mr": "मंजुरीसाठी तुमचा मार्ग",
    },
}


def _get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not set in environment")
        _client = Groq(api_key=api_key)
    return _client


def generate_nl_explanation(applicant, feature_importance: dict, decision: str, score: int, language: str = "en") -> str | None:
    """
    Generate a plain-language explanation of the credit decision.
    Replaces SHAP technical output with a friendly paragraph.
    """
    lang_name = LANGUAGE_NAMES.get(language, "English")

    top_positive = sorted([(f, v) for f, v in feature_importance.items() if v > 0], key=lambda x: -x[1])[:3]
    top_negative = sorted([(f, v) for f, v in feature_importance.items() if v < 0], key=lambda x: x[1])[:3]

    pos_text = ", ".join(_readable(f[0]) for f in top_positive) or "none"
    neg_text = ", ".join(_readable(f[0]) for f in top_negative) or "none"

    credit_note = f"submitted credit score: {applicant.credit_score_input}" if applicant.credit_score_input else "no prior credit score provided (estimated)"

    try:
        response = _get_client().chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"You are a financial assistant. "
                        f"You MUST respond ENTIRELY in {lang_name}. "
                        f"Do NOT use any other language. "
                        f"Do NOT greet the user. Do NOT add any introduction or closing line. "
                        f"Output only the explanation itself."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Explain this loan decision in exactly 2-3 simple sentences "
                        f"to someone with no financial background.\n\n"
                        f"Decision: {decision} | Credit Score: {score}/850\n"
                        f"Income: Rs.{applicant.income:,.0f} | Loan: Rs.{applicant.loan_amount:,.0f}\n"
                        f"Employment: {applicant.employment_type} | {credit_note}\n"
                        f"Positive factors: {pos_text}\n"
                        f"Negative factors: {neg_text}\n\n"
                        f"RULES:\n"
                        f"- Start DIRECTLY with the explanation — no greeting, no 'Sure!', no preamble\n"
                        f"- Exactly 2-3 sentences. Nothing more.\n"
                        f"- No technical terms (no algorithm, no ratio names, no probability)\n"
                        f"- Warm, empathetic, everyday language\n"
                        f"- ENTIRE response in {lang_name} only"
                    ),
                },
            ],
            max_tokens=180,
            temperature=0.2,
        )
        raw = response.choices[0].message.content.strip()
        # Strip leading greeting lines (short lines with no financial keywords)
        financial_keywords = {'loan', 'credit', 'score', 'income', 'application', 'approved',
                              'rejected', 'review', 'decision', 'payment', 'debt', 'employment'}
        lines = raw.split('\n')
        while lines and len(lines[0].strip()) < 50 and not any(
            kw in lines[0].lower() for kw in financial_keywords
        ):
            lines = lines[1:]
        return '\n'.join(lines).strip() or raw
    except Exception as e:
        print(f"  Groq explanation failed: {e}")
        return None


def generate_path_forward(applicant, feature_importance: dict, decision: str, score: int, language: str = "en") -> str | None:
    """
    Generate personalised advice for all decision types:
    - Approved → how to keep score strong
    - Review → what to fix before resubmission
    - Rejected → actionable steps to improve
    """
    lang_name = LANGUAGE_NAMES.get(language, "English")

    top_negative = sorted([(f, v) for f, v in feature_importance.items() if v < 0], key=lambda x: x[1])[:3]
    top_positive = sorted([(f, v) for f, v in feature_importance.items() if v > 0], key=lambda x: -x[1])[:3]

    neg_text = ", ".join(_readable(f[0]) for f in top_negative) or "none"
    pos_text = ", ".join(_readable(f[0]) for f in top_positive) or "none"

    if decision == "Approved":
        instruction = (
            "The applicant was APPROVED. Give 3 short, friendly tips to help them maintain their financial health, "
            "keep their loan repayments on track, and protect their credit standing. Mention the positive factors briefly."
        )
    elif decision == "Review":
        instruction = (
            "The application is under MANUAL REVIEW — it's borderline. Give 3 specific things the applicant should "
            "address to strengthen their case. Be honest but encouraging. Mention the risk areas."
        )
    else:
        instruction = (
            "The applicant was REJECTED. Give 3 specific, actionable steps they can take to improve their chances "
            "when they reapply. Use real numbers where possible (e.g. 'reduce your loan by 20%'). Be empathetic."
        )

    try:
        response = _get_client().chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"You are a financial advisor. "
                        f"You MUST respond ENTIRELY in {lang_name}. "
                        f"Do NOT use any other language under any circumstances. "
                        f"Do NOT greet, do NOT add any introduction, heading, or closing. "
                        f"Output only the 3 numbered points and nothing else."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Decision: {decision} | Score: {score}/850\n"
                        f"Income: Rs.{applicant.income:,.0f} | Loan: Rs.{applicant.loan_amount:,.0f}\n"
                        f"Employment: {applicant.employment_type}\n"
                        f"Strong areas: {pos_text}\n"
                        f"Weak areas: {neg_text}\n\n"
                        f"{instruction}\n\n"
                        f"OUTPUT FORMAT — follow exactly, no deviations:\n"
                        f"1. [advice in one sentence]\n"
                        f"2. [advice in one sentence]\n"
                        f"3. [advice in one sentence]\n\n"
                        f"STRICT RULES:\n"
                        f"- Begin your response with '1.' — absolutely no text before it\n"
                        f"- Exactly 3 points, no sub-bullets, no extra lines\n"
                        f"- Each point: 1-2 sentences maximum\n"
                        f"- No technical terms\n"
                        f"- ENTIRE response in {lang_name} only"
                    ),
                },
            ],
            max_tokens=280,
            temperature=0.2,
        )
        raw = response.choices[0].message.content.strip()
        # Strip any preamble before the first numbered point
        import re
        match = re.search(r'(1\.\s)', raw)
        return raw[match.start():] if match else raw
    except Exception as e:
        print(f"  Groq path_forward failed: {e}")
        return None


def get_path_forward_title(decision: str, language: str = "en") -> str:
    titles = PATH_FORWARD_TITLES.get(decision, PATH_FORWARD_TITLES["Approved"])
    return titles.get(language, titles["en"])
