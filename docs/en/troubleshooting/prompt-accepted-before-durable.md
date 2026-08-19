---
title: Recover a Prompt Accepted Before It Became Durable
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
---

# Recover a prompt accepted before it became durable

If Web clears a long prompt, then reports that the turn failed without showing your message in the transcript, do not assume the provider deleted it. In rc.7, prompt submission crosses two different boundaries:

1. **Host admission:** `session.prompt` returns `accepted: true` after placing an identified message in the Agent inbox.
2. **Session durability:** the Agent later appends `user/message` only after `turn/start`, prompt assembly, inbox claim, and `step/start`.

A failure between those boundaries can consume the inbox item before its user-facing Session event exists. The browser already committed the optimistic clear, so neither the transcript nor the draft necessarily contains the text.

> [!IMPORTANT]
> An accepted RPC receipt is not the same evidence as a durable `user/message`. Check the Session event log before retrying. A missing assistant answer alone does not prove the prompt is missing; a missing user event does.

## The rc.7 submission path

```text
browser draft
  -> optimistic clear
  -> session.prompt RPC
  -> Host creates UserMessage with rpcId
  -> Agent inbox
  -> accepted: true
  -> turn/start
  -> inbox claim
  -> system-prompt assembly
  -> step/start
  -> user/message append
  -> provider request
```

The browser restores the text when the RPC itself rejects, but only while the same session input shell still exists and its draft is still empty. That safeguard handles transport and admission failures without overwriting newer typing.

It cannot restore a prompt after an accepted response. At that point the UI treats the send as committed. If Agent processing fails before `user/message`, the original browser draft has already been discarded.

## Classify the failure before retrying

Export or inspect the Session events and locate the prompt by its content or `source.rpcId`.

| Evidence | State | Safe next action |
|---|---|---|
| composer contains the original text | admission failed and draft restoration succeeded | fix the reported route or connection error, then resend once |
| `user/message` exists, no provider request began | durable prompt, pre-request runtime failure | do not duplicate; repair the runtime and continue the Session |
| `user/message` and `agent/request-error` exist | durable prompt, provider or gateway failure | use the provider error and normal bounded retry path |
| `turn/start` exists but no matching `user/message` | pre-durable claim window | recover from an external copy; do not claim the Session log contains the prompt |
| no turn and no message | failure before Host admission, or wrong Session | check prompt error, connection, and addressed Session |
| outcome is unknown and the prompt could have effects | ambiguous delivery | inspect events and external side effects before replaying |

The visible error text “turn failed” is too broad to choose a replay policy. The ordered events are the authority.

## Preserve a long prompt before sending

Until the durability gap is closed upstream:

- compose high-value prompts in a versioned file or editor;
- copy the final text before pressing Send;
- keep destructive instructions idempotent and include a task key;
- split large attachments from critical operator instructions when practical;
- after a failure, inspect the Session before pasting again.

Do not put credentials in a scratch file or clipboard history. Preserve only the minimum recoverable content and delete sensitive temporary material through your normal secure workflow.

## Recover without duplicating effects

Use this sequence:

1. Stop repeated automatic retries.
2. Record the Session id, time, visible error, provider/model, and whether the composer restored text.
3. Inspect the tail from `turn/start` through `turn/end` and look for the exact `user/message` or its `rpcId`.
4. If the message is durable, continue from that Session; do not resend merely because no assistant bubble appeared.
5. If the message is absent, recover the external copy and start a fresh bounded turn.
6. If the prompt requested writes, messages, payments, deployment, or deletion, verify the target system before replaying.
7. Add an idempotency marker such as `task: incident-2026-08-20-01` when the downstream operation supports one.

If no external copy exists and no `user/message` exists, rc.7 has no durable source from which to reconstruct the exact text. Screenshots, browser history, provider logs, or server logs may prove that a failure occurred, but do not invent the missing prompt.

## Why immediate optimistic echo is not enough

Rendering a temporary user bubble immediately improves feedback, but it still needs an explicit state machine:

```text
pending locally -> admitted -> durable -> processing -> complete
                \-> rejected
                            \-> failed before durable
```

A pending bubble must not masquerade as a Session event. It needs a stable client message id or `rpcId`, a visible pending/failed state, retry and copy actions, and reconciliation when the matching durable `user/message` arrives.

Without identity-based reconciliation, reconnect or replay can show duplicates. Without a failed-before-durable state, the UI can imply that content is stored when it is still only browser memory.

## A narrow repair boundary

A robust implementation should make one boundary authoritative:

### Option A: persist before acceptance

Append a durable pending user-input record before returning `accepted: true`, then let Agent entry promote it into the conversation surface. This gives the receipt a durable meaning, but requires Session invariants for pending, rejected, cancelled, and never-entered inputs.

### Option B: retain until durable acknowledgment

Keep the submitted draft in a browser outbox keyed by `rpcId`. Clear it only when the matching `user/message` frame arrives. If processing fails first, restore or expose Copy/Retry without overwriting a newer draft.

This is smaller at the Host boundary but must survive reconnect, tab lifecycle, duplicate frames, and Session switching. Browser-only memory still cannot protect a closed or crashed tab unless the outbox is persisted deliberately.

### Do not append the same message twice

The inbox item and the eventual Session surface entry must share identity. A repair must reconcile one logical user input across the RPC receipt, queue, Session event, and optimistic bubble. Text equality is insufficient because two identical prompts may be intentional.

## Evidence bundle for an upstream report

Share sanitized evidence:

```text
Harness version and source revision:
Web origin and browser:
Session id:
provider/model:
send mode: queue | steer
RPC result: accepted | rejected | transport unknown
composer restored: yes | no
ordered tail event types:
matching user/message present: yes | no
source.rpcId when present:
turn/end reason or agent error:
reproduction with a harmless prompt:
```

Never publish prompt secrets, attachment bytes, credentials, or private paths. Replace content with a harmless unique marker when reproducing.

## Regression gates

1. rejected RPC leaves the original draft recoverable;
2. restoration never overwrites text typed after submission;
3. accepted receipt and durable message are represented separately;
4. optimistic bubble has a visible pending state;
5. matching `rpcId` reconciles pending and durable forms exactly once;
6. pre-durable failure exposes Copy and Retry;
7. reconnect does not duplicate the user bubble;
8. Session switching cannot restore text into the wrong composer;
9. image drafts retain or safely release their object resources;
10. queue and steer paths share the same durability proof;
11. side-effecting prompts require outcome verification before replay;
12. a durable prompt remains visible even when the provider never answers.

## Source evidence

- [Community report #3441](https://github.com/deepseek-ai/deepseek-harness/discussions/3441)
- [Pinned optimistic clear and conditional draft restoration](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/client/ui-conversation/src/client/input/hub.ts)
- [Pinned conversation send admission](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/client/ui-conversation/src/client/service.ts)
- [Pinned browser Session prompt state](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/client/runtime/src/client/sessions/session.ts)
- [Pinned Host prompt admission](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/host/apiproxy/src/api-proxy.ts)
- [Pinned Agent durability order](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/agent-loop/src/agent.ts)
