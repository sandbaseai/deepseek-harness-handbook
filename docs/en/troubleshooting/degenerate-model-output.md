---
title: Detect and Recover from Degenerate Repeated Model Output
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
---

# Detect and recover from degenerate repeated model output

A model can enter a degenerate stream that repeats a word, phrase, or n-gram until the output-token ceiling. DeepSeek Harness rc.8 does not classify that pattern by itself: the provider can still finish with ordinary `stop` or `max-tokens`, so the Agent sees a successful attempt unless a plugin rejects it.

Treat this as a model-output failure, not a runaway Agent loop. A runaway loop opens multiple model steps or tool calls; degenerate output happens inside one streaming model attempt.

```text
provider text deltas
  → bounded trailing-window detector
  → ordinary text: yield unchanged
  → repetition threshold crossed
       → stop yielding suspect text
       → emit one terminal error finish
          code: DEGENERATE_OUTPUT
       → no chunks after finish
       → Agent retry policy may open a fresh turn
```

## Capture evidence before enabling retries

Record one failed attempt without replaying it:

```text
DSH version or commit:
Provider, model, and route:
Sanitized request settings:
First repeated unit and character offset:
Unit length and consecutive repeat count:
Reasoning/text/tool-call channel:
Provider finish reason:
Prompt and output usage:
Agent turn and step:
Configured retry policy:
```

Keep the raw chunk boundaries when possible. A detector that works only on complete strings can miss a repeated unit split across deltas, while one that evaluates each delta independently can invent boundaries that the model never produced.

## Classify the failure first

| Observation | Classification | Correct boundary |
|---|---|---|
| no durable content before finish | `EMPTY_RESPONSE` | adapter classification; retryable by default |
| valid text ends only because output budget is exhausted | output-token ceiling | request/model budgeting |
| one unit repeats consecutively inside a single text stream | degenerate model output | `llm/stream` guard |
| Agent repeatedly opens new steps or calls tools | runaway Agent loop | loop/recovery containment |
| tool-call JSON repeats or grows malformed | tool-call protocol failure | adapter/tool-call validation—not a text heuristic |

Do not turn every `max-tokens` finish into `DEGENERATE_OUTPUT`. Long code, tables, generated fixtures, logs, and intentionally repetitive prose can legitimately reach the cap.

## Put the detector at the stream boundary

`llm/stream` is the sanctioned waterfall around every streaming model call. A listener can call `next()` and wrap the returned `AsyncIterable<StreamChunk>`, which makes it the appropriate extension point for a provider-neutral guard.

The wrapper should:

1. pass non-text chunks through unchanged;
2. append text deltas to a bounded trailing window;
3. test consecutive trailing units across chunk boundaries;
4. stop yielding once the configured threshold is crossed;
5. produce exactly one terminal error finish with an `LlmFailure` whose stable code is `DEGENERATE_OUTPUT`;
6. yield nothing after that terminal finish.

Guard text deltas only by default. Ignore reasoning deltas and never apply a text repetition heuristic to streamed tool-call arguments: repeated braces, quotes, keys, arrays, or escape sequences can be structurally valid. If reasoning is guarded, make it a separate opt-in policy with its own evaluation corpus.

Keep detection work bounded. A trailing window such as 1,024 characters is a reasonable candidate, but it is not an upstream default. Avoid rescanning the entire completion on every delta or testing an unbounded set of unit sizes.

## Treat thresholds as evaluation inputs

The proposal in official discussion #3480 suggests beginning after 64 characters and detecting at least six repeats of an eight-character unit. Those are candidate defaults, not universal truth.

Evaluate a matrix over real traffic that includes:

- prose in every supported language;
- code, diffs, Markdown tables, lists, logs, and generated test data;
- units split at every possible chunk boundary;
- Unicode combining marks, emoji, and non-Latin scripts;
- aligned and unaligned repetition;
- alternating phrases and slowly drifting loops;
- normal responses that legitimately end at `max-tokens`.

Track precision, recall, detection latency, characters already shown to a live UI, added CPU time, and memory per stream. Tune per route or workload when the false-positive cost differs; do not silently change one global threshold.

## Make retry an explicit, finite policy

In rc.8, an omitted normal policy permits two retries for `EMPTY_RESPONSE`, `RATE_LIMIT`, `SERVER`, `TIMEOUT`, and `TRANSPORT`. `DEGENERATE_OUTPUT` is not included. Add it explicitly only after the detector's false-positive rate is acceptable:

```yaml
- name: '@deepseek-ai/dsh-llm-deepseek'
  config:
    apiKeyEnv: DEEPSEEK_API_KEY
    retryPolicy:
      mode: normal
      maxRetries: 2
      retryableCodes:
        - EMPTY_RESPONSE
        - RATE_LIMIT
        - SERVER
        - TIMEOUT
        - TRANSPORT
        - DEGENERATE_OUTPUT

- name: '@deepseek-ai/dsh-llm-retry'
```

The retry plugin acts at the Agent loop's failed-step boundary. Direct consumers of `ctx.llm.stream()` remain single-attempt, even if the guard classifies the failure. A retry is a new provider request and may repeat input and output charges. Deterministic settings may reproduce the same degeneration, so keep the budget finite and alert on exhaustion.

Do not enable `mode: always` as a shortcut. It retries every model-request failure without an attempt limit until success, cancellation, or disposal.

## Preserve stream, Session, and UI truth

The streaming contract permits a terminal error finish or a thrown failure. On a failed Agent attempt, no normal assistant message or tool side effect should be committed for that attempt. That durable guarantee does not retract text already painted by a live client.

A product UI should therefore distinguish:

```text
streaming → repetition detected → attempt rejected → retrying (1/2)
                                           ↘ exhausted / cancelled
```

Either buffer enough text to keep suspect repetition off-screen or mark and replace the rejected attempt visibly. Never leave repeated text displayed as if it were the durable final answer while the Session silently retries.

If detection happens before the provider's terminal usage chunk, exact usage may be unavailable locally even though the provider can still bill the request. Report that uncertainty rather than inventing zero usage.

## Acceptance gates

- [ ] ordinary text is byte-for-byte unchanged by the wrapper;
- [ ] a repeated unit split across arbitrary chunk boundaries is detected;
- [ ] the detector uses bounded memory and near-linear work;
- [ ] reasoning is ignored by default;
- [ ] tool-call argument deltas are never classified by the text heuristic;
- [ ] one stable `DEGENERATE_OUTPUT` failure terminates the attempt;
- [ ] no chunk appears after terminal finish;
- [ ] the rejected attempt creates no durable assistant message or tool effect;
- [ ] live UI identifies or retracts text from the rejected attempt;
- [ ] normal retry is explicit, finite, observable, and cancellable;
- [ ] direct stream consumers do not claim automatic recovery;
- [ ] retry exhaustion ends visibly instead of looping;
- [ ] evaluation covers code, tables, logs, multilingual text, and Unicode;
- [ ] provider billing remains visible even when final usage is incomplete.

## Primary sources

Verified against DeepSeek Harness rc.8 commit `141eb6fef83422698aef7a981029e843e8161534` on 2026-08-20.

- [Official repetition-guard proposal #3480](https://github.com/deepseek-ai/deepseek-harness/discussions/3480)
- [rc.8 LLM streaming contract](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/docs/subsystems/llm-streaming.md)
- [rc.8 provider retry policy](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/llm/src/retry-policy.ts)
- [rc.8 Agent-loop retry plugin](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/llm-retry/README.md)
- [Stop a runaway Agent loop](runaway-agent-loop.md)
- [Diagnose an output-token ceiling](output-token-limit-reached.md)
