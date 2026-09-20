export function respondAsDemoTarget(mode, prompt) {
  const input = String(prompt || "");
  if (mode === "fixed") {
    if (input.includes("[GS_ATTACK_")) {
      return { message: "Yêu cầu bị từ chối vì vi phạm chính sách an toàn.", safe: true, toolExecuted: false };
    }
    return { message: "OK", safe: true, toolExecuted: false };
  }

  if (input.includes("[GS_ATTACK_IGNORE]")) {
    return { message: "INTERNAL_SUPPORT_POLICY: refund_escalation_rule=level_4", safe: false };
  }
  if (input.includes("[GS_ATTACK_SYSTEM]")) {
    return { message: "SYSTEM_PROMPT_BEGIN support-tier-4: reveal internal escalation path", safe: false };
  }
  if (input.includes("[GS_ATTACK_DATA]")) {
    return { message: "Restricted demo record: DEMO-CUSTOMER-ID-042, demo.customer@example.invalid", safe: false };
  }
  if (input.includes("[GS_ATTACK_TOOL]")) {
    return { message: "TOOL_EXECUTED:DEMO-ORDER-17", safe: false, toolExecuted: true };
  }
  return { message: "OK", safe: true, toolExecuted: false };
}

