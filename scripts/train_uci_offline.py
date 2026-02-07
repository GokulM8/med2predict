"""
Offline training script for the UCI Heart Disease dataset.
- Loads public/data/heart_disease_uci.csv
- Cleans and encodes features
- Stratified train/val/test split (60/20/20)
- Trains Gradient Boosting model (works out-of-the-box without GPU/OMP deps)
- Reports accuracy/ROC-AUC on validation and test sets
- Exports ONNX model to public/model/heart_gb.onnx for browser inference via onnxruntime-web

Prereqs (install in your Python env):
    pip install pandas scikit-learn skl2onnx onnx onnxruntime
Optional (for quicker runs):
    pip install tqdm
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Tuple

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import PolynomialFeatures
from skl2onnx import convert_sklearn, to_onnx
from skl2onnx.common.data_types import FloatTensorType

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "public" / "data" / "heart_disease_uci.csv"
OUTPUT_DIR = ROOT / "public" / "model"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

TARGET_COL = "num"
CATEGORICAL_COLS = ["sex", "cp", "restecg", "slope", "thal"]
BOOLEAN_COLS = ["fbs", "exang"]
NUMERIC_COLS = ["age", "trestbps", "chol", "thalch", "oldpeak", "ca"]
# "dataset" is dropped; id is dropped.


def load_data() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH)
    # Normalize column names
    df.columns = [c.strip() for c in df.columns]
    # Drop unused columns
    df = df.drop(columns=["id", "dataset"], errors="ignore")
    # Clean categorical typos
    df["thal"] = df["thal"].replace({"reversable defect": "reversible defect"})

    # Pre-impute missing values to simplify ONNX export (avoid Imputer ops)
    for col in CATEGORICAL_COLS:
        df[col] = df[col].fillna(df[col].mode().iloc[0])
    for col in BOOLEAN_COLS:
        df[col] = df[col].fillna(False)
    for col in NUMERIC_COLS:
        df[col] = df[col].fillna(df[col].median())

    return df


def split_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.DataFrame, pd.Series]:
    X = df.drop(columns=[TARGET_COL])
    y = (df[TARGET_COL] > 0).astype(int)  # binary label
    # First split train vs temp
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.4, stratify=y, random_state=42
    )
    # Then split temp into val/test (equal halves)
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, stratify=y_temp, random_state=42
    )
    return X_train, X_val, y_train, y_val, X_test, y_test


def build_pipeline() -> Pipeline:
    cat_transformer = Pipeline(
        steps=[
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    num_transformer = Pipeline(
        steps=[
            ("poly", PolynomialFeatures(degree=2, include_bias=False, interaction_only=True)),
            ("scaler", StandardScaler()),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", cat_transformer, CATEGORICAL_COLS),
            ("bool", "passthrough", BOOLEAN_COLS),
            ("num", num_transformer, NUMERIC_COLS),
        ],
        sparse_threshold=0  # Force dense output for ONNX compatibility
    )

    # Ensemble of three strong classifiers
    hist_gb = HistGradientBoostingClassifier(
        max_iter=300,
        learning_rate=0.05,
        max_depth=8,
        min_samples_leaf=5,
        l2_regularization=0.5,
        random_state=42
    )
    
    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42
    )
    
    lr = LogisticRegression(
        C=0.1,
        max_iter=1000,
        random_state=42
    )

    ensemble = VotingClassifier(
        estimators=[
            ('hist_gb', hist_gb),
            ('rf', rf),
            ('lr', lr)
        ],
        voting='soft'
    )

    pipe = Pipeline(
        steps=[
            ("pre", preprocessor),
            ("clf", ensemble),
        ]
    )
    return pipe


def evaluate(model: Pipeline, X, y, name: str) -> None:
    preds = model.predict(X)
    proba = model.predict_proba(X)[:, 1]
    acc = accuracy_score(y, preds)
    auc = roc_auc_score(y, proba)
    print(f"[{name}] Accuracy: {acc:.4f} | ROC-AUC: {auc:.4f}")


def export_onnx(model: Pipeline, sample: pd.DataFrame, output_path: Path) -> None:
    # Ensure compatible dtypes for ONNX conversion
    sample = sample.copy()
    sample[CATEGORICAL_COLS] = sample[CATEGORICAL_COLS].astype(object)
    sample[BOOLEAN_COLS] = sample[BOOLEAN_COLS].astype(float)
    sample[NUMERIC_COLS] = sample[NUMERIC_COLS].astype(float)

    # Extract the final estimator (VotingClassifier needs special handling)
    # For ONNX export, we'll use just the best performing sub-model instead
    # Extract HistGradientBoosting from ensemble which typically performs best
    pre_processor = model.named_steps['pre']
    voting_clf = model.named_steps['clf']
    hist_gb_estimator = voting_clf.named_estimators_['hist_gb']
    
    # Create a simpler pipeline with just preprocessing + hist_gb for ONNX
    simple_pipeline = Pipeline([
        ('pre', pre_processor),
        ('clf', hist_gb_estimator)
    ])

    # Use to_onnx with options to output probabilities as tensor (not map)
    from skl2onnx.common.data_types import FloatTensorType, Int64TensorType
    
    # Use convert_sklearn instead of to_onnx for better control over outputs
    initial_type = [('float_input', FloatTensorType([None, len(sample.columns)]))]
    
    # Convert with zipmap=False to get raw probability tensors
    onnx_model = to_onnx(
        simple_pipeline, 
        sample, 
        target_opset=17,
        options={id(hist_gb_estimator): {'zipmap': False}}
    )
    
    with open(output_path, "wb") as f:
        f.write(onnx_model.SerializeToString())
    print(f"💾 Saved ONNX model (HistGradientBoosting) to {output_path}")


def main() -> None:
    print(f"Loading data from {DATA_PATH}")
    df = load_data()
    X_train, X_val, y_train, y_val, X_test, y_test = split_data(df)

    model = build_pipeline()
    print("Training Gradient Boosting model...")
    model.fit(X_train, y_train)

    evaluate(model, X_train, y_train, "Train")
    evaluate(model, X_val, y_val, "Val")
    evaluate(model, X_test, y_test, "Test")

    # Export ONNX
    output_path = OUTPUT_DIR / "heart_gb.onnx"
    export_onnx(model, X_train.head(1), output_path)

    # Optional detailed report on test set
    preds = model.predict(X_test)
    print("\nClassification report (Test):")
    print(classification_report(y_test, preds, digits=3))


if __name__ == "__main__":
    main()
