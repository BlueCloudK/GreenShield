import { useState } from "react";
import { AlertTriangle, Check, Mail, RotateCcw } from "lucide-react";
import { post } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { FormField, inputClasses } from "../ui/FormField";

export function EmailVerification() {
  const { user, refreshUser } = useAuth();
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    setBusy(true);
    setError("");
    try {
      await post("/api/auth/email-verification/send", {});
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirm(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await post("/api/auth/email-verification/confirm", { otp: code });
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-300/[0.07] p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-300/30 bg-amber-300/15 text-amber-200">
            <AlertTriangle size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-black text-white">
              Yêu cầu xác minh email trước khi tạo giao dịch
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-300">
              Để bảo vệ quyền sở hữu đơn hàng và biên lai thanh toán, vui lòng xác minh địa chỉ email:{" "}
              <span className="break-all font-bold text-amber-200">{user?.email}</span>
            </p>
          </div>
        </div>

        {!sent ? (
          <Button className="shrink-0" disabled={busy} onClick={send} variant="secondary">
            <Mail size={15} aria-hidden="true" />
            {busy ? "Đang gửi mã..." : "Gửi mã xác nhận"}
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-200" role="alert">
          {error}
        </p>
      ) : null}

      {sent ? (
        <form className="mt-4 flex flex-wrap items-end gap-3 border-t border-white/10 pt-4" onSubmit={confirm}>
          <div className="w-full sm:w-64">
            <FormField label="Mã xác nhận email (6 chữ số)">
              <input
                aria-label="Mã xác nhận email"
                autoComplete="one-time-code"
                className={`${inputClasses} text-center font-black tracking-[0.35em]`}
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                pattern="[0-9]{6}"
                placeholder="000000"
                required
                value={code}
              />
            </FormField>
          </div>
          <Button disabled={busy || code.length !== 6} type="submit">
            <Check size={15} aria-hidden="true" /> Xác nhận
          </Button>
          <Button disabled={busy} onClick={send} type="button" variant="ghost">
            <RotateCcw size={14} aria-hidden="true" /> Gửi lại mã
          </Button>
          <p className="w-full text-xs text-slate-400" role="status">
            Mã xác nhận đã được gửi tới hộp thư của bạn và có hiệu lực trong 10 phút.
          </p>
        </form>
      ) : null}
    </div>
  );
}
