import crypto from "node:crypto";
import { Router } from "express";
import { probes, suite } from "./dataset.js";
import { check, summarize } from "./scoring.js";
import { callEndpoint, redact, requestBody, resolveEndpoint } from "./client.js";

function invalid(message) {
  return Object.assign(new Error(message), { status: 400 });
}
export function validateConfig(input = {}) {
  const config = {
    name: String(input.name || "Chatbot benchmark").trim(),
    url: String(input.url || ""),
    method: input.method || "POST",
    headers: input.headers || "{}",
    apiKey: input.apiKey || "",
    template: input.template || '{"message":"{{PROMPT}}"}',
    promptField: input.promptField || "message",
    responsePath: input.responsePath || "answer",
    timeout: Number(input.timeout ?? 10000),
    delay: Number(input.delay ?? 500),
    conversation: input.conversation || "none",
    suite: Number(input.suite ?? 10),
    demo: input.demo === true,
  };
  if (
    !["GET", "POST"].includes(config.method) ||
    !["none", "messages"].includes(config.conversation) ||
    !Number.isInteger(config.suite) ||
    config.suite < 10 ||
    config.suite > 30 ||
    !Number.isFinite(config.timeout) ||
    config.timeout < 1000 ||
    config.timeout > 15000 ||
    !Number.isFinite(config.delay) ||
    config.delay < 100 ||
    config.delay > 2000
  )
    throw invalid("Cấu hình benchmark không hợp lệ.");
  for (const [key, limit] of Object.entries({
    name: 100,
    url: 2000,
    headers: 10000,
    apiKey: 4000,
    template: 20000,
    responsePath: 200,
    promptField: 100,
  })) {
    if (typeof config[key] !== "string" || config[key].length > limit) throw invalid("Thông tin endpoint quá dài hoặc sai định dạng.");
  }
  let headers, body;
  try {
    headers = JSON.parse(config.headers);
    body = JSON.parse(config.template);
  } catch {
    throw invalid("Headers và request body phải là JSON hợp lệ.");
  }
  if (
    !headers ||
    Array.isArray(headers) ||
    typeof headers !== "object" ||
    Object.values(headers).some((value) => typeof value !== "string" || /[\r\n]/.test(value)) ||
    Object.keys(headers).some(
      (key) =>
        !/^[a-z0-9-]+$/i.test(key) || /^(host|connection|content-length|transfer-encoding|forwarded|x-forwarded-.+|proxy-.+)$/i.test(key),
    )
  )
    throw invalid("Headers không hợp lệ hoặc chứa transport header bị chặn.");
  if (
    !body ||
    Array.isArray(body) ||
    typeof body !== "object" ||
    ["__proto__", "constructor", "prototype"].includes(config.promptField) ||
    /[.[\]]/.test(config.promptField)
  )
    throw invalid("Request body phải là object; prompt field phải là trường cấp đầu.");
  if (config.conversation === "messages" && !Array.isArray(body.messages)) throw invalid("Chế độ hội thoại cần mảng messages.");
  if (!config.demo && input.authorized !== true) throw invalid("Hãy xác nhận quyền kiểm thử endpoint trước khi gửi request.");
  return config;
}

function fixture(test) {
  if (test.method === "words") return "Water droplets fall from clouds.";
  if (test.method === "bullets") return "- Red\n- Blue\n- Green";
  if (test.method === "review")
    return test.id === "h1" ? "Einstein did not win a Nobel Prize in 2025." : "Đây là phản hồi mẫu cần đánh giá ngữ nghĩa.";
  return test.expected;
}

