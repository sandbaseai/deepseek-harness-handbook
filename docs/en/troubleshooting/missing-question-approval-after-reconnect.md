---
title: DeepSeek Harness Missing Question or Approval Card After Reconnect
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-19
upstream_revision: 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
---

# The Agent is waiting, but the question card is missing

In DeepSeek Harness rc.7 Web, `ask_user_question` or an approval can remain pending on the Host while the browser shows no answer card. The turn appears stuck; stopping it produces a user-abort result.

Two independent connection-generation failures can produce this same screen:

1. a silent dead WebSocket prevents reconnect and pending-frame replay;
2. a successful reconnect replays the frame, then Session resync clears the fresh client wait.

> [!WARNING]
> Never synthesize an approval or answer through an API call to unstick the Agent. The missing UI is not consent. Recover the authentic pending request or cancel the turn.

## Understand the three owners

| Owner | State | Durability |
|---|---|---|
| Agent/tool | promise waiting for the human outcome | live turn |
| Host API proxy | pending question or approval, keyed by stable `rpcId` | live Host memory, survives client disconnect |
| browser Session | `PendingWait` that renders and submits the card | connection-generation state |

Question and approval requests do not enter the normal Session event log as answerable cards. The Host pushes them over the mux stream and replays still-pending entries whenever a new mux consumer opens.

That replay contract is why a refresh can recover the card. It is also why inspecting only `session.jsonl` cannot prove whether the browser received the request.

## Failure A: no reconnect generation

The rc.7 WebSocket downlink closes on explicit `close` or `error`, but the Host does not send protocol heartbeat pings. After sleep, network switching, or long background-tab throttling, a half-open TCP path can look connected to both JavaScript runtimes.

```text
Host pending registry → old mux queue → dead network path
browser still says connected → no new mux open → no replay → no card
```

High-confidence evidence:

- the tab was backgrounded or the machine/network changed;
- no reconnect warning or new WebSocket generation appears;
- ordinary live Host events stop too;
- a hard refresh creates a new connection and the card appears.

## Failure B: replay then clear

On a real reconnect, the Host's mux iterator queues pending `question/requested` and `approval/requested` frames with their original `rpcId`. Stream pumping begins before the connection controller calls `onConnected`.

For an already-open Session, `onConnected` drives `Session.resync()`. In rc.7, that method executes `this.pending.clear()`. If the replayed requested frame arrived first, resync erases the newly minted `PendingWait`:

```text
new mux opens
  → Host replays pending request
  → browser mints card wait
  → onConnected
  → Session.resync()
  → pending.clear()
  → Host still waits; browser card disappears
```

This race is intermittent because frame delivery and resync scheduling decide the order. Refresh can work on one attempt and fail on another.

## Route the symptom

| Observation | Likely boundary |
|---|---|
| no WebSocket reconnect after sleep/network change | missing liveness detection |
| reconnect occurs, card flashes or remains absent | replay/resync race |
| card renders but submit says not pending | Host wait already settled or was cancelled |
| tool has a result in history | interaction is no longer pending; diagnose UI projection |
| only one Session is affected | Session-local pending mirror or turn state |
| all live updates stop | carrier generation or Host availability |

## Safe recovery on rc.7

1. Preserve the Session id, approximate request time, and browser console/network evidence.
2. Confirm the Agent is waiting for a question or approval; do not infer from a generic spinner alone.
3. Hard-refresh once to force both downlink WebSockets into a new generation.
4. Reopen the same Session and wait for the Host replay.
5. If the authentic card appears, answer it normally.
6. If it remains absent, cancel the turn. Start a new turn and ask the Agent to request the decision again.

Do not repeatedly click Stop and resume the same unresolved tool call. Cancellation is a real outcome and the next turn should observe it before requesting another decision.

For an approval, re-run the denied operation only after the previous turn is visibly cancelled. One approval applies to one requested operation; it is not a reusable grant unless the UI explicitly offers and records such a policy.

## Evidence bundle

Capture both connection and interaction identity:

```text
Harness version / exact commit
Session id and tool call id
question or approval rpcId, if visible
browser background/sleep/network timeline
WebSocket close, error, and reopen timestamps
connection state transitions
mux requested frame arrival
onConnected and Session.resync ordering
pending-interaction snapshot before and after resync
Host pending registry presence
cancel or answer receipt
```

The decisive trace is the stable request identity across Host replay and browser generations—not the loading animation.

## Repair both layers

Fixing only one cause leaves the other failure reachable.

### Detect dead sockets

A Host heartbeat should ping accepted sockets on a bounded interval, require pong evidence, terminate stale sockets, and let the existing reconnect loop open a new mux generation. New connections need a documented grace window; timer cleanup must be complete on shutdown.

### Clear at generation death, not resync

Client-side pending interactions should be cleared when the old connection generation is declared dead—before any next-generation frame can arrive. `resync()` must not erase requested frames that the new mux already replayed.

The repair must cover both instantiated Sessions and buffered frames for Sessions not yet opened. Host replay remains authoritative for which requests are still pending.

## Regression gates

1. a pending question survives replay followed by resync;
2. a pending approval survives the same ordering;
3. old-generation waits clear before new frames arrive;
4. requests settled while disconnected do not reappear;
5. duplicate replay with one `rpcId` renders one card;
6. answering after replay settles the original Host promise;
7. cancellation withdraws the card in every connected tab;
8. a dead socket is detected within the heartbeat bound;
9. reconnect replays without manual refresh;
10. background-tab throttling does not create duplicate answers;
11. shutdown clears heartbeat timers and socket pumps;
12. Session history remains free of synthetic approval/answer events.

## Source evidence

- [Reconnect resync race report #3102](https://github.com/deepseek-ai/deepseek-harness/discussions/3102)
- [Silent WebSocket death report #3020](https://github.com/deepseek-ai/deepseek-harness/discussions/3020)
- [rc.7 Session resync pending clear](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/client/runtime/src/client/sessions/session.ts)
- [Connection readiness and `onConnected` ordering](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/client/connection/src/client/connection.ts)
- [Host WebSocket downlink](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/client/connection/src/websocket-downlink.ts)
- [Host pending registries and mux replay](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/host/apiproxy/src/api-proxy.ts)

