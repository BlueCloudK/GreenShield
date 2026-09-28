CREATE TABLE IF NOT EXISTS contact_requests (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_requests_email_created
  ON contact_requests(email, created_at DESC);
