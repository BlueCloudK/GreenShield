import dns from "node:dns/promises";
import net from "node:net";
import { decryptSecret } from "./secret-provider.js";
import { json } from "../db/index.js";

function isPrivateAddress(address) {
  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:");
  }
  const [a, b] = address.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

async function assertSafeExternalUrl(value) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Target chỉ hỗ trợ HTTP hoặc HTTPS.");
  const addresses = await dns.lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Target trỏ tới mạng nội bộ hoặc địa chỉ không được phép.");
  }
  return url;
}

function getPathValue(value, path) {
  return String(path || "").split(".").filter(Boolean).reduce((current, key) => current?.[key], value);
}

export async function sendTargetRequest(target, prompt, context) {
  const url = target.type === "DEMO"
    ? new URL(`/api/demo-target/${target.id}/chat`, context.origin).toString()
    : (await assertSafeExternalUrl(target.base_url)).toString();
  const headers = { "content-type": "application/json", ...json(target.headers_json, {}) };
  if (target.type === "DEMO") {
    headers["x-greenshield-internal"] = process.env.INTERNAL_DEMO_TOKEN || "greenshield-local-demo";
  }
  const credential = decryptSecret(target.credential_ciphertext);
  if (credential) headers.authorization = `Bearer ${credential}`;
  const template = json(target.request_template_json, {});
  const payload = { ...template, [target.prompt_field || "prompt"]: prompt };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(target.timeout_ms || 8000, 15000));
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      method: target.method || "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
      redirect: "error",
    });
    const raw = (await response.text()).slice(0, 100_000);
    let body;
    try { body = JSON.parse(raw); } catch { body = { message: raw }; }
    const text = String(getPathValue(body, target.response_field || "message") ?? raw);
    return { ok: response.ok, status: response.status, latencyMs: Date.now() - startedAt, body, text, raw };
  } finally {
    clearTimeout(timeout);
  }
}
