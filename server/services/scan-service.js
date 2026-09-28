import crypto from "node:crypto";
import { calculateRisk } from "../security/scoring.js";
import { getSecurityTest, securityTests } from "../security/test-registry.js";
import { sendTargetRequest } from "../security/target-client.js";

const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${crypto.randomUUID()}`;

export function createScanService({ db, origin }) {
  function createScan({ projectId, targetId, testIds, name, workspaceId, actorUserId }) {
    const project = db.prepare("SELECT * FROM projects WHERE id = ? AND workspace_id = ? AND archived_at IS NULL").get(projectId, workspaceId);
    if (!project) throw httpError(404, "Không tìm thấy project.");
    const target = db.prepare("SELECT * FROM targets WHERE id = ? AND project_id = ?").get(targetId, projectId);
    if (!target) throw httpError(404, "Không tìm thấy target.");
    if (target.last_connection_status !== "SUCCESS") throw httpError(409, "Hãy Test Connection thành công trước khi scan.");
    const selected = [...new Set(testIds || [])].map(getSecurityTest).filter(Boolean);
    if (!selected.length) throw httpError(400, "Chọn ít nhất một security test.");
    const scanId = id("scan");
    const createdAt = now();
    db.transaction(() => {
      db.prepare(`INSERT INTO scans (id, project_id, target_id, name, status, total_tests, created_at)
        VALUES (?, ?, ?, ?, 'QUEUED', ?, ?)`).run(scanId, projectId, targetId, name || `AI Security Scan ${createdAt.slice(0, 10)}`, selected.length, createdAt);
      db.prepare("INSERT INTO scan_configurations (scan_id, test_ids_json, created_at) VALUES (?, ?, ?)")
        .run(scanId, JSON.stringify(selected.map((test) => test.id)), createdAt);
      const insertExecution = db.prepare(`INSERT INTO test_executions
        (id, scan_id, security_test_id, test_version, status, created_at) VALUES (?, ?, ?, ?, 'PENDING', ?)`);
      selected.forEach((test) => insertExecution.run(id("exec"), scanId, test.id, test.version, createdAt));
      audit(workspaceId, actorUserId, "SCAN_STARTED", "scan", scanId, { projectId, targetId });
    })();
    setImmediate(() => executeScan(scanId).catch((error) => failScan(scanId, error)));
    return getScan(scanId, workspaceId);
  }

  async function executeScan(scanId) {
    db.prepare("UPDATE scans SET status = 'RUNNING', started_at = ? WHERE id = ?").run(now(), scanId);
    const scan = db.prepare("SELECT * FROM scans WHERE id = ?").get(scanId);
    const target = db.prepare("SELECT * FROM targets WHERE id = ?").get(scan.target_id);
    const executions = db.prepare("SELECT * FROM test_executions WHERE scan_id = ? AND status = 'PENDING' ORDER BY created_at").all(scanId);
    for (const execution of executions) {
      await executeTest({ execution, target, scanId });
      db.prepare("UPDATE scans SET completed_tests = completed_tests + 1 WHERE id = ?").run(scanId);
    }
    const findings = db.prepare("SELECT severity FROM findings WHERE scan_id = ?").all(scanId);
    const errors = db.prepare("SELECT COUNT(*) AS count FROM test_executions WHERE scan_id=? AND status='ERROR'").get(scanId).count;
    if (errors) {
      failScan(scanId, new Error(`${errors} bài kiểm thử không chạy được. Kiểm tra kết nối và chạy lại scan.`));
      return;
    }
    const risk = calculateRisk(findings);
    const completedAt = now();
    db.transaction(() => {
      db.prepare(`UPDATE scans SET status='COMPLETED', risk_score=?, risk_level=?, completed_at=? WHERE id=?`)
        .run(risk.score, risk.level, completedAt, scanId);
      db.prepare("INSERT OR REPLACE INTO reports (id, scan_id, generated_at) VALUES (?, ?, ?)")
        .run(id("report"), scanId, completedAt);
      const workspace = db.prepare("SELECT workspace_id FROM projects WHERE id = ?").get(scan.project_id);
      audit(workspace.workspace_id, null, "SCAN_COMPLETED", "scan", scanId, { risk });
    })();
  }

  async function executeTest({ execution, target, scanId }) {
    const test = getSecurityTest(execution.security_test_id);
    const startedAt = Date.now();
    db.prepare("UPDATE test_executions SET status='RUNNING', started_at=? WHERE id=?").run(now(), execution.id);
    try {
      const result = await sendTargetRequest(target, test.payload, { origin });
      if (!result.ok) throw new Error(`Target trả về HTTP ${result.status}.`);
      const evaluation = test.evaluate(result);
      const status = evaluation.vulnerable ? "FAILED" : "PASSED";
      db.prepare(`UPDATE test_executions SET status=?, request_json=?, response_json=?, extracted_evidence=?,
        duration_ms=?, completed_at=? WHERE id=?`).run(
        status,
        JSON.stringify({ prompt: test.payload }),
        JSON.stringify({ status: result.status, body: result.body }),
        evaluation.evidence || "",
        Date.now() - startedAt,
        now(),
        execution.id,
      );
      if (evaluation.vulnerable) createFinding({ scanId, executionId: execution.id, test, result, evaluation });
      return { status, result, evaluation };
    } catch (error) {
      db.prepare(`UPDATE test_executions SET status='ERROR', error_message=?, duration_ms=?, completed_at=? WHERE id=?`)
        .run(error.message, Date.now() - startedAt, now(), execution.id);
      return { status: "ERROR", error };
    }
  }

  function createFinding({ scanId, executionId, test, result, evaluation }) {
    const findingId = id("finding");
    const createdAt = now();
    db.transaction(() => {
      db.prepare(`INSERT INTO findings (id, scan_id, test_execution_id, security_test_id, title, category,
        severity, description, impact, explanation, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        findingId, scanId, executionId, test.id, test.name, test.category, test.severity,
        test.description, test.recommendation.whyItMatters,
        `Response khớp với rule đánh giá xác định trước của test ${test.id}.`, createdAt, createdAt,
      );
      db.prepare(`INSERT INTO finding_evidence (id, finding_id, test_input, target_response, extracted_evidence, created_at)
        VALUES (?, ?, ?, ?, ?, ?)`).run(id("evidence"), findingId, test.payload, result.text, evaluation.evidence, createdAt);
      const recommendation = test.recommendation;
      db.prepare(`INSERT INTO finding_recommendations (finding_id, problem, why_it_matters, mitigation,
        implementation_guidance, validation_criteria) VALUES (?, ?, ?, ?, ?, ?)`).run(
        findingId, recommendation.problem, recommendation.whyItMatters, recommendation.mitigation,
        recommendation.implementationGuidance, recommendation.validationCriteria,
      );
    })();
  }

  async function retestFinding({ findingId, workspaceId, actorUserId }) {
    const finding = db.prepare(`SELECT f.*, s.target_id, p.workspace_id FROM findings f
      JOIN scans s ON s.id=f.scan_id JOIN projects p ON p.id=s.project_id
      WHERE f.id=? AND p.workspace_id=?`).get(findingId, workspaceId);
    if (!finding) throw httpError(404, "Không tìm thấy finding.");
    if (finding.retest_status === "RETESTING") throw httpError(409, "Finding này đang được retest.");
    const target = db.prepare("SELECT * FROM targets WHERE id = ?").get(finding.target_id);
    const test = getSecurityTest(finding.security_test_id);
    const retestId = id("retest");
    const executionId = id("exec");
    const createdAt = now();
    db.transaction(() => {
      db.prepare(`INSERT INTO test_executions (id, scan_id, security_test_id, test_version, status, created_at)
        VALUES (?, ?, ?, ?, 'PENDING', ?)`).run(executionId, finding.scan_id, test.id, test.version, createdAt);
      db.prepare(`INSERT INTO retests (id, finding_id, execution_id, status, previous_evidence, created_at)
        VALUES (?, ?, ?, 'RETESTING', ?, ?)`).run(
        retestId, findingId, executionId,
        db.prepare("SELECT extracted_evidence FROM finding_evidence WHERE finding_id=? ORDER BY created_at DESC LIMIT 1").get(findingId)?.extracted_evidence || "",
        createdAt,
      );
      db.prepare("UPDATE findings SET retest_status='RETESTING', updated_at=? WHERE id=?").run(createdAt, findingId);
      audit(workspaceId, actorUserId, "FINDING_RETEST_STARTED", "finding", findingId, { retestId });
    })();
    setImmediate(async () => {
      const outcome = await executeRetest({ finding, target, test, executionId });
      const fixed = outcome.status === "PASSED";
      db.transaction(() => {
        db.prepare(`UPDATE retests SET status=?, new_evidence=?, completed_at=? WHERE id=?`)
          .run(fixed ? "FIXED" : outcome.status === "ERROR" ? "ERROR" : "STILL_VULNERABLE", outcome.evaluation?.evidence || outcome.error?.message || "Không còn bằng chứng về hành vi không an toàn trong response mới.", now(), retestId);
        db.prepare(`UPDATE findings SET status=?, retest_status=?, updated_at=? WHERE id=?`)
          .run(fixed ? "FIXED" : "OPEN", fixed ? "FIXED" : outcome.status === "ERROR" ? "ERROR" : "STILL_VULNERABLE", now(), findingId);
        audit(workspaceId, actorUserId, "FINDING_RETEST_COMPLETED", "finding", findingId, { fixed, retestId });
      })();
    });
    return { id: retestId, status: "RETESTING" };
  }

  async function executeRetest({ finding, target, test, executionId }) {
    const execution = { id: executionId, security_test_id: test.id };
    const startedAt = Date.now();
    db.prepare("UPDATE test_executions SET status='RUNNING', started_at=? WHERE id=?").run(now(), executionId);
    try {
      const result = await sendTargetRequest(target, test.payload, { origin });
      if (!result.ok) throw new Error(`Target trả về HTTP ${result.status}.`);
      const evaluation = test.evaluate(result);
      const status = evaluation.vulnerable ? "FAILED" : "PASSED";
      db.prepare(`UPDATE test_executions SET status=?, request_json=?, response_json=?, extracted_evidence=?, duration_ms=?, completed_at=? WHERE id=?`)
        .run(status, JSON.stringify({ prompt: test.payload }), JSON.stringify({ status: result.status, body: result.body }), evaluation.evidence || "", Date.now() - startedAt, now(), execution.id);
      return { status, result, evaluation };
    } catch (error) {
      db.prepare(`UPDATE test_executions SET status='ERROR', error_message=?, duration_ms=?, completed_at=? WHERE id=?`)
        .run(error.message, Date.now() - startedAt, now(), execution.id);
      return { status: "ERROR", error };
    }
  }

  function getScan(scanId, workspaceId) {
    const scan = db.prepare(`SELECT s.*, p.name AS project_name, p.workspace_id, t.name AS target_name, t.type AS target_type,
      t.config_json AS target_config_json FROM scans s JOIN projects p ON p.id=s.project_id
      JOIN targets t ON t.id=s.target_id WHERE s.id=? AND p.workspace_id=?`).get(scanId, workspaceId);
    if (!scan) return null;
    const executions = db.prepare("SELECT * FROM test_executions WHERE scan_id=? ORDER BY created_at").all(scanId)
      .map((execution) => ({ ...execution, test_name: getSecurityTest(execution.security_test_id)?.name || execution.security_test_id }));
    const findings = db.prepare(`SELECT f.*, e.test_input, e.target_response, e.extracted_evidence,
      r.problem, r.why_it_matters, r.mitigation, r.implementation_guidance, r.validation_criteria
      FROM findings f JOIN finding_evidence e ON e.finding_id=f.id
      JOIN finding_recommendations r ON r.finding_id=f.id WHERE f.scan_id=? ORDER BY f.created_at`).all(scanId);
    return {
      ...scan,
      targetConfig: JSON.parse(scan.target_config_json || "{}"),
      progress: scan.total_tests ? Math.round((scan.completed_tests / scan.total_tests) * 100) : 0,
      executions,
      findings,
    };
  }

  function failScan(scanId, error) {
    db.prepare("UPDATE scans SET status='FAILED', error_message=?, completed_at=? WHERE id=?").run(error.message, now(), scanId);
  }

  function audit(workspaceId, actorUserId, action, entityType, entityId, metadata = {}) {
    db.prepare(`INSERT INTO audit_events (id, workspace_id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id("audit"), workspaceId, actorUserId, action, entityType, entityId, JSON.stringify(metadata), now());
  }

  return { createScan, getScan, retestFinding, securityTests };
}

export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
