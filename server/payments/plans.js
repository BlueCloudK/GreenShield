export const subscriptionPlans = [
  { id: 'builder', name: 'Builder', amount: 300000, applications: 1, tests: 300, members: 1 },
  { id: 'team', name: 'Team', amount: 600000, applications: 5, tests: 1500, members: 5 },
  { id: 'scale', name: 'Scale', amount: 900000, applications: 10, tests: 3000, members: 10 },
];

export function addMonth(value) {
  const offset = 7 * 60 * 60 * 1000;
  const date = new Date(new Date(value).getTime() + offset);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 1);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return new Date(date.getTime() - offset).toISOString();
}
