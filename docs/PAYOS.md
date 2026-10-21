# PayOS Integration

## Current Boundary

- Merges `origin/feature/otp` through `c44161b` with the preserved Postgres/evaluator backend.
- Real SDK adapter is implemented; disabled by default. No real transactions tested.
- The owner now has a PayOS channel and keys; key values are never collected in chat.
- OTP and payments use the async SQLite/Postgres adapter. Postgres transaction
  locks serialize OTP consumption, checkout reservation and receipt application.
  The new tables have RLS enabled and Data API roles revoked during migration.
- Payments and OTP were tested on disposable local Postgres, not the live Supabase DB.
- This is not a durable multi-process payment/reconciliation queue.
- Orders are assessment purchases, not recurring subscriptions. A receipt does
  not automatically grant scan quota or confirm service fulfilment.

## Setup After Bank Approval

1. Enter `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, and `PAYOS_CHECKSUM_KEY` in the ignored
   backend `.env.payos.local`. It is ignored by Git and protected for the local
   Windows account. Never use `VITE_` prefixes or paste secrets into chat/logs.
2. Set `PAYOS_ASSESSMENT_AMOUNT_VND` to an approved integer VND amount (2000 to
   100000000), and `PAYOS_PUBLIC_ORIGIN` to the actual frontend origin. There is
   a user-approved sample price of 2000 VND in the local configuration, explicitly
   labelled by `PAYOS_PRICE_IS_SAMPLE=true`. This is not the final selling price.
3. Keep `PAYOS_ENABLED=false` until an explicit integration-test authorization.
   PayOS has no sandbox; enabling this adapter uses the live merchant API.
4. For a separately authorized non-production live test, use a bank/channel that
   the owner has approved, a small approved amount, and an HTTPS public origin.
   Register the webhook below in the payOS channel dashboard. The account owner
   must perform any actual bank transfer; automated tests must never do so.
5. `NODE_ENV=production` with payments enabled fails closed even with valid keys.
   Production activation requires a separate approved change, not an env toggle.

Official references:
- https://payos.vn/docs/sdks/back-end/node/
- https://payos.vn/docs/moi-truong-test/

## Local Preview Without Live Requests

The prepared `.env.payos.local` pins an isolated local SQLite database and port
3102, with `PAYOS_ENABLED=false`. It does not use `.env.deploy` or the live DB.

```bash
npm run payments:check
npm run build
npm run dev:payments
```

Open `http://127.0.0.1:3102/app/billing`. `payments:check` prints only whether
each key exists, never its value, and makes no provider request. Configure Gmail
`SMTP_USER` / app password `SMTP_PASS` locally if email verification is needed.
Do not enable payment creation merely to check that keys were entered correctly.

## API

Authenticated workspace endpoints:
- `GET /api/payments/config`: enabled flag and server product/price, no secrets.
- `GET /api/payments/orders`: latest 50 orders in the current workspace.
- `GET /api/payments/orders/:id`: workspace-scoped persisted order.
- `POST /api/payments/orders`: `{ "productId": "assessment" }` plus a stable
  `Idempotency-Key` header (16-80 alphanumeric, underscore or hyphen characters).
  Only verified email users with OWNER/ADMIN role can create or mutate orders.
  The server rejects client-supplied amount and callback URL fields.
- `POST /api/payments/orders/:id/refresh`: query PayOS, validate ID/code/amount,
  and apply the provider status. Never use URL status parameters as evidence.
- `POST /api/payments/orders/:id/cancel`: cancel with PayOS then reconcile.

Unauthenticated provider endpoint:
- `POST /api/payments/webhook`: verify signature using the official SDK, check
  order code/link ID/amount and re-fetch provider status. Unknown signed orders
  (including channel verification samples) are acknowledged without fulfilment.
  A PAID transition and its unique receipt are committed in one DB transaction.

## Failure Recovery

- `UNKNOWN` means link creation may have succeeded remotely. Reuse the same
  idempotency key and refresh/cancel the existing order; do not create a second
  order merely because the request timed out. No automatic create retries.
- If a create succeeded but its response was lost, refresh can recover the link
  ID/status. PayOS GET does not supply a checkout URL: the UI does not fabricate
  one. Investigate in the merchant dashboard or cancel before a new purchase.
- Do not downgrade PAID on delayed pending/cancelled callbacks.
- A failed webhook reconciliation returns non-2xx so it can be retried.
- Poll/refresh after bank payment if webhook delivery is delayed. A durable
  reconciliation worker and production monitoring are still rollout work.
- Existing accounts are not silently marked verified. The billing page supports
  authenticated email verification via `/api/auth/email-verification/send` and
  `/api/auth/email-verification/confirm`. Codes are bound to the session's account
  and a separate purpose, and cannot be reused to register a different account.

## Verification

`npm test` covers OTP verification, direct signup bypass, resend limits, official
signature verification with local test keys, forged/mismatched webhooks,
idempotent creation, timeout recovery, duplicate receipt prevention, role and
workspace boundaries, cancellation and the existing scan/retest flow.

Run `npm run build` for the React build. No production deploy or real provider
request is part of these checks.

Postgres integration checks use a disposable local database, not production:

```bash
docker run --name greenshield-payos-verification -e POSTGRES_PASSWORD=local-test-only-not-production -e POSTGRES_DB=greenshield -p 127.0.0.1:15434:5432 -d postgres:17-alpine
npx cross-env TEST_DATABASE_URL=postgresql://postgres:local-test-only-not-production@127.0.0.1:15434/greenshield DATABASE_SSL=false node --test --test-concurrency=1 test/payments.test.js test/otp.test.js test/product-flow.test.js
```

Disable TLS only for this isolated localhost test database. Existing live smoke
scripts now seed temporary accounts through their configured admin DB connection,
then test normal login; they do not bypass OTP through a public endpoint. Run them
only after an approved deployment, with a DB configuration matching that server.
