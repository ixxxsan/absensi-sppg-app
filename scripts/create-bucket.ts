import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log("Creating absensi bucket...");
  try {
    await db.execute(sql`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('absensi', 'absensi', true)
      ON CONFLICT (id) DO UPDATE SET public = true;
    `);
    console.log("Bucket created successfully!");

    // Also need to allow inserts and selects for anon/authenticated roles
    await db.execute(sql`
      CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'absensi');
      CREATE POLICY "Anon Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'absensi');
    `);
    console.log("Storage policies applied!");
  } catch (error: any) {
    // Ignore error if policy already exists
    if (error.message && error.message.includes("already exists")) {
       console.log("Policies already exist.");
    } else {
       console.error("Error creating bucket:", error);
    }
  }
}

main().catch(console.error);
