CREATE INDEX "absensi_user_id_idx" ON "absensi" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "absensi_tanggal_absen_idx" ON "absensi" USING btree ("tanggal_absen");--> statement-breakpoint
CREATE INDEX "cuti_user_id_idx" ON "cuti" USING btree ("user_id");