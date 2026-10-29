import { CreditCard } from 'lucide-react';
import { useApiResource } from '../../hooks/useApiResource';
import { Button } from '../ui/Button';

export function UsageBanner() {
  const { data, error } = useApiResource('/api/payments/config');
  return <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-white/10 py-4">
    <div className="min-w-0 text-sm">
      <p className="font-semibold text-white">{data?.usage?.active ? `Gói ${data.usage.active.plan_key === 'team' ? 'Team' : 'Builder Pro'}` : 'Chưa có gói còn hiệu lực'}</p>
      <p className="mt-1 text-slate-400">{data?.usage
        ? `${data.usage.testsRemaining} bài kiểm thử còn lại trong kỳ`
        : error || 'Đang tải quyền sử dụng…'}</p>
    </div>
    <Button to="/app/billing" variant="secondary"><CreditCard size={16} /> Gói sử dụng</Button>
  </div>;
}
