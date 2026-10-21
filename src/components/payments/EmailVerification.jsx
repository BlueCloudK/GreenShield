import { useState } from 'react';
import { Mail, Check } from 'lucide-react';
import { post } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { FormField, inputClasses } from '../ui/FormField';

export function EmailVerification() {
  const { user, refreshUser } = useAuth();
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function send() {
    setBusy(true); setError('');
    try { await post('/api/auth/email-verification/send', {}); setSent(true); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  async function confirm(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await post('/api/auth/email-verification/confirm', { otp: code }); await refreshUser(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <div className="mt-5 border-l-2 border-amber-300 pl-3 text-sm">
    <p>Xác minh email trước khi thanh toán: <span className="break-all font-semibold">{user.email}</span></p>
    {error && <p role="alert" className="mt-2 text-rose-300">{error}</p>}
    {sent ? <form onSubmit={confirm} className="mt-3 flex max-w-md flex-wrap items-end gap-2">
      <FormField label="Mã xác nhận email"><input aria-label="Mã xác nhận email" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required className={inputClasses} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ''))} /></FormField>
      <Button disabled={busy || code.length !== 6} type="submit"><Check size={15} /> Xác nhận</Button>
      <Button disabled={busy} variant="ghost" onClick={send}>Gửi lại mã</Button>
    </form> : <Button className="mt-3" disabled={busy} variant="secondary" onClick={send}><Mail size={15} /> Gửi mã xác nhận</Button>}
    {sent && <p role="status" className="mt-2 text-slate-400">Mã đã được gửi tới email, có hiệu lực 10 phút.</p>}
  </div>;
}
