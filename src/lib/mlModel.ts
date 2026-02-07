import * as tf from '@tensorflow/tfjs';
import { PatientData } from './riskCalculator';

let model: tf.LayersModel | null = null;
let isModelLoaded = false;

type FeatureKey = 'age' | 'sex' | 'chestPainType' | 'restingBP' | 'cholesterol' | 'fastingBloodSugar' | 'restingECG' | 'maxHeartRate' | 'exerciseAngina' | 'stDepression' | 'stSlope';
type FeatureStats = Record<FeatureKey, { mean: number; std: number }>;

// Fallback stats in case dataset fails to load
const DEFAULT_FEATURE_STATS: FeatureStats = {
  age: { mean: 54.4, std: 9.0 },
  sex: { mean: 0.68, std: 0.47 },
  chestPainType: { mean: 1.5, std: 1.0 },
  restingBP: { mean: 131.6, std: 17.6 },
  cholesterol: { mean: 246.7, std: 51.8 },
  fastingBloodSugar: { mean: 0.15, std: 0.36 },
  restingECG: { mean: 0.5, std: 0.53 },
  maxHeartRate: { mean: 149.6, std: 22.9 },
  exerciseAngina: { mean: 0.33, std: 0.47 },
  stDepression: { mean: 1.04, std: 1.16 },
  stSlope: { mean: 1.4, std: 0.62 },
};

let featureStats: FeatureStats | null = null;

interface Dataset {
  features: number[][];
  labels: number[];
}

interface ParsedRow {
  age: number;
  sex: number;
  chestPainType: number;
  restingBP: number;
  cholesterol: number;
  fastingBloodSugar: number;
  restingECG: number;
  maxHeartRate: number;
  exerciseAngina: number;
  stDepression: number;
  stSlope: number;
  label: number;
}

async function loadCsvDataset(): Promise<Dataset> {
  const url = '/data/heart_disease_uci.csv';
  console.log(`📥 Loading dataset from ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load dataset: ${response.statusText}`);
  }

  const text = await response.text();
  const lines = text.trim().split(/\r?\n/);
  const header = lines.shift();
  if (!header) {
    throw new Error('Dataset has no header row');
  }

  const rows: ParsedRow[] = [];
  for (const line of lines) {
    const cols = line.split(',');
    if (cols.length < 16) continue;

    const [
      , // id (unused)
      age,
      sex,
      , // dataset source
      cp,
      trestbps,
      chol,
      fbs,
      restecg,
      thalch,
      exang,
      oldpeak,
      slope,
      , // ca
      , // thal
      num,
    ] = cols;

    const chestPainMap: Record<string, number> = {
      'typical angina': 0,
      'atypical angina': 1,
      'non-anginal': 2,
      'asymptomatic': 3,
    };

    const ecgMap: Record<string, number> = {
      'normal': 0,
      'lv hypertrophy': 1,
      'st-t abnormality': 2,
    };

    const slopeMap: Record<string, number> = {
      'upsloping': 0,
      'flat': 1,
      'downsloping': 2,
    };

    const parsed: ParsedRow = {
      age: Number(age),
      sex: sex === 'Male' ? 1 : 0,
      chestPainType: chestPainMap[cp] ?? 2,
      restingBP: Number(trestbps),
      cholesterol: Number(chol),
      fastingBloodSugar: fbs === 'TRUE' ? 1 : 0,
      restingECG: ecgMap[restecg] ?? 0,
      maxHeartRate: Number(thalch),
      exerciseAngina: exang === 'TRUE' ? 1 : 0,
      stDepression: Number(oldpeak),
      stSlope: slopeMap[slope] ?? 1,
      label: Number(num) > 0 ? 1 : 0,
    };

    if (Object.values(parsed).some((v) => Number.isNaN(v))) {
      continue;
    }

    rows.push(parsed);
  }

  const features = rows.map(({ label, ...rest }) => Object.values(rest));
  const labels = rows.map((row) => row.label);

  console.log(`✅ Loaded ${features.length} samples from dataset`);
  return { features, labels };
}

