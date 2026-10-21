import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../server/app.js";

test("contact form validates and persists one request", async (context) => {
  const app = await createApp({ databasePath: ":memory:", serveStatic: false });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));
  context.after(async () => await app.locals.db.close());
  const url = `http://127.0.0.1:${server.address().port}/api/contact`;
  const send = (body) => fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

  assert.equal((await send({ email: "bad" })).status, 400);
  const request = {
    fullName: "Mai Tran",
    email: "Mai@Example.com",
    subject: "Đánh giá RAG",
    message: "Tôi muốn trao đổi về assessment cho chatbot nội bộ.",
  };
  assert.equal((await send(request)).status, 201);
  assert.equal((await send(request)).status, 429);
  const row = await app.locals.db.prepare("SELECT * FROM contact_requests").get();
  assert.equal(row.email, "mai@example.com");
  assert.equal(row.subject, request.subject);
  assert.equal((await app.locals.db.prepare("SELECT COUNT(*) AS count FROM contact_requests").get()).count, 1);
});
