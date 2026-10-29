import { pricingPlans } from '../data/scans';
import { useApiResource } from './useApiResource';

export function usePricingPlans() {
  const { data } = useApiResource('/api/payments/catalog');
  return pricingPlans.map(plan => {
    const live = data?.plans?.find(item => item.id === plan.id);
    return !live || live.amount == null ? plan : {
      ...plan,
      price: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(live.amount),
      applicationLimit: String(live.projects),
      testQuota: `${live.tests.toLocaleString('vi-VN')} / tháng`,
    };
  });
}
