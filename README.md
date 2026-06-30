# GreenShield MVP

GreenShield is a demo AI security testing workflow for chatbots, RAG systems, AI agents, and AI-powered APIs.

Core workflow:

```text
Scan -> Detect -> Score -> Report -> Fix -> Retest
```

## Tech stack

- React + Vite
- Tailwind CSS
- React Router
- React Context for demo auth/session
- lucide-react
- Local mock data, structured for later API replacement

## Run locally

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Run with Docker

```bash
docker compose up -d
```

Open:

```text
http://localhost:8080
```

Stop:

```bash
docker compose down
```

Manual build/run:

```bash
docker build -t greenshield-mvp .
docker run --rm -p 8080:80 --name greenshield-mvp greenshield-mvp
```

To view from a phone on the same Wi-Fi/LAN, find the host IPv4:

```powershell
ipconfig
```

Then open:

```text
http://YOUR_IPV4:8080
```

## Demo login

- Email: `admin@example.com`
- Password: `admin123`

Only the dashboard is protected in the MVP. Overview, New Scan, Demo Report, and Pricing remain public for low-friction demos.

## Current MVP screens

- Overview landing page explaining GreenShield and the scan workflow
- Dashboard with scan summary, high-risk findings, retests pending, and recent scans
- New Scan Wizard with app info, target input, risk modules, and confirm step
- Scan Progress mock screen
- Demo Report with risk score, findings, evidence, fix guidance, and retest actions
- Pricing page for scan/report/retest packages

## Mock/demo notes

- No backend scan runner yet.
- No real payment processing.
- Do not enter production secrets into the demo token field.
- Mock scan/finding/pricing data lives in `src/data/scans.js`.
- Demo auth is localStorage-based and not production-ready.

## Backend integration points

- Replace mock scan data with scan/report APIs.
- Persist scan wizard submissions.
- Connect progress state to a real scan runner.
- Store findings, evidence, fix guidance, and retest status server-side.
- Implement report export and authenticated team workspaces.
