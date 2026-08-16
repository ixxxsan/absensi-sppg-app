import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Creating cuti table...');
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "cuti" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "jenis_cuti" text NOT NULL,
        "tanggal_mulai" date NOT NULL,
        "tanggal_selesai" date NOT NULL,
        "alasan" text NOT NULL,
        "status" text NOT NULL DEFAULT 'Menunggu',
        "tanggal_pengajuan" date NOT NULL DEFAULT CURRENT_DATE
      );
    `);
    console.log('Table created successfully!');
  } catch (error) {
    console.error('Error creating table:', error);
  }
  process.exit(0);
}

main();
