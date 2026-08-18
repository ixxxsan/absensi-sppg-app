import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { betterFetch } from "@better-fetch/fetch";

// Daftar User Agents bot berbahaya atau scanner otomatis yang sering digunakan untuk serangan
const BLOCKED_USER_AGENTS = [
  'sqlmap',
  'nikto',
  'nmap',
  'zgrab',
  'masscan',
  'python-requests',
];

type Session = {
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
    session: {
        id: string;
        userId: string;
        expiresAt: string;
    };
};

export async function proxy(request: NextRequest) {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';

  // 1. Basic WAF: Block malicious user agents
  for (const bot of BLOCKED_USER_AGENTS) {
    if (userAgent.includes(bot)) {
      return new NextResponse('Forbidden: Malicious activity detected', { status: 403 });
    }
  }

  // 2. Route Protection
  const { data } = await betterFetch<Session>(
      "/api/auth/get-session",
      {
          baseURL: request.nextUrl.origin,
          headers: {
              cookie: request.headers.get("cookie") || "",
          },
      },
  );

  const session = data;

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith('/login') || pathname === '/admin/login' || pathname === '/admin/login/';
  const isAdminRoute = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');
  const isRelawanRoute = ['/beranda', '/kamera', '/riwayat', '/cuti', '/profil'].some(route => pathname.startsWith(route));

  // Handle Unauthenticated
  if (!session) {
      if (isAdminRoute) {
          return NextResponse.redirect(new URL("/admin/login", request.url));
      }
      if (isRelawanRoute) {
          return NextResponse.redirect(new URL("/login", request.url));
      }
      return NextResponse.next();
  }

  // Handle Authenticated trying to access login pages
  if (isAuthRoute) {
      if (session.user.role === 'admin' || session.user.role === 'super_admin') {
          return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      } else {
          return NextResponse.redirect(new URL("/beranda", request.url));
      }
  }

  // Handle Relawan trying to access Admin pages
  if (isAdminRoute && session.user.role === 'relawan') {
      return NextResponse.redirect(new URL("/beranda", request.url));
  }
  
  // Handle Admin trying to access Relawan pages
  if (isRelawanRoute && (session.user.role === 'admin' || session.user.role === 'super_admin')) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo-bgn.png|api/auth).*)',
  ],
};

export default proxy;
