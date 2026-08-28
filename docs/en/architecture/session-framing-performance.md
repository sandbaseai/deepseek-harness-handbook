---
title: Measure Session Framing Performance
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-30
upstream_revision: cd5ef8148158c3a752a658978873241fdf8e2bbc
---

# Measure Session framing before optimizing the UI

Session cold-open cost can be dominated by physical zstd frame count rather than JSON decoding. Upstream measurement [#4949](https://github.com/deepseek-ai/deepseek-harness/discussions/4949) timed four real rc.2 artifacts through the official reader and found decompression responsible for roughly 80% of the decode path. Reframing one 12.7 MB sample from 42,354 frames to two reduced decompression from 583 ms to 39 ms and storage from 12.7 MB to 4.7 MB.

## Keep the measurement boundaries honest

The result is a decode-path measurement, not an end-to-end UI promise. Separate these stages:

| Stage | Record |
|---|---|
| file read and frame scan | bytes, frame count, scan time |
| per-frame zstd decompress | total and share of decode time |
| line split and `JSON.parse` | parse time and event count |
| row/event decode | decode time and failures |
| UI projection | measured separately from the reader path |

Use the published npm reader for the release under test, keep Session content local, shorten identifiers in output, and report medians or a documented single-run caveat. Do not infer a production-wide speedup from one synthetic file.

## Interpret frame merging

Small append batches create many independent compression windows. Fixed zstd headers and checksums add overhead, but the larger effect is lost cross-frame redundancy: a 300-byte frame cannot exploit matches elsewhere in a long log. A merge strategy therefore changes both storage and decompression cost.

Treat frame merging as a physical-format change. The first frame must preserve the official header-line contract, and the resulting artifact must still pass `Session.fromRestore`, frame assertions, and the corruption-corpus expectations. A file that is smaller but unreadable is not an optimization.

## Evaluate a candidate safely

1. Capture a before sample with frame count, bytes, events, and stage timings.
2. Reframe only a copy, preserving the original artifact and source revision.
3. Run the same official reader and compare every stage, not only total time.
4. Run healthy and known-corrupt corpus rows, including partial tails and duplicate-sequence cases.
5. Measure UI projection separately before claiming cold-open improvement.

The roadmap's seek/index and frame-merge stages are complementary: fewer frames reduce physical work, while an index can avoid scanning irrelevant frames. Keep both changes behind the same reader and recovery acceptance gates.

Primary source: [upstream discussion #4949](https://github.com/deepseek-ai/deepseek-harness/discussions/4949).
