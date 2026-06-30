import { Bot, DatabaseZap, KeyRound, Radar, ShieldCheck, Workflow } from "lucide-react";

const surfaceNodes = [
  { label: "RAG", icon: DatabaseZap, className: "left-[13%] top-[25%]" },
  { label: "Tools", icon: Workflow, className: "right-[12%] top-[31%]" },
  { label: "API", icon: KeyRound, className: "bottom-[22%] right-[23%]" },
  { label: "LLM", icon: Bot, className: "bottom-[19%] left-[22%]" },
];

export function AttackSurfaceVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[460px] overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#071018] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.30)] sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_52%_44%,rgba(52,211,153,0.20),transparent_31%),linear-gradient(135deg,rgba(20,184,166,0.12),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:38px_38px]" />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-white">AI attack surface</p>
        </div>
        <Radar className="gs-spin-slow text-emerald-200" size={16} aria-hidden="true" />
      </div>

      <div className="relative mt-4 aspect-[1.5] min-h-[240px] sm:min-h-[280px]">
        <div className="absolute inset-[12%] rounded-full border border-emerald-300/10" />
        <div className="absolute inset-[22%] rounded-full border border-cyan-300/10" />
        <div className="gs-scan-sweep absolute inset-[8%] rounded-full" />
        <div className="gs-orbit absolute inset-[13%] rounded-full border border-dashed border-white/10" />

        <div className="absolute left-1/2 top-1/2 z-10 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[1.35rem] border border-emerald-300/30 bg-slate-950/90 text-center shadow-[0_0_44px_rgba(16,185,129,0.18)] sm:h-28 sm:w-28">
          <ShieldCheck className="text-emerald-200" size={26} aria-hidden="true" />
          <p className="mt-2 text-sm font-black text-white">Policy core</p>
        </div>

        {surfaceNodes.map(({ label, icon: Icon, className }) => (
          <div
            className={`gs-node-pulse absolute z-20 rounded-xl border border-white/10 bg-slate-950/85 px-3 py-2 shadow-[0_16px_50px_rgba(0,0,0,0.22)] ${className}`}
            key={label}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-300/10 text-emerald-200">
                <Icon size={14} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-black text-white sm:text-sm">{label}</p>
              </div>
            </div>
          </div>
        ))}

        <div className="gs-probe-a absolute left-[29%] top-[31%] h-px w-[22%] rotate-[28deg] bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
        <div className="gs-probe-b absolute right-[28%] top-[37%] h-px w-[24%] -rotate-[24deg] bg-gradient-to-r from-transparent via-cyan-200 to-transparent" />
        <div className="gs-probe-c absolute bottom-[31%] left-[31%] h-px w-[28%] -rotate-[38deg] bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
      </div>
    </div>
  );
}
