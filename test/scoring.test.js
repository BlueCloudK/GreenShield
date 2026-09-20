import assert from "node:assert/strict";
import test from "node:test";
import { calculateRisk } from "../server/security/scoring.js";

test("risk score is deterministic and capped", () => {
  assert.deepEqual(calculateRisk([{ severity: "HIGH" }, { severity: "HIGH" }]), { score: 50, level: "HIGH" });
  assert.deepEqual(calculateRisk([{ severity: "CRITICAL" }, { severity: "CRITICAL" }, { severity: "HIGH" }]), { score: 100, level: "CRITICAL" });
  assert.deepEqual(calculateRisk([]), { score: 0, level: "LOW" });
});

