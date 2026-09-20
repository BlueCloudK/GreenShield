import { AlertTriangle, CheckCircle2, FolderKanban, ScanLine } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState, LoadingState } from "../components/ui/PageState";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useApiResource } from "../hooks/useApiResource";

const metrics = [
  ["active_projects", "Projects đang hoạt động", FolderKanban],
  ["recent_scans", "Tổng số scan", ScanLine],
  ["high_findings", "Finding mức cao", AlertTriangle],
  ["fixed_findings", "Đã khắc phục", CheckCircle2],
];

export default function DashboardPage() {
  const { data, error, loading, reload } = useApiResource("/api/dashboard");
  if (loading) return <LoadingState label="Đang tải workspace..." />;

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="section-kicker">Workspace</p>
          <h1 className="mt-2 text-3xl font-black text-white">Tổng quan bảo mật AI</h1>
          <p className="mt-2 text-sm text-slate-400">Dữ liệu từ project, scan và retest đã thực hiện trong workspace.</p>
        </div>
        <Link className="focus-ring rounded-lg bg-emerald-300 px-4 py-2.5 text-sm font-bold text-slate-950 lg:hidden" to="/app/projects/new">Tạo project</Link>
      </div>

      {error ? <div className="mt-6"><ErrorState message={error} onRetry={reload} /></div> : null}
      {data ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 xl:grid-cols-4">
            {metrics.map(([key, label, Icon]) => (
              <div className="bg-[#0a1019] p-5" key={key}>
                <div className="flex items-center justify-between text-slate-500"><span className="text-xs font-bold uppercase tracking-[0.12em]">{label}</span><Icon size={17} /></div>
                <p className="mt-3 text-3xl font-black text-white">{data.metrics[key]}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_1.15fr]">
            <section>
              <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black text-white">Projects gần đây</h2><Link className="text-sm font-bold text-emerald-200" to="/app/projects">Xem tất cả</Link></div>
              {data.projects.length ? (
                <div className="overflow-hidden rounded-lg border border-white/10">
                  {data.projects.map((project) => (
                    <Link className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-white/10 p-4 last:border-b-0 hover:bg-white/[0.03]" key={project.id} to={`/app/projects/${project.id}`}>
                      <div className="min-w-0"><p className="truncate font-bold text-white">{project.name}</p><p className="mt-1 text-xs text-slate-500">{project.target_count} target · {project.scan_count} scan · {project.open_findings} finding mở</p></div>
                      {project.risk_level ? <StatusBadge value={project.risk_level} /> : <span className="text-xs text-slate-500">Chưa scan</span>}
                    </Link>
                  ))}
                </div>
              ) : <EmptyState actionLabel="Tạo project đầu tiên" actionTo="/app/projects/new" description="Project chứa target, scan, finding và report của một ứng dụng AI." title="Workspace chưa có project" />}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-black text-white">Scan gần đây</h2>
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-white/[0.035] text-xs uppercase tracking-[0.08em] text-slate-500"><tr><th className="px-4 py-3">Scan</th><th className="px-4 py-3">Project</th><th className="px-4 py-3">Tiến độ</th><th className="px-4 py-3">Rủi ro</th></tr></thead>
                  <tbody>
                    {data.recentScans.map((scan) => (
                      <tr className="border-t border-white/10 hover:bg-white/[0.025]" key={scan.id}>
                        <td className="px-4 py-3"><Link className="font-bold text-white hover:text-emerald-200" to={`/app/scans/${scan.id}`}>{scan.name}</Link><p className="mt-1 text-xs text-slate-500">{scan.target_name}</p></td>
                        <td className="px-4 py-3 text-slate-300">{scan.project_name}</td>
                        <td className="px-4 py-3"><StatusBadge value={scan.status} /></td>
                        <td className="px-4 py-3">{scan.risk_level ? <StatusBadge value={scan.risk_level} /> : <span className="text-slate-500">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!data.recentScans.length ? <p className="p-6 text-sm text-slate-500">Chưa có scan nào được chạy.</p> : null}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </section>
  );
}
