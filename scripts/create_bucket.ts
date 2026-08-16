import 'dotenv/config';
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log("Membuat bucket bukti-cuti...");
    await db.execute(sql`
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES ('bukti-cuti', 'bukti-cuti', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','application/pdf']::text[])
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log("Bucket bukti-cuti berhasil dibuat (atau sudah ada).");

    console.log("Membuat policy untuk public access...");
    
    // Upload policy
    await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'public_uploads_bukti_cuti'
          ) THEN
              CREATE POLICY "public_uploads_bukti_cuti" ON storage.objects FOR INSERT TO public WITH CHECK ( bucket_id = 'bukti-cuti' );
          END IF;
      END
      $$;
    `);

    // Select policy
    await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'public_select_bukti_cuti'
          ) THEN
              CREATE POLICY "public_select_bukti_cuti" ON storage.objects FOR SELECT TO public USING ( bucket_id = 'bukti-cuti' );
          END IF;
      END
      $$;
    `);

    // Delete policy
    await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'public_delete_bukti_cuti'
          ) THEN
              CREATE POLICY "public_delete_bukti_cuti" ON storage.objects FOR DELETE TO public USING ( bucket_id = 'bukti-cuti' );
          END IF;
      END
      $$;
    `);

    console.log("Policy berhasil dibuat.");
    process.exit(0);
  } catch (error) {
    console.error("Gagal membuat bucket:", error);
    process.exit(1);
  }
}

main();
