import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log("Altering absensi table...");
  try {
    await db.execute(sql`ALTER TABLE "absensi" ADD COLUMN IF NOT EXISTS "catatan_sistem" text;`);
    console.log("Table altered successfully!");
  } catch (error) {
    console.error("Error altering table:", error);
  }
}

main().catch(console.error);
