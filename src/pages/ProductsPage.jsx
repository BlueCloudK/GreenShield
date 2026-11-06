import { CheckCircle2 } from "lucide-react";
import { ProductReviewsSection } from "../components/feedback/ProductReviewsSection";
import { PricingComparison } from "../components/pricing/PricingComparison";
import { Button } from "../components/ui/Button";
import { pricingPlans } from "../data/scans";

export default function ProductsPage({ insideAccount = false }) {
  return (
    <>
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-bold text-emerald-300">Bảng giá</p>
      <h1 className="mt-2 text-3xl font-black text-white">Gói kiểm thử bảo mật AI</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Các gói và hạn mức dưới đây đang được hoàn thiện. Liên hệ GreenShield để xác nhận phạm vi và đăng ký.</p>
      {insideAccount ? <Button className="mt-4" to="/app/billing" variant="secondary">Xem lịch sử thanh toán</Button> : null}
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {pricingPlans.map((plan) => (
          <article className="glass-panel flex min-w-0 flex-col rounded-lg p-5" key={plan.id}>
            <h2 className="text-xl font-bold text-white">{plan.name}</h2>
            <p className="mt-2 min-h-10 text-sm text-slate-400">{plan.targetUser}</p>
            <p className="mt-5 text-2xl font-black text-white">{plan.price}</p>
            <p className="mt-1 text-sm text-slate-400">{plan.priceNote}</p>
            <ul className="mt-5 flex-1 space-y-3 border-t border-white/10 pt-5 text-sm text-slate-300">
              {[plan.applications, plan.tests, plan.members, ...plan.features].map((feature, index) => <li className="flex gap-2" key={`${plan.id}-${index}`}><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={16} aria-hidden="true" />{feature}</li>)}
            </ul>
            <Button className="mt-6 w-full" to={plan.id === "enterprise" ? "/contact" : `/app/billing?plan=${plan.id}`} variant={plan.id === "team" ? "primary" : "secondary"}>{plan.id === "enterprise" ? "Liên hệ tư vấn" : "Chọn gói"}</Button>
          </article>
        ))}
      </div>
      <div className="mt-10"><PricingComparison plans={pricingPlans} /></div>
    </section>
    {!insideAccount ? <div className="border-t border-white/10"><ProductReviewsSection limit={3} /></div> : null}
    </>
  );
}
