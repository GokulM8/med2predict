// Vercel Serverless Function: POST /api/auth/signup
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { createUser } from '../lib/users';
import { logActivity } from '../lib/activity';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};
  
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }

  try {
    const user = await createUser({ email, password, role: 'user' });
    await logActivity({ user_id: user.id, action: 'signup', meta: { email } });

    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    const message = (error as Error).message || 'signup failed';
    return res.status(400).json({ error: message });
  }
}
