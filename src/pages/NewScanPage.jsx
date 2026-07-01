import { AlertTriangle, Bot, CheckCircle2, DatabaseZap, Globe2, ShieldCheck, Workflow } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RiskModuleCard } from "../components/scan/RiskModuleCard";
import { Button } from "../components/ui/Button";
import { FormField, inputClasses } from "../components/ui/FormField";
import { riskModules } from "../data/scans";
import { getAppTypeLabel, getEnvironmentLabel, getModuleLabel } from "../utils/reportLabels";

const appTypes = ["Chatbot", "RAG System", "AI Agent", "AI API"];
const environments = ["Demo", "Staging", "Production"];
const steps = ["Thông tin app", "Mục tiêu test", "Module rủi ro", "Xác nhận"];

const demoPresets = [
  {
    title: "RAG nội bộ",
    description: "Kịch bản phổ biến cho chatbot hỏi đáp tài liệu công ty.",
    icon: DatabaseZap,
    form: {
      appName: "Trợ lý hỗ trợ",
      appType: "RAG System",
      environment: "Staging",
      endpoint: "https://demo.greenshield.local/support-copilot",
      ragNotes: "Tài liệu hỗ trợ nội bộ có phân quyền theo vai trò.",
      modules: riskModules.slice(0, 4),
    },
  },
  {
    title: "AI agent bán hàng",
    description: "Kiểm tra tool call, quyền thao tác và approval flow.",
    icon: Workflow,
    form: {
      appName: "Agent bán hàng",
      appType: "AI Agent",
      environment: "Demo",
      endpoint: "https://demo.greenshield.local/sales-agent",
      ragNotes: "Agent có quyền đọc CRM và tạo task follow-up.",
      modules: ["Unsafe Tool Calls", "Agent Permission Risk", "API / Key Exposure"],
    },
  },
  {
    title: "Chatbot công khai",
    description: "Kiểm tra prompt injection và rò rỉ thông tin từ bot công khai.",
    icon: Bot,
    form: {
      appName: "Bot FAQ công khai",
      appType: "Chatbot",
      environment: "Production",
      endpoint: "https://demo.greenshield.local/public-faq",
      ragNotes: "Bot trả lời câu hỏi từ website public và FAQ sản phẩm.",
      modules: ["Prompt Injection", "API / Key Exposure", "Logging / Sensitive Data Exposure"],
    },
  },
];

const defaultForm = {
  appName: "Trợ lý hỗ trợ",
  appType: "RAG System",
  environment: "Staging",
  endpoint: "https://demo.greenshield.local/support-copilot",
  apiKey: "",
  systemPrompt: "",
  ragNotes: "Tài liệu hỗ trợ nội bộ có phân quyền theo vai trò.",
  modules: riskModules.slice(0, 4),
};

