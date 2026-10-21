import { Activity, FlaskConical, Play, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import { FormField, inputClasses } from "../components/ui/FormField";
import { EvaluationReport } from "../components/evaluator/EvaluationReport";
import { api, post } from "../lib/api";

const defaults = {
  name: "Chatbot benchmark",
  url: "",
  method: "POST",
  headers: '{"Content-Type":"application/json"}',
  apiKey: "",
  template: '{\n  "message": "{{PROMPT}}"\n}',
  promptField: "message",
  responsePath: "answer",
  timeout: 10000,
  delay: 500,
  conversation: "none",
  suite: 10,
  demo: true,
  authorized: false,
};
const statuses = { QUEUED: "Đang chuẩn bị", RUNNING: "Đang đánh giá", COMPLETED: "Hoàn tất", FAILED: "Thất bại", CANCELLED: "Đã dừng" };
export default function EndpointEvaluatorPage() {
  const [config, setConfig] = useState(defaults);
  const [current, setCurrent] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [history, setHistory] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState(null);
  const [historyError, setHistoryError] = useState("");
  const running = ["QUEUED", "RUNNING"].includes(evaluation?.status);
  const disabled = pending || running;
  const update = (key, value) => {
    setConfig((old) => ({ ...old, [key]: value }));
    setConnection(null);
  };
  async function loadHistory() {
    try {
      setHistory((await api("/api/evaluations")).evaluations);
      setHistoryError("");
    } catch (e) {
      setHistoryError(e.message);
    }
  }
  useEffect(() => {
    loadHistory();
  }, []);
  useEffect(() => {
    if (!current) return;
    let active = true,
      timer;
    async function poll() {
      try {
        const result = (await api(`/api/evaluations/${current}`)).evaluation;
        if (!active) return;
        setEvaluation(result);
        if (["QUEUED", "RUNNING"].includes(result.status)) timer = setTimeout(poll, 700);
        else loadHistory();
      } catch (e) {
        if (active) setError(e.message);
      }
    }
    poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [current]);
  async function run(connectionOnly = false) {
    setPending(true);
    setError("");
    setConnection(null);
    try {
      if (connectionOnly) setConnection((await post("/api/evaluations/connection", config)).result);
      else {
        const result = await post("/api/evaluations", config);
        setEvaluation({ status: "QUEUED", progress: 0, total: 0 });
        setCurrent(result.id);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }
  async function cancel() {
    try {
      await post(`/api/evaluations/${current}/cancel`);
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold">Đánh giá chatbot</h1>
      </div>
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              run();
            }}
            className="mt-5"
          >
            <fieldset disabled={disabled}>
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="endpoint-mode" checked={config.demo} onChange={() => update("demo", true)} />
                  <FlaskConical size={16} /> Demo fixture
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="endpoint-mode" checked={!config.demo} onChange={() => update("demo", false)} />
                  Endpoint thật
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Tên phiên">
                  <input className={inputClasses} value={config.name} maxLength={100} onChange={(e) => update("name", e.target.value)} />
                </FormField>
                <FormField label="Bộ benchmark">
                  <select className={inputClasses} value={config.suite} onChange={(e) => update("suite", Number(e.target.value))}>
                    {[10, 20, 30].map((n) => (
                      <option value={n} key={n}>
                        {n} test
                      </option>
                    ))}
                  </select>
                </FormField>
                {!config.demo && (
                  <>
                    <div className="sm:col-span-2">
                      <FormField label="Endpoint URL">
                        <input
                          required
                          type="url"
                          className={inputClasses}
                          placeholder="https://api.example.com/chat"
                          value={config.url}
                          onChange={(e) => update("url", e.target.value)}
                        />
                      </FormField>
                    </div>
                    <FormField label="HTTP method">
                      <select className={inputClasses} value={config.method} onChange={(e) => update("method", e.target.value)}>
                        <option>POST</option>
                        <option>GET</option>
                      </select>
                    </FormField>
                    <FormField label="Timeout">
                      <select className={inputClasses} value={config.timeout} onChange={(e) => update("timeout", Number(e.target.value))}>
                        {[5000, 10000, 15000].map((n) => (
                          <option value={n} key={n}>
                            {n / 1000} giây
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="API key (tùy chọn)">
                      <input
                        type="password"
                        autoComplete="off"
                        className={inputClasses}
                        value={config.apiKey}
                        onChange={(e) => update("apiKey", e.target.value)}
                      />
                    </FormField>
                    <FormField label="Response JSON path">
                      <input
                        className={inputClasses}
                        placeholder="choices[0].message.content"
                        value={config.responsePath}
                        onChange={(e) => update("responsePath", e.target.value)}
                      />
                    </FormField>
                    <FormField label="Headers (JSON)">
                      <textarea
                        rows={3}
                        className={`${inputClasses} font-mono`}
                        value={config.headers}
                        onChange={(e) => update("headers", e.target.value)}
                      />
                    </FormField>
                    <FormField label="Request body">
                      <textarea
                        rows={3}
                        className={`${inputClasses} font-mono`}
                        value={config.template}
                        onChange={(e) => update("template", e.target.value)}
                      />
                    </FormField>
                    <FormField label="Prompt field">
                      <input className={inputClasses} value={config.promptField} onChange={(e) => update("promptField", e.target.value)} />
                    </FormField>
                    <FormField label="Khoảng cách request (ms)">
                      <input
                        type="number"
                        min={100}
                        max={2000}
                        className={inputClasses}
                        value={config.delay}
                        onChange={(e) => update("delay", Number(e.target.value))}
                      />
                    </FormField>
                  </>
                )}
                <FormField label="Hội thoại">
                  <select
                    className={inputClasses}
                    value={config.conversation}
                    onChange={(e) => {
                      setConfig((old) => ({
                        ...old,
                        conversation: e.target.value,
                        template:
                          e.target.value === "messages" ? '{"messages":[{"role":"user","content":"{{PROMPT}}"}]}' : defaults.template,
                      }));
                    }}
                  >
                    <option value="none">Một lượt</option>
                    <option value="messages">Messages / nhiều lượt</option>
                  </select>
                </FormField>
              </div>
            </fieldset>
            {!config.demo && (
              <label className="mt-4 flex items-start gap-2 text-sm text-amber-200">
                <input required type="checkbox" disabled={disabled} className="mt-1" checked={config.authorized} onChange={event => update('authorized', event.target.checked)} />
                Tôi có quyền kiểm thử endpoint này và chấp nhận chi phí request từ nhà cung cấp.
              </label>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" disabled={disabled} onClick={() => run(true)}>
                <Activity size={16} /> Kiểm tra kết nối
              </Button>
              <Button type="submit" disabled={disabled}>
                <Play size={16} />
                {pending ? "Đang gửi…" : "Chạy benchmark"}
              </Button>
              {running && (
                <Button variant="danger" onClick={cancel}>
                  <Square size={16} /> Dừng
                </Button>
              )}
            </div>
          </form>
          {error && (
            <p role="alert" className="mt-3 text-sm text-rose-300">
              {error}
            </p>
          )}
          {connection && (
            <div className="mt-3 border-l-2 border-cyan-300 pl-3 text-sm">
              <b>{connection.status === "ERROR" ? "Kết nối thất bại" : "Kết nối thành công"}</b>
              <p className="mt-1 break-words text-slate-400">{connection.status === "ERROR" ? connection.reason : connection.response}</p>
            </div>
          )}
          {evaluation && (
            <div className="mt-5" aria-live="polite">
              <div className="flex justify-between gap-3 text-sm">
                <span>{statuses[evaluation.status]}</span>
                <span>
                  {evaluation.progress}/{evaluation.total} test
                </span>
              </div>
              <progress
                aria-label="Tiến trình benchmark"
                className="mt-2 h-2 w-full accent-emerald-300"
                max={evaluation.total || 1}
                value={evaluation.progress}
              />
              {evaluation.error_message && <p className="mt-2 text-sm text-amber-200">{evaluation.error_message}</p>}
            </div>
          )}
          {evaluation?.report && <EvaluationReport key={evaluation.id} report={evaluation.report} />}
        </div>
        <aside className="min-w-0 border-t border-white/10 pt-5 xl:border-l xl:border-t-0 xl:pl-5" aria-label="Lịch sử benchmark">
          <h2 className="font-semibold">Lịch sử</h2>
          {historyError && (
            <button className="mt-3 text-sm text-rose-300" onClick={loadHistory}>
              {historyError} · Thử lại
            </button>
          )}
          {!history.length && !historyError && <p className="mt-3 text-sm text-slate-500">Chưa có phiên đánh giá.</p>}
          {history.map((row) => (
            <button
              disabled={running || pending}
              key={row.id}
              onClick={() => {
                setCurrent(row.id);
                setError("");
              }}
              className={`focus-ring mt-2 block w-full rounded-lg border p-3 text-left text-sm disabled:opacity-50 ${current === row.id ? "border-emerald-300/40 bg-emerald-300/10" : "border-white/10"}`}
            >
              <p className="break-words font-semibold">{row.name}</p>
              <p className="mt-1 text-xs text-slate-400">
                {statuses[row.status]} · {row.progress}/{row.total}
              </p>
              <p className="mt-1 text-xs text-slate-500">{new Date(row.created_at).toLocaleString("vi-VN")}</p>
            </button>
          ))}
        </aside>
      </div>
    </section>
  );
}
