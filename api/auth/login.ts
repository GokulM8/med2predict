// Vercel Serverless Function: POST /api/auth/login
import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ensureDatabaseInitialized } from '../lib/db.js';
import { findUserByEmail, seedAdminUser } from '../lib/users.js';
import { logActivity } from '../lib/activity.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};
  
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }

  try {
    await ensureDatabaseInitialized();
    await seedAdminUser();
    console.info('[auth:login] attempt', { email });
    
    const user = await findUserByEmail(email);
    
    if (!user) {
      console.info('[auth:login] failed - user not found', { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = bcrypt.compareSync(password, user.password_hash);
    
    if (!ok) {
      console.info('[auth:login] failed - bad password', { email });
      await logActivity({ user_id: user.id, action: 'login:failed', meta: { email } });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logActivity({ user_id: user.id, action: 'login', meta: { email } });
    console.info('[auth:login] success', { email, userId: user.id });

    return res.status(200).json({
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[auth:login] error:', { email, message });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
