import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ErrorState, LoadingState } from "../components/ui/PageState";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useApiResource } from "../hooks/useApiResource";
import { post } from "../lib/api";

export default function NewProjectScanPage() {
  const { projectId } = useParams();
  const projectResource = useApiResource(`/api/projects/${projectId}`);
  const testsResource = useApiResource("/api/security-tests");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const tests = testsResource.data?.tests || [];
  const effectiveSelected = selected ?? tests.map((test) => test.id);
  const project = projectResource.data?.project;
  const target = useMemo(() => project?.targets.find((item) => item.last_connection_status === "SUCCESS"), [project]);

  function toggle(testId) {
    const current = effectiveSelected;
    setSelected(current.includes(testId) ? current.filter((id) => id !== testId) : [...current, testId]);
  }

  async function runScan() {
    setSubmitting(true); setError("");
    try {
      const result = await post("/api/scans", { projectId, targetId: target.id, testIds: effectiveSelected, name: "AI Security Scan" });
      navigate(`/app/scans/${result.scan.id}`);
    } catch (requestError) { setError(requestError.message); } finally { setSubmitting(false); }
  }

  if (projectResource.loading || testsResource.loading) return <LoadingState label="Đang chuẩn bị test registry..." />;
  if (projectResource.error || testsResource.error) return <div className="mx-auto max-w-4xl p-8"><ErrorState message={projectResource.error || testsResource.error} /></div>;

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="section-kicker">Security scan</p><h1 className="mt-2 text-3xl font-black text-white">Chọn test cho {project.name}</h1>
      <p className="mt-2 text-sm text-slate-400">Mỗi test bên dưới gửi một payload thật tới target và đánh giá response bằng rule deterministic.</p>
      <div className="mt-6 flex items-center justify-between rounded-lg border border-white/10 bg-[#0a1019] p-4"><div><p className="text-xs text-slate-500">Target</p><p className="mt-1 font-bold text-white">{target?.name || "Chưa có target đã kết nối"}</p></div><StatusBadge value={target?.last_connection_status || "NOT_TESTED"} /></div>
      <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
        {tests.map((test) => {
          const checked = effectiveSelected.includes(test.id);
          return <label className="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] gap-4 border-b border-white/10 p-4 last:border-b-0 hover:bg-white/[0.025]" data-testid={`security-test-${test.id}`} key={test.id}><input checked={checked} className="mt-1 h-4 w-4 accent-emerald-300" onChange={() => toggle(test.id)} type="checkbox" /><div><p className="font-bold text-white">{test.name}</p><p className="mt-1 text-sm leading-5 text-slate-400">{test.description}</p><p className="mt-2 text-xs text-slate-600">Kỳ vọng an toàn: {test.expectedSafeBehavior}</p></div><span className="text-xs font-bold text-slate-500">v{test.version}</span></label>;
        })}
      </div>
      {error ? <p className="mt-5 rounded-lg bg-rose-400/10 p-3 text-sm text-rose-100">{error}</p> : null}
      <div className="mt-6 flex justify-end gap-3"><Button to={`/app/projects/${projectId}`} variant="ghost">Quay lại</Button><Button data-testid="scan-run" disabled={!target || !effectiveSelected.length || submitting} onClick={runScan}>{submitting ? "Đang tạo scan..." : `Chạy ${effectiveSelected.length} security tests`}</Button></div>
    </section>
  );
}
