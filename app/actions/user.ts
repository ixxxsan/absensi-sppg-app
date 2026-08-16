'use server';

import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getLatestUser() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const records = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
  return records[0] || null;
}
