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
    
    // SECURITY NOTE: We intentionally omit origin, host, and referer headers.
    // This avoids Better Auth's CSRF protection which incorrectly blocks
    // Server Actions on some Vercel deployments. This is a documented trade-off:
    // - Next.js Server Actions already include built-in CSRF protection.
    // - The session cookie is HttpOnly + SameSite, providing baseline CSRF defense.
    // - Residual risk: reduced defense-in-depth for CSRF.
    const session = await auth.api.getSession({ headers: mockHeaders });
    return session;
  } catch (error) {
    console.error('getServerSession error:', error);
    return null;
  }
}
