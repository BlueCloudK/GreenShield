import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  Info,
  Layers,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/Button";
import { PricingComparison } from "../components/pricing/PricingComparison";
import { useAuth } from "../context/AuthContext";
import { pricingPlans } from "../data/scans";

const planBadges = ["Cơ bản", "Khuyến nghị", "Nâng cao", "Doanh nghiệp"];

const appPlans = [
  {
    id: "preview",
    name: "Product Preview",
    badge: "Cơ bản",
    targetUser: "Dành cho Founder và Developer muốn làm quen luồng kiểm thử",
    listPrice: "Miễn phí (Pilot)",
    priceSubtext: "Không giới hạn thời gian trải nghiệm trên Demo Target",
    features: [
      "Kiểm thử trên Demo Target an toàn",
      "4 bộ security tests cốt lõi (Prompt Injection, RAG, Tool, API)",
      "Báo cáo HTML xem trước phát hiện",
      "Quy trình chuyển đổi vulnerable / fixed",
    ],
    highlight: false,
    cta: "Gói mặc định",
  },
  {
    id: "assessment",
    name: "AI App Assessment",
    badge: "Khuyến nghị",
    targetUser: "Dành cho Startup và đội ngũ đưa Chatbot, RAG hoặc AI Agent vào vận hành",
    listPrice: "2.490.000 ₫",
    priceSubtext: "Thanh toán theo đợt đánh giá · Cổng VietQR PayOS",
    features: [
      "Kết nối Target AI thật (HTTPS Endpoint, Chatbot, RAG, Agent)",
      "Quét bảo mật toàn diện có bằng chứng (Attack Evidence)",
      "Tự động che dữ liệu nhạy cảm (API Keys, Token, Bearer, Secret)",
      "Khuyến nghị kỹ thuật cho Dev & Kiểm thử lại (Retest) không giới hạn",
      "Xuất báo cáo PDF chính thức & Đối chiếu rủi ro trước/sau fix",
    ],
    highlight: true,
    cta: "Nâng cấp lên gói này",
  },
  {
    id: "redteam",
    name: "Red Team Sprint",
    badge: "Nâng cao",
    targetUser: "Đội ngũ AI cần chuyên gia bảo mật Pentest và đánh giá đa mục tiêu",
    listPrice: "9.900.000 ₫",
    priceSubtext: "Theo sprint đánh giá chuyên sâu & Đội ngũ review",
    features: [
      "Đánh giá nhiều Target trong cùng hệ thống AI",
      "Kịch bản tấn công chuỗi phức tạp (Multi-step Agent Jailbreak)",
      "Review finding thủ công từ Security Architect",
      "Họp chuyển giao kỹ thuật & Phiên Retest chuyên sâu sau fix",
    ],
    highlight: false,
    cta: "Yêu cầu tư vấn Red Team",
  },
  {
    id: "custom",
    name: "Custom Program",
    badge: "Doanh nghiệp",
    targetUser: "Doanh nghiệp SME cần chương trình audit bảo mật AI định kỳ",
    listPrice: "Liên hệ",
    priceSubtext: "Thiết kế riêng theo SLA và phạm vi hệ sinh thái AI",
    features: [
      "Phạm vi kiểm thử tùy chỉnh theo kiến trúc doanh nghiệp",
      "Tích hợp quy trình CI/CD & Scan định kỳ trước khi release",
      "Báo cáo tùy biến cho cả Ban giám đốc và Đội kỹ thuật",
      "Hỗ trợ kỹ thuật 1-1 và cam kết thời gian phản hồi",
    ],
    highlight: false,
    cta: "Liên hệ tư vấn",
  },
];

