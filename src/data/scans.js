export const pricingPlans = [
  {
    id: 'builder_pro', name: 'Builder Pro', amount: 149000,
    targetUser: 'Developer cá nhân, sinh viên và solo founder',
    price: '149.000 ₫', priceNote: '/ tháng', applicationLimit: '1', testQuota: '300 / tháng',
    features: ['1 ứng dụng AI đang hoạt động', '300 bài kiểm thử / tháng', 'Rescan theo bài kiểm thử đã chọn', 'Lịch sử finding và bằng chứng', 'Khuyến nghị sửa và retest'],
    reportLevel: 'Báo cáo và dashboard tiêu chuẩn', manualReview: 'Không', shared: 'Không', priority: 'Tiêu chuẩn', ctaLabel: 'Đăng ký Builder Pro',
  },
  {
    id: 'team', name: 'Team', amount: 599000,
    targetUser: 'Nhóm phát triển và startup xây dựng ứng dụng AI',
    price: '599.000 ₫', priceNote: '/ tháng', applicationLimit: '5', testQuota: '1.500 / tháng',
    features: ['Tối đa 5 ứng dụng AI', '1.500 bài kiểm thử / tháng', 'Toàn bộ tính năng Builder Pro', 'Workspace và báo cáo dùng chung', 'Thành viên và phân quyền cơ bản', 'Ưu tiên các phiên đang chờ xử lý'],
    reportLevel: 'Báo cáo và dashboard dùng chung', manualReview: 'Không', shared: 'Có', priority: 'Ưu tiên', ctaLabel: 'Đăng ký Team',
  },
  {
    id: 'custom', name: 'Large / Complex Application', amount: null,
    targetUser: 'Ứng dụng lớn, AI agent phức tạp và nhu cầu đánh giá chuyên sâu',
    price: 'Liên hệ', priceNote: 'theo phạm vi và khối lượng', applicationLimit: 'Theo phạm vi', testQuota: 'Theo phạm vi',
    features: ['Khối lượng kiểm thử lớn hơn', 'Phạm vi project và thành viên tùy chỉnh', 'Assessment chuyên biệt cho Agent / RAG', 'Thỏa thuận kiểm chứng thủ công', 'Báo cáo theo nhu cầu'],
    reportLevel: 'Theo thỏa thuận', manualReview: 'Theo thỏa thuận', shared: 'Theo phạm vi', priority: 'Theo thỏa thuận', ctaLabel: 'Liên hệ tư vấn',
  },
];
