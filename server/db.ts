import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Always use the new PostgreSQL connection if available
let connectionString;

if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD) {
  connectionString = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
  console.log('Using PostgreSQL credentials:', process.env.PGHOST);
} else {
  connectionString = process.env.DATABASE_URL;
  console.log('Using DATABASE_URL fallback');
}

if (!connectionString) {
  throw new Error('DATABASE_URL or PostgreSQL environment variables are required');
}

console.log('Using database:', connectionString.split('@')[1]?.split('/')[0] || 'unknown');

// Create postgres client with connection pooling and SSL
const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: 'require'
});

export const db = drizzle(sql, { schema });