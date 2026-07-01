import { Download, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { FeedbackPanel } from "../components/feedback/FeedbackPanel";
import { FindingDetail } from "../components/scan/FindingDetail";
import { FindingList } from "../components/scan/FindingList";
import { RiskBadge } from "../components/scan/RiskBadge";
import { SeverityBadge } from "../components/scan/SeverityBadge";
import { Button } from "../components/ui/Button";
import { mockFindings, mockScans, riskModules } from "../data/scans";
import {
  getAppTypeLabel,
  getCategoryLabel,
  getEnvironmentLabel,
  getModuleLabel,
  getModuleStatusLabel,
  getRetestStatusLabel,
  getScanStatusLabel,
} from "../utils/reportLabels";
import NotFoundPage from "./NotFoundPage";

const severityRank = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Warning: 2,
  Low: 1,
};

function getHighestSeverity(findings) {
  return findings.reduce((highest, finding) => {
    if ((severityRank[finding.severity] || 0) > (severityRank[highest] || 0)) {
      return finding.severity;
    }
    return highest;
  }, "Low");
}

function moduleHasFinding(module, finding) {
  return module === finding.category || module.includes(finding.category) || finding.category.includes(module.split(" ")[0]);
}

function sortByFixPriority(a, b) {
  const priorityDelta = (a.fixPriority || 99) - (b.fixPriority || 99);
  if (priorityDelta !== 0) return priorityDelta;
  return (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
}

function getRetestStatus(findings) {
  if (!findings.length) return "Passed";
  if (findings.every((finding) => ["Passed", "Resolved"].includes(finding.retestStatus))) return "Passed";
  return "Pending";
}

function getModuleStatus(tested, moduleFindings) {
  if (!tested) return "Not tested";
  if (!moduleFindings.length) return "Passed";

  const highestSeverity = getHighestSeverity(moduleFindings);
  if (["Critical", "High"].includes(highestSeverity)) return "Failed";
  return "Warning";
}

function ModuleStatusBadge({ status }) {
  const styles = {
    Passed: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
    Warning: "border-amber-300/20 bg-amber-300/10 text-amber-100",
    Failed: "border-rose-300/20 bg-rose-300/10 text-rose-200",
    "Not tested": "border-white/10 bg-white/[0.05] text-slate-400",
  };

  return (
    <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${styles[status]}`}>
      {getModuleStatusLabel(status)}
    </span>
  );
}

export default function ReportPage() {
  const { scanId } = useParams();
  const scan = mockScans.find((item) => item.id === scanId);
  const findings = mockFindings.filter((finding) => finding.scanId === scanId);
  const categories = useMemo(() => ["All", ...new Set(findings.map((finding) => finding.category))], [findings]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedFindingId, setSelectedFindingId] = useState(findings[0]?.id || "");

  const filteredFindings = useMemo(
    () => (activeCategory === "All" ? findings : findings.filter((finding) => finding.category === activeCategory)),
    [activeCategory, findings],
  );

  const selectedFinding = useMemo(
    () => filteredFindings.find((finding) => finding.id === selectedFindingId) || filteredFindings[0] || findings[0],
    [filteredFindings, findings, selectedFindingId],
  );

  function selectCategory(category) {
    const nextFindings = category === "All" ? findings : findings.filter((finding) => finding.category === category);
    setActiveCategory(category);
    setSelectedFindingId(nextFindings[0]?.id || "");
  }

  if (!scan) {
    return <NotFoundPage />;
  }

  const retestStatus = getRetestStatus(findings);
  const scanDate = new Date(scan.completedAt).toLocaleDateString("vi-VN");
  const prioritizedFindings = [...findings].sort(sortByFixPriority);
  const fixFirstFinding = prioritizedFindings[0];
  const riskHighlights = riskModules
    .slice(0, 5)
    .map((module) => {
      const moduleFindings = findings.filter((finding) => moduleHasFinding(module, finding));
      const tested = scan.modules.includes(module);
      return {
        name: module,
        finding: moduleFindings[0],
        status: getModuleStatus(tested, moduleFindings),
      };
    })
    .filter((module) => ["Failed", "Warning"].includes(module.status));
  const scanMetadata = [
    ["Loại ứng dụng", getAppTypeLabel(scan.appType)],
    ["Môi trường", getEnvironmentLabel(scan.environment)],
    ["Trạng thái scan", getScanStatusLabel(scan.status)],
    ["Ngày scan", scanDate],
    ["Retest", getRetestStatusLabel(retestStatus)],
  ];

  return (
    <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-4 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <p className="section-kicker">Báo cáo mẫu</p>
          <h1 className="mt-1.5 break-words text-3xl font-black leading-tight text-white sm:text-4xl">{scan.appName}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {scanMetadata.map(([label, value]) => (
              <span className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[11px] font-semibold text-slate-300" key={label}>
                <span className="text-slate-500">{label}: </span>
                {value}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="px-3 py-2 text-xs" data-testid="report-top-retest" variant="secondary">
            <RefreshCw size={17} aria-hidden="true" />
            Chạy retest
          </Button>
          <Button className="px-3 py-2 text-xs" data-testid="report-export" variant="secondary">
            <Download size={17} aria-hidden="true" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      <section className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55">
        <div className="grid min-w-0 divide-y divide-white/10 lg:grid-cols-[240px_minmax(0,1fr)_300px] lg:divide-x lg:divide-y-0">
          <div className="p-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Điểm rủi ro</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-4xl font-black leading-none text-white">{scan.riskScore}</span>
              <span className="pb-1 text-sm font-bold text-slate-500">/100</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <RiskBadge level={scan.riskLevel} />
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-slate-300">{findings.length} phát hiện</span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-slate-300">
                {getRetestStatusLabel(retestStatus)}
              </span>
            </div>
          </div>

          <div className="p-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Tóm tắt rủi ro</p>
            <h2 className="mt-2 text-xl font-black leading-tight text-white">
              {scan.appName} có thể bị đẩy ra ngoài phạm vi an toàn đã thiết kế.
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">{scan.securitySummary}</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {riskHighlights.map((item) => (
                <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2" key={item.name}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{getModuleLabel(item.name)}</p>
                    <ModuleStatusBadge status={item.status} />
                  </div>
                  <p className="mt-1.5 text-xs font-semibold leading-5 text-slate-300">
                    {item.finding?.title || "Cần review trước khi triển khai."}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {fixFirstFinding ? (
            <aside className="border-l-0 border-emerald-300/20 bg-emerald-300/[0.06] p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Ưu tiên sửa</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <SeverityBadge severity={fixFirstFinding.severity} />
                <span className="rounded-full border border-white/10 bg-slate-950/45 px-2 py-1 text-[11px] font-bold text-slate-300">
                  Ưu tiên {fixFirstFinding.fixPriority || 1}
                </span>
              </div>
              <h3 className="mt-2 text-sm font-black leading-tight text-white">{fixFirstFinding.title}</h3>
              <p className="mt-2 text-xs leading-5 text-emerald-50">{scan.recommendedAction}</p>
            </aside>
          ) : null}
        </div>

        <div className="border-t border-white/10 px-3 py-2">
          <div className="gs-scrollbar flex gap-2 overflow-x-auto pb-1">
            {riskModules.slice(0, 5).map((module) => {
              const moduleFindings = findings.filter((finding) => moduleHasFinding(module, finding));
              const tested = scan.modules.includes(module);
              const moduleStatus = getModuleStatus(tested, moduleFindings);
              const highestSeverity = moduleFindings.length ? getHighestSeverity(moduleFindings) : null;

              return (
                <div className="min-w-[210px] rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2" key={module}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-black text-white">{getModuleLabel(module)}</p>
                    <ModuleStatusBadge status={moduleStatus} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    <span>{tested ? "Đã kiểm thử" : "Chưa kiểm thử"}</span>
                    <span>{moduleFindings.length || 0} phát hiện</span>
                    {highestSeverity ? <SeverityBadge severity={highestSeverity} /> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mt-4 grid min-w-0 items-start gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55">
          <div className="flex flex-wrap gap-1.5 border-b border-white/10 p-3">
            {categories.map((category) => (
              <button
                className={`focus-ring rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                  activeCategory === category
                    ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                    : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:text-slate-200"
                }`}
                key={category}
                onClick={() => selectCategory(category)}
                type="button"
              >
                {getCategoryLabel(category)}
              </button>
            ))}
          </div>
          <FindingList findings={filteredFindings} onSelect={setSelectedFindingId} selectedId={selectedFinding?.id} />
        </div>

        <FindingDetail finding={selectedFinding} />
      </div>

      <div className="mt-8">
        <FeedbackPanel source={`report:${scan.id}`} />
      </div>
    </section>
  );
}
