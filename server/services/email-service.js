import nodemailer from "nodemailer";

const SENDER_NAME = "GreenShield";
const SENDER_EMAIL = process.env.SMTP_USER || "";

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Gửi mã OTP xác nhận email đăng ký tài khoản.
 * @param {string} toEmail - Email người nhận
 * @param {string} otp - Mã 6 chữ số
 * @param {string} name - Tên người dùng
 */
export async function sendVerificationOtp(toEmail, otp, name) {
  const transporter = createTransporter();

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Xác nhận email – GreenShield</title>
  <style>
    body { margin: 0; padding: 0; background: #0b1120; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 520px; margin: 40px auto; background: #111827; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }
    .header { background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0f766e 100%); padding: 36px 40px; text-align: center; }
    .logo { font-size: 22px; font-weight: 900; color: #6ee7b7; letter-spacing: -0.5px; margin-bottom: 4px; }
    .header-sub { font-size: 13px; color: #a7f3d0; opacity: 0.8; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 16px; color: #e2e8f0; margin-bottom: 16px; }
    .desc { font-size: 14px; color: #94a3b8; line-height: 1.7; margin-bottom: 28px; }
    .otp-box { background: #0d2137; border: 2px solid #34d399; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 28px; }
    .otp-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #6ee7b7; font-weight: 700; margin-bottom: 12px; }
    .otp-code { font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #ecfdf5; font-family: 'Courier New', monospace; }
    .expire-note { font-size: 13px; color: #64748b; text-align: center; margin-bottom: 24px; }
    .expire-note strong { color: #f59e0b; }
    .warning { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 12px; padding: 14px 16px; font-size: 13px; color: #fca5a5; line-height: 1.6; }
    .footer { border-top: 1px solid rgba(255,255,255,0.06); padding: 20px 40px; text-align: center; font-size: 12px; color: #475569; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">🛡️ GreenShield</div>
      <div class="header-sub">AI Security Testing Platform</div>
    </div>
    <div class="body">
      <p class="greeting">Xin chào <strong style="color:#6ee7b7">${escapeHtml(name)}</strong>,</p>
      <p class="desc">
        Cảm ơn bạn đã đăng ký tài khoản <strong style="color:#e2e8f0">GreenShield</strong>.
        Vui lòng nhập mã xác nhận dưới đây để hoàn tất quá trình đăng ký:
      </p>
      <div class="otp-box">
        <div class="otp-label">Mã xác nhận</div>
        <div class="otp-code">${otp}</div>
      </div>
      <p class="expire-note">Mã có hiệu lực trong <strong>10 phút</strong>. Không chia sẻ mã này với ai.</p>
      <div class="warning">
        ⚠️ Nếu bạn không thực hiện đăng ký này, hãy bỏ qua email. Tài khoản sẽ <strong>không</strong> được tạo nếu không nhập mã xác nhận.
      </div>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} GreenShield · Tự động gửi, vui lòng không trả lời email này.
    </div>
  </div>
</body>
</html>
`;

  await transporter.sendMail({
    from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
    to: toEmail,
    subject: `${otp} là mã xác nhận GreenShield của bạn`,
    html,
    text: `Mã xác nhận GreenShield: ${otp}\n\nMã có hiệu lực trong 10 phút.\nNếu bạn không đăng ký tài khoản, hãy bỏ qua email này.`,
  });
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
