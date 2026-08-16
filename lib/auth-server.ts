import { cookies } from 'next/headers';
import { db } from './db';
import { session as sessionTable, user as userTable } from './db/schema';
import { eq } from 'drizzle-orm';

export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('better-auth.session_token')?.value 
             || cookieStore.get('__Secure-better-auth.session_token')?.value;
  
  if (!token) return null;
  
  const sess = await db.select().from(sessionTable).where(eq(sessionTable.token, token)).limit(1);
  if (!sess || sess.length === 0) return null;
  
  if (sess[0].expiresAt < new Date()) {
    return null; // Expired
  }
  
  const usr = await db.select().from(userTable).where(eq(userTable.id, sess[0].userId)).limit(1);
  if (!usr || usr.length === 0) return null;
  
  return {
    session: sess[0],
    user: usr[0]
  };
}
