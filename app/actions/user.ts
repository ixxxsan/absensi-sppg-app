'use server';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getLatestUser() {
  const session = await getServerSession();
  return session?.user ? (await db.select().from(user).where(eq(user.id, session.user.id)).limit(1))[0] || null : null;
}
