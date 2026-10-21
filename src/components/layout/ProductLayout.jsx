import { Activity, CreditCard, FolderKanban, LayoutDashboard, LogOut, Menu, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { GreenShieldLogo } from "../brand/GreenShieldLogo";
import { Button } from "../ui/Button";

const navigation = [
  { label: "Tổng quan", to: "/app", icon: LayoutDashboard, end: true },
  { label: "Projects", to: "/app/projects", icon: FolderKanban },
  { label: "Đánh giá chatbot", to: "/app/evaluator", icon: Activity },
  { label: "Thanh toán", to: "/app/billing", icon: CreditCard },
];

export function ProductLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); setOpen(false); }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate("/login?mode=login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#060a10] text-slate-100 lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <header className="sticky top-0 z-40 flex h-16 items-center border-b border-white/10 bg-[#060a10]/95 px-4 lg:hidden">
        <GreenShieldLogo showWordmark />
        <button
          aria-label={open ? "Đóng menu" : "Mở menu"}
          className="focus-ring ml-auto flex h-10 w-10 items-center justify-center rounded-lg border border-white/10"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <aside className={`${open ? "flex" : "hidden"} fixed inset-x-0 bottom-0 top-16 z-30 flex-col border-r border-white/10 bg-[#080d14] p-4 lg:sticky lg:top-0 lg:flex lg:h-screen`}>
        <div className="hidden h-12 items-center lg:flex">
          <GreenShieldLogo showWordmark />
        </div>
        <Button className="mt-4 w-full" to="/app/projects/new" onClick={() => setOpen(false)}>
          <Plus size={16} /> Tạo project
        </Button>
        <nav className="mt-6 grid gap-1">
          {navigation.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              className={({ isActive }) => `focus-ring flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${isActive ? "bg-emerald-300/12 text-emerald-100" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"}`}
              end={end}
              key={to}
              onClick={() => setOpen(false)}
              to={to}
            >
              <Icon size={17} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-4">
          <p className="truncate text-sm font-bold text-white">{user?.name}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{user?.workspace?.name}</p>
          <button className="focus-ring mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-400 hover:bg-white/[0.05] hover:text-white" onClick={handleLogout} type="button">
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </aside>

      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
