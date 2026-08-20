"use client";

import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { 
  AlertTriangle, 
  Ban, 
  Hourglass, 
  Calendar, 
  UtensilsCrossed, 
  Utensils, 
  Baby, 
  Zap, 
  Drumstick, 
  Droplet, 
  Wheat, 
  Leaf 
} from "lucide-react";

export type MenuNutrition = {
  energi: number;
  protein: number;
  lemak: number;
  karbohidrat: number;
  serat: number;
};

export type MenuData = {
  tanggal: string; // "Senin, 15 Januari 2024" or localized string
  namaMenu: string;
  porsi: {
    label: string;
    icon: React.ReactNode;
    img: string;
    nutrition: MenuNutrition;
  }[];
};

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, { stiffness: 300, damping: 30 });
  const rounded = useTransform(springValue, (latest) => Math.round(latest));

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return <motion.span>{rounded}</motion.span>;
}

export default function MenuClient({ data }: { data: MenuData }) {
  const [activeTab, setActiveTab] = useState(2); // Default to Bumil (index 2)
  const [currentImg, setCurrentImg] = useState(data.porsi[2].img);
  const [imgOpacity, setImgOpacity] = useState(1);

  const handleTabChange = (index: number) => {
    if (index === activeTab) return;
    setImgOpacity(0);
    setTimeout(() => {
      setActiveTab(index);
      setCurrentImg(data.porsi[index].img);
      setImgOpacity(1);
    }, 250);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#071e49] text-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#071e49] via-[#051636] to-[#020a1f] font-sans pb-16">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#071e49]/70 backdrop-blur-md border-b border-white/10 pt-[env(safe-area-inset-top)]">
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center relative bg-white/5 border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Badan Gizi Nasional Logo"
                className="w-8 h-8 object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5rRPuIqR_zY69ixBv3dLeTCEpm7nkKaa-1HfBEOQtO99LoabysE4drvEUU7JbxrdiVdPZRxspedo1r8QNsPmjeOhPaMMXZi70wWxzoHGb6L5J_SRNxRZ4OPghdT_HVfmUCom4PcVDXMuvlTof_UUr7uRLmtUw20jPuPQoyNjgcorJ0oIpPpj6xXuHzedQccs2qSgt-ADsieKmaFDc7v7UUeK1fIjCvfwl23SLNe9AkJNderHD9xGNorNUYMEXjo2V"
              />
            </div>
            <span className="font-bold text-lg text-white tracking-wide">
              SPPG TELUKNAGA 03
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col w-full max-w-md mx-auto relative px-4 pb-6"
        >
          {/* Warning Banner */}
          <div className="bg-[#fea619]/10 backdrop-blur-md border border-[#fea619]/50 rounded-xl p-4 mb-6 mt-6 relative overflow-hidden shadow-[0_4px_24px_rgba(254,166,25,0.1)]">
            <div className="flex flex-col gap-2 relative z-10">
              <div className="flex items-center gap-2 text-[#fea619] font-bold">
                <AlertTriangle size={20} className="fill-[#fea619] text-[#fea619]/20" />
                WAJIB DIKONSUMSI DI TEMPAT!
              </div>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Ban size={18} />
                Dilarang dibawa pulang.
              </div>
              <div className="flex items-start gap-2 text-white/80 text-sm">
                <Hourglass size={18} className="mt-0.5" />
                <span>
                  Batas aman konsumsi:{" "}
                  <strong className="font-bold text-[#ff8a8a]">
                    MAKSIMAL 2 JAM SETELAH DISAJIKAN.
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg mb-4 border border-white/10 group bg-[#0c2860]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="w-full h-full object-cover transition-opacity duration-200 ease-in-out"
                alt={data.namaMenu}
                src={currentImg}
                style={{ opacity: imgOpacity }}
              />
            </div>
            <div className="flex flex-col gap-1 px-1">
              <h1 className="font-bold text-2xl text-white">{data.namaMenu}</h1>
              <p className="text-sm text-[#b5e0ea] flex items-center gap-1.5 font-mono">
                <Calendar size={16} />
                {data.tanggal}
              </p>
            </div>
          </section>

          {/* Nutrition Section */}
          <section className="mb-4">
            <h2 className="font-bold text-lg text-white mb-4 px-1">
              Kandungan Gizi
            </h2>
            <div className="flex bg-white/5 backdrop-blur-md p-1 mb-6 relative rounded-2xl border border-white/10">
              {/* Animated Slider */}
              <motion.div
                className="absolute top-1 bottom-1 bg-[#b5e0ea] rounded-xl shadow-md"
                style={{ width: "calc(33.333% - 2px)" }}
                initial={false}
                animate={{ left: `calc(${activeTab * 33.333}% + 1px)` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              
              {data.porsi.map((tab, idx) => {
                const isActive = activeTab === idx;
                return (
                  <button
                    key={idx}
                    className={`flex-1 relative z-10 flex flex-col items-center justify-center py-2.5 gap-1 rounded-xl transition-colors duration-200 ${
                      isActive
                        ? "text-[#071e49]"
                        : "text-white/60 hover:text-white/80"
                    }`}
                    onClick={() => handleTabChange(idx)}
                  >
                    {tab.icon}
                    <span className="text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Nutrition List */}
            <div className="flex flex-col gap-3">
              <NutritionRow
                icon={<Zap size={24} className="fill-[#b5e0ea] text-[#b5e0ea]/20" />}
                label="Energi"
                value={data.porsi[activeTab].nutrition.energi}
                unit="kkal"
              />
              <NutritionRow
                icon={<Drumstick size={24} className="fill-[#b5e0ea] text-[#b5e0ea]/20" />}
                label="Protein"
                value={data.porsi[activeTab].nutrition.protein}
                unit="g"
              />
              <NutritionRow
                icon={<Droplet size={24} className="fill-[#b5e0ea] text-[#b5e0ea]/20" />}
                label="Lemak"
                value={data.porsi[activeTab].nutrition.lemak}
                unit="g"
              />
              <NutritionRow
                icon={<Wheat size={24} className="fill-[#b5e0ea] text-[#b5e0ea]/20" />}
                label="Karbohidrat"
                value={data.porsi[activeTab].nutrition.karbohidrat}
                unit="g"
              />
              <NutritionRow
                icon={<Leaf size={24} className="fill-[#b5e0ea] text-[#b5e0ea]/20" />}
                label="Serat"
                value={data.porsi[activeTab].nutrition.serat}
                unit="g"
              />
            </div>
          </section>

          {/* Footer */}
          <footer className="py-8 text-center">
            <p className="text-[10px] text-white/40 font-mono">
              © 2026 SPPG TELUKNAGA 03. All rights reserved.
            </p>
          </footer>
        </motion.div>
      </main>
    </div>
  );
}

function NutritionRow({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#b5e0ea]/20 flex items-center justify-center text-[#b5e0ea]">
          {icon}
        </div>
        <span className="font-semibold text-white">{label}</span>
      </div>
      <span className="font-mono font-bold text-xl text-[#b5e0ea]">
        <AnimatedNumber value={value} />{" "}
        <span className="text-sm font-sans font-normal text-white/60">
          {unit}
        </span>
      </span>
    </div>
  );
}
