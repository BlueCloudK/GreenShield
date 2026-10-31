import { Filter, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { ReviewCard } from "../components/feedback/ReviewCard";
import { ReviewForm } from "../components/feedback/ReviewForm";
import { StarRating } from "../components/feedback/StarRating";
import { SectionHeader } from "../components/ui/SectionHeader";
import {
  getReviewStats,
  loadReviews,
  reviewPlans,
  saveReviews,
} from "../data/reviews";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState(() => loadReviews());
  const [selectedPlan, setSelectedPlan] = useState("ALL");
  const [selectedRating, setSelectedRating] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");

  const stats = useMemo(() => getReviewStats(reviews), [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews
      .filter((item) => {
        if (selectedPlan !== "ALL" && item.plan !== selectedPlan) return false;
        if (selectedRating !== "ALL" && Number(item.rating) !== Number(selectedRating)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "HELPFUL") return (b.helpfulCount || 0) - (a.helpfulCount || 0);
        if (sortBy === "HIGHEST") return b.rating - a.rating;
        return String(b.createdAt).localeCompare(String(a.createdAt));
      });
  }, [reviews, selectedPlan, selectedRating, sortBy]);

  function handleAddReview(newReview) {
    setReviews((current) => {
      const updated = [newReview, ...current];
      saveReviews(updated);
      return updated;
    });
  }

  function handleHelpful(reviewId) {
    setReviews((current) => {
      const updated = current.map((item) =>
        item.id === reviewId
          ? { ...item, helpfulCount: (item.helpfulCount || 0) + 1 }
          : item
      );
      saveReviews(updated);
      return updated;
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <SectionHeader
          description="Tổng hợp đánh giá thực tế từ các đội phát triển ứng dụng LLM, hệ thống RAG và AI Agent sau khi sử dụng GreenShield để kiểm thử lỗ hổng và xác minh khắc phục."
          kicker="Đánh giá sản phẩm"
          title="Trải nghiệm thực tế từ cộng đồng kỹ sư AI & Bảo mật"
        />
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-xs font-bold text-emerald-100">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>100% đánh giá gắn với kịch bản kiểm thử AI thực tế</span>
        </div>
      </div>

      {/* Summary metrics bar */}
      <div className="mt-10 grid gap-6 rounded-3xl border border-white/10 bg-slate-950/60 p-6 sm:p-8 lg:grid-cols-[0.38fr_0.62fr] lg:items-center">
        <div className="flex flex-col justify-between border-b border-white/10 pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
            Điểm đánh giá trung bình
          </p>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-5xl font-black tracking-tight text-white" data-testid="reviews-average-score">
              {stats.average}
            </span>
            <span className="text-lg font-bold text-slate-400">/ 5.0</span>
          </div>
          <div className="mt-2">
            <StarRating rating={Math.round(Number(stats.average))} size={20} />
          </div>
          <p className="mt-3 text-sm text-slate-300">
            Dựa trên <span className="font-bold text-white">{stats.total}</span> đánh giá từ Founder, CTO, AI Engineer và Security Architect.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-slate-400">Tỷ lệ khuyến nghị</p>
              <p className="mt-1 text-lg font-black text-emerald-300">{stats.recommendRate}%</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-slate-400">Đánh giá 5 sao</p>
              <p className="mt-1 text-lg font-black text-white">{stats.counts[5]} đánh giá</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.counts[star] || 0;
            const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return (
              <div className="flex items-center gap-3 text-sm" key={star}>
                <button
                  className="w-16 shrink-0 text-left font-bold text-slate-200 hover:text-emerald-300"
                  onClick={() =>
                    setSelectedRating((curr) => (curr === String(star) ? "ALL" : String(star)))
                  }
                  type="button"
                >
                  {star} sao
                </button>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-xs font-semibold text-slate-400">
                  {count} ({percent}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content: Review list + Form */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_0.85fr] lg:items-start">
        <div>
          {/* Filter controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Filter size={14} aria-hidden="true" />
                Gói:
              </span>
              {["ALL", ...reviewPlans].map((plan) => {
                const active = selectedPlan === plan;
                return (
                  <button
                    className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                      active
                        ? "border-emerald-300/40 bg-emerald-300/15 text-emerald-100"
                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white"
                    }`}
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    type="button"
                  >
                    {plan === "ALL" ? "Tất cả" : plan}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-400" htmlFor="review-sort">
                Sắp xếp:
              </label>
              <select
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200"
                id="review-sort"
                onChange={(event) => setSortBy(event.target.value)}
                value={sortBy}
              >
                <option value="NEWEST">Mới nhất</option>
                <option value="HELPFUL">Hữu ích nhất</option>
                <option value="HIGHEST">Số sao cao nhất</option>
              </select>
            </div>
          </div>

          {selectedRating !== "ALL" ? (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs text-amber-100">
              <span>Đang lọc đánh giá {selectedRating} sao</span>
              <button
                className="font-bold underline"
                onClick={() => setSelectedRating("ALL")}
                type="button"
              >
                Xóa bộ lọc sao
              </button>
            </div>
          ) : null}

          <div className="mt-5 grid gap-4" data-testid="reviews-list">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  onHelpful={handleHelpful}
                  review={review}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-8 text-center">
                <p className="text-base font-bold text-white">
                  Chưa có đánh giá nào khớp với bộ lọc hiện tại.
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Hãy thử chọn lại gói dịch vụ hoặc trở thành người đầu tiên gửi đánh giá cho mục này.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-24" id="write-review">
          <ReviewForm onAddReview={handleAddReview} />
        </div>
      </div>
    </section>
  );
}

