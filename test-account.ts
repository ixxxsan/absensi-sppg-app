import { db } from './lib/db';
import { user, account } from './lib/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
  const email = "admin@sppg.com"; // We know this user exists
  const u = await db.query.user.findFirst({ where: eq(user.email, email) });
  if (!u) { console.log("User not found"); return; }
  
  const acc = await db.query.account.findFirst({ where: eq(account.userId, u.id) });
  console.log("Account info:", acc);
}
run();
