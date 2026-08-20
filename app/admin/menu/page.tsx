"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { upsertMenu, getMenuByDate } from "@/app/actions/menu";
import dayjs from "dayjs";
import { goeyToast } from "goey-toast";

const nutritionSchema = z.object({
  energi: z.number().min(0),
  protein: z.number().min(0),
  lemak: z.number().min(0),
  karbohidrat: z.number().min(0),
  serat: z.number().min(0),
});

const menuSchema = z.object({
  tanggal: z.string().min(1, "Tanggal harus diisi"),
  namaMenu: z.string().min(3, "Nama menu minimal 3 karakter"),
  
  fotoPorsiKecil: z.any().optional(),
  fotoPorsiBesar: z.any().optional(),
  fotoBumil: z.any().optional(),

  giziPorsiKecil: nutritionSchema,
  giziPorsiBesar: nutritionSchema,
  giziBumil: nutritionSchema,
});

type MenuForm = z.infer<typeof menuSchema>;

export default function AdminMenuPage() {
  const [loading, setLoading] = useState(false);
  const [existingMenu, setExistingMenu] = useState<any>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<MenuForm>({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      tanggal: dayjs().format("YYYY-MM-DD"),
      giziPorsiKecil: { energi: 0, protein: 0, lemak: 0, karbohidrat: 0, serat: 0 },
      giziPorsiBesar: { energi: 0, protein: 0, lemak: 0, karbohidrat: 0, serat: 0 },
      giziBumil: { energi: 0, protein: 0, lemak: 0, karbohidrat: 0, serat: 0 },
    }
  });

  const selectedDate = watch("tanggal");

  React.useEffect(() => {
    if (!selectedDate) return;
    
    const day = dayjs(selectedDate).day();
    if (day === 0 || day === 6) {
      goeyToast.error("Sabtu dan Minggu libur. Silakan pilih tanggal lain.");
      return;
    }

    getMenuByDate(selectedDate).then((data) => {
      if (data) {
        setExistingMenu(data);
        setValue("namaMenu", data.namaMenu);
        setValue("giziPorsiKecil", data.giziPorsiKecil as any);
        setValue("giziPorsiBesar", data.giziPorsiBesar as any);
        setValue("giziBumil", data.giziBumil as any);
        goeyToast.success("Memuat menu yang sudah ada untuk tanggal ini.");
      } else {
        setExistingMenu(null);
        setValue("namaMenu", "");
        setValue("giziPorsiKecil", { energi: 0, protein: 0, lemak: 0, karbohidrat: 0, serat: 0 });
        setValue("giziPorsiBesar", { energi: 0, protein: 0, lemak: 0, karbohidrat: 0, serat: 0 });
        setValue("giziBumil", { energi: 0, protein: 0, lemak: 0, karbohidrat: 0, serat: 0 });
      }
    });
  }, [selectedDate, setValue]);

  const handleUpload = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `menu/${fileName}`;

    const { error: uploadError } = await supabase.storage.from("menu_images").upload(filePath, file);
    if (uploadError) {
      throw uploadError;
    }
    const { data } = supabase.storage.from("menu_images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const onSubmit = async (data: MenuForm) => {
    try {
      setLoading(true);
      const day = dayjs(data.tanggal).day();
      if (day === 0 || day === 6) {
        goeyToast.error("Tidak dapat mengatur menu pada hari libur.");
        return;
      }

      let fotoPorsiKecilUrl = existingMenu?.fotoPorsiKecilUrl || "";
      if (data.fotoPorsiKecil && data.fotoPorsiKecil[0]) {
        fotoPorsiKecilUrl = await handleUpload(data.fotoPorsiKecil[0]);
      } else if (!fotoPorsiKecilUrl) {
        goeyToast.error("Foto Porsi Kecil wajib diisi.");
        return;
      }

      let fotoPorsiBesarUrl = existingMenu?.fotoPorsiBesarUrl || "";
      if (data.fotoPorsiBesar && data.fotoPorsiBesar[0]) {
        fotoPorsiBesarUrl = await handleUpload(data.fotoPorsiBesar[0]);
      } else if (!fotoPorsiBesarUrl) {
        goeyToast.error("Foto Porsi Besar wajib diisi.");
        return;
      }

      let fotoBumilUrl = existingMenu?.fotoBumilUrl || "";
      if (data.fotoBumil && data.fotoBumil[0]) {
        fotoBumilUrl = await handleUpload(data.fotoBumil[0]);
      } else if (!fotoBumilUrl) {
        goeyToast.error("Foto Bumil wajib diisi.");
        return;
      }

      const input = {
        tanggal: data.tanggal,
        namaMenu: data.namaMenu,
        fotoPorsiKecilUrl,
        fotoPorsiBesarUrl,
        fotoBumilUrl,
        giziPorsiKecil: data.giziPorsiKecil,
        giziPorsiBesar: data.giziPorsiBesar,
        giziBumil: data.giziBumil,
      };

      await upsertMenu(input);
      goeyToast.success("Berhasil menyimpan menu!");
    } catch (err: any) {
      goeyToast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto text-slate-800">
      <h1 className="text-2xl font-bold mb-6">Manajemen Menu Hari Ini</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-semibold">Tanggal Menu</label>
            <input type="date" {...register("tanggal")} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Nama Menu</label>
            <input type="text" {...register("namaMenu")} className="w-full p-2 border rounded" placeholder="Contoh: Nasi Ayam Bakar" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NutritionCard title="Porsi Kecil" namePrefix="giziPorsiKecil" filePrefix="fotoPorsiKecil" register={register} existingPhoto={existingMenu?.fotoPorsiKecilUrl} watch={watch} />
          <NutritionCard title="Porsi Besar" namePrefix="giziPorsiBesar" filePrefix="fotoPorsiBesar" register={register} existingPhoto={existingMenu?.fotoPorsiBesarUrl} watch={watch} />
          <NutritionCard title="Bumil / Busui" namePrefix="giziBumil" filePrefix="fotoBumil" register={register} existingPhoto={existingMenu?.fotoBumilUrl} watch={watch} />
        </div>

        <button disabled={loading} type="submit" className="w-full bg-emerald-600 text-white p-3 rounded-lg font-bold hover:bg-emerald-700">
          {loading ? "Menyimpan..." : "Simpan Menu"}
        </button>
      </form>
    </div>
  );
}