export default function NewScanPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(defaultForm);
  const [selectedPreset, setSelectedPreset] = useState("RAG nội bộ");

  const canContinue = useMemo(() => {
    if (step === 0) return form.appName.trim() && form.appType && form.environment;
    if (step === 1) return form.endpoint.trim();
    if (step === 2) return form.modules.length > 0;
    return true;
  }, [form, step]);

  const validationHint = useMemo(() => {
    if (step === 0 && !form.appName.trim()) return "Vui lòng nhập tên app để tiếp tục.";
    if (step === 1 && !form.endpoint.trim()) return "Vui lòng nhập URL hoặc mục tiêu scan.";
    if (step === 2 && form.modules.length === 0) return "Chọn ít nhất một module rủi ro.";
    return "";
  }, [form, step]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function applyPreset(preset) {
    setSelectedPreset(preset.title);
    setForm((current) => ({
      ...current,
      ...preset.form,
      apiKey: "",
      systemPrompt: "",
    }));
  }

  function toggleModule(module) {
    setForm((current) => ({
      ...current,
      modules: current.modules.includes(module)
        ? current.modules.filter((item) => item !== module)
        : [...current.modules, module],
    }));
  }

  function nextStep() {
    if (step < steps.length - 1) setStep((current) => current + 1);
  }

  function runScan() {
    navigate("/scan/progress", { state: { scanTarget: form } });
  }

  return (
    <section className="mx-auto min-w-0 max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div className="min-w-0">
          <p className="text-sm font-bold text-emerald-200">Tạo phiên scan</p>
          <h1 className="mt-3 max-w-3xl break-words text-3xl font-black leading-tight text-white sm:text-5xl">
            Chạy thử một phiên kiểm thử bảo mật AI
          </h1>
          <p className="mt-4 max-w-2xl break-words text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
            Chọn kịch bản mẫu, chỉnh thông tin nếu muốn, chạy scan và xem báo cáo kết quả.
          </p>
        </div>
        <div className="min-w-0 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
            <p className="min-w-0 break-words">Môi trường dùng thử. Không nhập production secret, token thật hoặc dữ liệu khách hàng thật.</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {demoPresets.map((preset) => {
          const Icon = preset.icon;
          const selected = selectedPreset === preset.title;

          return (
            <button
              className={`focus-ring rounded-2xl border p-5 text-left transition ${
                selected
                  ? "border-emerald-300/45 bg-emerald-300/10"
                  : "border-white/10 bg-slate-950/45 hover:border-emerald-300/30"
              }`}
              key={preset.title}
              onClick={() => applyPreset(preset)}
              type="button"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200">
                  <Icon size={20} aria-hidden="true" />
                </span>
                {selected ? <CheckCircle2 className="text-emerald-300" size={20} aria-hidden="true" /> : null}
              </div>
              <h2 className="mt-4 text-lg font-black text-white">{preset.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{preset.description}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-2xl border border-white/10 bg-slate-950/55 p-4 lg:sticky lg:top-24">
          <div className="space-y-2">
            {steps.map((label, index) => {
              const completed = index < step;
              const current = index === step;

              return (
                <button
                  className={`focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
                    current
                      ? "bg-emerald-300/10 text-emerald-100"
                      : completed
                        ? "text-emerald-200 hover:bg-white/[0.06]"
                        : "text-slate-500 hover:bg-white/[0.06]"
                  }`}
                  key={label}
                  onClick={() => setStep(index)}
                  type="button"
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                      completed
                        ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"
                        : current
                          ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
                          : "border-white/10"
                    }`}
                  >
                    {completed ? <CheckCircle2 size={15} aria-hidden="true" /> : index + 1}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-sm font-black text-white">Mục tiêu scan</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{form.appName}</p>
            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-200">
              <Globe2 size={14} aria-hidden="true" />
              {form.environment}
            </div>
          </div>
        </aside>

        <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-5 sm:p-7">
          {step === 0 ? (
            <div>
              <h2 className="text-2xl font-black text-white">Thông tin app</h2>
              <p className="mt-2 text-sm text-slate-400">Có thể dùng preset hoặc chỉnh nhanh thông tin để tạo phiên scan.</p>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <FormField label="Tên app" name="appName">
                  <input className={inputClasses} onChange={(event) => updateField("appName", event.target.value)} value={form.appName} />
                </FormField>
                <FormField label="Loại app" name="appType">
                  <select className={inputClasses} onChange={(event) => updateField("appType", event.target.value)} value={form.appType}>
                    {appTypes.map((type) => (
                      <option key={type} value={type}>{getAppTypeLabel(type)}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Môi trường" name="environment">
                  <select className={inputClasses} onChange={(event) => updateField("environment", event.target.value)} value={form.environment}>
                    {environments.map((environment) => (
                      <option key={environment} value={environment}>{getEnvironmentLabel(environment)}</option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div>
              <h2 className="text-2xl font-black text-white">Mục tiêu test</h2>
              <div className="mt-6 space-y-5">
                <FormField label="Endpoint URL hoặc mục tiêu scan" name="endpoint">
                  <input className={inputClasses} onChange={(event) => updateField("endpoint", event.target.value)} value={form.endpoint} />
                </FormField>
                <FormField label="API key/token tùy chọn" name="apiKey">
                  <input className={inputClasses} onChange={(event) => updateField("apiKey", event.target.value)} placeholder="Để trống nếu không cần xác thực" value={form.apiKey} />
                </FormField>
                <FormField label="Prompt hệ thống hoặc policy tùy chọn" name="systemPrompt">
                  <textarea className={`${inputClasses} min-h-28`} onChange={(event) => updateField("systemPrompt", event.target.value)} value={form.systemPrompt} />
                </FormField>
                <FormField label="Ghi chú knowledge base cho RAG" name="ragNotes">
                  <textarea className={`${inputClasses} min-h-28`} onChange={(event) => updateField("ragNotes", event.target.value)} value={form.ragNotes} />
                </FormField>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <h2 className="text-2xl font-black text-white">Module rủi ro</h2>
              <p className="mt-2 text-sm text-slate-400">Chọn những nhóm kiểm thử muốn xuất hiện trong report mẫu.</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {riskModules.map((module) => (
                  <RiskModuleCard
                    key={module}
                    module={module}
                    onToggle={() => toggleModule(module)}
                    selected={form.modules.includes(module)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <h2 className="text-2xl font-black text-white">Xác nhận phiên scan</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  ["App", form.appName],
                  ["Loại", getAppTypeLabel(form.appType)],
                  ["Môi trường", getEnvironmentLabel(form.environment)],
                  ["Mục tiêu", form.endpoint],
                  ["Số module", `${form.modules.length} module rủi ro`],
                  ["Module", form.modules.map(getModuleLabel).join(", ")],
                ].map(([label, value]) => (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4" key={label}>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                    <p className="mt-2 break-words text-sm font-semibold text-slate-200">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-50">
                <ShieldCheck className="mb-3 text-emerald-200" size={20} aria-hidden="true" />
                Sau khi bấm chạy scan, GreenShield sẽ hiển thị tiến trình kiểm thử và mở báo cáo mẫu để xem kết quả.
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))} variant="secondary">
              Quay lại
            </Button>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              {validationHint ? <p className="text-sm text-amber-200">{validationHint}</p> : null}
              {step < steps.length - 1 ? (
                <Button disabled={!canContinue} onClick={nextStep}>
                  Tiếp tục
                </Button>
              ) : (
                <Button onClick={runScan}>Chạy scan</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
