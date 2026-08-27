---
title: Recover a Session Log with Duplicated Committed Sequence Numbers
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-27
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
---

# Recover a Session log with duplicated committed sequence numbers

Use this runbook for an error like:

    corrupt session log: seq gap in committed region
    (expected 267594, got 267590)

when inspection shows a committed range repeated before the sequence continues:

    267590 267591 267592 267593
    267590 267591 267592 267593
    267594 ...

This is not the recoverable newline-less crash tail supported by the JSONL backend. A complete later <code>turn/end</code> makes the earlier mismatch part of the committed region, so the scanner correctly refuses to guess which copy is authoritative.

## Freeze the evidence first

1. stop every DSH, Web, headless, ACP, SDK, test, watcher, and repair process that can reach the same Session root;
2. verify no remaining process owns the artifact;
3. copy the entire Session directory, not only the visible log;
4. hash the original and evidence copy;
5. record DSH version, profile, <code>DSH_HOME</code>, Session ID, root path, interruption time, and every process that shared it;
6. perform all decoding and experiments on another copy;
7. continue work in a fresh Session until the cause is understood.

Do not renumber events in place. Sequence numbers participate in references, indexes, replay, replacement semantics, request evidence, and tool lifecycle. A visually contiguous file can still be logically false.

## Classify the mismatch

| Shape | Classification | Safe direction |
|---|---|---|
| final incomplete record with no newline | supported torn-tail boundary | let the version-matched loader inspect and repair |
| expected N, got a larger number | missing committed interval | preserve; do not invent events |
| expected N, got an earlier sequence and later resumes at N | candidate duplicated range | prove byte/logical identity before any repair |
| same sequence numbers but different event data | divergent histories | no automatic deletion |
| duplicate range appears in two project roots | duplicate ownership/artifact topology | identify the authoritative Session location |
| corruption grows while inspecting | a writer is still active | stop and re-freeze |

The phrase “seq gap” covers both forward gaps and backward jumps. Preserve the exact <code>expected</code>, <code>got</code>, physical row number, and surrounding logical events.

## Route a same-seq foreign event as a hard conflict

