// Risk calculation engine using ONNX ML model
// Integrates offline-trained scikit-learn model with clinical decision support

import { loadOnnxModel, predictOnnxRisk, getOnnxFeatureImportance } from './onnxModel';

// Initialize ML model on module load
let modelInitialized = false;
async function ensureModelLoaded() {
  if (!modelInitialized) {
    await loadOnnxModel();
    modelInitialized = true;
  }
}

export interface PatientData {
  patientId: string;
  patientName?: string;
  age: number;
  sex: 'Male' | 'Female' | 'M' | 'F';
  chestPainType: 'typical_angina' | 'atypical_angina' | 'non_anginal_pain' | 'asymptomatic';
  restingBP: number;
  cholesterol: number;
  fastingBloodSugar: boolean;
  restingECG: 'normal' | 'st_t_abnormality' | 'lvh';
  maxHeartRate: number;
  exerciseAngina: boolean;
  stDepression: number;
  stSlope: 'upsloping' | 'flat' | 'downsloping';
  ca?: number;
  thal?: 'normal' | 'fixed_defect' | 'reversible_defect';
}

export interface FeatureContribution {
  feature: string;
  value: string | number;
  impact: number;
  description: string;
}

export interface RiskResult {
  riskLevel: 'Low' | 'Medium' | 'High';
  probability: number;
  featureContributions: FeatureContribution[];
  clinicalThresholds: ClinicalThreshold[];
  interpretation: string;
}

export interface ClinicalThreshold {
  metric: string;
  patientValue: string;
  clinicalTarget: string;
  status: 'Normal' | 'Elevated' | 'Borderline' | 'High';
}

export async function calculateRiskML(patient: PatientData): Promise<RiskResult> {
  // Ensure model is loaded
  await ensureModelLoaded();

  // Get ML prediction from ONNX model
  const probability = await predictOnnxRisk(patient);
  
  // Get feature importance (heuristic for ONNX)
  const importanceScores = getOnnxFeatureImportance(patient, probability);
  
  const contributions: FeatureContribution[] = [];

  
  // Build feature contributions from ML model importance scores
  const featureNames = ['Age', 'Sex', 'Chest Pain Type', 'Resting BP', 'Cholesterol', 
                        'Fasting Blood Sugar', 'Resting ECG', 'Max Heart Rate', 
                        'Exercise Angina', 'ST Depression', 'ST Slope'];
  
  const featureValues = [
    `${patient.age} years`,
    patient.sex,
    patient.chestPainType,
    `${patient.restingBP} mmHg`,
    `${patient.cholesterol} mg/dL`,
    patient.fastingBloodSugar ? 'Yes' : 'No',
    patient.restingECG,
    `${patient.maxHeartRate} bpm`,
    patient.exerciseAngina ? 'Yes' : 'No',
    `${patient.stDepression} mm`,
    patient.stSlope,
  ];

  const featureDescriptions = [
    patient.age > 55 ? 'Age is a significant cardiovascular risk factor' : 'Age-related risk assessment',
    'Sex-based risk differential',
    patient.chestPainType === 'asymptomatic' ? 'Asymptomatic presentation often indicates serious underlying condition' : 'Chest pain pattern assessment',
    patient.restingBP >= 140 ? 'Hypertensive range blood pressure' : 'Blood pressure assessment',
    patient.cholesterol >= 240 ? 'High cholesterol level' : 'Lipid profile assessment',
    'Fasting blood sugar level',
    'Resting ECG pattern analysis',
    `${Math.round((patient.maxHeartRate / (220 - patient.age)) * 100)}% of age-predicted maximum`,
    patient.exerciseAngina ? 'Exercise-induced angina present' : 'No exercise-induced symptoms',
    patient.stDepression > 1 ? 'Significant ST depression indicates ischemia' : 'ECG ST segment analysis',
    'Exercise ECG slope pattern',
  ];

  // Normalize importance scores and create contributions
  const maxImportance = Math.max(...importanceScores);
  importanceScores.forEach((importance, idx) => {
    // Scale to -0.5 to +0.5 range for display
    const normalizedImpact = (importance / maxImportance) * 0.5 * (probability > 0.5 ? 1 : -1);
    contributions.push({
      feature: featureNames[idx],
      value: featureValues[idx],
      impact: Math.round(normalizedImpact * 100) / 100,
      description: featureDescriptions[idx],
    });
  });

  // Sort by absolute impact
  contributions.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  // Determine risk level
  let riskLevel: 'Low' | 'Medium' | 'High';
  if (probability >= 0.65) {
    riskLevel = 'High';
  } else if (probability >= 0.35) {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'Low';
  }

  // Build clinical thresholds
  const clinicalThresholds: ClinicalThreshold[] = [
    {
      metric: 'Blood Pressure',
      patientValue: `${patient.restingBP} mmHg`,
      clinicalTarget: '< 120 mmHg',
      status: patient.restingBP >= 140 ? 'High' : patient.restingBP >= 130 ? 'Elevated' : 'Normal',
    },
    {
      metric: 'Total Cholesterol',
      patientValue: `${patient.cholesterol} mg/dL`,
      clinicalTarget: '< 200 mg/dL',
      status: patient.cholesterol >= 240 ? 'High' : patient.cholesterol >= 200 ? 'Borderline' : 'Normal',
    },
    {
      metric: 'Max Heart Rate',
      patientValue: `${patient.maxHeartRate} bpm`,
      clinicalTarget: `> ${Math.round((220 - patient.age) * 0.85)} bpm`,
      status: patient.maxHeartRate < (220 - patient.age) * 0.65 ? 'High' : patient.maxHeartRate < (220 - patient.age) * 0.85 ? 'Borderline' : 'Normal',
    },
    {
      metric: 'ST Depression',
      patientValue: `${patient.stDepression} mm`,
      clinicalTarget: '< 1.0 mm',
      status: patient.stDepression >= 2 ? 'High' : patient.stDepression >= 1 ? 'Elevated' : 'Normal',
    },
  ];

  // Generate interpretation
  const highRiskFactors = contributions.filter(c => c.impact > 0.05).map(c => c.feature);
  let interpretation: string;
  
  if (riskLevel === 'High') {
    interpretation = `Patient falls into the high-risk category (${Math.round(probability * 100)}% probability). Key contributing factors: ${highRiskFactors.slice(0, 3).join(', ')}. Immediate cardiovascular evaluation recommended.`;
  } else if (riskLevel === 'Medium') {
    interpretation = `Patient shows moderate cardiovascular risk (${Math.round(probability * 100)}% probability). Monitor: ${highRiskFactors.slice(0, 2).join(', ')}. Lifestyle modifications and follow-up recommended.`;
  } else {
    interpretation = `Patient demonstrates low cardiovascular risk (${Math.round(probability * 100)}% probability). Continue preventive measures and regular check-ups.`;
  }

  return {
    riskLevel,
    probability,
    featureContributions: contributions.slice(0, 6),
    clinicalThresholds,
    interpretation,
  };
}

export function generatePatientId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PT-${year}-${random}`;
}
