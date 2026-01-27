import { neon } from '@neondatabase/serverless';

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(process.env.DATABASE_URL);
}

// Initialize database tables
export async function initDb() {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      contact_name VARCHAR(255) NOT NULL,
      store_name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      city VARCHAR(100),
      state VARCHAR(50),
      interests TEXT[],
      temperature VARCHAR(20) NOT NULL,
      notes TEXT,
      created_by VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    )
  `;

  return { success: true };
}
