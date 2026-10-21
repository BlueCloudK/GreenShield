import { createDatabase } from "../server/db/index.js";

const db = await createDatabase();
await db.close();
console.log("GreenShield database migrations applied.");
