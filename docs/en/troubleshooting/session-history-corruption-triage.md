---
title: Recover DeepSeek Harness Session History Without Destroying Evidence
locale: en
content_revision: 3
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

These failures can look identical to an empty or exhausted history, but they cross physical storage, logical ordering, message construction, projection, and read-state boundaries. Do not rewrite a log until you know which boundary failed.

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
| older messages disappear without a visible error | history read state | genuine exhaustion, empty page, discontinuity, Remote failure, and projection failure remain distinguishable | preserve browser console/RPC evidence and compare the durable range before touching storage |

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

## Failure E: “no more history” hides a read failure

An empty visible page does not prove that the durable history ended. Keep these five outcomes separate:

| Outcome | Durable meaning | Required UI state |
|---|---|---|
| `events=[]`, `hasMore=false` from a valid bounded request | genuine exhaustion | end of history |
| `events=[]`, `hasMore=true` | page could not produce message-aligned entries but older data is still claimed | keep Load earlier available and expose diagnostics |
| page tail does not immediately precede the current base sequence | discontinuity or wrong cursor/source generation | visible gap with expected and received seq; retry or resync |
| Remote or carrier returns an error | read unavailable | retryable/terminal load failure, never end of history |
| event page is valid but a presenter/assembler rejects it | projection unavailable | preserve raw-history access and name the failed projection |

At rc.2, `loadOlder()` does not preserve that distinction for the operator. A non-OK history result leaves the current window unchanged without publishing a load error. A discontinuous page logs to the browser console, clears `hasMore`, and prepends an empty terminal page. A thrown error is also console-only. The visible effect can therefore be indistinguishable from reaching the beginning even when the durable file was not examined or modified.

Do not infer from that symptom that a trailing aborted turn corrupted the artifact. First prove four facts on an immutable copy:

```text
requested beforeSeq and maxMessages:
response event first/tail seq and hasMore:
current client baseSeq before the request:
durable source range and exact turn/end reason at the boundary:
```

If the response is contiguous and the assembler alone fails, preserve the valid page and isolate the responsible node definition. If the Host refuses the read, preserve its typed failure. If the page is discontinuous, preserve both sides of the expected/got boundary. Manual truncation erases precisely the evidence needed to distinguish those cases.

### Alpha.1 changes one half of the problem

At `0.1.2-alpha.1` commit `cd5ef81481`, Session history moved to an addressed journal stream. `RemoteJournalStream` validates packed record ranges, repairs live gaps by rereading through a fixed cursor, and rejects a discontinuous older page. The Agent Loop also persists a cancelled Assistant prefix with `interrupted: true`, and the Chat projection renders it with a stopped marker. Those are meaningful improvements: an interrupted turn has a first-class durable/rendered representation, and live stream gaps have an owned repair path.

The load-state distinction is still incomplete. `Session.loadOlder()` catches page errors; a discontinuous prepend first publishes an empty page with `hasMore=false` and then throws. The Session-level catch does not expose that error in its public snapshot. Alpha.1 therefore improves interrupted content and journal integrity without proving that every “Load earlier” failure is visibly distinguishable from exhaustion.

A complete read contract should publish one immutable outcome per request:

- `loaded`: contiguous entries and the authoritative next `hasMore` value;
- `exhausted`: a validated empty terminal range;
- `retryable-failure`: carrier or temporary Host failure while retaining the previous cursor and `hasMore`;
- `gap`: expected/received cursor plus a resync action;
- `projection-failure`: raw range retained, failed presenter named, degraded rendering explicit.

Never set `hasMore=false` merely to contain a failed request. That Boolean is durable-range knowledge, not an error latch.

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
- Exhaustion, empty nonterminal pages, Remote failures, sequence gaps, and projection failures produce different observable states.
- A failed older-page request retains the last authoritative cursor and `hasMore` until a validated replacement arrives.
- Trailing aborted turns and cancelled Assistant prefixes remain renderable after cold reload.
- Alpha.1 packed history ranges validate first and last logical seq, not only record count.
- Original evidence remains byte-for-byte preserved and rollback is tested.

## Source boundary

Verified against DeepSeek Harness `0.1.0-rc.7` commit `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`, `0.1.1-rc.2` commit `b150a551b8d465e31e418e1b2eaf5e79bbb7d28e`, and alpha.1 source commit `cd5ef8148158c3a752a658978873241fdf8e2bbc` on 2026-08-28.

- [Repeated tool-call ID reproduction #3408](https://github.com/deepseek-ai/deepseek-harness/discussions/3408)
- [One corrupt artifact hides the sidebar #3404](https://github.com/deepseek-ai/deepseek-harness/discussions/3404)
- [Concurrent writers create a sequence gap #3401](https://github.com/deepseek-ai/deepseek-harness/discussions/3401)
- [Id-less plugin notice report #4819](https://github.com/deepseek-ai/deepseek-harness/discussions/4819)
- [Silent “no more history” contract analysis #4795](https://github.com/deepseek-ai/deepseek-harness/discussions/4795)
- [Zstandard header-frame validation](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/session/session-persistence-jsonl/src/index.ts)
- [Committed sequence scanner](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/session/session-persistence-jsonl/src/format.ts)
- [Conversation window rebuild](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/client/runtime/src/client/sessions/conversation-assembler.ts)
- [Tool conversation identity](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/client/ui-conversation/src/client/conversation-nodes/tool.ts)
- [rc.2 live Session append and cold-load message validation](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/core/session/src/index.ts)
- [rc.2 identified message constructors](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/llm/src/message.ts)
- [rc.2 Inbox persistence and identity check](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/core/agent/src/inbox.ts)
- [rc.2 Zstandard header-only listing boundary](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/session/session-persistence-jsonl/src/index.ts)
- [rc.2 fail-soft older-page handling](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/runtime/src/client/sessions/session.ts)
- [alpha.1 Session journal transport](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/api/session-controller/src/client/transport.ts)
- [alpha.1 older-page Session handling](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/api/session-controller/src/client/sessions/session.ts)
- [Live session log protection](live-session-log-durability.md)
