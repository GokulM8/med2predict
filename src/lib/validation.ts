import { z } from 'zod';

// Medical validation ranges based on clinical standards
export const HEALTH_LIMITS = {
  age: { min: 1, max: 120, unit: 'years' },
  restingBP: { min: 60, max: 250, unit: 'mmHg' },
  cholesterol: { min: 50, max: 600, unit: 'mg/dL' },
  maxHeartRate: { min: 40, max: 250, unit: 'bpm' },
  stDepression: { min: 0, max: 10, unit: 'mm' },
};

export const patientDataSchema = z.object({
  patientId: z.string()
    .trim()
    .min(1, 'Patient ID is required')
    .max(50, 'Patient ID must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Patient ID can only contain letters, numbers, hyphens, and underscores'),

  age: z.number({
    required_error: 'Age is required',
    invalid_type_error: 'Age must be a number',
  })
    .int('Age must be a whole number')
    .min(HEALTH_LIMITS.age.min, `Age must be at least ${HEALTH_LIMITS.age.min} year`)
    .max(HEALTH_LIMITS.age.max, `Age cannot exceed ${HEALTH_LIMITS.age.max} years`),

  sex: z.enum(['Male', 'Female'], {
    required_error: 'Gender is required',
  }),

  chestPainType: z.enum(['typical angina', 'atypical angina', 'non-anginal', 'asymptomatic'], {
    required_error: 'Chest pain type is required',
  }),

  restingBP: z.number({
    required_error: 'Resting blood pressure is required',
    invalid_type_error: 'Blood pressure must be a number',
  })
    .int('Blood pressure must be a whole number')
    .min(HEALTH_LIMITS.restingBP.min, `Blood pressure must be at least ${HEALTH_LIMITS.restingBP.min} mmHg`)
    .max(HEALTH_LIMITS.restingBP.max, `Blood pressure cannot exceed ${HEALTH_LIMITS.restingBP.max} mmHg`),

  cholesterol: z.number({
    required_error: 'Cholesterol is required',
    invalid_type_error: 'Cholesterol must be a number',
  })
    .int('Cholesterol must be a whole number')
    .min(HEALTH_LIMITS.cholesterol.min, `Cholesterol must be at least ${HEALTH_LIMITS.cholesterol.min} mg/dL`)
    .max(HEALTH_LIMITS.cholesterol.max, `Cholesterol cannot exceed ${HEALTH_LIMITS.cholesterol.max} mg/dL`),

  fastingBloodSugar: z.boolean(),

  restingECG: z.enum(['normal', 'lv hypertrophy', 'st-t abnormality'], {
    required_error: 'Resting ECG is required',
  }),

  maxHeartRate: z.number({
    required_error: 'Maximum heart rate is required',
    invalid_type_error: 'Heart rate must be a number',
  })
    .int('Heart rate must be a whole number')
    .min(HEALTH_LIMITS.maxHeartRate.min, `Heart rate must be at least ${HEALTH_LIMITS.maxHeartRate.min} bpm`)
    .max(HEALTH_LIMITS.maxHeartRate.max, `Heart rate cannot exceed ${HEALTH_LIMITS.maxHeartRate.max} bpm`),

  exerciseAngina: z.boolean(),

  stDepression: z.number({
    required_error: 'ST depression is required',
    invalid_type_error: 'ST depression must be a number',
  })
    .min(HEALTH_LIMITS.stDepression.min, `ST depression must be at least ${HEALTH_LIMITS.stDepression.min} mm`)
    .max(HEALTH_LIMITS.stDepression.max, `ST depression cannot exceed ${HEALTH_LIMITS.stDepression.max} mm`),

  stSlope: z.enum(['upsloping', 'flat', 'downsloping'], {
    required_error: 'ST slope is required',
  }),
});

export type ValidatedPatientData = z.infer<typeof patientDataSchema>;

export function validatePatientData(data: unknown): { success: true; data: ValidatedPatientData } | { success: false; errors: Record<string, string> } {
  const result = patientDataSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });
  
  return { success: false, errors };
}

// Additional validation for age-based heart rate
export function validateMaxHeartRateForAge(age: number, maxHR: number): string | null {
  const theoreticalMax = 220 - age;
  const absoluteMax = Math.min(theoreticalMax + 20, 220); // Allow some buffer above theoretical max
  
  if (maxHR > absoluteMax) {
    return `Maximum heart rate of ${maxHR} bpm seems high for age ${age}. Theoretical maximum is ${theoreticalMax} bpm.`;
  }
  
  return null;
}

// Validate if BP is dangerously high
export function getBPWarning(bp: number): string | null {
  if (bp >= 180) {
    return 'Hypertensive crisis: BP ≥180 mmHg requires immediate medical attention';
  }
  if (bp >= 140) {
    return 'High blood pressure (Stage 2 Hypertension)';
  }
  if (bp >= 130) {
    return 'Elevated blood pressure (Stage 1 Hypertension)';
  }
  return null;
}

// Validate if cholesterol is dangerously high
export function getCholesterolWarning(chol: number): string | null {
  if (chol >= 300) {
    return 'Very high cholesterol: Requires medical intervention';
  }
  if (chol >= 240) {
    return 'High cholesterol level';
  }
  if (chol >= 200) {
    return 'Borderline high cholesterol';
  }
  return null;
}
