---
title: DeepSeek Harness Output Token Limit Reached
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
---

# `Output token limit reached` is a completed truncated turn

DeepSeek Harness shows **Output token limit reached** when the provider reports that generation ended because of a length ceiling. The partial assistant message is retained, and the durable `turn/end` reason is `max-tokens`.

This is not the same as rejecting the request because its input already exceeds the context window.

> [!CAUTION]
> Do not increase `maxTokens` blindly. A local model with a 65,536-token context and a 65,216-token prompt has only about 320 tokens of generation headroom, regardless of an 8,192-token request cap.

## Three different ceilings

The effective output budget is bounded by all three:

```text
effective generation budget
  = min(request maxTokens,
        provider/model output capability,
        context window − prompt tokens − reserved overhead)
```

| Ceiling | Meaning | Where to verify |
|---|---|---|
| request `maxTokens` | desired maximum output for this conversation request | durable `request/header` and wire request |
| model/provider output cap | maximum the serving route accepts or generates | model catalog, provider docs, response metadata |
| remaining context headroom | space left after prompt/history/tool schemas | provider token/timing log and configured context window |

The smallest value wins. Raising only the request cap cannot create context headroom or change a server-side model limit.

## How the signal travels

For the DeepSeek chat-completions adapter, wire `finish_reason: "length"` becomes `{ kind: "max-tokens" }`. The pi-ai adapter similarly maps stop reason `length` to the same Harness finish reason.

The Agent loop:

1. keeps the assembled partial assistant content;
2. appends an `assistant/message` completion anchor, even if the content is empty;
3. ends the step as `max-tokens`;
4. does not dispatch tool calls from a truncated step;
5. writes `turn/end { reason: { kind: "max-tokens" } }`.

`max-tokens` is sticky within that turn: if another step completes after steering, the final turn reason still reports that some step was truncated. It does not leak into a later turn.

## Why automatic compaction may not run

Automatic compaction addresses input pressure before a model step or a provider-classified context-window rejection. A `max-tokens` finish is a successful provider response with a terminal generation reason. It does not prove that the next request cannot fit, so the loop does not automatically treat it as context overflow.

This separation is intentional:

- short request cap, large free context: continuing may be enough;
- tiny remaining context headroom: another full-history request may truncate again;
- provider hard output cap: compaction does not increase that capability;
- runaway verbose task: increasing any cap can increase cost without completing the job.

## Diagnose one occurrence

Capture the effective request and provider result:

```text
provider and model id
adapter (`llm-deepseek` or `llm-pi-ai`)
request/header maxTokens and adapterDefaults marker
provider wire max_tokens / equivalent
prompt, completion, and total usage
provider stop/finish reason
configured context window and model output capability
assistant/message content length
turn/end reason
```

For llama.cpp, a log such as this is decisive:

```text
prompt: 65216 tokens
generated: 320 tokens
total: 65536 tokens
truncated: 1
```

That points to exhausted context headroom, not necessarily an 320-token Harness request cap.

## Route the failure

| Evidence | Boundary | Next move |
|---|---|---|
| generated tokens equal configured `maxTokens` with ample context left | request cap | raise carefully or split output |
| prompt + output reaches model context exactly | remaining headroom | compact, shorten history, or use a larger context |
| provider stops below both configured values | provider/model cap | inspect server configuration and response metadata |
| request rejected before any output | input context overflow | use the [context-window guide](context-window-exceeded.md) |
| output ends mid-tool JSON | unsafe partial action | do not replay blindly; verify side effects and start a clean turn |
| repeated long prose with no bounded artifact | task shape | request staged artifacts and explicit checkpoints |

## Safe recovery

If the partial answer is usable, start a new turn with a narrow continuation request:

```text
Continue from the last complete section. Do not repeat prior text.
Finish only sections 4 and 5, then stop.
```

For code or tool work, first determine whether the truncated step contained a partial tool call. The Agent loop does not dispatch tool calls from a max-token-truncated step, but an earlier completed tool call in the turn may already have produced effects. Inspect the transcript and workspace before retrying.

When context headroom is the problem:

1. export or summarize the current result into a durable artifact;
2. begin a fresh Session or use an explicit bounded compaction path;
3. reduce irrelevant tool output and history;
4. configure the local server's context size and Harness model metadata consistently;
5. leave enough output reserve for the expected answer.

When the request cap alone is too small, increase it incrementally and measure actual usage. For long tasks, prefer smaller verifiable stages over a single very large output budget.

## Configuration precedence

An explicit Agent or request `maxTokens` wins. Otherwise, exact-model resolution can materialize an adapter-owned default and mark it in `request/header.adapterDefaults.maxTokens`.

The built-in DeepSeek adapter defaults conversation requests to 256,000 tokens and does not clamp that number against `contextWindow`. A model catalog entry can override the adapter-wide value. The deployment must choose a compatible pair for smaller gateways.

For pi-ai routes, a configured model `maxTokens` becomes the default request cap. A value inherited only as model capability does not automatically become a request default. Record the resolved model metadata and request header rather than assuming the number written in one config file won.

## Headless and SDK behavior

A headless turn ending in `max-tokens` is not a normal completed success and exits nonzero. The SDK server can opt into `maxTokensAsSuccess`, but that changes caller status mapping; it does not make the content complete.

Automation should therefore inspect both the final text and terminal reason. Never publish a truncated artifact merely because the transport request itself succeeded.

## Regression gates

1. DeepSeek `finish_reason: length` maps to `max-tokens`;
2. pi-ai `stopReason: length` maps identically;
3. partial text remains in the assistant completion anchor;
4. truncated tool calls are never dispatched;
5. the turn ends durably as `max-tokens`;
6. a later clean turn can end `completed`;
7. explicit request cap wins over adapter default;
8. adapter-default provenance is recorded in `request/header`;
9. context overflow remains a different classifier and recovery path;
10. Web surfaces the truncation without calling it a network failure;
11. headless returns nonzero unless the caller explicitly changes policy;
12. usage evidence distinguishes request cap from remaining headroom.

## Source evidence

- [Community report and local-model evidence #1166](https://github.com/deepseek-ai/deepseek-harness/discussions/1166)
- [DeepSeek finish-reason translation](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/llm/llm-deepseek/src/translate.ts)
- [pi-ai stop-reason translation](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/llm/llm-pi-ai/src/stream.ts)
- [Agent-loop max-tokens lifecycle](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/agent-loop/src/agent.ts)
- [DeepSeek `maxTokens` configuration contract](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/llm/llm-deepseek/README.md)
- [Agent-loop regression tests](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/agent-loop/tests/loop.spec.ts)

