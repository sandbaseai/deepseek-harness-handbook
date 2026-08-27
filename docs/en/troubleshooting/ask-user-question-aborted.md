---
title: Diagnose ask_user_question Aborts in DeepSeek Harness
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-27
upstream_ref: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Diagnose `ask_user_question` aborts in DeepSeek Harness

In DeepSeek Harness rc.2, an unanswered `ask_user_question` has no built-in elapsed-time deadline. It waits until the human answers or the owning execution is cancelled. `ASK_ABORTED` therefore means “the wait's signal was aborted” or “the Web provider was disposed,” not “the user exceeded a documented answer timeout.”

> [!NOTE]
> This guide responds to upstream discussion [#4726](https://github.com/deepseek-ai/deepseek-harness/discussions/4726). The screenshot proves an `ASK_ABORTED` result but does not show elapsed time, Session Stop, Host lifecycle, connection generations, logs, or the cancellation source. Do not infer a timer from the screenshot alone.

## What rc.2 actually waits on

The shipped `ask_user_question` tool:

1. receives the tool execution's `exec.signal`;
2. passes that signal into `ctx.userQuestions.ask()`;
3. registers one pending request in the Web Host by stable `rpcId`;
4. broadcasts `question/requested` to connected mux clients;
5. awaits the provider promise;
6. settles on a valid answer, explicit UI cancellation, execution abort, or provider disposal.

The tool declares no `timeoutMs`. The rc.2 timeout-policy wrapper only arms tools that declare such a budget, and it has no registry-wide default. Its own README explicitly identifies `ask_user_question` as a pending call that waits until answer or cancellation.

This is not a token or provider request wait: while the human decides, no model inference is running and the wait itself adds no tokens.

## Route the exact result

| Result | Settlement owner | Meaning |
|---|---|---|
| structured answer JSON | human response | the Host accepted one answer for the pending `rpcId` |
| `ASK_CANCELLED` / user cancelled | question UI | the human closed or cancelled the question flow |
| `ASK_ABORTED` / aborted before answer | upstream execution signal | Session/turn/tool ownership cancelled while pending |
| `ASK_ABORTED` / provider disposed | Host plugin lifecycle | API proxy or provider scope shut down or reloaded |
| `NO_PROVIDER` | composition | no question provider was registered |
| `CALLER_NOT_LIVE` | Agent identity | the supplied Agent is not the exact live root |
| `DELEGATED_CALLER` | runtime ownership | a live parent owns the calling subagent, so it cannot block on the human |

The red “aborted before the user answered” row is a final tool result. The durable result tells you how the wait settled; it does not by itself name who aborted the upstream signal.

## Capture an abort timeline

```text
DSH version and source commit:
Session id and Agent Preset:
question/requested rpcId and timestamp:
browser connection open/close generations:
question card first rendered timestamp:
user action, if any:
Session Stop / cancel / replacement timestamp:
Agent disposal or preset switch timestamp:
Host shutdown, HMR, or plugin disposal timestamp:
question/resolved outcome and timestamp:
tool/result error code and timestamp:
```

Correlate by both Session ID and question `rpcId`. Wall-clock proximity is not enough when several Sessions can ask questions concurrently.

## Distinguish disconnect from cancellation

The rc.2 Host stores pending questions independently of one browser connection. When a mux client reconnects, the Host replays every pending `question/requested` frame with the same `rpcId`. Closing a browser tab or losing the socket should not, by itself, settle the Host promise.

Therefore:

- if the card disappears but the Host still has the pending entry, investigate replay/resync and UI projection;
- if the Host emits `question/resolved` with `cancelled` and the tool logs `ASK_ABORTED`, investigate the execution signal or provider lifetime;
- if a late answer receives `not-pending`, the Host had already settled and removed that `rpcId`;
- if a reconnect restores the card, the wait survived and no answer timeout occurred.

Local choice drafts are not durable. A reload may restore the pending question but lose unsubmitted selections or custom text. That is a separate UX limitation from abort settlement.

## Contain missed questions today

- Keep the Session visible when it is awaiting interaction; the sidebar pending-interaction indicator is the durable attention cue, not a browser notification guarantee.
- Reopen or reload Web before stopping the Session. A pending Host request should replay with the same `rpcId`.
- Do not press Stop merely to dismiss the card if you still want the Agent to continue; Stop cancels the owning execution and can legitimately produce `ASK_ABORTED`.
- If the card is missing after reconnect, collect the mux and pending-state evidence before restarting the Host.
- If the Host already aborted the request, send the decision as a new user message; do not try to answer the stale `rpcId`.
- Avoid repeating irreversible work automatically after an aborted decision. The Agent may have performed earlier side effects before it asked.

There is no supported rc.2 Settings knob for a human-answer timeout because the shipped tool has no timeout declaration. Changing unrelated Bash, search, provider, or SDK request timeout settings will not change this wait.

## Design an operator-configurable policy safely

A useful policy must distinguish three values:

1. **No deadline** — wait until answer or explicit cancellation.
2. **Reminder interval** — notify again while keeping the same pending request alive.
3. **Decision deadline** — settle after a configured duration with an explicit timeout outcome.

Do not implement reminders by aborting and re-asking. That creates new `rpcId` values, loses local drafts, adds failure results to context, and can drive an Agent retry loop.

### Scope and defaults

Configure the policy at a clear operator-owned scope:

- deployment default;
- Agent Preset override;
- optional per-question hint bounded by operator policy.

Use “no deadline” as the compatibility default. A model must not choose an arbitrarily long wait or disable an operator deadline through tool arguments.

### Typed settlement

If a real deadline expires, return a distinct `ASK_TIMEOUT`, not `ASK_ABORTED`. The model and operator need to distinguish “nobody answered in time” from Stop, shutdown, HMR, or caller cancellation.

The timeout result should include bounded metadata:

```json
{
  "code": "ASK_TIMEOUT",
  "elapsedMs": 3600000,
  "questionRpcId": "redacted-or-internal-correlation"
}
```

Do not automatically select the first or “recommended” option. Expiry is absence of human authorization, never approval.

### Pause and resume semantics

Define whether the deadline uses:

- monotonic Host runtime time;
- wall-clock time persisted across restart;
- active connected-client time;
- business-hours/calendar time.

For rc.2's in-memory pending registry, a monotonic runtime timer is simplest but does not survive Host restart. A durable deadline needs stored request identity, creation time, policy version, restart reconciliation, and late-answer fencing. State the tradeoff rather than silently resetting the clock.

### Notification without duplicate authority

Notifications should reference the same Session and `rpcId`, avoid exposing question content on a lock screen by default, and never create a second answer channel without authentication and exactly-once settlement. Email, desktop, mobile, or webhook delivery is presentation; the Host pending registry remains the answer authority.

## Race-safe settlement

Answer, cancel, abort, timeout, and provider disposal can race. Use the rc.2 precedent: synchronously remove the pending record before resolving or rejecting it. Exactly one claimant wins; later answers receive `not-pending`.

A deadline extension must be revision checked. Extending a request already answered or cancelled must fail, and two tabs must not resurrect it by applying stale state.

## Failure router

| Observation | Likely boundary | Next evidence |
|---|---|---|
| abort occurs at a consistent elapsed time | external wrapper or custom policy may exist | tool definition, execute wrappers, exact monotonic samples |
| abort coincides with Stop | owning Agent execution | Stop RPC and execution signal trace |
| abort coincides with Host restart/HMR | provider disposal | process generation and plugin lifecycle logs |
| browser disconnects, then card returns | expected replay | stable `rpcId` across mux generations |
| browser disconnects, Host wait remains, card does not return | client replay/resync bug | pending map baseline and client projection order |
| late answer returns `not-pending` | another claimant already settled | preceding `question/resolved` outcome |
| closing card returns cancellation wording | explicit UI cancel | client response with cancelled code |
| question from a live child fails immediately | delegated-caller boundary | exact live Agent ownership, not elapsed time |
| Agent repeatedly re-asks after abort | retry policy / model loop | distinct rpcIds, turns, and wake source |

## Regression gates

- An unanswered rc.2 question remains pending beyond ordinary tool timeout values.
- `ask_user_question` declares no `timeoutMs` in its ToolDefinition.
- Timeout policy does not arm an undeclared blanket deadline.
- The owning `exec.signal` abort settles the wait once as `ASK_ABORTED`.
- Provider disposal settles every pending question once and clears listeners.
- Explicit UI cancellation remains distinguishable as `ASK_CANCELLED`.
- A valid answer wins exactly once and removes the pending record before resolution.
- Abort-versus-answer races have one deterministic winner.
- Late and duplicate answers return `not-pending` without resuming the Agent twice.
- Browser disconnect alone does not settle a pending Host request.
- Reconnect replays the same question with the same `rpcId`.
- `question/resolved` removes the matching client card.
- A reload may lose local drafts but not the Host-owned pending request.
- Session and question identities are both present in diagnostic events.
- A configured reminder does not settle or duplicate the question.
- A configured deadline returns `ASK_TIMEOUT`, never approval and never generic abort.
- No-deadline remains the compatibility default.
- Operator policy bounds any per-question hint.
- Deadline restart semantics are documented and tested.
- Notification channels do not become unauthenticated answer authorities.
- Deadline extension uses current revision and cannot resurrect a settled request.
- An aborted decision never triggers automatic replay of uncertain side effects.

## Primary sources

- [rc.2 user-question service and abort propagation](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/interaction/user-questions/src/index.ts)
- [rc.2 `ask_user_question` tool with no declared timeout](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/interaction/tool-ask-user/src/index.ts)
- [rc.2 Web pending registry, abort listener, replay, and settlement](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/host/apiproxy/src/api-proxy.ts)
- [rc.2 tool timeout policy with no blanket default](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/guard/timeout-policy/README.md)
- [rc.2 Web question composer and draft/replay contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-user-questions/README.md)
- [Upstream missed question and timeout request #4726](https://github.com/deepseek-ai/deepseek-harness/discussions/4726)

## Related handbook guides

- [Recover a missing question card after reconnect](missing-question-approval-after-reconnect.md)
- [Design SDK questions and approvals](../integrations/sdk-human-interaction-wire.md)
- [Relay subagent questions through the parent](../agent-patterns/subagent-human-question-relay.md)
- [Diagnose stuck tool cancellation](stuck-tool-cancellation.md)
