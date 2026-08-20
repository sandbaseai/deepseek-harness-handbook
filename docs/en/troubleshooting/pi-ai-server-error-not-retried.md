---
title: Fix OpenAI-Compatible server_error Responses That DeepSeek Harness Does Not Retry
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
---

# Fix `server_error` responses that DeepSeek Harness does not retry

A third-party OpenAI-compatible provider can report a transient overload as text such as:

```text
Error Code server_error: Our servers are currently overloaded. Please try again later.
```

On DeepSeek Harness rc.8, the pi-ai adapter receives flattened error text. Its classifier recognizes numeric `5xx` messages as `SERVER`, but not the explicit `server_error` marker. The same transient failure can therefore become `PI_AI_ERROR`, which normal retry policy deliberately excludes.

```text
provider overload
  → flattened errorMessage
  → classifyPiAiError()
  → PI_AI_ERROR
  → not in retryableCodes
  → no llm/retry event
  → Agent step fails once
```

Do not enable unconditional retries or add every unknown error to the retryable set. First prove the provider response, classified code, route policy, and durable event sequence.

## Capture one failed step

Record:

```text
DSH version or commit:
Profile and selected provider route:
Model and protocol:
Sanitized endpoint identity:
Exact provider error text:
Harness failure code:
Turn and step:
Latest llm/retry event for that step:
Latest llm/retry-started event:
```

Preserve the Session before retry experiments. Remove credentials, private prompts, response bodies, and endpoint query secrets from shared evidence.

## Prove all four gates

### 1. Provider gate

Confirm the upstream response is transient. Capture HTTP status, machine-readable error type, headers such as `Retry-After`, and request ID at the gateway boundary when available. A text fragment containing `server` is not enough: authentication, quota, malformed request, context size, and policy refusal should not be retried as overloads.

### 2. Classification gate

At rc.8, pi-ai flattens the original error and cause chain to `error.message`. `classifyPiAiError()` then uses ordered text rules:

| Evidence | rc.8 code |
|---|---|
| `401` or `403` | `AUTH` |
| quota wording | quota-exceeded code |
| `429` or rate-limit wording | `RATE_LIMIT` |
| `413`, payload/request-body too large | `INVALID_REQUEST` |
| `400` or invalid-request wording | `INVALID_REQUEST` |
| numeric `5xx` | `SERVER` |
| timeout wording | `TIMEOUT` |
| stream truncation, socket, network, fetch, or connection wording | `TRANSPORT` |
| unmatched text, including bare `server_error` at rc.8 | `PI_AI_ERROR` |

Ordering matters. A narrow `server_error` rule must not override higher-confidence auth, quota, rate-limit, or request-size evidence.

### 3. Policy gate

Retry policy belongs to each provider route, not to the `llm-retry` plugin row. In rc.8, omitted policy resolves to normal mode with:

```text
maxRetries: 5
retryableCodes: EMPTY_RESPONSE, RATE_LIMIT, SERVER, TIMEOUT, TRANSPORT
initialDelayMs: 500
maxDelayMs: 10000
jitterRatio: 0.1
```

The report may come from an older release or a route with explicit overrides. Inspect the resolved configuration instead of assuming a retry count.

### 4. Execution gate

The base bundle mounts `@deepseek-ai/dsh-llm-retry`. For each eligible retry it appends `llm/retry` before the cancellable wait, then `llm/retry-started` when the next attempt begins. Absence of both events means one of these boundaries won:

- the failure code was not eligible;
- the selected route had no policy;
- retry count was exhausted;
- provider `Retry-After` exceeded the normal policy's maximum delay;
- cancellation or plugin disposal won;
- the call used direct `ctx.llm.stream()`, which remains single-attempt.

## Bounded recovery

Until the adapter recognizes a verified transient marker, route critical work through a provider path that emits a correctly classified numeric status or already maps overloads to `SERVER`. Keep the same model and prompt only if doing so does not change data residency, credentials, cost, or policy.

If the deployment owns the gateway, normalize its transient error response at the gateway boundary: return a suitable `5xx`, preserve a stable machine-readable type and request ID, and include a valid bounded `Retry-After` when appropriate. Do not rewrite permanent errors into transient ones.

Do not add `PI_AI_ERROR` wholesale to `retryableCodes`. It is the catch-all for unknown failures and can include permanent, billable, or side-effect-adjacent conditions.

## Source repair contract

A narrow adapter repair can classify a case-insensitive, word-bounded `server_error` marker as `SERVER` while preserving higher-priority rules. Regression tests should include:

- exact `server_error` and mixed-case variants;
- numeric `500`/`503` controls;
- `client_error`, generic `server` prose, and embedded lookalikes that remain `PI_AI_ERROR`;
- auth, quota, rate-limit, request-size, timeout, and transport collisions that retain their current priority;
- a completed Agent step proving durable retry scheduling, start, exhaustion, cancellation, and eventual success.

The fix should not make direct SDK streams multi-attempt, change the default retry count, or add the catch-all code to the default policy.

## Read the durable retry evidence

For one turn and step, pair events by `retryId`:

```text
llm/retry
  provider, mode, policyKey, retry, maxRetries, delayMs, failure

llm/retry-started
  retryId, turn, step, retry
```

The first event proves scheduling was durable. The second proves the wait completed and another request began. A scheduled retry without its start can be a cancellation or shutdown, not a classifier failure.

## Acceptance gates

- [ ] The upstream overload is verified as transient with sanitized provider evidence.
- [ ] `server_error` maps to `SERVER`, not `PI_AI_ERROR`.
- [ ] Higher-priority auth, quota, rate-limit, size, timeout, and transport cases remain unchanged.
- [ ] Generic or lookalike text does not become retryable.
- [ ] The selected provider route's resolved policy is recorded.
- [ ] Retry count means retries after the first request, not total attempts.
- [ ] Every scheduled retry has a durable `llm/retry` event.
- [ ] Every attempt that actually begins has the paired `llm/retry-started` event.
- [ ] Backoff and jitter remain within configured bounds.
- [ ] Valid provider delay is honored only within the configured maximum.
- [ ] Cancellation and disposal prevent later attempts.
- [ ] Exhaustion exposes the original classified failure without an infinite loop.
- [ ] Eventual success produces one normal completed Agent step.
- [ ] Direct `ctx.llm.stream()` calls remain single-attempt.
- [ ] No prompt, credential, residency, or billing boundary changed silently.

## Primary sources

- [Official `server_error` report #3407](https://github.com/deepseek-ai/deepseek-harness/discussions/3407)
- [rc.8 pi-ai error classifier](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/llm-pi-ai/src/stream.ts)
- [rc.8 provider retry policy](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/llm/src/retry-policy.ts)
- [rc.8 durable retry executor](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/llm-retry/src/index.ts)
- [rc.8 pi-ai provider documentation](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/llm-pi-ai/README.md)
