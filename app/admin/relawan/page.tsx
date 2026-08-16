import ClientRelawan from './ClientRelawan';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function RelawanPage() {
  const relawans = await db.select().from(user).where(eq(user.role, 'relawan')).orderBy(asc(user.createdAt));
  
  return <ClientRelawan initialData={relawans} />;
}
