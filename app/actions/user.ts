'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

export async function getLatestUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const records = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
  return records[0] || null;
}
