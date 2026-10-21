import { createApp } from "./app.js";

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";
const app = await createApp({ origin: process.env.APP_ORIGIN || `http://127.0.0.1:${port}` });

const server = app.listen(port, host, () => {
  console.log(JSON.stringify({ level: "info", message: "GreenShield server started", host, port }));
});

let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  const deadline = setTimeout(() => process.exit(1), 30_000);
  deadline.unref();
  app.locals.shuttingDown = true;
  await app.locals.scans.drain();
  await app.locals.evaluator.drain();
  await new Promise((resolve) => server.close(resolve));
  await app.locals.db.close();
  clearTimeout(deadline);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
