import { auth } from './auth';
import { cookies } from 'next/headers';

export async function getServerSession() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieString = allCookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    const mockHeaders = new Headers();
    if (cookieString) {
      mockHeaders.set('cookie', cookieString);
    }
    
    // We only pass the cookie header. 
    // By omitting origin, host, and referer, we avoid triggering Better Auth's CSRF
    // protection which incorrectly blocks Server Actions on some Vercel deployments.
    const session = await auth.api.getSession({ headers: mockHeaders });
    return session;
  } catch (error) {
    console.error('getServerSession error:', error);
    return null;
  }
}
