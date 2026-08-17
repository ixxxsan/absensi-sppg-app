import { Loader2 } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="flex h-full min-h-[60vh] w-full flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-[#071e49]" />
      <p className="text-sm font-medium text-slate-500 animate-pulse">
        Memuat data...
      </p>
    </div>
  );
}
