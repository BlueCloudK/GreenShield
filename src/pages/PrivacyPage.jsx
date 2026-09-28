export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="section-kicker">GreenShield</p>
      <h1 className="mt-2 text-3xl font-black text-white">Quyền riêng tư</h1>
      <p className="mt-3 text-sm text-slate-400">Thông tin về dữ liệu khi bạn dùng phiên bản GreenShield hiện tại.</p>
      <div className="mt-8 space-y-7 text-sm leading-7 text-slate-300">
        <section><h2 className="font-bold text-white">Dữ liệu được lưu</h2><p>Hệ thống lưu thông tin tài khoản, project, cấu hình target, lịch sử scan, bằng chứng, report và retest để cung cấp dịch vụ. Form liên hệ lưu họ tên, email, chủ đề, nội dung và thời điểm gửi. Không nhập dữ liệu khách hàng thật hoặc secret production vào demo target.</p></section>
        <section><h2 className="font-bold text-white">Thông tin nhạy cảm</h2><p>Mật khẩu được lưu dưới dạng hash. Credential của target được mã hóa khi lưu; bằng chứng trong report được che các mẫu secret đã nhận diện. Việc che tự động không đảm bảo phát hiện mọi dữ liệu nhạy cảm, vì vậy hãy dùng endpoint staging và dữ liệu thử nghiệm.</p></section>
        <section><h2 className="font-bold text-white">Phiên đăng nhập và quyền truy cập</h2><p>Cookie phiên đăng nhập dùng để duy trì truy cập tài khoản. Project và scan được giới hạn theo workspace. Không chia sẻ tài khoản hoặc cấu hình target cho người không được phép.</p></section>
        <section><h2 className="font-bold text-white">Liên hệ về dữ liệu</h2><p>Để hỏi về dữ liệu đã gửi hoặc yêu cầu xóa, hãy dùng <a className="font-bold text-emerald-200 underline" href="/contact">trang liên hệ</a> và nêu email tài khoản hoặc email đã gửi yêu cầu. Đừng gửi mật khẩu hay token qua form.</p></section>
      </div>
    </section>
  );
}
