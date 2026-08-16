CREATE TABLE "cuti" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"jenis_cuti" text NOT NULL,
	"tanggal_mulai" date NOT NULL,
	"tanggal_selesai" date NOT NULL,
	"alasan" text NOT NULL,
	"status" text DEFAULT 'Menunggu' NOT NULL,
	"tanggal_pengajuan" date DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "absensi" ADD COLUMN "catatan_sistem" text;--> statement-breakpoint
ALTER TABLE "cuti" ADD CONSTRAINT "cuti_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;