import { ArrowRight, MessageSquareQuote } from "lucide-react";
import { useEffect, useState } from "react";
import { getReviewStats, loadReviews } from "../../data/reviews";
import { Button } from "../ui/Button";
import { ReviewCard } from "./ReviewCard";
import { StarRating } from "./StarRating";

export function ProductReviewsSection({ limit = 3 }) {
  const [reviews, setReviews] = useState(() => loadReviews());

  useEffect(() => {
    setReviews(loadReviews());
  }, []);

  const stats = getReviewStats(reviews);
  const featured = reviews.slice(0, limit);

  return (
    <section className="wide-container py-16" id="reviews">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
            Đánh giá từ đội ngũ kỹ thuật
          </p>
          <h2 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
            Khách hàng nói gì sau khi kiểm thử AI cùng GreenShield
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">
            Phản hồi thực tế từ các đội phát triển LLM chatbot, hệ thống RAG và AI agent về khả năng phát hiện lỗ hổng, độ rõ ràng của bằng chứng và luồng retest.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-white">{stats.average}</span>
              <span className="text-sm font-semibold text-slate-400">/ 5.0</span>
            </div>
            <div className="mt-1">
              <StarRating rating={Math.round(Number(stats.average))} size={15} />
            </div>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="text-xs text-slate-300">
            <p className="font-bold text-white">{stats.total} đánh giá xác thực</p>
            <p className="mt-1 text-emerald-300">{stats.recommendRate}% hài lòng với luồng Retest</p>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {featured.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 sm:flex-row">
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <MessageSquareQuote className="shrink-0 text-emerald-300" size={20} aria-hidden="true" />
          <span>Bạn đã trải nghiệm chạy scan hoặc đánh giá endpoint trên GreenShield?</span>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button data-testid="view-all-reviews-cta" to="/reviews" variant="secondary">
            Xem tất cả {stats.total} đánh giá <ArrowRight size={16} aria-hidden="true" />
          </Button>
          <Button data-testid="write-review-cta" to="/reviews#write-review">
            Viết đánh giá của bạn
          </Button>
        </div>
      </div>
    </section>
  );
}

