#!/usr/bin/env python3
"""
Train XGBoost model on UCI Heart Disease dataset and export to ONNX format.
Install dependencies: pip install xgboost sklearn-onnx onnx pandas scikit-learn
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb
import skl2onnx
from skl2onnx.common.data_types import FloatTensorType
import onnx

# Load UCI Heart Disease dataset
print("Loading UCI Heart Disease dataset...")
url = "https://raw.githubusercontent.com/uci-ml-repo/uci-ml-repo.github.io/master/datasets/heart_disease/heart_disease.csv"

try:
    df = pd.read_csv(url)
except:
    print("Error: Could not download dataset. Using local path...")
    df = pd.read_csv('public/data/heart_disease_uci.csv')

print(f"Dataset shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")

# Prepare data - map to our application's field names
# UCI dataset format: age, sex, cp (chest pain), trestbps (resting BP), chol (cholesterol),
# fbs (fasting blood sugar), restecg, thalch (max heart rate), exang (exercise angina),
# oldpeak (ST depression), slope, ca, thal, num (target: heart disease presence)

feature_mapping = {
    'age': 'age',
    'sex': 'sex',
    'cp': 'chestPainType',
    'trestbps': 'restingBP',
    'chol': 'cholesterol',
    'fbs': 'fastingBloodSugar',
    'restecg': 'restingECG',
    'thalch': 'maxHeartRate',
    'exang': 'exerciseAngina',
    'oldpeak': 'stDepression',
    'slope': 'stSlope',
}

# Use only the features we have in the app
features_to_use = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalch', 'exang', 'oldpeak', 'slope']
X = df[features_to_use].copy()
y = (df['num'] > 0).astype(int)  # Binary: disease present (1) or not (0)

print(f"\nFeatures shape: {X.shape}")
print(f"Target distribution: {y.value_counts().to_dict()}")

# Handle missing values
X = X.fillna(X.mean())

# Encode categorical features
le_sex = LabelEncoder()
le_cp = LabelEncoder()
le_restecg = LabelEncoder()
le_slope = LabelEncoder()

X['sex'] = le_sex.fit_transform(X['sex'].astype(str))
X['cp'] = le_cp.fit_transform(X['cp'].astype(str))
X['restecg'] = le_restecg.fit_transform(X['restecg'].astype(str))
X['slope'] = le_slope.fit_transform(X['slope'].astype(str))

print(f"\nProcessed features:\n{X.head()}")

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print(f"\nTraining set size: {X_train.shape}")
print(f"Test set size: {X_test.shape}")

# Train XGBoost model
print("\nTraining XGBoost model...")
model = xgb.XGBClassifier(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    use_label_encoder=False,
    eval_metric='logloss',
)

model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=False,
)

# Evaluate
train_score = model.score(X_train, y_train)
test_score = model.score(X_test, y_test)
print(f"Training accuracy: {train_score:.4f}")
print(f"Test accuracy: {test_score:.4f}")

# Feature importance
feature_importance = pd.DataFrame({
    'feature': features_to_use,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print("\nFeature Importance:")
print(feature_importance)

# Convert to ONNX format
print("\nConverting to ONNX format...")
initial_type = [('float_input', FloatTensorType([None, len(features_to_use)]))]

onnx_model = skl2onnx.convert_sklearn(model, initial_types=initial_type, target_opset=12)

# Save ONNX model
output_path = 'public/models/heart_disease_model.onnx'
try:
    import os
    os.makedirs('public/models', exist_ok=True)
    with open(output_path, 'wb') as f:
        f.write(onnx_model.SerializeToString())
    print(f"✅ Model saved to: {output_path}")
except Exception as e:
    print(f"❌ Error saving model: {e}")

# Save feature names for reference
import json
feature_config = {
    'features': features_to_use,
    'feature_importance': feature_importance.to_dict('records'),
    'accuracy': {
        'train': float(train_score),
        'test': float(test_score),
    },
    'model_version': 'v3.0-xgboost-onnx',
}

config_path = 'public/models/model_config.json'
with open(config_path, 'w') as f:
    json.dump(feature_config, f, indent=2)
print(f"✅ Config saved to: {config_path}")

print("\n✅ Model training complete!")
print("Next: Copy the ONNX model to public/models/ and update riskCalculator.ts to use it.")
