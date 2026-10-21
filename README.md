# GreenShield MVP

GreenShield is a functional sales-demo SaaS for testing AI chatbots, RAG endpoints, and agents:

```text
Project -> Target -> Test Connection -> Scan -> Finding -> Fix -> Retest -> Report
```

## Chatbot endpoint evaluator

Open `/app/evaluator` after registering and signing in. Select **Demo fixture**
and run a benchmark to see progress, category scores, latency, a test inspector,
workspace-scoped history and JSON export. The 10/20/30-test suites and deterministic
scoring were adapted from the supplied `ai-chatbot-endpoint-evaluator.zip`.
Fixture results are explicitly marked as simulated and do not prove a model's capabilities.

For an authorized real endpoint, choose **Endpoint thật**, set its public HTTPS
URL, GET/POST method, headers/API key, JSON body with `{{PROMPT}}` and response
path such as `choices[0].message.content`. Messages mode adds a conversation-recall
test. Open-ended answers remain unscored pending semantic review. Benchmark scores
are separate from security risk scores.

Requests use validated, pinned public DNS addresses; redirects, private networks,
unsafe headers and responses over 256 KB are blocked. Secrets are never persisted
in the evaluation configuration and known secret values are masked in evidence.
At most two jobs run per process, one per workspace, with a 90-second run deadline.
Interrupted runs are failed on restart; this is a single-process demo worker,
not a distributed benchmark queue. Real endpoint requests may incur provider costs.

The integration adds no Next.js, UI kit or new runtime dependencies. Run
`npm run dev:full` locally; deploy both frontend and API to make it available live.

## Stack

- React, Vite, Tailwind CSS, React Router
- Express API with HttpOnly cookie sessions
- SQLite through `better-sqlite3` locally, or Postgres through `pg` when `DATABASE_URL` is set
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

For Supabase, set `DATABASE_URL` to the **Session pooler** connection URI from
the project's Connect dialog, including the database password. Keep
`DATABASE_SSL=true`; TLS certificate verification is enabled. The backend uses
the private `greenshield` schema, not browser-accessible Data API tables.
Without `DATABASE_URL`, local SQLite continues to work. Node.js 22 is required
for the provided local scripts and Docker images.

## Verification

```bash
npm test
npm run build
npm run demo:record
```

The product-flow test can also run against a disposable Postgres database:

```bash
docker run --name greenshield-pg-verification -e POSTGRES_PASSWORD=greenshield-integration-only -e POSTGRES_DB=greenshield -p 127.0.0.1:15433:5432 -d postgres:17-alpine
npx cross-env TEST_DATABASE_URL=postgresql://postgres:greenshield-integration-only@127.0.0.1:15433/greenshield DATABASE_SSL=false node --test test/product-flow.test.js
```

Use the password and disabled TLS above only for that localhost verification
container. The test creates its own account, project, scan and retest data.

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
Keep `PAYOS_ENABLED=false` until live integration testing is explicitly approved.
The local sample price is 2000 VND, labelled as a sample rather than a final quote.
Enter keys in the ignored `.env.payos.local`, then run `npm run payments:check`:
the check reveals only whether each key exists and makes no PayOS request.
`npm run build` and `npm run dev:payments` serve the isolated local preview at
`http://127.0.0.1:3102/app/billing`. OTP and payments support both SQLite and
Postgres; existing accounts can verify email on the billing page.
Production activation requires both `PAYOS_ENABLED=true` and
`PAYOS_PRODUCTION_APPROVED=true`, plus valid server keys and an HTTPS origin.
Keep both flags off unless the owner has approved the rollout. See [docs/PAYOS.md](docs/PAYOS.md).

## Deployment

The deployed application is available at https://www.greenshieldai.tech.
It uses Vercel for the frontend, EC2 for the API/scan worker and Supabase Postgres.
See [docs/AWS_DEPLOYMENT.md](docs/AWS_DEPLOYMENT.md) for infrastructure, secrets,
restart instructions and deployment verification.

The current Docker image needs a host with persistent storage for SQLite.
Vercel can host the frontend while an EC2 host runs Express and the scan worker.
Hosting the entire application on Vercel instead would also require compatible
database storage and a redesign of background scan execution.

See [docs/DEMO_GUIDE.md](docs/DEMO_GUIDE.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## EXE201 Outcome 1

The [OC1 GreenShield dossier](docs/OC1_GREENSHIELD.md) maps the product to tasks 1.1-1.10 and lists the evidence still required before submission.
