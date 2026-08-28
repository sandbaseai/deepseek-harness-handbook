---
title: Recover DeepSeek Harness Session History Without Destroying Evidence
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-28
upstream_revision: cd5ef8148158c3a752a658978873241fdf8e2bbc
---

# Recover session history without destroying evidence

Use this runbook when DeepSeek Harness shows an empty session sidebar, refuses to load one conversation, or throws one of these signatures:

```text
corrupt Zstandard session log: first frame is not exactly one header line
corrupt session log: seq gap in committed region
conversation Context ... received more than one start Match
stored session ... failed validation: session event at seq N lacks an identified message
```

These failures look similar in the Web UI, but they cross three different boundaries. Do not rewrite a log until you know which boundary failed.

## Stop before inspecting

1. Stop every DSH process that can write the same session root.
2. Copy the complete affected session directory, including the original compressed artifact.
3. Hash the copy and the original; work only on a disposable copy.
4. Record the DSH version, profile, session root, session id, process list, and exact error.

Never run a generic decompression/recompression command against a live artifact. A byte-valid replacement can still violate the session format's frame or sequence invariants.

## Route the signature

| Signature | Failed boundary | What the source enforces | First safe action |
|---|---|---|---|
| first frame is not exactly one header line | physical Zstandard framing | the independently decoded first frame contains exactly the header plus one newline | quarantine the file; inspect frame layout on a copy |
| seq gap in committed region | logical event ordering | committed events match the zero-based contiguous sequence expected by the scanner | prove whether multiple writers shared the root; preserve both timeline and bytes |
| more than one start Match | client conversation projection | one start match exists for each conversation context key | reproduce with the same provider on a copied session; do not edit durable events first |
| lacks an identified message | logical message construction | every `user/message`, `assistant/message`, and `tool/result` carries a non-empty id, correct role, source, and content | identify the producer and preserve the preceding inbox events before any repair |

The third error can occur even when the persisted file is healthy. In rc.7 the tool conversation node matches a root tool call by its bare `callId`. Some OpenAI-compatible gateways restart identifiers such as `call_0` on each request. When a loaded window contains two starts with the same identifier, `replaceWindow` replays both into the client assembler and the context key collides.

## Failure A: one corrupt artifact hides the sidebar

The JSONL persistence backend reads only the first Zstandard frame to list session metadata. It validates that decoded frame as one header line. An artifact recompressed as one large frame contains the header and events together, so header validation fails before the list can isolate healthy sessions.

Recovery boundary:

- move the suspect session directory out of the active root while DSH is stopped;
- restart and confirm the other sessions return;
- retain the quarantined copy for an upstream report or format-aware repair;
- restore only after a reader compatible with the exact format validates it.

Do not assume `zstd -dc file | zstd -o file` is a repair. It normally changes a multi-frame artifact into a different physical layout.

## Failure B: the committed sequence goes backward

The scanner accepts a torn final record by ignoring an incomplete tail, but it does not accept a gap inside a committed region. Every decoded event must have `event.seq === events.length`; a later committed `turn/end` makes the earlier mismatch fatal.

A backwards jump after two DSH processes used the same session root is evidence of a single-writer violation. Stop the duplicate owner first. Renumbering events may make one parser pass while breaking references, packed rows, checksums, or external evidence. Prefer a new session plus an archived transcript unless a version-specific recovery tool owns all invariants.

## Failure C: repeated provider call IDs break history projection

The durable log may scan correctly while the Web conversation projection fails. `replaceWindow` sorts the loaded events, rebuilds its location index, then matches every entry. The rc.7 tool definition derives its start identity from `String(event.data.callId)`, without turn or step scope.

Prove the collision without mutating the log:

1. Export or inspect a copy of the event stream.
2. Group root `tool/call` events by `callId` and retain `turn`, `step`, and `seq`.
3. Confirm the same bare id starts more than once across different steps.
4. Compare the same task through a provider that emits globally unique call IDs.

A durable source fix must scope both call and result lookup consistently, for example by turn, step, and call id. It also needs regression coverage for approval frames and root-call lookup paths that may carry only the bare id.

## Failure D: a plugin notice bypasses message construction

Official report #4819 contains an id-less `user/message` whose source says `kind: plugin`, `form: notice`, and whose summary describes an automatic continuation after an empty reasoning-only response. The official rc.2 and alpha.1 source trees contain neither that summary nor the reported continuation text. Do not assign the producer to `dsh-agent-loop` from the persisted event alone: the Agent Loop accepts plugin messages from other components and commits them at the next step.

The official boundary is precise:

```text
producer
  → createUserMessage({ content, source })  // creates id + role
  → agent.inject / steer / followup
  → agent/inbox/spliced
  → session.append('user/message', message)
  → cold-load assertMessageEventShape
```

In rc.2, `agent.inject()`, `steer()`, and `followup()` are typed to accept a complete `UserMessage`, not an untyped input. `createUserMessage()` adds a UUID identity and `role: user`, then freezes the message. A JavaScript plugin, cast, patched package, or out-of-tree writer can still bypass that compile-time contract.

