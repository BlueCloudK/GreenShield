# AGENTS.md

## Project rules

- Use the existing project stack if available.
- Do not rewrite the whole project unless necessary.
- Keep components small and readable.
- Prefer Tailwind CSS for styling if installed.
- Do not add heavy dependencies without explaining why.
- Use mock data for demo features unless a backend already exists.
- Never implement real payment processing in this demo.
- Run lint/build/test scripts when available before finishing.
- Update README with setup and run instructions.

## GreenShield MVP report rules

- Emphasize only four main report metrics: Risk Score, Risk Level, Findings, and Retest Status.
- Keep scan metadata compact: app name, app type, environment, scan status, scan date, and retest status.
- Use compact sections for risk modules, findings table, finding details, fix guidance, and retest checklist.
- Findings table should only include: Finding, Severity, Category, Evidence, Status, Retest, and Action.
- Reports should tell a security story: what happened, why it matters, what to fix first, concrete attack evidence, product impact, next action, and retest path.
- Report UIs must be space-efficient: avoid spreading small amounts of information across large cards, avoid duplicated summary blocks, and prefer inspector/workbench layouts for list-detail reading.
- Do not add unrelated analytics, fake enterprise dashboards, compliance pages, or excessive charts.
- Mask secrets and sensitive values in report evidence, such as API keys, tokens, emails, and bearer values.
