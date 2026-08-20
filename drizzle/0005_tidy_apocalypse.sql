CREATE TABLE "menu_harian" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tanggal" date NOT NULL,
	"nama_menu" text NOT NULL,
	"foto_porsi_kecil_url" text NOT NULL,
	"foto_porsi_besar_url" text NOT NULL,
	"foto_bumil_url" text NOT NULL,
	"gizi_porsi_kecil" jsonb NOT NULL,
	"gizi_porsi_besar" jsonb NOT NULL,
	"gizi_bumil" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "menu_harian_tanggal_unique" UNIQUE("tanggal")
);
