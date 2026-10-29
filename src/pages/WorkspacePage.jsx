import { useState } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApiResource } from '../hooks/useApiResource';
import { api, post } from '../lib/api';
import { Button } from '../components/ui/Button';
import { inputClasses } from '../components/ui/FormField';

export default function WorkspacePage() {
  const { user } = useAuth();
  const members = useApiResource('/api/workspaces/members');
  const spaces = useApiResource('/api/workspaces');
  const billing = useApiResource('/api/payments/config');
  const [email, setEmail] = useState(''), [role, setRole] = useState('MEMBER');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const owner = user.workspace.role === 'OWNER';
  const manager = ['OWNER', 'ADMIN'].includes(user.workspace.role);
  async function act(operation) {
    setBusy(true); setError('');
    try { await operation(); await members.reload(); } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
    <h1 className="text-2xl font-bold">Workspace và thành viên</h1>
    <div className="mt-6 max-w-lg"><label htmlFor="workspace-switch" className="text-sm text-slate-400">Workspace đang làm việc</label>
      <select id="workspace-switch" className={`${inputClasses} mt-2`} value={user.workspace.id} disabled={busy || !spaces.data} onChange={e => act(async () => { await post('/api/workspaces/switch', { workspaceId: e.target.value }); window.location.assign('/app'); })}>
        {(spaces.data?.workspaces || [user.workspace]).map(space => <option key={space.id} value={space.id}>{space.name} · {space.role}</option>)}
      </select>
    </div>
    {(error || members.error || spaces.error || billing.error) && <p role="alert" className="mt-4 text-sm text-rose-300">{error || members.error || spaces.error || billing.error}</p>}
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3"><h2 className="font-semibold">Thành viên</h2><Button to="/app/billing" variant="secondary">Quản lý gói</Button></div>
    {manager && billing.data?.usage.active?.plan_key === 'team' && <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); act(async () => { await post('/api/workspaces/members', { email, role }); setEmail(''); }); }}>
      <div className="min-w-0 flex-1"><label htmlFor="member-email" className="text-sm text-slate-400">Email thành viên đã có tài khoản GreenShield</label><input id="member-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className={`${inputClasses} mt-2`} /></div>
      <select aria-label="Vai trò thành viên mới" value={role} onChange={e => setRole(e.target.value)} className={`${inputClasses} !w-auto`} disabled={!owner || busy}><option value="MEMBER">Thành viên</option>{owner && <option value="ADMIN">Quản trị viên</option>}</select>
      <Button type="submit" disabled={busy}><UserPlus size={16} /> Thêm thành viên</Button>
    </form>}
    {manager && billing.data && billing.data.usage.active?.plan_key !== 'team' && <p className="mt-4 text-sm text-slate-400">Gói Team hỗ trợ thêm thành viên vào workspace dùng chung.</p>}
    {!members.data ? <p className="mt-4 text-sm text-slate-400">Đang tải thành viên…</p> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-y border-white/10 text-slate-400"><tr><th className="p-3">Thành viên</th><th className="p-3">Vai trò</th><th className="p-3">Thao tác</th></tr></thead><tbody>
      {members.data.members.map(member => <tr key={member.id} className="border-b border-white/10"><td className="p-3"><p className="font-medium">{member.name}</p><p className="mt-1 text-xs text-slate-400">{member.email}</p></td><td className="p-3">{owner && member.role !== 'OWNER' ? <select aria-label={`Vai trò ${member.name}`} className={inputClasses} disabled={busy} value={member.role} onChange={e => act(() => api(`/api/workspaces/members/${member.id}`, { method: 'PATCH', body: JSON.stringify({ role: e.target.value }) }))}><option value="MEMBER">Thành viên</option><option value="ADMIN">Quản trị viên</option></select> : { OWNER: 'Chủ workspace', ADMIN: 'Quản trị viên', MEMBER: 'Thành viên' }[member.role]}</td><td className="p-3">{manager && member.role !== 'OWNER' && (owner || member.role === 'MEMBER') && <Button variant="ghost" disabled={busy} title="Gỡ thành viên" aria-label={`Gỡ ${member.name}`} onClick={() => { if (window.confirm(`Gỡ ${member.name} khỏi workspace?`)) act(() => api(`/api/workspaces/members/${member.id}`, { method: 'DELETE' })); }}><UserMinus size={16} /></Button>}</td></tr>)}
    </tbody></table></div>}
  </section>;
}
