// Patient management functions for PostgreSQL
import { query } from './db.js';

export interface PatientRecord {
  patient_id: string;
  data: Record<string, unknown>;
  result?: Record<string, unknown>;
  saved_at: number;
  updated_at?: number;
  owner_id?: number;
}

export async function listPatients(ownerId?: number, isAdmin = false): Promise<PatientRecord[]> {
  let sql = 'SELECT * FROM patients';
  const params: any[] = [];
  
  if (!isAdmin && ownerId) {
    sql += ' WHERE owner_id = $1 OR owner_id IS NULL';
    params.push(ownerId);
  }
  
  sql += ' ORDER BY saved_at DESC';
  
  const result = await query(sql, params.length > 0 ? params : undefined);
  
  return result.rows.map((r: any) => ({
    patient_id: r.patient_id,
    data: r.data,
    result: r.result,
    saved_at: r.saved_at,
    updated_at: r.updated_at || r.saved_at,
    owner_id: r.owner_id,
  }));
}

export async function getPatient(patientId: string): Promise<PatientRecord | null> {
  const result = await query('SELECT * FROM patients WHERE patient_id = $1', [patientId]);
  
  if (result.rows.length === 0) return null;
  
  const r = result.rows[0];
  return {
    patient_id: r.patient_id,
    data: r.data,
    result: r.result,
    saved_at: r.saved_at,
    updated_at: r.updated_at || r.saved_at,
    owner_id: r.owner_id,
  };
}

export async function savePatient(record: PatientRecord) {
  const { patient_id, data, result, saved_at, updated_at, owner_id } = record;
  
  await query(
    `INSERT INTO patients (patient_id, data, result, saved_at, updated_at, owner_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (patient_id) DO UPDATE SET
       data = EXCLUDED.data,
       result = EXCLUDED.result,
       updated_at = EXCLUDED.updated_at,
       owner_id = EXCLUDED.owner_id`,
    [patient_id, JSON.stringify(data), result ? JSON.stringify(result) : null, saved_at, updated_at || saved_at, owner_id || null]
  );
}

export async function deletePatient(patientId: string) {
  await query('DELETE FROM patients WHERE patient_id = $1', [patientId]);
}
