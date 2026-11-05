// Proposed subscription packages; checkout and limits are not yet enabled.
export const pricingPlans = [
  { id: "builder", name: "Builder", targetUser: "Developer cá nhân và dự án AI nhỏ", price: "300.000 ₫", priceNote: "/ tháng", applications: "1 ứng dụng", tests: "300 bài kiểm thử / tháng", members: "1 thành viên", features: ["Kiểm thử endpoint AI", "Báo cáo kèm bằng chứng", "Gợi ý khắc phục và retest"] },
  { id: "team", name: "Team", targetUser: "Startup và nhóm phát triển sản phẩm AI", price: "600.000 ₫", priceNote: "/ tháng", applications: "5 ứng dụng", tests: "1.500 bài kiểm thử / tháng", members: "5 thành viên", features: ["Tất cả quyền lợi Builder", "Workspace và báo cáo chung", "Lịch sử phát hiện và retest"] },
  { id: "scale", name: "Scale", targetUser: "Nhóm có nhiều ứng dụng cần kiểm thử", price: "900.000 ₫", priceNote: "/ tháng", applications: "10 ứng dụng", tests: "3.000 bài kiểm thử / tháng", members: "10 thành viên", features: ["Tất cả quyền lợi Team", "Hạn mức kiểm thử cao hơn", "Quản lý nhiều ứng dụng"] },
  { id: "enterprise", name: "Enterprise", targetUser: "Doanh nghiệp cần phạm vi và hợp đồng riêng", price: "Liên hệ", priceNote: "theo thỏa thuận", applications: "Theo thỏa thuận", tests: "Theo thỏa thuận", members: "Theo thỏa thuận", features: ["Phạm vi kiểm thử theo nhu cầu", "Trao đổi đánh giá chuyên sâu", "Tư vấn và hợp đồng riêng"] },
];
