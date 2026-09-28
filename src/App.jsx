import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { ProductLayout } from "./components/layout/ProductLayout";
import { LoadingState } from "./components/ui/PageState";
import { useAuth } from "./context/AuthContext";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NewProjectPage from "./pages/NewProjectPage";
import NewProjectScanPage from "./pages/NewProjectScanPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProductsPage from "./pages/ProductsPage";
import PrivacyPage from "./pages/PrivacyPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ProjectsPage from "./pages/ProjectsPage";
import ReportPage from "./pages/ReportPage";
import ScanDetailPage from "./pages/ScanDetailPage";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingState label="Đang kiểm tra phiên đăng nhập..." />;
  if (!isAuthenticated) return <Navigate replace state={{ from: location }} to="/login?mode=login" />;
  return children;
}
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route element={<ProductsPage />} path="/products" />
        <Route element={<LoginPage />} path="/login" />
        <Route element={<AboutPage />} path="/about" />
        <Route element={<ContactPage />} path="/contact" />
        <Route element={<PrivacyPage />} path="/privacy" />
      </Route>

      <Route element={<ProtectedRoute><ProductLayout /></ProtectedRoute>} path="/app">
        <Route index element={<DashboardPage />} />
        <Route element={<ProjectsPage />} path="projects" />
        <Route element={<NewProjectPage />} path="projects/new" />
        <Route element={<ProjectDetailPage />} path="projects/:projectId" />
        <Route element={<NewProjectScanPage />} path="projects/:projectId/scans/new" />
        <Route element={<ScanDetailPage />} path="scans/:scanId" />
        <Route element={<ReportPage />} path="reports/:scanId" />
      </Route>

      <Route element={<Navigate replace to="/app" />} path="/dashboard" />
      <Route element={<Navigate replace to="/app/projects/new" />} path="/scan/new" />
      <Route element={<Navigate replace to="/app" />} path="/scan/progress" />
      <Route element={<ProtectedRoute><ReportPage /></ProtectedRoute>} path="/reports/:scanId" />
      <Route element={<NotFoundPage />} path="*" />
    </Routes>
  );
}
