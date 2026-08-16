import { db } from '../lib/db';
import { user } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const relawans = await db.select().from(user).where(eq(user.role, 'relawan'));
    console.log("Total relawan from DB directly:", relawans.length);
    console.log(relawans);
    process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
