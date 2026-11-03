"use client";

import React, { useState } from "react";
import { useForm, UseFormRegister, UseFormWatch, UseFormSetValue, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { upsertMenu, getMenuByDate, MenuNutrition } from "@/app/actions/menu";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { goeyToast } from "goey-toast";

import { QrCode, X, Download, Loader2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Jakarta");

const getTodayWib = () => dayjs().tz("Asia/Jakarta").format("YYYY-MM-DD");

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
  const [fetchingMenu, setFetchingMenu] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [existingMenu, setExistingMenu] = useState<{
    id?: string;
    fotoPorsiKecilUrl?: string;
    fotoPorsiBesarUrl?: string;
    fotoBumilUrl?: string;
  } | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setQrUrl(`${window.location.origin}/menu-hari-ini`);
    }
  }, []);

  const { register, handleSubmit, watch, setValue, reset } = useForm<MenuForm>({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      tanggal: getTodayWib(),
      namaMenu: "",
      giziPorsiKecil: { energi: 0, protein: 0, lemak: 0, karbohidrat: 0, serat: 0 },
      giziPorsiBesar: { energi: 0, protein: 0, lemak: 0, karbohidrat: 0, serat: 0 },
      giziBumil: { energi: 0, protein: 0, lemak: 0, karbohidrat: 0, serat: 0 },
    }
  });

  const selectedDate = watch("tanggal");
  const lastLoadedDateRef = React.useRef<string | null>(null);
  const isFetchingRef = React.useRef<boolean>(false);

  const loadMenuForDate = React.useCallback(async (dateStr: string) => {
    if (!dateStr) return;
    
    // Prevent duplicate / looped loads for the exact same date
    if (lastLoadedDateRef.current === dateStr || isFetchingRef.current) return;
    lastLoadedDateRef.current = dateStr;
    isFetchingRef.current = true;

    const day = dayjs(dateStr).day();
    if (day === 0 || day === 6) {
      goeyToast.error("Sabtu dan Minggu libur. Silakan pilih tanggal lain.");
      setExistingMenu(null);
      reset({
        tanggal: dateStr,
        namaMenu: "",
        giziPorsiKecil: { energi: 0, protein: 0, lemak: 0, karbohidrat: 0, serat: 0 },
        giziPorsiBesar: { energi: 0, protein: 0, lemak: 0, karbohidrat: 0, serat: 0 },
        giziBumil: { energi: 0, protein: 0, lemak: 0, karbohidrat: 0, serat: 0 },
      });
      isFetchingRef.current = false;
      return;
    }

    setFetchingMenu(true);
    try {
      const data = await getMenuByDate(dateStr);
      if (data) {
        setExistingMenu(data);
        const giziKecil = (data.giziPorsiKecil as unknown as MenuNutrition) || { energi: 0, protein: 0, lemak: 0, karbohidrat: 0, serat: 0 };
        const giziBesar = (data.giziPorsiBesar as unknown as MenuNutrition) || { energi: 0, protein: 0, lemak: 0, karbohidrat: 0, serat: 0 };
        const giziBumil = (data.giziBumil as unknown as MenuNutrition) || { energi: 0, protein: 0, lemak: 0, karbohidrat: 0, serat: 0 };
        reset({
          tanggal: dateStr,
          namaMenu: data.namaMenu || "",
          giziPorsiKecil: {
            energi: Number(giziKecil.energi) || 0,
            protein: Number(giziKecil.protein) || 0,
            lemak: Number(giziKecil.lemak) || 0,
            karbohidrat: Number(giziKecil.karbohidrat) || 0,
            serat: Number(giziKecil.serat) || 0,
          },
          giziPorsiBesar: {
            energi: Number(giziBesar.energi) || 0,
            protein: Number(giziBesar.protein) || 0,
            lemak: Number(giziBesar.lemak) || 0,
            karbohidrat: Number(giziBesar.karbohidrat) || 0,
            serat: Number(giziBesar.serat) || 0,
          },
          giziBumil: {
            energi: Number(giziBumil.energi) || 0,
            protein: Number(giziBumil.protein) || 0,
            lemak: Number(giziBumil.lemak) || 0,
            karbohidrat: Number(giziBumil.karbohidrat) || 0,
            serat: Number(giziBumil.serat) || 0,
          },
        });
        goeyToast.success("Memuat menu yang sudah ada untuk tanggal ini.");
      } else {
        setExistingMenu(null);
        reset({
          tanggal: dateStr,
          namaMenu: "",
          giziPorsiKecil: { energi: 0, protein: 0, lemak: 0, karbohidrat: 0, serat: 0 },
          giziPorsiBesar: { energi: 0, protein: 0, lemak: 0, karbohidrat: 0, serat: 0 },
          giziBumil: { energi: 0, protein: 0, lemak: 0, karbohidrat: 0, serat: 0 },
        });
      }
    } catch (err) {
      console.error("Gagal mengambil menu:", err);
      goeyToast.error("Gagal memuat menu.");
    } finally {
      setFetchingMenu(false);
      isFetchingRef.current = false;
    }
  }, [reset]);

  React.useEffect(() => {
    if (selectedDate) {
      loadMenuForDate(selectedDate);
    }
  }, [selectedDate, loadMenuForDate]);

  const shiftDate = (delta: number) => {
    const current = dayjs(selectedDate || getTodayWib());
    let next = current.add(delta, 'day');
    if (next.day() === 6) next = next.add(delta > 0 ? 2 : -1, 'day');
    else if (next.day() === 0) next = next.add(delta > 0 ? 1 : -2, 'day');
    setValue("tanggal", next.format('YYYY-MM-DD'));
  };

  const goToToday = () => {
    let today = dayjs().tz("Asia/Jakarta");
    if (today.day() === 6) today = today.add(2, 'day');
    else if (today.day() === 0) today = today.add(1, 'day');
    setValue("tanggal", today.format('YYYY-MM-DD'));
  };

  const handleUpload = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
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
      setExistingMenu(input);
      lastLoadedDateRef.current = input.tanggal;
      goeyToast.success("Berhasil menyimpan menu!");
    } catch (err: unknown) {
      goeyToast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    try {
      const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement;
      if (!canvas) throw new Error("Canvas not found");
      const url = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = url;
      link.download = 'QR-Code-Menu-Hari-Ini.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      goeyToast.error("Gagal mengunduh QR Code");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto text-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Manajemen Menu Hari Ini</h1>
        <button 
          onClick={() => setShowQR(true)}
          className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50 transition-colors shadow-sm"
        >
          <QrCode className="w-5 h-5" />
          Lihat QR Code
        </button>
      </div>

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center relative">
            <button 
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-center mb-2 mt-2">QR Code Menu</h2>
            <p className="text-sm text-slate-500 text-center mb-6">
              Satu QR Code ini berlaku selamanya untuk mengakses halaman <span className="font-semibold text-emerald-600">/menu-hari-ini</span>
            </p>
            
            <div className="p-4 bg-white border-2 border-slate-100 rounded-xl mb-6 shadow-sm flex items-center justify-center">
              {qrUrl ? (
                <QRCodeCanvas 
                  id="qr-canvas"
                  value={qrUrl}
                  size={192}
                  level={"H"}
                  includeMargin={true}
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400">Loading...</div>
              )}
            </div>

            <button 
              onClick={handleDownloadQR}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Unduh QR Code
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs gap-2 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-700">Tanggal Terpilih: {dayjs(selectedDate).format("dddd, DD MMMM YYYY")}</span>
          {existingMenu ? (
            <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">Menu Ditemukan di Database</span>
          ) : (
            <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full">Belum Ada Menu (Form Kosong)</span>
          )}
        </div>
        {existingMenu && existingMenu.id && (
          <span className="text-slate-400 font-mono text-[11px]">ID: {existingMenu.id}</span>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold flex items-center gap-2">
                <span>Tanggal Menu</span>
                {fetchingMenu && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => shiftDate(-1)}
                  title="Hari Kerja Sebelumnya"
                  className="px-2 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  &larr; Prev
                </button>
                <button
                  type="button"
                  onClick={() => goToToday()}
                  title="Hari Kerja Ini"
                  className="px-2 py-0.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded transition-colors"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => shiftDate(1)}
                  title="Hari Kerja Berikutnya"
                  className="px-2 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
            <input 
              type="date" 
              {...register("tanggal")} 
              onChange={(e) => {
                setValue("tanggal", e.target.value);
              }}
              className="w-full p-2 border rounded" 
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Nama Menu</label>
            <input 
              type="text" 
              {...register("namaMenu")} 
              value={watch("namaMenu") || ""}
              onChange={(e) => setValue("namaMenu", e.target.value, { shouldDirty: true, shouldValidate: true })}
              className="w-full p-2 border rounded" 
              placeholder="Contoh: Nasi Ayam Bakar" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NutritionCard title="Porsi Kecil" namePrefix="giziPorsiKecil" filePrefix="fotoPorsiKecil" register={register} setValue={setValue} existingPhoto={existingMenu?.fotoPorsiKecilUrl} watch={watch} />
          <NutritionCard title="Porsi Besar" namePrefix="giziPorsiBesar" filePrefix="fotoPorsiBesar" register={register} setValue={setValue} existingPhoto={existingMenu?.fotoPorsiBesarUrl} watch={watch} />
          <NutritionCard title="Bumil / Busui" namePrefix="giziBumil" filePrefix="fotoBumil" register={register} setValue={setValue} existingPhoto={existingMenu?.fotoBumilUrl} watch={watch} />
        </div>

        <button disabled={loading} type="submit" className="w-full bg-emerald-600 text-white p-3 rounded-lg font-bold hover:bg-emerald-700">
          {loading ? "Menyimpan..." : "Simpan Menu"}
        </button>
      </form>
    </div>
  );
}

interface NutritionCardProps {
  title: string;
  namePrefix: "giziPorsiKecil" | "giziPorsiBesar" | "giziBumil";
  filePrefix: FieldPath<MenuForm>;
  register: UseFormRegister<MenuForm>;
  setValue: UseFormSetValue<MenuForm>;
  existingPhoto?: string;
  watch: UseFormWatch<MenuForm>;
}

function NutritionCard({ title, namePrefix, filePrefix, register, setValue, existingPhoto, watch }: NutritionCardProps) {
  const fileValue = watch(filePrefix);
  const selectedFile = fileValue && (fileValue as FileList).length > 0 ? (fileValue as FileList)[0] : null;
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
        {["energi", "protein", "lemak", "karbohidrat", "serat"].map((field) => {
          const fieldName = `${namePrefix}.${field}` as FieldPath<MenuForm>;
          const val = watch(fieldName);
          return (
            <div key={field} className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize text-slate-700">{field}</span>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  step="any" 
                  {...register(fieldName, { valueAsNumber: true })} 
                  value={val !== undefined && val !== null ? val : 0}
                  onChange={(e) => {
                    const parsed = e.target.value === "" ? 0 : parseFloat(e.target.value);
                    setValue(fieldName, isNaN(parsed) ? 0 : parsed, { shouldDirty: true, shouldValidate: true });
                  }}
                  className="w-24 p-2 border rounded-lg text-right text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                />
                <span className="text-xs text-slate-400 w-8">{field === 'energi' ? 'kkal' : 'g'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
