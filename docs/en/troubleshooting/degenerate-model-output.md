---
title: Detect and Recover from Degenerate Repeated Model Output
locale: en
content_revision: 3
status: canonical
verified_at: 2026-08-28
verified_upstream: cd5ef8148158c3a752a658978873241fdf8e2bbc
---

# Detect and recover from degenerate repeated model output

A model can enter a degenerate stream that repeats a word, phrase, digit, or n-gram until the output-token ceiling. DeepSeek Harness alpha.1 does not classify that pattern by itself: the provider can still finish with ordinary `stop` or `max-tokens`, so the Agent sees a successful attempt unless a plugin rejects it.

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

## Export the evidence from the Web profile

On alpha.1 Web, wait for the affected Turn to stop, then use the **Session log** action in the Session header or enter `/export`. The browser downloads a ZIP containing the root Session's decoded durable JSONL artifact plus descendants and referenced media. Export crosses the Host's persistence flush barrier; it does not create a model turn or add the archive to model context.

Work on a copy of the ZIP. Do not edit the live Session artifact, and do not publish the full export: request headers can contain system instructions and tool schemas, while messages and tool results can contain source code, paths, prompts, credentials, or customer data.

After extracting the archive, select the root `.jsonl` file—not a file below `subagents/`—and query only the diagnostic event types. For example, with `jq`:

```bash
LOG=./session.jsonl

jq -c '
  select(
    .type == "request/context" or
    .type == "request/header" or
    .type == "llm/retry" or
    .type == "llm/retry-started" or
    .type == "turn/end" or
    (.type == "assistant/message" and .data.usage != null)
  ) |
  {seq, type, data}
' "$LOG"
```

Read the output as follows:

| Question | Durable evidence | Important limit |
|---|---|---|
| Which provider and model? | latest applicable `request/header.data.header.config`; `request/context.data` also records route and advertised capacity when they change | a screenshot of the model picker does not prove which request was sent |
| Which channel repeated? | `text-chunks`, `reasoning-chunks`, or `tool-call-chunks`; unpacked `assistant/chunk.data.chunk.type` uses `text-delta`, `reasoning-delta`, or `tool-call-delta` | alpha.1 packs consecutive delta events, so not every raw row is named `assistant/chunk` |
| Why did streaming finish? | uncompressed `assistant/chunk` whose chunk type is `finish` | provider finish is per attempt; it is not the same as the whole-Turn outcome |
| How did the Turn end? | `turn/end.data.reason` | `max-tokens` preserves that at least one step hit the ceiling |
| What usage was reported? | `assistant/message.data.usage`, or the stream `usage` chunk immediately before finish | absence means usage was not reported locally; it does not prove zero billing |
| Was a retry scheduled? | `llm/retry.data`, paired with `llm/retry-started` by `retryId` | no event means no Harness retry was durably scheduled; it does not rule out provider-internal behavior |

To classify the stored stream rows without printing their text or arguments:

```bash
jq -r '
  if .type == "text-chunks" or
     .type == "reasoning-chunks" or
     .type == "tool-call-chunks"
  then [(.seq0|tostring), .type] | @tsv
  elif .type == "assistant/chunk"
  then [(.seq|tostring), .data.chunk.type] | @tsv
  else empty end
' "$LOG"
```

Before sharing evidence, reduce it to the affected Turn and retain only event sequence, event type, provider/model, finish reason, usage counters, and retry metadata. Redact prompts, system text, tool schemas and arguments, paths, endpoint URLs, request identifiers that a provider treats as sensitive, and all credentials. Keep the unredacted ZIP locally so maintainers can request a narrower field if necessary.

## Contain a live repetition before it consumes the cap

When the UI starts producing `000000...`, one phrase repeatedly, or another clearly useless sequence:

1. click **Stop generating** once;
2. wait until the Turn closes durably as aborted instead of repeatedly clicking or sending a new prompt;
3. record whether the repetition appeared in visible answer text, the reasoning/Think surface, tool-call arguments, or tool output;
4. capture provider/model/route, request id, raw stream deltas, usage, finish reason, request `maxTokens`, and the last non-repeated prefix;
5. inspect `llm/retry` events before replaying—the same deterministic route may generate and bill the same degeneration again;
6. retry only with a finite budget, preferably a different route or materially changed sampling/task boundary, after external effects are reconciled.

Stopping the browser display does not prove provider billing stopped at that instant. Cancellation crosses the browser, Session Remote, Agent loop, adapter, and provider stream; report observed usage or its absence rather than estimating saved tokens.

If alpha.1 shows **Output token limit reached** after a long repetition, that terminal state proves the provider reported a length ceiling. It does not make the repeated content valid, and it does not by itself prove which ceiling—request cap, route output capability, or remaining context headroom—was smallest. Preserve both classifications: `max-tokens` is the observed finish reason; degeneration is the content-shape diagnosis.

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

In alpha.1, an omitted normal policy permits five retries for `EMPTY_RESPONSE`, `RATE_LIMIT`, `SERVER`, `TIMEOUT`, and `TRANSPORT`. `DEGENERATE_OUTPUT` is not included. Add it explicitly only after the detector's false-positive rate is acceptable:

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

The example deliberately lowers the candidate degeneration retry budget to two; it is not restating alpha.1's five-retry default for ordinary transient failures. Do not add `DEGENERATE_OUTPUT` to an existing policy without deciding its separate cost ceiling.

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

Verified against DeepSeek Harness alpha.1 commit `cd5ef8148158c3a752a658978873241fdf8e2bbc` on 2026-08-28. The official source contains the provider-neutral stream interception and retry-policy surfaces, but no built-in `DEGENERATE_OUTPUT` classifier. The proposed error code and thresholds remain design input from discussion #3480, not shipped alpha.1 behavior.

- [Official repetition-guard proposal #3480](https://github.com/deepseek-ai/deepseek-harness/discussions/3480)
- [Repeated zeros and output-cap report #4841](https://github.com/deepseek-ai/deepseek-harness/discussions/4841)
- [Alpha.1 LLM streaming contract](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/docs/subsystems/llm-streaming.md)
- [Alpha.1 provider retry policy](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/llm/llm/src/retry-policy.ts)
- [Alpha.1 Agent-loop retry plugin](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/llm/llm-retry/README.md)
- [Alpha.1 Web Session-log export contract](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/session-query/session-log-export/README.md)
- [Alpha.1 packed stream-delta storage rows](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/core/session/src/chunk-rows.ts)
- [Stop a runaway Agent loop](runaway-agent-loop.md)
- [Diagnose an output-token ceiling](output-token-limit-reached.md)
