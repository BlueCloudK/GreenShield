import { getScanStatusLabel } from "../../utils/reportLabels";

const statusStyles = {
  Completed: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  Running: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  "Retest Pending": "border-amber-300/30 bg-amber-300/10 text-amber-100",
  Failed: "border-rose-300/30 bg-rose-300/10 text-rose-100",
};

export function ScanStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
        statusStyles[status] || "border-slate-500/30 bg-slate-500/10 text-slate-200"
      }`}
    >
      {getScanStatusLabel(status)}
    </span>
  );
}
