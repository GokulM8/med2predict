import * as ort from 'onnxruntime-web';
import { PatientData } from './riskCalculator';

let session: ort.InferenceSession | null = null;

/**
 * Load the ONNX model trained offline with scikit-learn
 */
export async function loadOnnxModel(): Promise<void> {
  if (session) {
    return; // Already loaded
  }

  try {
    console.log('🔄 Loading ONNX model...');
    
    // Configure ONNX Runtime
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/';
    
    // Load the model
    session = await ort.InferenceSession.create('/model/heart_gb.onnx', {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all'
    });
    
    console.log('✅ ONNX model loaded successfully');
    console.log('Model inputs:', session.inputNames);
    console.log('Model outputs:', session.outputNames);
  } catch (error) {
    console.error('❌ Failed to load ONNX model:', error);
    throw error;
  }
}

/**
 * Convert patient data to model input format matching scikit-learn pipeline
 * The ONNX model was exported with to_onnx(pipeline, dataframe_sample)
 * It expects 13 separate named inputs with specific types matching the training data
 */
function prepareOnnxInput(patient: PatientData): Record<string, ort.Tensor> {
  // CATEGORICAL_COLS = ["sex", "cp", "restecg", "slope", "thal"] - exported as object (strings)
  // BOOLEAN_COLS = ["fbs", "exang"] - exported as float
  // NUMERIC_COLS = ["age", "trestbps", "chol", "thalch", "oldpeak", "ca"] - exported as float
  
  const inputs: Record<string, ort.Tensor> = {
    // Categorical features - strings (object dtype in pandas)
    'sex': new ort.Tensor('string', [patient.sex], [1, 1]),
    'cp': new ort.Tensor('string', [patient.chestPainType], [1, 1]),
    'restecg': new ort.Tensor('string', [patient.restingECG], [1, 1]),
    'slope': new ort.Tensor('string', [patient.stSlope], [1, 1]),
    'thal': new ort.Tensor('string', [patient.thal || 'normal'], [1, 1]),
    
    // Boolean features - float (not string!)
    'fbs': new ort.Tensor('float64', new Float64Array([patient.fastingBloodSugar ? 1.0 : 0.0]), [1, 1]),
    'exang': new ort.Tensor('float64', new Float64Array([patient.exerciseAngina ? 1.0 : 0.0]), [1, 1]),
    
    // Numeric features - float
    'age': new ort.Tensor('float64', new Float64Array([patient.age]), [1, 1]),
    'trestbps': new ort.Tensor('float64', new Float64Array([patient.restingBP]), [1, 1]),
    'chol': new ort.Tensor('float64', new Float64Array([patient.cholesterol]), [1, 1]),
    'thalch': new ort.Tensor('float64', new Float64Array([patient.maxHeartRate]), [1, 1]),
    'oldpeak': new ort.Tensor('float64', new Float64Array([patient.stDepression]), [1, 1]),
    'ca': new ort.Tensor('float64', new Float64Array([patient.ca || 0]), [1, 1]),
  };
  
  return inputs;
}

/**
 * Predict heart disease risk using ONNX model
 */
export async function predictOnnxRisk(patient: PatientData): Promise<number> {
  if (!session) {
    throw new Error('Model not loaded. Call loadOnnxModel() first.');
  }

  try {
    const feeds = prepareOnnxInput(patient);
    
    // Run inference with all named inputs
    const results = await session.run(feeds);
    
    // Get probability output (returns [prob_class_0, prob_class_1])
    const probabilityOutput = results['probabilities'];
    
    if (!probabilityOutput || !('data' in probabilityOutput)) {
      console.error('Failed to find probabilities output. Available outputs:', Object.keys(results));
      throw new Error('Model did not return probability tensor');
    }
    
    // Extract probabilities array
    const probabilities = Array.from(probabilityOutput.data as Float32Array | Float64Array);
    
    // Return probability of class 1 (heart disease present)
    return probabilities[1];
  } catch (error) {
    console.error('❌ ONNX prediction failed:', error);
    throw error;
  }
}

/**
 * Get approximate feature importance (simplified for ONNX)
 * Since ONNX doesn't expose gradients easily, we use heuristic importance
 */
export function getOnnxFeatureImportance(patient: PatientData, probability: number): number[] {
  // Heuristic importance based on clinical knowledge and model training
  // Order matches: Age, Sex, ChestPain, BP, Chol, FBS, ECG, MaxHR, ExAngina, STDep, Slope
  
  const age = patient.age > 55 ? 0.15 : 0.05;
  const sex = patient.sex === 'M' ? 0.08 : 0.03;
  const chestPain = patient.chestPainType === 'asymptomatic' ? 0.20 : 
                     patient.chestPainType === 'typical_angina' ? 0.12 : 0.06;
  const bp = patient.restingBP > 140 ? 0.10 : 0.04;
  const chol = patient.cholesterol > 240 ? 0.08 : 0.03;
  const fbs = patient.fastingBloodSugar ? 0.03 : 0.01;
  const ecg = patient.restingECG === 'lvh' ? 0.06 : 0.02;
  const maxHR = patient.maxHeartRate < (220 - patient.age) * 0.7 ? 0.15 : 0.05;
  const exAngina = patient.exerciseAngina ? 0.14 : 0.02;
  const stDep = patient.stDepression > 1.5 ? 0.18 : patient.stDepression > 0.5 ? 0.10 : 0.03;
  const slope = patient.stSlope === 'downsloping' ? 0.12 : patient.stSlope === 'flat' ? 0.08 : 0.04;
  
  // Scale by prediction probability to reflect actual contribution
  const scale = probability > 0.5 ? 1.0 : 0.5;
  
  return [
    age * scale,
    sex * scale,
    chestPain * scale,
    bp * scale,
    chol * scale,
    fbs * scale,
    ecg * scale,
    maxHR * scale,
    exAngina * scale,
    stDep * scale,
    slope * scale
  ];
}
