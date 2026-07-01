import { MessageSquareText, Star } from "lucide-react";
import { useState } from "react";
import { readStorage, writeStorage } from "../../utils/storage";
import { Button } from "../ui/Button";
import { FormField, inputClasses } from "../ui/FormField";

const FEEDBACK_KEY = "greenshield_demo_feedback";

export function FeedbackPanel({ source = "demo" }) {
  const [rating, setRating] = useState(4);
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function submitFeedback(event) {
    event.preventDefault();
    setError("");

    if (message.trim().length < 10) {
      setError("Vui lòng nhập ít nhất 10 ký tự để feedback có giá trị.");
      return;
    }

    const current = readStorage(FEEDBACK_KEY, []);
    writeStorage(FEEDBACK_KEY, [
      {
        id: `fb-${Date.now()}`,
        source,
        rating,
        role: role.trim(),
        message: message.trim(),
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);

    setSubmitted(true);
    setMessage("");
  }

  return (
    <section className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.055] p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200">
          <MessageSquareText size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-black text-white">Gửi góp ý cho GreenShield</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Chia sẻ điều bạn muốn cải thiện trong flow scan, báo cáo rủi ro hoặc hướng retest.
          </p>
        </div>
      </div>

      <form className="mt-5 space-y-4" onSubmit={submitFeedback}>
        <div>
          <p className="text-sm font-semibold text-slate-200">Bạn chấm trải nghiệm này mấy điểm?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                className={`focus-ring inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                  rating >= value
                    ? "border-emerald-300/35 bg-emerald-300/15 text-emerald-100"
                    : "border-white/10 bg-slate-950/40 text-slate-500 hover:text-slate-200"
                }`}
                key={value}
                onClick={() => setRating(value)}
                type="button"
              >
                <Star size={17} fill="currentColor" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        <FormField label="Vai trò của bạn" name="feedbackRole">
          <input
            className={inputClasses}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Founder, developer, security engineer..."
            value={role}
          />
        </FormField>

        <FormField error={error} label="Điều bạn muốn GreenShield cải thiện" name="feedbackMessage">
          <textarea
            className={`${inputClasses} min-h-28 resize-y`}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ví dụ: flow scan cần ngắn hơn, report cần dễ hiểu hơn, cần export PDF..."
            value={message}
          />
        </FormField>

        {submitted ? (
          <p className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
            Đã ghi nhận góp ý. Cảm ơn bạn.
          </p>
        ) : null}

        <Button type="submit">Gửi feedback</Button>
      </form>
    </section>
  );
}
