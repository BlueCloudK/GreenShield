# Product UI Components

Use 8px cards, compact section headers, dense list rows, status badges, and list-detail inspectors. Reserve cards for grouped tools or repeated records. Product pages use a fixed sidebar on desktop and a drawer on mobile.

## 2026-10-07 endpoint evaluator

Reuse ProductLayout, Button and FormField. Use a compact configuration form,
four benchmark metrics and a table/inspector split; keep benchmark scores separate
from security risk scores. Mark deterministic fixture results explicitly as demo.

Billing uses unframed offer and history sections, an overflow-contained table on
mobile, explicit pending/unknown/paid/cancelled states, and existing Button and
lucide controls. An unavailable provider disables checkout, not just its styling.

## 2026-10-29 subscriptions

Keep plan selection in the signed-in workbench: sidebar entry, compact usage
banner, monthly plan radio controls, payment return status and order history.
Public pricing and checkout read the same server catalog. Team membership uses
the existing form/table controls. Never display a successful entitlement based
only on redirect parameters. Real endpoints are the production default; preserve
explicit classification on historical simulated reports.