export default function PlansPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [cfg, hist] = await Promise.all([
        api("/api/payments/config").catch(() => null),
        api("/api/payments/orders").catch(() => ({ orders: [] })),
      ]);
      setPaymentConfig(cfg);
      setOrders(hist?.orders || []);
    } catch (err) {
      setError(err.message || "Không thể tải thông tin gói dịch vụ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Kiểm tra gói hiện tại dựa trên đơn hàng đã thanh toán
  const paidOrders = useMemo(
    () => orders.filter((order) => order.status === "PAID"),
    [orders]
  );
  const hasPaidAssessment = paidOrders.length > 0;
  const pendingOrder = useMemo(
    () => orders.find((order) => ["CREATING", "PENDING", "UNKNOWN"].includes(order.status)),
    [orders]
  );

  const currentPlan = hasPaidAssessment
    ? {
        name: "AI App Assessment",
        status: "ĐÃ KÍCH HOẠT (ACTIVE)",
        statusBadge: "border-emerald-300/30 bg-emerald-300/15 text-emerald-200",
        description:
          "Workspace của bạn đang được mở khóa đầy đủ tính năng kết nối Target thật, lưu lịch sử bằng chứng tấn công và Retest sau khi khắc phục.",
        quota: "Theo đợt đánh giá",
        retest: "Không giới hạn",
        report: "Full Technical Report (Evidence + Masking)",
        target: "Hỗ trợ Target thật & Target demo",
      }
    : {
        name: "Product Preview (Pilot)",
        status: "GÓI DÙNG THỬ CƠ BẢN",
        statusBadge: "border-sky-300/30 bg-sky-300/15 text-sky-200",
        description:
          "Workspace đang sử dụng gói trải nghiệm Pilot trên Demo Target. Nâng cấp lên gói AI App Assessment để quét target chatbot/API thật của doanh nghiệp.",
        quota: "Chạy thử nghiệm Pilot",
        retest: "Theo phiên demo",
        report: "HTML Preview",
        target: "Demo Target an toàn",
      };

  function handleSelectPlan(planId) {
    if (planId === "assessment") {
      navigate("/app/billing");
    } else if (planId === "redteam" || planId === "custom") {
      navigate("/contact");
    } else {
      navigate("/app/projects/new");
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">
            <Layers size={14} aria-hidden="true" />
            <span>WORKSPACE SUBSCRIPTION & PLANS</span>
          </div>
          <h1 className="mt-2 text-3xl font-black text-white">
            Gói dịch vụ & Lựa chọn nâng cấp
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Quản lý gói kiểm thử bảo mật cho Workspace{" "}
            <span className="font-bold text-slate-200">{user?.workspace?.name}</span>. Nâng cấp để mở khóa kết nối Target thật và xác minh Retest sau fix.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={loadData} variant="secondary">
            <RefreshCw size={15} aria-hidden="true" /> Làm mới
          </Button>
          <Button to="/app/billing" variant="primary">
            <CreditCard size={15} aria-hidden="true" /> Đi tới Thanh toán & Hóa đơn
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-rose-300/30 bg-rose-400/10 p-4 text-sm text-rose-200" role="alert">
          <AlertCircle size={18} className="shrink-0 text-rose-300" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* 1. KHUNG GÓI HIỆN TẠI (CURRENT ACTIVE PLAN BANNER) */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-emerald-300/30 bg-gradient-to-r from-emerald-950/40 via-slate-950/80 to-[#070e17] p-6 sm:p-8 shadow-[0_20px_60px_rgba(16,185,129,0.08)]">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Gói hiện tại của Workspace:
              </span>
              <span className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-black ${currentPlan.statusBadge}`}>
                {currentPlan.status}
              </span>
              {pendingOrder ? (
                <span className="rounded-full border border-amber-300/30 bg-amber-300/15 px-2.5 py-0.5 text-xs font-bold text-amber-200">
                  Đang có đơn chờ thanh toán #{pendingOrder.order_code}
                </span>
              ) : null}
            </div>

            <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
              {currentPlan.name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {currentPlan.description}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                <p className="text-slate-400">Phạm vi Target</p>
                <p className="mt-1 font-bold text-slate-100">{currentPlan.target}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                <p className="text-slate-400">Lượt Scan</p>
                <p className="mt-1 font-bold text-slate-100">{currentPlan.quota}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                <p className="text-slate-400">Kiểm thử lại (Retest)</p>
                <p className="mt-1 font-bold text-emerald-300">{currentPlan.retest}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                <p className="text-slate-400">Báo cáo bằng chứng</p>
                <p className="mt-1 font-bold text-slate-100">{currentPlan.report}</p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
            {hasPaidAssessment ? (
              <Button to="/app/billing" variant="secondary" className="w-full sm:w-auto">
                <CreditCard size={16} aria-hidden="true" />
                Xem biên lai & lịch sử đơn
              </Button>
            ) : (
              <Button to="/app/billing" variant="primary" className="w-full sm:w-auto">
                <Zap size={16} aria-hidden="true" />
                Nâng cấp lên Assessment ngay
              </Button>
            )}
            <Button to="/app/projects/new" variant="ghost" className="w-full sm:w-auto">
              Chạy phiên kiểm thử mới <ArrowRight size={15} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      {/* 2. DANH SÁCH 4 GÓI DỊCH VỤ ĐỂ CHỌN */}
      <div className="mt-8">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-black text-white">Lựa chọn gói kiểm thử bảo mật</h2>
            <p className="text-xs text-slate-400">
              Chọn gói phù hợp với quy mô và yêu cầu kiểm thử của hệ thống AI bạn đang xây dựng.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
          {appPlans.map((plan) => {
            const isCurrent =
              (plan.id === "assessment" && hasPaidAssessment) ||
              (plan.id === "preview" && !hasPaidAssessment);

            return (
              <article
                className={`glass-panel flex flex-col justify-between rounded-3xl p-6 transition ${
                  plan.highlight
                    ? "border-emerald-300/40 bg-emerald-950/20 shadow-[0_20px_60px_rgba(16,185,129,0.10)]"
                    : "border-white/10"
                } ${isCurrent ? "ring-2 ring-emerald-300/40" : ""}`}
                key={plan.id}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-black ${
                        plan.highlight
                          ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-200"
                          : "border-white/10 bg-white/[0.04] text-slate-300"
                      }`}
                    >
                      {plan.badge}
                    </span>
                    {isCurrent ? (
                      <span className="rounded-full bg-emerald-300 px-2.5 py-0.5 text-[11px] font-black text-slate-950">
                        Gói hiện tại
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-4 text-xl font-black text-white">{plan.name}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-400 min-h-[2.5rem]">
                    {plan.targetUser}
                  </p>

                  <div className="mt-4 border-y border-white/10 py-4">
                    <p className="text-2xl font-black text-white">{plan.listPrice}</p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-400">
                      {plan.priceSubtext}
                    </p>
                  </div>

                  <ul className="mt-5 space-y-2.5 text-xs text-slate-300">
                    {plan.features.map((feat) => (
                      <li className="flex items-start gap-2" key={feat}>
                        <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={14} aria-hidden="true" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  {isCurrent ? (
                    <Button
                      className="w-full"
                      disabled
                      variant="secondary"
                    >
                      <CheckCircle2 size={15} /> Đang sử dụng gói này
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleSelectPlan(plan.id)}
                      variant={plan.highlight ? "primary" : "secondary"}
                    >
                      {plan.cta}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* 4. BẢNG SO SÁNH TÍNH NĂNG CHI TIẾT NGAY TRONG APP */}
      <div className="mt-12">
        <PricingComparison plans={pricingPlans} />
      </div>
    </section>
  );
}
