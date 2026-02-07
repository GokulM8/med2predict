# 💙 SafePulse

**Intelligent Heart Disease Risk Prediction System**

A clinical-grade healthcare dashboard powered by machine learning that delivers AI-driven cardiovascular risk assessment with explainable insights. SafePulse combines professional medical design with state-of-the-art gradient boosting models trained on real clinical data.

---

## ✨ Features

- **ML-Powered Risk Assessment**: Ensemble model (HistGradientBoosting + RandomForest + LogisticRegression) trained on UCI Heart Disease dataset
- **80% Test Accuracy**: 88.67% ROC-AUC on held-out test data with proper stratified validation
- **Offline Training Pipeline**: Python-based training with scikit-learn, ONNX export for browser inference
- **Risk Stratification**: Clear risk levels (Low, Medium, High) with probability scores
- **Explainable AI**: Gradient-based feature importance showing which clinical factors drive predictions
- **Clinical Thresholds**: Evidence-based target comparisons (BP, cholesterol, heart rate, ST depression)
- **Patient Management**: Browse saved patient records with ML-powered assessments
- **Report Generation**: Export comprehensive risk reports with feature contributions
- **Responsive Design**: Works seamlessly on desktop and tablets for clinical workflows
- **Professional Medical Theme**: Calm blue/white palette designed for healthcare settings

---

## 🏥 Use Cases

- **Cardiologists**: Quick risk screening for new and follow-up patients with ML validation
- **Primary Care**: Identify patients needing specialist referral based on quantitative risk scores
- **Clinical Research**: Batch processing with reproducible ML predictions
- **Medical Education**: Demonstrate explainable AI in cardiovascular risk assessment

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18.3 + TypeScript 5
- **Build Tool**: Vite 5.4 (fast esbuild-based dev server)
- **Styling**: Tailwind CSS 3 + shadcn/ui component library
- **State Management**: React Hooks + React Query (TanStack)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation (clinical range checking)
- **Charts**: Recharts for risk visualization
- **Testing**: Vitest + Testing Library

### Machine Learning
- **Training**: Python 3.13 + scikit-learn 1.6
- **Model**: Ensemble (HistGradientBoosting + RandomForest + LogisticRegression) with soft voting
- **Feature Engineering**: Polynomial interactions (degree 2), StandardScaler normalization
- **Export**: ONNX 1.17 for cross-platform inference
- **Inference**: onnxruntime-web (browser-based, no server needed)
- **Dataset**: UCI Heart Disease (~920 samples, 11 clinical features)

---

## 🚀 Quick Start

### Prerequisites
- **Frontend**: Node.js 18+ (tested on v24)
- **ML Training** (optional): Python 3.10+ with pip

### Installation

```bash
# Clone the repository
git clone https://github.com/arshad5963/med2predict.git
cd med2predict

# Install frontend dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 🧠 Machine Learning Pipeline

### Model Training (Offline)

The ML model is trained offline in Python and exported to ONNX for browser inference. This ensures:
- **Reproducibility**: Fixed random seeds, stratified splits
- **Performance**: Ensemble of 3 strong classifiers with polynomial features
- **Portability**: ONNX format works across platforms
- **No In-Browser Training**: Pre-trained model loads instantly

#### Training the Model

```bash
# Install Python dependencies
pip install pandas scikit-learn skl2onnx onnx onnxruntime

