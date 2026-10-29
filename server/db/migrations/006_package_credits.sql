ALTER TABLE payment_orders ADD COLUMN plan_key TEXT;
ALTER TABLE payment_orders ADD COLUMN test_allowance INTEGER;
ALTER TABLE payment_orders ADD COLUMN project_allowance INTEGER;
ALTER TABLE payment_orders ADD COLUMN member_allowance INTEGER;
ALTER TABLE payment_orders ADD COLUMN processing_priority INTEGER;
ALTER TABLE users ADD COLUMN active_workspace_id TEXT;
ALTER TABLE endpoint_evaluations ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL;

CREATE TABLE subscription_periods (
  order_id TEXT PRIMARY KEY REFERENCES payment_orders(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  plan_key TEXT NOT NULL,
  test_allowance INTEGER NOT NULL CHECK (test_allowance > 0),
  project_allowance INTEGER NOT NULL CHECK (project_allowance > 0),
  member_allowance INTEGER CHECK (member_allowance IS NULL OR member_allowance > 0),
  processing_priority INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX subscription_periods_workspace ON subscription_periods(workspace_id,starts_at,ends_at);

CREATE TABLE package_usage (
  resource_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES subscription_periods(order_id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('scan', 'retest')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TEXT NOT NULL,
  refunded_at TEXT
);
