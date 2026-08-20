---
title: Stop a DeepSeek Harness Tool That Will Not Cancel
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
---

# Stop a DeepSeek Harness tool that will not cancel

When a download, package installation, shell command, or plugin tool appears stuck, the DeepSeek Harness Stop action has two distinct milestones:

1. the Host accepts the cancellation request and aborts the active Agent signal;
2. every already-started operation cooperates, stops its owned work, and lets the Agent become idle.

On rc.8, `session.cancel` returns `{ accepted: true }` immediately after calling `agent.cancel(...)`. It does not wait for tool settlement. A UI acknowledgement therefore proves signal delivery was requested—not that a foreground process, subprocess tree, network request, or same-process plugin has stopped.

```text
Stop click
  → session.cancel
  → accepted: true
  → Agent AbortSignal fires
  → active tool must cooperate
  → process tree and pipes quiesce
  → tool/result + turn/end { aborted }
  → Agent idle
```

If the tool ignores its signal, blocks the event loop, or leaves a descendant alive, the last three transitions may never happen.

## First prove where cancellation stopped

Record one ordered timeline:

```text
DSH version or commit:
Surface and selected profile:
Session id, turn, step, and tool call id:
Tool name and sanitized arguments:
Stop-click timestamp:
session.cancel RPC response and timestamp:
Last durable Session event:
Last tool output timestamp:
Host health-probe result:
Owning process and descendants:
Provider usage after Stop:
```

Interpret the boundary:

| Evidence | Likely boundary |
|---|---|
| no `accepted` response and Host health probe also hangs | blocked Host event loop or transport |
| `accepted: true`, UI still running, child remains | tool/process ignored or incompletely handled cancellation |
| child exits, tool call never settles | plugin promise, pipe, cleanup, or post-execute listener remains open |
| `turn/end { aborted }`, then new work starts | preserved inbox item resumed after cancellation |
| process restarted, then a prompt causes the command again | a new model decision or recovery retry—not the old OS process resuming |

Do not repeatedly press Stop. One accepted request is enough to begin diagnosis; repeated clicks do not make an uncooperative promise cancellable.

## Contain a live incident

1. Stop sending follow-ups or “continue” prompts to the affected Session.
2. Check provider usage separately; a frozen tool is not necessarily an active model request.
3. Preserve terminal output and the Session artifact before destructive recovery.
4. Inspect the process tree and identify the exact child owned by the tool.
5. If the normal Stop action was accepted but the tool does not settle, terminate only that owned process tree using the platform's ordinary process controls or a reviewed tool-specific emergency action.
6. If the Host event loop itself is frozen, terminate the exact DSH Host process through the supervisor or OS, then verify no child survives.
7. Start a fresh Session for continued work until the tool implementation is repaired.

Do not kill processes by a broad name match. A machine can have unrelated `python`, `node`, `curl`, `git`, or package-manager processes. Resolve the parent PID, command line, start time, Session, and workspace before terminating anything.

## Why an accepted cancel may still wait

The rc.8 tool registry defines cancellation as cooperative and quiescent. Every tool receives a required `exec.signal`; the registry preserves the caller signal through wrappers and never races away from a started same-process promise. This prevents a tool result from being recorded while its side effect continues invisibly, but it also means an uncooperative tool can delay idle forever.

A correct long-running tool must:

- pass `exec.signal` to fetch, filesystem, subprocess, and nested tool operations;
- terminate the complete owned process tree on abort;
- consume or close stdout and stderr pipes;
- stop timers, readers, workers, and background callbacks;
- wait for owned work to reach quiescence;
- settle the original tool promise exactly once.

For plugin subprocesses, follow the [async subprocess tool guide](../plugin-development/async-subprocess-tools.md). Replacing `spawnSync` with shell-based `exec` is insufficient: it removes event-loop blocking but retains shell injection and may still mishandle descendants.

## `accepted` is not `idle`

Use separate UI states:

