const styles = {
  Starter: "bg-emerald-400/10 text-emerald-200 ring-emerald-300/20",
  Popular: "bg-cyan-300/15 text-cyan-100 ring-cyan-300/30",
  Advanced: "bg-violet-400/15 text-violet-100 ring-violet-300/30",
  Enterprise: "bg-amber-300/15 text-amber-100 ring-amber-300/30",
};

export function Badge({ children }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
        styles[children] || "bg-slate-500/10 text-slate-200 ring-slate-400/20"
      }`}
    >
      {children}
    </span>
  );
}
