const severityWeight = { CRITICAL: 40, HIGH: 25, MEDIUM: 12, LOW: 5, INFORMATIONAL: 1 };

export function calculateRisk(findings) {
  const score = Math.min(100, findings.reduce((total, finding) => total + (severityWeight[finding.severity] || 0), 0));
  const level = score >= 80 ? "CRITICAL" : score >= 50 ? "HIGH" : score >= 20 ? "MEDIUM" : "LOW";
  return { score, level };
}

