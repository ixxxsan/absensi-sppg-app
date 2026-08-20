import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { Toaster } from "@/components/Toaster";
import 'goey-toast/styles.css';
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Absensi Relawan SPPG",
  description: "Aplikasi absensi digital untuk relawan SPPG. Absen cepat dari lapangan dengan kamera dan GPS.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SPPG Absen",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#10B981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${outfit.className} antialiased text-slate-800 bg-[#f9fafb] selection:bg-emerald-500/30`}>
        <Toaster />
        {children}
      </body>
    </html>
  );
}
