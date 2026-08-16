import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  const res = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`);
  console.log(res);
}

main().catch(console.error);
