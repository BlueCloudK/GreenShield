import { getRiskLevelLabel } from "../../utils/reportLabels";

const riskStyles = {
  Low: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  Medium: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  High: "border-rose-300/30 bg-rose-300/10 text-rose-100",
  Critical: "border-rose-300/30 bg-rose-300/10 text-rose-100",
};

export function RiskBadge({ level }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
        riskStyles[level] || "border-slate-500/30 bg-slate-500/10 text-slate-200"
      }`}
    >
      {getRiskLevelLabel(level)}
    </span>
  );
}
