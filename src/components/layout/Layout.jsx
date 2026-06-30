import { Outlet } from "react-router-dom";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function Layout() {
  return (
    <div className="app-shell min-h-screen text-slate-100">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
