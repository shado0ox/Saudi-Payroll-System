import { Pool } from 'pg';
import 'dotenv/config';

export const db = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'payroll_db',
  user: process.env.DB_USER || 'payroll_user',
  password: process.env.DB_PASSWORD,
  max: 10,
});

export async function testDatabaseConnection() {
  const result = await db.query(
    'SELECT current_database() AS database, current_user AS user'
  );

  console.log('PostgreSQL connected:', result.rows[0]);
}
