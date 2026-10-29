export const plans = [
  { id: 'builder_pro', name: 'Builder Pro', amount: 149000, currency: 'VND', tests: 300, projects: 1, members: 1, priority: 0, billing: 'MONTHLY' },
  { id: 'team', name: 'Team', amount: 599000, currency: 'VND', tests: 1500, projects: 5, members: null, priority: 1, billing: 'MONTHLY' },
  { id: 'custom', name: 'Large / Complex Application', amount: null, currency: 'VND', billing: 'CONTACT' },
];

export function nextMonth(value) {
  // Billing follows the customer's Vietnam calendar (UTC+7, no daylight saving).
  const offset = 7 * 60 * 60 * 1000;
  const date = new Date(new Date(value).getTime() + offset);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 1);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return new Date(date.getTime() - offset).toISOString();
}
