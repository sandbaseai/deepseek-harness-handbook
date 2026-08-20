---
title: Diagnose Responses API overload, full-history requests, and retry ownership
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
---

# Diagnose `/v1/responses` overload without confusing history, retry, and stream leaks

An OpenAI-compatible Responses route may report repeated `503`, `server_is_overloaded`, `auth_unavailable`, or `429` failures while DeepSeek Harness sends large request bodies. Three plausible explanations—complete-history reconstruction, multiple attempts, and an unclosed SSE stream—cross different ownership boundaries. A large request followed by a 503 does not prove a retry storm or leak.

This guide describes the official rc.8 pi-ai adapter and Agent retry path. A gateway that only imitates `/v1/responses` can add its own authentication, queueing, retries, or stream lifecycle; measure that layer separately.

## Start with the current request model

For an Agent step, Harness derives model-facing messages from durable Session surface events and sends that complete logical context to the selected adapter. In rc.8 production code, there is no `previous_response_id` continuation path for the pi-ai request; the only repository occurrence is a subagent test fixture.

Consequences:

- two successive user turns can each carry the complete derived history;
- a long Session can create a request body of hundreds of kilobytes before reaching the context limit;
- a failed attempt recovered by `dsh-llm-retry` reconstructs the same surface request unless another recovery policy changes it;
- provider error text, failed partial chunks, and `llm/retry` events do not enter the next model request; and
- full request size is not the number of attempts.

Measure wire requests and durable retry events independently.

## Separate the four timelines

Capture one sanitized incident using a unique Session, one harmless prompt, and no concurrent Agents. At the gateway or reverse proxy, record:

```text
wire attempt timestamp:
request Content-Length:
provider route and model:
provider request id:
HTTP status:
Retry-After raw value:
response/SSE open time:
first byte or first event time:
connection close time and initiator:
```

From the same Session log, record:

```text
request/header turn + step + provider + model:
turn/end failure code, status, providerRetryAfterMs, requestId:
llm/retry retryId + retry + maxRetries + delayMs:
llm/retry-started timestamp and identity:
final turn/end reason:
user cancellation timestamp:
```

Then classify each wire attempt:

| Observation | Most likely owner | What would falsify it |
|---|---|---|
| one request per new user turn, body grows with Session history | normal stateless context reconstruction | production wire request carries a usable continuation id and omits prior surface messages |
| a failed step has one `llm/retry`, then one later wire request | Harness Agent retry policy | another wire attempt occurs before `llm/retry-started` |
| two wire attempts occur inside one adapter call but only one failed step exists | gateway, SDK, proxy, or transport retry outside the visible Agent boundary | pi-ai receives `maxRetries: 0` and proxy logs prove only one upstream dispatch |
| caller cancels, but the same SSE connection remains open | cancellation propagation or remote gateway teardown defect | client-side close and upstream close are both observed promptly |

Do not correlate only by wall-clock proximity. Join provider request id, Session id, turn, step, retry id, and connection identity.

## Verify retry ownership

The rc.8 pi-ai adapter passes `maxRetries: 0` to `streamSimple()`. One adapter call is intended to be one SDK attempt. Visible Agent retries happen later through `@deepseek-ai/dsh-llm-retry`, after the failed step is durably closed.

Normal mode defaults to two retries for `EMPTY_RESPONSE`, `RATE_LIMIT`, `SERVER`, `TIMEOUT`, and `TRANSPORT`, with bounded exponential backoff. Inspect the resolved provider profile rather than assuming defaults:

```yaml
providers:
  codex-compatible:
    api: openai-responses
    retryPolicy:
      mode: normal
      maxRetries: 2
      retryableCodes: [RATE_LIMIT, SERVER, TIMEOUT, TRANSPORT]
      backoff:
        initialDelayMs: 500
        maxDelayMs: 10000
        jitterRatio: 0.1
```

The actual route name and protocol spelling must match the deployed profile and installed catalog; the example is not a drop-in replacement for an existing provider block.

