import {
  CheckCircle2,
  CreditCard,
  FolderKanban,
  Mail,
  MessageSquareQuote,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StarRating } from "../components/feedback/StarRating";
import { Button } from "../components/ui/Button";
import { FormField, inputClasses } from "../components/ui/FormField";
import { ErrorState, LoadingState } from "../components/ui/PageState";
import { useAuth } from "../context/AuthContext";
import { initialReviews, loadReviews, saveReviews } from "../data/reviews";
import { api, del, patch, post } from "../lib/api";

const TABS = [
  { id: "users", label: "Người dùng & Tài khoản", icon: Users },
  { id: "contacts", label: "Yêu cầu Liên hệ", icon: Mail },
  { id: "payments", label: "Đơn Thanh toán & Scan", icon: CreditCard },
  { id: "reviews", label: "Đánh giá Sản phẩm", icon: MessageSquareQuote },
];

const initialNewUser = {
  name: "",
  email: "",
  company: "",
  password: "",
};

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [newUser, setNewUser] = useState(initialNewUser);
  const [creatingUser, setCreatingUser] = useState(false);
  const [reviews, setReviews] = useState(() => loadReviews());

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api("/api/admin/overview");
      setData(res);
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu quản trị.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const filteredUsers = useMemo(() => {
    const list = data?.users || [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (item) =>
        String(item.name || "").toLowerCase().includes(q) ||
        String(item.email || "").toLowerCase().includes(q) ||
        String(item.company || "").toLowerCase().includes(q) ||
        String(item.workspace_name || "").toLowerCase().includes(q)
    );
  }, [data, search]);

  async function handleCreateUser(event) {
    event.preventDefault();
    setActionMessage("");
    setCreatingUser(true);
    try {
      await post("/api/admin/users", newUser);
      setNewUser(initialNewUser);
      setActionMessage("Đã tạo tài khoản mới (đã kích hoạt xác minh email).");
      await fetchOverview();
    } catch (err) {
      setActionMessage(`Lỗi: ${err.message}`);
    } finally {
      setCreatingUser(false);
    }
  }

  async function handleVerifyUser(userId, email) {
    setActionMessage("");
    try {
      await patch(`/api/admin/users/${userId}/verify`, {});
      setActionMessage(`Đã xác minh email cho ${email}.`);
      await fetchOverview();
    } catch (err) {
      setActionMessage(`Lỗi: ${err.message}`);
    }
  }

  async function handleGrantPlan(userId, email) {
    setActionMessage("");
    try {
      await post(`/api/admin/users/${userId}/grant-plan`, {});
      setActionMessage(`Đã kích hoạt gói AI App Assessment (PAID) và gỡ các đơn treo cho ${email}.`);
      await fetchOverview();
    } catch (err) {
      setActionMessage(`Lỗi: ${err.message}`);
    }
  }

  async function handleClearStuckOrders(userId, email) {
    setActionMessage("");
    try {
      await post(`/api/admin/users/${userId}/clear-orders`, {});
      setActionMessage(`Đã xóa toàn bộ đơn thanh toán bị treo của ${email}.`);
      await fetchOverview();
    } catch (err) {
      setActionMessage(`Lỗi: ${err.message}`);
    }
  }

  async function handleUpdatePaymentStatus(orderId, status) {
    setActionMessage("");
    try {
      await patch(`/api/admin/payments/${orderId}`, { status });
      setActionMessage(`Đã cập nhật trạng thái đơn thanh toán sang ${status}.`);
      await fetchOverview();
    } catch (err) {
      setActionMessage(`Lỗi: ${err.message}`);
    }
  }

  async function handleDeletePayment(orderId) {
    setActionMessage("");
    try {
      await del(`/api/admin/payments/${orderId}`);
      setActionMessage("Đã xóa đơn thanh toán khỏi hệ thống.");
      await fetchOverview();
    } catch (err) {
      setActionMessage(`Lỗi: ${err.message}`);
    }
  }

  async function handleDeleteUser(userId, email) {
    setActionMessage("");
    try {
      await del(`/api/admin/users/${userId}`);
      setActionMessage(`Đã xóa tài khoản ${email}.`);
      await fetchOverview();
    } catch (err) {
      setActionMessage(`Lỗi: ${err.message}`);
    }
  }

  async function handleDeleteContact(contactId) {
    setActionMessage("");
    try {
      await del(`/api/admin/contacts/${contactId}`);
      setActionMessage("Đã xóa yêu cầu liên hệ.");
      await fetchOverview();
    } catch (err) {
      setActionMessage(`Lỗi: ${err.message}`);
    }
  }

  function handleDeleteReview(reviewId) {
    setReviews((curr) => {
      const updated = curr.filter((r) => r.id !== reviewId);
      saveReviews(updated);
      return updated;
    });
    setActionMessage("Đã xóa đánh giá sản phẩm khỏi danh sách hiển thị.");
  }

  function handleResetReviews() {
    saveReviews(initialReviews);
    setReviews(initialReviews);
    setActionMessage("Đã khôi phục danh sách đánh giá mặc định.");
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <ErrorState message="Tài khoản của bạn không có quyền Quản trị viên (System Admin)." />
      </div>
    );
  }

  if (loading && !data) {
    return <LoadingState label="Đang tải bảng điều khiển Quản trị viên..." />;
  }

  if (error && !data) {
    return (
      <div className="p-6">
        <ErrorState message={error} onRetry={fetchOverview} />
      </div>
    );
  }

  const stats = data?.stats || {};

  const kpis = [
    { label: "Tổng người dùng", value: stats.total_users ?? 0, sub: `${stats.verified_users ?? 0} đã xác minh` },
    { label: "Workspaces", value: stats.total_workspaces ?? 0, sub: `${stats.total_projects ?? 0} projects hoạt động` },
    { label: "Lượt Scan & Benchmark", value: Number(stats.total_scans || 0) + Number(stats.total_evaluations || 0), sub: `${stats.total_scans ?? 0} scans · ${stats.total_evaluations ?? 0} benchmarks` },
    { label: "Liên hệ & Đơn hàng", value: Number(stats.total_contacts || 0) + Number(stats.total_payments || 0), sub: `${stats.total_contacts ?? 0} liên hệ · ${stats.paid_orders_count ?? 0} đơn PAID` },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>SYSTEM ADMIN CONSOLE</span>
          </div>
          <h1 className="mt-2 text-3xl font-black text-white">Quản trị hệ thống GreenShield</h1>
          <p className="mt-1 text-sm text-slate-400">
            Quản lý tài khoản người dùng, gỡ đơn thanh toán treo, cấp gói dịch vụ, duyệt liên hệ và kiểm duyệt đánh giá sản phẩm.
          </p>
        </div>
        <Button onClick={fetchOverview} variant="secondary">
          <RefreshCw size={15} aria-hidden="true" /> Làm mới dữ liệu
        </Button>
      </div>

      {/* KPI Summary Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((item) => (
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4" key={item.label}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
            <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
            <p className="mt-1 text-xs font-semibold text-emerald-300">{item.sub}</p>
          </div>
        ))}
      </div>

      {actionMessage ? (
        <div
          className="mt-5 flex items-center justify-between rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100"
          role="status"
        >
          <span>{actionMessage}</span>
          <button className="text-xs underline" onClick={() => setActionMessage("")} type="button">
            Đóng
          </button>
        </div>
      ) : null}

      {/* Tabs navigation */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                active
                  ? "bg-emerald-300 text-slate-950"
                  : "border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07] hover:text-white"
              }`}
              data-testid={`admin-tab-${id}`}
              key={id}
              onClick={() => setActiveTab(id)}
              type="button"
            >
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: USERS */}
      {activeTab === "users" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_0.7fr] lg:items-start">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55">
            <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-black text-white">
                Danh sách tài khoản ({filteredUsers.length})
              </h2>
              <input
                className="rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo tên, email, công ty..."
                value={search}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[780px] w-full text-left text-xs">
                <thead className="bg-white/[0.03] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-black">Người dùng</th>
                    <th className="px-4 py-3 font-black">Workspace / Gói</th>
                    <th className="px-4 py-3 font-black">Trạng thái</th>
                    <th className="px-4 py-3 font-black">Hoạt động</th>
                    <th className="px-4 py-3 font-black text-right">Thao tác quản trị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredUsers.map((u) => (
                    <tr className="text-slate-300" key={u.id}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{u.name}</span>
                          {u.isAdmin ? (
                            <span className="rounded-full bg-emerald-300/20 px-2 py-0.5 text-[10px] font-black text-emerald-200">
                              ADMIN
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-slate-400">{u.email}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-200">{u.workspace_name || "—"}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Number(u.paid_orders_count) > 0 ? (
                            <span className="rounded-full border border-emerald-300/30 bg-emerald-300/15 px-2 py-0.5 text-[10px] font-black text-emerald-200">
                              Assessment PAID
                            </span>
                          ) : (
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-400">
                              Pilot
                            </span>
                          )}
                          {Number(u.pending_orders_count) > 0 ? (
                            <span className="rounded-full border border-amber-300/30 bg-amber-300/15 px-2 py-0.5 text-[10px] font-black text-amber-200">
                              Đang treo {u.pending_orders_count} đơn
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {u.email_verified_at ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-0.5 font-bold text-emerald-200">
                            <CheckCircle2 size={12} /> Đã xác minh
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-0.5 font-bold text-amber-200">
                            Chưa xác minh
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">
                        <p>{u.project_count ?? 0} projects · {u.scan_count ?? 0} scans</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {String(u.created_at || "").slice(0, 10)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                          {!u.email_verified_at ? (
                            <button
                              className="rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-1 font-bold text-emerald-200 hover:bg-emerald-300/20"
                              onClick={() => handleVerifyUser(u.id, u.email)}
                              type="button"
                            >
                              Xác minh Email
                            </button>
                          ) : null}
                          {Number(u.pending_orders_count) > 0 ? (
                            <button
                              className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 font-bold text-amber-200 hover:bg-amber-300/20"
                              onClick={() => handleClearStuckOrders(u.id, u.email)}
                              title="Xóa các đơn 2k đang bị treo của tài khoản này"
                              type="button"
                            >
                              Gỡ đơn treo
                            </button>
                          ) : null}
                          <button
                            className="inline-flex items-center gap-1 rounded-lg border border-sky-300/30 bg-sky-300/10 px-2.5 py-1 font-bold text-sky-200 hover:bg-sky-300/20"
                            onClick={() => handleGrantPlan(u.id, u.email)}
                            title="Kích hoạt gói AI App Assessment (PAID) và gỡ đơn treo"
                            type="button"
                          >
                            <Sparkles size={12} /> Cấp gói PAID
                          </button>
                          {!u.isAdmin ? (
                            <button
                              aria-label={`Xóa ${u.email}`}
                              className="rounded-lg border border-rose-300/25 bg-rose-400/10 p-1.5 text-rose-200 hover:bg-rose-400/20"
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              title="Xóa tài khoản"
                              type="button"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create user directly */}
          <form
            className="rounded-2xl border border-white/10 bg-slate-950/60 p-5"
            onSubmit={handleCreateUser}
          >
            <div className="flex items-center gap-2 text-emerald-200">
              <UserPlus size={18} />
              <h3 className="text-base font-black text-white">Cấp tài khoản mới trực tiếp</h3>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Tạo nhanh tài khoản khách hàng hoặc thành viên đã xác minh sẵn email (bỏ qua bước chờ OTP).
            </p>

            <div className="mt-4 space-y-3">
              <FormField label="Họ tên" name="name">
                <input
                  className={inputClasses}
                  onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))}
                  placeholder="VD: Nguyễn Văn A"
                  required
                  value={newUser.name}
                />
              </FormField>
              <FormField label="Email đăng nhập" name="email">
                <input
                  className={inputClasses}
                  onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                  placeholder="client@company.com"
                  required
                  type="email"
                  value={newUser.email}
                />
              </FormField>
              <FormField label="Công ty / Tổ chức" name="company">
                <input
                  className={inputClasses}
                  onChange={(e) => setNewUser((p) => ({ ...p, company: e.target.value }))}
                  placeholder="VD: FinTech Corp"
                  value={newUser.company}
                />
              </FormField>
              <FormField label="Mật khẩu khởi tạo (tối thiểu 8 ký tự)" name="password">
                <input
                  className={inputClasses}
                  minLength={8}
                  onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  type="text"
                  value={newUser.password}
                />
              </FormField>
            </div>

            <Button className="mt-5 w-full" disabled={creatingUser} type="submit">
              <UserPlus size={16} />
              {creatingUser ? "Đang tạo..." : "Tạo & kích hoạt tài khoản"}
            </Button>
          </form>
        </div>
      ) : null}

      {/* TAB 2: CONTACTS */}
      {activeTab === "contacts" ? (
        <div className="mt-6 grid gap-4">
          {(data?.contacts || []).length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-8 text-center text-sm text-slate-400">
              Chưa có yêu cầu liên hệ hoặc assessment nào.
            </div>
          ) : (
            (data?.contacts || []).map((item) => (
              <article
                className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/55 p-5 sm:flex-row sm:items-start"
                key={item.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black text-white">{item.subject}</h3>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs text-slate-300">
                      {String(item.created_at || "").slice(0, 16).replace("T", " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-emerald-300">
                    {item.full_name} · {item.email}
                  </p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-300">
                    {item.message}
                  </p>
                </div>
                <button
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-200 hover:bg-rose-400/20"
                  onClick={() => handleDeleteContact(item.id)}
                  type="button"
                >
                  <Trash2 size={14} /> Đánh dấu đã xử lý / Xóa
                </button>
              </article>
            ))
          )}
        </div>
      ) : null}

      {/* TAB 3: PAYMENTS & SCANS */}
      {activeTab === "payments" ? (
        <div className="mt-6 space-y-6">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55">
            <div className="border-b border-white/10 p-4">
              <h2 className="text-base font-black text-white">
                Quản lý Đơn thanh toán PayOS ({(data?.payments || []).length})
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Admin có thể duyệt thanh toán thủ công (PAID), hủy đơn treo (CANCELLED) hoặc xóa hẳn đơn nháp khỏi hệ thống.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-left text-xs">
                <thead className="bg-white/[0.03] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-black">Mã đơn / Gói</th>
                    <th className="px-4 py-3 font-black">Khách hàng / Workspace</th>
                    <th className="px-4 py-3 font-black">Số tiền</th>
                    <th className="px-4 py-3 font-black">Trạng thái</th>
                    <th className="px-4 py-3 font-black text-right">Thao tác Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {(data?.payments || []).map((po) => (
                    <tr className="text-slate-300" key={po.id}>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-white">#{po.order_code}</p>
                        <p className="text-slate-400">{po.product_name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {String(po.created_at || "").slice(0, 16).replace("T", " ")}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-200">{po.user_name || "—"}</p>
                        <p className="text-slate-400">{po.user_email}</p>
                        <p className="text-[11px] text-slate-500">{po.workspace_name}</p>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-white">
                        {Number(po.amount || 0).toLocaleString("vi-VN")} {po.currency}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 font-black ${
                            po.status === "PAID"
                              ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-200"
                              : po.status === "PENDING"
                              ? "border-amber-300/30 bg-amber-300/15 text-amber-200"
                              : "border-white/10 bg-white/[0.05] text-slate-300"
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                          {po.status !== "PAID" ? (
                            <button
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-1 font-bold text-emerald-200 hover:bg-emerald-300/20"
                              onClick={() => handleUpdatePaymentStatus(po.id, "PAID")}
                              type="button"
                            >
                              <CheckCircle2 size={12} /> Duyệt PAID
                            </button>
                          ) : null}
                          {po.status !== "CANCELLED" ? (
                            <button
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 font-bold text-amber-200 hover:bg-amber-300/20"
                              onClick={() => handleUpdatePaymentStatus(po.id, "CANCELLED")}
                              type="button"
                            >
                              <XCircle size={12} /> Hủy đơn
                            </button>
                          ) : null}
                          <button
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-300/25 bg-rose-400/10 px-2.5 py-1 font-bold text-rose-200 hover:bg-rose-400/20"
                            onClick={() => handleDeletePayment(po.id)}
                            title="Xóa đơn"
                            type="button"
                          >
                            <Trash2 size={12} /> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(data?.payments || []).length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                        Chưa có giao dịch thanh toán nào.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55">
            <div className="border-b border-white/10 p-4">
              <h2 className="flex items-center gap-2 text-base font-black text-white">
                <FolderKanban size={16} className="text-emerald-300" />
                Lượt Scan bảo mật gần đây ({(data?.recentScans || []).length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.03] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-black">Project / Target</th>
                    <th className="px-4 py-3 font-black">Workspace</th>
                    <th className="px-4 py-3 font-black">Điểm rủi ro</th>
                    <th className="px-4 py-3 font-black">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {(data?.recentScans || []).map((scan) => (
                    <tr className="text-slate-300" key={scan.id}>
                      <td className="px-4 py-3">
                        <p className="font-bold text-white">{scan.project_name}</p>
                        <p className="text-slate-400">{scan.target_name}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{scan.workspace_name}</td>
                      <td className="px-4 py-3 font-bold text-white">
                        {scan.risk_score ?? "—"} ({scan.risk_level || "N/A"})
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 font-bold text-slate-200">
                          {scan.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(data?.recentScans || []).length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-slate-500" colSpan={4}>
                        Chưa có lượt scan nào.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {/* TAB 4: REVIEWS MANAGEMENT */}
      {activeTab === "reviews" ? (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/55 p-4">
            <div>
              <h2 className="text-base font-black text-white">
                Quản lý Đánh giá Sản phẩm ({reviews.length} đánh giá)
              </h2>
              <p className="text-xs text-slate-400">
                Kiểm duyệt các đánh giá hiển thị trên trang /reviews, Trang chủ và trang Bảng giá.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleResetReviews} variant="secondary">
                Khôi phục mặc định
              </Button>
              <Button to="/reviews" variant="primary">
                Xem trang /reviews
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {reviews.map((rev) => (
              <article
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-950/55 p-5"
                key={rev.id}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StarRating rating={rev.rating} size={14} />
                      <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-0.5 text-xs font-bold text-emerald-100">
                        {rev.plan}
                      </span>
                    </div>
                    <button
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-300/25 bg-rose-400/10 px-2.5 py-1 text-xs font-bold text-rose-200 hover:bg-rose-400/20"
                      onClick={() => handleDeleteReview(rev.id)}
                      type="button"
                    >
                      <Trash2 size={13} /> Xóa
                    </button>
                  </div>
                  <h3 className="mt-3 font-black text-white">{rev.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-300">{rev.comment}</p>
                </div>
                <div className="mt-4 border-t border-white/10 pt-3 text-xs text-slate-400">
                  <span className="font-bold text-white">{rev.author}</span> · {rev.role} · {rev.createdAt}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
