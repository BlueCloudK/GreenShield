import { RefreshCw } from "lucide-react";
import { SeverityBadge } from "./SeverityBadge";
import { Button } from "../ui/Button";
import { maskSensitiveText } from "../../utils/maskSensitiveText";

const retestChecklist = [
  "Apply the fix in code, policy, or configuration.",
  "Run the same risk module against the fixed target.",
  "Compare new evidence against the original reproduction steps.",
  "Mark resolved only after the retest passes.",
];

export function FindingDetail({ finding }) {
  if (!finding) return null;

  const maskedEvidence = finding.evidence.map((item) => maskSensitiveText(item));
  const attackPrompt = maskSensitiveText(finding.attackPrompt || finding.reproductionSteps[0]);
  const aiResponse = maskSensitiveText(finding.aiResponse || maskedEvidence[0]);
  const attackResult = maskSensitiveText(finding.result || maskedEvidence[0]);
  const proof = maskSensitiveText(finding.proof || maskedEvidence[0]);

  const detailGroups = [
    {
      title: "Why it matters",
      meta: "impact",
      body: <p className="text-xs leading-5 text-slate-400">{finding.whyItMatters}</p>,
    },
    {
      title: "Evidence",
      meta: `${finding.evidence.length} items`,
      body: (
        <div className="space-y-2">
          {maskedEvidence.map((item) => (
            <div className="rounded-lg border border-white/10 bg-slate-950/50 p-2.5 text-xs leading-5 text-slate-300" key={item}>
              {item}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Reproduction steps",
      meta: `${finding.reproductionSteps.length} steps`,
      body: (
        <ol className="space-y-2 text-xs text-slate-400">
          {finding.reproductionSteps.map((step, index) => (
            <li className="flex gap-3" key={step}>
              <span className="font-black text-emerald-300">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      ),
    },
    {
      title: "Retest checklist",
      meta: `${retestChecklist.length} items`,
      body: (
        <div className="space-y-2">
          {retestChecklist.map((item, index) => (
            <div className="flex gap-2 rounded-lg border border-white/10 bg-white/[0.035] p-2.5 text-xs text-slate-300" key={item}>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-300/10 text-xs font-black text-cyan-200">
                {index + 1}
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <aside className="gs-scrollbar min-w-0 p-3 lg:h-full lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={finding.severity} />
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-bold text-slate-300">
              {finding.retestStatus}
            </span>
          </div>
          <h2 className="mt-2 text-lg font-black leading-tight text-white">{finding.title}</h2>
        </div>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-3">
          <section className="rounded-xl border border-white/10 bg-slate-950/35 p-2.5">
            <h3 className="text-sm font-bold text-white">What happened</h3>
            <p className="mt-1.5 text-xs leading-5 text-slate-400">{attackResult}</p>
          </section>

          <section className="rounded-xl border border-rose-300/20 bg-rose-300/[0.07] p-2.5">
            <h3 className="text-sm font-bold text-white">Attack evidence</h3>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {[
                ["Attack prompt", attackPrompt],
                ["AI response", aiResponse],
                ["Result", attackResult],
                ["Why this proves it", proof],
              ].map(([label, value]) => (
                <div className="rounded-lg border border-white/10 bg-slate-950/50 p-2.5" key={label}>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-300">{value}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-3">
          <section className="rounded-xl border border-white/10 bg-slate-950/35 p-2.5">
            <h3 className="text-sm font-bold text-white">Business / product impact</h3>
            <p className="mt-1.5 text-xs leading-5 text-slate-400">{finding.productImpact || finding.whyItMatters}</p>
          </section>

          <section className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-2.5">
            <h3 className="text-sm font-bold text-white">Recommended next action</h3>
            <p className="mt-1.5 text-xs leading-5 text-emerald-50">{finding.recommendedAction || finding.suggestedFix}</p>
            <div className="mt-2 border-t border-emerald-300/15 pt-2">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200/80">Suggested fix</p>
              <p className="mt-1.5 text-xs leading-5 text-emerald-50">{finding.suggestedFix}</p>
            </div>
          </section>

          <div className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
            {detailGroups.map((group) => (
              <details className="group" key={group.title}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-white/[0.04]">
                  <span>{group.title}</span>
                  <span className="text-xs font-bold text-slate-500 group-open:text-cyan-200">{group.meta}</span>
                </summary>
                <div className="border-t border-white/10 px-3 py-2.5">{group.body}</div>
              </details>
            ))}
          </div>

          <Button className="w-full px-3 py-2 text-xs" variant="secondary">
            <RefreshCw size={17} aria-hidden="true" />
            Run retest
          </Button>
        </div>
      </div>
    </aside>
  );
}
