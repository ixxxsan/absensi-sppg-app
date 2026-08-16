import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log('Adding url_bukti to cuti table...');
    await db.execute(sql`ALTER TABLE cuti ADD COLUMN IF NOT EXISTS url_bukti TEXT;`);
    console.log('Successfully added url_bukti column.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

main();
