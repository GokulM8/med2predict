// Activity logging for PostgreSQL
import { query } from './db.js';

export interface ActivityLog {
  id?: number;
  user_id?: number;
  action: string;
  meta?: Record<string, unknown>;
  created_at: number;
}

export async function logActivity({ user_id, action, meta }: Omit<ActivityLog, 'id' | 'created_at'>) {
  await query(
    'INSERT INTO activity (user_id, action, meta, created_at) VALUES ($1, $2, $3, $4)',
    [user_id || null, action, meta ? JSON.stringify(meta) : null, Date.now()]
  );
}

export async function listActivity(limit = 200): Promise<ActivityLog[]> {
  const result = await query(
    'SELECT * FROM activity ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  
  return result.rows.map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    action: row.action,
    meta: row.meta,
    created_at: row.created_at,
  }));
}
