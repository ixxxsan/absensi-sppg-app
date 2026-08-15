import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PWA will be added once next-pwa is confirmed installed
  // Allow mobile testing via IP
  allowedDevOrigins: ['192.168.1.3', '192.168.1.1', 'localhost', '029aafaa4af5df32-103-130-18-153.serveousercontent.com'],

  experimental: {
  },
};

export default nextConfig;
