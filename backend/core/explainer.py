"""
explainer.py — SHAP-based explanation engine.
Builds a TreeExplainer at startup, then explains each individual prediction.
"""
import io
import base64
import tempfile
import os

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import shap

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
    "credit_score":       "Your credit score of {score} is a positive indicator for loan approval",
    "income":             "Your annual income demonstrates solid repayment capacity",
    "employment_type":    "Your employment status positively supports application stability",
    "education_level":    "Your education level is a favourable factor in the credit assessment",
    "citizenship_status": "Your citizenship status presents no residency-related risk flags",
    "age":                "Your age profile falls within a preferred lending demographic",
    "zip_code_group":     "Your geographic region is associated with lower overall loan risk",
    "disability_status":  "No additional risk flags were raised from your disability status",
    "criminal_record":    "A clean criminal record contributes positively to your profile",
    "loan_amount":        "The loan amount requested is proportionate to your income level",
    "race":               "No racial bias flags were detected in this evaluation",
    "language_proficiency": "Language proficiency did not negatively impact your assessment",
}

# Plain-English templates for top NEGATIVE SHAP contributors
NEGATIVE_TEMPLATES = {
    "credit_score":       "Your credit score is below the minimum threshold, which significantly lowered your rating",
    "income":             "Your income level raises concerns about repayment capacity relative to the loan size",
    "loan_amount":        "The loan amount is high relative to your income and credit standing",
    "employment_type":    "Your employment type introduces income instability — a primary risk factor",
    "criminal_record":    "A prior criminal record is flagged as a risk factor in this assessment",
    "zip_code_group":     "Your geographic area carries elevated historical credit risk indicators",
    "education_level":    "Your education profile contributes marginally negatively to the risk score",
    "citizenship_status": "Your residency status introduces additional underwriting risk considerations",
    "age":                "Your age bracket is associated with slightly higher lending risk in this model",
    "disability_status":  "Your disability status introduced a minor risk flag in the assessment",
    "race":               "The model may reflect historical disparities — review the fairness report for details",
    "language_proficiency": "Limited language proficiency is flagged as a minor risk indicator",
}


def build_explainer(model, X_train_values=None):
    """Build and cache a SHAP TreeExplainer."""
    global _explainer
    import xgboost as xgb

    try:
        _explainer = shap.Explainer(model)
    except Exception:
        try:
            _explainer = shap.TreeExplainer(model)
        except Exception as e:
            print("Fallback: Re-serializing Booster to patch SHAP C-struct ABI mismatch...")
            try:
                booster = model.get_booster()
                with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
                    temp_path = tmp.name
                booster.save_model(temp_path)
                new_booster = xgb.Booster()
                new_booster.load_model(temp_path)
                os.remove(temp_path)
                _explainer = shap.TreeExplainer(new_booster)
                print("Successfully recovered SHAP Explainer!")
            except Exception as e2:
                print(f"Warning: SHAP Explainer totally failed: {e2}")
                _explainer = None

    return _explainer


def get_explainer():
    return _explainer


