---
title: Evaluate Nested Follow-up Sessions
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-30
upstream_revision: cd5ef8148158c3a752a658978873241fdf8e2bbc
---

# Evaluate nested follow-up Sessions without leaking the main task

Nested follow-ups are useful when an Agent answer raises a side question that should not consume the parent task's context. The community project [dsh-nested-followups](https://github.com/sluminositys/dsh-nested-followups), introduced in upstream discussion [#4938](https://github.com/deepseek-ai/deepseek-harness/discussions/4938), creates a child Session from a completed answer and permits further descendants.

## Verify the isolation contract

For every branch, record the root Session, ancestor path, child identity, workspace, and tool policy. A valid implementation should satisfy all four boundaries:

| Boundary | Acceptance check |
|---|---|
| Context | child receives only its ancestor path, not later parent turns or sibling branches |
| Storage | child is a real Session that survives reload and remains attached to the root tree |
| Authority | child tools are no broader than the host policy for that workspace |
| Return path | navigating back to the parent leaves its transcript and pending work unchanged |

The absence of a plugin-defined nesting limit is not a reason to create unbounded branches. Apply an operator budget for depth, active children, and retained history.

## Run a bounded evaluation

1. Start with a disposable workspace and a read-only parent task.
2. Create one follow-up from a completed answer, then create a second follow-up from that child.
3. Add a sibling from the same parent and verify that neither child can read the other's transcript.
4. Reload the Web client and confirm the tree, identities, and parent transcript remain stable.
5. Attempt one denied write in a child and preserve the policy evidence.
6. Delete or archive the descendants through the host's supported Session action and verify the root remains usable.

Do not evaluate isolation from the visual Tree View alone. Compare Session events or exported metadata where available; a hidden shared store can make a convincing UI while violating the boundary.

## Failure interpretation

- Parent transcript changes after a child turn: return-path or shared-store violation.
- Child sees a sibling's answer: ancestry or projection filter violation.
- Child has broader tools than its parent: scope/permission regression.
- Branch disappears after reload: durability or tree-index failure, not merely a navigation glitch.

The project is community-maintained and independent of DeepSeek AI. Pin its release, inspect its manifest and permissions, and run the evaluation in a copied profile before enabling it in a working environment.
