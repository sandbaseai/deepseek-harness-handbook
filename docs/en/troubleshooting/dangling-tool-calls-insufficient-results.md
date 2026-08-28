---
title: Recover a DeepSeek Harness Session With Insufficient Tool Messages
locale: en
content_revision: 4
status: canonical
verified_at: 2026-08-27
upstream_ref: cd5ef8148158c3a752a658978873241fdf8e2bbc
---

# Recover a Session with insufficient tool messages

## A cold restart is not a repair guarantee

One published-runtime report supplies a useful negative recovery row:

| OS | DSH artifact | Node | Persistence / symptom | Full restart result |
|---|---|---|---|---|
| Windows 11 | `0.1.0-rc.6` | `24.15.0` | HMR was followed by `undefined.prepare`; the assistant tool call had no matching result and later requests returned `insufficient tool messages following tool_calls message` | **Failed recovery:** after a complete process stop and restart, no synthetic tool result was appended and the resumed turn still returned HTTP 400 |

The report's original tail already contained `step/end` and `turn/end(error)`. The pinned `interruptedTurnClosers()` logic therefore classified the turn as balanced and had no open crash tail to close. This is evidence that a cold restart can faithfully reload a poisoned, already-closed error turn; it is not evidence that the restart repaired the missing tool result. Preserve the Session and treat the post-restart failure as the observed outcome, not as permission to edit the log in place.

This row is community evidence, not a handbook reproduction. It falsifies the shortcut “restart always repairs an interrupted call” and gives future comparisons an exact artifact, runtime, symptom, and result.

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

The reverse shape is also invalid for strict OpenAI-compatible transcripts:

```text
tool: call_Z result       # no prior assistant call_Z
```

Route all structural cases before repairing:

| Shape | Proven fact | Safe interpretation |
|---|---|---|
| Assistant call, no durable `tool/call` | model requested it; runtime did not record dispatch | `TOOL_NOT_STARTED` |
| Durable `tool/call`, no result | dispatch crossed the durable boundary | `TOOL_OUTCOME_UNKNOWN` |
| Tool result, no matching assistant call | result is orphaned from provider-visible request | preserve as quarantined evidence; do not invent an assistant action |
| Empty or duplicate call ID | correlation identity is unusable/ambiguous | typed invariant failure; never match by order alone |
| Malformed tool arguments | request payload is invalid | distinct from call/result cardinality; preserve raw evidence |

An invalid presentation payload is not necessarily a provider-wire defect. For example, a UI `presentCall(JSON.parse(arguments))` failure can break a card while the durable call remains correlated. Catch presentation parsing locally; do not use transcript synthesis to repair a renderer.

## Trace the rc.7 and rc.2 failure chain

In the rc.7 parallel tool scheduler, `startCall()` appends `tool/call` before it asks the runtime scheduler to prepare the execution. If prepare, dispatch, finalization, or ordered commit fails, the catch path waits for in-flight work and rethrows the scheduler error.

The cancellation path is different: it appends an error result for every skipped call. The scheduler-failure path does not close already recorded or never-started calls before the Agent Loop records `turn/end { error }`.

That final `turn/end` matters. The persistence repair function synthesizes missing tool results only for an **open interrupted tail turn**. A turn already closed with an error is structurally balanced at the turn boundary, so cold resume does not enter interrupted-turn repair even though the provider transcript is unbalanced.

Finally, the DeepSeek adapter serializes assistant tool calls and later tool-result blocks in order. It does not add missing results. The provider therefore rejects every later request carrying the same history.

The same source-level invariant remains relevant in rc.2. Recent reports show scheduler `prepare` failures that append `tool/call`, then `step/end` and `turn/end(error)` without `tool/result`. A later serializer cannot infer from message shape alone whether a side effect started, completed, or remained unknown.

Discussion #4668 proposes a wire serializer that fills pending calls and handles orphan results. Its title attributes the problem to plugins, but the post provides no plugin, injected message, resulting Session events, or minimal reproduction. Treat “plugin caused it” as an unverified hypothesis until the producer boundary is identified. The proposed code is useful design input, not authoritative evidence of the ingress defect.

## Add the alpha.1 identity and compaction branches

