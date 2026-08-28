---
title: Bound DeepSeek Harness Session Heap Growth
locale: en
content_revision: 4
status: canonical
verified_at: 2026-08-28
upstream_ref: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Bound DeepSeek Harness Session heap growth

A compacted conversation can fit the model context while its Host process keeps retaining the complete live Session event log. Treat context size, durable history, resident heap, and concurrent subagent residency as four different budgets.

> [!WARNING]
> This guide verifies rc.2 source behavior. The approximately 4 GB Web Host failure in upstream discussion [#4722](https://github.com/deepseek-ai/deepseek-harness/discussions/4722) is a community report, not a benchmark reproduced by this handbook. Do not infer a universal crash threshold from it.

## The four budgets

| Budget | What owns it | What compaction changes | Failure evidence |
|---|---|---|---|
| model context | current Session surface plus request envelope | replaces older surface entries with a summary | prompt tokens, context limit, request header |
| live Session log | rc.2 `Session.log` array | nothing; replacement events append to the log | event count, retained bytes, heap snapshot |
| durable Session history | persistence backend | appends the replacement and preserves prior committed events | stored artifact size and event scan |
| resident Agent tree | Host, Agent handles, continuable subagent activations | nothing directly | live Agent/Session count, fan-out, heap slope |

This distinction explains the misleading combination “the context meter is healthy, but Node still runs out of heap.” Compaction is a model-input policy, not a garbage collector or Session-retention API.

## Separate renderer DOM growth from Host heap growth

Long conversations can also exhaust memory in the Web renderer even when the Host Session log is bounded. Upstream report [#4900](https://github.com/deepseek-ai/deepseek-harness/discussions/4900) describes a ChatView that renders the full conversation without virtualization, with Safari renderer memory rising with conversation length. Treat a multi-gigabyte renderer peak as incident evidence, not as proof of a universal threshold or a Host persistence leak.

Capture both processes independently:

| Signal | Renderer / ChatView | Host / Session |
|---|---|---|
| growth owner | DOM nodes, layout, decoded media, UI caches | event log, SessionStore, Agent tree |
| useful evidence | browser task manager, heap snapshot, node count, paint/layout time | RSS, `heapUsed`, event count, live Session/child count |
| safe mitigation | collapse or paginate history, limit rendered attachments, restart the tab | stop admission, cancel, flush/export, hand off to a new Session |
| what it does not prove | model context or durable log deletion | renderer virtualization or DOM retention |

Do not “solve” renderer pressure by deleting durable Session events, and do not infer that `/compact` will free DOM nodes. A virtualization or windowing change must preserve scroll position, message identity, tool-result expansion, and accessibility while rendering only a bounded visible slice. Test a cold restore and a long live conversation separately; a successful restart can hide a renderer leak without fixing it.

## What rc.2 actually retains

At upstream rc.2 commit `b150a55`:

1. `Session` owns `private log: SessionEvent[] = []`.
2. `append()` validates an event and calls `this.log.push(event)`.
3. The surface fold handles a `replace` operation by splicing `state.nodes`; it does not remove raw log entries.
4. The Session README explicitly says a replacement removes shadowed entries from future model input without deleting raw log records.
5. `SessionStore` holds live Session entries in an in-memory `Map` until their owning scope detaches them.
6. The continuation manager holds an `Activation` containing an `AgentHandle` in its own `Map` until settlement and child-first disposal complete.
7. Persistence is append-only and exposes no deletion or retention API in rc.2.

These facts prove an unbounded term exists when one live Session keeps appending events. They do **not** prove that every event consumes equal memory, that the raw array is the only holder, or that the report's exact heap ceiling applies to another Host.

## Stop a Host approaching the heap boundary

If resident memory keeps climbing during a long Session:

1. **Stop admitting new fan-out.** Do not launch another subagent wave or resume the same broad Goal.
2. **Cancel active work deliberately.** Preserve which parent and children were running; a process abort can lose in-flight work even when committed history survives.
3. **Flush or export supported Session evidence.** Do not hand-edit the live compressed log or delete files underneath its writer.
4. **Record the slope.** Capture `heapUsed`, `heapTotal`, RSS, live Session count, event counts by type, and active child count at fixed intervals.
5. **Restart only after a handoff is durable.** Continue the task in a fresh Session with a short, explicit handoff and smaller fan-out.
6. **Keep a provider budget.** A heap guard does not bound model spend, and a provider quota does not protect Host memory.

Increasing `--max-old-space-size` can buy diagnostic time. It is not a retention fix: it moves the abort boundary and may push the machine into swap. Record the old and new limit, then remove the override after the bounded reproduction.

## Route a cold-restore restart loop

A desktop wrapper can report the same visible cycle for three different boundaries: the Host is still computing, the Host has crashed, or a supervisor has terminated a live but temporarily unresponsive child. Do not call all three a “Session crash.”

At rc.2, cold preparation is partly asynchronous but Session reconstruction is synchronous:

1. `PersistenceCoordinator.prepareCore()` awaits the backend read.
2. It adopts and checks the stored event array and synthesizes any interrupted-turn closers.
3. It calls `ctx.sessions.prepare(..., { seedSource: 'persistence' })`.
4. `Session.fromRestore()` enters a synchronous loop over every seed event.
5. Each event is envelope-checked, request/message invariants are checked, the surface transition is validated, the restored object graph is frozen, and the event is pushed to the live log.

That source path establishes an event-loop-blocking risk proportional to the restored graph. It does **not** establish the timeout of a particular desktop wrapper, prove that a watchdog killed the process, or make any reported event count a universal threshold. Discussion [#4807](https://github.com/deepseek-ai/deepseek-harness/discussions/4807) reports synthetic heartbeat gaps and one local bounded trial; treat those measurements as incident evidence, not an official benchmark.

Follow-up live sampling in [#4911](https://github.com/deepseek-ai/deepseek-harness/discussions/4911)
shows why one snapshot is insufficient: the suspected `Array.some` hot path was
dominant in some five-second samples but nearly absent in others, while a
one-second CPU series still pulsed from idle to saturation. The sample identifies
a time-varying symptom, not a unique JavaScript root cause or proof that the
candidate path caused send latency. Preserve several timestamped rounds and keep
projection-miss latency separate from restore cost when comparing fixes.

### Capture one process timeline

Before changing a profile or retrying the same Session, collect:

```text
Desktop/main PID and start time:
Web Host PID, PPID, start time, and exact command:
Listener owner and port:
Session open/resume timestamp:
Last successful HTTP probe:
First slow or failed probe:
Signal, exit status, or supervisor termination line:
Replacement Host PID and start time:
Target Session artifact id, event count, and byte size:
Profile path and resolved package realpaths:
```

On macOS, `ps -o pid,ppid,lstart,command -p <pid>`, `lsof -nP -iTCP:<port> -sTCP:LISTEN`, and a timestamped `curl` to the already configured loopback URL can bind the observations. Use an endpoint the wrapper actually considers healthy; a successful TCP connection alone does not prove application readiness. Preserve private logs locally because commands, paths, prompts, and tool results may contain secrets.

### Run a bounded isolation ladder

1. **Fresh Session, same profile and process generation.** If it opens while one historical Session stalls, the evidence points toward Session-specific restore or projections rather than general boot.
2. **Copied artifact, stopped writer.** Preserve the exact stored artifact and metadata before any experiment. Never edit the live compressed file underneath the Host.
3. **Small and large disposable fixtures.** Keep event shapes and payload sizes fixed while varying count. Measure event-loop delay and HTTP latency separately from total restore duration.
4. **Direct Host versus desktop-managed Host.** Use the same profile, build, port semantics, and target Session. A direct Host that eventually responds while the wrapper-owned child is terminated isolates a supervision-policy difference; it does not prove the restore path is healthy.
5. **One runtime closure.** Resolve the packages used by the actual Host process. A global installation and a profile-local `node_modules` tree are separate physical copies even when their package versions match.

Do not “fix” the incident by patching both copies. First prove which copy the recorded PID loaded. A global edit that leaves the profile copy active is a no-op; aligning both copies destroys the comparison and creates an unsupported hybrid installation.

### Interpret the result

| Observation | What it proves | Next action |
|---|---|---|
| Host PID remains alive, CPU is high, probes pause, then recover | temporary event-loop starvation is plausible | capture restore size and delay; test bounded/yielding reconstruction in an isolated build |
| Host exits with its own error before a supervisor decision | Host failure | preserve exit status and stack; diagnose that error before tuning probes |
| wrapper logs a deliberate termination while the Host is still alive | supervisor policy participated | preserve the policy, threshold, and probe endpoint; compare a longer diagnostic grace window |
| fresh Session works; only one cold Session repeats the cycle | Session-specific replay path | quarantine only a copied artifact or avoid auto-opening it; retain the original for upstream diagnosis |
| direct and desktop-managed Hosts load different realpaths | runtime-copy drift | restore one supported installation owner; re-run with identical bytes |
| restart is healthy until the same Session is resumed | disk state rebuilds the pressure | measure seed events, bytes, surface folds, and projection construction |

Starting with a blank home may restore service, but it is not a recovery proof and can hide the triggering artifact. Keep the original home immutable, use a separate diagnostic home, and prove how any retained Sessions will be reintroduced.

## Build a minimal heap reproduction

Use disposable data and change one dimension at a time.

### Case A: event volume without fan-out

- one Session;
- one model route;
- deterministic synthetic tool results at fixed byte sizes;
- no subagents;
- record heap after every fixed number of completed messages.

This estimates the Session-shaped retained slope without a resident Agent tree.

### Case B: fan-out without long parent history

- fresh parent Session;
- fixed child count and fixed child output size;
- continuable behavior either consistently on or consistently off;
- wait for every child to settle, then observe whether heap returns toward the post-start baseline.

This separates temporary concurrent residency from the parent's cumulative history.

### Case C: compaction crossing

- repeat Case A;
- capture the first committed surface replacement;
- compare model-visible surface size, raw event count, and heap before and after the replacement.

If prompt size falls while event count and retained heap do not, the trace demonstrates budget separation. It still does not identify every retained object; use a heap dominator view for that.

### Case D: closed-chunk density

Count `assistant/chunk` events whose terminal `assistant/message` is already committed. Compare:

- raw chunk count and payload bytes;
- terminal message count and payload bytes;
- `sourceEventSeqs` cardinality;
- history-page wire bytes;
- retained heap by constructor or allocation site.

Discussion [#4678](https://github.com/deepseek-ai/deepseek-harness/discussions/4678) reports that closed-message chunks dominated one history page. Discussion [#4633](https://github.com/deepseek-ai/deepseek-harness/discussions/4633) reports one very large `sourceEventSeqs` array. Treat both as incident evidence until reproduced on the pinned build.

## Collect one diagnostic bundle

```text
Harness version and source commit:
Node version, OS, and effective old-space limit:
Host command and profile:
Sampling interval:
heapUsed / heapTotal / RSS series:
Live Session and Agent counts:
Active / waiting / settled child counts:
Events by type and estimated payload bytes:
Closed assistant/chunk count and bytes:
Surface node count and replaceGeneration:
Durable artifact size:
First compaction seq and before/after sample:
Cancellation, flush, and restart outcome:
```

Do not publish a real heap snapshot or Session log without review. Both can contain prompts, tool output, credentials, paths, and application data.

## Design the memory boundary without corrupting history

“Delete everything before the compaction event” is not a safe general repair. Older events can still matter to:

- a human transcript that must show material already seen;
- source-event references and validation;
- fork boundaries and lineage;
- usage, audit, telemetry, and plugin projections;
- durable replay and cold inspection;
- readers built against the append-only contract.

A compatible design separates three tiers:

1. **Durable archive:** complete ordered events, append-only under the current persistence contract.
2. **Resident reconstruction window:** the minimum indexed state required for current surface derivation, validation, active messages, and lifecycle continuity.
3. **Projection caches:** explicitly bounded and independently rebuildable UI, telemetry, and plugin views.

The memory policy must be byte-aware. An event-count limit alone treats a 20-byte boundary marker and a multi-megabyte tool result as equal.

### Closed-message chunk reclamation

Once an `assistant/message` commits, its final block list may make earlier text chunks redundant for final content. Reclaiming their payloads can be valuable, but only after the design answers:

- Does cold replay require chunk events or only the terminal message?
- Must `sourceEventSeqs` continue to resolve to full events, lightweight identities, or a compact range index?
- Which plugins consume live chunks, and which rebuild their state from stored history?
- Can usage chunks be reclaimed independently from text/reasoning chunks?
- How are in-progress messages preserved across a crash?
- Does a human transcript require streaming chronology or only final content?

Do not silently change stored history to solve a resident-memory problem. A hot representation may release redundant payloads while the durable archive remains complete, but that is a new compatibility contract and needs versioned tests.

### Resident subagent reclamation

Subagent residency has a different owner. Bound it independently with:

- concurrency and total-admission limits;
- a defined settlement state;
- immediate child-first disposal after settlement;
- cancellation that closes admission before awaiting descendants;
- restartable batches instead of one wide wave;
- metrics for active, waiting, settling, and disposed activations.

Fixing child residency alone does not bound a long-lived parent's append-only log. Fixing the parent window alone does not remove the peak from hundreds of simultaneously live children.

## Add a two-stage heap guard

An operator guard should use sustained samples, not one GC sawtooth:

1. **Soft threshold:** stop new Agent and subagent admission, emit a typed diagnostic, request cancellation or completion of active work, and flush durable state.
2. **Hard threshold:** cancel remaining work, reject new model/tool admission, flush within a bounded deadline, then exit cleanly so an external supervisor can restart.

Key the guard to the Host process, while attributing retained growth to Session and Agent identities. Define thresholds as validated configuration, not hardcoded constants. Include hysteresis so the Host does not oscillate between admit and reject after one collection cycle.

Never claim that a graceful exit preserved in-flight side effects. A tool may have crossed its external boundary before cancellation; recovery must verify side effects before retry.

## Failure router

| Observation | Likely boundary | Next evidence |
|---|---|---|
| context tokens fall after compaction; heap does not | raw log or another resident holder | event counts, heap dominators, projection caches |
| heap spikes with fan-out and falls after settlement | concurrent Agent tree | activation lifecycle and post-GC baseline |
| heap spike remains after every child disposes | parent log, cache, listener, or leak | parent event bytes and retained paths |
| durable artifact grows but live heap stays flat | disk retention only | storage policy; do not call it a Host leak |
| history API payload is huge but Host heap is stable | read projection / serialization | closed chunks and page construction |
| restart frees heap; resuming one Session restores it | seed/replay of retained history | loaded event types, bytes, surface and cache construction |
| increasing old space only delays failure | unbounded retained term | slope against events and active children |
| RSS grows while V8 heap stays flat | native buffers, mappings, or child processes | RSS breakdown and process tree |

## Regression gates

- Compaction tests assert that model-visible surface shrinks independently of durable log length.
- Resident-memory tests report bytes as well as event counts.
- A long single Session reaches a configured steady-state resident bound.
- Completed message chunks do not retain duplicate payloads beyond their documented lifetime.
- In-progress chunks survive until a terminal message, error, cancellation, or crash-repair boundary.
- `sourceEventSeqs` validation still detects missing, future, duplicate, and non-dense references.
- Cold replay derives the same final model messages before and after hot-window eviction.
- Human transcript semantics are explicitly tested across compaction.
- Fork and resume preserve lineage and selected completed-turn boundaries.
- Usage and audit projections retain their documented evidence.
- Unknown required event types still refuse reconstruction safely.
- Plugin chunk listeners receive the live stream once and release their accumulators at closure.
- One plugin retaining chunk payloads is attributable by owner and Session.
- Subagent settlement releases its Agent handle and Session after child-first disposal.
- Admission limits bound both simultaneous children and total calls per batch.
- A settled child report has a single bounded representation in its parent.
- Soft heap pressure stops new admission without deleting durable evidence.
- Hard heap pressure cancels, flushes within a deadline, and exits with a typed reason.
- A tool with uncertain side effects is never automatically replayed after restart.
- Restart and resume tests measure the rebuilt resident set, not only successful UI loading.

## Primary sources

- [rc.2 Session log and in-memory store](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/core/session/src/index.ts)
- [rc.2 surface replacement fold](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/core/session/src/surface.ts)
- [rc.2 Session package contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/core/session/README.md)
- [rc.2 continuable subagent activation lifecycle](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/subagent/subagent/src/continuation.ts)
- [rc.2 persistence contract and known retention limitation](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/session/session-persistence/README.md)
- [rc.2 cold Session preparation pipeline](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/session/session-persistence/src/coordinator.ts)
- [Upstream in-memory Session OOM report #4722](https://github.com/deepseek-ai/deepseek-harness/discussions/4722)
- [Upstream macOS cold-restore and restart-loop report #4807](https://github.com/deepseek-ai/deepseek-harness/discussions/4807)
- [Upstream Web ChatView non-virtualized memory report #4900](https://github.com/deepseek-ai/deepseek-harness/discussions/4900)
- [Closed-message chunk elision proposal #4678](https://github.com/deepseek-ai/deepseek-harness/discussions/4678)
- [`sourceEventSeqs` history overflow report #4633](https://github.com/deepseek-ai/deepseek-harness/discussions/4633)

## Related handbook guides

- [Bound subagent scale](../agent-patterns/subagents.md)
- [Protect and recover live Session logs](../troubleshooting/live-session-log-durability.md)
- [Read the Session log storage format](../reference/session-log-storage-format.md)
- [Classify context-window overflow](../troubleshooting/context-window-exceeded.md)
- [Stop a runaway Agent loop](../troubleshooting/runaway-agent-loop.md)
