import React from "react";
import { getMenuHariIni } from "@/app/actions/menu";
import dayjs from "dayjs";
import "dayjs/locale/id";
import MenuClient from "./menu-client";
import { UtensilsCrossed, Utensils, Baby, Info } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MenuHariIniPage() {
  const menuData = await getMenuHariIni();

  if (!menuData) {
    return (
      <div className="min-h-screen flex flex-col bg-[#071e49] text-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#071e49] via-[#051636] to-[#020a1f] items-center justify-center p-6">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
          <Info size={32} className="text-[#b5e0ea]" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-center">Belum Ada Menu</h1>
        <p className="text-white/60 text-center max-w-sm">
          Tidak ada jadwal pembagian makanan untuk hari ini atau Admin belum mengatur menu.
        </p>
      </div>
    );
  }

  // Format date to local Indonesian format
  dayjs.locale("id");
  const formattedDate = dayjs(menuData.tanggal).format("dddd, DD MMMM YYYY");

  const formattedMenuData = {
    tanggal: formattedDate,
    namaMenu: menuData.namaMenu,
    porsi: [
      {
        label: "Porsi Kecil",
        icon: <UtensilsCrossed size={20} />,
        img: menuData.fotoPorsiKecilUrl,
        nutrition: menuData.giziPorsiKecil as any,
      },
      {
        label: "Porsi Besar",
        icon: <Utensils size={20} />,
        img: menuData.fotoPorsiBesarUrl,
        nutrition: menuData.giziPorsiBesar as any,
      },
      {
        label: "Bumil/Busui",
        icon: <Baby size={20} />,
        img: menuData.fotoBumilUrl,
        nutrition: menuData.giziBumil as any,
      }
    ]
  };

  return <MenuClient data={formattedMenuData} />;
}
