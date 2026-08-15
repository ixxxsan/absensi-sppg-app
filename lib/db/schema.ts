import { pgTable, text, timestamp, boolean, uuid, decimal, time, date } from "drizzle-orm/pg-core";

// --- BETTER AUTH REQUIRED TABLES ---
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  
  // Custom fields for SPPG
  role: text("role").default('relawan').notNull(), // 'admin' | 'relawan'
  idRelawan: text("id_relawan").unique(),
  noTelepon: text("no_telepon"),
  statusAktif: boolean("status_aktif").default(true),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

// --- CUSTOM TABLES ---
export const absensi = pgTable("absensi", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  tanggalAbsen: date("tanggal_absen").notNull(),
  waktuAbsen: time("waktu_absen").notNull(), // WIB
  tipe: text("tipe").notNull(), // 'masuk' | 'pulang'
  fotoUrl: text("foto_url").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  statusValidasi: text("status_validasi").default('menunggu').notNull(), // 'menunggu' | 'valid' | 'invalid'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