function computeFeatureStats(data: number[][]): FeatureStats {
  const keys: FeatureKey[] = ['age', 'sex', 'chestPainType', 'restingBP', 'cholesterol', 'fastingBloodSugar', 'restingECG', 'maxHeartRate', 'exerciseAngina', 'stDepression', 'stSlope'];
  const sums = Array(keys.length).fill(0);
  const sqSums = Array(keys.length).fill(0);
  const n = data.length;

  data.forEach((row) => {
    row.forEach((value, idx) => {
      sums[idx] += value;
      sqSums[idx] += value * value;
    });
  });

  const stats: Partial<FeatureStats> = {};
  keys.forEach((key, idx) => {
    const mean = sums[idx] / n;
    const variance = Math.max(1e-6, sqSums[idx] / n - mean * mean);
    stats[key] = { mean, std: Math.sqrt(variance) };
  });

  return stats as FeatureStats;
}

function normalizeBatch(data: number[][], stats: FeatureStats): number[][] {
  const keys: FeatureKey[] = ['age', 'sex', 'chestPainType', 'restingBP', 'cholesterol', 'fastingBloodSugar', 'restingECG', 'maxHeartRate', 'exerciseAngina', 'stDepression', 'stSlope'];
  return data.map((row) => row.map((value, idx) => {
    const stat = stats[keys[idx]];
    return (value - stat.mean) / stat.std;
  }));
}

async function ensureFeatureStats(dataset?: Dataset): Promise<FeatureStats> {
  if (featureStats) return featureStats;

  try {
    const data = dataset ?? (await loadCsvDataset());
    featureStats = computeFeatureStats(data.features);
    return featureStats;
  } catch (error) {
    console.warn('⚠️ Failed to compute feature stats from dataset, using defaults', error);
    featureStats = DEFAULT_FEATURE_STATS;
    return featureStats;
  }
}

/**
 * Create and train a neural network model for heart disease prediction
 * This version trains directly on the bundled UCI dataset
 */
async function createAndTrainModel(): Promise<tf.LayersModel> {
  console.log('🧠 Creating neural network model...');

  const dataset = await loadCsvDataset();
  const stats = await ensureFeatureStats(dataset);

  // Create a simple neural network
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [11], units: 32, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.3 }),
      tf.layers.dense({ units: 16, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 8, activation: 'relu' }),
      tf.layers.dense({ units: 1, activation: 'sigmoid' }),
    ],
  });

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  const normalizedFeatures = normalizeBatch(dataset.features, stats);
  const xs = tf.tensor2d(normalizedFeatures);
  const ys = tf.tensor2d(dataset.labels, [dataset.labels.length, 1]);

  console.log('🏋️ Training model on UCI dataset...');

  await model.fit(xs, ys, {
    epochs: 80,
    batchSize: 32,
    validationSplit: 0.2,
    verbose: 0,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (epoch % 10 === 0) {
          const loss = (logs?.loss as number | undefined)?.toFixed(4);
          const acc = (logs?.acc as number | undefined)?.toFixed(4);
          console.log(`Epoch ${epoch}: loss=${loss} acc=${acc}`);
        }
      },
    },
  });

  console.log('✅ Model training complete!');

  xs.dispose();
  ys.dispose();

  return model;
}

/**
 * Load or create the ML model
 */
export async function loadModel(): Promise<void> {
  if (isModelLoaded && model) {
    return;
  }

  try {
    console.log('🔄 Initializing TensorFlow.js backend...');
    await tf.ready();
    console.log('✅ TensorFlow.js ready');
    await ensureFeatureStats();
    
    // Try to load from localStorage/IndexedDB first
    try {
      console.log('📦 Attempting to load cached model...');
      model = await tf.loadLayersModel('indexeddb://heart-disease-model');
      console.log('✅ Model loaded from cache');
    } catch (e) {
      console.log('ℹ️ No cached model found, training new model...');
      // Train a new model if not cached
      model = await createAndTrainModel();
      
      // Save to cache for future use
      try {
        await model.save('indexeddb://heart-disease-model');
        console.log('💾 Model saved to browser cache');
      } catch (saveError) {
        console.warn('⚠️ Failed to save model to cache:', saveError);
      }
    }

    isModelLoaded = true;
  } catch (error) {
    console.error('❌ Error loading model:', error);
    throw error;
  }
}

