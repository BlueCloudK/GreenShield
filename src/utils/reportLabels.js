const riskLevelLabels = {
  Low: "Thấp",
  Medium: "Trung bình",
  High: "Cao",
  Critical: "Nghiêm trọng",
};

const severityLabels = {
  Critical: "Nghiêm trọng",
  High: "Cao",
  Warning: "Cảnh báo",
  Medium: "Trung bình",
  Low: "Thấp",
  Passed: "Đạt",
};

const moduleStatusLabels = {
  Passed: "Đạt",
  Warning: "Cần chú ý",
  Failed: "Có lỗi",
  "Not tested": "Chưa kiểm thử",
};

const scanStatusLabels = {
  Completed: "Hoàn tất",
  Running: "Đang chạy",
  "Retest Pending": "Chờ retest",
  Failed: "Có lỗi",
};

const retestStatusLabels = {
  Passed: "Đã đạt",
  Pending: "Chờ retest",
  Ready: "Sẵn sàng retest",
  "Not retested": "Chưa retest",
  "Pending fix": "Chờ sửa",
  Resolved: "Đã xử lý",
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
  All: "Tất cả",
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
  Demo: "Dùng thử",
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