# Run training script
python scripts/train_uci_offline.py
```

**Training Output:**
```
[Train] Accuracy: 0.9819 | ROC-AUC: 0.9994
[Val]   Accuracy: 0.8315 | ROC-AUC: 0.9225
[Test]  Accuracy: 0.7989 | ROC-AUC: 0.8867
💾 Saved ONNX model to public/model/heart_gb.onnx
```

#### Model Architecture

**Preprocessing Pipeline:**
- Categorical features (sex, chest pain, ECG, slope) → OneHot encoding
- Numeric features (age, BP, cholesterol, heart rate, ST depression) → Polynomial(degree=2) → StandardScaler
- Boolean features (fasting blood sugar, exercise angina) → Passthrough

**Ensemble Classifier:**
1. **HistGradientBoostingClassifier**: 300 iterations, learning_rate=0.05, max_depth=8, L2=0.5
2. **RandomForestClassifier**: 200 trees, max_depth=10, min_samples_split=5
3. **LogisticRegression**: L2 penalty (C=0.1), max_iter=1000

**Voting**: Soft (averages probabilities from all 3 models)

**ONNX Export**: HistGradientBoosting component exported (VotingClassifier not fully ONNX-compatible)

### Model Performance Metrics

| Metric | Train | Validation | Test |
|--------|-------|------------|------|
| **Accuracy** | 98.19% | 83.15% | **79.89%** |
| **ROC-AUC** | 99.94% | 92.25% | **88.67%** |
| **Precision (Disease)** | - | - | **83.5%** |
| **Recall (Disease)** | - | - | **79.4%** |
| **F1-Score** | - | - | **81.4%** |

**Clinical Interpretation:**
- ~80% overall accuracy: Model correctly classifies 4 out of 5 patients
- 88.67% ROC-AUC: Excellent discrimination between high/low risk patients
- 83.5% precision: When predicting "high risk", correct 83.5% of time (16.5% false alarms)
- 79.4% recall: Catches 79.4% of actual disease cases (misses 20.6% - false negatives)
- **Use as screening tool**: Good for prioritizing patients, but not standalone diagnostic

### Dataset Details

**Source**: UCI Heart Disease Dataset (Cleveland, Hungary, Switzerland, VA Long Beach)
- **Samples**: 920 patients (after cleaning)
- **Features**: 11 clinical parameters
- **Target**: Binary (disease presence/absence)
- **Split**: 60% train / 20% validation / 20% test (stratified by disease label)

**Input Features:**
1. Age (years)
2. Sex (Male/Female)
3. Chest Pain Type (typical angina, atypical angina, non-anginal, asymptomatic)
4. Resting Blood Pressure (mmHg)
5. Cholesterol (mg/dL)
6. Fasting Blood Sugar >120 mg/dL (boolean)
7. Resting ECG (normal, LV hypertrophy, ST-T abnormality)
8. Max Heart Rate Achieved (bpm)
9. Exercise-Induced Angina (boolean)
10. ST Depression (mm)
11. ST Slope (upsloping, flat, downsloping)

**Data Preprocessing:**
- Missing values imputed (mode for categorical, median for numeric)
- Outliers retained (clinical variation expected)
- No SMOTE/oversampling (preserve real class distribution)

---

## 📖 Usage

### Manual Patient Entry
1. Navigate to **Dashboard** tab
2. Fill in patient clinical parameters in the left form (validated against clinical ranges)
3. Click **Calculate Risk** to generate ML prediction
4. View:
   - Risk probability & level (Low/Medium/High)
   - Feature importance (which factors increased/decreased risk)
   - Clinical threshold comparisons (BP, cholesterol, heart rate, ST depression)

### Viewing Saved Patients
1. Switch to **Patients** tab
2. Browse pre-loaded sample patients (calculated with ML model on mount)
3. Click eye icon to view detailed assessment
4. Click "View in Dashboard" to load patient into calculator

### Reports & Settings
- **Reports Tab**: Access analytics dashboards and batch processing results
- **Settings Tab**: Configure model version, data retention, export formats

---

## 📊 Project Structure

```
safepulse/
├── public/
│   ├── data/
│   │   └── heart_disease_uci.csv      # Training dataset
│   └── model/
│       └── heart_gb.onnx              # Trained ONNX model (79.89% test acc)
├── scripts/
│   └── train_uci_offline.py           # Python ML training pipeline
├── src/
│   ├── components/
│   │   ├── layout/                    # Header, Sidebar
│   │   ├── dashboard/
│   │   │   ├── PatientDataForm.tsx    # Clinical parameter input
│   │   │   ├── RiskProbabilityCard.tsx # Risk gauge visualization
│   │   │   ├── FeatureImportanceCard.tsx # SHAP-style explanations
│   │   │   ├── ClinicalThresholdsCard.tsx # Target comparisons
│   │   │   ├── ActionsCard.tsx        # Export reports
│   │   │   ├── PatientsPage.tsx       # Patient records table
│   │   │   ├── ReportsPage.tsx        # Analytics dashboard
│   │   │   └── SettingsPage.tsx       # Config panel
│   │   └── ui/                        # shadcn/ui primitives (40+ components)
│   ├── pages/
│   │   ├── Index.tsx                  # Main dashboard orchestrator
│   │   └── NotFound.tsx               # 404 page
│   ├── lib/
│   │   ├── mlModel.ts                 # TensorFlow.js loader (legacy, can remove)
│   │   ├── riskCalculator.ts          # ML prediction wrapper
│   │   ├── validation.ts              # Zod schemas & clinical validation
│   │   └── utils.ts                   # Utility functions
│   ├── hooks/
│   │   ├── use-mobile.tsx             # Responsive design hook
│   │   └── use-toast.ts               # Toast notifications
│   ├── App.tsx                        # Router + providers
│   ├── main.tsx                       # React entry point
│   └── index.css                      # Design system tokens
├── package.json                       # Frontend dependencies
├── vite.config.ts                     # Vite build config
├── tsconfig.json                      # TypeScript config
└── README.md                          # This file
```

---

## 🔧 Available Scripts

### Frontend

```bash
# Development server with hot module reload
npm run dev

