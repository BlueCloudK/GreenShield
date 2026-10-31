import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Workflow,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { GreenShieldLogo } from "../components/brand/GreenShieldLogo";
import { Button } from "../components/ui/Button";
import { FormField, inputClasses } from "../components/ui/FormField";
import { useAuth } from "../context/AuthContext";

const initialRegisterForm = {
  name: "",
  email: "",
  company: "",
  password: "",
};

const initialLoginForm = {
  email: "",
  password: "",
};

const securityHighlights = [
  {
    icon: ShieldCheck,
    title: "Kiểm thử chuyên sâu cho LLM, RAG & AI Agent",
    body: "Tự động phát hiện Prompt Injection, rò rỉ tài liệu truy xuất (RAG Leakage), lạm dụng quyền gọi Tool và lộ khóa API.",
  },
  {
    icon: Sparkles,
    title: "Báo cáo có bằng chứng & che dữ liệu nhạy cảm",
    body: "Mỗi phát hiện đi kèm input/output thực tế, mức độ nghiêm trọng, hướng dẫn khắc phục cho kỹ sư và tự động mask secret.",
  },
  {
    icon: Workflow,
    title: "Quy trình Fix & Retest khép kín theo Workspace",
    body: "Chạy kiểm thử lại ngay sau khi vá lỗi để đối chiếu điểm rủi ro trước và sau khi khắc phục.",
  },
];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function getPasswordStrength(password) {
  if (!password) return { level: 0, label: "Chưa nhập", color: "bg-white/10" };
  if (password.length < 8) return { level: 1, label: "Quá ngắn (< 8 ký tự)", color: "bg-rose-400" };
  let score = 2;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
  if (score === 2) return { level: 2, label: "Đạt yêu cầu", color: "bg-amber-300" };
  if (score === 3) return { level: 3, label: "Mạnh", color: "bg-emerald-300" };
  return { level: 4, label: "Rất mạnh", color: "bg-emerald-400" };
}

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, login, sendOtp, verifyOtp } = useAuth();

  const queryMode = new URLSearchParams(location.search).get("mode");
  const initialMode =
    queryMode === "register"
      ? "register"
      : queryMode === "login" || location.state?.authMode === "login"
      ? "login"
      : "login";

  // mode: "login" | "register" | "otp"
  const [mode, setMode] = useState(initialMode);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [otpForm, setOtpForm] = useState({ email: "", otp: "" });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [registerTouched, setRegisterTouched] = useState({});
  const [loginTouched, setLoginTouched] = useState({});

  const redirectTo = location.state?.from?.pathname || "/app";

  useEffect(() => {
    if (isAuthenticated && !location.state?.skipAuthRedirect) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, location.state?.skipAuthRedirect, navigate, redirectTo]);

  useEffect(() => {
    const modeParam = new URLSearchParams(location.search).get("mode");
    if (modeParam === "login" || location.state?.authMode === "login") {
      setMode("login");
    } else if (modeParam === "register") {
      setMode("register");
    }
  }, [location.search, location.state?.authMode]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const registerErrors = useMemo(() => {
    const errors = {};
    if (!registerForm.name.trim()) errors.name = "Vui lòng nhập họ và tên.";
    if (!isValidEmail(registerForm.email)) errors.email = "Vui lòng nhập địa chỉ email hợp lệ.";
    if (registerForm.password.length < 8) errors.password = "Mật khẩu cần tối thiểu 8 ký tự.";
    return errors;
  }, [registerForm]);

  const loginErrors = useMemo(() => {
    const errors = {};
    if (!isValidEmail(loginForm.email)) errors.email = "Vui lòng nhập email tài khoản.";
    if (!loginForm.password) errors.password = "Vui lòng nhập mật khẩu.";
    return errors;
  }, [loginForm]);

  const passwordStrength = useMemo(
    () => getPasswordStrength(registerForm.password),
    [registerForm.password]
  );

  function updateRegister(field, value) {
    setRegisterForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  }

  function updateLogin(field, value) {
    setLoginForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setSuccess("");
  }

  function touchRegister(field) {
    setRegisterTouched((current) => ({ ...current, [field]: true }));
  }

  function touchLogin(field) {
    setLoginTouched((current) => ({ ...current, [field]: true }));
  }

  async function handleRegister(event) {
    event.preventDefault();
    setError("");

    if (Object.keys(registerErrors).length) {
      setRegisterTouched({ name: true, email: true, password: true });
      setError("Vui lòng kiểm tra lại thông tin đăng ký.");
      return;
    }

    setSubmitting(true);
    const result = await sendOtp(registerForm);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setOtpForm({ email: result.email, otp: "" });
    setResendCooldown(60);
    setMode("otp");
    setSuccess(`Mã xác thực 6 chữ số đã được gửi tới ${result.email}. Vui lòng kiểm tra hộp thư đến (hoặc mục Spam).`);
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();
    setError("");

    const trimmedOtp = otpForm.otp.trim().replace(/\s/g, "");
    if (trimmedOtp.length !== 6 || !/^\d+$/.test(trimmedOtp)) {
      setError("Mã xác thực gồm đúng 6 chữ số.");
      return;
    }

    setSubmitting(true);
    const result = await verifyOtp(otpForm.email, trimmedOtp);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    navigate(redirectTo, { replace: true });
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    setError("");
    setSubmitting(true);
    const result = await sendOtp({ ...registerForm, email: otpForm.email });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setResendCooldown(60);
    setSuccess("Đã gửi lại mã xác thực mới đến email của bạn.");
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError("");

    if (Object.keys(loginErrors).length) {
      setLoginTouched({ email: true, password: true });
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setSubmitting(true);
    const result = await login(loginForm.email, loginForm.password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
    }
  }

  if (isAuthenticated) {
    return <Navigate replace to={redirectTo} />;
  }

  const isRegisterMode = mode === "register";
  const isOtpMode = mode === "otp";

  return (
    <section className="relative overflow-hidden py-10 sm:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(52,211,153,0.12),transparent_32rem),radial-gradient(circle_at_85%_80%,rgba(56,189,248,0.08),transparent_30rem)]" />

      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:px-8">
        {/* Left column: Enterprise Security Value Proposition */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-emerald-300/20 bg-gradient-to-br from-[#071318] via-[#060b13] to-[#05080f] p-7 sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full border border-emerald-300/10 bg-emerald-300/[0.03] blur-2xl" />

          <div>
            <div className="flex items-center justify-between gap-4">
              <GreenShieldLogo showWordmark />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">
                <ShieldCheck size={14} aria-hidden="true" />
                AI Security Platform
              </span>
            </div>

            <h1 className="mt-8 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
              Bảo vệ ứng dụng AI trước khi đưa vào vận hành thực tế
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
              Không gian làm việc chuyên biệt dành cho đội ngũ kỹ sư AI, CTO và chuyên gia bảo mật để kiểm thử, chấm điểm rủi ro và xác minh bản vá trên hệ thống LLM.
            </p>

            <div className="mt-8 space-y-4">
              {securityHighlights.map(({ icon: Icon, title, body }) => (
                <div
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-emerald-300/25"
                  key={title}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-200">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-sm font-black text-white">{title}</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
              Tiêu chuẩn bảo mật phiên làm việc
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5 text-xs text-slate-300">
              {[
                "Mã hóa khóa mục tiêu AES-256",
                "Xác thực HttpOnly Session",
                "Cô lập dữ liệu theo Workspace",
              ].map((badge) => (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-semibold"
                  key={badge}
                >
                  <CheckCircle2 className="text-emerald-300" size={13} aria-hidden="true" />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Auth Form Card */}
        <div className="glass-panel flex flex-col justify-between rounded-3xl p-6 sm:p-9">
          <div>
            {/* Top Mode Header & Switcher */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
                  {isOtpMode
                    ? "Xác thực bảo mật 2 lớp"
                    : isRegisterMode
                    ? "Khởi tạo Workspace"
                    : "Cổng truy cập hệ thống"}
                </p>
                <h2 className="mt-1.5 text-2xl font-black text-white sm:text-3xl">
                  {isOtpMode
                    ? "Nhập mã xác thực OTP"
                    : isRegisterMode
                    ? "Đăng ký tài khoản mới"
                    : "Đăng nhập vào GreenShield"}
                </h2>
              </div>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-200">
                {isOtpMode ? (
                  <Mail size={22} aria-hidden="true" />
                ) : isRegisterMode ? (
                  <UserPlus size={22} aria-hidden="true" />
                ) : (
                  <LockKeyhole size={22} aria-hidden="true" />
                )}
              </span>
            </div>

            {!isOtpMode ? (
              <div className="mt-6 grid grid-cols-2 rounded-2xl border border-white/10 bg-slate-950/60 p-1">
                {[
                  ["login", "Đăng nhập"],
                  ["register", "Đăng ký tài khoản"],
                ].map(([value, label]) => (
                  <button
                    className={`focus-ring rounded-xl px-3 py-2.5 text-sm font-black transition ${
                      mode === value
                        ? "bg-emerald-300 text-slate-950 shadow-sm"
                        : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                    }`}
                    data-testid={`auth-tab-${value}`}
                    key={value}
                    onClick={() => switchMode(value)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}

            {/* OTP MODE */}
            {isOtpMode ? (
              <form className="mt-6" onSubmit={handleVerifyOtp}>
                <div className="mb-5 rounded-2xl border border-emerald-400/25 bg-emerald-950/30 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    Mã OTP đã được gửi đến email
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">{otpForm.email}</p>
                </div>

                <FormField label="Mã xác thực (6 chữ số)" name="otp">
                  <input
                    autoComplete="one-time-code"
                    autoFocus
                    className={`${inputClasses} text-center text-2xl font-black tracking-[0.45em]`}
                    inputMode="numeric"
                    maxLength={6}
                    name="otp"
                    onChange={(event) => {
                      setOtpForm((current) => ({ ...current, otp: event.target.value }));
                      setError("");
                    }}
                    placeholder="000000"
                    value={otpForm.otp}
                  />
                </FormField>

                {success ? (
                  <p className="mt-4 rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-3.5 text-xs font-semibold leading-5 text-emerald-100">
                    {success}
                  </p>
                ) : null}
                {error ? (
                  <p className="mt-4 rounded-xl border border-rose-300/25 bg-rose-400/10 p-3.5 text-xs font-semibold text-rose-200" role="alert">
                    {error}
                  </p>
                ) : null}

                <Button className="mt-6 w-full py-3" data-testid="otp-submit" disabled={submitting} type="submit">
                  {submitting ? "Đang xác thực..." : "Xác nhận & kích hoạt Workspace"}
                </Button>

                <div className="mt-4 flex items-center justify-between text-xs">
                  <button
                    className="inline-flex items-center gap-1.5 font-semibold text-slate-300 transition hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={resendCooldown > 0 || submitting}
                    onClick={handleResendOtp}
                    type="button"
                  >
                    <RotateCcw size={14} />
                    {resendCooldown > 0 ? `Gửi lại mã sau ${resendCooldown}s` : "Gửi lại mã OTP"}
                  </button>
                  <button
                    className="font-semibold text-slate-400 transition hover:text-white"
                    onClick={() => {
                      setMode("register");
                      setError("");
                      setSuccess("");
                    }}
                    type="button"
                  >
                    ← Đổi địa chỉ email
                  </button>
                </div>
              </form>
            ) : isRegisterMode ? (
              /* REGISTER MODE */
              <form className="mt-6" onSubmit={handleRegister}>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField error={registerTouched.name ? registerErrors.name : ""} label="Họ và tên" name="name">
                      <input
                        autoComplete="name"
                        className={inputClasses}
                        name="name"
                        onBlur={() => touchRegister("name")}
                        onChange={(event) => updateRegister("name", event.target.value)}
                        placeholder="Nguyễn Minh"
                        value={registerForm.name}
                      />
                    </FormField>
                    <FormField label="Công ty / Đội dự án" name="company">
                      <input
                        autoComplete="organization"
                        className={inputClasses}
                        name="company"
                        onChange={(event) => updateRegister("company", event.target.value)}
                        placeholder="Tên tổ chức hoặc sản phẩm AI"
                        value={registerForm.company}
                      />
                    </FormField>
                  </div>

                  <FormField error={registerTouched.email ? registerErrors.email : ""} label="Email công việc" name="email">
                    <input
                      autoComplete="email"
                      className={inputClasses}
                      inputMode="email"
                      name="email"
                      onBlur={() => touchRegister("email")}
                      onChange={(event) => updateRegister("email", event.target.value)}
                      placeholder="name@company.com"
                      value={registerForm.email}
                    />
                  </FormField>

                  <FormField error={registerTouched.password ? registerErrors.password : ""} label="Mật khẩu" name="password">
                    <div className="relative">
                      <input
                        autoComplete="new-password"
                        className={`${inputClasses} pr-11`}
                        name="password"
                        onBlur={() => touchRegister("password")}
                        onChange={(event) => updateRegister("password", event.target.value)}
                        placeholder="Tối thiểu 8 ký tự"
                        type={showRegisterPassword ? "text" : "password"}
                        value={registerForm.password}
                      />
                      <button
                        aria-label={showRegisterPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:text-white"
                        onClick={() => setShowRegisterPassword((v) => !v)}
                        type="button"
                      >
                        {showRegisterPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {registerForm.password ? (
                      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                        <div className="flex flex-1 gap-1">
                          {[1, 2, 3, 4].map((bar) => (
                            <span
                              className={`h-1.5 flex-1 rounded-full transition-all ${
                                bar <= passwordStrength.level ? passwordStrength.color : "bg-white/10"
                              }`}
                              key={bar}
                            />
                          ))}
                        </div>
                        <span className="font-semibold text-slate-400">{passwordStrength.label}</span>
                      </div>
                    ) : null}
                  </FormField>
                </div>

                {error ? (
                  <p className="mt-4 rounded-xl border border-rose-300/25 bg-rose-400/10 p-3.5 text-xs font-semibold text-rose-200" role="alert">
                    {error}
                  </p>
                ) : null}

                <Button className="mt-6 w-full py-3" data-testid="register-submit" disabled={submitting} type="submit">
                  {submitting ? "Đang gửi mã xác thực..." : "Tiếp tục & Nhận mã xác thực email"}
                  <ArrowRight size={16} aria-hidden="true" />
                </Button>
              </form>
            ) : (
              /* LOGIN MODE */
              <form className="mt-6" onSubmit={handleLogin}>
                <div className="space-y-4">
                  <FormField error={loginTouched.email ? loginErrors.email : ""} label="Địa chỉ Email" name="email">
                    <input
                      autoComplete="username"
                      className={inputClasses}
                      inputMode="email"
                      name="email"
                      onBlur={() => touchLogin("email")}
                      onChange={(event) => updateLogin("email", event.target.value)}
                      placeholder="name@company.com"
                      value={loginForm.email}
                    />
                  </FormField>

                  <FormField error={loginTouched.password ? loginErrors.password : ""} label="Mật khẩu" name="password">
                    <div className="relative">
                      <input
                        autoComplete="current-password"
                        className={`${inputClasses} pr-11`}
                        name="password"
                        onBlur={() => touchLogin("password")}
                        onChange={(event) => updateLogin("password", event.target.value)}
                        placeholder="Nhập mật khẩu của bạn"
                        type={showLoginPassword ? "text" : "password"}
                        value={loginForm.password}
                      />
                      <button
                        aria-label={showLoginPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:text-white"
                        onClick={() => setShowLoginPassword((v) => !v)}
                        type="button"
                      >
                        {showLoginPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </FormField>
                </div>

                {success ? (
                  <p className="mt-4 rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-3.5 text-xs font-semibold text-emerald-100">
                    {success}
                  </p>
                ) : null}
                {error ? (
                  <p className="mt-4 rounded-xl border border-rose-300/25 bg-rose-400/10 p-3.5 text-xs font-semibold text-rose-200" role="alert">
                    {error}
                  </p>
                ) : null}

                <Button className="mt-6 w-full py-3" data-testid="login-submit" disabled={submitting} type="submit">
                  <KeyRound size={16} aria-hidden="true" />
                  {submitting ? "Đang xác thực..." : "Đăng nhập vào Workspace"}
                </Button>

                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400">
                  <span>Chưa có tài khoản GreenShield?</span>
                  <button
                    className="font-bold text-emerald-300 hover:underline"
                    onClick={() => switchMode("register")}
                    type="button"
                  >
                    Tạo tài khoản mới →
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-slate-500">
            Bằng việc tiếp tục, bạn đồng ý với chính sách{" "}
            <Link className="font-semibold text-slate-300 underline hover:text-emerald-200" to="/privacy">
              Quyền riêng tư & Bảo mật dữ liệu
            </Link>{" "}
            của GreenShield.
          </div>
        </div>
      </div>
    </section>
  );
}
