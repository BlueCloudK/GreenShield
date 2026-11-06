CREATE TABLE subscription_periods (
  order_id TEXT PRIMARY KEY REFERENCES payment_orders(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  applications INTEGER NOT NULL,
  tests INTEGER NOT NULL,
  members INTEGER NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX subscription_periods_workspace ON subscription_periods(workspace_id, starts_at, ends_at);
ALTER TABLE payment_orders ADD COLUMN applications INTEGER;
ALTER TABLE payment_orders ADD COLUMN test_allowance INTEGER;
ALTER TABLE payment_orders ADD COLUMN member_allowance INTEGER;