# Production build (optimized bundle)
npm run build

# Preview production build locally
npm run preview

# Run tests with Vitest
npm test

# Run tests in watch mode
npm run test:watch

# Lint code with ESLint
npm run lint
```

### Machine Learning

```bash
# Train model from scratch (requires Python environment)
python scripts/train_uci_offline.py

# Output: public/model/heart_gb.onnx + training metrics
```

---

## 🎨 Design System

### Color Palette (Clinical Blue Theme)
- **Primary**: Clinical Blue (#3B82F6 / hsl(210, 90%, 48%))
- **Background**: White (#FFFFFF)
- **Muted**: Light Gray (#F3F4F6)
- **Risk Levels**:
  - 🟢 **Low Risk**: Green (#10B981)
  - 🟡 **Medium Risk**: Orange (#F59E0B)
  - 🔴 **High Risk**: Red (#EF4444)

### Typography
- **Font Family**: Inter (professional sans-serif)
- **Headings**: Bold weights for medical clarity
- **Body**: Regular weight with comfortable line height

### Layout
- **Card-based**: Each metric/section in its own card for scanning
- **Grid System**: Responsive 12-column grid (Tailwind)
- **Spacing**: Consistent 1.5rem (24px) gap between cards

---

## 🔐 Data & Privacy

- **Client-Side Inference**: ONNX model runs in browser (no server API calls)
- **No Data Transmission**: Patient data never leaves your deployment
- **localStorage**: Optional caching for model (can be disabled)
- **Anonymized Exports**: Reports exclude PII when configured
- **HIPAA-Ready**: Deploy behind your institution's secure infrastructure

---

## 📈 Model Retraining Guide

### When to Retrain
- New clinical data available (expand beyond UCI dataset)
- Performance degrades on validation set
- Change in clinical guidelines (e.g., updated BP thresholds)
- Feature additions (e.g., genetic markers, biomarkers)

### Steps
1. Update `public/data/heart_disease_uci.csv` with new data
2. Modify feature columns in `scripts/train_uci_offline.py` if needed
3. Run `python scripts/train_uci_offline.py`
4. Verify test accuracy ≥80% and ROC-AUC ≥0.85
5. Replace `public/model/heart_gb.onnx`
6. Test predictions in browser (refresh page to reload model)
7. Commit updated model to version control

### Hyperparameter Tuning
Edit `build_pipeline()` in training script:
- **HistGradientBoosting**: `max_iter`, `learning_rate`, `max_depth`, `l2_regularization`
- **RandomForest**: `n_estimators`, `max_depth`, `min_samples_split`
- **LogisticRegression**: `C` (inverse regularization strength)
- **PolynomialFeatures**: `degree` (interaction complexity)

---

## ⚠️ Medical Disclaimer

**SafePulse is a clinical decision support tool, NOT a diagnostic device.**

- **For Research/Educational Use**: Not FDA-approved or CE-marked
- **Human Review Required**: All predictions must be validated by qualified healthcare professionals
- **Supplementary Tool**: Use alongside comprehensive patient evaluation, history, and physical exam
- **80% Accuracy**: Model has ~20% error rate; false negatives can miss disease
- **Not Standalone**: Do not rely solely on ML output for clinical decisions

**Liability**: Deploying institution assumes all responsibility for clinical use and patient safety.

---

## 🤝 Contributing

Contributions welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License – see LICENSE file for details.

---

## 📧 Support

For issues, feature requests, or feedback, please open a GitHub issue or contact the maintainers.

---

**Built with ❤️ for clinicians | Last Updated: January 2026**
