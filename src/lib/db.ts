import Dexie, { Table } from 'dexie';
import type { PatientData, RiskResult } from './riskCalculator';

export interface PatientRecord {
  patientId: string;
  data: PatientData;
  result?: RiskResult;
  savedAt: number; // epoch ms
  updatedAt?: number; // epoch ms
}

class SafePulseDB extends Dexie {
  patients!: Table<PatientRecord, string>;

  constructor() {
    super('SafePulseDB');
    this.version(1).stores({
      // Primary key: patientId, index savedAt for sorting
      patients: 'patientId, savedAt'
    });
  }
}

export const db = new SafePulseDB();
