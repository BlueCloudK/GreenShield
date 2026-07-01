import { LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { FormField, inputClasses } from "../components/ui/FormField";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const result = login(email, password);
    if (result.ok) {
      return;
    } else {
      setError(result.message);
    }
  }

  if (isAuthenticated) {
    return <Navigate replace to={redirectTo} />;
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <div className="glass-panel rounded-3xl p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
          <LockKeyhole size={26} aria-hidden="true" />
        </div>
        <p className="section-kicker mt-8">Tài khoản dùng thử</p>
        <h1 className="mt-3 text-4xl font-black text-white">Truy cập security console</h1>
        <p className="mt-4 leading-7 text-slate-400">
          Dùng tài khoản mẫu để xem dashboard, tạo phiên scan và đọc báo cáo bảo mật AI. Dữ liệu trong môi trường này chỉ phục vụ trải nghiệm sản phẩm.
        </p>
        <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-300">
          <p>
            Email: <strong className="text-white">admin@example.com</strong>
          </p>
          <p className="mt-2">
            Mật khẩu: <strong className="text-white">admin123</strong>
          </p>
        </div>
      </div>

      <form className="glass-panel rounded-3xl p-6 sm:p-8" onSubmit={handleSubmit}>
        <div className="space-y-5">
          <FormField label="Email" name="email">
            <input
              autoComplete="email"
              className={inputClasses}
              inputMode="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              value={email}
            />
          </FormField>
          <FormField label="Mật khẩu" name="password">
            <input
              className={inputClasses}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </FormField>
        </div>
        {error ? <p className="mt-4 rounded-2xl bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p> : null}
        <Button className="mt-6 w-full" type="submit">
          Đăng nhập
        </Button>
      </form>
    </section>
  );
}
