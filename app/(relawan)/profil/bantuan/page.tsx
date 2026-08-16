'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronDown, MessageCircle, Info } from 'lucide-react';

export default function BantuanPage() {
  const router = useRouter();
  
  const faqs = [
    {
      q: "Bagaimana cara melakukan absensi?",
      a: "Pilih menu 'Kamera' di beranda, pastikan Anda berada di lokasi SPPG Teluknaga 03, lalu ambil foto selfie. Sistem akan memvalidasi lokasi Anda secara otomatis."
    },
    {
      q: "Apa yang harus dilakukan jika lokasi tidak akurat?",
      a: "Pastikan GPS/Lokasi di HP Anda aktif. Coba refresh halaman, atau berpindah ke area luar ruangan yang tidak terhalang atap agar sinyal GPS lebih baik."
    },
    {
      q: "Bagaimana cara mengajukan cuti?",
      a: "Buka menu 'Profil', pilih 'Ajukan Cuti / Izin', isi form dengan lengkap, dan tunggu persetujuan dari Admin."
    },
    {
      q: "Kenapa absensi saya ditolak?",
      a: "Absensi bisa ditolak jika Anda berada di luar radius lokasi SPPG Teluknaga 03 yang telah ditentukan, atau foto wajah tidak terlihat jelas."
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleContactAdmin = () => {
    window.open("https://wa.me/6285111604412", "_blank");
  };

  return (
    <div className="min-h-dvh flex flex-col pt-safe pb-24 relative"
         style={{ background: 'radial-gradient(ellipse at top, #0c2860 0%, #071e49 60%)' }}>
      
      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md active:scale-95 transition-transform">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-xl font-bold">Bantuan & FAQ</h1>
      </header>

      <div className="flex-1 px-5 mt-4 overflow-y-auto space-y-6">
        
        {/* Hubungi Admin */}
        <section>
          <div className="card p-5 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-lg"
                 style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-white font-bold mb-1">Butuh Bantuan Langsung?</h2>
            <p className="text-slate-400 text-sm mb-4">Tim admin kami siap membantu kendala Anda.</p>
            <button 
              onClick={handleContactAdmin}
              className="px-6 py-2.5 rounded-full font-bold text-white text-sm tracking-wide transition-all active:scale-[0.98]"
              style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.5)' }}
            >
              Hubungi Admin via WA
            </button>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section>
          <h2 className="text-slate-300 text-sm font-bold mb-3 uppercase tracking-wider">Pertanyaan Umum (FAQ)</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="card overflow-hidden">
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-white/5"
                >
                  <span className="text-white font-semibold pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''}`} />
                </button>
                <div 
                  className="transition-all duration-300 ease-in-out overflow-hidden"
                  style={{ 
                    maxHeight: openIndex === index ? '200px' : '0px',
                    opacity: openIndex === index ? 1 : 0
                  }}
                >
                  <div className="p-4 pt-0 text-slate-400 text-sm border-t border-white/5">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Info Aplikasi */}
        <section className="flex flex-col items-center justify-center py-6">
          <Info className="w-6 h-6 text-slate-500 mb-2" />
          <p className="text-slate-500 text-xs font-semibold">Absensi Relawan SPPG</p>
          <p className="text-slate-600 text-[10px]">Versi 1.0.0 (Beta)</p>
        </section>

      </div>
    </div>
  );
}
