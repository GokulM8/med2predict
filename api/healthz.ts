// Vercel Serverless Function: GET /api/healthz
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const result = await query('SELECT COUNT(*) as count FROM patients');
    const count = result.rows[0]?.count || 0;
    
    return res.status(200).json({
      ok: true,
      patients: parseInt(count)
    });
  } catch (error) {
    console.error('[healthz] error:', error);
    return res.status(500).json({
      ok: false,
      error: (error as Error).message
    });
  }
}
