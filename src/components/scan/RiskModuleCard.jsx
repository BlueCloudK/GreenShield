import { CheckCircle2 } from "lucide-react";
import { getModuleLabel } from "../../utils/reportLabels";

export function RiskModuleCard({ module, selected, onToggle }) {
  return (
    <button
      className={`focus-ring rounded-3xl border p-5 text-left transition ${
        selected
          ? "border-emerald-300/45 bg-emerald-300/10 shadow-[0_0_32px_rgba(74,222,128,0.12)]"
          : "border-white/10 bg-white/[0.045] hover:border-emerald-300/30"
      }`}
      onClick={onToggle}
      type="button"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-black text-white">{getModuleLabel(module)}</h3>
        {selected ? <CheckCircle2 className="text-emerald-300" size={20} aria-hidden="true" /> : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        Đưa module này vào phiên kiểm thử và tạo phát hiện có bằng chứng nếu phát hiện rủi ro.
      </p>
    </button>
  );
}
