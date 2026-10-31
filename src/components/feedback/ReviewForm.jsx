import { MessageSquarePlus } from "lucide-react";
import { useState } from "react";
import { reviewAiSystems, reviewPlans } from "../../data/reviews";
import { Button } from "../ui/Button";
import { FormField, inputClasses } from "../ui/FormField";
import { StarRating } from "./StarRating";

const initialForm = {
  author: "",
  role: "",
  plan: reviewPlans[0],
  aiSystem: reviewAiSystems[0],
  rating: 5,
  title: "",
  comment: "",
  highlight: "",
};

function validateReview(form) {
  const errors = {};
  if (!form.author.trim()) errors.author = "Vui lòng nhập tên của bạn.";
  if (!form.role.trim()) errors.role = "Vui lòng nhập vai trò hoặc tên đội/công ty.";
  if (!form.title.trim()) errors.title = "Vui lòng nhập tiêu đề đánh giá.";
  if (form.comment.trim().length < 15) {
    errors.comment = "Nội dung đánh giá cần ít nhất 15 ký tự.";
  }
  return errors;
}

export function ReviewForm({ onAddReview }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateReview(form);
    setErrors(nextErrors);
    setSubmitted(false);

    if (Object.keys(nextErrors).length > 0) return;

    const newReview = {
      id: `rev-${Date.now()}`,
      author: form.author.trim(),
      role: form.role.trim(),
      plan: form.plan,
      aiSystem: form.aiSystem,
      rating: Number(form.rating) || 5,
      title: form.title.trim(),
      comment: form.comment.trim(),
      highlight: form.highlight.trim() || "Trải nghiệm kiểm thử bảo mật AI thực tế",
      verified: true,
      helpfulCount: 1,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    onAddReview?.(newReview);
    setForm(initialForm);
    setSubmitted(true);
  }

  return (
    <form
      className="glass-panel rounded-3xl p-6 sm:p-7"
      data-testid="product-review-form"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
            Gửi đánh giá
          </p>
          <h2 className="mt-1.5 text-2xl font-black text-white">
            Chia sẻ trải nghiệm với GreenShield
          </h2>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
        <span className="block text-sm font-semibold text-slate-200">
          Mức độ hài lòng chung
        </span>
        <div className="mt-2 flex items-center gap-3">
          <StarRating
            interactive
            onChange={(nextRating) => updateField("rating", nextRating)}
            rating={form.rating}
            size={24}
          />
          <span className="text-sm font-bold text-amber-200">
            {form.rating} / 5 sao
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FormField error={errors.author} label="Họ tên" name="author">
          <input
            className={inputClasses}
            onChange={(event) => updateField("author", event.target.value)}
            placeholder="VD: Minh Trần"
            value={form.author}
          />
        </FormField>
        <FormField error={errors.role} label="Vai trò & Đơn vị" name="role">
          <input
            className={inputClasses}
            onChange={(event) => updateField("role", event.target.value)}
            placeholder="VD: Tech Lead @ AI Startup"
            value={form.role}
          />
        </FormField>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FormField label="Gói dịch vụ sử dụng" name="plan">
          <select
            className={inputClasses}
            onChange={(event) => updateField("plan", event.target.value)}
            value={form.plan}
          >
            {reviewPlans.map((plan) => (
              <option className="bg-slate-950 text-slate-100" key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Loại hệ thống AI" name="aiSystem">
          <select
            className={inputClasses}
            onChange={(event) => updateField("aiSystem", event.target.value)}
            value={form.aiSystem}
          >
            {reviewAiSystems.map((system) => (
              <option className="bg-slate-950 text-slate-100" key={system} value={system}>
                {system}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="mt-4">
        <FormField error={errors.title} label="Tiêu đề nhận xét" name="title">
          <input
            className={inputClasses}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Tóm tắt ngắn gọn ấn tượng của bạn"
            value={form.title}
          />
        </FormField>
      </div>

      <div className="mt-4">
        <FormField error={errors.comment} label="Đánh giá chi tiết" name="comment">
          <textarea
            className={`${inputClasses} min-h-28 resize-y`}
            onChange={(event) => updateField("comment", event.target.value)}
            placeholder="Chia sẻ về trải nghiệm chạy scan, chất lượng bằng chứng (evidence), hướng dẫn khắc phục hoặc luồng retest..."
            value={form.comment}
          />
        </FormField>
      </div>

      <div className="mt-4">
        <FormField label="Điểm bạn tâm đắc nhất (tùy chọn)" name="highlight">
          <input
            className={inputClasses}
            onChange={(event) => updateField("highlight", event.target.value)}
            placeholder="VD: Phát hiện sớm rủi ro RAG leakage trước khi release"
            value={form.highlight}
          />
        </FormField>
      </div>

      {submitted ? (
        <p
          className="mt-4 rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-3.5 text-sm font-semibold text-emerald-200"
          role="status"
        >
          Cảm ơn bạn! Đánh giá của bạn đã được ghi nhận và hiển thị trong danh sách.
        </p>
      ) : null}

      <Button className="mt-5 w-full" data-testid="submit-review-button" type="submit">
        <MessageSquarePlus size={17} aria-hidden="true" />
        Đăng đánh giá sản phẩm
      </Button>
    </form>
  );
}

