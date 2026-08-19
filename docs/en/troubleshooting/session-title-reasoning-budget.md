---
title: Fix Session Titles on Reasoning Models
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
---

# Fix Session Titles That Stay on the Fallback with Reasoning Models

A new Session may keep a clipped version of its first prompt instead of receiving a concise generated title. The Agent can otherwise answer normally. With a reasoning model, the auxiliary title request may spend its entire output allowance on thinking and finish before it emits title text.

This is not a main-turn failure. DeepSeek Harness runs title generation as a separate LLM request with its own purpose, route, token cap, timeout, event, and acceptance rules. Diagnose that auxiliary boundary before changing the Agent model or deleting the Session.

## Recognize the actual symptom

DeepSeek Harness rc.8 creates a deterministic fallback from the first eligible human message before it calls the optional model-backed title provider. A failed LLM title therefore normally leaves the fallback in place. Depending on the client, the visible symptom can look like:

- a long or abruptly clipped first-prompt title;
- a title that never becomes shorter after the first response;
- the same fallback after an explicit title refresh;
- a background warning while the main Agent turn still succeeds; or
- no useful title when the first prompt normalizes to empty under the fallback limits.

Search Host logs for one of these exact provider failures:

```text
session-title-llm: title output reached maxOutputTokens
session-title-llm: title model produced no text
session-title-llm: title output must contain text only
session-title-llm: title model unexpectedly requested a tool
SESSION_TITLE_TIMEOUT
```

For automatic generation, the service catches the error and logs:

```text
session "<id>": automatic title generation failed: <reason>
```

That warning is deliberately non-blocking. Do not infer that the main response used the same budget or failed for the same reason.

## Map the two title paths

| Path | Input | Output owner | Failure behavior |
|---|---|---|---|
| deterministic fallback | first eligible user text | `@deepseek-ai/dsh-session-title` | stays as the current title when derivable |
| LLM refinement | selected human messages plus a title-only system prompt | `@deepseek-ai/dsh-session-title-llm` | warning is logged; fallback remains |

The shipped `session-title-first-prompt-llm` provider selects the first human message. An `all-prompts` provider exists as a separate cadence, but changing cadence does not solve an exhausted output budget.

The model-backed provider sends a `GenerateOptions` object with:

```text
purpose = session-title
maxTokens = maxOutputTokens
provider/model = explicit title route or current main-request route
```

The rc.8 configuration schema accepts `provider`, `model`, `maxOutputTokens`, and `timeoutMs`, but it has no title-specific reasoning-effort field. When no explicit title route is configured, the auxiliary request inherits the provider and model captured from the main request header.

## Prove budget starvation before changing config

Capture four facts from one affected Session:

1. The visible title and whether it matches a clipped prefix of the first prompt.
2. The `session/title` event source: `fallback`, `provider`, or `user`.
3. The latest `session/title-llm-request` event, including route and `maxTokens`.
4. The Host warning or provider terminal reason for that same request.

The log-only request event records the exact auxiliary route, selected message sequence numbers, framed messages, system prompt, and output cap. It does not record credentials. Preserve it with the Session evidence instead of guessing which model generated the title.

Budget starvation is established when all of these are true:

- the main Agent request completes;
- the title request uses the expected reasoning model;
- `maxTokens` is the shipped value `64`, or another small cap;
- the provider finishes with `max-tokens` or emits reasoning without text; and
- the latest accepted `session/title` event still has `source.kind: fallback`.

If the request times out, rejects the route, emits a tool call, or returns malformed text, follow the matching branch instead. A larger token cap is not a universal title repair.

## Apply a bounded configuration workaround

Override the existing `session-title-llm` row in the profile patch. Do not add a second provider with the same capability.

```yaml
# cordis.patch.yml
- id: session-title-llm
  config:
    targetWords: 5
    targetCjkCharacters: 10
    maxInputBytes: 4096
    maxOutputTokens: 1024
    timeoutMs: 60000
```

This raises the shared output allowance so a reasoning model has room to think and still emit a title. It does **not** disable reasoning, reserve a separate reasoning budget, or guarantee that every model will finish within 1024 tokens.

Treat `1024` as an incident workaround to validate, not as a universal default. A smaller value may be sufficient for your route; a heavily reasoning model may need a different auxiliary route instead.

Restart the Host after changing the profile, then use a fresh Session whose first prompt is distinctive. Require these success signals:

- a new `session/title-llm-request` records the new `maxTokens`;
- the terminal finish reason is `stop`, not `max-tokens`;
- a later `session/title` event has `source.kind: provider`;
- its `messageSeqs` identify the intended human prompt;
- its model provenance matches the expected provider and model; and
- the accepted title is non-empty, plain text, within `maxTitleBytes`, and visible after reload.

