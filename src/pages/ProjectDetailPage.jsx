import { Activity, Cable, FlaskConical, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { FormField, inputClasses } from "../components/ui/FormField";
import { ErrorState, LoadingState } from "../components/ui/PageState";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useApiResource } from "../hooks/useApiResource";
import { post } from "../lib/api";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { data, error, loading, reload } = useApiResource(`/api/projects/${projectId}`);
  const [action, setAction] = useState("");
  const [actionError, setActionError] = useState("");
  const [targetForm, setTargetForm] = useState({ name: "Ứng dụng AI staging", baseUrl: "", credential: "", responseField: "message" });

  async function addDemoTarget() {
    setAction("creating"); setActionError("");
    try {
      await post(`/api/projects/${projectId}/targets`, { type: "DEMO", name: "GreenShield vulnerable demo target", mode: "vulnerable" });
      await reload();
    } catch (requestError) { setActionError(requestError.message); } finally { setAction(""); }
  }

  async function testConnection(targetId) {
    setAction(targetId); setActionError("");
    try { await post(`/api/targets/${targetId}/test-connection`); await reload(); }
    catch (requestError) { setActionError(requestError.message); } finally { setAction(""); }
  }

  async function addExternalTarget(event) {
    event.preventDefault();
    setAction("creating"); setActionError("");
    try {
      await post(`/api/projects/${projectId}/targets`, {
        type: data.project.target_type,
        name: targetForm.name,
        baseUrl: targetForm.baseUrl,
        credential: targetForm.credential,
        responseField: targetForm.responseField,
        headers: {},
        requestTemplate: { prompt: "{{prompt}}" },
      });
      await reload();
    } catch (requestError) { setActionError(requestError.message); } finally { setAction(""); }
  }

  if (loading) return <LoadingState label="Đang tải project..." />;
  if (error || !data) return <div className="mx-auto max-w-4xl p-8"><ErrorState message={error || "Không tìm thấy project."} onRetry={reload} /></div>;
  const { project } = data;
  const connectedTarget = project.targets.find((target) => target.last_connection_status === "SUCCESS");

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-b border-white/10 pb-6">
        <Link className="text-xs font-bold text-slate-500 hover:text-white" to="/app/projects">Projects /</Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="text-3xl font-black text-white">{project.name}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{project.description || "Chưa có mô tả."}</p></div>
          <Button data-testid="project-new-scan" disabled={!connectedTarget} to={connectedTarget ? `/app/projects/${project.id}/scans/new` : undefined}><FlaskConical size={17} />Tạo security scan</Button>
        </div>
      </div>

      {actionError ? <p className="mt-5 rounded-lg bg-rose-400/10 p-3 text-sm text-rose-100">{actionError}</p> : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-lg border border-white/10 bg-[#0a1019]">
          <div className="flex items-center justify-between border-b border-white/10 p-4"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Target</p><h2 className="mt-1 font-black text-white">Kết nối ứng dụng AI</h2></div><Cable className="text-slate-500" size={20} /></div>
          {project.targets.length ? project.targets.map((target) => (
            <div className="p-4" key={target.id}>
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-white">{target.name}</p><p className="mt-1 text-xs text-slate-500">{target.type === "DEMO" ? "Target an toàn đi kèm GreenShield" : target.base_url}</p></div><StatusBadge value={target.last_connection_status} /></div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div className="rounded-md bg-white/[0.035] p-3"><span className="text-slate-500">Mode</span><p className="mt-1 font-bold text-slate-200">{target.config?.mode || "standard"}</p></div><div className="rounded-md bg-white/[0.035] p-3"><span className="text-slate-500">Timeout</span><p className="mt-1 font-bold text-slate-200">{target.timeout_ms} ms</p></div></div>
              <Button className="mt-4 w-full" data-testid="target-test-connection" disabled={action === target.id} onClick={() => testConnection(target.id)} variant="secondary"><Activity size={16} />{action === target.id ? "Đang kiểm tra..." : "Test Connection"}</Button>
            </div>
          )) : project.target_type === "DEMO" ? (
            <div className="p-5"><p className="text-sm leading-6 text-slate-400">Dùng target vulnerable/fixed đi kèm để chạy trọn vẹn demo mà không tấn công hệ thống bên ngoài.</p><Button className="mt-4 w-full" data-testid="target-connect-demo" disabled={action === "creating"} onClick={addDemoTarget}>{action === "creating" ? "Đang kết nối..." : "Kết nối demo target"}</Button></div>
          ) : (
            <form className="space-y-4 p-5" onSubmit={addExternalTarget}>
              <p className="text-sm leading-6 text-slate-400">Kết nối endpoint HTTPS của môi trường staging. GreenShield gửi payload trong trường <code>prompt</code> và đọc response JSON.</p>
              <FormField label="Tên target" name="target-name"><input className={inputClasses} name="target-name" onChange={(event) => setTargetForm({ ...targetForm, name: event.target.value })} required value={targetForm.name} /></FormField>
              <FormField label="Endpoint HTTPS" name="base-url"><input className={inputClasses} name="base-url" onChange={(event) => setTargetForm({ ...targetForm, baseUrl: event.target.value })} placeholder="https://staging.example.com/api/chat" required type="url" value={targetForm.baseUrl} /></FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Bearer token (tùy chọn)" name="credential"><input autoComplete="off" className={inputClasses} name="credential" onChange={(event) => setTargetForm({ ...targetForm, credential: event.target.value })} placeholder="Được mã hóa khi lưu" type="password" value={targetForm.credential} /></FormField>
                <FormField label="Response field" name="response-field"><input className={inputClasses} name="response-field" onChange={(event) => setTargetForm({ ...targetForm, responseField: event.target.value })} placeholder="message" required value={targetForm.responseField} /></FormField>
              </div>
              <Button className="w-full" disabled={action === "creating"} type="submit">{action === "creating" ? "Đang lưu..." : "Lưu target"}</Button>
            </form>
          )}
        </section>

        <section className="rounded-lg border border-white/10 bg-[#0a1019]">
          <div className="flex items-center justify-between border-b border-white/10 p-4"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Lịch sử</p><h2 className="mt-1 font-black text-white">Scans và findings</h2></div><ShieldAlert className="text-slate-500" size={20} /></div>
          {project.scans.length ? (
            <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="text-xs uppercase text-slate-600"><tr><th className="px-4 py-3">Scan</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Tests</th><th className="px-4 py-3">Rủi ro</th><th className="px-4 py-3"></th></tr></thead><tbody>{project.scans.map((scan) => <tr className="border-t border-white/10" key={scan.id}><td className="px-4 py-3 font-bold text-white">{scan.name}</td><td className="px-4 py-3"><StatusBadge value={scan.status} /></td><td className="px-4 py-3 text-slate-400">{scan.completed_tests}/{scan.total_tests}</td><td className="px-4 py-3">{scan.risk_level ? <StatusBadge value={scan.risk_level} /> : "—"}</td><td className="px-4 py-3 text-right"><Link className="font-bold text-emerald-200" to={`/app/scans/${scan.id}`}>Mở</Link></td></tr>)}</tbody></table></div>
          ) : <p className="p-6 text-sm text-slate-500">Chưa có scan. Kết nối target và chạy scan đầu tiên.</p>}
        </section>
      </div>
    </section>
  );
}