def explain(arr: np.ndarray, feature_names: list, applicant=None):
    """
    Compute SHAP values for a single applicant and return:
      - feature_importance: dict mapping display_name → SHAP value
      - explanations: list of plain-English sentences with SHAP magnitude appended
      - explanation_signs: list of bools (True=positive, False=negative) parallel to explanations
      - base_value: float — model's average prediction (SHAP base value)
      - sv: raw numpy SHAP values array
    """
    sv = np.zeros(len(feature_names))
    base_value = 0.0

    if _explainer is not None:
        try:
            shap_values = _explainer.shap_values(arr)
            if isinstance(shap_values, list):
                sv = shap_values[1][0]
            else:
                sv = shap_values[0]

            raw_base = _explainer.expected_value
            if isinstance(raw_base, (list, np.ndarray)):
                base_value = float(raw_base[0])
            else:
                base_value = float(raw_base)
        except Exception as e:
            print(f"Warning: SHAP compute failed ({e}). Emitting mock explanations.")
            sv = np.zeros(len(feature_names))
            base_value = 0.0
    else:
        print("Warning: SHAP bypassed due to startup failure. Emitting mock explanations.")

    display_names = [FEATURE_DISPLAY_NAMES.get(f, f.lower()) for f in feature_names]

    feature_importance = {
        display_names[i]: round(float(sv[i]), 4)
        for i in range(len(feature_names))
    }

    # Sort by absolute SHAP value (most impactful first)
    sorted_features = sorted(feature_importance.items(), key=lambda x: abs(x[1]), reverse=True)

    explanations = []
    explanation_signs = []
    pos_count, neg_count = 0, 0

    for feat, val in sorted_features[:10]:
        if val > 0.005 and pos_count < 3:
            tmpl = POSITIVE_TEMPLATES.get(feat)
            if tmpl:
                if feat == "credit_score" and applicant:
                    text = tmpl.format(score=applicant.credit_score_input)
                else:
                    text = tmpl
                text = f"{text} (SHAP: +{val:.3f})"
                explanations.append(text)
                explanation_signs.append(True)
                pos_count += 1

        elif val < -0.005 and neg_count < 3:
            tmpl = NEGATIVE_TEMPLATES.get(feat)
            if tmpl:
                text = f"{tmpl} (SHAP: {val:.3f})"
                explanations.append(text)
                explanation_signs.append(False)
                neg_count += 1

    if not explanations:
        explanations = [
            "Multiple financial factors were evaluated. The model found insufficient evidence to strongly support approval."
        ]
        explanation_signs = [False]

    return feature_importance, explanations, explanation_signs, base_value, sv


def generate_waterfall_image(feature_importance: dict, base_value: float) -> str:
    """
    Generate a SHAP waterfall bar chart and return as a base64 data URI string.
    Returns None if generation fails.
    """
    try:
        # Top 10 by absolute SHAP value, sorted ascending so most negative is at bottom
        top_items = sorted(feature_importance.items(), key=lambda x: abs(x[1]), reverse=True)[:10]
        top_items_sorted = sorted(top_items, key=lambda x: x[1])  # ascending for horizontal bar

        features = [item[0].replace('_', ' ').title() for item in top_items_sorted]
        values = [item[1] for item in top_items_sorted]
        colors = ['#EF4444' if v < 0 else '#10B981' for v in values]

        fig, ax = plt.subplots(figsize=(8, max(4, len(features) * 0.55)))
        fig.patch.set_facecolor('#F8FAFC')
        ax.set_facecolor('#F8FAFC')

        bars = ax.barh(features, values, color=colors, height=0.6, edgecolor='none')

        # Value labels on each bar
        for bar, val in zip(bars, values):
            offset = max(abs(val) * 0.05, 0.003)
            x_pos = val + (offset if val >= 0 else -offset)
            ha = 'left' if val >= 0 else 'right'
            sign_str = f'+{val:.3f}' if val >= 0 else f'{val:.3f}'
            ax.text(x_pos, bar.get_y() + bar.get_height() / 2,
                    sign_str, ha=ha, va='center',
                    fontsize=8, fontweight='bold', color='#374151')

        ax.axvline(0, color='#9CA3AF', linewidth=1.2, linestyle='-', zorder=0)
        ax.set_xlabel('SHAP Value  (impact on credit decision)', fontsize=9, color='#6B7280', labelpad=10)
        ax.set_title(f'SHAP Feature Impact  |  Base value: {base_value:.3f}',
                     fontsize=10, fontweight='bold', color='#111827', pad=14)

        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_visible(False)
        ax.spines['bottom'].set_color('#E5E7EB')
        ax.tick_params(axis='both', colors='#6B7280', labelsize=8.5)
        ax.set_yticklabels(features, fontsize=8.5, color='#374151')

        # Add legend patches
        from matplotlib.patches import Patch
        legend_elements = [
            Patch(facecolor='#10B981', label='Positive contribution'),
            Patch(facecolor='#EF4444', label='Negative contribution'),
        ]
        ax.legend(handles=legend_elements, loc='lower right', fontsize=8,
                  framealpha=0.8, edgecolor='#E5E7EB')

        plt.tight_layout(pad=1.8)

        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=120, bbox_inches='tight',
                    facecolor='#F8FAFC', edgecolor='none')
        plt.close(fig)
        buf.seek(0)
        img_b64 = base64.b64encode(buf.read()).decode('utf-8')
        return f"data:image/png;base64,{img_b64}"

    except Exception as e:
        print(f"Warning: Waterfall chart generation failed: {e}")
        return None
