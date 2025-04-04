import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

// Veritabanı bağlantı havuzu oluştur
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Drizzle ORM instance'ı oluştur
export const db = drizzle(pool);