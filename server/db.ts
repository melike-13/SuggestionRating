import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';

// Veritabanı bağlantı seçeneği belirleme
let db: any;
let pool: any;

// Vercel serverless ortamı için
if (process.env.VERCEL) {
  const sql = neon(process.env.DATABASE_URL!);
  db = drizzleNeon(sql);
} else {
  // Normal Node.js ortamı için
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });
  db = drizzle(pool);
}

export { db, pool };