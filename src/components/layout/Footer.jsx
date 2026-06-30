import { GreenShieldLogo } from "../brand/GreenShieldLogo";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/90">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
        <div>
          <GreenShieldLogo showWordmark />
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">
            Quy trình kiểm thử bảo mật AI cho chatbot, hệ thống RAG, AI agent và API tích hợp AI.
          </p>
        </div>
        <div>
          <h3 className="font-bold text-white">Sản phẩm</h3>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            AI security scan
            <br />
            Báo cáo rủi ro
            <br />
            Retest sau khi sửa
          </p>
        </div>
        <div>
          <h3 className="font-bold text-white">Triển khai</h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Dùng bản demo để đánh giá quy trình. Khi nối backend, GreenShield có thể lưu lịch sử scan, phân quyền team và xuất báo cáo cho khách hàng.
          </p>
        </div>
      </div>
    </footer>
  );
}
