import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log("Altering user table...");
  try {
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" boolean;`);
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banReason" text;`);
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banExpires" timestamp;`);
    
    // Custom SPPG fields
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text NOT NULL DEFAULT 'relawan';`);
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "id_relawan" text;`);
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "no_telepon" text;`);
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "status_aktif" boolean DEFAULT true;`);
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "nik" text;`);
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "divisi" text;`);
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'Aktif';`);
    
    console.log("Table altered successfully!");
  } catch (error) {
    console.error("Error altering table:", error);
  }
}

main().catch(console.error);
