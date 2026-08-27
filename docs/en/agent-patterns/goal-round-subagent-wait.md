---
title: Stop Goal Rounds While Subagents Are Still Running
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-27
upstream_revision: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Stop goal rounds while subagents are still running

A DeepSeek Harness Goal can start a background subagent, return the parent Agent to `idle`, and immediately admit another Goal round even though the child is still working. A prompt that tells the parent not to poll may prevent tool calls inside that round, but it cannot prevent the model request, large-context prefill, history append, or round consumption that already happened.

The scheduling invariant is:

```text
local parent idle != owned work quiescent
```

This guide explains the behavior in `0.1.1-rc.2`, contains it with current public workflows, and defines an event-driven admission design that sleeps until the relevant child lifecycle changes.

> [!WARNING]
> Do not implement a short polling timer around `list_agents`, child Session state, or provider activity. Polling merely moves the busy loop out of the model. It still creates load, races durable state, and turns elapsed time into scheduler work.

## Recognize the failure

The characteristic trace is not a child that repeatedly starts. It is one long-lived child plus several parent model requests:

```text
parent Goal round N
  -> starts background child run A
  -> parent turn ends and parent Agent becomes idle

child run A: running ---------------------------------------> settled
parent:      idle -> round N+1 -> idle -> round N+2 -> idle -> round N+3
                         "still waiting"     "still waiting"
```

Confirm all of these before assigning the diagnosis:

1. one Goal remains `active` and process-locally `armed`;
2. the exact parent Agent repeatedly transitions to `idle`;
3. one child activation owned by that parent remains between its paired lifecycle edges;
4. each new parent request has `source.kind === "goal"` and an increasing positive round;
5. no human message, child settlement, Goal mutation, or watchdog event explains the wake;
6. the parent produces little useful work because its only missing dependency is the child result.

A child may legitimately finish one phase and receive another message. Correlate activation `runId`, not only the durable child Session id: continuable children can have several residency epochs, while every accepted one-shot run or continuable activation receives one paired start/end identity.

## Why the prompt cannot solve admission

The rc.2 Goal driver listens for the exact Agent's `agent/status` event. At `idle`, it requests a serialized drive pass. `readyToDrive()` checks the Cordis fiber, plugin lifecycle, exact live Agent identity, the parent's local status, and competing inbox work. It does not consult outstanding descendants.

If the Goal is active, armed, and below `maxGoalRounds`, the driver reserves the next number and calls `agent.followup()` with a retained `<goal_round>` user message. The model sees “do not poll” only after that message passes pre-step validation and enters the Session.

```text
parent idle
   ↓ admission decision happens here
reserve round + append goal prompt + invoke model
   ↓ prompt instruction acts here
model decides not to poll
```

The instruction can reduce output and tool work. It cannot undo inference admission, context prefill, the retained prompt, or the goal-round number. On a shared local inference server, these parent prefills may also compete with the child they are waiting for.

The upstream README calls `agent.whenIdle()` and the status checkpoint whole-Agent quiescence. In this context, “whole Agent” covers replacement work for that exact Agent lifecycle. It does not mean quiescence of the subagent ownership tree. The Web client separately aggregates running descendants for presentation, which is further evidence that local parent state and descendant activity are different projections.

## Contain the behavior without patching rc.2

Choose a containment that matches the workflow rather than hiding the cost.

### Keep required delegation in the foreground

The model-facing subagent tool collects synchronously by default. While the parent tool execution awaits the child result, the parent has not reached the idle checkpoint that admits the next Goal round.

Use foreground delegation when:

- the parent cannot make progress before this child completes;
- child duration fits the request, provider, proxy, and operator timeouts;
- cancelling the parent should cancel the child;
- the child result belongs in the current tool result.

Do not convert every background job to foreground. A 30-minute child behind a 10-minute reverse-proxy timeout simply exchanges repeated prefills for a broken connection.

### Pause automatic continuation deliberately

Pause or disarm the Goal before starting long background work, then resume through an explicit human-authorized action after settlement evidence is visible. This prevents automatic rounds but is intentionally not autonomous: a paused or disarmed Goal does not promise to wake itself when the child finishes.

Use this for expensive local inference or an incident containment. Record the child identity and resumption owner so a completed child does not leave the Goal forgotten.

