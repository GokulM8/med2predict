import { db, type PatientRecord } from './db';
import type { PatientData, RiskResult } from './riskCalculator';

export async function listPatients(): Promise<PatientRecord[]> {
  return db.patients.orderBy('savedAt').reverse().toArray();
}

export async function getPatient(patientId: string): Promise<PatientRecord | undefined> {
  return db.patients.get(patientId);
}

export async function deletePatient(patientId: string): Promise<void> {
  await db.patients.delete(patientId);
}

export async function saveAssessment(data: PatientData, result?: RiskResult): Promise<void> {
  const now = Date.now();
  const existing = await db.patients.get(data.patientId);
  const record: PatientRecord = {
    patientId: data.patientId,
    data,
    result,
    savedAt: existing?.savedAt ?? now,
    updatedAt: now,
  };
  await db.patients.put(record);
}
