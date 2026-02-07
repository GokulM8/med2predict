// Vercel Serverless Function: GET/PUT /api/auth/me
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { getUserById, updateUserProfile } from '../lib/users';
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

  try {
    if (req.method === 'GET') {
      const user = await getUserById(payload.sub);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      return res.status(200).json(user);
    }

    if (req.method === 'PUT') {
      const { first_name, last_name, phone, age, gender, address, city, state, zip_code, bio, profile_picture } = req.body || {};
      
      const updated = await updateUserProfile(payload.sub, {
        first_name,
        last_name,
        phone,
        age,
        gender,
        address,
        city,
        state,
        zip_code,
        bio,
        profile_picture,
      } as any);

      await logActivity({ user_id: payload.sub, action: 'profile:update', meta: { first_name, last_name } });
      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[auth/me] error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
