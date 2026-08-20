---
title: Interpret DeepSeek Harness token accounting
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
---

# Interpret token estimates, provider usage, and compaction pressure

DeepSeek Harness exposes several token figures because they answer different questions. Do not compare `surfaceTokens`, `pressureTokens`, `projectedTokens`, UI breakdown rows, provider billing usage, and compaction `totalTokens` as though they were one atomic measurement.

An rc.5 field report observed a tens-of-percent gap between the fixed four-characters-per-token heuristic and provider-reported usage in a long Session. At rc.8 source revision `141eb6f`, the runtime already anchors occupancy to provider usage when available and estimates only the surface delta since that sample. It also labels composition rows as approximate. Compaction uses the replay service's separate `measure()` contract and may deliberately retain a conservative estimated baseline.

## Choose the number by the question

| Field | Meaning | Exactness | Suitable use |
|---|---|---|---|
| provider usage input buckets | prompt tokens reported for one completed request | provider-reported | billing reconciliation and historical request evidence |
| `pressureTokens` | newest reported prompt size: uncached input + cache reads + cache writes | provider-reported, but stale until another request reports | last-request occupancy anchor |
| `projectedTokens` | `pressureTokens` plus signed heuristic surface movement since its sample | anchored estimate | UI estimate for the next request |
| `surfaceTokens` | current model-visible Session surface under the fixed estimator | heuristic | positional pricing and surface deltas |
| system/tools/messages breakdown | heuristic context composition | heuristic | relative composition, never an additive billing total |
| `measure().totalTokens` | baseline plus signed surface delta for compaction | usage-backed only when the anchor is reusable and conservative; otherwise estimated | automatic compaction pressure |
| cumulative `tokenUsage` | durable sum of usage buckets across calls | provider-reported samples | Session totals, not current context occupancy |

Output tokens belong in cumulative usage and a completed call's total cost, but not in the next prompt occupancy numerator. Reasoning is an output subdivision and must not be added again.

## Understand the rc.8 anchor

For the newest successful assistant call, token-meter records the canonical request header, the surface at step start plus the provider-produced assistant output, and the provider usage. A later `measure()` can reuse that usage only when:

1. the current request envelope matches the anchor envelope; and
2. provider total tokens are no lower than the full heuristic price at the anchor.

If both hold:

```text
totalTokens = provider usage anchor + signed heuristic surface delta
```

If the route/header changed, usage is missing, or the provider anchor is smaller than the heuristic anchor, the complete current envelope and surface are repriced heuristically. The second condition preserves conservative shrink/growth arithmetic; it also means a deployment can still observe compaction using an estimated baseline even though the provider returned usage.

## Why the UI rows do not add up

The rc.8 context meter headline reads `projectedTokens` when present, falling back to `pressureTokens`. Its system, tools, and messages rows remain fixed-density heuristic estimates. CJK text and JSON tool schemas can be severely underpriced at four characters per token, so the breakdown is intentionally approximate and is not expected to sum to the provider-anchored headline.

This is not evidence of double billing. It is evidence that the headline and rows have different measurement contracts.

The occupancy numerator and model capacity are also independent last-wins projection fields. Immediately after switching routes, an older usage sample can temporarily pair with the new route capacity until the next request reports usage. Treat that interval as stale, not as a same-request observation.

## Trace a surprising compaction

Capture one ordered evidence bundle:

```text
dsh version and source/build identity:
provider/model route before and after the turn:
adapter contextWindow:
resolved thresholdRatio and thresholdTokens:
latest request/header identity:
latest provider usage buckets:
measurement baseline kind and tokens:
surfaceDeltaTokens and totalTokens:
surfaceTokens and node count:
pressureTokens and projectedTokens:
last compaction trigger and shadowedTokenCount:
provider context-overflow response, if any:
```

Then route it:

- `baseline.kind = usage`: compare the matching provider sample and signed surface delta.
- `baseline.kind = estimated`: determine whether the header changed, usage was absent, or the conservative-anchor check rejected it.
- early pressure compaction with a valid usage baseline: verify adapter capacity and target-specific policy, not only the heuristic.
- late provider overflow: preserve the provider error; rc.8 has an independent `context-overflow` recovery path that bypasses the normal pressure threshold.
- UI percentage differs from compaction logs: compare contracts and log revisions before calling either wrong.

## Calibrate without corrupting ownership

Do not replace the global `CHARS_PER_TOKEN` constant from one Session sample. Tokenization differs by provider, model, language, JSON schema, cache semantics, images, and hidden provider framing. A global coefficient can improve one route while making another unsafe.

For deployment analysis, export sanitized per-request observations keyed by exact provider/model and build:

```text
heuristic anchor
reported uncached input
cache read and write
reported output
language/content class
tool-schema bytes
absolute and relative error
```

Use percentiles, not only the mean. Keep pricing analytics outside the runtime decision path until provenance, route coverage, minimum samples, drift detection, fallback behavior, and rollback are defined.

## Regression contract

- provider input buckets are not mixed with output occupancy;
- cache reads and writes follow the adapter's documented usage semantics;
- a usage sample replaces the same turn/step sample instead of double-counting;
- reasoning remains a subdivision of output;
- provider anchoring requires matching canonical headers;
- signed deltas react to append and compaction replacement;
- a smaller provider anchor cannot make conservative delta arithmetic unsafe;
- route changes visibly invalidate same-request interpretation;
- UI heuristic rows remain marked approximate;
- compaction decisions log baseline kind, revision, route, capacity, and threshold;
- context-overflow recovery remains available when estimation is wrong; and
- CJK, JSON-heavy tools, cached prompts, empty assistant output, and post-compaction tails are covered.

## Primary evidence

- [Official token-meter accuracy proposal #3514](https://github.com/deepseek-ai/deepseek-harness/discussions/3514)
- [rc.8 token-meter contract](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/token-meter/README.md)
- [rc.8 replay measurement and usage anchor](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/token-meter/src/index.ts)
- [rc.8 provider-anchored context projection](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/token-meter/src/usage-projection.ts)
- [rc.8 compaction pressure decision](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/compaction/compaction-basic/src/index.ts)

