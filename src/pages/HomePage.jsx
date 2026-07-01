import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  DatabaseZap,
  FileText,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  ScanLine,
  ShieldAlert,
  Workflow,
} from "lucide-react";
import { PricingComparison } from "../components/pricing/PricingComparison";
import { AttackSurfaceVisual } from "../components/security/AttackSurfaceVisual";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { pricingPlans } from "../data/scans";

const scanScopes = [
  {
    title: "Ứng dụng LLM",
    body: "Kiểm thử prompt boundary, jailbreak, policy bypass và phản hồi không an toàn.",
    icon: Bot,
  },
  {
    title: "Pipeline RAG",
    body: "Đánh giá retrieval poisoning, truy xuất trái quyền và rò rỉ dữ liệu nhạy cảm.",
    icon: DatabaseZap,
  },
  {
    title: "Agent AI",
    body: "Mô phỏng tool abuse, approval bypass và quyền hành động vượt phạm vi.",
    icon: Workflow,
  },
  {
    title: "API AI",
    body: "Rà soát API exposure, key leakage, log leakage và guardrail gaps ở runtime.",
    icon: KeyRound,
  },
];

const riskCategories = [
  {
    title: "Tiêm lệnh prompt",
    body: "Prompt độc hại cố ghi đè system instruction, policy hoặc role của AI app.",
    severity: "Cao",
    icon: ShieldAlert,
  },
  {
    title: "Rò rỉ RAG",
    body: "Nguồn truy xuất làm lộ dữ liệu, mang chỉ dẫn ẩn hoặc trả về context sai quyền.",
    severity: "Cao",
    icon: DatabaseZap,
  },
  {
    title: "Lạm dụng tool",
    body: "Agent gọi tool nhạy cảm khi thiếu human approval, scope hoặc rate limit.",
    severity: "Nghiêm trọng",
    icon: Workflow,
  },
  {
    title: "Lộ API/key",
    body: "Secret, endpoint, debug trace hoặc log tạo thành đường tấn công ngoài ý muốn.",
    severity: "Cảnh báo",
    icon: KeyRound,
  },
];

const workflowSteps = [
  {
    title: "Khai báo",
    body: "Khai báo app, loại AI system, nguồn RAG, tool của agent và bề mặt API.",
    icon: ScanLine,
  },
  {
    title: "Phát hiện",
    body: "Chạy bộ test case cho prompt injection, RAG leakage, unsafe tools và exposure.",
    icon: AlertTriangle,
  },
  {
    title: "Chấm điểm",
    body: "Chấm risk score theo severity, impact, khả năng tái hiện và phạm vi ảnh hưởng.",
    icon: ShieldAlert,
  },
  {
    title: "Báo cáo",
    body: "Ghi lại finding, bằng chứng, bước tái hiện, tác động và khuyến nghị sửa.",
    icon: FileText,
  },
  {
    title: "Sửa lỗi",
    body: "Áp dụng prompt boundary, retrieval isolation, tool permission và API control.",
    icon: LockKeyhole,
  },
  {
    title: "Kiểm thử lại",
    body: "Chạy lại module liên quan để xác nhận rủi ro đã giảm trước khi công bố.",
    icon: RefreshCw,
  },
];

const reportRows = [
  ["Tiêm lệnh prompt vượt qua policy", "Tiêm lệnh prompt", "Cao", "Cần sửa"],
  ["Tài liệu truy xuất chứa chỉ dẫn ẩn", "Rò rỉ RAG", "Cao", "Cần sửa"],
  ["Tool rủi ro bị chặn bởi bước phê duyệt", "Tool agent", "Trung bình", "Kiểm thử lại"],
  ["Kiểm tra lộ API đã đạt", "Lộ API", "Đạt", "Đã xác minh"],
];

const planBadges = ["Kiểm thử", "Assessment", "Red team", "Dự án"];

