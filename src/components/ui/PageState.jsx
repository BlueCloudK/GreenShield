import { AlertCircle, LoaderCircle } from "lucide-react";

export function LoadingState({ label = "Đang tải dữ liệu..." }) {
  return <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-400"><LoaderCircle className="animate-spin" size={18} />{label}</div>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-lg border border-rose-400/20 bg-rose-400/[0.06] p-5 text-sm text-rose-100">
      <div className="flex items-center gap-2 font-bold"><AlertCircle size={17} />Không thể tải dữ liệu</div>
      <p className="mt-2 text-rose-100/80">{message}</p>
      {onRetry ? <button className="focus-ring mt-3 rounded-lg border border-rose-300/20 px-3 py-2 font-bold" onClick={onRetry} type="button">Thử lại</button> : null}
    </div>
  );
}

