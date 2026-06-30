const maskPatterns = [
  {
    pattern: /\bsk-[A-Za-z0-9_-]{8,}\b/g,
    mask: (value) => `${value.slice(0, 3)}****${value.slice(-4)}`,
  },
  {
    pattern: /\b(?:api[_-]?key|token|secret|password)\s*[:=]\s*["']?([A-Za-z0-9._~+/=-]{8,})["']?/gi,
    mask: (value) => value.replace(/([:=]\s*["']?)([A-Za-z0-9._~+/=-]{2})[A-Za-z0-9._~+/=-]*([A-Za-z0-9._~+/=-]{4})/i, "$1$2****$3"),
  },
  {
    pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}\b/gi,
    mask: (value) => value.replace(/Bearer\s+([A-Za-z0-9._~+/=-]{2})[A-Za-z0-9._~+/=-]*([A-Za-z0-9._~+/=-]{4})/i, "Bearer $1****$2"),
  },
  {
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    mask: (value) => {
      const [name, domain] = value.split("@");
      return `${name.slice(0, 2)}****@${domain}`;
    },
  },
];

export function maskSensitiveText(text = "") {
  return maskPatterns.reduce(
    (masked, { pattern, mask }) => masked.replace(pattern, (value) => mask(value)),
    String(text),
  );
}
