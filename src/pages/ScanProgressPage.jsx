import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { SectionHeader } from "../components/ui/SectionHeader";
import { riskModules } from "../data/scans";
import { getAppTypeLabel, getEnvironmentLabel, getModuleLabel } from "../utils/reportLabels";

const progressSteps = [
  "Chuẩn bị test case",
  "Chạy probe theo module rủi ro",
  "Thu thập bằng chứng",
  "Tính điểm rủi ro",
  "Tạo báo cáo mẫu",
];

export default function ScanProgressPage() {
  const location = useLocation();
  const scanTarget = location.state?.scanTarget;
  const modules = scanTarget?.modules?.length ? scanTarget.modules : riskModules.slice(0, 5);

  return (
    <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionHeader
        align="center"
        kicker="Đang chạy kiểm thử demo"
        title="GreenShield đang kiểm thử AI app của bạn"
        description="Bản MVP dùng tiến trình mock để người dùng trải nghiệm luồng sản phẩm trước khi nối bộ kiểm thử thật."
      />

      <div className="glass-panel mt-10 rounded-[2rem] p-5 sm:p-8">
        {scanTarget ? (
          <div className="mb-6 grid gap-3 rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.055] p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">App</p>
              <p className="mt-2 font-black text-white">{scanTarget.appName}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Loại</p>
              <p className="mt-2 font-black text-white">{getAppTypeLabel(scanTarget.appType)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Môi trường</p>
              <p className="mt-2 font-black text-white">{getEnvironmentLabel(scanTarget.environment)}</p>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          {progressSteps.map((step, index) => {
            const complete = index < 4;
            return (
              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/45 p-4" key={step}>
                {complete ? (
                  <CheckCircle2 className="text-emerald-300" size={22} aria-hidden="true" />
                ) : (
                  <Loader2 className="animate-spin text-cyan-200" size={22} aria-hidden="true" />
                )}
                <div className="flex-1">
                  <p className="font-bold text-white">{step}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-800">
                    <div className={`h-1.5 rounded-full bg-emerald-300 ${complete ? "w-full" : "w-2/3"}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <h2 className="font-black text-white">Module đang kiểm thử</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {modules.map((module) => (
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-semibold text-slate-300" key={module}>
                {getModuleLabel(module)}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.055] p-5">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-cyan-200" size={20} aria-hidden="true" />
            <div>
              <h2 className="font-black text-white">Bước tiếp theo</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Mở báo cáo để xem điểm rủi ro, bằng chứng, hướng sửa và gửi góp ý cho MVP.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button to="/reports/scan-gs-001">Mở báo cáo mẫu</Button>
          <Link className="focus-ring inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10" to="/scan/new">
            Chạy lại bản demo
          </Link>
        </div>
      </div>
    </section>
  );
}
