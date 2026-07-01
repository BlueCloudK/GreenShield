import { Send } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { FormField, inputClasses } from "../components/ui/FormField";

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

  function updateField(field, value) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateContact(form);
    setErrors(nextErrors);
    setSuccess("");

    if (Object.keys(nextErrors).length > 0) return;

    setForm(initialForm);
    setSuccess("Đã ghi nhận yêu cầu. GreenShield sẽ liên hệ lại để trao đổi phạm vi assessment.");
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
        <Button className="mt-6" type="submit">
          <Send size={17} aria-hidden="true" />
          Gửi yêu cầu
        </Button>
      </form>
    </section>
  );
}