[Report #4767](https://github.com/deepseek-ai/deepseek-harness/discussions/4767) adds a stronger failure shape: one sequence number labels two different logical events, and one payload appears to contain conversation text from another concurrently running Session. That is not an exact duplicate candidate. It is a divergent-history and possible cross-Session isolation incident.

Preserve both rows and collect:

```text
target Session id, cwd, profile, root, artifact digest
every concurrently running DSH PID, profile, DSH_HOME, cwd, and start time
first expected/got mismatch and both complete same-seq logical events
source Session/event references embedded in either payload
package-manager update time, loaded process start time, interrupts, and shutdown order
filesystem device/inode/size/timestamps before any move
```

An on-disk package update does not rewrite code already loaded in a long-running Node process. Record it as timeline evidence, but do not claim it caused the write. Likewise, two concurrent DSH processes are relevant only after proving that they resolved the same persistence root or that a plugin/shared service crossed their intended boundary.

If one event contains another Session's content, treat confidentiality as well as durability:

- do not paste the foreign payload into a public issue without redaction;
- preserve an unredacted evidence copy under restricted access;
- identify every Session or principal that could have received the material;
- rotate credentials only when evidence shows they were present or exposed;
- inspect custom plugins, shared roots, caches, IPC, and process topology before attributing the leak to the core writer.

Deleting the longer event because it “looks foreign” would erase the strongest causal evidence and still would not prove which event is authoritative. The default outcome remains quarantine plus a fresh Session; exact repair is unavailable when same-seq values differ.

## Do not recompress decoded JSONL with generic `zstd`

The default artifact is not one compressed JSONL stream. Its first independent checksummed Zstandard frame contains exactly one header line; each durable append batch is another concatenated frame. Decompressing, editing, and piping the result through a normal one-frame compressor changes that physical contract even when the JSON text looks valid. The rc.2 loader then correctly reports:

```text
corrupt Zstandard session log: first frame is not exactly one header line
```

This second error describes the replacement artifact, not the original root cause. Keep it separate in the incident timeline. Never overwrite the original with it. A format-aware repair tool must write the header as its own frame, encode later validated batches as separate frames, preserve checksums and the exact format version, then cold-load the staged artifact in an isolated Harness home.

## Understand the rc.8 protection boundary

The shared persistence coordinator serializes operations per Session ID and checks every incoming batch:

    event.seq === state.cursor + batchIndex

Only after <code>backend.appendBatch()</code> resolves does it advance the in-memory cursor. The write-behind controller also retains a failed batch for retry.

Therefore, a normal retry through the same live coordinator should reject a stale duplicate. A durable duplicate indicates that at least one assumption needs proof:

- two processes/coordinators wrote the same artifact;
- a third-party backend or direct writer bypassed the shared coordinator;
- a restart occurred after the backend made bytes durable but before the live state observed cursor advancement;
- artifact replacement or test setup restored an older cursor against a newer file;
- the physical decoder or report reconstructed packed rows incorrectly.

The rc.8 persistence contract explicitly says its revision freshness checks do not add cross-process writer exclusion. The report alone does not distinguish these branches.

## Prove an exact duplicate candidate

A version-aware analyzer should:

1. decode the header and every concatenated compression frame;
2. expand packed rows into individual <code>SessionEvent</code> values;
3. find the first sequence mismatch;
4. locate the unique earlier contiguous block whose sequence interval matches the backward-jump block;
5. compare canonical event values, including type, data, timestamp, identity, and every source/reference field;
6. require the post-candidate event to resume at the original expected sequence;
7. reject when the duplicate ends ambiguously, overlaps another candidate, changes any event, or contains unknown required event types;
8. validate complete Session, message, tool, turn, and replacement invariants after a hypothetical removal;
9. emit a report before emitting any replacement artifact.

Equal sequence numbers are not enough. Two attempts can reuse a number range while carrying different terminal outcomes.

## Choose a recovery outcome

### Quarantine and continue

Safest default. Keep the original immutable, hide or move only the affected Session through a recoverable operator process, and continue from a reviewed summary in a fresh Session.

### Read-only extraction

Decode the longest valid prefix and the candidate duplicate region into a separate report. Label it incomplete and do not present the extracted history as a resumable Session.

### Version-aware duplicate removal

Use only a purpose-built tool that understands the exact physical encoding and current event schema. It should write a new artifact in a staging directory, never modify the sole original. Promotion requires:

- unique exact duplicate proof;
- full post-repair invariant validation;
- cold load and replay in an isolated DSH home;
- preserved original plus hashes;
- atomic replacement while every writer remains stopped;
- an immediate rollback path.

A text editor is not such a tool. One physical packed row can represent many logical events, and a compressed artifact can contain multiple frames.

## Runtime repair contract

Prevention belongs at the durable compare-and-append boundary:

1. obtain exclusive per-artifact ownership across processes, not only a JavaScript Promise chain;
2. read/validate the current durable revision and next sequence inside the same critical section as append;
3. attach a stable batch/attempt identity to retries;
4. treat an already committed identical batch as idempotent success;
5. reject a same identity with different bytes/events;
6. reject a new identity whose first sequence is behind the durable cursor;
7. make backend commit acknowledgement recoverable after process interruption;
8. reopen/adopt state from storage after an ambiguous append result;
9. never retry retained write-behind work against a cursor known only from stale memory;
10. retain the committed-region scanner as a loud last defense.

For a file backend, an OS lock alone is insufficient if the check occurs before acquiring it or if replacement changes the inode. Ownership, revision comparison, append, sync, and acknowledgement must form one defined transaction.

## Regression matrix

| Scenario | Expected result |
|---|---|
| one coordinator, ordered batches | one contiguous durable sequence |
| same batch retried after acknowledged success | idempotent success, no new bytes |
| process interrupted after durable write before acknowledgement | reopen detects committed batch, no duplicate |
| two processes target one Session | second writer refused before append |
| same batch ID, different content | hard conflict |
| same seq, different event types or foreign Session content | quarantine; no automatic deletion or repair |
| stale sequence with new batch ID | hard conflict |
| incomplete final physical record | bounded torn-tail recovery |
| complete duplicate before <code>turn/end</code> | scanner refuses committed corruption |

## Acceptance gates

- [ ] all writers are stopped before evidence capture;
- [ ] original directory and hashes are preserved;
- [ ] packed and compressed records are fully decoded;
- [ ] the first mismatch and physical row are reported;
- [ ] duplicate proof compares complete event values;
- [ ] divergent same-seq events are never auto-deleted;
- [ ] suspected foreign content is handled as restricted isolation evidence;
- [ ] package-update timing is not confused with the code loaded by a live process;
- [ ] any staged compressed repair preserves the header-only first frame and append-frame layout;
- [ ] no event is renumbered;
- [ ] a repair is staged as a new artifact;
- [ ] full Session invariants pass after hypothetical removal;
- [ ] cold load/replay happens in an isolated home;
- [ ] rollback restores the untouched original;
- [ ] append ownership spans processes;
- [ ] durable cursor check and append share one critical section;
- [ ] ambiguous acknowledgement triggers storage reconciliation;
- [ ] idempotency uses batch identity in addition to sequence.

## Primary sources

Verified against DeepSeek Harness rc.8 <code>141eb6fef83422698aef7a981029e843e8161534</code> on 2026-08-20.

- [Official duplicated committed sequence report #3499](https://github.com/deepseek-ai/deepseek-harness/discussions/3499)
- [rc.2 same-seq foreign-content and generic-recompression report #4767](https://github.com/deepseek-ai/deepseek-harness/discussions/4767)
- [rc.2 JSONL/Zstandard physical and writer contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/session/session-persistence-jsonl/README.md)
- [rc.8 committed-region scanner](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/session/session-persistence-jsonl/src/format.ts)
- [rc.8 append cursor boundary](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/session/session-persistence/src/coordinator.ts)
- [rc.8 write-behind retry behavior](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/session/session-persistence/src/write-behind.ts)
- [rc.8 persistence invariants and cross-process limitation](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/session/session-persistence/README.md)
- [Session history corruption triage](session-history-corruption-triage.md)
- [Live Session log durability](live-session-log-durability.md)
