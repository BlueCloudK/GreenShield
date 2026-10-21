# GreenShield AWS deployment

## Deployment state

The selected architecture is Vercel frontend, AWS EC2 API/scan worker, and
Supabase Postgres. The application supports async SQLite locally and Postgres
through `DATABASE_URL`. Server provisioning does not imply the public app
deployment is complete.

Supabase project `GreenShield` (`ymyggxbprudvaddxyari`) has been provisioned in
Singapore in the selected organization. The connector quoted USD 0/month and
the project was verified as `ACTIVE_HEALTHY`. The 17 application tables have been
created in the private `greenshield` schema, with RLS enabled and access revoked
from public Data API roles. The backend connection URI still needs configuration
before using it for live data. It has now been configured and verified.

Provisioned on 2026-10-02 (Asia/Ho_Chi_Minh):

| Resource | Value |
| --- | --- |
| AWS region | `ap-southeast-1` (Singapore) |
| EC2 instance | `i-093eb57498c68467b` |
| Name | `greenshield-api` |
| Instance type | `t3.micro` (2 vCPU, 1 GiB RAM) |
| OS | Canonical Ubuntu 24.04 LTS, x86_64 |
| Root volume | 20 GiB encrypted gp3, retained on termination |
| Public IPv4 at provisioning | `13.212.14.6` |
| Security group | `sg-07f2f73e7c6ba669a` |
| Management | Systems Manager; no inbound SSH |
| Instance profile | `GreenShieldEc2Profile` |

The public IPv4 is automatically assigned and can change after stop/start.
Inbound ports 80 and 443 are allowed. Application port 3000 is not exposed.
The instance uses standard CPU credits to avoid unlimited-mode surplus charges.
Bootstrap installs Docker, Git, curl, the SSM agent and 2 GiB swap.

The API Docker image `greenshield-api:postgres` has been built on EC2. Caddy is
running with a verified HTTPS certificate for
`greenshield.47.128.150.181.sslip.io` after the 2026-10-07 restart. This is an API-only hostname: `/` returns 404
and `/api/health` checks the running API and its database connection.

Production frontend: https://www.greenshieldai.tech.
Vercel project: `thanhkiennk-8500s-projects/green-shield`.
Deployment `dpl_7MQ417uJ1v4pLDDn1wGV6cLxuuN4` was verified READY on 2026-10-07.
Live verification passed registration/login with Secure HttpOnly cookies, a
completed demo scan, evidence/report retrieval, fixed retest, cross-workspace
access rejection and SPA route refresh. The temporary test accounts were removed.

The AWS account reported an active FREE plan with USD 100 remaining credit and
an expiry of 2027-04-01T16:00:57Z at provisioning. Compute, disk and public IPv4
consume credit; this is not a permanent zero-cost VM. Recheck billing before
changing resources or upgrading the account plan.

### Baseline cost estimate

AWS Price List API rates checked on 2026-10-02 for Singapore:

| Item | Rate | 30-day estimate |
| --- | --- | --- |
| Linux shared `t3.micro` | USD 0.0132/hour | USD 9.504 |
| One in-use public IPv4 | USD 0.005/hour | USD 3.60 |
| Default-performance gp3, 20 GiB | USD 0.096/GB-month | USD 1.92 |
| Total, running 24 hours/day | | USD 15.024 |
| Total, stopped all month | | USD 1.92 |

These are baseline list-price estimates before applicable allowances, taxes,
network egress, snapshots or additional services. No Elastic IP has been
allocated: stop releases the automatically assigned public address.
With two running hours per day the same baseline is about USD 3.012/month.
The account plan expiry applies even if credits have not been exhausted.
There is no automatic stop schedule configured.

## API runtime

The API image is built with `deploy/Dockerfile.api`. It does not include the
frontend, local data or environment files. Configure a root-owned mode-0600 file
at `/opt/greenshield/runtime.env` containing:

```dotenv
DATABASE_URL=postgresql://...Session-pooler-URI...
DATABASE_SSL=true
DATABASE_SSL_CA=/app/server/db/certs/supabase-root-2021.crt
SECRET_ENCRYPTION_KEY=...random-secret...
INTERNAL_DEMO_TOKEN=...different-random-secret...
```

Run `sh /opt/greenshield/source/deploy/start-api.sh`. The API listens only on the
host loopback interface and the container restarts automatically. Caddy proxies
the `/api/` path over HTTPS using the hostname in `deploy/Caddyfile`.
`vercel.json` forwards same-origin `/api` requests to that hostname so login
cookies remain first-party. Update the hostname in both files after an EC2
stop/start changes the automatically assigned public IP.

This deployment supports one API/scan-worker process. On restart interrupted
scan/retest work becomes failed/error and can be retried; jobs are not silently
marked successful. This is not a multi-worker durable queue.

## Access and verification

Use AWS Console -> EC2 -> select the instance -> Connect -> Session Manager.
With an authenticated AWS CLI and Session Manager plugin:

```bash
aws ssm start-session --region ap-southeast-1 --target i-093eb57498c68467b
```

On the VM:

```bash
sudo cloud-init status --wait
sudo systemctl status docker
sudo docker version
sudo test -f /opt/greenshield/bootstrap-complete
free -h
```

## Deploying an update

1. Supply the Supabase Session pooler connection URI in the ignored `.env.deploy`.
2. Transfer database credentials through a protected runtime environment file.
3. Run the already-built API container with automatic restart and a health check.
4. Verify the HTTPS reverse proxy can reach the running API.
5. Authenticate Vercel CLI, link the correct project and deploy the frontend with
   the `/api` rewrites in `vercel.json`, preserving same-origin cookies.
6. Verify registration, login, workspace isolation, scan, report and retest.

From the local checkout, with the ignored `.env.deploy` configured:

```bash
npx vercel deploy --prod --yes --scope thanhkiennk-8500s-projects
node --env-file=.env.deploy scripts/verify-deployment.mjs https://www.greenshieldai.tech
```

Verification creates disposable accounts and cleans up only those accounts and
their workspaces. Backend changes require rebuilding the EC2 image separately;
a Vercel frontend deploy does not update the API container.

The endpoint evaluator was deployed to both API and frontend on 2026-10-07.
Its table is created by application migration `003_endpoint_evaluations.sql`.
Apply `deploy/endpoint-evaluations-security.sql` to Supabase after that migration
to retain the private-schema security model: RLS enabled, no direct Data API
role access. The backend checks workspace ownership on every evaluation request.

Do not put database passwords or encryption keys in Git, EC2 user data or this
document. Keep application data during updates and use migrations deliberately.

Runtime configuration is stored in the standard-tier SSM SecureString parameter
`/greenshield/api/runtime`. The instance role can read only that parameter.
Provisioning resolves it on the VM into the root-only runtime file; it is never
included in SSM shell commands or frontend uploads. The bundled Supabase root CA
comes from `https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt`.
TLS certificate and hostname verification remain enabled.

## Stop/start

```bash
aws ec2 stop-instances --region ap-southeast-1 --instance-ids i-093eb57498c68467b
aws ec2 start-instances --region ap-southeast-1 --instance-ids i-093eb57498c68467b
```

Stopping ends instance compute use, but retained disks and other allocated
resources can still consume credit. Termination retains the root disk by design;
inspect retained data before deciding whether to delete it.
