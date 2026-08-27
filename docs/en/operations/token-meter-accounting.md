---
title: Interpret DeepSeek Harness token accounting
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-27
upstream_revision: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Interpret token estimates, provider usage, and compaction pressure

DeepSeek Harness exposes several token figures because they answer different questions. Do not compare `surfaceTokens`, `pressureTokens`, `projectedTokens`, UI breakdown rows, provider billing usage, and compaction `totalTokens` as though they were one atomic measurement.

An rc.5 field report observed a tens-of-percent gap between the fixed four-characters-per-token heuristic and provider-reported usage in a long Session. At rc.2 source revision `b150a55`, the runtime anchors occupancy to provider usage when available and estimates only the surface delta since that sample. It also labels composition rows as approximate. Compaction uses the replay service's separate `measure()` contract and may deliberately retain a conservative estimated baseline.

Two rc.2 reports expose a more serious edge: a wide replacement can make the signed heuristic accumulator negative. Although the number is display/measurement state rather than request payload, its nonnegative schema rejects the projection and can fail every later turn. Treat that as a projection availability incident, not evidence that the provider billed negative tokens.

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

## Understand the rc.2 anchor

For the newest successful assistant call, token-meter records the canonical request header, the surface at step start plus the provider-produced assistant output, and the provider usage. A later `measure()` can reuse that usage only when:

1. the current request envelope matches the anchor envelope; and
2. provider total tokens are no lower than the full heuristic price at the anchor.

If both hold:

```text
totalTokens = provider usage anchor + signed heuristic surface delta
```

If the route/header changed, usage is missing, or the provider anchor is smaller than the heuristic anchor, the complete current envelope and surface are repriced heuristically. The second condition preserves conservative shrink/growth arithmetic; it also means a deployment can still observe compaction using an estimated baseline even though the provider returned usage.

## Why the UI rows do not add up

The rc.2 context meter headline reads `projectedTokens` when present, falling back to `pressureTokens`. Its system, tools, and messages rows remain fixed-density heuristic estimates. CJK text and JSON tool schemas can be severely underpriced at four characters per token, so the breakdown is intentionally approximate and is not expected to sum to the provider-anchored headline.

This is not evidence of double billing. It is evidence that the headline and rows have different measurement contracts.

The occupancy numerator and model capacity are also independent last-wins projection fields. Immediately after switching routes, an older usage sample can temporarily pair with the new route capacity until the next request reports usage. Treat that interval as stale, not as a same-request observation.

## Route `messageTokens` underflow without abandoning the Session

The shared surface fold emits signed deltas. A compaction replacement uses:

```text
deltaTokens = replacement estimate - shadowed token claim
```

The accumulator assumes its current total includes everything priced by the subtraction. A restored checkpoint or historical compatibility path can violate that assumption: the claim covers a wider surface than this projection personally folded. The next state becomes negative, while both state and wire schemas require a nonnegative integer.

Observed signature:

```text
Too small: expected number to be >= 0
path: ["messageTokens"]
```

This is not merely a bad UI row. Projection validation can fail before the next turn proceeds, and repeated retries reproduce the same deterministic state.

Immediate response:

1. Stop retrying and preserve the exact Session, runtime artifact, error, and compaction range.
2. Record whether the failing path is `messageTokens`, `surfaceTokens`, or both.
3. Keep the authoritative Session log intact; do not hand-edit compressed events or cached projection rows.
4. Test recovery against a copied home/Session with a build that explicitly repairs both projection consumers and migrates their checkpoint versions.
5. Require a full refold from sequence zero and a successful subsequent model turn before moving the production Session.

A bounded reference patch against the current upstream commit clamps both signed-fold consumers:

- `contextBreakdown.messageTokens` floors at zero;
- `contextPressure.surfaceTokens` floors at zero;
- checkpoint versions advance so old cached rows are discarded and refolded from authoritative history.

Clamping is a fail-soft boundary for an estimate. It may temporarily under-report until a new provider usage anchor or full fold restores a better value, but it prevents approximate display/pressure state from making the Session unusable. Updating only `messageTokens` leaves the sibling pressure projection exposed; changing reducer code without a checkpoint migration leaves already cached state ambiguous.

The reference patch is not an official release. Do not overwrite installed package files in place or represent it as upstream adoption.

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
- late provider overflow: preserve the provider error; rc.2 has an independent `context-overflow` recovery path that bypasses the normal pressure threshold.
- `messageTokens` or `surfaceTokens` schema underflow: stop retries, preserve the Session, and test a clamp plus checkpoint migration on a copy.
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
- both signed-fold accumulators remain nonnegative after wide and historical replacements;
- their state and wire schemas parse the clamped state;
- a projection-version migration discards old checkpoints and refolds from sequence zero;
- the same Session can run a new turn after projection recovery;
- a smaller provider anchor cannot make conservative delta arithmetic unsafe;
- route changes visibly invalidate same-request interpretation;
- UI heuristic rows remain marked approximate;
- compaction decisions log baseline kind, revision, route, capacity, and threshold;
- context-overflow recovery remains available when estimation is wrong; and
- CJK, JSON-heavy tools, cached prompts, empty assistant output, and post-compaction tails are covered.

## Primary evidence

- [Official token-meter accuracy proposal #3514](https://github.com/deepseek-ai/deepseek-harness/discussions/3514)
- [Wide-compaction underflow report #4674](https://github.com/deepseek-ai/deepseek-harness/discussions/4674)
- [Independent underflow report #4703](https://github.com/deepseek-ai/deepseek-harness/discussions/4703)
- [Bounded reference patch for both projections](https://github.com/Jstn-1g/deepseek-harness/commit/fd88e82f2d7d379118cceb67d0a02fe7ae30d365)
- [rc.2 token-meter contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/token-meter/README.md)
- [rc.2 replay measurement and usage anchor](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/token-meter/src/index.ts)
- [rc.2 provider-anchored context projection](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/token-meter/src/usage-projection.ts)
- [rc.2 compaction pressure decision](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/compaction/compaction-basic/src/index.ts)
