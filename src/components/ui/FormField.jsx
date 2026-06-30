export function FormField({ label, name, error, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <div className="mt-2">{children}</div>
      {error ? <span className="mt-2 block text-sm text-rose-300">{error}</span> : null}
    </label>
  );
}

export const inputClasses =
  "focus-ring w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-cyan-300/60";