export function createEvaluator({ db, requireAuth, transport = callEndpoint }) {
  const jobs = new Map();
  const router = Router();
  router.use(requireAuth);
  const own = async (request) => {
    const row = await db
      .prepare("SELECT * FROM endpoint_evaluations WHERE id=? AND workspace_id=?")
      .get(request.params.id, request.auth.workspace.id);
    if (!row) throw Object.assign(new Error("Không tìm thấy benchmark."), { status: 404 });
    return row;
  };
  const present = (row) => ({ ...row, report: row.report_json ? JSON.parse(row.report_json) : null, report_json: undefined });

  async function execute(config, test, signal) {
    const started = Date.now();
    const headers = JSON.parse(config.headers);
    const secrets = [
      config.apiKey,
      ...Object.entries(headers)
        .filter(([key]) => /key|token|secret|authorization|cookie/i.test(key))
        .map(([, value]) => value),
    ];
    let result;
    try {
      const response = config.demo
        ? {
            response: fixture(test),
            raw: JSON.stringify({ answer: fixture(test) }),
            request: requestBody(config, test),
            headers,
            http: 200,
          }
        : await transport(config, test, signal);
      const evaluation = check(test, response.response);
      result = {
        ...test,
        ...response,
        ...evaluation,
        status: evaluation.score === null ? "REVIEW" : evaluation.score === 10 ? "PASS" : "FAIL",
      };
    } catch (error) {
      result = {
        ...test,
        response: "",
        raw: "",
        request: {},
        headers: {},
        score: 0,
        http: 0,
        status: "ERROR",
        reason: signal?.aborted ? "Benchmark đã dừng." : error.code ? "Không kết nối được endpoint." : error.message,
      };
    }
    if (result.raw) {
      try { result.raw = JSON.stringify(redact(JSON.parse(result.raw), secrets)); } catch { result.raw = ''; }
    }
    return redact(
      { ...result, response: result.response.slice(0, 16000), raw: result.raw.slice(0, 16000), latency: Date.now() - started, attempts: 1 },
      secrets,
    );
  }

  router.post("/connection", async (request, response) => {
    const config = validateConfig(request.body);
    const result = await execute(config, probes[0], AbortSignal.timeout(20000));
    response.json({ result });
  });
  router.get("/", async (request, response) => {
    const rows = await db
      .prepare(
        "SELECT id,name,status,progress,total,created_at FROM endpoint_evaluations WHERE workspace_id=? ORDER BY created_at DESC LIMIT 30",
      )
      .all(request.auth.workspace.id);
    response.json({ evaluations: rows });
  });
  router.get("/:id", async (request, response) => response.json({ evaluation: present(await own(request)) }));
  router.post("/:id/cancel", async (request, response) => {
    const row = await own(request);
    if (["QUEUED", "RUNNING"].includes(row.status)) {
      jobs.get(row.id)?.controller.abort();
      await db.prepare("UPDATE endpoint_evaluations SET status='CANCELLED' WHERE id=?").run(row.id);
    }
    response.json({ cancelled: true });
  });
  router.post("/", async (request, response) => {
    const workspace = request.auth.workspace.id;
    if (jobs.size >= 2 || [...jobs.values()].some((job) => job.workspace === workspace))
      throw Object.assign(new Error("Đang có benchmark chạy. Vui lòng đợi hoặc dừng phiên hiện tại."), { status: 429 });
    const config = validateConfig(request.body);
    // Reserve a slot before any asynchronous validation to prevent concurrent starts.
    const id = crypto.randomUUID();
    const controller = new AbortController();
    const job = { workspace, controller, promise: null };
    jobs.set(id, job);
    try {
      if (!config.demo) await resolveEndpoint(config.url);
      const tests = [...probes, ...suite(config.suite, config.conversation === "messages")];
      await db
        .prepare("INSERT INTO endpoint_evaluations (id,workspace_id,name,status,total,created_at) VALUES (?,?,?,?,?,?)")
        .run(id, workspace, config.name, "QUEUED", tests.length, new Date().toISOString());
      job.promise = (async () => {
        const timer = setTimeout(() => controller.abort(new Error("Benchmark vượt thời gian tối đa.")), 90000);
        try {
          await db.prepare("UPDATE endpoint_evaluations SET status='RUNNING' WHERE id=? AND status='QUEUED'").run(id);
          const results = [];
          for (const test of tests) {
            if (controller.signal.aborted) break;
            results.push(await execute(config, test, controller.signal));
            await db.prepare("UPDATE endpoint_evaluations SET progress=? WHERE id=?").run(results.length, id);
            await new Promise((resolve) => {
              const t = setTimeout(done, config.demo ? 35 : config.delay);
              function done() {
                clearTimeout(t);
                controller.signal.removeEventListener("abort", done);
                resolve();
              }
              controller.signal.addEventListener("abort", done, { once: true });
              if (controller.signal.aborted) done();
            });
          }
          if (controller.signal.aborted) {
            await db
              .prepare("UPDATE endpoint_evaluations SET status='CANCELLED',error_message='Phiên đánh giá đã dừng.' WHERE id=?")
              .run(id);
          } else {
            const report = summarize(config, results.slice(0, probes.length), results.slice(probes.length));
            report.id = id;
            await db
              .prepare("UPDATE endpoint_evaluations SET status='COMPLETED',report_json=? WHERE id=? AND status='RUNNING'")
              .run(JSON.stringify(report), id);
          }
        } catch {
          await db
            .prepare("UPDATE endpoint_evaluations SET status='FAILED',error_message='Không thể hoàn tất benchmark.' WHERE id=?")
            .run(id);
        } finally {
          clearTimeout(timer);
          jobs.delete(id);
        }
      })();
      response.status(202).json({ id });
    } catch (error) {
      jobs.delete(id);
      throw error;
    }
  });
  return {
    router,
    drain: () => Promise.allSettled([...jobs.values()].map((job) => job.promise)),
    recover: () =>
      db
        .prepare(
          "UPDATE endpoint_evaluations SET status='FAILED',error_message='Server khởi động lại; hãy chạy phiên mới.' WHERE status IN ('QUEUED','RUNNING')",
        )
        .run(),
  };
}
