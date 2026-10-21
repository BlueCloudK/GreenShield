-- Migration 003: Email verification OTP table
CREATE TABLE IF NOT EXISTS email_verifications (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL DEFAULT '',
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email, expires_at);
