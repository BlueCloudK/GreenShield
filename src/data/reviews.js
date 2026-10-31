const STORAGE_KEY = "greenshield_product_reviews_v1";

export const initialReviews = [
  {
    id: "rev-001",
    author: "Minh Trần",
    role: "CTO @ FinBot VN",
    plan: "AI App Assessment",
    aiSystem: "Pipeline RAG",
    rating: 5,
    title: "Phát hiện lỗi rò rỉ context RAG mà bộ test nội bộ bỏ sót",
    comment:
      "Trước khi go-live trợ lý tra cứu tài liệu nội bộ, đội mình dùng GreenShield để kiểm tra. Báo cáo chỉ rõ cách prompt gián tiếp trong file PDF có thể ép bot trả về thông tin ngoài phạm vi phân quyền. Phần hướng dẫn tách biệt system instruction và kiểm thử lại (retest) cực kỳ thực tế.",
    highlight: "Bằng chứng tấn công rõ ràng, dễ tái hiện",
    verified: true,
    helpfulCount: 18,
    createdAt: "2026-10-24",
  },
  {
    id: "rev-002",
    author: "Hoàng Lê",
    role: "Lead AI Engineer @ MedCare AI",
    plan: "Red Team Sprint",
    aiSystem: "Agent AI",
    rating: 5,
    title: "Kiểm thử sâu quyền gọi tool của AI Agent trước khi mở cho khách hàng",
    comment:
      "Hệ thống của chúng tôi cho phép agent gọi API đặt lịch và tra cứu hồ sơ. GreenShield mô phỏng các kịch bản tool abuse và thiếu bước human approval rất sát thực tế. Sau khi áp dụng khuyến nghị giới hạn scope và chạy retest, điểm rủi ro giảm từ 78 xuống 18.",
    highlight: "Luồng Retest giúp xác nhận lỗi đã đóng thật sự",
    verified: true,
    helpfulCount: 14,
    createdAt: "2026-10-19",
  },
  {
    id: "rev-003",
    author: "Lan Anh Nguyễn",
    role: "Product Manager @ EduSpark",
    plan: "Product Preview",
    aiSystem: "Ứng dụng LLM",
    rating: 5,
    title: "Giao diện báo cáo gọn, đội kỹ thuật nhìn vào biết cần sửa gì ngay",
    comment:
      "Mình từng đọc nhiều báo cáo bảo mật dài hàng chục trang nhưng dev không biết bắt đầu từ đâu. Báo cáo của GreenShield tập trung đúng 4 chỉ số cốt lõi, có input/output bằng chứng cụ thể và đã che dữ liệu nhạy cảm tự động.",
    highlight: "Báo cáo trực quan, không bị ngợp thông tin",
    verified: true,
    helpfulCount: 11,
    createdAt: "2026-10-15",
  },
  {
    id: "rev-004",
    author: "Đức Phạm",
    role: "Security Architect @ CloudViet",
    plan: "Custom Program",
    aiSystem: "API AI",
    rating: 4,
    title: "Giải pháp tốt để đưa kiểm thử LLM vào quy trình release định kỳ",
    comment:
      "Endpoint Evaluator và bộ test case cho prompt injection, lộ API key hoạt động ổn định. Đội bảo mật tiết kiệm được rất nhiều thời gian viết payload thủ công. Mong phiên bản tới có thêm nhiều mẫu test chuyên biệt hơn cho tiếng Việt.",
    highlight: "Tiết kiệm 70% thời gian test thủ công",
    verified: true,
    helpfulCount: 9,
    createdAt: "2026-10-08",
  },
  {
    id: "rev-005",
    author: "Tuấn Kiệt Võ",
    role: "Founder @ LegalAssist AI",
    plan: "AI App Assessment",
    aiSystem: "Pipeline RAG",
    rating: 5,
    title: "Tăng độ tin cậy khi làm việc với khách hàng doanh nghiệp",
    comment:
      "Khách hàng B2B luôn hỏi bằng chứng kiểm thử bảo mật trước khi ký hợp đồng. Nhờ báo cáo đánh giá và lịch sử retest của GreenShield, chúng tôi chứng minh được hệ thống đã kiểm soát rủi ro prompt injection và rò rỉ dữ liệu.",
    highlight: "Hỗ trợ tốt khi chứng minh an toàn với khách B2B",
    verified: true,
    helpfulCount: 16,
    createdAt: "2026-10-02",
  },
  {
    id: "rev-006",
    author: "Thảo Vy",
    role: "Backend Developer @ RetailFlow",
    plan: "Product Preview",
    aiSystem: "Ứng dụng LLM",
    rating: 4,
    title: "Bản dùng thử dễ làm quen, demo target giúp hiểu nhanh cơ chế tấn công",
    comment:
      "Mình dùng thử gói Pilot trên demo target trước khi gắn vào chatbot chăm sóc khách hàng. Cách trình bày từ lúc phát hiện lỗi, xem payload tấn công cho đến lúc bật chế độ fixed và chạy retest rất mạch lạc.",
    highlight: "Trải nghiệm onboarding nhanh gọn",
    verified: true,
    helpfulCount: 7,
    createdAt: "2026-09-27",
  },
];

export const reviewPlans = [
  "Product Preview",
  "AI App Assessment",
  "Red Team Sprint",
  "Custom Program",
];

export const reviewAiSystems = [
  "Ứng dụng LLM",
  "Pipeline RAG",
  "Agent AI",
  "API AI",
];

export function loadReviews() {
  if (typeof window === "undefined") return initialReviews;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialReviews;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return initialReviews;
    return parsed;
  } catch {
    return initialReviews;
  }
}

export function saveReviews(reviews) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch {
    // Ignore storage quota or private mode errors
  }
}

export function getReviewStats(reviews) {
  const total = reviews.length;
  if (total === 0) {
    return {
      total: 0,
      average: "0.0",
      recommendRate: 0,
      counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  let positive = 0;

  for (const item of reviews) {
    const rating = Math.min(5, Math.max(1, Number(item.rating) || 5));
    counts[rating] = (counts[rating] || 0) + 1;
    sum += rating;
    if (rating >= 4) positive += 1;
  }

  return {
    total,
    average: (sum / total).toFixed(1),
    recommendRate: Math.round((positive / total) * 100),
    counts,
  };
}

