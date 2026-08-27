---
title: Render DeepSeek Harness ACP Permission Requests Safely
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-27
upstream_revision: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Render DeepSeek Harness ACP permission requests safely

DeepSeek Harness rc.8 can send an ACP `session/request_permission` frame that contains a Session id, a tool-call id, and two one-shot choices—but no tool name, arguments, path, command, risk explanation, or durable-grant option. A custom Web client has not decoded the frame incorrectly when it sees this minimal payload.

The official bridge is automation-only. Its permission request is a machine-policy channel, not a complete presentation model:

```json
{
  "method": "session/request_permission",
  "params": {
    "sessionId": "...",
    "toolCall": { "toolCallId": "call_..." },
    "options": [
      { "optionId": "allow-once", "name": "Allow once", "kind": "allow_once" },
      { "optionId": "reject-once", "name": "Reject", "kind": "reject_once" }
    ]
  }
}
```

Do not invent a command, path, or risk label that the protocol did not provide. Either apply a predeclared machine policy or show an explicitly generic, fail-closed prompt.

## An unanswered reverse request hangs the tool-using turn

At rc.2, the ACP bridge awaits `session/request_permission` without an internal deadline. The method is a reverse JSON-RPC request from the Agent to the ACP client. A client that implements `session/prompt` but ignores reverse requests can appear healthy until the first tool needs approval; that prompt then remains pending with no provider error.

Diagnose this boundary before blaming the model or MCP server:

1. capture the ACP wire in a disposable Session;
2. find the outgoing `session/request_permission` request and its JSON-RPC id;
3. confirm whether the client returns one response with an offered option id or a cancelled outcome;
4. distinguish an unanswered request from a response that never reaches the bridge;
5. verify that cancelling the parent prompt also closes the client UI and prevents a late answer.

The client must terminate every live permission request. A non-interactive client should use policy established outside model output; an interactive client should apply its own bounded display deadline and return cancellation when it expires. Do not merely hide the dialog while leaving the reverse request unresolved.

```ts
async function handlePermission(request: PermissionRequest, signal: AbortSignal) {
  const decision = await decideByPolicyOrUi(request, { signal, timeoutMs: 30_000 })
    .catch(() => undefined)
  if (!decision) return { outcome: { outcome: 'cancelled' as const } }
  const offered = request.params.options.find(option => option.optionId === decision.optionId)
  if (!offered) return { outcome: { outcome: 'cancelled' as const } }
  return { outcome: { outcome: 'selected' as const, optionId: offered.optionId } }
}
```

Do not copy a blanket `allow-once` workaround unless another independently enforced layer truly owns the effects. Automatically allowing the DSH approval while the same DSH tool performs local effects removes a real boundary; external execution is safe only when the external policy is authenticated, authoritative, and proven to cover that call.

## What the frame proves—and what it does not

| Field | Safe conclusion | Not justified |
|---|---|---|
| `sessionId` | which ACP Session owns the request | which workspace object will change |
| `toolCall.toolCallId` | correlation identity for one tool call | tool name, arguments, command, target, or effect |
| `options[].optionId` | exact value the client may return | a reusable policy or durable grant |
| `options[].kind` | one-shot allow or reject semantics | “always allow,” scope expansion, or remembered consent |

At the source boundary, `approval/request` is forwarded only when the Agent is owned by this ACP connection and the approval has a call id. The bridge deliberately constructs `toolCall` with only that id. It maps `allow-once` to `allowed-once`; cancellation or an unavailable answer fails closed. The chosen result reaches the model only through the owning tool result.

## Choose one honest client mode

### 1. Automation policy

Use this for a parent Agent, CI worker, or other non-interactive client. Decide from configuration established before the request—not from nonexistent display metadata.

```ts
type PermissionRequest = {
  params: {
    sessionId: string
    toolCall: { toolCallId: string }
    options: Array<{
      optionId: string
      name: string
      kind: 'allow_once' | 'reject_once'
    }>
  }
}

function answerByPolicy(request: PermissionRequest, mayEscalate: boolean) {
  const desiredKind = mayEscalate ? 'allow_once' : 'reject_once'
  const selected = request.params.options.find(option => option.kind === desiredKind)
  if (!selected) return { outcome: { outcome: 'cancelled' as const } }
  return { outcome: { outcome: 'selected' as const, optionId: selected.optionId } }
}
```

