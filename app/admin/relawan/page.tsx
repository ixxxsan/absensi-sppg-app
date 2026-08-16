import ClientRelawan from './ClientRelawan';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function RelawanPage() {
  // Server-side auth guard — prevent unauthorized access to relawan data
  const session = await getServerSession();
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
    redirect('/admin/login');
  }

  const relawans = await db.select().from(user).where(eq(user.role, 'relawan')).orderBy(asc(user.createdAt));
  
  return <ClientRelawan initialData={relawans} />;
}
