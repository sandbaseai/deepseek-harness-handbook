---
title: Diagnose Slow TTFT in Mature DeepSeek Harness Sessions
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-19
---

# Diagnose slow TTFT in mature Sessions

When a fresh DeepSeek Harness Session starts streaming in seconds but mature Sessions or concurrent subagents wait a minute or more, do not label the model “slow” from the UI timer alone. Split time-to-first-token into host outbound, provider, and host inbound segments, then vary Session size and concurrent model steps independently.

An upstream rc.7 report measured a `49.7s` median UI TTFT while the matched gateway requests had a `2.1s` median TTFT. Those numbers describe that deployment, not a universal baseline. The measurement method is reusable.

> [!NOTE]
> This guide verifies relevant source paths at commit `99f6f02`. It does not claim that every slow turn has the same cause or that the proposed upstream optimizations have shipped.

## Measure four timestamps

For each model step, correlate:

| Timestamp | Evidence | Meaning |
|---|---|---|
| `t0` | Harness `step/start` | the Host began the step |
| `t1` | gateway/provider request arrival | the request left the Host boundary |
| `t2` | gateway/provider first token | the provider began its response |
| `t3` | first streamed `assistant/chunk` recorded | the Host observed and logged output |

Derive four intervals:

```text
Host outbound  = t1 - t0
Provider TTFT  = t2 - t1
Host inbound   = t3 - t2
End-to-end     = t3 - t0
```

If you do not own the gateway, you cannot directly prove `t1` and `t2`. Record `t0` and `t3`, then compare a fresh Session, a mature Session, and a low-concurrency run with the same model route. Report the missing timestamps rather than guessing.

## Run a controlled A/B ladder

Use the same workspace, profile, provider, model, prompt class, and network path. Change one dimension at a time:

1. **Fresh Session, one active step.** Establish an end-to-end baseline.
2. **Mature Session, one active step.** Tests history/event-volume effects without fan-out.
3. **Fresh Sessions at 1, 3, 5, then 8 active steps.** Tests shared-process concurrency without a long parent log.
4. **Mature Session before and after a Host restart.** A temporary reset implicates process-local accumulation; it does not identify the exact observer.
5. **New Session with a human-written handoff instead of a fork.** Tests the cost of carrying the complete durable prefix.

Stop the ladder when latency or provider cost exceeds your test budget. Use read-only prompts and a provider-side spending limit.

## Count the Session events

Use the Web header’s **Session log** export and inspect a copy of the logical `session.jsonl`. Count events and streamed chunk kinds:

```js
import { readFile } from 'node:fs/promises'

const counts = new Map()
const chunks = new Map()
for (const row of (await readFile('session.jsonl', 'utf8')).trimEnd().split('\n')) {
  const event = JSON.parse(row)
  counts.set(event.type, (counts.get(event.type) ?? 0) + 1)
  if (event.type === 'assistant/chunk') {
    const kind = event.data?.chunk?.type ?? 'unknown'
    chunks.set(kind, (chunks.get(kind) ?? 0) + 1)
  }
}
console.table(Object.fromEntries(counts))
console.table(Object.fromEntries(chunks))
```

Record the total event count, `assistant/chunk` count, the largest Session, and the number of simultaneously open model steps. A large transcript alone is correlation; pair it with the A/B ladder.

## Three verified pressure paths

### 1. Snapshot rebuild after an append

`Session.events` is an immutable cached array. `append()` pushes one event, invalidates the cached snapshot, and synchronously publishes `session/event`. The first subsequent `session.events` read recreates and freezes an array containing the complete log.

That read is O(total Session events), not O(new events). Previously returned snapshots remain stable, which is an intentional API property; the cost matters when a hot observer reads again after every streamed append.

### 2. Token-meter catch-up on streamed events

After a TokenMeter state exists for a Session, its `session/event` listener calls `_sync()`. At the verified commit, `_sync()` repeatedly reads `session.events.length` and `session.events[index]` while advancing its cursor. The cursor prevents re-folding old events, but the first snapshot read after each append can still copy the whole log.

This is a conditional path: the eager listener runs only when meter state has already been created. Capture the resolved composition and the active UI/consumer behavior before claiming it was active in your deployment.

### 3. Fork seed validation

A Session fork carries a durable prefix into a new Session. The Session constructor validates every seed event, snapshots or adopts it, checks sequence and surface invariants, and deep-freezes accepted values. That is synchronous work proportional to the forked prefix.

Fork latency and steady-state streaming latency are different measurements. A slow fork should not be used as proof that the provider TTFT is slow.

## Mitigate with controls that actually exist

### Reduce model-step overlap

Run independent subagent work in smaller batches and measure again. The verified source does not expose one documented Host-wide “maximum concurrent model streams” setting.

For work launched through the worker-thread Workflow engine, `maxConcurrentAgents` is a real engine configuration field. Set an explicit small value instead of the default `0`, which resolves from available CPU parallelism:

```yaml
config:
  maxConcurrentAgents: 2
```

This controls that Workflow engine’s `agent()` slots. It does not cap ordinary Web Sessions, all subagent providers, or every process-wide model request.

### Start a small Session instead of copying a large prefix

Write a short evidence-backed handoff and create a new conversation. This reduces durable event volume and avoids fork seed validation. Preserve the old Session for audit.

Compaction changes the model-visible surface; it does not erase the append-only durable event history. Do not treat a compact command as proof that the Session snapshot became small.

### Use restart only as an isolation test

A Host restart may temporarily improve latency in some deployments. Capture logs and process metrics first. Restarting does not reduce a resumed Session’s durable event count and is not a root-cause fix.

### Keep control names separate

- `maxParallelToolCalls` limits concurrent tool calls within an Agent step, not model streams across Sessions.
- Workflow `maxConcurrentAgents` limits child slots inside that Workflow engine.
- provider `maxTokens` limits one response’s output, not Host event processing.
- compaction limits model-visible context pressure, not append-only log length.

## Report a useful performance bundle

```text
Harness version and source commit:
Node version, OS, CPU, and memory:
Profile and resolved composition:
Provider/model and network path:
Session total events and assistant/chunk count:
Active model steps at each sample:
Fresh Session median/p90 TTFT:
Mature Session median/p90 TTFT:
t0 → t1 Host outbound:
t1 → t2 provider TTFT:
t2 → t3 Host inbound:
Before/after Host restart result:
Fork versus new-Session result:
Raw measurement script and anonymized rows:
```

Use a distribution, not one slow turn. Match the same request across Host and gateway by a stable request identifier or a defensible timestamp/model correlation, and describe the matching rule.

## Primary sources

- [Measured upstream report #3235](https://github.com/deepseek-ai/deepseek-harness/discussions/3235)
- [`Session.events` snapshot and append invalidation at `99f6f02`](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/session/src/index.ts)
- [Token-meter event listener and `_sync()`](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/llm/token-meter/src/index.ts)
- [Session fork and seed-validation semantics](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/docs/subsystems/session.md)
- [Workflow worker-thread concurrency controls](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/workflow/workflow-worker-thread/README.md)
- [JSONL/Zstandard Session export and persistence](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/session/session-persistence-jsonl/README.md)

