import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { useAuth } from "./context/AuthContext";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NewScanPage from "./pages/NewScanPage";
import ProductsPage from "./pages/ProductsPage";
import NotFoundPage from "./pages/NotFoundPage";
import ReportPage from "./pages/ReportPage";
import ScanProgressPage from "./pages/ScanProgressPage";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route element={<ProductsPage />} path="/products" />
        <Route
          element={
            <ProtectedRoute>
              <NewScanPage />
            </ProtectedRoute>
          }
          path="/scan/new"
        />
        <Route
          element={
            <ProtectedRoute>
              <ScanProgressPage />
            </ProtectedRoute>
          }
          path="/scan/progress"
        />
        <Route element={<ReportPage />} path="/reports/:scanId" />
        <Route element={<Navigate replace to="/products" />} path="/products/:productId" />
        <Route element={<Navigate replace to="/products" />} path="/cart" />
        <Route element={<Navigate replace to="/products" />} path="/checkout" />
        <Route element={<Navigate replace to="/products" />} path="/order-success/:orderId" />
        <Route element={<LoginPage />} path="/login" />
        <Route
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
          path="/dashboard"
        />
        <Route element={<AboutPage />} path="/about" />
        <Route element={<ContactPage />} path="/contact" />
        <Route element={<NotFoundPage />} path="*" />
      </Route>
    </Routes>
  );
}
