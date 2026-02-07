// Migration script: SQLite → PostgreSQL
import Database from 'better-sqlite3';
import { Pool } from '@vercel/postgres';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error('Error: POSTGRES_URL environment variable not set');
  process.exit(1);
}

async function migrate() {
  console.log('🔄 Starting SQLite → PostgreSQL migration...\n');

  // Connect to SQLite
  const sqlite = new Database('./server/safepulse.db');
  console.log('✅ Connected to SQLite database');

  // Connect to PostgreSQL
  const pg = new Pool({ connectionString: POSTGRES_URL });
  console.log('✅ Connected to PostgreSQL database\n');

  try {
    // Initialize PostgreSQL schema
    console.log('📋 Creating PostgreSQL tables...');
    
    await pg.query(`
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

    await pg.query(`
      CREATE TABLE IF NOT EXISTS patients (
        patient_id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        result JSONB,
        saved_at BIGINT NOT NULL,
        updated_at BIGINT,
        owner_id INTEGER REFERENCES users(id)
      );
    `);

    await pg.query(`
      CREATE TABLE IF NOT EXISTS activity (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(255) NOT NULL,
        meta JSONB,
        created_at BIGINT NOT NULL
      );
    `);

    console.log('✅ PostgreSQL tables created\n');

    // Migrate users
    console.log('👤 Migrating users...');
    const users = sqlite.prepare('SELECT * FROM users').all();
    const userIdMap = new Map<number, number>(); // SQLite ID → PostgreSQL ID
    
    for (const user of users as any[]) {
      const result = await pg.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, age, gender, address, city, state, zip_code, profile_picture, bio, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         RETURNING id`,
        [
          user.email,
          user.passwordHash,
          user.role,
          user.firstName || null,
          user.lastName || null,
          user.phone || null,
          user.age || null,
          user.gender || null,
          user.address || null,
          user.city || null,
          user.state || null,
          user.zipCode || null,
          user.profilePicture || null,
          user.bio || null,
          user.createdAt,
          user.updatedAt || null
        ]
      );
      userIdMap.set(user.id, result.rows[0].id);
      console.log(`  ✓ Migrated user: ${user.email}`);
    }
    console.log(`✅ Migrated ${users.length} users\n`);

    // Migrate patients
    console.log('📊 Migrating patients...');
    const patients = sqlite.prepare('SELECT * FROM patients').all();
    
    for (const patient of patients as any[]) {
      const newOwnerId = patient.ownerId ? userIdMap.get(patient.ownerId) : null;
      
      await pg.query(
        `INSERT INTO patients (patient_id, data, result, saved_at, updated_at, owner_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          patient.patientId,
          patient.data,
          patient.result || null,
          patient.savedAt,
          patient.updatedAt || patient.savedAt,
          newOwnerId || null
        ]
      );
      console.log(`  ✓ Migrated patient: ${patient.patientId}`);
    }
    console.log(`✅ Migrated ${patients.length} patients\n`);

    // Migrate activity logs
    console.log('📝 Migrating activity logs...');
    const activities = sqlite.prepare('SELECT * FROM activity').all();
    
    for (const activity of activities as any[]) {
      const newUserId = activity.userId ? userIdMap.get(activity.userId) : null;
      
      await pg.query(
        `INSERT INTO activity (user_id, action, meta, created_at)
         VALUES ($1, $2, $3, $4)`,
        [
          newUserId || null,
          activity.action,
          activity.meta || null,
          activity.createdAt
        ]
      );
    }
    console.log(`✅ Migrated ${activities.length} activity logs\n`);

    // Create indexes
    console.log('🔍 Creating indexes...');
    await pg.query(`
      CREATE INDEX IF NOT EXISTS idx_patients_owner_id ON patients(owner_id);
      CREATE INDEX IF NOT EXISTS idx_patients_saved_at ON patients(saved_at DESC);
      CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    console.log('✅ Indexes created\n');

    console.log('🎉 Migration completed successfully!');
    console.log('\nSummary:');
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Patients: ${patients.length}`);
    console.log(`  - Activity Logs: ${activities.length}`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    sqlite.close();
    await pg.end();
  }
}

migrate().catch(console.error);
