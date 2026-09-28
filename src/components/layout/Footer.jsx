import { GreenShieldLogo } from "../brand/GreenShieldLogo";
import { Link } from "react-router-dom";

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
            Bắt đầu bằng phiên scan dùng thử, sau đó mở rộng sang assessment theo phạm vi, retest và báo cáo cho đội kỹ thuật hoặc quản lý.
          </p>
          <div className="mt-3 flex gap-4 text-sm"><Link className="text-emerald-200 hover:underline" to="/contact">Liên hệ</Link><Link className="text-emerald-200 hover:underline" to="/privacy">Quyền riêng tư</Link></div>
        </div>
      </div>
    </footer>
  );
}
