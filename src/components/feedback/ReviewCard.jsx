import { CheckCircle2, Sparkles, ThumbsUp } from "lucide-react";
import { StarRating } from "./StarRating";

export function ReviewCard({ review, onHelpful }) {
  return (
    <article className="glass-panel flex flex-col justify-between rounded-2xl p-5 transition hover:border-emerald-300/30">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StarRating rating={review.rating} size={15} />
            <span className="text-xs font-bold text-amber-200">{review.rating}.0</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-0.5 text-xs font-bold text-emerald-100">
              {review.plan}
            </span>
            {review.aiSystem ? (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                {review.aiSystem}
              </span>
            ) : null}
          </div>
        </div>

        <h3 className="mt-3 text-lg font-black leading-snug text-white">{review.title}</h3>
        <p className="mt-2.5 text-sm leading-6 text-slate-300">{review.comment}</p>

        {review.highlight ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] px-3 py-2 text-xs font-semibold text-emerald-200">
            <Sparkles className="shrink-0 text-emerald-300" size={14} aria-hidden="true" />
            <span>Điểm nổi bật: {review.highlight}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white">{review.author}</span>
            {review.verified ? (
              <span className="inline-flex items-center gap-1 text-emerald-300" title="Đã xác minh trải nghiệm">
                <CheckCircle2 size={13} aria-hidden="true" />
                <span className="text-[11px] font-semibold">Đã xác minh</span>
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-slate-400">
            {review.role} · {review.createdAt}
          </p>
        </div>

        {onHelpful ? (
          <button
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 font-semibold text-slate-300 transition hover:border-emerald-300/30 hover:text-white"
            onClick={() => onHelpful(review.id)}
            type="button"
          >
            <ThumbsUp size={13} aria-hidden="true" />
            <span>Hữu ích ({review.helpfulCount || 0})</span>
          </button>
        ) : null}
      </div>
    </article>
  );
}

