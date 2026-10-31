import { Star } from "lucide-react";

export function StarRating({ rating = 5, size = 16, interactive = false, onChange }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="inline-flex items-center gap-1" role={interactive ? "radiogroup" : undefined} aria-label={`Đánh giá ${rating} trên 5 sao`}>
      {stars.map((star) => {
        const filled = star <= rating;
        if (interactive) {
          return (
            <button
              aria-checked={star === rating}
              aria-label={`${star} sao`}
              className="focus-ring rounded p-0.5 text-amber-300 transition hover:scale-110"
              key={star}
              onClick={() => onChange?.(star)}
              role="radio"
              type="button"
            >
              <Star
                className={filled ? "fill-amber-300 text-amber-300" : "text-slate-600"}
                size={size}
              />
            </button>
          );
        }

        return (
          <Star
            aria-hidden="true"
            className={filled ? "fill-amber-300 text-amber-300" : "text-slate-700"}
            key={star}
            size={size}
          />
        );
      })}
    </div>
  );
}

