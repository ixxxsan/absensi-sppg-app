import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Daftar User Agents bot berbahaya atau scanner otomatis yang sering digunakan untuk serangan
const BLOCKED_USER_AGENTS = [
  'sqlmap',
  'nikto',
  'nmap',
  'zgrab',
  'masscan',
  'python-requests',
];

export function proxy(request: NextRequest) {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';

  // 1. Basic WAF: Block malicious user agents
  for (const bot of BLOCKED_USER_AGENTS) {
    if (userAgent.includes(bot)) {
      return new NextResponse('Forbidden: Malicious activity detected', { status: 403 });
    }
  }

  // 2. Admin Route Protection
  const sessionCookie = request.cookies.get('better-auth.session_token') || request.cookies.get('__Secure-better-auth.session_token');
  
  if (request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login') {
    // Check for better-auth session cookie
    if (!sessionCookie?.value) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // 3. Prevent logged-in admin from accessing login page
  // We cannot blindly redirect here because non-admin users (relawan) will also have a session cookie,
  // which causes an infinite loop when the dashboard redirects them back to /admin/login.
  // if (request.nextUrl.pathname === '/admin/login' && sessionCookie?.value) {
  //   return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  // }

  // Lanjutkan request jika aman
  const response = NextResponse.next();
  
  return response;
}

// Hanya jalankan middleware pada route API atau route utama jika diperlukan
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo-bgn.png
     */
    '/((?!_next/static|_next/image|favicon.ico|logo-bgn.png|api/auth).*)',
  ],
};
