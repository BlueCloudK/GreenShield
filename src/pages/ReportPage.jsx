import { CheckCircle2, RefreshCw, ShieldAlert, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ErrorState, LoadingState } from "../components/ui/PageState";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useApiResource } from "../hooks/useApiResource";
import { patch, post } from "../lib/api";
import { maskSensitiveText } from "../utils/maskSensitiveText";

export default function ReportPage() {
  const { scanId } = useParams();
  const resource = useApiResource(`/api/reports/${scanId}`, { silent: true });
  const report = resource.data?.report;
  const [selectedId, setSelectedId] = useState("");
  const [action, setAction] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const selected = useMemo(() => report?.findings.find((finding) => finding.id === selectedId) || report?.findings[0], [report, selectedId]);

  useEffect(() => {
    if (!report?.findings.some((finding) => finding.retest_status === "RETESTING")) return undefined;
    const timer = window.setInterval(resource.reload, 700);
    return () => window.clearInterval(timer);
  }, [report, resource.reload]);

  async function setFixedMode() {
    setAction("mode"); setError("");
    try { await patch(`/api/targets/${report.scan.target_id}`, { mode: "fixed" }); await resource.reload(); setNotice("Demo target đã chuyển sang Fixed Mode. Bây giờ có thể retest finding."); }
    catch (requestError) { setError(requestError.message); } finally { setAction(""); }
  }

  async function retest() {
    if (!selected) return;
    setAction("retest"); setError("");
    try { await post(`/api/findings/${selected.id}/retest`); await resource.reload(); setNotice("Retest đã bắt đầu bằng đúng security test đã tạo finding."); }
    catch (requestError) { setError(requestError.message); } finally { setAction(""); }
  }

  if (resource.loading && !report) return <LoadingState label="Đang tạo report..." />;
  if (resource.error || !report) return <div className="mx-auto max-w-4xl p-8"><ErrorState message={resource.error || "Không tìm thấy report."} onRetry={resource.reload} /></div>;
  const { scan } = report;
  const fixedMode = scan.targetConfig?.mode === "fixed";

  return (
    <section className="mx-auto max-w-[1560px] px-4 py-7 sm:px-6 lg:px-8 print:max-w-none print:bg-white print:text-black">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5 print:border-slate-300">
        <div><Link className="text-xs font-bold text-slate-500 print:hidden" to={`/app/scans/${scan.id}`}>{scan.project_name} / {scan.name}</Link><p className="section-kicker mt-2">Báo cáo bảo mật</p><h1 className="mt-1 text-3xl font-black text-white print:text-black">{scan.project_name}</h1><p className="mt-2 text-sm text-slate-400 print:text-slate-600">Target: {scan.target_name} · {scan.total_tests} tests · {new Date(report.generatedAt).toLocaleString("vi-VN")}</p></div>
        <div className="flex flex-wrap gap-2 print:hidden"><Button onClick={() => window.print()} variant="secondary">In / lưu PDF</Button><Button data-testid="report-fixed-mode" disabled={fixedMode || action === "mode"} onClick={setFixedMode} variant="secondary"><Wrench size={16} />{fixedMode ? "Target đang ở Fixed Mode" : "Chuyển target sang Fixed Mode"}</Button></div>
      </div>
      {notice ? <p className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-300/[0.06] p-3 text-sm text-emerald-100 print:hidden">{notice}</p> : null}
      {error ? <p className="mt-4 rounded-lg bg-rose-400/10 p-3 text-sm text-rose-100 print:hidden">{error}</p> : null}

      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-4 print:border-slate-300 print:bg-slate-300">
        {[["Điểm rủi ro", `${report.risk.score ?? 0}/100`], ["Mức rủi ro", <StatusBadge value={report.risk.level} />], ["Phát hiện", report.findings.length], ["Retest", report.findings.filter((item) => item.retest_status === "FIXED").length + "/" + report.findings.length + " đã sửa"]].map(([label, value]) => <div className="bg-[#0a1019] p-4 print:bg-white" key={label}><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p><div className="mt-2 text-xl font-black text-white print:text-black">{value}</div></div>)}
      </div>

      <div className="mt-5 rounded-lg border border-white/10 bg-[#0a1019] p-5 print:border-slate-300 print:bg-white"><div className="flex gap-3"><ShieldAlert className="mt-0.5 shrink-0 text-rose-200" size={20} /><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Tóm tắt rủi ro</p><p className="mt-2 text-lg font-black text-white print:text-black">{report.executiveSummary}</p><p className="mt-2 text-sm leading-6 text-slate-400 print:text-slate-700">Phương pháp: {report.methodology}</p></div></div></div>

      {report.findings.length ? (
        <div className="mt-5 grid overflow-hidden rounded-lg border border-white/10 lg:grid-cols-[340px_minmax(0,1fr)] print:block print:border-slate-300">
          <aside className="overflow-x-auto whitespace-nowrap border-b border-white/10 bg-[#090f17] lg:overflow-visible lg:whitespace-normal lg:border-b-0 lg:border-r print:hidden">
            <div className="border-b border-white/10 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Phát hiện</p><p className="mt-1 text-sm font-semibold text-slate-300">{report.findings.length} lỗi được xác nhận</p></div>
            {report.findings.map((finding) => <button className={`inline-block w-[270px] whitespace-normal border-b border-r border-white/10 p-4 text-left align-top lg:block lg:w-full lg:border-r-0 ${selected?.id === finding.id ? "bg-emerald-300/[0.07]" : "hover:bg-white/[0.025]"}`} data-testid={`finding-${finding.security_test_id}`} key={finding.id} onClick={() => setSelectedId(finding.id)} type="button"><div className="flex flex-wrap gap-2"><StatusBadge value={finding.severity} /><StatusBadge value={finding.retest_status} /></div><p className="mt-2 text-sm font-black leading-5 text-white">{finding.title}</p><p className="mt-1 text-xs text-slate-500">{finding.category}</p></button>)}
          </aside>
          <article className="min-w-0 bg-[#080d14] print:bg-white">
            <FindingReport finding={selected} onRetest={retest} retestBusy={action === "retest" || selected?.retest_status === "RETESTING"} retests={report.retests.filter((item) => item.finding_id === selected?.id)} />
          </article>
        </div>
      ) : <div className="mt-5 rounded-lg border border-emerald-300/20 bg-emerald-300/[0.05] p-8 text-center"><CheckCircle2 className="mx-auto text-emerald-200" size={30} /><h2 className="mt-3 text-xl font-black text-white">Không có finding</h2><p className="mt-2 text-sm text-slate-400">Các test trong scope không phát hiện hành vi không an toàn.</p></div>}
    </section>
  );
}

function FindingReport({ finding, onRetest, retestBusy, retests }) {
  if (!finding) return null;
  return (
    <div className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5 print:border-slate-300"><div><div className="flex gap-2"><StatusBadge value={finding.severity} /><StatusBadge value={finding.retest_status} /></div><h2 className="mt-3 text-2xl font-black text-white print:text-black">{finding.title}</h2><p className="mt-2 text-sm text-slate-400 print:text-slate-700">{finding.description}</p></div><Button data-testid="finding-retest" disabled={retestBusy} onClick={onRetest} variant="secondary"><RefreshCw className={retestBusy ? "animate-spin" : ""} size={16} />{retestBusy ? "Đang retest..." : finding.retest_status === "FIXED" ? "Retest lại" : "Chạy retest"}</Button></div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <div>
          <h3 className="text-sm font-black text-white print:text-black">Bằng chứng tấn công</h3>
          <div className="mt-3 overflow-hidden rounded-lg border border-rose-300/20 bg-rose-300/[0.04] print:border-slate-300 print:bg-white">
            <Evidence label="Test input" value={finding.test_input} />
            <Evidence label="Target response" value={finding.target_response} />
            <Evidence label="Evidence extracted" value={finding.extracted_evidence} />
            <Evidence label="Vì sao bị đánh giá unsafe" value={finding.explanation} />
          </div>
          <div className="mt-5"><h3 className="text-sm font-black text-white print:text-black">Tác động</h3><p className="mt-2 text-sm leading-6 text-slate-400 print:text-slate-700">{finding.impact}</p></div>
          <div className="mt-5"><h3 className="text-sm font-black text-white print:text-black">Lịch sử retest</h3><div className="mt-3 overflow-hidden rounded-lg border border-white/10 print:border-slate-300"><div className="grid grid-cols-[110px_1fr_auto] gap-3 p-3 text-xs"><span className="font-bold text-slate-300">Lần kiểm tra gốc</span><span className="text-slate-500">Finding được tạo từ execution ban đầu</span><StatusBadge value="FAILED" /></div>{retests.map((item, index) => <div className="grid grid-cols-[110px_1fr_auto] gap-3 border-t border-white/10 p-3 text-xs" key={item.id}><span className="font-bold text-slate-300">Retest #{index + 1}</span><span className="truncate text-slate-500">{item.new_evidence || "Đang chạy"}</span><StatusBadge value={item.status} /></div>)}</div></div>
        </div>
        <aside className="rounded-lg border border-emerald-300/20 bg-emerald-300/[0.05] p-4 print:border-slate-300 print:bg-white"><h3 className="font-black text-white print:text-black">Khuyến nghị sửa</h3><Info label="Vấn đề" value={finding.problem} /><Info label="Giải pháp" value={finding.mitigation} /><Info label="Hướng triển khai" value={finding.implementation_guidance} /><Info label="Điều kiện xác nhận" value={finding.validation_criteria} /></aside>
      </div>
    </div>
  );
}

function Evidence({ label, value }) { return <div className="border-b border-white/10 p-4 last:border-b-0 print:border-slate-200"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p><pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-slate-200 print:text-slate-800">{maskSensitiveText(value || "—")}</pre></div>; }
function Info({ label, value }) { return <div className="mt-4 border-t border-emerald-300/15 pt-4 print:border-slate-200"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-200 print:text-slate-600">{label}</p><p className="mt-1 text-sm leading-6 text-slate-300 print:text-slate-800">{value}</p></div>; }
