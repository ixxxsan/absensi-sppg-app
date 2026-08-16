import { auth } from '../lib/auth';
import { db } from '../lib/db';
import { user } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import * as schema from '../lib/db/schema';

process.env.BETTER_AUTH_URL = "http://localhost:3000";

async function main() {
  console.log("Creating admin user...");
  try {
    // Clean up if exists
    const existingAdmin = await db.query.user.findFirst({
      where: eq(user.email, "admin@sppg.com")
    });
    if (existingAdmin) {
      await db.delete(schema.session).where(eq(schema.session.userId, existingAdmin.id));
      await db.delete(schema.account).where(eq(schema.account.userId, existingAdmin.id));
      await db.delete(user).where(eq(user.id, existingAdmin.id));
    }

    const result = await auth.api.signUpEmail({
      headers: new Headers(),
      body: {
        email: "admin@sppg.com",
        password: "Teluknagahebat123",
        name: "Admin SPPG"
      }
    });
    console.log("User created via signUpEmail:", result.user.id);
    
    // Update additional fields via Drizzle
    await db.update(user).set({
      role: "admin",
      nik: "0000000000000000",
      divisi: "Administrator",
      status: "Aktif",
      idRelawan: "ADMIN-001",
      noTelepon: "080000000000",
      statusAktif: true
    }).where(eq(user.id, result.user.id));
    
    console.log("Admin user successfully seeded!");
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

main().catch(console.error);