Bind `mayEscalate` to the Session or job policy. Never infer it from a tool-call-id prefix, option label, prompt text, or model output.

### 2. Generic human confirmation

If a human must decide through the current ACP surface, say exactly what is known:

```text
DeepSeek Harness requests one-time permission for tool call call_…
This ACP connection does not provide the tool name, arguments, or affected path.
[Reject] [Allow once]
```

Default to reject. Keep the Session id and full call id available in a diagnostic disclosure, escape both as untrusted text, and disable repeated submission after the JSON-RPC response is sent. Do not relabel `Allow once` as `Allow`, “Trust,” or “Always allow.”

### 3. Rich Web product integration

Do not treat rc.8 ACP alone as the complete backend for a rich tool-approval card. The ACP package documentation explicitly leaves interactive rendering and human questions to the Web host and client modules, and omits tool presentation from its wire contract.

A richer host can maintain an authoritative call registry from its own DSH Session event stream:

```text
tool/call(callId, name, arguments)
             │
             ├── register sanitized presentation data
             │
approval request(callId) ── exact identity join ──> approval card
             │
             └── one-shot ACP response
```

That registry is an additional DSH-native integration, not data recovered from `session/request_permission`. Join on both Session identity and exact call id. Expire entries on result, cancellation, Session disposal, reconnect, and timeout. If the join is missing, duplicated, stale, or crosses Session ownership, show the generic prompt or reject.

## A safe approval-card contract

Only render fields supplied by an authoritative host event and independently sanitized for display:

- tool display name and stable internal identity;
- normalized target path or host, with the workspace boundary visible;
- redacted argument summary rather than raw secrets;
- requested capability and whether it exceeds the current sandbox;
- exact one-shot choices received in the live ACP frame;
- Session and call correlation in a diagnostic disclosure.

Keep execution authority server-side. The browser should return an offered option id; it should not construct a new grant, modify arguments, or persist a broader policy. Protect the Web control plane with authentication, origin checks, HTTPS, request expiry, replay protection, and an audit record tied to the exact call id.

## Lifecycle and race handling

Permission UI is a distributed state machine. Cover these races explicitly:

1. A tool result or cancellation arrives before the user clicks: close the card and reject late input.
2. The socket reconnects: do not replay an old approval unless the host confirms it remains pending.
3. Two tabs answer: accept one response server-side and make the second a harmless conflict.
4. The Session is disposed: invalidate every pending request owned by it.
5. An option is missing or unknown: cancel; never synthesize an option id.
6. Rich metadata cannot be joined: fall back to the honest generic view, not cached data from another call.
7. The client deadline expires: send cancellation exactly once and close the card.
8. The client process is shutting down: settle or cancel every reverse request before closing the transport.

## Acceptance gates

- [ ] A captured rc.8 frame matches the minimal source contract.
- [ ] The UI never claims a tool name, command, path, or effect from ACP-only data.
- [ ] Every response uses an option id offered by that exact live request.
- [ ] Missing, dismissed, expired, or unavailable decisions fail closed.
- [ ] `allow_once` remains one-shot and is never persisted as a durable grant.
- [ ] Rich metadata joins by Session plus exact call id and cannot cross owners.
- [ ] Display data is redacted and escaped; execution authority remains server-side.
- [ ] Cancellation, result, disposal, reconnect, timeout, and duplicate-answer races are tested.
- [ ] Every reverse request receives exactly one selected or cancelled response within the client deadline.
- [ ] A client that ignores reverse requests fails a conformance test before production traffic.
- [ ] The audit record links request, offered options, selected outcome, and owning tool result.
- [ ] The product describes ACP accurately as an automation bridge unless it adds and verifies a richer host integration.

## Primary sources

Verified against DeepSeek Harness `0.1.1-rc.2` commit `b150a551b8d465e31e418e1b2eaf5e79bbb7d28e` on 2026-08-27.

- [Official ACP permission-payload question #3481](https://github.com/deepseek-ai/deepseek-harness/discussions/3481)
- [Official unanswered reverse-request report #4693](https://github.com/deepseek-ai/deepseek-harness/discussions/4693)
- [rc.2 ACP implementation and permission mapping](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/acp/acp/src/index.ts)
- [rc.2 ACP automation contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/acp/acp/README.md)
- [ACP permission-request protocol](https://agentclientprotocol.com/protocol/tool-calls#requesting-permission)
- [ACP editor-integration boundary](acp-editor-boundary.md)
