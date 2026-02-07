import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'safepulse.db');
const db = new Database(dbPath);

// Initialize schema
db.exec(`
CREATE TABLE IF NOT EXISTS patients (
  patientId TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  result TEXT,
  savedAt INTEGER NOT NULL,
  updatedAt INTEGER,
  ownerId INTEGER
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','user')),
  firstName TEXT,
  lastName TEXT,
  phone TEXT,
  age INTEGER,
  gender TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zipCode TEXT,
  profilePicture TEXT,
  bio TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER
);

CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  action TEXT NOT NULL,
  meta TEXT,
  createdAt INTEGER NOT NULL,
  FOREIGN KEY(userId) REFERENCES users(id)
);
`);

export function listPatients() {
  const rows = db.prepare('SELECT * FROM patients ORDER BY savedAt DESC').all();
  return rows.map(r => ({
    patientId: r.patientId,
    data: JSON.parse(r.data),
    result: r.result ? JSON.parse(r.result) : undefined,
    savedAt: r.savedAt,
     updatedAt: r.updatedAt || r.savedAt,
     ownerId: r.ownerId || null,
  }));
}

export function getPatient(patientId) {
  const row = db.prepare('SELECT * FROM patients WHERE patientId = ?').get(patientId);
  if (!row) return undefined;
  return {
    patientId: row.patientId,
    data: JSON.parse(row.data),
    result: row.result ? JSON.parse(row.result) : undefined,
    savedAt: row.savedAt,
     updatedAt: row.updatedAt || row.savedAt,
     ownerId: row.ownerId || null,
  };
}

export function savePatient(record) {
  const { patientId, data, result, savedAt, updatedAt, ownerId } = record;
  db.prepare(`
    INSERT INTO patients (patientId, data, result, savedAt, updatedAt, ownerId)
    VALUES (@patientId, @data, @result, @savedAt, @updatedAt, @ownerId)
    ON CONFLICT(patientId) DO UPDATE SET
      data = excluded.data,
      result = excluded.result,
      updatedAt = excluded.updatedAt,
      ownerId = excluded.ownerId
  `).run({
    patientId,
    data: JSON.stringify(data),
    result: result ? JSON.stringify(result) : null,
    savedAt,
    updatedAt: updatedAt || savedAt,
    ownerId: ownerId || null,
  });
}

export function deletePatient(patientId) {
  db.prepare('DELETE FROM patients WHERE patientId = ?').run(patientId);
}

// User management
export function createUser({ email, password, role = 'user' }) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    throw new Error('User already exists');
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  const now = Date.now();
  const info = db.prepare('INSERT INTO users (email, passwordHash, role, createdAt) VALUES (@email, @passwordHash, @role, @createdAt)').run({ email, passwordHash, role, createdAt: now });
  return { id: info.lastInsertRowid, email, role, createdAt: now };
}

export function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

export function getUserById(id) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    age: user.age,
    gender: user.gender,
    address: user.address,
    city: user.city,
    state: user.state,
    zipCode: user.zipCode,
    profilePicture: user.profilePicture,
    bio: user.bio,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function listUsers(limit = 200) {
  const rows = db.prepare('SELECT * FROM users ORDER BY createdAt DESC LIMIT ?').all(limit);
  return rows.map(user => ({
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    age: user.age,
    gender: user.gender,
    address: user.address,
    city: user.city,
    state: user.state,
    zipCode: user.zipCode,
    profilePicture: user.profilePicture,
    bio: user.bio,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
}

export function updateUserProfile(id, profile) {
  const allowed = ['firstName', 'lastName', 'phone', 'age', 'gender', 'address', 'city', 'state', 'zipCode', 'profilePicture', 'bio'];
  const updates = {};
  for (const key of allowed) {
    if (key in profile) updates[key] = profile[key];
  }
  
  if (Object.keys(updates).length === 0) {
    return getUserById(id);
  }

  const setClauses = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
  const query = `UPDATE users SET ${setClauses}, updatedAt = @updatedAt WHERE id = @id`;
  
  db.prepare(query).run({
    ...updates,
    id,
    updatedAt: Date.now(),
  });

  return getUserById(id);
}

// Activity logging
export function logActivity({ userId, action, meta }) {
  db.prepare('INSERT INTO activity (userId, action, meta, createdAt) VALUES (@userId, @action, @meta, @createdAt)').run({
    userId: userId ?? null,
    action,
    meta: meta ? JSON.stringify(meta) : null,
    createdAt: Date.now(),
  });
}

export function listActivity(limit = 200) {
  return db.prepare('SELECT * FROM activity ORDER BY createdAt DESC LIMIT ?').all(limit).map(row => ({
    id: row.id,
    userId: row.userId,
    action: row.action,
    meta: row.meta ? JSON.parse(row.meta) : null,
    createdAt: row.createdAt,
  }));
}

// Seed admin user if missing
export function seedAdminUser() {
  const adminEmail = 'admin@safepulse.local';
  const adminPass = 'Admin123!';
  try {
    const admin = findUserByEmail(adminEmail);
    if (!admin) {
      createUser({ email: adminEmail, password: adminPass, role: 'admin' });
      console.log(`Seeded admin user -> email: ${adminEmail} password: ${adminPass}`);
    }
  } catch (err) {
    console.error('Failed to seed admin user:', err.message);
  }
}