A valid positive provider delay at or below `maxDelayMs` replaces local exponential backoff exactly and receives no jitter. In normal mode, a provider delay above that cap is not shortened: the retry plugin delegates rather than violating the server instruction. If adjacent gateway attempts are closer than the recorded `providerRetryAfterMs` while the Session's `llm/retry.delayMs` is correct, investigate a second retry owner outside the Agent policy.

Avoid `mode: always` during overload diagnosis. It retries even permanent failures until success or cancellation and can turn an authentication, quota, protocol, or overloaded-service incident into unbounded cost and load.

## Prove cancellation reaches the stream

The pi-ai adapter fuses the caller signal with a local consumer controller and passes the stable signal to the SDK. When the consumer stops before exhaustion, it aborts that controller and calls `iterator.return()`. Its idle watchdog also aborts the underlying request rather than only abandoning a waiting promise.

That source contract is necessary but not proof for a particular gateway. Run a bounded cancellation probe:

1. start one fresh request through a connection-visible proxy;
2. wait until the SSE response is open;
3. cancel from the owning DSH surface once;
4. observe the Session's aborted outcome;
5. observe the client TCP/HTTP stream close; and
6. observe whether the gateway cancels its upstream provider request or merely detaches the downstream socket.

If the DSH-side connection closes but the gateway retains an upstream stream, the remaining lifecycle is owned by that gateway. If DSH never closes its SDK stream, preserve the exact DSH version, pi-ai version, profile, cancellation source, timestamps, and minimal reproduction for an upstream report.

## Control request size without inventing continuation semantics

Do not delete Session events or inject a guessed `previous_response_id`. The durable log owns replay, tool-call pairing, approvals, and request reconstruction.

Use supported boundaries instead:

- reproduce in a fresh Session to compare fixed prompt overhead with accumulated history;
- inspect compaction events and the active compaction policy;
- compare serialized wire size, model-counted input tokens, and the configured context window as three different measurements;
- reduce tool schemas, injected instructions, attachments, or retained tool results only through their owning plugins; and
- choose a new Session when conversation continuity is no longer required.

A smaller request that stops the 503 is evidence of a capacity interaction, not proof that full-history reconstruction is a bug. A provider-compatible continuation feature would need an explicit durable identity, replay, invalidation, provider-switch, retry, and resume contract before it could replace the current stateless request model.

## Incident acceptance checklist

- exact DSH version/commit and profile are recorded;
- exact pi-ai adapter and provider route are recorded;
- one Session and one Agent own the reproduction;
- every wire attempt has request and connection identity;
- complete-history growth is separated from attempt count;
- resolved retry mode, budget, codes, delay cap, and jitter are captured;
- `Retry-After` is compared with durable `llm/retry.delayMs` and actual wire spacing;
- hidden SDK, proxy, and gateway retry layers are independently disabled or observed;
- cancellation is traced through DSH, downstream socket, gateway, and upstream provider; and
- no credential, raw prompt, or sensitive provider payload is included in published evidence.

## Primary evidence

- [Official Discussion #3517](https://github.com/deepseek-ai/deepseek-harness/discussions/3517)
- [rc.8 pi-ai adapter request and cancellation path](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/llm-pi-ai/src/adapter.ts)
- [rc.8 pi-ai adapter contract and retry ownership](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/llm-pi-ai/README.md)
- [rc.8 Agent retry implementation](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/llm-retry/src/index.ts)
- [rc.8 Agent retry contract](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/llm-retry/README.md)
- [Bounded request-recovery design](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/.agents/notes/implemented/architecture/2026-06-21-bounded-llm-request-recovery.md)

## Related guides

- [Map token accounting boundaries](../operations/token-meter-accounting.md)
- [Diagnose slow first-token latency in mature Sessions](slow-ttft-mature-sessions.md)
- [Prevent unexpected DeepSeek API charges](../security/prevent-unexpected-deepseek-api-charges.md)
- [Recover from HTTP/2 invalid-session failures](http2-invalid-session.md)
