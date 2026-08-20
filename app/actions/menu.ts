"use server";

import { db } from "@/lib/db";
import { menuHarian } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Jakarta");

export type MenuNutrition = {
  energi: number;
  protein: number;
  lemak: number;
  karbohidrat: number;
  serat: number;
};

export type MenuInput = {
  tanggal: string; // YYYY-MM-DD
  namaMenu: string;
  fotoPorsiKecilUrl: string;
  fotoPorsiBesarUrl: string;
  fotoBumilUrl: string;
  giziPorsiKecil: MenuNutrition;
  giziPorsiBesar: MenuNutrition;
  giziBumil: MenuNutrition;
};

export async function getMenuHariIni() {
  const today = dayjs().tz("Asia/Jakarta").format("YYYY-MM-DD");
  
  const result = await db.select().from(menuHarian).where(eq(menuHarian.tanggal, today)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getMenuByDate(dateStr: string) {
  const result = await db.select().from(menuHarian).where(eq(menuHarian.tanggal, dateStr)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertMenu(data: MenuInput) {
  // Check if weekend
  const dateObj = dayjs(data.tanggal);
  const dayOfWeek = dateObj.day(); // 0 is Sunday, 6 is Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    throw new Error("Tidak dapat mengatur menu pada hari Sabtu atau Minggu (Libur).");
  }

  // Check if exists
  const existing = await getMenuByDate(data.tanggal);

  if (existing) {
    // Update
    const result = await db.update(menuHarian).set({
      ...data,
      updatedAt: new Date()
    }).where(eq(menuHarian.id, existing.id)).returning();
    return result[0];
  } else {
    // Insert
    const result = await db.insert(menuHarian).values({
      ...data
    }).returning();
    return result[0];
  }
}
