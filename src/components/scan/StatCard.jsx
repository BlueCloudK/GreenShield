export function StatCard({ label, value, icon: Icon, tone = "emerald" }) {
  const tones = {
    emerald: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
    cyan: "border-cyan-300/20 bg-cyan-300/10 text-cyan-200",
    amber: "border-amber-300/20 bg-amber-300/10 text-amber-100",
    rose: "border-rose-300/20 bg-rose-300/10 text-rose-200",
  };

  return (
    <div className="glass-panel rounded-3xl p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        {Icon ? (
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${tones[tone]}`}>
            <Icon size={20} aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-4xl font-black text-white">{value}</p>
    </div>
  );
}
