PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  company TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  target_type TEXT NOT NULL,
  environment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
);

CREATE TABLE IF NOT EXISTS targets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  base_url TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'POST',
  headers_json TEXT NOT NULL DEFAULT '{}',
  credential_ciphertext TEXT,
  request_template_json TEXT NOT NULL DEFAULT '{"prompt":"{{prompt}}"}',
  prompt_field TEXT NOT NULL DEFAULT 'prompt',
  response_field TEXT NOT NULL DEFAULT 'message',
  timeout_ms INTEGER NOT NULL DEFAULT 8000,
  config_json TEXT NOT NULL DEFAULT '{}',
  last_connection_status TEXT NOT NULL DEFAULT 'NOT_TESTED',
  last_connection_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('QUEUED','RUNNING','COMPLETED','FAILED','CANCELLED')),
  risk_score INTEGER,
  risk_level TEXT,
  total_tests INTEGER NOT NULL DEFAULT 0,
  completed_tests INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scan_configurations (
  scan_id TEXT PRIMARY KEY REFERENCES scans(id) ON DELETE CASCADE,
  test_ids_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS test_executions (
  id TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  security_test_id TEXT NOT NULL,
  test_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING','RUNNING','PASSED','FAILED','SUSPICIOUS','ERROR')),
  request_json TEXT,
  response_json TEXT,
  extracted_evidence TEXT,
  duration_ms INTEGER,
  error_message TEXT,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS findings (
  id TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  test_execution_id TEXT NOT NULL REFERENCES test_executions(id) ON DELETE CASCADE,
  security_test_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  description TEXT NOT NULL,
  impact TEXT NOT NULL,
  explanation TEXT NOT NULL,
  retest_status TEXT NOT NULL DEFAULT 'OPEN',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS finding_evidence (
  id TEXT PRIMARY KEY,
  finding_id TEXT NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  test_input TEXT NOT NULL,
  target_response TEXT NOT NULL,
  extracted_evidence TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS finding_recommendations (
  finding_id TEXT PRIMARY KEY REFERENCES findings(id) ON DELETE CASCADE,
  problem TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  mitigation TEXT NOT NULL,
  implementation_guidance TEXT NOT NULL,
  validation_criteria TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS retests (
  id TEXT PRIMARY KEY,
  finding_id TEXT NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  execution_id TEXT REFERENCES test_executions(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('RETESTING','FIXED','STILL_VULNERABLE','ERROR')),
  previous_evidence TEXT,
  new_evidence TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL UNIQUE REFERENCES scans(id) ON DELETE CASCADE,
  generated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_project ON scans(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_scan ON test_executions(scan_id, created_at);
CREATE INDEX IF NOT EXISTS idx_findings_scan ON findings(scan_id, severity);
CREATE INDEX IF NOT EXISTS idx_retests_finding ON retests(finding_id, created_at DESC);

