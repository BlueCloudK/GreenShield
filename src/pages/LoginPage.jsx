import { LockKeyhole, ShieldCheck, UserPlus } from "lucide-react";
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
  const { isAuthenticated, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const registerErrors = useMemo(() => {
    const errors = {};
    if (!registerForm.name.trim()) errors.name = "Nhập tên để tạo tài khoản demo.";
    if (!isValidEmail(registerForm.email)) errors.email = "Nhập email hợp lệ.";
    if (registerForm.password.length < 6) errors.password = "Mật khẩu demo cần ít nhất 6 ký tự.";
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
  }

  function updateLogin(field, value) {
    setLoginForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
  }

  function handleRegister(event) {
    event.preventDefault();
    setError("");

    if (Object.keys(registerErrors).length) {
      setError("Vui lòng kiểm tra lại thông tin đăng ký.");
      return;
    }

    const result = register(registerForm);
    if (!result.ok) {
      setError(result.message);
    }
  }

  function handleLogin(event) {
    event.preventDefault();
    setError("");

    if (Object.keys(loginErrors).length) {
      setError("Vui lòng nhập đúng email và mật khẩu demo.");
      return;
    }

    const result = login(loginForm.email, loginForm.password);
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
        <p className="section-kicker mt-8">Tài khoản demo</p>
        <h1 className="mt-3 text-4xl font-black text-white">
          {isRegisterMode ? "Tạo tài khoản dùng thử" : "Đăng nhập GreenShield"}
        </h1>
        <p className="mt-4 leading-7 text-slate-400">
          Tạo nhanh một tài khoản demo để vào dashboard, chạy phiên scan và xem report bảo mật AI. Tài khoản chỉ lưu trong trình duyệt bằng localStorage, chưa phải auth production.
        </p>
        <div className="mt-8 grid gap-3">
          {[
            "Không cần email xác thực ở bản demo.",
            "Không nhập token, API key hoặc dữ liệu khách hàng thật.",
            "Có thể thay bằng backend auth sau khi MVP được validate.",
          ].map((item) => (
            <div className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-sm leading-6 text-slate-300" key={item}>
              <ShieldCheck className="mt-0.5 shrink-0 text-emerald-200" size={17} aria-hidden="true" />
              <span>{item}</span>
            </div>
          ))}
        </div>
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
              <FormField error={registerErrors.name} label="Họ tên" name="name">
                <input
                  autoComplete="name"
                  className={inputClasses}
                  name="name"
                  onChange={(event) => updateRegister("name", event.target.value)}
                  placeholder="Nguyễn Minh"
                  value={registerForm.name}
                />
              </FormField>
              <FormField error={registerErrors.email} label="Email công việc" name="email">
                <input
                  autoComplete="email"
                  className={inputClasses}
                  inputMode="email"
                  name="email"
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
              <FormField error={registerErrors.password} label="Mật khẩu demo" name="password">
                <input
                  autoComplete="new-password"
                  className={inputClasses}
                  name="password"
                  onChange={(event) => updateRegister("password", event.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  type="password"
                  value={registerForm.password}
                />
              </FormField>
            </div>
            {error ? <p className="mt-4 rounded-2xl bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p> : null}
            <Button className="mt-6 w-full" data-testid="register-submit" type="submit">
              Tạo tài khoản và vào demo
            </Button>
          </form>
        ) : (
          <form className="mt-6" onSubmit={handleLogin}>
            <div className="space-y-5">
              <FormField error={loginErrors.email} label="Email" name="loginEmail">
                <input
                  autoComplete="email"
                  className={inputClasses}
                  inputMode="email"
                  name="loginEmail"
                  onChange={(event) => updateLogin("email", event.target.value)}
                  placeholder="Email đã đăng ký demo"
                  value={loginForm.email}
                />
              </FormField>
              <FormField error={loginErrors.password} label="Mật khẩu" name="loginPassword">
                <input
                  autoComplete="current-password"
                  className={inputClasses}
                  name="loginPassword"
                  onChange={(event) => updateLogin("password", event.target.value)}
                  placeholder="Mật khẩu demo"
                  type="password"
                  value={loginForm.password}
                />
              </FormField>
            </div>
            {error ? <p className="mt-4 rounded-2xl bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p> : null}
            <Button className="mt-6 w-full" data-testid="login-submit" type="submit">
              Đăng nhập
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
