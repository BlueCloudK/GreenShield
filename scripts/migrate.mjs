import { createDatabase } from "../server/db/index.js";

const db = createDatabase();
db.close();
console.log("GreenShield database migrations applied.");

