---
title: Diagnose a Continuable Child with an Empty Tool Registry
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-28
sources:
  - https://github.com/deepseek-ai/deepseek-harness/discussions/4921
---

# Diagnose a Continuable Child with an Empty Tool Registry

Use this guide when a continuable subagent starts successfully, but its tool list contains only `report` (or is empty) even though the parent Agent can call filesystem, shell, or MCP tools. This is a composition and ownership failure, not evidence that the model forgot a tool name.

## Separate the two registries

A parent and child can have different tool views. The child view is assembled from the global layer, inherited scope layers, and the child's own setup. A successful `startContinuable()` acknowledgement proves that a child Session was created; it does not prove that the parent's standing preset was composed into that child.

| Observation | What it proves | What it does not prove |
|---|---|---|
| Parent can enumerate `read`, `grep`, or MCP tools | Those tools are visible in the parent view | The continuable child inherited the same scope |
| Child has only `report` | The child-local reporting setup ran | `composeFrom(parent.ctx)` ran successfully |
| A role-based child has the full tool set | The tools are scope-capable in this deployment | The continuable materialization path is correct |
| `toolFilter` is configured | A filter was requested | There was a registry to filter |

The upstream report for rc.2 reproduces this distinction across several roles: the generic role path inherits tools, while the continuable path exposes only the unconditional reporting tool.

## Capture evidence before changing the preset

Record the exact Harness release, installation layout, profile, parent Session, child ID, and the full start acknowledgement. Then capture tool enumeration from both parent and child without printing credentials or prompt contents. A useful evidence table is:

```text
boundary             visible tools             setup evidence
parent standing      read, grep, mcp__*        preset mount resolved
continuable child    report                    child setup ran
continuable child    (missing read/grep)        inherited composition unknown
```

Do not “fix” the symptom by adding every plugin directly to the child until the ownership boundary is understood. That workaround can make tools appear while silently changing filtering and sandbox semantics.

## Trace the continuable composition path

Inspect the materialization sequence in the running version (line numbers change between releases):

1. The child context is created from the parent descriptor.
2. Delegated policy overrides and the requested `toolFilter` are recorded.
3. The child composition attempts to resolve `agentPresets` and compose the parent's standing mount.
4. Continuable setup registers child-local tools such as `report` and any scoped MCP entries.
5. The child tool view is snapshotted for the first turn.

If step 3 resolves to `undefined` and optional chaining turns it into a no-op, the child can continue with a perfectly valid Session but no inherited tools. If step 5 runs before the standing mount is bound, the first view can also be permanently incomplete for that Activation.

## Test the likely failure modes

Run a minimal matrix with one harmless filesystem tool and one MCP tool:

| Test | Expected result |
|---|---|
| Parent standing preset, ordinary role child | Child sees the allowed inherited tools |
| Parent standing preset, continuable child | Child sees the same tools subject to `toolFilter` |
| Continuable child with deny filter | Denied tools are absent; allowed tools remain |
| Missing preset service during materialization | A visible diagnostic identifies the missing composition service |
| Child enumeration immediately after start | Snapshot is taken after composition and setup finish |

Repeat each case after a cold resume. A warm-only success does not establish that durable child descriptors contain enough information to reconstruct the tool scope.

## Safe operator workaround

Until the runtime makes the composition failure explicit, prefer a bounded role child whose inherited tool view is known to work. If the task requires a continuable child, register only the minimum required capabilities in its own setup, preserve the same deny list and sandbox mode, and announce that this is a plugin-granularity fallback rather than true parent-scope inheritance.

Never tell a child to “read the file” when its enumeration proves that `read` is unavailable. Treat a claimed tool result without a corresponding tool-call event as an unverified model statement.

## Runtime hardening checklist

- Replace silent optional-chain skips with a structured composition error and a diagnostic containing the child and parent IDs.
- Log the standing-mount lookup, scope-parent binding, setup order, and first tool-view snapshot as separate events.
- Make child and job IDs visibly distinct; a child ID must not be accepted by `job_output`.
- Add a regression test that starts a continuable child and asserts one inherited filesystem tool, one inherited MCP tool, and correct allow/deny filtering.
- Persist enough preset identity and policy metadata for cold resume, without persisting secrets.

## Source

- [Upstream report: continuable subagent tool registry is empty (#4921)](https://github.com/deepseek-ai/deepseek-harness/discussions/4921)
