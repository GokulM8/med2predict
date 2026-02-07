// Vercel Serverless Function: GET/PUT/DELETE /api/patients/[id]
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { getPatient, savePatient, deletePatient } from '../lib/patients';
import { logActivity } from '../lib/activity';

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

  const { id } = req.query;
  const patientId = Array.isArray(id) ? id[0] : id;

  if (!patientId) {
    return res.status(400).json({ error: 'Patient ID required' });
  }

  try {
    const existing = await getPatient(patientId);

    if (req.method === 'GET') {
      if (!existing) return res.status(404).json({ error: 'Not found' });
      
      if (payload.role !== 'admin' && existing.owner_id && existing.owner_id !== payload.sub) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      return res.status(200).json(existing);
    }

    if (req.method === 'PUT') {
      if (!existing) return res.status(404).json({ error: 'Not found' });
      
      if (payload.role !== 'admin' && existing.owner_id && existing.owner_id !== payload.sub) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { data, result } = req.body || {};
      if (!data) return res.status(400).json({ error: 'data is required' });

      await savePatient({
        patient_id: patientId,
        data,
        result,
        saved_at: existing.saved_at,
        updated_at: Date.now(),
        owner_id: existing.owner_id || payload.sub
      });

      await logActivity({ user_id: payload.sub, action: 'patient:update', meta: { patient_id: patientId } });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      if (!existing) return res.status(404).json({ error: 'Not found' });
      
      if (payload.role !== 'admin' && existing.owner_id && existing.owner_id !== payload.sub) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await deletePatient(patientId);
      await logActivity({ user_id: payload.sub, action: 'patient:delete', meta: { patient_id: patientId } });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[patients/[id]] error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
