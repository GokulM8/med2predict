import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { listPatients, getPatient, savePatient, deletePatient, createUser, findUserByEmail, getUserById, updateUserProfile, logActivity, listActivity, listUsers, seedAdminUser } from './db.js';

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

// Extended health check including DB access for frontend readiness
app.get('/healthz', (_req, res) => {
  try {
    // call a lightweight DB helper to ensure DB is usable
    const count = listPatients().length;
    return res.json({ ok: true, patients: count });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// Auth helpers
function generateToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(requireAdmin = false) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;
      if (requireAdmin && payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
}

// Auth routes
app.post('/auth/signup', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const user = createUser({ email, password, role: 'user' });
    logActivity({ userId: user.id, action: 'signup', meta: { email } });
    const token = generateToken(user);
    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (e) {
    return res.status(400).json({ error: e.message || 'signup failed' });
  }
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  console.info('[auth:login] attempt', { email });
  const user = findUserByEmail(email);
  if (!user) {
    console.info('[auth:login] failed - user not found', { email });
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) {
    console.info('[auth:login] failed - bad password', { email });
    logActivity({ userId: user.id, action: 'login:failed', meta: { email } });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user);
  logActivity({ userId: user.id, action: 'login', meta: { email } });
  console.info('[auth:login] success', { email, userId: user.id });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

app.get('/auth/me', authMiddleware(), (req, res) => {
  const user = getUserById(req.user.sub);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  res.json(user);
});

app.put('/auth/me', authMiddleware(), (req, res) => {
  const { firstName, lastName, phone, age, gender, address, city, state, zipCode, bio, profilePicture } = req.body || {};
  try {
    const updated = updateUserProfile(req.user.sub, {
      firstName,
      lastName,
      phone,
      age,
      gender,
      address,
      city,
      state,
      zipCode,
      bio,
      profilePicture,
    });
    logActivity({ userId: req.user.sub, action: 'profile:update', meta: { firstName, lastName } });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.get('/patients', authMiddleware(), (req, res) => {
  const rows = listPatients().filter(p => req.user.role === 'admin' || p.ownerId === req.user.sub || !p.ownerId);
  res.json(rows);
});

app.get('/patients/:id', authMiddleware(), (req, res) => {
  const row = getPatient(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'admin' && row.ownerId && row.ownerId !== req.user.sub) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(row);
});

app.post('/patients', authMiddleware(), (req, res) => {
  const { patientId, data, result } = req.body || {};
  if (!patientId || !data) return res.status(400).json({ error: 'patientId and data are required' });
  const now = Date.now();
  try {
    savePatient({ patientId, data, result, savedAt: now, updatedAt: now, ownerId: req.user.sub });
    logActivity({ userId: req.user.sub, action: 'patient:create', meta: { patientId } });
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save' });
  }
});

app.put('/patients/:id', authMiddleware(), (req, res) => {
  const patientId = req.params.id;
  const { data, result } = req.body || {};
  if (!data) return res.status(400).json({ error: 'data is required' });
  const existing = getPatient(patientId);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'admin' && existing.ownerId && existing.ownerId !== req.user.sub) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    savePatient({ patientId, data, result, savedAt: existing.savedAt, updatedAt: Date.now(), ownerId: existing.ownerId || req.user.sub });
    logActivity({ userId: req.user.sub, action: 'patient:update', meta: { patientId } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

app.delete('/patients/:id', authMiddleware(), (req, res) => {
  const patientId = req.params.id;
  const existing = getPatient(patientId);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'admin' && existing.ownerId && existing.ownerId !== req.user.sub) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  deletePatient(patientId);
  logActivity({ userId: req.user.sub, action: 'patient:delete', meta: { patientId } });
  res.json({ ok: true });
});

// Admin activity feed
app.get('/activity', authMiddleware(true), (_req, res) => {
  res.json(listActivity());
});

// Admin: list users
app.get('/users', authMiddleware(true), (_req, res) => {
  res.json(listUsers());
});

app.listen(PORT, () => {
  console.log(`SafePulse API listening on http://localhost:${PORT}`);
  seedAdminUser();
});
