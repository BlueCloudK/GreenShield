import { CheckCircle2, Circle, LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ErrorState, LoadingState } from "../components/ui/PageState";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useApiResource } from "../hooks/useApiResource";

export default function ScanDetailPage() {
  const { scanId } = useParams();
  const resource = useApiResource(`/api/scans/${scanId}`, { silent: true });
  const scan = resource.data?.scan;

  useEffect(() => {
    if (!scan || !["QUEUED", "RUNNING"].includes(scan.status)) return undefined;
    const timer = window.setInterval(resource.reload, 700);
    return () => window.clearInterval(timer);
  }, [scan?.status, resource.reload]);

  if (resource.loading && !scan) return <LoadingState label="Đang tải scan..." />;
  if (resource.error || !scan) return <div className="mx-auto max-w-4xl p-8"><ErrorState message={resource.error || "Không tìm thấy scan."} onRetry={resource.reload} /></div>;
  const finished = ["COMPLETED", "FAILED", "CANCELLED"].includes(scan.status);

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div><Link className="text-xs font-bold text-slate-500 hover:text-white" to={`/app/projects/${scan.project_id}`}>{scan.project_name} /</Link><h1 className="mt-2 text-3xl font-black text-white">{scan.name}</h1><p className="mt-2 text-sm text-slate-400">Target: {scan.target_name}</p></div>
        <StatusBadge value={scan.status} />
      </div>

      <div className="mt-6 rounded-lg border border-white/10 bg-[#0a1019] p-5">
        <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Tiến độ kiểm thử</p><p className="mt-1 text-lg font-black text-white">{scan.completed_tests}/{scan.total_tests} test đã hoàn tất</p></div><span className="text-2xl font-black text-white">{scan.progress}%</span></div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-emerald-300 transition-[width] duration-300" style={{ width: `${scan.progress}%` }} /></div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
        {scan.executions.slice(0, scan.total_tests).map((execution) => {
          const Icon = execution.status === "PASSED" || execution.status === "FAILED" ? CheckCircle2 : execution.status === "RUNNING" ? LoaderCircle : Circle;
          return <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-b border-white/10 p-4 last:border-b-0" key={execution.id}><Icon className={execution.status === "RUNNING" ? "animate-spin text-cyan-200" : execution.status === "PENDING" ? "text-slate-700" : "text-emerald-200"} size={18} /><div className="min-w-0"><p className="truncate font-bold text-white">{execution.test_name}</p><p className="mt-1 text-xs text-slate-500">{execution.duration_ms ? `${execution.duration_ms} ms` : "Chưa chạy"}</p></div><StatusBadge value={execution.status} /></div>;
        })}
      </div>

      {scan.status === "COMPLETED" ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/10 bg-[#0a1019] p-5"><div><p className="font-black text-white">Scan đã hoàn tất</p><p className="mt-1 text-sm text-slate-400">{scan.findings.length} finding · Risk score {scan.risk_score ?? 0}/100</p></div><Button data-testid="scan-open-report" to={`/app/reports/${scan.id}`}>Xem evidence và hướng sửa</Button></div>
      ) : finished ? <div className="mt-6 rounded-lg border border-rose-300/20 bg-rose-300/[0.05] p-5"><p className="font-black text-rose-100">Scan không hoàn tất</p><p className="mt-1 text-sm text-slate-400">{scan.error_message || "Kiểm tra kết nối target rồi chạy lại từ project."}</p></div> : null}
    </section>
  );
}
