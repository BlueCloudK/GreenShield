# GreenShield MVP

GreenShield is a functional sales-demo SaaS for testing AI chatbots, RAG endpoints, and agents:

```text
Project -> Target -> Test Connection -> Scan -> Finding -> Fix -> Retest -> Report
```

## Stack

- React, Vite, Tailwind CSS, React Router
- Express API with HttpOnly cookie sessions
- SQLite through `better-sqlite3`
- Deterministic security-test registry and scan worker

## Run locally

```bash
npm install
npm run db:migrate
npm run dev:full
```

Open `http://127.0.0.1:5173`, register, then log in. Vite proxies `/api` to port `3000`.

Registration now requires email OTP. Configure `SMTP_USER` and `SMTP_PASS` in
the ignored `.env`; the direct registration API is disabled. OTP send history
is retained so resending or exhausting attempts does not bypass the send limit.

## Run with Docker

```bash
docker compose up --build
```

Open `http://127.0.0.1:8080`. SQLite data persists in the `greenshield-data` volume.

## Environment

Copy `.env.example` to `.env` for non-demo deployment and replace both secret values. `SECRET_ENCRYPTION_KEY` encrypts target credentials at rest. Never commit production tokens.

## Verification

```bash
npm test
npm run build
npm run demo:record
```

## What is real

- Registration, password hashing, login sessions, and workspace isolation
- Project and target persistence
- HTTP connection checks with timeout, response-size, redirect, and private-network restrictions
- Four executable tests, persisted executions, evidence, scoring, retest history, and reports
- Contact requests stored in SQLite, with basic validation and duplicate-submit throttling

Contact requests are stored in the `contact_requests` table. The current MVP does not send email notifications; the team must monitor requests in the database.

## What is simulated

- The included vulnerable/fixed target is controlled demo infrastructure.
- Detection uses explicit deterministic rules, not an LLM judge.
- PDF export uses the browser print dialog.
- Invitations and production queues are not implemented.

## PayOS (Disabled By Default)

The real PayOS adapter uses `@payos/node` 2.0.5. `/app/billing` contains checkout
and workspace-scoped order history. Prices come only from server configuration.
The public redirect cannot mark an order paid; verified webhook processing also
checks the provider's authoritative order status. Payment receipts are applied
once, including when webhooks repeat or a create request times out.

PayOS has no separate sandbox. No real PayOS calls are made by `npm test`:
provider requests are stubbed while webhook signatures use the official SDK.
Keep `PAYOS_ENABLED=false` while waiting for the bank/channel and approved price.
The adapter refuses activation with `NODE_ENV=production` until a separately
approved production rollout changes that guard. See [docs/PAYOS.md](docs/PAYOS.md).

## Deployment

Deploy the Docker image to a host with persistent storage. Static Vercel hosting is no longer sufficient because the product requires Express and SQLite. A Vercel deployment first needs Postgres/serverless storage and a serverless API adapter.

See [docs/DEMO_GUIDE.md](docs/DEMO_GUIDE.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## EXE201 Outcome 1

The [OC1 GreenShield dossier](docs/OC1_GREENSHIELD.md) maps the product to tasks 1.1-1.10 and lists the evidence still required before submission.
