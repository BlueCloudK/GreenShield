import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/Button";

const labels = { PASS: "Đạt", FAIL: "Chưa đạt", REVIEW: "Cần review", ERROR: "Lỗi" };
const categories = {
  "Instruction following": "Tuân thủ chỉ dẫn",
  Accuracy: "Độ chính xác",
  Reasoning: "Suy luận",
  "Context memory": "Nhớ hội thoại",
  "Format following": "Định dạng",
  "Hallucination resistance": "Chống suy diễn sai",
  Robustness: "Độ ổn định đầu vào",
  Consistency: "Tính nhất quán",
  Multilingual: "Đa ngôn ngữ",
};

export function EvaluationReport({ report }) {
  const [tab, setTab] = useState("results");
  const [selected, setSelected] = useState(null);
  const rows = report[tab];
  const detail = rows.find((row) => row.id === selected) || rows[0];
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `benchmark-${report.id}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="mt-6 border-t border-white/10 pt-5" aria-label="Báo cáo benchmark">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{report.name}</h2>
          <p className="mt-1 break-all text-xs text-slate-400">{report.endpoint}</p>
        </div>
        <Button variant="secondary" onClick={download}>
          <Download size={16} /> Xuất JSON
        </Button>
      </div>
      <p className="mt-3 text-sm text-amber-200">
        {report.demo
          ? "Dữ liệu mẫu xác định trước, không phải kết quả kiểm thử chatbot thật."
          : "Phân loại dựa trên hành vi quan sát; không chứng minh model hoặc công nghệ bên trong endpoint."}
      </p>
      <div className="mt-4 grid grid-cols-2 divide-x divide-white/10 border-y border-white/10 py-3 lg:grid-cols-4">
        {[
          ["Điểm benchmark", report.overall === null ? "—" : `${report.overall.toFixed(1)}/10`],
          [
            "Hành vi",
            {
              DEMO: "Fixture demo",
              AI_CHATBOT: "Giống chatbot AI",
              STATIC_API: "Phản hồi cố định",
              UNKNOWN: "Chưa đủ bằng chứng",
              ERROR: "Không kết nối",
            }[report.classification],
          ],
          ["Requests thành công", `${report.performance.success}/${report.performance.requests}`],
          ["Độ trễ P95", `${Math.round(report.performance.p95)} ms`],
        ].map(([label, value]) => (
          <div className="min-w-0 px-3 py-2" key={label}>
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-1 text-base font-bold">{value}</p>
          </div>
        ))}
      </div>
      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
        {Object.entries(report.categories).map(([name, value]) => (
          <div className="flex justify-between gap-3" key={name}>
            <dt className="text-slate-400">{categories[name] || name}</dt>
            <dd className="shrink-0 font-semibold">{value === null ? "Chưa chấm" : `${value.toFixed(1)}/10`}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 flex gap-1 border-b border-white/10" role="tablist" aria-label="Bộ test">
        {[
          ["results", "Benchmark"],
          ["probes", "Nhận diện hành vi"],
        ].map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            className={`focus-ring border-b-2 px-3 py-2 text-sm ${tab === key ? "border-emerald-300 text-emerald-200" : "border-transparent text-slate-400"}`}
            onClick={() => {
              setTab(key);
              setSelected(null);
            }}
          >
            {label} ({report[key].length})
          </button>
        ))}
      </div>
      <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                {["Test", "Điểm", "Độ trễ", "Kết quả"].map((label) => (
                  <th className="px-2 py-3" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={`border-t border-white/10 ${detail?.id === row.id ? "bg-emerald-300/10" : ""}`}>
                  <td className="px-2 py-2">
                    <button
                      className="focus-ring w-full text-left font-semibold hover:text-emerald-200"
                      onClick={() => setSelected(row.id)}
                    >
                      {row.name}
                    </button>
                  </td>
                  <td className="px-2">{row.score === null ? "—" : `${row.score}/10`}</td>
                  <td className="px-2 whitespace-nowrap">{row.latency} ms</td>
                  <td className={`px-2 whitespace-nowrap text-xs ${row.status === "PASS" ? "text-emerald-200" : "text-amber-200"}`}>
                    {labels[row.status]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {detail && (
          <aside className="min-w-0 border-t border-white/10 p-4 lg:border-l lg:border-t-0" aria-label="Chi tiết test">
            <h3 className="font-bold">{detail.name}</h3>
            {[
              ["Prompt", detail.prompt || "(Trống)"],
              ["Kết quả mong đợi", detail.expected || "Review ngữ nghĩa"],
              ["Phản hồi", detail.response || "Không có phản hồi"],
              ["Đánh giá", detail.reason],
            ].map(([label, value]) => (
              <div className="mt-3" key={label}>
                <h4 className="text-xs font-semibold text-slate-400">{label}</h4>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm">{value}</p>
              </div>
            ))}
            <details className="mt-4 text-xs">
              <summary className="cursor-pointer text-slate-400">Request / response đã che secret</summary>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all">
                {JSON.stringify({ request: detail.request, headers: detail.headers, raw: detail.raw }, null, 2)}
              </pre>
            </details>
          </aside>
        )}
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Câu trả lời mở cần review ngữ nghĩa. Điểm tổng chỉ tính nhóm có phép chấm tự động; đây không phải điểm rủi ro bảo mật.
      </p>
    </section>
  );
}