An old Session may not automatically schedule the first-prompt provider again. Use the client's explicit title refresh if available, or prove the configuration in a fresh Session before diagnosing refresh behavior.

## Prefer an explicit lightweight title route when available

The provider and model fields must be supplied together. If your deployment exposes a non-reasoning or low-cost model that follows plain-text instructions reliably, isolate title generation from the main reasoning route:

```yaml
- id: session-title-llm
  config:
    targetWords: 5
    targetCjkCharacters: 10
    maxInputBytes: 4096
    maxOutputTokens: 128
    timeoutMs: 30000
    provider: your-provider-id
    model: your-title-model-id
```

Only use a route already registered in the same deployment and authorized for this data. The framed title request contains human messages. Sending titles to another provider changes privacy, residency, credential, availability, latency, and cost boundaries even though it is an auxiliary call.

Test the explicit route with representative English, CJK, code-heavy, and adversarial first prompts. The provider must return only natural-language title text. Tool calls, Markdown wrappers, empty text, and a `max-tokens` finish are rejected.

## Route other failures correctly

| Evidence | Likely boundary | Next action |
|---|---|---|
| no `session/title-llm-request` event | provider scheduling or main request header | verify the selected profile, provider registration, eligible first message, and request-header timing |
| request event has the wrong route | inherited main route or stale profile | inspect explicit `provider` and `model`, then restart and use a fresh Session |
| `max-tokens` with reasoning model | shared reasoning/text output allowance | raise the cap for a bounded test or choose a lightweight title route |
| `SESSION_TITLE_TIMEOUT` | provider latency, network, or deadline | measure auxiliary latency before raising `timeoutMs` |
| `title output must contain text only` | model emitted a tool call | use a model/route suitable for constrained plain-text generation |
| `title model produced no text` with `stop` | adapter or provider returned no text block | capture raw provider stream and adapter classification |
| provider title event exists but UI stays old | projection, transport, or client cache | compare durable latest-title fold with the client's received update |
| fallback itself is empty | first message has no eligible visible text after normalization | test with a plain text first prompt and inspect fallback limits |

## Do not use these shortcuts

- Do not raise the main Agent `maxTokens` and assume the auxiliary request changes. Verify the title request event.
- Do not delete Session logs. The title and request events are the evidence needed to distinguish generation from rendering.
- Do not disable reasoning for all Agent turns merely to repair an auxiliary title.
- Do not add another `session-title-llm` row without proving composition ownership; the service permits one optional provider registration.
- Do not claim that a missing generated title means no fallback exists. Inspect the latest `session/title` source.
- Do not route user prompts to a cheaper external provider without reviewing the new data boundary.
- Do not keep increasing the token cap without recording latency, output usage, and cost.
- Do not accept a title merely because text exists. The provider contract rejects control sequences, code, and output outside the title limits.

## Operator acceptance gates

- [ ] The affected Session and exact Host process are identified.
- [ ] The latest title source is captured before changes.
- [ ] The auxiliary request route and `maxTokens` are proven from the log event.
- [ ] The provider terminal reason is captured.
- [ ] The main turn and title request are treated as separate budgets.
- [ ] Only the existing title-provider row is changed.
- [ ] A fresh Session records the intended new configuration.
- [ ] The successful title ends with `stop` and contains text.
- [ ] A provider-sourced title event supersedes the fallback.
- [ ] Reload preserves the same latest title.
- [ ] An explicit alternate route passes privacy and cost review.
- [ ] The workaround is removed or retested when upstream adds title-specific reasoning control.

## Incident bundle

Share no prompts or credentials without authorization. Attach:

- exact DSH version and source revision;
- selected profile and sanitized composition row;
- main provider/model and any explicit title provider/model;
- `session/title-llm-request` route, message sequence numbers, and `maxTokens`;
- terminal finish reason and sanitized Host warning;
- title events before and after the request, including `source.kind`;
- whether the first message contains text, attachments, or resource-only content;
- fresh-Session and explicit-refresh results;
- measured auxiliary latency and output usage where the provider exposes it; and
- the smallest cap that passed a bounded test.

## Primary sources

- [Official Discussion #3468](https://github.com/deepseek-ai/deepseek-harness/discussions/3468)
- [rc.8 title LLM request and validation policy](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/session/session-title-llm/src/index.ts)
- [rc.8 fallback, scheduling, and provider ownership](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/session/session-title/src/index.ts)
- [rc.8 first-prompt provider](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/session/session-title-first-prompt-llm/src/index.ts)
- [rc.8 shipped profile configuration](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/bundle/base/cordis.patch.yml)

## Related handbook guides

- [Diagnose `Output token limit reached`](output-token-limit-reached.md)
- [Control response and reasoning language](response-language-and-reasoning.md)
- [Understand Session model and deployment default coupling](session-model-default-coupling.md)
- [Protect and recover live Session logs](live-session-log-durability.md)
