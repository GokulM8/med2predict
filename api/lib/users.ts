// User management functions for PostgreSQL
import bcrypt from 'bcryptjs';
import { query } from './db';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  age?: number;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  profile_picture?: string;
  bio?: string;
  created_at: number;
  updated_at?: number;
}

export async function createUser({ email, password, role = 'user' }: { email: string; password: string; role?: string }) {
  // Check if user exists
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new Error('User already exists');
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const now = Date.now();
  
  const result = await query(
    'INSERT INTO users (email, password_hash, role, created_at) VALUES ($1, $2, $3, $4) RETURNING id, email, role, created_at',
    [email, passwordHash, role, now]
  );
  
  return result.rows[0];
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

export async function getUserById(id: number): Promise<Omit<User, 'password_hash'> | null> {
  const result = await query(
    'SELECT id, email, role, first_name, last_name, phone, age, gender, address, city, state, zip_code, profile_picture, bio, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function updateUserProfile(id: number, profile: Partial<User>) {
  const allowed = ['first_name', 'last_name', 'phone', 'age', 'gender', 'address', 'city', 'state', 'zip_code', 'profile_picture', 'bio'];
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const key of allowed) {
    if (key in profile) {
      updates.push(`${key} = $${paramIndex}`);
      values.push((profile as any)[key]);
      paramIndex++;
    }
  }

  if (updates.length === 0) {
    return getUserById(id);
  }

  updates.push(`updated_at = $${paramIndex}`);
  values.push(Date.now());
  paramIndex++;
  values.push(id);

  await query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
    values
  );

  return getUserById(id);
}

export async function listUsers(limit = 200): Promise<Omit<User, 'password_hash'>[]> {
  const result = await query(
    'SELECT id, email, role, first_name, last_name, phone, age, gender, address, city, state, zip_code, profile_picture, bio, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  return result.rows;
}

export async function seedAdminUser() {
  const adminEmail = 'admin@safepulse.local';
  const adminPass = 'Admin123!';
  
  try {
    const admin = await findUserByEmail(adminEmail);
    if (!admin) {
      await createUser({ email: adminEmail, password: adminPass, role: 'admin' });
      console.log(`Seeded admin user -> email: ${adminEmail} password: ${adminPass}`);
    }
  } catch (err) {
    console.error('Failed to seed admin user:', (err as Error).message);
  }
}