There is also a fail-late gap worth testing upstream. The live `Session.append()` path snapshots JSON, validates request headers and surface transitions, and then commits; it does not call the cold-load `assertMessageEventShape()` used by restore. The Inbox's uniqueness check likewise allows the first runtime `undefined` identity because it only detects duplicates. A malformed plugin message can therefore enter `agent/inbox/spliced` and later `user/message`, flush successfully, and fail only when the Session is restored.

This does **not** justify making cold-load validation lenient. Message identity correlates queue edits, claims, surface nodes, replay, and client projection. Silently skipping one notice changes durable history; assigning a fresh UUID only to the final `user/message` can disagree with the earlier inbox insertion that carried the same malformed object.

Capture this stopped-writer incident slice from an exported or copied logical JSONL:

```text
producing DSH and plugin package versions:
first id-less event seq and type:
nearest earlier agent/inbox/spliced insertion:
turn/start and step/start owning the user/message:
exact source.kind / plugin / form / summary:
other events carrying the same content or intended identity:
physical artifact hash and frame inventory:
```

Search the exact `source.plugin`, summary, and text across the installed profile and every external Bundle. A `source.kind: plugin` value identifies the class of source, not the package that physically created it; the `plugin` field and installed bytes are the stronger attribution evidence.

The source repair belongs at both edges:

1. the producer must call `createUserMessage()` before delivery;
2. the receiving runtime should reject an unidentified message before the inbox splice or `user/message` enters the live log;
3. regression coverage must cold-reload the produced log, not stop after a successful live turn;
4. failure must name the producer/source and leave the prior valid Session prefix recoverable without silently dropping content.

For an existing log, keep the original immutable and quarantine only that Session while writers are stopped. Manual multi-frame patching is expert-only: every occurrence of the logical message must receive one consistent identity, every frame checksum and boundary must remain valid, the first frame must still decode to exactly one header line, event sequence and surface invariants must pass, and a disposable cold load must succeed before replacement.

An id-less later event and a root-wide `corrupt Zstandard session log` are two different failures. `listArtifacts()` reads and validates only the independently compressed header frame; it does not inspect later message ids. If a repair recompresses the whole logical JSONL into one frame, the new physical header-frame error can hide every Session during listing even though the original defect affected one Session on full load. Preserve the pre-repair bytes and diagnose both boundaries separately.

## Recovery decision

Choose the least destructive route that restores operation:

- **Need the other sessions now:** quarantine only the identified bad session while all writers are stopped.
- **Need conversation content, not continuation:** preserve the original and extract a read-only transcript from a copy.
- **Need to continue working:** start a fresh session and attach the preserved transcript or summary as evidence.
- **Need exact durable recovery:** wait for or build a format-aware tool pinned to the producing version; validate on a copy before replacement.

## Regression gates

- One malformed artifact does not hide healthy sessions.
- Errors identify the session id or path without leaking message content.
- The first Zstandard frame is exactly one header line.
- Committed event sequences are contiguous; torn-tail recovery remains bounded to the tail.
- Two processes cannot append to one session concurrently.
- Reused provider call IDs across turns and steps render as separate tool lifecycles.
- Tool results, approvals, and nested calls resolve to the intended start.
- Every plugin-produced message is identified before inbox insertion and live append.
- A malformed message fails before persistence; a valid plugin notice passes a cold-reload test.
- A repair preserves one identity across inbox and message events rather than patching only the load error.
- Original evidence remains byte-for-byte preserved and rollback is tested.

## Source boundary

Verified against DeepSeek Harness `0.1.0-rc.7` commit `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`, `0.1.1-rc.2` commit `b150a551b8d465e31e418e1b2eaf5e79bbb7d28e`, and alpha.1 source commit `cd5ef8148158c3a752a658978873241fdf8e2bbc` on 2026-08-28.

- [Repeated tool-call ID reproduction #3408](https://github.com/deepseek-ai/deepseek-harness/discussions/3408)
- [One corrupt artifact hides the sidebar #3404](https://github.com/deepseek-ai/deepseek-harness/discussions/3404)
- [Concurrent writers create a sequence gap #3401](https://github.com/deepseek-ai/deepseek-harness/discussions/3401)
- [Id-less plugin notice report #4819](https://github.com/deepseek-ai/deepseek-harness/discussions/4819)
- [Zstandard header-frame validation](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/session/session-persistence-jsonl/src/index.ts)
- [Committed sequence scanner](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/session/session-persistence-jsonl/src/format.ts)
- [Conversation window rebuild](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/client/runtime/src/client/sessions/conversation-assembler.ts)
- [Tool conversation identity](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/client/ui-conversation/src/client/conversation-nodes/tool.ts)
- [rc.2 live Session append and cold-load message validation](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/core/session/src/index.ts)
- [rc.2 identified message constructors](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/llm/src/message.ts)
- [rc.2 Inbox persistence and identity check](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/core/agent/src/inbox.ts)
- [rc.2 Zstandard header-only listing boundary](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/session/session-persistence-jsonl/src/index.ts)
- [Live session log protection](live-session-log-durability.md)
