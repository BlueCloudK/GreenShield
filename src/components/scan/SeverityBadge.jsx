import { getSeverityLabel } from "../../utils/reportLabels";

const severityStyles = {
  Critical: "border-rose-400/35 bg-rose-400/15 text-rose-100",
  High: "border-rose-300/30 bg-rose-300/10 text-rose-100",
  Warning: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  Medium: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  Low: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  Passed: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
};

export function SeverityBadge({ severity }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
        severityStyles[severity] || "border-slate-500/30 bg-slate-500/10 text-slate-200"
      }`}
    >
      {getSeverityLabel(severity)}
    </span>
  );
}
