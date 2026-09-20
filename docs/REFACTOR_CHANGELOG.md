# Refactor Changelog

- Replaced localStorage authentication with bcrypt users and HttpOnly sessions.
- Replaced mock timers with persisted executions and actual target requests.
- Added SQLite migrations, workspace checks, evidence, recommendations, reports, and retests.
- Added a deterministic vulnerable/fixed demo target and external HTTPS target form.
- Rebuilt navigation around dashboard, projects, targets, scans, and reports.
- Consolidated reports into a compact finding list and detail inspector.
- Replaced static nginx packaging with a Node container serving API and SPA.
