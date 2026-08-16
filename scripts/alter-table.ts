import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log("Altering user table...");
  try {
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" boolean;`);
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banReason" text;`);
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banExpires" timestamp;`);
    console.log("Table altered successfully!");
  } catch (error) {
    console.error("Error altering table:", error);
  }
}

main().catch(console.error);
