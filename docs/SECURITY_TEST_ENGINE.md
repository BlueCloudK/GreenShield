# Security Test Engine

Each registry entry defines an ID, version, category, payload, expected safe behavior, severity, deterministic evaluator, and remediation guidance.

The MVP supports prompt injection, system prompt leakage, sensitive-data disclosure, and unsafe tool action without approval.

A scan creates persisted pending executions before work starts. Each execution sends an HTTP request, stores a bounded response, evaluates the rule, and creates a finding when vulnerable. Progress is completed executions divided by total executions.

Retest reruns the exact test against the same target. The demo target can switch from vulnerable to fixed mode to demonstrate remediation.
