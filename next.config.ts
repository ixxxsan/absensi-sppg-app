import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self)' }
];

const nextConfig: NextConfig = {
  // Explicitly enable compression (fixes Site Features warning)
  compress: true,
  // PWA will be added once next-pwa is confirmed installed
  // Allow mobile testing via IP
  allowedDevOrigins: ['192.168.1.3', '192.168.1.1', 'localhost', '8c38365e77d8037d-103-130-18-137.serveousercontent.com'],

  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  images: {
    remotePatterns: [
      // Supabase storage only — restrict to known domains
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
      { protocol: 'https', hostname: 'absensi-sppg-teluknaga03.id' },
    ],
  },
  experimental: {
  },
};

export default nextConfig;
