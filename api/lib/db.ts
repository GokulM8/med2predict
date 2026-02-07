// Vercel Serverless Function - Database Connection Pool for PostgreSQL
import { Pool } from '@vercel/postgres';

// Create connection pool - Supports both Neon and Vercel Postgres
let pool: Pool | null = null;
let initialized = false;

export function getPool(): Pool {
  if (!pool) {
    // Use DATABASE_URL (Neon)
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('No database connection string found. Set DATABASE_URL environment variable.');
    }

    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result;
}

// Initialize database schema (run once)
export async function initDatabase() {
  const pool = getPool();
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(50) NOT NULL CHECK(role IN ('admin','user')),
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      phone VARCHAR(50),
      age INTEGER,
      gender VARCHAR(50),
      address TEXT,
      city VARCHAR(255),
      state VARCHAR(255),
      zip_code VARCHAR(20),
      profile_picture TEXT,
      bio TEXT,
      created_at BIGINT NOT NULL,
      updated_at BIGINT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS patients (
      patient_id VARCHAR(255) PRIMARY KEY,
      data JSONB NOT NULL,
      result JSONB,
      saved_at BIGINT NOT NULL,
      updated_at BIGINT,
      owner_id INTEGER REFERENCES users(id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS activity (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      action VARCHAR(255) NOT NULL,
      meta JSONB,
      created_at BIGINT NOT NULL
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_patients_owner_id ON patients(owner_id);
    CREATE INDEX IF NOT EXISTS idx_patients_saved_at ON patients(saved_at DESC);
    CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);
}

export async function ensureDatabaseInitialized() {
  if (initialized) return;
  await initDatabase();
  initialized = true;
}
