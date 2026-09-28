import { Send } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { FormField, inputClasses } from "../components/ui/FormField";
import { post } from "../lib/api";

const initialForm = {
  fullName: "",
  email: "",
  subject: "",
  message: "",
};

function validateContact(form) {
  const errors = {};
  if (!form.fullName.trim()) errors.fullName = "Vui lòng nhập họ tên.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Vui lòng nhập email hợp lệ.";
  if (!form.subject.trim()) errors.subject = "Vui lòng nhập chủ đề.";
  if (form.message.trim().length < 10) errors.message = "Nội dung cần ít nhất 10 ký tự.";
  return errors;
}

export default function ContactPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [website, setWebsite] = useState("");

  function updateField(field, value) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateContact(form);
    setErrors(nextErrors);
    setSuccess("");
    setRequestError("");

    if (Object.keys(nextErrors).length > 0) return;
    setSubmitting(true);
    try {
      await post("/api/contact", { ...form, website });
      setForm(initialForm);
      setSuccess("Đã nhận yêu cầu của bạn.");
    } catch (error) {
      setRequestError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="section-kicker">Liên hệ</p>
        <h1 className="mt-3 text-5xl font-black text-white">Trao đổi với GreenShield</h1>
        <p className="mt-4 text-lg leading-8 text-slate-400">
          Gửi yêu cầu assessment hoặc góp ý về kiểm thử bảo mật AI, báo cáo rủi ro và quy trình retest.
        </p>
      </div>

      <form className="glass-panel mt-10 rounded-3xl p-6 sm:p-8" onSubmit={handleSubmit}>
        <input aria-hidden="true" autoComplete="off" className="hidden" name="website" onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} value={website} />
        <div className="grid gap-5 md:grid-cols-2">
          <FormField error={errors.fullName} label="Họ tên" name="fullName">
            <input
              className={inputClasses}
              onChange={(event) => updateField("fullName", event.target.value)}
              value={form.fullName}
            />
          </FormField>
          <FormField error={errors.email} label="Email công việc" name="email">
            <input
              autoComplete="email"
              className={inputClasses}
              inputMode="email"
              onChange={(event) => updateField("email", event.target.value)}
              value={form.email}
            />
          </FormField>
        </div>
        <div className="mt-5">
          <FormField error={errors.subject} label="Chủ đề" name="subject">
            <input
              className={inputClasses}
              onChange={(event) => updateField("subject", event.target.value)}
              value={form.subject}
            />
          </FormField>
        </div>
        <div className="mt-5">
          <FormField error={errors.message} label="Nội dung" name="message">
            <textarea
              className={`${inputClasses} min-h-36 resize-y`}
              onChange={(event) => updateField("message", event.target.value)}
              value={form.message}
            />
          </FormField>
        </div>
        {success ? <p className="mt-5 rounded-2xl bg-emerald-300/10 p-4 text-sm text-emerald-200">{success}</p> : null}
        {requestError ? <p className="mt-5 rounded-lg bg-rose-400/10 p-4 text-sm text-rose-100" role="alert">{requestError}</p> : null}
        <p className="mt-5 text-xs leading-5 text-slate-500">Thông tin bạn gửi được lưu để xử lý yêu cầu. Đừng gửi mật khẩu hoặc token. Xem <Link className="text-emerald-200 underline" to="/privacy">quyền riêng tư</Link>.</p>
        <Button className="mt-6" disabled={submitting} type="submit">
          <Send size={17} aria-hidden="true" />
          {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
        </Button>
      </form>
    </section>
  );
}
