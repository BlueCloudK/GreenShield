import { LockKeyhole, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginPage() {
  const [mode, setMode] = useState("register");
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registerTouched, setRegisterTouched] = useState({});
  const [loginTouched, setLoginTouched] = useState({});
  const { isAuthenticated, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/app";

  useEffect(() => {
    if (isAuthenticated && !location.state?.skipAuthRedirect) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, location.state?.skipAuthRedirect, navigate, redirectTo]);

  useEffect(() => {
    if (new URLSearchParams(location.search).get("mode") === "login" || location.state?.authMode === "login") {
      setMode("login");
    }
  }, [location.search, location.state?.authMode]);

  const registerErrors = useMemo(() => {
    const errors = {};
    if (!registerForm.name.trim()) errors.name = "Nhập tên để tạo tài khoản demo.";
    if (!isValidEmail(registerForm.email)) errors.email = "Nhập email hợp lệ.";
    if (registerForm.password.length < 8) errors.password = "Mật khẩu cần ít nhất 8 ký tự.";
    return errors;
  }, [registerForm]);

  const loginErrors = useMemo(() => {
    const errors = {};
    if (!isValidEmail(loginForm.email)) errors.email = "Nhập email đã đăng ký.";
    if (!loginForm.password) errors.password = "Nhập mật khẩu demo.";
    return errors;
  }, [loginForm]);

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
    const result = await register(registerForm);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    setLoginForm({
      email: registerForm.email.trim().toLowerCase(),
      password: registerForm.password,
    });
    setRegisterForm(initialRegisterForm);
    setRegisterTouched({});
    setMode("login");
    setSuccess("Tài khoản đã được tạo. Kiểm tra lại email/mật khẩu rồi đăng nhập để vào workspace.");
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError("");

    if (Object.keys(loginErrors).length) {
      setLoginTouched({ email: true, password: true });
      setError("Vui lòng nhập đúng email và mật khẩu demo.");
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

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <div className="glass-panel rounded-3xl p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-200">
          {isRegisterMode ? <UserPlus size={26} aria-hidden="true" /> : <LockKeyhole size={26} aria-hidden="true" />}
        </div>
        <p className="section-kicker mt-8">GreenShield workspace</p>
        <h1 className="mt-3 text-4xl font-black text-white">
          {isRegisterMode ? "Tạo tài khoản dùng thử" : "Đăng nhập GreenShield"}
        </h1>
        <p className="mt-4 leading-7 text-slate-400">
          Đăng ký workspace để tạo project, kết nối target, chạy security tests và theo dõi retest bằng dữ liệu được lưu trên server.
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <div className="grid grid-cols-2 rounded-2xl border border-white/10 bg-slate-950/45 p-1">
          {[
            ["register", "Đăng ký nhanh"],
            ["login", "Đăng nhập"],
          ].map(([value, label]) => (
            <button
              className={`focus-ring rounded-xl px-3 py-2.5 text-sm font-black transition ${
                mode === value ? "bg-emerald-300 text-slate-950" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
              }`}
              key={value}
              onClick={() => switchMode(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {isRegisterMode ? (
          <form className="mt-6" onSubmit={handleRegister}>
            <div className="space-y-5">
              <FormField error={registerTouched.name ? registerErrors.name : ""} label="Họ tên" name="name">
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
              <FormField error={registerTouched.email ? registerErrors.email : ""} label="Email công việc" name="email">
                <input
                  autoComplete="email"
                  className={inputClasses}
                  inputMode="email"
                  name="email"
                  onBlur={() => touchRegister("email")}
                  onChange={(event) => updateRegister("email", event.target.value)}
                  placeholder="you@company.com"
                  value={registerForm.email}
                />
              </FormField>
              <FormField label="Công ty / dự án" name="company">
                <input
                  autoComplete="organization"
                  className={inputClasses}
                  name="company"
                  onChange={(event) => updateRegister("company", event.target.value)}
                  placeholder="Tên team hoặc sản phẩm AI"
                  value={registerForm.company}
                />
              </FormField>
              <FormField error={registerTouched.password ? registerErrors.password : ""} label="Mật khẩu" name="password">
                <input
                  autoComplete="new-password"
                  className={inputClasses}
                  name="password"
                  onBlur={() => touchRegister("password")}
                  onChange={(event) => updateRegister("password", event.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  type="password"
                  value={registerForm.password}
                />
              </FormField>
            </div>
            {error ? <p className="mt-4 rounded-2xl bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p> : null}
            <Button className="mt-6 w-full" data-testid="register-submit" disabled={submitting} type="submit">
              {submitting ? "Đang tạo..." : "Tạo tài khoản"}
            </Button>
          </form>
        ) : (
          <form className="mt-6" onSubmit={handleLogin}>
            <div className="space-y-5">
              <FormField error={loginTouched.email ? loginErrors.email : ""} label="Email" name="email">
                <input
                  autoComplete="username"
                  className={inputClasses}
                  inputMode="email"
                  name="email"
                  onBlur={() => touchLogin("email")}
                  onChange={(event) => updateLogin("email", event.target.value)}
                  placeholder="Email đã đăng ký"
                  value={loginForm.email}
                />
              </FormField>
              <FormField error={loginTouched.password ? loginErrors.password : ""} label="Mật khẩu" name="password">
                <input
                  autoComplete="current-password"
                  className={inputClasses}
                  name="password"
                  onBlur={() => touchLogin("password")}
                  onChange={(event) => updateLogin("password", event.target.value)}
                  placeholder="Mật khẩu"
                  type="password"
                  value={loginForm.password}
                />
              </FormField>
            </div>
            {success ? <p className="mt-4 rounded-2xl bg-emerald-300/10 p-3 text-sm text-emerald-100">{success}</p> : null}
            {error ? <p className="mt-4 rounded-2xl bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p> : null}
            <Button className="mt-6 w-full" data-testid="login-submit" disabled={submitting} type="submit">
              {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
