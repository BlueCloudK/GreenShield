import { Menu, X } from "lucide-react";
import { useState } from "react";
import { flushSync } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { GreenShieldLogo } from "../brand/GreenShieldLogo";
import { Button } from "../ui/Button";

const navItems = [
  { label: "Sản phẩm", to: "/" },
  { label: "Bảng giá", to: "/products" },
  { label: "Báo cáo mẫu", to: "/reports/scan-gs-001" },
  { label: "Liên hệ", to: "/contact" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const scanRoute = isAuthenticated ? "/scan/new" : "/login";
  const scanState = isAuthenticated ? undefined : { from: { pathname: "/scan/new" } };
  const primaryActionLabel = isAuthenticated ? "Tạo scan mới" : "Bắt đầu scan";

  function isActiveRoute(to) {
    if (to === "/") return location.pathname === "/";
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  }

  function getNavClass(to) {
    const active = isActiveRoute(to);
    return `rounded-lg px-3 py-2 text-sm font-semibold transition ${
      active
        ? "bg-white/[0.08] text-white"
        : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
    }`;
  }

  function handleLogout() {
    flushSync(() => {
      logout();
    });
    setMenuOpen(false);
    navigate("/login?mode=login", { replace: true, state: { skipAuthRedirect: true } });
  }

  function handleNavClick() {
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05070d]/95">
      <div className="site-container flex h-16 min-w-0 items-center gap-3 sm:gap-4">
        <Link className="flex min-w-0 shrink-0 items-center gap-3" to="/">
          <GreenShieldLogo showWordmark />
        </Link>

        <nav className="hidden min-w-0 items-center gap-1 lg:ml-6 lg:flex">
          {navItems.map((item) => (
            <Link
              aria-current={isActiveRoute(item.to) ? "page" : undefined}
              className={getNavClass(item.to)}
              key={item.to}
              onClick={handleNavClick}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden shrink-0 items-center gap-3 lg:flex">
          <Button data-testid="header-primary-cta" state={scanState} to={scanRoute}>
            {primaryActionLabel}
          </Button>
          {user ? (
            <>
              <Button data-testid="header-dashboard-link" to="/dashboard" variant="secondary">
                Dashboard
              </Button>
              <Button onClick={handleLogout} variant="ghost">
                Đăng xuất
              </Button>
            </>
          ) : (
            <Button data-testid="header-login-link" to="/login" variant="ghost">Đăng nhập</Button>
          )}
        </div>

        <button
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          className="focus-ring ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-slate-100 lg:hidden"
          onClick={() => setMenuOpen((isOpen) => !isOpen)}
          type="button"
        >
          {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>

      <div
        className={`overflow-hidden border-t border-white/10 bg-slate-950/95 transition-all duration-300 lg:hidden ${
          menuOpen ? "max-h-[28rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 py-4 sm:px-6">
          <nav className="grid gap-1">
            {navItems.map((item) => (
              <Link
                aria-current={isActiveRoute(item.to) ? "page" : undefined}
                className={getNavClass(item.to)}
                key={item.to}
                onClick={handleNavClick}
                to={item.to}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button className="w-full" onClick={() => setMenuOpen(false)} state={scanState} to={scanRoute}>
              {primaryActionLabel}
            </Button>
            {user ? (
              <>
                <Button className="w-full" onClick={() => setMenuOpen(false)} to="/dashboard" variant="secondary">
                  Dashboard
                </Button>
                <Button className="w-full" onClick={handleLogout} variant="ghost">
                  Đăng xuất
                </Button>
              </>
            ) : (
              <Button className="w-full" onClick={() => setMenuOpen(false)} to="/login" variant="ghost">
                Đăng nhập
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
