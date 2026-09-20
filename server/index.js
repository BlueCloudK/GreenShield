import { createApp } from "./app.js";

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";
const app = createApp({ origin: process.env.APP_ORIGIN || `http://127.0.0.1:${port}` });

app.listen(port, host, () => {
  console.log(JSON.stringify({ level: "info", message: "GreenShield server started", host, port }));
});