function NutritionCard({ title, namePrefix, filePrefix, register, existingPhoto, watch }: any) {
  const fileValue = watch(filePrefix);
  const selectedFile = fileValue && fileValue.length > 0 ? fileValue[0] : null;
  const previewUrl = selectedFile ? URL.createObjectURL(selectedFile) : existingPhoto;

  return (
    <div className="bg-white p-5 border rounded-2xl shadow-sm space-y-5">
      <h3 className="font-bold text-lg text-emerald-700 border-b pb-3">{title}</h3>
      
      <div>
        <label className="block text-sm font-semibold mb-2">Foto Menu</label>
        <input 
          type="file" 
          accept="image/*" 
          {...register(filePrefix)} 
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-emerald-50 file:text-emerald-700
            hover:file:bg-emerald-100
            cursor-pointer" 
        />
        {previewUrl && (
          <div className="mt-4">
            <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">
              {selectedFile ? "Pratinjau Foto Baru:" : "Foto Tersimpan:"}
            </p>
            <img src={previewUrl} alt="Preview" className="w-full h-36 object-cover rounded-xl border border-slate-200 shadow-sm" />
          </div>
        )}
      </div>

      <div className="space-y-3 pt-2">
        {["energi", "protein", "lemak", "karbohidrat", "serat"].map((field) => (
          <div key={field} className="flex items-center justify-between">
            <span className="text-sm font-medium capitalize text-slate-700">{field}</span>
            <div className="flex items-center gap-2">
              <input type="number" {...register(`${namePrefix}.${field}`, { valueAsNumber: true })} className="w-24 p-2 border rounded-lg text-right text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
              <span className="text-xs text-slate-400 w-8">{field === 'energi' ? 'kkal' : 'g'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
