// Vercel Serverless Function: GET /api/activity (Admin only)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { listActivity } from './lib/activity';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function verifyAdmin(req: VercelRequest): { sub: number; role: string; email: string } | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return payload.role === 'admin' ? payload : null;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const payload = verifyAdmin(req);
  
  if (!payload) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const activities = await listActivity();
    return res.status(200).json(activities);
  } catch (error) {
    console.error('[activity] error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
