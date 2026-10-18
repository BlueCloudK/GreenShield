ALTER TABLE users ADD COLUMN email_verified_at TEXT;

CREATE TABLE payment_orders (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL REFERENCES users(id),
  idempotency_key TEXT NOT NULL,
  order_code INTEGER NOT NULL UNIQUE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'VND',
  status TEXT NOT NULL CHECK (status IN ('CREATING','PENDING','UNKNOWN','PAID','CANCELLED','EXPIRED')),
  payment_link_id TEXT UNIQUE,
  checkout_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  paid_at TEXT,
  UNIQUE(workspace_id, idempotency_key)
);
CREATE INDEX payment_orders_workspace_created ON payment_orders(workspace_id, created_at);

CREATE TABLE payment_receipts (
  order_id TEXT PRIMARY KEY REFERENCES payment_orders(id) ON DELETE CASCADE,
  provider_reference TEXT NOT NULL,
  amount INTEGER NOT NULL,
  paid_at TEXT NOT NULL
);