### Give the parent independent work

Parallel background delegation is appropriate when the next parent round has bounded work that does not depend on the child. The Goal should state that independent work explicitly and eventually converge on a settlement edge. Do not invent low-value work merely to justify repeated inference.

## Design the admission latch

The source already exposes the necessary lifecycle vocabulary:

- `subagent/start(info)` after a child run is published;
- `subagent/end(info)` after its result settles;
- a stable `info.runId` shared by the pair;
- scope-filtered dispatch keyed by the exact delegating parent;
- `info.id`, provider, local/remote classification, stop reason, and optional final output.

For each exact live parent Agent, maintain a set of owned active run ids. A Goal drive pass may reserve a round only when that set is empty.

```ts
interface GoalWaitState {
  activeOwnedRuns: Set<SubagentRunId>
  generation: number
  wakeRequested: boolean
}

onScopedSubagentStart(parent, info) {
  state(parent).activeOwnedRuns.add(info.runId)
  state(parent).generation++
}

onScopedSubagentEnd(parent, info) {
  state(parent).activeOwnedRuns.delete(info.runId)
  state(parent).generation++
  requestDrive(parent)
}

readyToDrive(parent) {
  return parent.status === "idle"
    && state(parent).activeOwnedRuns.size === 0
    && goalIsActiveArmedAndBelowCap(parent)
}
```

The set is an admission latch, not a child catalog. It tracks active ownership epochs only. Durable `listChildren()` and Session projections solve discovery and UI questions; they are too broad and too stale-prone to replace paired live lifecycle edges in a scheduler.

### Close the check-to-reserve race

A single `size === 0` check is insufficient. A child can start after the check and before `agent.followup()` reserves the Goal message.

Use the same serialized driver that owns Goal reservation and treat subagent lifecycle changes like competing input:

1. read the active-run set and its generation inside the parent-local driver;
2. perform any required Session durability checkpoint;
3. recheck parent identity, Goal id/revision/activation, competing input, active-run count, and generation;
4. create the reservation only if the complete snapshot is unchanged;
5. recheck the same ownership condition in `agent/pre-step` before and after downstream listeners;
6. reject a stale queued Goal prompt without consuming an admitted round;
7. let the later `subagent/end` edge request exactly one coalesced drive pass.

This mirrors the existing revision and inbox race fences instead of adding an independent scheduler.

## Define what blocks a round

The safe default is direct, owned activation epochs:

| Work state | Block automatic Goal admission? | Reason |
|---|---:|---|
| direct one-shot background run active | yes | parent owns one pending result lifecycle |
| direct continuable activation active | yes | current child epoch is still producing work |
| continuable child exists but has no active epoch | no | durable existence is not active work |
| synchronous child awaited by parent tool | already covered | parent should not be locally idle |
| ordinary fork with no subagent origin | no | it is not owned subagent work |
| detached external job outside the subagent seam | policy-specific | needs its own typed lifecycle and owner |
| descendant of an active direct child | covered by direct child | the direct activation cannot settle before its owned work contract settles |

If a provider can publish an end edge while descendant work remains detached, that provider must state the transfer-of-ownership contract. Do not make the Goal driver infer ownership by recursively scanning every live Session.

## Wake only on meaningful edges

The normal wake set should be small:

- the last blocking `subagent/end` for the parent;
- a human or authorized external message;
- a Goal mutation such as resume, edit, complete, or block;
- a process lifecycle event that explicitly re-establishes authority;
- an optional wall-clock watchdog owned by deployment policy.

A watchdog is not a periodic Goal round. It should schedule one timer per waiting episode, emit a diagnostic when it expires, and then choose a policy such as notifying an operator, blocking the Goal, or admitting one health-check round. Cancel it when the last child settles, the Goal changes revision, the Agent is disposed, or the plugin unloads.

Do not use child output tokens, provider stream chunks, UI refreshes, or repeated `idle` events as wake causes.

## Preserve lifecycle and failure semantics

The latch needs fail-loud rules:

