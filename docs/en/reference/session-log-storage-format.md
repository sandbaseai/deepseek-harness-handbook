---
title: DeepSeek Harness Session Log Storage Format
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-28
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
sources:
  - https://github.com/deepseek-ai/deepseek-harness/discussions/4910
---

# Read a DeepSeek Harness Session log without losing packed output

A DeepSeek Harness Session log is not simply “one `SessionEvent` per JSONL line.” In rc.8, the default JSONL backend adds two physical transformations:

1. the logical JSONL is stored as concatenated, checksummed Zstandard frames by default; and
2. runs of streamed assistant deltas are stored as `text-chunks`, `reasoning-chunks`, or `tool-call-chunks` rows by default.

Those packed rows are storage records, not Session events. A parser that recognizes only the generated event catalog can silently omit most assistant output.

## Version refusal is not a migration strategy

Architecture report [#4910](https://github.com/deepseek-ai/deepseek-harness/discussions/4910) inventories several persistence layers that stamp a version and hard-refuse anything non-current, while shipping no migration, mixed-root fallback, or dual-write path. A reader must therefore distinguish **unsupported format** from **corrupt data**: an older, structurally valid header is not permission to rewrite the file, and upgrading the executable does not prove that an old Session can load.

Before changing a format, record the exact version at each boundary—Session header, persistence backend, subagent descriptor, upload index, and provider replay—and define one of `migrate`, `read-old/write-new`, `dual-write`, `export-only`, or `reject-with-preserved-evidence`. Test the rollback story with a copied root. If the current build rejects the version, preserve the original bytes, emit an actionable disposition, and use a supported export or pinned reader; never “repair” the header in place or silently drop unknown fields.

For maintainers, the minimum evolution fixture writes a representative v0 root, opens it with the next reader, exercises normal replay and append, interrupts during conversion, and opens the result with both readers. Acceptance requires an atomic destination, a resumable or clearly restartable migration, a retained source digest, explicit mixed-version policy, and a user-visible failure when no safe path exists. The format version must change together with its documented migration contract, not merely with a schema edit.

## The four layers

```text
session.jsonl.zstd
  └─ concatenated Zstandard frames
       └─ newline-delimited storage records
            └─ SessionEvent or packed chunk row
                 └─ decoded contiguous SessionEvent stream
```

Keep the layers separate:

| Layer | What exists | Correct reader responsibility |
|---|---|---|
| artifact | `session.jsonl.zstd` by default, or `session.jsonl` with compression disabled | select the encoding configured for that root |
| framing | one checksummed header frame, then one frame per durable append batch | decode complete frames in order; do not treat the file as one frame |
| storage row | header, ordinary event, or one of three packed-row types | classify packed rows before event validation |
| logical history | contiguous `SessionEvent.seq` values | expand every packed row and then validate sequence continuity |

The generated persistence catalog describes the logical event taxonomy. It does not, by itself, define every physical storage-row type.

## The first record is a header

The first logical line is an immutable Session header with the bare type `session`. Among other identity fields, it carries the format version, Session id, creation time, delegation depth, optional working directory, and optional Agent preset.

It is not event sequence zero. Event sequence validation starts with the records after the header.

The default compressed artifact places that header alone in the first checksummed Zstandard frame. Each durable append batch becomes another independently decodable frame. Concatenation is therefore part of the format, not accidental trailing data.

## The three packed-row types

With `packChunks: true`—the default—an eligible run of at least three consecutive, same-block `assistant/chunk` delta events becomes one row.

| Storage-row type | Expands to | Per-member payload |
|---|---|---|
| `text-chunks` | `assistant/chunk` with `text-delta` | `data.texts[]` |
| `reasoning-chunks` | `assistant/chunk` with `reasoning-delta` | `data.texts[]` |
| `tool-call-chunks` | `assistant/chunk` with `tool-call-delta` | `data.args[]`, plus shared call id and optional name |

All three rows carry:

- `seq0`: sequence number of the first reconstructed event;
- `time0`: timestamp of the first event;
- `data.turn`, `data.step`, and `data.index`: the shared stream position; and
- `data.dt`: timestamp gaps between members.

For member `k`, the sequence is `seq0 + k`. Its timestamp is `time0` plus the first `k` values in `dt`. Text and argument fragments remain separate; token boundaries are durable data and must not be joined before reconstruction.

Example, shortened for readability:

```json
{
  "type": "text-chunks",
  "seq0": 10,
  "time0": 1787150994000,
  "data": {
    "turn": 1,
    "step": 1,
    "index": 0,
    "dt": [21, 1, 0, 20],
    "texts": ["He", "llo", ", ", "wor", "ld"]
  }
}
```

This represents five events with sequence numbers 10 through 14—not one event with no `seq`.

## Why a naïve parser loses data

These patterns are wrong:

```js
// Wrong: packed rows have seq0, not seq.
if (typeof row.seq !== 'number') continue

// Wrong: packed row tags are deliberately absent from SessionEventMap.
if (!knownSessionEventTypes.has(row.type)) continue

// Wrong: a .jsonl.zstd artifact is a concatenation of frames.
const plaintext = decompressOneFrame(file)
```

The failure can look healthy: the parser sees the header, turn boundaries, usage, and some non-packed events, while silently dropping text, reasoning, or tool-call argument deltas.

## The supported decoding boundary

The source of truth is the shared `@deepseek-ai/dsh-session` codec:

```ts
import { decodeStorageRecord } from '@deepseek-ai/dsh-session'

const events = logicalLines
  .slice(1) // header is not a SessionEvent
  .flatMap(line => decodeStorageRecord(JSON.parse(line)))
```

`decodeStorageRecord` validates a recognized packed-row tag and expands it into the exact original events. Unknown non-packed values pass through for the normal event reader to handle. A malformed recognized packed row throws instead of dropping a whole run.

Do not copy the row decoder into an independent application unless you also own format-version tracking and regression fixtures. Prefer the shipped codec or consume a logical export produced by the runtime.

## A safe read-only inspection procedure

1. Stop or quiesce the Session writer, or use the official Session-log export path. Do not inspect a changing file and call the result a consistent snapshot.
2. Copy the raw artifact and record its path, size, modification time, and hash.
3. Read the header first and reject a format version the reader does not support.
4. For `.jsonl.zstd`, decode every complete concatenated frame in order and verify checksums. A partial final frame is a crash boundary, not permission to ignore corruption in an earlier complete frame.
5. Parse newline-terminated logical records only.
6. Run every post-header value through `decodeStorageRecord`.
7. Require the expanded event sequence to be contiguous from zero.
8. Report the decoded event count separately from the physical row count.

For temporary diagnostics, a new isolated persistence root with `compression: none` makes records line-readable, and `packChunks: false` makes new writes one event per line. These are write-layout options, not migration commands: they do not rewrite an existing root, and the reader still accepts packed rows unconditionally.

## Reader acceptance gates

A Session-log reader is not ready until it proves all of these:

- reads both `.jsonl` and concatenated `.jsonl.zstd` artifacts;
- validates the header before event rows;
- rejects unsupported format versions explicitly;
- expands all three packed-row types;
- preserves text fragment and tool-argument fragment boundaries;
- reconstructs `seq` and `time` exactly, including negative timestamp gaps;
- reads packed, unpacked, and mixed layouts identically;
- fails loudly on a malformed recognized packed row;
- detects sequence gaps in a committed region;
- distinguishes a recoverable incomplete tail from earlier corruption; and
- never mutates the only copy of a live Session log.

The strongest regression is a round trip: create a known event stream containing text, reasoning, and tool-call delta runs; encode it with `packChunkRuns`; JSON round-trip each row; decode with `decodeStorageRecord`; and require deep equality with the original events.

## Primary sources

- [rc.8 JSONL persistence README](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/session/session-persistence-jsonl/README.md)
- [rc.8 packed-row codec](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/core/session/src/chunk-rows.ts)
- [rc.8 JSONL scanner and `eventLines`](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/session/session-persistence-jsonl/src/format.ts)
- [Official packed-row catalog gap report](https://github.com/deepseek-ai/deepseek-harness/discussions/3458)
- [Persistence format evolution gap report](https://github.com/deepseek-ai/deepseek-harness/discussions/4910)

## Related handbook guides

- [Protect live Session logs](../troubleshooting/live-session-log-durability.md)
- [Recover Session history without destroying evidence](../troubleshooting/session-history-corruption-triage.md)
- [Keep Session roots single-writer](../operations/single-writer-session-roots.md)
- [Separate Sessions from long-term memory](../architecture/sessions-vs-memory.md)
