// Vercel Serverless Function: GET/POST /api/patients
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { listPatients, savePatient } from '../lib/patients.js';
import { logActivity } from '../lib/activity.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function verifyToken(req: VercelRequest): { sub: number; role: string; email: string } | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  
  const token = header.slice(7);
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const payload = verifyToken(req);
  
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const isAdmin = payload.role === 'admin';
      const patients = await listPatients(payload.sub, isAdmin);
      return res.status(200).json(patients);
    }

    if (req.method === 'POST') {
      const { patient_id, data, result } = req.body || {};
      
      if (!patient_id || !data) {
        return res.status(400).json({ error: 'patient_id and data are required' });
      }

      const now = Date.now();
      await savePatient({
        patient_id,
        data,
        result,
        saved_at: now,
        updated_at: now,
        owner_id: payload.sub
      });

      await logActivity({ user_id: payload.sub, action: 'patient:create', meta: { patient_id } });
      return res.status(201).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[patients] error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
