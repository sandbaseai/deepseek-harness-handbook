---
title: Protect Session Write Integrity
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-29
upstream_revision: cd5ef8148158c3a752a658978873241fdf8e2bbc
---

# Protect Session write integrity before debugging the reader

Use this architecture note when a Session shows duplicate sequence numbers, a corrupt zstd tail, or recovery events that overlap a live turn. Upstream proposal [#4942](https://github.com/deepseek-ai/deepseek-harness/discussions/4942) groups the corruption family into three write-side gaps, with a fourth crash-window detail that must be designed with them.

## The three writer invariants

| Invariant | Failure without it | Evidence to require |
|---|---|---|
| Committed append watermark travels with the durable event prefix | a restarted writer derives `seq` from stale in-memory log length | persisted cursor or an equivalent committed-prefix derivation in the same batch |
| One writer owns a Session append window across write and fsync | Web, desktop, or two profiles append duplicate sequence numbers | per-Session lock or advisory exclusion plus a changed-since-read check |
| Recovery proves the old executor is dead before synthesizing closers | repair events overlap a still-running turn and reuse sequence space | lease/heartbeat or an equivalent liveness proof before `interruptedTurnClosers` |

These are write-side contracts. A reader that tolerates malformed tails can contain an incident, but it cannot prove that a repaired Session is causally correct.

## Treat the crash tail as a separate case

The append path has a narrow failure window between writing bytes and rolling back or advancing its cursor. A process crash there can leave a partial final record. A lock that only serializes writers does not define whether those bytes are committed; a durable cursor that only records the batch does not repair a torn tail. Lock ownership, cursor durability, fsync ordering, and recovery classification must be tested as one feature.

Keep real Session artifacts local and publish only PII-safe metadata. A useful synthetic corpus row is: torn last record, followed by later valid events from a second writer. The expected result must be explicit before a candidate fix is evaluated.

## Verify with concurrency, not only unit tests

The minimum verification matrix is:

1. two processes append to one Session while a third observer records sequence and byte order;
2. a writer is interrupted between append and cursor commit;
3. an idle bridge disposes an Agent while its executor may still be live, then a resume path repairs it;
4. the same Session is reopened cold and decoded through the official restore/scanner path;
5. every row reports whether bytes, sequence identity, and logical turn closure remain valid.

Single-process tests can validate encoding, but they do not exercise the interleaving that creates duplicate sequence numbers. Do not call a read-side quarantine a fix for a writer race.

## Operator containment

Until the write-side contracts are proven in the exact release you run:

- stop every DSH process that can reach the Session before repair;
- preserve the original log and profile metadata read-only;
- avoid running Web and desktop against the same writable `DSH_HOME`;
- prefer a fresh Session over file surgery when causality cannot be reconstructed;
- record the process identities, Session path, last committed event, and whether a repair writer was active.

Primary source: [upstream discussion #4942](https://github.com/deepseek-ai/deepseek-harness/discussions/4942), including its alpha.1 source anchors and corruption-corpus proposal.
