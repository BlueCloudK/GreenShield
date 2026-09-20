import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { FormField, inputClasses } from "../components/ui/FormField";
import { post } from "../lib/api";

export default function NewProjectPage() {
  const [form, setForm] = useState({ name: "My AI Assistant", description: "Trợ lý AI dùng trong demo security assessment.", targetType: "DEMO", environment: "DEMO" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true); setError("");
    try {
      const result = await post("/api/projects", form);
      navigate(`/app/projects/${result.project.id}`);
    } catch (requestError) { setError(requestError.message); } finally { setSubmitting(false); }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="section-kicker">Project mới</p><h1 className="mt-2 text-3xl font-black text-white">Ứng dụng AI cần kiểm thử</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">Tạo project trước, sau đó kết nối target và Test Connection trong workspace của project.</p>
      <form className="mt-8 space-y-5 rounded-lg border border-white/10 bg-[#0a1019] p-6" onSubmit={submit}>
        <FormField label="Tên project" name="project-name"><input className={inputClasses} name="project-name" onChange={(e) => setForm({ ...form, name: e.target.value })} required value={form.name} /></FormField>
        <FormField label="Mô tả" name="description"><textarea className={`${inputClasses} min-h-24 resize-y`} name="description" onChange={(e) => setForm({ ...form, description: e.target.value })} value={form.description} /></FormField>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Loại target" name="target-type"><select className={inputClasses} name="target-type" onChange={(e) => setForm({ ...form, targetType: e.target.value })} value={form.targetType}><option value="DEMO">Demo target đi kèm</option><option value="HTTP_CHATBOT">HTTP chatbot</option><option value="RAG_ENDPOINT">RAG endpoint</option><option value="AI_AGENT">AI agent</option></select></FormField>
          <FormField label="Môi trường" name="environment"><select className={inputClasses} name="environment" onChange={(e) => setForm({ ...form, environment: e.target.value })} value={form.environment}><option value="DEMO">Demo</option><option value="STAGING">Staging</option><option value="PRODUCTION">Production</option></select></FormField>
        </div>
        {error ? <p className="rounded-lg bg-rose-400/10 p-3 text-sm text-rose-100">{error}</p> : null}
        <div className="flex justify-end gap-3"><Button to="/app/projects" variant="ghost">Hủy</Button><Button data-testid="project-create-submit" disabled={submitting || !form.name.trim()} type="submit">{submitting ? "Đang tạo..." : "Tạo project"}</Button></div>
      </form>
    </section>
  );
}
