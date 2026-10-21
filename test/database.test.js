import assert from "node:assert/strict";
import test from "node:test";
import { createDatabase, postgresParameters } from "../server/db/index.js";

test("Postgres placeholders preserve quoted question marks", () => {
  assert.equal(
    postgresParameters("SELECT '?' AS message, \"?\" FROM targets WHERE id=? AND name=?"),
    "SELECT '?' AS message, \"?\" FROM targets WHERE id=$1 AND name=$2",
  );
});

test("async transactions roll back and isolate concurrent operations", async (context) => {
  const db = await createDatabase(":memory:");
  context.after(() => db.close());
  await db.exec("CREATE TABLE verification (id TEXT PRIMARY KEY)");
  const insert = db.prepare("INSERT INTO verification(id) VALUES (?)");
  const rollback = db.transaction(async () => {
    await insert.run("rolled-back");
    await new Promise((resolve) => setTimeout(resolve, 20));
    throw new Error("rollback");
  })();
  const commit = db.transaction(async () => {
    await insert.run("committed");
  })();
  await assert.rejects(rollback, /rollback/);
  await commit;
  assert.deepEqual(await db.prepare("SELECT id FROM verification").all(), [{ id: "committed" }]);
});
