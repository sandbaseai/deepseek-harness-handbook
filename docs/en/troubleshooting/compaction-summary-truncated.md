---
title: Fix DeepSeek Harness Compaction Summary Truncated at the Token Cap
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
---

# Fix `summarization truncated at the token cap`

When `/compact` ends with `Compaction could not produce a useful summary`, inspect the corresponding `compaction/end`. If its error is `summarization truncated at the token cap (incomplete checkpoint)`, the compaction model reached its output cap before it finished a valid checkpoint.

A local server log showing a successful 8,192-token generation confirms the cause; it does not prove Harness compaction succeeded.

> [!IMPORTANT]
> llama.cpp context shift, LM Studio server-side cache handling, and DeepSeek Harness compaction are different mechanisms. The server can successfully finish its own context operation while Harness correctly rejects the truncated checkpoint.

## Two operations share one misleading word

| Operation | Owner | What changes | Durable Harness checkpoint? |
|---|---|---|---|
| context shift / KV-cache compression | local model server | server cache or prompt accommodation | no |
| Harness compaction | `dsh-compaction-basic` | older Session surface replaced by a structured summary | yes, only after complete output and commit |

Harness sends a separate LLM request containing the conversation prefix plus a strict checkpoint instruction. The response must contain a complete structured summary. If the provider returns `max-tokens`, the summarizer raises `MAX_TOKENS` before any replacement is committed.

## Read the evidence chain

A decisive local-model trace looks like:

```text
compaction/start
provider generated exactly 8192 output tokens
compaction/end error="summarization truncated at the token cap (incomplete checkpoint)"
command/done kind="error"
```

The default compaction `maxTokens` is `8192`. It is the output cap of the separate summary request and may include reasoning tokens. It is not:

- the conversation model's normal output cap;
- the model context window;
- the number of history tokens selected for replacement;
- proof that the summary text contains every required closing section.

The human command intentionally collapses detailed backend failures into a stable `summary` message. Use the Session events and provider usage to see the underlying reason.

## Why the conversation stays unchanged

Compaction is a bracketed transaction:

1. select a balanced older range;
2. append `compaction/start`;
3. ask the summarizer for a complete checkpoint;
4. revalidate the selected surface;
5. append `compaction/summary` and the replacement;
6. append `compaction/end`.

If stage 3 returns `max-tokens`, Harness appends `compaction/end { error }` and does not replace the selected conversation surface. That fail-closed behavior prevents a missing tail, closing tag, decision, file path, or pending job from becoming authoritative resume state.

## Diagnose before changing a limit

Capture:

```text
Harness revision
conversation provider/model
summarization provider/model
compaction maxTokens
provider finish reason
prompt, reasoning, completion, and total usage when available
compaction/start and compaction/end sequence numbers
exact compaction/end error
local server context-window and context-shift settings
selected Session size before and after the attempt
```

| Evidence | Boundary | Next move |
|---|---|---|
| completion equals compaction `maxTokens` | summary output cap | raise the compaction cap incrementally or use a stronger summarizer |
| prompt itself cannot fit and provider returns context overflow | summary input/context | reduce history first or route summarization to a larger-context model |
| server reports context shift but Harness receives no canonical overflow | server policy masks overflow trigger | choose whether to disable context shift for this endpoint |
| output completes below the cap but has no usable text | summary quality/format | inspect model capability and raw completion evidence |
| compaction succeeds but pressure remains above threshold | convergence | inspect retention and `compactionRetries` |

`compactionRetries` applies after a successful replacement that still leaves measured pressure above threshold. It does not turn a truncated first summary into a valid checkpoint.

## Recovery option 1: increase the summary output cap

Inspect the composed row first:

```sh
dsh --profile web --dump-config
```

Then override the existing `compaction-basic` row in the selected profile:

```yaml
- id: compaction-basic
  config:
    maxTokens: 16384
```

Treat `16384` as a measured next step, not a universal value. Restart the profile, run `/compact` once, and verify that the provider finishes normally and the Session records:

```text
compaction/start
compaction/summary
compaction/end without error
```

Increasing the cap increases latency and cost, and a small local model may still spend much of the budget on reasoning or verbose prose.

## Recovery option 2: use a dedicated summarization route

The compaction backend can use a provider/model pair separate from the Agent's conversation route:

```yaml
- id: compaction-basic
  config:
    summarizationProvider: <provider-id>
    summarizationModel: <model-id>
    maxTokens: 16384
```

Both fields must be set together. Select a route with enough context for the replayed prefix, enough output capacity for the checkpoint, reliable instruction following, and acceptable data-handling policy.

Changing providers forfeits the conversation route's warm prefix cache. It can still be the better operational choice when a small local model cannot produce a concise complete checkpoint.

## Recovery option 3: decide who owns context pressure

Automatic Harness compaction has two triggers:

- between-step pressure, based on routed model capacity metadata;
- recovery after an adapter reports canonical `CONTEXT_WINDOW_EXCEEDED`.

Some llama.cpp deployments use context shift to accommodate an oversized request instead of returning a context-overflow error. The second trigger cannot fire when the adapter never receives that error.

If you want Harness to own overflow recovery, use a dedicated endpoint configured to surface real overflow—for llama.cpp, deployments commonly evaluate `--no-context-shift`. This is a server setting, not a Harness flag. Test it in isolation: oversized requests will fail loudly, allowing Harness to classify the error and attempt one bounded recovery.

Do not disable server context shift blindly for unrelated clients. Record the endpoint policy and decide which layer owns history reduction.

## When a clean continuation is safer

Do not loop `/compact` when:

- repeated attempts hit the same cap;
- the replayed prefix cannot fit the summary route;
- the newest indivisible item is itself too large;
- the local model cannot reliably follow the checkpoint structure;
- latency or cost exceeds the value of preserving the full Session.

Export a short handoff containing the goal, decisions, exact paths, current errors, pending work, and one next action. Start a fresh Session and do not paste the entire old transcript back into it.

## Regression gates

1. server-side context shift is not reported as Harness checkpoint success;
2. the summary request carries `purpose: compaction`;
3. the configured summary provider/model pair is resolved together;
4. default summary output cap remains observable as `8192`;
5. `max-tokens` maps to `MAX_TOKENS` with the incomplete-checkpoint message;
6. a truncated summary never creates `compaction/summary`;
7. the selected surface stays unchanged after a summary failure;
8. the failed attempt closes with one durable `compaction/end { error }`;
9. a successful attempt records start, summary, and clean end in order;
10. `compactionRetries` is tested only after successful non-convergent replacement;
11. canonical provider overflow and proactive pressure remain distinct triggers;
12. a clean continuation preserves required state without copying the full transcript.

## Source evidence

- [llama.cpp and LM Studio reproductions #3201](https://github.com/deepseek-ai/deepseek-harness/discussions/3201)
- [Pinned compaction summarizer and MAX_TOKENS mapping](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/compaction/compaction-basic/src/summarizer.ts)
- [Pinned compaction defaults and automatic triggers](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/compaction/compaction-basic/src/index.ts)
- [Pinned configuration resolution](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/compaction/compaction-basic/src/config.ts)
- [Pinned fail-closed region transaction](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/compaction/compaction-basic/src/region.ts)
- [Pinned human `/compact` error mapping](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/compaction/command-compact/src/index.ts)
