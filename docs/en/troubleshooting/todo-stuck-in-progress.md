---
title: DeepSeek Harness Todo Stuck In Progress
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-19
upstream_revision: 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
---

# A finished answer does not finish a DeepSeek Harness todo

If an Agent has delivered its final answer but the Web plan strip still shows its last task as `in_progress`, first inspect the last `todo/write` event. In rc.7 the UI is normally rendering the durable state exactly as written; it is not deriving completion from prose or from `turn/end`.

```text
todo_write([…, { status: "in_progress" }])
  → todo/write whole-list snapshot
  → assistant final text, no later todo_write
  → turn/end { kind: "completed" }
  → plan strip still shows in_progress
```

> [!IMPORTANT]
> `turn/end.reason.kind === "completed"` means the Agent loop ended normally because the last assistant message requested no more tools. It does not prove that every user-visible task was accomplished.

## Separate four sources of truth

| Evidence | Owns | Does not own |
|---|---|---|
| assistant prose | what the model told the user | structured todo status |
| `todo_write` call | requested complete replacement list | whether claimed work truly succeeded |
| `todo/write` event | durable latest todo snapshot | Agent-loop liveness |
| `turn/end` | why the runtime turn stopped | automatic todo reconciliation |

The tool accepts the **entire** list on every call and appends it as one `todo/write` event. There are no per-item mutations and no stable todo IDs. Replay and projections are last-write-wins.

The model-facing description already tells the model to mark each item `completed` immediately and to leave no `in_progress` item once all work is complete. The runtime validates shape, unique trimmed content, the status enum, and—depending on composition—the number of simultaneous active items. It does not check whether the model's task claim matches external reality.

## Why the strip survives the final answer

The `todos` Session projection implements a standing-plan lifetime:

```text
latest todo/write  ─────── retained ─────── turn/end
       │                                      │
       └────────────────────────────── next turn/start → null
```

- `todo/write` replaces the projected list;
- `turn/end` returns the same state reference;
- the next `turn/start` clears the projection to `null`;
- every other event leaves it unchanged.

This is deliberate. A completed checklist remains visible after the answer, while the next user turn starts with no stale plan. The same rule also preserves an incorrectly active checklist until the next turn.

The Web page has two related but different surfaces:

1. the `todo_write` tool row summarizes that call's arguments and execution state;
2. the docked Todo panel reads the Host-computed latest `todos` projection.

Do not diagnose a projection bug from one old tool row. Compare the dock with the latest durable `todo/write` event.

## Diagnose in event order

Collect a Session export or use the Session event tools available in the active profile. Preserve these events in order:

```text
last todo_write tool/call
last todo/write snapshot
matching tool/result
last assistant/message
last turn/end and its reason
next turn/start, if one exists
```

Route the result:

| Evidence | Classification | Response |
|---|---|---|
| latest snapshot contains `in_progress`; no later write | model omitted final reconciliation | improve completion discipline or add a bounded stop guard |
| latest snapshot is all `completed`, dock still active | projection delivery or Client state defect | capture projection `asOfSeq`, event stream, and fresh reload result |
| `todo_write` tool call failed; no `todo/write` event | rejected or interrupted tool execution | fix the call error; do not infer a write from its arguments |
| old tool row shows active but dock is complete | historical call presentation | no state defect; the row describes that call |
| next `turn/start` exists but dock still shows the prior list | projection/client refresh defect | report exact event and projection sequence numbers |
| `turn/end` is aborted, blocked, error, max-tokens, or interrupted | work may be unfinished | never auto-complete remaining items |

## Safe user recovery

For a normal interactive Session, send a new message asking the Agent to verify the actual results and reconcile the task list. The next `turn/start` clears the standing plan before any new `todo_write`; a careful Agent may then create a fresh accurate list.

Do not edit the JSONL Session log merely to change a spinner. That log is append-only, sequence-sensitive evidence used by replay and other projections. Do not declare success solely to make the UI green.

If the final answer itself is correct and no durable audit of todos is required, the next turn naturally clears the strip. Record the mismatch first when investigating an upstream defect.

## Improve Agent behavior without lying

Prompt reinforcement is the smallest change, but it is probabilistic. Keep the invariant explicit:

```text
Before sending a final answer, compare every todo with verified evidence.
Call todo_write with the complete list and no in_progress item only when all
work is actually complete. If work is blocked or unfinished, preserve that
truth in the list and explain it to the user.
```

A stronger composition can add a bounded `agent/turn-stopping` guard:

1. read the latest whole-list todo snapshot for that Agent Session;
2. if any item is active, steer one explicit reminder into one more step;
3. let the model verify results and call `todo_write` itself;
4. allow at most one reconciliation continuation per turn;
5. never mutate the list silently in the guard.

`agent/turn-stopping` is the correct live seam because it runs when the turn would otherwise close, and a listener can call `agent.steer()` to create a real, logged next step. A one-shot bound is essential: a model that repeatedly refuses or fails to reconcile must not create an endless paid loop.

## Why automatic completion at `turn/end` is unsafe

Do not implement “map every active todo to completed on any turn end.” Turn endings include:

- `completed`: normal protocol stop, not proof of external task success;
- `aborted`: user, parent, hook, disposal, or other cancellation;
- `blocked`: a pre-step policy rejected work;
- `error`: the model, tool pipeline, or runtime failed;
- `max-tokens`: output ended at the model limit;
- `interrupted`: persistence repaired a crash-orphaned turn.

Even a normal completion may be premature: the model can omit a tool call, misunderstand evidence, or simply claim success. Structured task truth must remain an explicit model/tool action or an independently verified application decision.

## Regression matrix

Test both the durable log and rendered projection:

1. final `todo_write` marks all items completed → completed strip survives `turn/end`;
2. final answer omits reconciliation → active state remains visible and diagnosable;
3. next `turn/start` clears either prior state;
4. rejected or cancelled `todo_write` appends no `todo/write` snapshot;
5. stop guard issues at most one steering continuation;
6. guard never changes todos on aborted, blocked, error, max-token, or interrupted endings;
7. parallel policy preserves multiple legitimate active items during work;
8. replay produces the same last-write-wins list and projection `asOfSeq`;
9. tool row and dock are tested as separate surfaces;
10. a mobile reconnect receives the same Host projection as desktop.

## Primary sources

- [Official todo tool implementation and model-facing description](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/todo/tool-todo/src/index.ts)
- [Official todo projection lifetime test](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/todo/tool-todo/tests/projection.spec.ts#L94-L106)
- [Official Web Todo panel](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/client/ui-conversation/src/client/skeleton/TodoPanel.tsx)
- [Official Agent stopping lifecycle](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/agent-loop/src/agent.ts#L260-L325)
- [Official turn-ending reason model](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/session/src/types.ts#L155-L177)
- [Upstream report #3424](https://github.com/deepseek-ai/deepseek-harness/discussions/3424)
