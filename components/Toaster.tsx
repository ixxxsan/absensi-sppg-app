"use client";

import { GooeyToaster } from "goey-toast";

export function Toaster() {
  return (
    <GooeyToaster 
      position="top-center"
      theme="dark"
      toastOptions={{
        classNames: {
          toast: 'backdrop-blur-md font-sans border shadow-xl',
          success: 'bg-emerald-950/80 border-emerald-500/30 text-emerald-50',
          error: 'bg-red-950/80 border-red-500/30 text-red-50',
          info: 'bg-[#0c2860]/80 border-[#b5e0ea]/30 text-[#b5e0ea]',
          warning: 'bg-amber-950/80 border-amber-500/30 text-amber-50',
          title: 'font-semibold',
        },
      }}
    />
  );
}
