# Record the GreenShield demo

This project includes a Playwright-based recorder for a customer-facing GreenShield product demo.

## Prerequisites

Run the app first:

```bash
docker compose up -d --build
```

Install dependencies:

```bash
npm install
```

## Record

```bash
npm run demo:record
```

The recorder uses:

```bash
APP_URL=http://127.0.0.1:8080
```

Override it when needed:

```bash
APP_URL=http://127.0.0.1:5173 npm run demo:record
```

## Output

The raw video is saved to:

```txt
artifacts/demo/greenshield-demo.webm
```

If `ffmpeg` is available and `--mp4` is passed, the script also creates:

```txt
artifacts/demo/greenshield-demo.mp4
```

```bash
npm run demo:record -- --mp4
```

## What the recorder adds

- Fixed 1440x900 viewport
- Smooth fake cursor overlay
- Click pulse effect
- Caption overlay for each scene
- Deterministic product flow
- No browser address bar in the recording
