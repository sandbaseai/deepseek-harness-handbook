---
title: Diagnose a Resumed Agent with a Missing Tool View
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-29
upstream_revision: cd5ef8148158c3a752a658978873241fdf8e2bbc
---

# Diagnose a resumed Agent with a missing tool view

Use this runbook when a long-lived bridge or channel intermittently reports `ToolNotFoundError` for a tool that previously worked, especially after an idle queue is drained and the Agent is rebuilt. Upstream discussion [#4946](https://github.com/deepseek-ai/deepseek-harness/discussions/4946) reports four independent QQ-bot failure clusters where `bash` was registered, then disappeared only on resumed Agent instances.

## Do not confuse the signature

This report names a complete, non-empty tool (`bash`) and ties every failure cluster to an Agent rebuild. That differs from streamed tool-call bugs where `callId` or `name` is empty. A successful historical invocation proves registration at an earlier point; it does not prove that the resumed scope has the same tool view.

Keep two hypotheses separate:

- **Plugin lifecycle:** the bridge disposes its Agents after queued work settles and resumes one on the next message.
- **Core scope binding:** the resumed Agent's `view(scope)` or `resolveExecution(name, scope)` may be wired before workspace tools and permission layers are attached.

The upstream report is strong reproduction evidence, not proof that every bridge or every release has the defect.

## Capture the first failing boundary

For each resumed instance, record:

```text
DSH version / commit:
Bridge or plugin and version:
Session / Agent identity (redacted):
Last successful bash call:
Queue drained / dispose event:
Resume or session/end-seed event:
First failing tool call and exact error:
Tool view at resume completion:
Tool view after a fresh Agent:
```

Run one harmless, read-only probe immediately after resume and compare it with a fresh Agent in the same workspace. Do not mutate files just to prove that `bash` exists.

## Use an explicit recovery boundary

If the resumed view is missing a previously available tool:

1. stop retrying the same call in the bad instance;
2. preserve the Session and the lifecycle timeline;
3. compare the resumed view with a fresh Agent's `wireSchemas`/execution resolution, if those diagnostics are available;
4. use one controlled bridge or Web restart as containment, not as a root-cause claim;
5. report whether the next natural rebuild restores the view.

Repeated retries cannot repair a view that was bound incompletely. Never broaden permissions or silently register a replacement tool as a workaround; that changes the security contract while hiding the lifecycle race.

## Acceptance gate for a fix

A credible fix must exercise both paths: create a new Agent and resume an idle, disposed Agent with the same workspace and permission chain. At resume completion, the tool view must contain the same expected names and schemas, and a bounded read-only invocation must resolve once. The test should also cover queue-drained disposal, multiple consecutive turns on the resumed instance, and a second rebuild. A single successful restart is containment evidence, not proof of parity.

Primary source: [upstream discussion #4946](https://github.com/deepseek-ai/deepseek-harness/discussions/4946), with the plugin-lifecycle follow-up linked from that discussion.
