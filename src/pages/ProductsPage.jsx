import { CheckCircle2 } from "lucide-react";
import { PricingComparison } from "../components/pricing/PricingComparison";
import { Button } from "../components/ui/Button";
import { SectionHeader } from "../components/ui/SectionHeader";
import { pricingPlans } from "../data/scans";

const planBadges = ["Cơ bản", "Phổ biến", "Nâng cao", "Doanh nghiệp"];

export default function ProductsPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <SectionHeader
          kicker="Bảng giá"
          title="Dịch vụ và gói kiểm thử bảo mật AI"
          description="Các gói GreenShield tập trung vào red team cho ứng dụng LLM, pipeline RAG, agent AI, bằng chứng khai thác, hướng sửa và kiểm thử lại sau khi khắc phục."
        />
        <Button className="w-full sm:w-fit" to="/contact">Yêu cầu assessment</Button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-4">
        {pricingPlans.map((plan) => (
          <article
            className={`glass-panel min-w-0 rounded-3xl p-6 ${plan.name === "RAG & Agent Assessment" ? "border-emerald-300/40 shadow-[0_0_42px_rgba(74,222,128,0.13)]" : ""}`}
            key={plan.name}
          >
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
              <p className="min-w-0 text-sm font-bold text-emerald-300">{plan.targetUser}</p>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-black ${
                  plan.name === "RAG & Agent Assessment"
                    ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                    : "border-white/10 bg-white/[0.05] text-slate-300"
                }`}
              >
                {planBadges[pricingPlans.indexOf(plan)]}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-black text-white">{plan.name}</h2>
            <p className="mt-5 text-4xl font-black text-white">{plan.price}</p>
            <div className="mt-5 grid gap-2 text-xs sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
                <p className="text-slate-500">Lượt kiểm thử</p>
                <p className="mt-1 font-bold text-slate-200">{plan.scanQuota}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
                <p className="text-slate-500">Kiểm thử lại</p>
                <p className="mt-1 font-bold text-slate-200">{plan.retestCount}</p>
              </div>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              {plan.features.map((feature) => (
                <li className="flex gap-2" key={feature}>
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={16} aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">
              <p>
                <span className="font-bold text-white">Báo cáo:</span> {plan.reportLevel}
              </p>
              <p className="mt-2">
                <span className="font-bold text-white">Review thủ công:</span> {plan.manualReview}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 min-w-0 max-w-full">
        <PricingComparison plans={pricingPlans} />
      </div>
    </section>
  );
}