Discussion #4843 reports the same provider-visible 400 through three additional malformed-history paths. The alpha.1 source confirms the relevant boundaries, while the attached patch remains a community proposal until merged.

### Empty streamed call identity

The alpha.1 DeepSeek stream translator assembles tool-call blocks by wire index. When the provider never supplies `id` or `function.name`, `closeBlock()` currently emits an empty ID or name; streamed deltas likewise expose an empty ID until one arrives. Empty identity is not a harmless placeholder: several incomplete calls can collapse onto the same correlation key, and a later result cannot prove which call it belongs to.

Reject an incomplete block before it becomes an executable assistant message, or synthesize an identity only from an explicit, collision-free, request-scoped rule that every downstream result uses consistently. A random replacement created independently at multiple boundaries is not correlation.

### Count-balanced but identity-invalid compaction

The alpha.1 compaction helper tracks only an integer count:

```text
assistant calls: [call_A]
tool results:    [call_B]
count balance:  1 - 1 = 0
identity truth: call_A remains open; call_B is orphaned
```

Therefore, a cut marked “balanced” by cardinality can still be invalid for the provider. Compaction safety needs an ordered identity ledger, not only a count. Each result must close one exact open ID; empty, duplicate, and unknown IDs are explicit failures.

### Request-boundary stripping

Dropping malformed calls immediately before a model request can contain a 400, but it does not repair durable history or prove that an external tool had no effect. Record which immutable source blocks were excluded, why, and whether any corresponding execution evidence exists. The next compaction, export, replay, or adapter must not silently reach a different conclusion from the same Session.

## Recover without falsifying side effects

1. Cancel automatic retries and stop every writer that shares the Session root.
2. Export or copy the complete Session artifact without rewriting it.
3. Record the first scheduler error, affected turn and step, assistant call ids, existing `tool/call` events, existing `tool/result` events, and `turn/end` reason.
4. Classify each missing call:
   - no durable `tool/call`: the operation was not recorded as started;
   - durable `tool/call`, no result: the external outcome is unknown.
5. Start a fresh Session and carry forward only a reviewed summary plus verified external state.

Also capture the exact provider-visible message sequence on a redacted copy. Count every assistant call ID and tool-result ID, including empty and duplicate values. Join each wire item back to its immutable Session message and source. Do not publish tool arguments, results, prompts, or credentials merely to show the structure.

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

## Review a wire-only sanitizer

A serializer containment layer must be honest and deterministic.

### Missing result after an assistant call

Adding a synthetic provider `tool` message can make the request structurally acceptable, but its text must preserve uncertainty. A generic `(interrupted tool call)` does not say whether the call never started or may have produced an external effect. If the serializer cannot consult durable execution evidence, it must choose the more conservative unknown-outcome wording and emit telemetry that the durable history remains invalid.

Do not mutate the Session log from the adapter. The synthesized wire message is a request-scoped compatibility net, not a recovered event.

### Orphan tool result

Never fabricate an assistant call such as:

```json
{
  "id": "call_Z",
  "type": "function",
  "function": { "name": "tool", "arguments": "{}" }
}
```

That tells the model it previously chose a fake tool and arguments. Tool name is load-bearing routing evidence, not a placeholder field. If an orphan result must remain model-visible, convert it to clearly delimited, source-attributed evidence in a user/context message, or exclude it from the provider request while retaining it in diagnostics. Do not present it as an authentic tool protocol exchange.

### Ordering and algorithm state

Test the actual mutation order. If `flushPending()` first appends synthetic tool messages, “last message is assistant” may become unreachable in a following orphan branch. A branch that looks correct in isolation can never execute after the helper changes the array tail.

Use an ordered map rather than a set when original call order matters. Reject duplicate IDs before inserting them. Empty IDs cannot participate in correlation and must not silently fall into the orphan path.

### Boundary placement

Use three layers, each with a different job:

1. **Producer admission:** reject plugin or core messages that violate role, source, block, ID, and correlation invariants before they become durable.
2. **Agent-loop closure:** settle every requested call exactly once with truthful execution semantics before `turn/end`.
3. **Adapter containment:** prevent an old poisoned Session from producing a provider-invalid request, while emitting an observable repair classification.

