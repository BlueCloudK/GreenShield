import dns from "node:dns/promises";
import net from "node:net";
import https from "node:https";

export function isPublicAddress(address) {
  if (net.isIPv6(address)) return /^[23][0-9a-f]{3}:/i.test(address) && !/^2001:(db8|0|2|10|20):/i.test(address);
  if (!net.isIPv4(address)) return false;
  const [a, b] = address.split(".").map(Number);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && [0, 2, 168].includes(b)) ||
    (a === 198 && [18, 19, 51].includes(b)) ||
    (a === 203 && b === 0)
  );
}

export async function resolveEndpoint(value, lookup = dns.lookup) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443") ||
    net.isIP(url.hostname.replace(/^\[|\]$/g, "")) ||
    !url.hostname.includes(".") ||
    /(^|\.)(localhost|local|internal|invalid|test|onion)$/i.test(url.hostname) ||
    /metadata/i.test(url.hostname)
  ) {
    throw new Error("Endpoint phải là hostname HTTPS công khai, không chứa thông tin đăng nhập.");
  }
  if ([...url.searchParams.keys()].some((key) => /key|token|secret|password/i.test(key))) {
    throw new Error("Không đặt secret trong URL; dùng API key hoặc headers.");
  }
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((item) => !isPublicAddress(item.address)))
    throw new Error("Endpoint trỏ tới mạng không được phép.");
  return { url, address: addresses.find((item) => item.family === 4) || addresses[0] };
}

export function pathValue(data, path) {
  return String(path)
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean)
    .reduce(
      (value, key) =>
        !["__proto__", "prototype", "constructor"].includes(key) && value && typeof value === "object" ? value[key] : undefined,
      data,
    );
}

export function requestBody(config, test) {
  const replace = (value) =>
    typeof value === "string"
      ? value.replaceAll("{{PROMPT}}", test.prompt)
      : Array.isArray(value)
        ? value.map(replace)
        : value && typeof value === "object"
          ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replace(item)]))
          : value;
  const body = replace(JSON.parse(config.template));
  if (!config.template.includes("{{PROMPT}}")) body[config.promptField] = test.prompt;
  if (test.history) {
    if (!Array.isArray(body.messages)) throw new Error("Chế độ hội thoại cần mảng messages trong request body.");
    body.messages = [...test.history, { role: "user", content: test.prompt }];
  }
  return body;
}

export function redact(value, secrets = []) {
  if (typeof value === "string") {
    for (const secret of secrets.filter(Boolean)) value = value.replaceAll(secret, "[REDACTED]");
    return value
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[EMAIL]")
      .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
      .replace(/\bsk-[A-Za-z0-9_-]{8,}/g, "[API_KEY]");
  }
  if (Array.isArray(value)) return value.map((item) => redact(item, secrets));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        /authorization|password|api.?key|cookie|token|secret/i.test(key) ? "[REDACTED]" : redact(item, secrets),
      ]),
    );
  return value;
}

export async function callEndpoint(config, test, signal) {
  const { url, address } = await resolveEndpoint(config.url);
  const headers = { "content-type": "application/json", ...JSON.parse(config.headers) };
  if (config.apiKey) headers.authorization = `Bearer ${config.apiKey}`;
  const body = requestBody(config, test);
  if (config.method === "GET")
    for (const [key, value] of Object.entries(body)) url.searchParams.set(key, typeof value === "string" ? value : JSON.stringify(value));
  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: config.method,
        headers,
        signal,
        // Pin the validated address while retaining the original TLS hostname/SNI.
        lookup: (_hostname, options, callback) => callback(null, options?.all ? [address] : address.address, address.family),
      },
      (response) => {
        const chunks = [];
        let size = 0;
        response.on("data", (chunk) => {
          size += chunk.length;
          if (size > 262144) request.destroy(new Error("Response vượt giới hạn 256 KB."));
          else chunks.push(chunk);
        });
        response.on("error", reject);
        response.on("end", () => {
          if (response.statusCode >= 300 && response.statusCode < 400) return reject(new Error("Redirect của endpoint bị chặn."));
          const raw = Buffer.concat(chunks).toString("utf8");
          if (response.statusCode < 200 || response.statusCode >= 300)
            return reject(new Error(`Endpoint trả HTTP ${response.statusCode}.`));
          try {
            const data = JSON.parse(raw);
            const text = pathValue(data, config.responsePath);
            if (typeof text !== "string") throw new Error("Response path không trỏ tới chuỗi văn bản.");
            resolve({ response: text, raw, request: body, headers, http: response.statusCode });
          } catch (error) {
            reject(error instanceof SyntaxError ? new Error("Response không phải JSON; tắt streaming trên endpoint.") : error);
          }
        });
      },
    );
    const timer = setTimeout(() => request.destroy(new Error("Timeout: endpoint không phản hồi kịp.")), config.timeout);
    request.on("close", () => clearTimeout(timer));
    request.on("error", reject);
    if (config.method === "POST") request.write(JSON.stringify(body));
    request.end();
  });
}
