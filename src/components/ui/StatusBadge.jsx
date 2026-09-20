const styles = {
  COMPLETED: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  FIXED: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  SUCCESS: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  PASSED: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  RUNNING: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
  RETESTING: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
  QUEUED: "border-slate-300/20 bg-slate-300/10 text-slate-200",
  NOT_TESTED: "border-slate-300/20 bg-slate-300/10 text-slate-300",
  OPEN: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  FAILED: "border-rose-300/25 bg-rose-300/10 text-rose-100",
  STILL_VULNERABLE: "border-rose-300/25 bg-rose-300/10 text-rose-100",
  CRITICAL: "border-rose-300/30 bg-rose-300/12 text-rose-100",
  HIGH: "border-orange-300/25 bg-orange-300/10 text-orange-100",
  MEDIUM: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  LOW: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  ERROR: "border-rose-300/25 bg-rose-300/10 text-rose-100",
  CANCELLED: "border-slate-300/20 bg-slate-300/10 text-slate-300",
};

const labels = {
  COMPLETED: "Hoàn tất", FIXED: "Đã khắc phục", SUCCESS: "Đã kết nối", PASSED: "Đạt",
  RUNNING: "Đang chạy", RETESTING: "Đang retest", QUEUED: "Đang chờ", NOT_TESTED: "Chưa kiểm tra",
  OPEN: "Đang mở", FAILED: "Có lỗi", STILL_VULNERABLE: "Vẫn còn lỗi", CRITICAL: "Nghiêm trọng",
  HIGH: "Cao", MEDIUM: "Trung bình", LOW: "Thấp", ERROR: "Lỗi", CANCELLED: "Đã hủy",
};

export function StatusBadge({ value }) {
  return <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-bold ${styles[value] || styles.QUEUED}`}>{labels[value] || value}</span>;
}
