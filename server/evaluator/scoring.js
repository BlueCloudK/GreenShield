import { weights } from "./dataset.js";
export function check(t, text) {
  let pass = false;
  const s = text.trim();
  switch (t.method) {
    case "exact":
      pass = s.toLowerCase() === t.expected.toLowerCase();
      break;
    case "number":
      pass = /^-?\d+(\.\d+)?$/.test(s) && Number(s) === Number(t.expected);
      break;
    case "contains":
      pass = s.toLowerCase().includes(t.expected.toLowerCase());
      break;
    case "words":
      pass = s.length > 0 && s.split(/\s+/).length <= Number(t.expected);
      break;
    case "bullets": {
      const lines = s.split("\n").filter(Boolean);
      pass = lines.length === Number(t.expected) && lines.every((l) => /^[-*•]\s+\S/.test(l));
      break;
    }
    case "json":
      try {
        const actual = JSON.parse(s),
          expected = JSON.parse(t.expected);
        pass = Object.keys(actual).length === Object.keys(expected).length && Object.entries(expected).every(([k, v]) => actual[k] === v);
      } catch {}
      break;
    case "review":
      return { score: null, reason: "Needs semantic review or an independently configured LLM judge." };
  }
  return { score: pass ? 10 : 0, reason: pass ? "Deterministic check passed." : "Response did not satisfy the expected constraint." };
}
export function summarize(c, p, r, customWeights = weights) {
  const all = [...p, ...r],
    ok = p.filter((x) => x.status !== "ERROR");
  const assessed = p.filter((x) => x.score !== null);
  const ratio = assessed.length ? assessed.reduce((a, x) => a + (x.score ?? 0), 0) / (assessed.length * 10) : 0;
  const unique = new Set(ok.map((x) => x.response.trim())).size;
  const staticResponse = ok.length >= 4 && unique === 1;
  const confidence = ok.length < 4 ? 0 : staticResponse ? 5 : Math.round(Math.min(0.94, ratio * 0.75 + (unique / ok.length) * 0.15) * 100);
  const classification = ok.length === 0 ? "ERROR" : staticResponse ? "STATIC_API" : confidence >= 70 ? "AI_CHATBOT" : "UNKNOWN";
  const categories = {};
  for (const cat of new Set([...Object.keys(weights), ...r.map((x) => x.category)])) {
    const rows = r.filter((x) => x.category === cat && x.score !== null);
    categories[cat] = rows.length ? rows.reduce((a, x) => a + (x.score ?? 0), 0) / rows.length : null;
  }
  const scored = Object.entries(categories).filter(([k, v]) => v !== null && (customWeights[k] ?? 0) > 0),
    total = scored.reduce((a, [k]) => a + customWeights[k], 0);
  const times = all.map((x) => x.latency).sort((a, b) => a - b),
    success = all.filter((x) => x.http >= 200 && x.http < 300 && x.status !== "ERROR").length;
  return {
    id: crypto.randomUUID(),
    name: c.name,
    endpoint: c.demo ? "Built-in demo fixture" : new URL(c.url).origin + new URL(c.url).pathname,
    createdAt: new Date().toISOString(),
    demo: c.demo,
    classification: c.demo ? "DEMO" : classification,
    confidence: c.demo ? null : confidence,
    reasons: staticResponse
      ? ["The same response was returned for every successful probe."]
      : [
          "Multiple distinct prompts were tested.",
          `${assessed.filter((x) => x.score === 10).length}/${assessed.length} deterministic detection checks passed.`,
          "Behavior alone cannot establish which model or technology is used.",
        ],
    overall: total ? scored.reduce((a, [k, v]) => a + v * customWeights[k], 0) / total : null,
    categories,
    results: r,
    probes: p,
    performance: {
      requests: all.reduce((a, x) => a + x.attempts, 0),
      success,
      errors: all.length - success,
      average: times.reduce((a, b) => a + b, 0) / (times.length || 1),
      median: times.length ? (times[Math.floor((times.length - 1) / 2)] + times[Math.ceil((times.length - 1) / 2)]) / 2 : 0,
      p95: times[Math.max(0, Math.ceil(times.length * 0.95) - 1)] ?? 0,
      min: times[0] ?? 0,
      max: times.at(-1) ?? 0,
      timeoutRate: all.filter((x) => x.reason.includes("Timeout")).length / (all.length || 1),
    },
    warnings: [
      "Confidence is a heuristic behavioral score, not a calibrated probability or proof of LLM use.",
      "Overall score excludes unavailable categories; weights are renormalized. Open-ended answers require review.",
      ...(c.conversation === "none" ? ["Context test unavailable: configure messages mode."] : []),
      ...(c.demo ? ["DEMO: deterministic fixture, not a real chatbot benchmark."] : []),
    ],
  };
}
