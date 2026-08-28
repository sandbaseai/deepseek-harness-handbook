---
title: Design a Bounded Failure Successor for DeepSeek Harness Ralph
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-28
upstream_revision: cd5ef8148158c3a752a658978873241fdf8e2bbc
---

# Design a Bounded Failure Successor for DeepSeek Harness Ralph

The Ralph tool is deliberately fail-closed: each round starts one fresh child, the child must return a bounded structured report, and a child that returns no report ends the run as `round-failed`. That protects completion semantics, but it can be costly when an ordinary child fails after making useful progress in the shared workspace.

This guide evaluates the narrow recovery idea raised in [upstream Discussion #109](https://github.com/deepseek-ai/deepseek-harness/discussions/109): an optional, deployment-controlled **failure successor**. The recommendation is to keep the default behavior unchanged and, if implemented, make the successor a Ralph-owned policy with strict budget and failure-class boundaries.

## Start with the current contract

`dsh-tool-ralph` is not a new agent-loop mode. It is a fixed workflow over the workflow engine and fresh subagent provider. The parent supplies an immutable objective and an optional `maxRounds`; the deployment supplies the provider, round ceiling, handoff size, and result size. Every child receives the objective, round number, shared workspace, and the previous validated handoff—never the parent conversation.

The current terminal states are meaningful:

| State | Meaning | What must not happen |
|---|---|---|
| `complete` | A child reported completion with evidence | Treat the report as independent certification |
| `blocked` | A child reported a concrete external blocker | Hide the blocker behind an automatic retry |
| `budget-limited` | The round cap ended while work continued | Pretend the objective is complete |
| `round-failed` | A started child produced no valid report | Convert infrastructure failure into progress |

The last row is intentionally different from `budget-limited`. A successor proposal must preserve that distinction.

## What a safe successor is—and is not

A failure successor is a **new fresh child**, not a replay of the failed request. It should receive:

- the unchanged objective;
- the most recent successful structured handoff, if one exists;
- a machine-written marker that the previous round failed before producing a report;
- an instruction to inspect authoritative shared-workspace state before choosing to continue, diagnose, pivot, or report a concrete blocker.

It must not receive an unbounded transcript, an invented completion claim, or the failed child’s partial in-memory reasoning. The workspace may contain useful committed or uncommitted artifacts, but the successor must verify them rather than infer success from their presence.

## Bound the policy at deployment time

If a deployment opts in, use a separate `maxFailureSuccessors` setting with a default of `0`. The call schema should not let the model raise this ceiling or select a provider. Every successor consumes the existing `maxRounds` and `maxTotalAgents` budgets, so recovery cannot become an unbounded second loop.

Conceptually:

```text
failureSuccessors = 0
for round in 1..maxRounds:
  report = freshChild(objective, previousHandoff, failureMarker)
  if report is valid:
    return report or carry handoff forward
  if failure is ordinary child-no-report
     and failureSuccessors < configured maxFailureSuccessors
     and remaining round/agent budget exists:
    failureSuccessors += 1
    failureMarker = "previous child failed before structured report"
    continue
  return round-failed(lastSuccessfulHandoff)
```

The implementation should count a successor as a normal round before starting it. A successor may itself fail; it does not earn another hidden retry unless the explicit cap still permits one. Cancellation always wins: once the parent signal is aborted, no successor may start.

## Keep the failure-class boundary narrow

Only a child that successfully started but failed to produce a valid structured report is a candidate. Do not route these failures into a successor:

- missing or misconfigured provider;
- a provider that inherits parent context or lacks structured output;
- workflow-engine startup or disposal failure;
- transport, authentication, sandbox, worker, or process-launch failure;
- parent cancellation or deadline expiry;
- an invalid report that exposes a schema or deployment bug unless the policy explicitly classifies it as an ordinary child failure.

Retrying those classes can duplicate side effects, conceal a broken deployment, or spend through an outage. They should remain loud and terminal with the existing error envelope.

## Inspect before acting

The successor prompt should force a short evidence pass:

1. inspect `git status`, the relevant files, and the last successful handoff;
2. identify which changes are actually attributable to the failed round;
3. check tests, logs, or runtime state that can falsify the handoff;
4. choose one bounded next action, or report a concrete blocker;
5. leave an auditable commit or explicit uncommitted state rather than claiming invisible progress.

This keeps Ralph’s shared workspace as durable memory without treating workspace existence as completion certification.

## Preserve the parent-facing result

The terminal envelope should identify the count of ordinary rounds and failure successors separately. For example, a successful result can say that round 3 was a successor after round 2 produced no report, while a terminal `round-failed` result should retain the last successful handoff and the failed round number. Intermediate child transcripts should stay out of the parent conversation, just as they do today.

Add regression coverage for:

- default `0` preserving current first-failure behavior;
- one ordinary failure followed by one fresh successor;
- successor consumption of both round and total-agent budgets;
- cancellation between failure detection and successor start;
- infrastructure failure never entering the successor path;
- no-report successors failing terminally when their cap is exhausted;
- a prior handoff remaining bounded and structurally validated.

## Recommendation

Keep `maxFailureSuccessors: 0` until the policy and telemetry exist. If operators need recovery, enable a small value (usually `1`) only for Ralph deployments whose children are idempotent or whose shared-workspace effects are easy to audit. Do not change the generic workflow `agent()` contract, add scheduler state, or let the model choose provider or retry policy. The feature is valuable precisely because it is a narrow Ralph orchestration option with explicit budgets—not because it makes every agent failure retryable.

## Source boundary

Verified against alpha.1 commit `cd5ef8148158c3a752a658978873241fdf8e2bbc` on 2026-08-28. This handbook documents a proposed policy; it does not claim that alpha.1 implements failure successors.

- [Ralph package contract](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/workflow/tool-ralph/README.md)
- [Ralph fixed workflow implementation](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/workflow/tool-ralph/src/index.ts)
- [Failure successor proposal, Discussion #109](https://github.com/deepseek-ai/deepseek-harness/discussions/109)
