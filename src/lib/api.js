export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(body?.message || "Không thể xử lý yêu cầu.", response.status, body?.error);
  }
  return body;
}

export function post(path, data) {
  return api(path, { method: "POST", body: JSON.stringify(data ?? {}) });
}

export function patch(path, data) {
  return api(path, { method: "PATCH", body: JSON.stringify(data ?? {}) });
}

