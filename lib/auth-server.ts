import { cookies } from 'next/headers';
import { db } from './db';
import { session as sessionTable, user as userTable } from './db/schema';
import { eq } from 'drizzle-orm';

export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('better-auth.session_token')?.value 
             || cookieStore.get('__Secure-better-auth.session_token')?.value;
  
  if (!token) return null;
  
  const sess = await db.query.session.findFirst({
    where: eq(sessionTable.token, token),
    with: { user: true }
  });
  
  if (!sess) return null;
  
  if (sess.expiresAt < new Date()) {
    return null; // Expired
  }
  
  return {
    session: sess,
    user: sess.user
  };
}