- duplicate start for one active `runId`: log an invariant failure; do not increment a counter twice;
- end without a known start: log it and request a conservative reconciliation, but never drive from a negative count;
- provider rejection after start: the seam emits `subagent/end` with `stopReason: "error"`, releasing the latch;
- parent disposal or Session switch: discard process-local run state for that exact lifecycle;
- Goal pause, completion, block, or revision edit: suppress the pending wake even if a child later settles;
- plugin unload: close admission first, remove lifecycle listeners only after driver tasks quiesce, and do not synthesize Goal rounds;
- remote process loss: choose an explicit timeout or recovery authority; absence of an end event must not silently mean completion.

An end edge releases scheduling suppression. It does not prove the child succeeded. The next admitted round must inspect `stopReason`, durable results, or parent-delivered output and decide whether to continue, retry through authorized policy, or block.

## Measure the cost and the fix

Instrument scheduling decisions without logging prompts or child output:

```text
goal_wait_started_total{provider,local}
goal_round_suppressed_total{reason="owned-subagent-active"}
goal_wait_duration_seconds
goal_owned_active_runs
goal_round_admitted_total{wake="child-settled|human|goal-change|watchdog"}
goal_parent_prefill_total
```

Correlate with opaque Goal id/revision, parent Session id, and run id under the deployment's telemetry policy. Avoid child prompts, tool arguments, credentials, and assistant content.

The success signal is not merely fewer rounds. It is zero parent inference between the wait start and the meaningful wake, followed by one coalesced admission when the last required child settles.

## Regression matrix

Use fake time and controllable child promises. Cover at least:

1. parent becomes idle with one active child: no Goal prompt is queued;
2. child settles while parent stays idle: exactly one Goal round is queued;
3. two children settle in either order: no wake after the first, one after the second;
4. child starts between initial readiness and post-checkpoint recheck: reservation is suppressed;
5. child starts after queueing but before pre-step: stale Goal prompt is rejected without consuming a round;
6. child settles before listener reaction: paired generation state still produces one coalesced drive;
7. duplicate start/end delivery: invariant reports without negative counts or duplicate rounds;
8. child ends with error, abort, max-tokens, or refusal: latch releases and outcome remains visible;
9. inactive continuable child exists: it does not block a Goal round;
10. ordinary fork runs: it does not enter the owned-run set;
11. human input arrives during the wait: it wins the existing competing-input fence;
12. Goal is paused, completed, blocked, or edited while waiting: child settlement does not revive stale authority;
13. parent Session switches or Agent is replaced: old lifecycle edges cannot wake the new Agent;
14. watchdog and final child settlement race: at most one drive request survives;
15. plugin teardown with active children: no post-unload round enters the inbox;
16. a 30-minute fake child with many parent idle notifications: parent model invocation count remains zero during the wait.

## Operator acceptance gate

- [ ] The trace proves repeated parent Goal admissions while one owned child activation remains active.
- [ ] Parent-local idle is not described as ownership-tree quiescence.
- [ ] Prompt instructions are not presented as an inference-cost fix.
- [ ] Current containment uses foreground collection or an explicit pause/resume owner.
- [ ] Scheduling uses paired scoped lifecycle edges and `runId`, not Session-id polling.
- [ ] Only active activation epochs block; inactive continuable children do not.
- [ ] The ownership generation is rechecked after every await and at pre-step.
- [ ] Multiple settlements coalesce into one drive pass.
- [ ] Child failure releases the latch without being misreported as success.
- [ ] Human input and Goal revisions retain their existing priority and stale-work fences.
- [ ] Watchdogs are one-shot policy events, not periodic model rounds.
- [ ] Telemetry proves zero parent inference during the waiting interval.
- [ ] Tests cover Session replacement, teardown, duplicate events, and settlement races.
- [ ] No prompts, tool arguments, credentials, or child output enter scheduler metrics.

## Primary sources

- [Goal rounds busy-loop while long-running subagents are active #4715](https://github.com/deepseek-ai/deepseek-harness/discussions/4715)
- [rc.2 Goal-round driver admission and lifecycle](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/goal/goal-round-driver/src/index.ts)
- [rc.2 Goal-round driver contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/goal/goal-round-driver/README.md)
- [rc.2 subagent lifecycle event contracts](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/subagent/subagent/src/types.ts)
- [rc.2 paired and parent-scoped lifecycle publication](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/subagent/subagent/src/lifecycle.ts)
- [rc.2 in-process child settlement](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/subagent/subagent-in-process-driver/src/index.ts)
- [rc.2 Web descendant activity projection](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/runtime/README.md)