/**
 * Convert patient data to model input format
 */
function preparePatientData(patient: PatientData): number[] {
  // Map categorical variables to numeric
  const sexValue = patient.sex === 'Male' ? 1 : 0;
  
  const chestPainMap: Record<string, number> = {
    'typical angina': 0,
    'atypical angina': 1,
    'non-anginal': 2,
    'asymptomatic': 3,
  };
  const chestPainValue = chestPainMap[patient.chestPainType] ?? 2;

  const ecgMap: Record<string, number> = {
    'normal': 0,
    'lv hypertrophy': 1,
    'st-t abnormality': 2,
  };
  const ecgValue = ecgMap[patient.restingECG] ?? 0;

  const slopeMap: Record<string, number> = {
    'upsloping': 0,
    'flat': 1,
    'downsloping': 2,
  };
  const slopeValue = slopeMap[patient.stSlope] ?? 1;

  return [
    patient.age,
    sexValue,
    chestPainValue,
    patient.restingBP,
    patient.cholesterol,
    patient.fastingBloodSugar ? 1 : 0,
    ecgValue,
    patient.maxHeartRate,
    patient.exerciseAngina ? 1 : 0,
    patient.stDepression,
    slopeValue,
  ];
}

/**
 * Normalize features for model input
 */
function normalizeFeatures(features: number[]): number[] {
  const keys = ['age', 'sex', 'chestPainType', 'restingBP', 'cholesterol', 
                'fastingBloodSugar', 'restingECG', 'maxHeartRate', 
                'exerciseAngina', 'stDepression', 'stSlope'];
  const stats = featureStats ?? DEFAULT_FEATURE_STATS;

  return features.map((value, idx) => {
    const key = keys[idx] as FeatureKey;
    const s = stats[key];
    return (value - s.mean) / s.std;
  });
}

/**
 * Predict heart disease risk using the ML model
 */
export async function predictRisk(patient: PatientData): Promise<number> {
  if (!model) {
    throw new Error('Model not loaded. Call loadModel() first.');
  }

  if (!featureStats) {
    await ensureFeatureStats();
  }

  // Prepare input data
  const rawFeatures = preparePatientData(patient);
  const normalizedFeatures = normalizeFeatures(rawFeatures);

  // Make prediction
  const inputTensor = tf.tensor2d([normalizedFeatures], [1, 11]);
  const prediction = model.predict(inputTensor) as tf.Tensor;
  const probability = (await prediction.data())[0];

  // Clean up tensors
  inputTensor.dispose();
  prediction.dispose();

  return probability;
}

/**
 * Get feature importance scores (simple gradient-based approach)
 */
export async function getFeatureImportance(patient: PatientData): Promise<number[]> {
  if (!model) {
    throw new Error('Model not loaded. Call loadModel() first.');
  }

  if (!featureStats) {
    await ensureFeatureStats();
  }

  const rawFeatures = preparePatientData(patient);
  const normalizedFeatures = normalizeFeatures(rawFeatures);
  const inputTensor = tf.tensor2d([normalizedFeatures], [1, 11]);

  // Use gradients to approximate feature importance
  const gradients = tf.tidy(() => {
    const grad = tf.grad((x: tf.Tensor) => {
      const pred = model!.predict(x) as tf.Tensor;
      return pred.sum();
    });
    
    return grad(inputTensor);
  });

  const importanceValues = await gradients.abs().data();
  
  // Clean up
  inputTensor.dispose();
  gradients.dispose();

  return Array.from(importanceValues);
}

/**
 * Clear cached model (useful for retraining)
 */
export async function clearModel(): Promise<void> {
  if (model) {
    model.dispose();
    model = null;
    isModelLoaded = false;
  }
  
  try {
    await tf.io.removeModel('indexeddb://heart-disease-model');
    console.log('🗑️ Model cache cleared');
  } catch (error) {
    console.log('No cached model to clear');
  }
}
