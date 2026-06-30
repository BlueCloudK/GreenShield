import { SeverityBadge } from "./SeverityBadge";

export function FindingList({ findings, onSelect, selectedId }) {
  return (
    <div className="gs-scrollbar min-w-0 lg:max-h-[560px] lg:overflow-y-auto">
      <div className="border-b border-white/10 px-3 py-2.5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Findings</p>
        <p className="mt-0.5 text-xs font-semibold text-slate-300">{findings.length} issues found</p>
      </div>

      <div className="divide-y divide-white/10">
        {findings.map((finding) => (
          <button
            className={`focus-ring block w-full px-3 py-3 text-left transition ${
              selectedId === finding.id ? "bg-emerald-300/[0.08]" : "hover:bg-white/[0.035]"
            }`}
            key={finding.id}
            onClick={() => onSelect(finding.id)}
            type="button"
          >
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={finding.severity} />
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-bold text-slate-400">
                {finding.retestStatus}
              </span>
              {finding.fixPriority ? (
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-[11px] font-bold text-emerald-100">
                  Fix #{finding.fixPriority}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm font-black leading-tight text-white">{finding.title}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{finding.category}</p>
            <p className="gs-line-clamp-2 mt-1 text-xs leading-5 text-slate-400">{finding.result || finding.evidence[0]}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
