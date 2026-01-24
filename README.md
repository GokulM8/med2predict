# 🫀 Med2Predict

**Intelligent Heart Disease Risk Prediction System**

A clean, professional healthcare dashboard that empowers clinicians with AI-driven cardiovascular risk assessment. Med2Predict uses clinical parameters to predict heart disease risk with explainable AI insights.

---

## ✨ Features

- **Patient Risk Assessment**: Input clinical parameters (age, sex, BP, cholesterol, heart rate, etc.) and get instant risk predictions
- **Risk Stratification**: Clear risk levels (Low, Medium, High) with probability scores
- **Explainable AI**: SHAP-style feature importance analysis showing which factors contribute most to risk
- **Clinical Thresholds**: Compare patient metrics against evidence-based clinical targets
- **Patient Management**: Browse saved patient records, view assessment history
- **Report Generation**: Export comprehensive risk reports with clinical recommendations
- **Responsive Design**: Works seamlessly on desktop and tablets for clinical workflows
- **Calm Clinical Theme**: Blue/white professional palette designed for medical settings

---

## 🏥 Use Cases

- **Cardiologists**: Quick risk screening for new and follow-up patients
- **Primary Care**: Identify patients needing specialist referral
- **Public Health**: Population-level risk assessment and trending
- **Clinical Research**: Batch processing of patient data

---

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5 (esbuild-based for fast dev server)
- **Styling**: Tailwind CSS + shadcn/ui component library
- **State**: React Hooks + React Query
- **Routing**: React Router v6
- **Testing**: Vitest + Testing Library
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for data visualization

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (tested on v24)
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/arshad5963/med2predict.git
cd med2predict

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 📖 Usage

### Manual Patient Entry
1. Go to **Dashboard** tab
2. Fill in patient clinical parameters in the left form
3. Click **Recalculate Risk** to generate prediction
4. View risk probability, contributing factors, and clinical thresholds

### Batch CSV Upload
1. Switch to **Upload CSV** tab
2. Upload a CSV file (UCI Heart Disease format compatible)
3. Select a patient record to view in the dashboard

### Manage Records
- **Patients Tab**: Browse all assessed patients, search by ID/gender, view details
- **Reports Tab**: Access generated reports and analytics dashboards
- **Settings Tab**: Configure model version, notification preferences, data retention

---

## 📊 Project Structure

```
src/
├── components/
│   ├── layout/           # Header, Sidebar navigation
│   ├── dashboard/        # Main risk assessment cards
│   ├── ui/              # shadcn/ui primitives
│   └── NavLink.tsx
├── pages/
│   ├── Index.tsx        # Main dashboard page
│   └── NotFound.tsx     # 404 page
├── lib/
│   ├── riskCalculator.ts   # Risk scoring engine
│   ├── validation.ts       # Zod schemas & clinical validation
│   └── utils.ts           # Utility functions
├── hooks/
│   ├── use-mobile.tsx     # Mobile detection
│   └── use-toast.ts       # Toast notifications
├── App.tsx              # Main app with routing & providers
├── main.tsx            # React entry point
└── index.css           # Design system (colors, fonts, etc.)
```

---

## 🧬 Risk Calculator

The risk calculator uses weighted clinical features derived from UCI Heart Disease dataset patterns:

**Key Inputs:**
- Age, Sex
- Blood Pressure (resting)
- Cholesterol, Max Heart Rate
- Chest Pain Type, ST Depression
- Exercise-Induced Angina, Fasting Blood Sugar
- Resting ECG pattern, ST Slope

**Output:**
- Risk probability (0–100%)
- Risk level (Low/Medium/High)
- Feature contributions (explainable AI)
- Clinical threshold comparisons

---

## 🔧 Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm build

# Preview production build locally
npm run preview

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint
```

---

## 🎨 Design System

- **Primary Color**: Clinical Blue (#3B82F6)
- **Risk Levels**:
  - 🟢 **Low Risk**: Green (#10B981)
  - 🟡 **Medium Risk**: Orange (#F59E0B)
  - 🔴 **High Risk**: Red (#EF4444)
- **Typography**: Professional sans-serif for medical clarity
- **Spacing & Borders**: Consistent card-based layout

---

## 🔐 Data & Privacy

- All calculations are client-side (no external API calls to store patient data)
- Sensitive patient information stays within your deployment
- Support for anonymized exports via settings
- Configurable data retention policies

---

## 📈 Model Information

- **Algorithm**: XGBoost v2.4 (feature importance from Random Forest)
- **Dataset**: UCI Heart Disease (303 samples, 13 features)
- **Validation**: 95% confidence interval
- **Use Case**: Clinical decision support tool (not a diagnostic device)

---

## ⚠️ Medical Disclaimer

Med2Predict is a **clinical decision support tool** and should **NOT** be used as a standalone diagnostic instrument. All predictions should be reviewed by qualified healthcare professionals in the context of comprehensive patient evaluation.

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
