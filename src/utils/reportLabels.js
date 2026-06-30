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
  Warning: "Cảnh báo",
  Failed: "Có lỗi",
  "Not tested": "Chưa kiểm thử",
};

const scanStatusLabels = {
  Completed: "Hoàn tất",
  Running: "Đang chạy",
  "Retest Pending": "Chờ kiểm thử lại",
  Failed: "Lỗi",
};

const retestStatusLabels = {
  Passed: "Đã đạt",
  Pending: "Chờ kiểm thử lại",
  Ready: "Sẵn sàng",
  "Not retested": "Chưa kiểm thử lại",
  "Pending fix": "Chờ sửa",
  Resolved: "Đã xử lý",
};

const moduleLabels = {
  "Prompt Injection": "Tiêm lệnh prompt",
  "RAG Data Leakage": "Rò rỉ dữ liệu RAG",
  "Unsafe Tool Calls": "Gọi tool rủi ro",
  "API / Key Exposure": "Lộ API / key",
  "Agent Permission Risk": "Quyền agent quá rộng",
  "Logging / Sensitive Data Exposure": "Log lộ dữ liệu nhạy cảm",
};

const categoryLabels = {
  "Prompt Injection": "Tiêm lệnh prompt",
  "RAG Leakage": "Rò rỉ RAG",
  "Unsafe Tool Calls": "Gọi tool rủi ro",
  "API / Key Exposure": "Lộ API / key",
};

const appTypeLabels = {
  "RAG System": "Hệ thống RAG",
  "AI Agent": "Agent AI",
  "AI agent": "Agent AI",
  "AI API": "API AI",
  Chatbot: "Chatbot",
};

const environmentLabels = {
  Staging: "Kiểm thử",
  Demo: "Demo",
  Production: "Vận hành thật",
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
