import { Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState, LoadingState } from "../components/ui/PageState";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useApiResource } from "../hooks/useApiResource";

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const { data, error, loading, reload } = useApiResource(`/api/projects?search=${encodeURIComponent(search)}`);
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div><p className="section-kicker">Projects</p><h1 className="mt-2 text-3xl font-black text-white">Ứng dụng AI đang kiểm thử</h1><p className="mt-2 text-sm text-slate-400">Mỗi project quản lý target, scan, finding và lịch sử retest riêng.</p></div>
        <Link className="focus-ring rounded-lg bg-emerald-300 px-4 py-2.5 text-sm font-bold text-slate-950" to="/app/projects/new">Tạo project</Link>
      </div>
      <label className="mt-6 flex max-w-md items-center gap-2 rounded-lg border border-white/10 bg-slate-950/60 px-3">
        <Search className="text-slate-500" size={17} /><span className="sr-only">Tìm project</span>
        <input className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-slate-600" onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên hoặc mô tả" value={search} />
      </label>
      {loading ? <LoadingState /> : null}
      {error ? <div className="mt-6"><ErrorState message={error} onRetry={reload} /></div> : null}
      {data?.projects.length ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
          {data.projects.map((project) => (
            <Link className="grid gap-3 border-b border-white/10 p-5 last:border-b-0 hover:bg-white/[0.03] md:grid-cols-[minmax(0,1fr)_120px_120px_120px] md:items-center" key={project.id} to={`/app/projects/${project.id}`}>
              <div className="min-w-0"><h2 className="truncate font-black text-white">{project.name}</h2><p className="mt-1 truncate text-sm text-slate-500">{project.description || "Chưa có mô tả"}</p></div>
              <div><p className="text-[11px] uppercase text-slate-600">Target</p><p className="mt-1 text-sm font-semibold text-slate-300">{project.target_count}</p></div>
              <div><p className="text-[11px] uppercase text-slate-600">Finding mở</p><p className="mt-1 text-sm font-semibold text-slate-300">{project.open_findings}</p></div>
              <div>{project.risk_level ? <StatusBadge value={project.risk_level} /> : <span className="text-xs text-slate-500">Chưa scan</span>}</div>
            </Link>
          ))}
        </div>
      ) : !loading ? <div className="mt-6"><EmptyState actionLabel="Tạo project" actionTo="/app/projects/new" description="Kết nối ứng dụng AI đầu tiên để bắt đầu security assessment." title="Không tìm thấy project" /></div> : null}
    </section>
  );
}

