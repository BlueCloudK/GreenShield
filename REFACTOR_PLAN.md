# GreenShield Product Refactor Plan

## Audit summary

The repository is currently a React/Vite sales prototype. Authentication, scan progress,
findings, scores, and reports are all produced in the browser from static arrays or
`localStorage`. There is no backend, database, scanner, target connection, execution
history, or functional retest path.

## Keep

- React, Vite, Tailwind CSS, React Router, and lucide-react.
- Existing brand assets, public marketing pages, typography, color tokens, and small UI
  primitives where they remain useful.
- The compact list/detail report interaction and secret-masking utility.
- Docker and Vercel configuration as deployment references, updated for the new runtime.

## Rewrite

- Browser-only authentication becomes API authentication with hashed passwords and an
  HttpOnly session cookie.
- Static scan/finding data becomes a SQLite domain model accessed through services.
- The scan wizard becomes project and target setup followed by a persisted scan.
- Fake progress becomes completed-test progress from persisted test executions.
- Report and retest actions become API-backed and traceable to executions.
- Authenticated navigation becomes a product shell centered on projects and scans.

## Remove after migration

- `src/data/scans.js` mock scan and finding records.
- `localStorage` user/password persistence.
- Frontend timers or navigation that imply a scan completed without execution.
- Old pricing quota assumptions from product logic. Public pricing remains informational.

## Target architecture

```text
React application
  -> same-origin REST API
Express API
  -> domain services
  -> scan worker
  -> security-test registry
  -> target client / secret provider
  -> SQLite repositories and migrations

Included demo target
  -> vulnerable mode
  -> fixed mode
```

The worker is in-process for the MVP. Scan and execution state are persisted, so progress
is real even though job recovery after a process crash is deferred.

## Migration sequence

1. Add migrations, repositories, authentication, and workspace isolation.
2. Add projects, targets, connection testing, and audit events.
3. Add the test registry, target client, scanner, deterministic scoring, and findings.
4. Add functional retest and report projection.
5. Replace frontend mock reads with API calls and real state transitions.
6. Add critical-path tests, Docker runtime, setup documentation, and browser QA.

