ALTER TABLE greenshield.endpoint_evaluations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE greenshield.endpoint_evaluations FROM PUBLIC, anon, authenticated;
