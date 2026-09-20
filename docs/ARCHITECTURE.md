# Architecture

```text
React SPA -> Express API -> SQLite
                   |-> scan worker
                   |-> test registry
                   |-> target client -> demo or external HTTPS target
```

The API owns authentication, authorization, persistence, scan execution, scoring, findings, retests, and reports. The frontend renders server state and never fabricates progress or findings.

- `src/`: product and marketing UI.
- `server/app.js`: routes and workspace authorization.
- `server/services/scan-service.js`: scan/retest lifecycle.
- `server/security/`: tests, scoring, target client, secret encryption, and demo target.
- `server/db/`: SQLite setup and migrations.

The worker runs in-process for one sales-demo instance. Production should use a durable queue and Postgres.