function severityClass(severity) {
  const classes = {
    Critical: "border-rose-300/25 bg-rose-400/10 text-rose-100",
    "Nghiêm trọng": "border-rose-300/25 bg-rose-400/10 text-rose-100",
    High: "border-rose-300/25 bg-rose-400/10 text-rose-100",
    Cao: "border-rose-300/25 bg-rose-400/10 text-rose-100",
    Warning: "border-amber-300/25 bg-amber-300/10 text-amber-100",
    "Cảnh báo": "border-amber-300/25 bg-amber-300/10 text-amber-100",
    Medium: "border-amber-300/25 bg-amber-300/10 text-amber-100",
    "Trung bình": "border-amber-300/25 bg-amber-300/10 text-amber-100",
    Passed: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
    Đạt: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  };

  return classes[severity] ?? "border-slate-300/20 bg-slate-300/10 text-slate-200";
}

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
      {children}
    </p>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const scanRoute = isAuthenticated ? "/scan/new" : "/login";
  const scanState = isAuthenticated ? undefined : { from: { pathname: "/scan/new" } };
  const primaryActionLabel = isAuthenticated ? "Tạo scan mới" : "Đăng nhập để scan";
  const helperText = isAuthenticated
    ? "Bạn đang đăng nhập demo. Tạo scan mới để đi qua wizard, progress và report kết quả."
    : "Scan cần đăng nhập demo để lưu phiên. Demo report có thể xem công khai.";

  return (
    <main className="overflow-hidden">
      <section className="relative border-b border-white/10 bg-[#050910]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_8%,rgba(52,211,153,0.18),transparent_30rem),radial-gradient(circle_at_92%_16%,rgba(56,189,248,0.10),transparent_28rem),linear-gradient(90deg,rgba(5,12,10,0.94)_0%,rgba(4,8,15,0.86)_52%,rgba(5,7,13,0.96)_100%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.82)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.82)_1px,transparent_1px)] [background-size:72px_72px]" />

        <div className="relative mx-auto grid w-full max-w-[1580px] gap-10 px-4 py-10 sm:px-6 sm:py-12 lg:min-h-[560px] lg:grid-cols-[minmax(0,1.08fr)_minmax(460px,0.92fr)] lg:items-center lg:gap-20 lg:px-10 lg:py-10">
          <div className="max-w-[700px]">
            <span className="inline-flex rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-sm font-bold text-emerald-100">
              AI security assessment cho LLM, RAG và agent
            </span>
            <h1 className="mt-5 break-words text-4xl font-black leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-[4.5rem]">
              Scan rủi ro LLM, RAG và AI agent trước khi public
            </h1>
            <p className="mt-6 max-w-2xl break-words text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              GreenShield kiểm tra prompt injection, RAG leakage, unsafe tool use và API exposure. Kết quả có risk score, bằng chứng tấn công, hướng fix và retest.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button className="w-full px-6 py-3 sm:w-fit" state={scanState} to={scanRoute}>
                {primaryActionLabel}
              </Button>
              <Button className="w-full px-6 py-3 sm:w-fit" to="/reports/scan-gs-001" variant="secondary">
                Xem báo cáo mẫu
              </Button>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
              {helperText}
            </p>

          </div>

          <div className="flex min-w-0 justify-center lg:justify-center">
            <AttackSurfaceVisual />
          </div>
        </div>
      </section>

      <section className="wide-container py-16" id="platform">
        <div className="grid gap-10 lg:grid-cols-[0.42fr_0.58fr] lg:items-start">
          <div>
            <SectionLabel>GreenShield kiểm thử gì</SectionLabel>
            <h2 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl">
              Kiểm thử những lớp rủi ro scanner web bỏ sót
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-400">
              GreenShield tập trung vào cách LLM app thật vận hành: prompt đi vào model, context được lấy từ RAG, agent gọi tool, và API xử lý dữ liệu phía sau.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {scanScopes.map(({ title, body, icon: Icon }) => (
              <article className="group rounded-2xl border border-white/10 bg-slate-950/45 p-5 transition hover:-translate-y-1 hover:border-emerald-300/30" key={title}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-xl font-black text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="wide-container py-16" id="risks">
        <div className="grid gap-10 lg:grid-cols-[1.03fr_0.97fr] lg:items-stretch">
          <article className="relative overflow-hidden rounded-[2rem] border border-emerald-300/20 bg-emerald-300/[0.055] p-7 sm:p-9">
            <div className="absolute right-[-6rem] top-[-6rem] h-64 w-64 rounded-full border border-emerald-300/15" />
            <div className="relative">
            <SectionLabel>Nhóm rủi ro</SectionLabel>
              <h2 className="mt-4 max-w-2xl text-4xl font-black leading-tight text-white sm:text-5xl">
                Một prompt độc hại có thể đi qua retrieval, agent tools và API
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                Khi AI app kết nối nhiều thành phần, lỗi không chỉ nằm ở model. GreenShield kiểm thử chuỗi hành vi để tìm rủi ro có bằng chứng, không chỉ cảnh báo mơ hồ.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-4">
                {["Prompt", "RAG context", "Tool action", "API data"].map((path, index) => (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4" key={path}>
                    <p className="text-xs font-black text-emerald-200">0{index + 1}</p>
                    <p className="mt-2 text-sm font-black text-white">{path}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <div className="grid gap-4">
            {riskCategories.map(({ title, body, severity, icon: Icon }) => (
              <article className="rounded-2xl border border-white/10 bg-slate-950/45 p-5" key={title}>
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-emerald-200">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-black text-white">{title}</h3>
                      <span className={`rounded-full border px-3 py-1 text-xs font-black ${severityClass(severity)}`}>
                        {severity}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="wide-container py-16" id="workflow">
        <div className="border-y border-white/10 py-12">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <SectionLabel>Quy trình</SectionLabel>
              <h2 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl">
                Khai báo - Phát hiện - Chấm điểm - Báo cáo - Sửa lỗi - Kiểm thử lại
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
                Luồng kiểm thử giống một security assessment thực tế: tìm lỗi, chứng minh tác động, đề xuất kiểm soát, rồi kiểm lại sau khi sửa.
              </p>
            </div>
            <Button className="w-full sm:w-fit" state={scanState} to={scanRoute} variant="secondary">
              {primaryActionLabel}
            </Button>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {workflowSteps.map(({ title, body, icon: Icon }, index) => (
              <article className="rounded-2xl border border-white/10 bg-[#070b12] p-5 transition hover:border-emerald-300/30" key={title}>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="text-sm font-black text-slate-600">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-black text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="wide-container py-16" id="report">
        <div className="grid gap-10 lg:grid-cols-[0.42fr_0.58fr] lg:items-start">
          <div>
            <SectionLabel>Báo cáo mẫu</SectionLabel>
            <h2 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl">
              Báo cáo để đội kỹ thuật sửa được lỗi
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-400">
              Mỗi phát hiện có mức độ, nhóm rủi ro, bằng chứng, bước tái hiện, khuyến nghị và trạng thái kiểm thử lại. Báo cáo phải giúp đội kỹ thuật biết sửa gì trước.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {["Điểm rủi ro", "Bằng chứng", "Bước tái hiện", "Hướng sửa", "Kiểm thử lại"].map((item) => (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b12]">
            <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-white">Báo cáo kiểm thử GreenShield</p>
                <p className="mt-1 text-xs text-slate-500">Trợ lý hỗ trợ / Hệ thống RAG / scan-gs-001</p>
              </div>
              <div className="rounded-full border border-rose-300/25 bg-rose-400/10 px-3 py-1 text-xs font-black text-rose-100">
                Điểm rủi ro 78
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[680px] w-full text-left text-sm">
                <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-black">Phát hiện</th>
                    <th className="px-5 py-3 font-black">Nhóm</th>
                    <th className="px-5 py-3 font-black">Mức độ</th>
                    <th className="px-5 py-3 font-black">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {reportRows.map(([finding, category, severity, status]) => (
                    <tr className="text-slate-300" key={finding}>
                      <td className="px-5 py-4 font-bold text-white">{finding}</td>
                      <td className="px-5 py-4">{category}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-3 py-1 text-xs font-black ${severityClass(severity)}`}>
                          {severity}
                        </span>
                      </td>
                      <td className="px-5 py-4">{status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-white/10 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">Phát hiện mẫu</p>
              <h3 className="mt-3 text-xl font-black text-white">Tài liệu RAG chứa chỉ dẫn độc hại</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Nội dung truy xuất cố ghi đè chỉ dẫn hệ thống. Khuyến nghị: tách nội dung truy xuất khỏi chỉ dẫn hệ thống và kiểm tra policy trước khi tạo câu trả lời.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="wide-container py-16" id="pricing">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>Dịch vụ / Gói kiểm thử</SectionLabel>
            <h2 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
              Chọn gói theo độ sâu kiểm thử
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
              Bắt đầu bằng kiểm thử tự động, sau đó nâng cấp sang assessment có bằng chứng, xuất báo cáo, kiểm thử lại và review thủ công khi cần.
            </p>
          </div>
          <Button className="w-full sm:w-fit" to="/products" variant="secondary">
            Xem gói dịch vụ
          </Button>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {pricingPlans.map((plan, index) => {
            const isHighlighted = plan.name === "RAG & Agent Assessment";

            return (
              <article
                className={`relative rounded-2xl border p-5 transition hover:-translate-y-1 ${
                  isHighlighted
                    ? "border-emerald-300/35 bg-emerald-300/[0.065] shadow-[0_24px_90px_rgba(16,185,129,0.12)]"
                    : "border-white/10 bg-slate-950/45 hover:border-white/20"
                }`}
                key={plan.name}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-slate-300">
                    {planBadges[index]}
                  </span>
                  {isHighlighted ? (
                    <span className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-black text-slate-950">
                      Khuyến nghị
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-5 text-2xl font-black text-white">{plan.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{plan.targetUser}</p>
                <p className="mt-6 text-3xl font-black text-white">{plan.price}</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  {plan.features.map((feature) => (
                    <li className="flex gap-2" key={feature}>
                      <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={16} aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <div className="mt-10">
          <PricingComparison plans={pricingPlans} />
        </div>
      </section>

      <section className="wide-container pb-20" id="contact">
        <div className="grid gap-6 rounded-[2rem] border border-emerald-300/20 bg-emerald-300/[0.06] p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <SectionLabel>Liên hệ / Yêu cầu assessment</SectionLabel>
            <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
              Cần đánh giá một AI app thật?
            </h2>
            <p className="mt-3 max-w-2xl text-slate-300">
              Gửi phạm vi hệ thống, loại AI app và mục tiêu kiểm thử. GreenShield sẽ đề xuất hướng assessment phù hợp cho đội của bạn.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Button className="w-full sm:w-fit" to="/contact">
              Yêu cầu assessment <ArrowRight size={17} aria-hidden="true" />
            </Button>
            <Button className="w-full sm:w-fit" to="/reports/scan-gs-001" variant="secondary">
              Xem báo cáo mẫu
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
