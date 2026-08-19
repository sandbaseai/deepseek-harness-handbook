---
title: Recover a DeepSeek Harness Session With Insufficient Tool Messages
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-19
---

# Recover a Session with insufficient tool messages

Use this runbook when one DeepSeek Harness Session begins returning the same provider error on every retry or resume:

```text
An assistant message with 'tool_calls' must be followed by tool messages
responding to each 'tool_call_id'. (insufficient tool messages following tool_calls message)
```

Stop retrying that Session. The next request contains the same invalid durable transcript, so another provider call spends time or quota without changing the cause.

## Identify the broken transcript invariant

An assistant message can request one or more tools. Before the next assistant generation, every requested call id needs one corresponding tool-result message in transcript order.

```text
assistant: tool_calls [call_A, call_B]
tool:      call_A result
tool:      call_B result
```

The poisoned shape is:

```text
assistant: tool_calls [call_A, call_B]
tool:      call_A result     # or no results at all
turn/end:  error
next request → provider 400
```

This is different from malformed tool-call JSON. The call blocks can be syntactically valid while their required result messages are absent.

## Trace the rc.7 failure chain

In the rc.7 parallel tool scheduler, `startCall()` appends `tool/call` before it asks the runtime scheduler to prepare the execution. If prepare, dispatch, finalization, or ordered commit fails, the catch path waits for in-flight work and rethrows the scheduler error.

The cancellation path is different: it appends an error result for every skipped call. The scheduler-failure path does not close already recorded or never-started calls before the Agent Loop records `turn/end { error }`.

That final `turn/end` matters. The persistence repair function synthesizes missing tool results only for an **open interrupted tail turn**. A turn already closed with an error is structurally balanced at the turn boundary, so cold resume does not enter interrupted-turn repair even though the provider transcript is unbalanced.

Finally, the DeepSeek adapter serializes assistant tool calls and later tool-result blocks in order. It does not add missing results. The provider therefore rejects every later request carrying the same history.

## Recover without falsifying side effects

1. Cancel automatic retries and stop every writer that shares the Session root.
2. Export or copy the complete Session artifact without rewriting it.
3. Record the first scheduler error, affected turn and step, assistant call ids, existing `tool/call` events, existing `tool/result` events, and `turn/end` reason.
4. Classify each missing call:
   - no durable `tool/call`: the operation was not recorded as started;
   - durable `tool/call`, no result: the external outcome is unknown.
5. Start a fresh Session and carry forward only a reviewed summary plus verified external state.

For a missing result after a side-effecting call, inspect the filesystem, service, repository, or remote system before retrying. Never assume “no result” means “no effect.”

Do not append hand-written events to a live compressed log. A plausible tool result can corrupt sequence, framing, source-event references, or—more importantly—state that the operation failed when it actually succeeded.

## Decide the repair boundary

| Situation | Safe default |
|---|---|
| Need to continue the task now | start a new Session with a verified summary |
| Need the old content | preserve the original and extract a read-only transcript |
| Need exact Session continuation | use a version-aware repair tool on a copy, then validate the complete event and provider transcript invariants |
| Missing call may have side effects | verify external state before any replay |

## Durable fix shape

The primary invariant belongs at the Agent Loop boundary: every assistant tool call must receive exactly one ordered result before the turn closes, including scheduler failures.

- A call with no durable `tool/call` can use `TOOL_NOT_STARTED` semantics.
- A recorded call without a durable result needs `TOOL_OUTCOME_UNKNOWN` semantics and a warning against blind replay.
- Synthetic results must retain model order and call identity.
- The original scheduler error remains the turn's controlling failure.

A load-time transcript audit can repair previously poisoned Sessions, but it must distinguish closed error turns from open crash tails and append only version-valid events. A wire-only sanitizer may keep a provider request alive, but it hides a durable invariant violation and lacks enough evidence to claim whether a tool ran; treat it as containment, not the source of truth.

## Regression gates

- Parallel prepare failure closes every requested call id exactly once.
- Dispatch and finalization failures preserve the original error.
- Calls recorded as started use unknown-outcome semantics.
- Calls never recorded as started use not-started semantics.
- Side-effecting calls are never described as safely retryable by default.
- Cold resume produces a provider-valid transcript for both open and closed-error tails.
- DeepSeek and OpenAI-compatible serialization preserves call/result order.
- Repeated retry of a poisoned fixture is unnecessary because the first repaired request succeeds or fails for a new reason.

## Source boundary

Verified against DeepSeek Harness `0.1.0-rc.7` commit `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca` and upstream reproduction #3415.

- [Upstream insufficient-tool-messages reproduction #3415](https://github.com/deepseek-ai/deepseek-harness/discussions/3415)
- [Parallel tool scheduler failure path](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/agent-loop/src/tool-calls.ts)
- [Interrupted-turn repair semantics](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/session/src/repair.ts)
- [DeepSeek message serializer](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/llm/llm-deepseek/src/serialize.ts)
- [Official session persistence recovery contract](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/session/session-persistence/README.md)
- [Session history recovery router](session-history-corruption-triage.md)
