const riskLevelLabels = {
  Low: "Low",
  Medium: "Medium",
  High: "High",
  Critical: "Critical",
};

const severityLabels = {
  Critical: "Critical",
  High: "High",
  Warning: "Warning",
  Medium: "Medium",
  Low: "Low",
  Passed: "Passed",
};

const moduleStatusLabels = {
  Passed: "Passed",
  Warning: "Warning",
  Failed: "Failed",
  "Not tested": "Not tested",
};

const scanStatusLabels = {
  Completed: "Completed",
  Running: "Running",
  "Retest Pending": "Retest pending",
  Failed: "Failed",
};

const retestStatusLabels = {
  Passed: "Passed",
  Pending: "Pending",
  Ready: "Ready",
  "Not retested": "Not retested",
  "Pending fix": "Pending fix",
  Resolved: "Resolved",
};

const moduleLabels = {
  "Prompt Injection": "Prompt Injection",
  "RAG Data Leakage": "RAG Data Leakage",
  "Unsafe Tool Calls": "Unsafe Tool Calls",
  "API / Key Exposure": "API / Key Exposure",
  "Agent Permission Risk": "Agent Permission Risk",
  "Logging / Sensitive Data Exposure": "Sensitive Log Exposure",
};

const categoryLabels = {
  "Prompt Injection": "Prompt Injection",
  "RAG Leakage": "RAG Leakage",
  "Unsafe Tool Calls": "Unsafe Tool Calls",
  "API / Key Exposure": "API / Key Exposure",
};

const appTypeLabels = {
  "RAG System": "RAG System",
  "AI Agent": "Agent AI",
  "AI agent": "Agent AI",
  "AI API": "API AI",
  Chatbot: "Chatbot",
};

const environmentLabels = {
  Staging: "Staging",
  Demo: "Demo",
  Production: "Production",
};

function labelFrom(map, value) {
  return map[value] || value;
}

export function getRiskLevelLabel(level) {
  return labelFrom(riskLevelLabels, level);
}

export function getSeverityLabel(severity) {
  return labelFrom(severityLabels, severity);
}

export function getModuleStatusLabel(status) {
  return labelFrom(moduleStatusLabels, status);
}

export function getScanStatusLabel(status) {
  return labelFrom(scanStatusLabels, status);
}

export function getRetestStatusLabel(status) {
  return labelFrom(retestStatusLabels, status);
}

export function getModuleLabel(module) {
  return labelFrom(moduleLabels, module);
}

export function getCategoryLabel(category) {
  return labelFrom(categoryLabels, category);
}

export function getAppTypeLabel(appType) {
  return labelFrom(appTypeLabels, appType);
}

export function getEnvironmentLabel(environment) {
  return labelFrom(environmentLabels, environment);
}