```text
running → cancellation requested → stopping → idle
                                ↘ stop failed / timed out
```

After `session.cancel` returns `accepted`, keep observing durable Session events or Agent status. The product should not render “Stopped” until the Agent reaches idle and the turn records its terminal outcome. If stopping exceeds a bounded UI threshold, disclose that work is still quiescing and offer diagnostic evidence—not another synthetic cancel.

The Web Host currently cancels ordinary Sessions with `keepInbox: true`. Pending inbox messages are preserved and resume FIFO after cancellation settles. A user can therefore see new work start after a genuine aborted turn. That is not proof the cancel failed; inspect which queued message opened the next turn.

## Understand restart recovery before saying “continue”

A process restart destroys the old in-memory child and promise. On cold Session load, rc.8 persistence repairs an interrupted final turn:

- a model tool call that never durably started receives `TOOL_NOT_STARTED`;
- a durable `tool/call` without a result receives `TOOL_OUTCOME_UNKNOWN`;
- the interrupted step and turn receive synthetic closing events.

`TOOL_OUTCOME_UNKNOWN` intentionally tells the model that the side effect may have happened. A later “continue” prompt creates a new turn. The model may decide to retry, verify, or ask—not because DSH reattached to the vanished process, but because the durable recovery result requires risk-aware continuation.

Before continuing:

1. inspect the external state the old command may have changed;
2. classify the operation as read-only, idempotent, compensatable, or irreversible;
3. retry automatically only when read-only or proven idempotent;
4. verify or ask before repeating writes, installs, uploads, payments, or remote mutations;
5. use a fresh Session if the old thread repeatedly chooses an unsafe retry.

## Repair contract for tool authors

An upstream repair should prove all of these, not merely make the button responsive:

- cancellation reaches the tool through the exact caller-owned signal;
- a started external process receives bounded tree-scoped termination;
- no return occurs while a child, pipe, worker, or timer remains owned;
- skipped sibling tool calls receive their correct durable results;
- the active turn closes as aborted only after tool settlement;
- queued inbox work resumes only after that boundary;
- disposal follows the same cancel-then-quiesce contract;
- the Web control plane remains responsive while the tool stops.

For downloads and installations, prefer background-job mode when available. A job id gives the operator an explicit output and termination surface instead of holding the Agent's foreground step open for minutes.

## Acceptance gates

- [ ] `session.cancel` returns `accepted` promptly on a responsive Host.
- [ ] UI distinguishes accepted cancellation from settled idle.
- [ ] The active tool receives and forwards the abort signal.
- [ ] The complete owned process tree exits within the tested bound.
- [ ] Pipes, timers, workers, and callbacks are quiescent before settlement.
- [ ] Exactly one authoritative tool result and terminal turn outcome are durable.
- [ ] Pending inbox work is visible and does not masquerade as the cancelled turn.
- [ ] Restart recovery classifies unknown side effects before any retry.
- [ ] “Continue” cannot blindly replay non-idempotent work.
- [ ] Another Session and the Web health probe remain responsive.
- [ ] Emergency termination targets one verified owner, never a broad process name.
- [ ] Provider usage stops or is independently contained.

## Primary sources

Verified against DeepSeek Harness rc.8 commit `141eb6fef83422698aef7a981029e843e8161534` on 2026-08-20.

- [Official stuck-tool cancellation report #3400](https://github.com/deepseek-ai/deepseek-harness/discussions/3400)
- [rc.8 Web Host `session.cancel` implementation](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/host/apiproxy/src/api-proxy.ts#L2617-L2633)
- [rc.8 cooperative tool cancellation contract](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/core/tools/README.md#cancellation)
- [rc.8 Agent cancellation implementation](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/core/agent-loop/src/agent.ts#L134-L140)
- [rc.8 interrupted-turn persistence recovery](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/session/session-persistence/README.md)
- [Stop a runaway Agent loop](runaway-agent-loop.md)
