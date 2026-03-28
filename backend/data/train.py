"""
train.py — Run once to train XGBoost on Financial_Loan_Access_Dataset.csv
Outputs: model.pkl, encoders.pkl, feature_names.pkl, X_test.csv, y_test.csv
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb
import joblib
import os

DATA_PATH = os.path.join(os.path.dirname(__file__), "Financial_Loan_Access_Dataset.csv")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "artifacts")


def train():
    print("Loading dataset...")
    df = pd.read_csv(DATA_PATH)
    print(f"  Rows: {len(df)}  Columns: {list(df.columns)}")

    # Drop derived / identifier columns
    df = df.drop(columns=["ID", "Age_Group"], errors="ignore")

    # Feature Engineering (LTI)
    df["LTI_Ratio"] = df["Loan_Amount"] / (df["Income"] + 1)

    # Target: 1 = Approved, 0 = Denied/Rejected
    df["target"] = (df["Loan_Approved"] == "Approved").astype(int)
    df = df.drop(columns=["Loan_Approved"])

    # Categorical columns to label-encode
    cat_cols = [
        "Gender", "Race", "Employment_Type", "Education_Level",
        "Citizenship_Status", "Language_Proficiency",
        "Disability_Status", "Criminal_Record", "Zip_Code_Group",
        "Loan_Purpose"
    ]

    encoders = {}
    for col in cat_cols:
        if col in df.columns:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            encoders[col] = le

    feature_cols = [c for c in df.columns if c != "target"]
    X = df[feature_cols]
    y = df["target"]

    print(f"Features ({len(feature_cols)}): {feature_cols}")
    print(f"Class distribution: {y.value_counts().to_dict()}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\nTraining on {len(X_train)} samples, testing on {len(X_test)} samples...")

    pos_weight = (y_train == 0).sum() / (y_train == 1).sum() if (y_train == 1).sum() > 0 else 1.0

    model = xgb.XGBClassifier(
        n_estimators=500,
        max_depth=6,
        learning_rate=0.05,
        subsample=1.0,
        colsample_bytree=1.0,
        min_child_weight=3,
        gamma=0.1,
        scale_pos_weight=pos_weight,
        eval_metric="logloss",
        early_stopping_rounds=30,
        random_state=42,
        verbosity=0,
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=50,
    )

    test_acc = model.score(X_test, y_test)
    print(f"\nTest Accuracy: {test_acc:.4f}")

    # Save artifacts
    joblib.dump(model, os.path.join(OUT_DIR, "model.pkl"))
    joblib.dump(encoders, os.path.join(OUT_DIR, "encoders.pkl"))
    joblib.dump(feature_cols, os.path.join(OUT_DIR, "feature_names.pkl"))
    X_test.to_csv(os.path.join(OUT_DIR, "X_test.csv"), index=False)
    y_test.to_csv(os.path.join(OUT_DIR, "y_test.csv"), index=False)

    print("\n✓ Saved: model.pkl, encoders.pkl, feature_names.pkl, X_test.csv, y_test.csv")
    print("Training complete!")


if __name__ == "__main__":
    train()