Adapter containment is valuable defense in depth. It must not become the only fix, because other adapters, exports, compaction, replay, and future providers still consume the invalid durable history.

## Define a transcript validator

Run one linear validator over the provider-neutral message sequence before provider conversion:

- open assistant call IDs in original order;
- reject empty and duplicate IDs;
- accept exactly one matching result per open ID;
- reject or quarantine results for unknown IDs;
- close all pending calls before the next incompatible role boundary;
- retain message ID, source, turn/step/call provenance, and repair classification;
- never match a result to a call solely by array position;
- never reorder authentic calls/results to make a malformed transcript appear valid.

The validator should return a typed diagnostic rather than throw a raw `UNKNOWN` error. A repair mode must be explicit and versioned; validation-only mode is the safe default for new writes.

## Regression gates

- Parallel prepare failure closes every requested call id exactly once.
- Dispatch and finalization failures preserve the original error.
- Calls recorded as started use unknown-outcome semantics.
- Calls never recorded as started use not-started semantics.
- Side-effecting calls are never described as safely retryable by default.
- Cold resume produces a provider-valid transcript for both open and closed-error tails.
- DeepSeek and OpenAI-compatible serialization preserves call/result order.
- Repeated retry of a poisoned fixture is unnecessary because the first repaired request succeeds or fails for a new reason.
- An orphan result never fabricates an assistant tool name, arguments, or intent.
- Empty and duplicate call IDs fail before correlation.
- Equal call/result counts with mismatched IDs fail the identity ledger.
- A streamed tool-call block cannot close with an empty ID, name, or invalid argument representation.
- Compaction cuts are accepted by exact open-call identity, not cardinality alone.
- Request-boundary containment reports every excluded source block without rewriting durable history.
- Multiple parallel calls retain declaration order and exactly one result each.
- A malformed argument string can fail presentation without changing transcript cardinality.
- Serializer containment reports whether it used unknown-outcome or quarantined-orphan handling.
- The same poisoned fixtures are tested across DeepSeek and pi-ai/OpenAI-compatible adapters.
- Plugin admission rejects an invalid message before durable append and names the owning producer.

## Source boundary

Verified against DeepSeek Harness `0.1.0-rc.7` commit `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`, `0.1.1-rc.2` commit `b150a551b8d465e31e418e1b2eaf5e79bbb7d28e`, `0.1.2-alpha.1` commit `cd5ef8148158c3a752a658978873241fdf8e2bbc`, upstream reproductions #3415 and #4843, and community patch discussion #4668. The plugin-causality claim in #4668 remains unverified without a minimal producer-to-wire reproduction; the #4843 patch is reviewed as a proposal, not described as released behavior.

- [Upstream insufficient-tool-messages reproduction #3415](https://github.com/deepseek-ai/deepseek-harness/discussions/3415)
- [Cold-restart failed-recovery report #1695](https://github.com/deepseek-ai/deepseek-harness/discussions/1695#discussioncomment-18025447)
- [Community wire-sanitizer patch discussion #4668](https://github.com/deepseek-ai/deepseek-harness/discussions/4668)
- [Malformed and orphaned tool-call report #4843](https://github.com/deepseek-ai/deepseek-harness/discussions/4843)
- [Parallel tool scheduler failure path](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/agent-loop/src/tool-calls.ts)
- [Interrupted-turn repair semantics](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/session/src/repair.ts)
- [DeepSeek message serializer](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/llm/llm-deepseek/src/serialize.ts)
- [Official session persistence recovery contract](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/session/session-persistence/README.md)
- [rc.2 DeepSeek message serializer](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/llm-deepseek/src/serialize.ts)
- [rc.2 immutable message and source types](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/llm/src/message.ts)
- [alpha.1 DeepSeek streamed tool-call translation](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/llm/llm-deepseek/src/translate.ts)
- [alpha.1 compaction tool-pairing balance](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/compaction/compaction/src/tool-pairing.ts)
- [alpha.1 Agent request construction](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/core/agent-loop/src/agent.ts)
- [Session history recovery router](session-history-corruption-triage.md)
