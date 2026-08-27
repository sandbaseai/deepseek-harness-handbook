---
title: Design server-to-client human interaction for the DeepSeek Harness SDK
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-27
upstream_ref: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Design SDK server-to-client questions and approvals

The DeepSeek Harness SDK can stream Agent events out of process, but rc.2 cannot ask the embedding client a question or request a human approval. Composing `dsh-user-questions`, `dsh-tool-ask-user`, and Plan Mode does not bridge that process boundary: `ctx.userQuestions` still requires an in-process provider.

This guide is pinned to upstream commit [`b150a55`](https://github.com/deepseek-ai/deepseek-harness/tree/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e) (`0.1.1-rc.2`) and [official proposal #4708](https://github.com/deepseek-ai/deepseek-harness/discussions/4708). The proposal's loopback long-poll workaround is attributed to its author; the current wire limitation and transport capabilities are independently verified in rc.2 source.

## Current boundary

The SDK wire currently defines:

| Direction | Kind | Methods |
|---|---|---|
| Client → server | request | `initialize`, `session/prompt`, `shutdown` |
| Server → client | notification | `session.event`, `session.status`, `subagent.started`, `subagent.finished` |
| Server → client | request | none |
| Either direction | cancellation | none |

The newline-delimited JSON-RPC transport can carry request, response, and notification frames in either direction. The missing capability is above the framing layer: no SDK request type, server bridge, or client request handler owns human interaction. The protocol README calls server-to-client requests a “dead capability.”

When `ask_user_question` calls `ctx.userQuestions.ask()` without a provider, it fails with `NO_PROVIDER`. `exit_plan_mode` cannot wait for a remote plan review merely because the embedding host receives Session notifications.

## Keep questions and approvals distinct

Both operations wait for a human, but they carry different authority:

| Domain | Purpose | Result vocabulary | Durable consequence |
|---|---|---|---|
| User question | Missing information or a choice | `answers[]` with selected labels/custom text | Tool result resumes the Agent loop |
| Approval | Authorize one named effect | `allowed-once`, `rejected`, `cancelled`, `unavailable` | Paired `approval/asked` and `approval/decided` audit events |

Do not encode approval as a generic “Yes/No” question. A translated label, custom answer, option reorder, or UI default must never become effect authority. Keep separate methods and schemas even if one UI component renders both.

Plan review remains a user-question presentation intent. Its `approve` field names the exact option label that means approval; generic clients can render the same options without understanding the intent.

## Negotiate the capability

rc.2 has no real protocol-version negotiation; `serverInfo.version` is present but clients do not validate it. Introduce explicit capabilities in `initialize` rather than inferring support from a package version:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "clientInfo": { "name": "acme-host", "version": "2.4.0" },
    "capabilities": {
      "serverRequests": {
        "userQuestions": { "version": 1 },
        "approvals": { "version": 1 }
      }
    }
  }
}
```

The server response should echo the negotiated subset. The server registers a wire-backed provider only after negotiation succeeds and only for the connection/runtime it owns.

If another in-process UI already owns the single `ctx.userQuestions` provider slot, initialization must fail with a typed ownership conflict. Do not silently replace the UI, race two providers, or let registration order define policy. Approval answerers likewise need explicit ownership and delegation behavior.

## Define answerable server requests

### User question

```json
{
  "jsonrpc": "2.0",
  "id": "sq:01J...",
  "method": "userQuestions/ask",
  "params": {
    "sessionId": "session-...",
    "questionRequestId": "question-...",
    "questions": [
      {
        "id": "plan-review",
        "header": "Plan review",
        "question": "Approve this plan and leave plan mode?",
        "detail": "# Plan\n...",
        "options": [
          { "label": "Approve" },
          { "label": "Keep planning" }
        ],
        "intent": { "kind": "plan-review", "approve": "Approve" }
      }
    ]
  }
}
```

The response uses the existing answer vocabulary:

```json
{
  "jsonrpc": "2.0",
  "id": "sq:01J...",
  "result": {
    "answers": [
      { "id": "plan-review", "selected": ["Approve"] }
    ]
  }
}
```

The server validates that every question has exactly one answer record, IDs belong to the request, selected labels were offered, single/multi-select cardinality holds, custom-answer rules hold, and the plan intent's approval label remains one of that question's options. Client-rendered text is not returned as authority.

### Approval

```json
{
  "jsonrpc": "2.0",
  "id": "sa:01J...",
  "method": "approval/request",
  "params": {
    "sessionId": "session-...",
    "approvalId": "approval-...",
    "toolName": "bash",
    "callId": "call-...",
    "reason": "sandbox escalation"
  }
}
```

The client returns only a client-authorizable terminal choice:

```json
{
  "jsonrpc": "2.0",
  "id": "sa:01J...",
  "result": { "outcome": "allowed-once" }
}
```

`cancelled` and `unavailable` remain server-side outcomes when the caller aborts, transport closes, capability is absent, or no answerer owns the request. A wire response must never grant “always allow” when the core seam promises one-shot authorization.

## Correlate four identities

Do not use the JSON-RPC `id` as the only domain identity. Correlate:

1. connection generation;
2. JSON-RPC request ID;
3. Session ID;
4. question request ID or approval ID, plus tool call ID where applicable.

JSON-RPC request IDs are scoped to the sender's request namespace. A client and server may both use `7` concurrently; transport bookkeeping must not collide the two directions. Opaque direction-prefixed IDs make logs easier to audit but do not replace correct bidirectional maps.

The server derives `sessionId` from the exact live root agent authenticated by the in-process seam. The client cannot redirect an answer to another Session by echoing different params. A response is accepted only for the pending request on that connection generation.

## Make every request terminal

Once the server can block on a client response, unanswered requests become protocol state. Define all terminal edges:

```text
pending
  ├─ valid response → answered / allowed / rejected
  ├─ caller abort → cancelled
  ├─ server deadline → cancelled or unavailable
  ├─ client shutdown / EOF → cancelled
  ├─ runtime disposal → cancelled
  └─ malformed response → protocol error, then fail closed
```

Use a server-owned deadline or deployment policy. A client UI timer is helpful presentation, but it cannot be the sole safety bound because the client may hang. Timeout must never auto-approve.

Cancellation needs a named notification referencing the original server request and domain ID, for example:

```json
{
  "jsonrpc": "2.0",
  "method": "serverRequest/cancelled",
  "params": {
    "requestId": "sq:01J...",
    "sessionId": "session-...",
    "reason": "caller-aborted"
  }
}
```

After cancellation, a late response is ignored or answered with a typed stale-request error and can never resume the tool. Exactly one terminal transition settles the in-process promise.

## Client implementation contract

The TypeScript and Python clients need a responder surface registered **before** `initialize` advertises the capability. Dispatch server requests outside the transport read callback so a slow UI cannot stop notification and response parsing.

Require:

- bounded concurrent outstanding requests and per-Session UI queues;
- schema validation before rendering and again before responding;
- plain-text/Markdown sanitization appropriate to the host UI;
- no execution of links, HTML, commands, or model-provided content;
- foreground/background notification without implicit approval;
- idempotent close and cancellation;
- redacted logs that omit plan text, answers, secrets, and tool arguments by default;
- one response write followed by pending-entry removal;
- unknown methods answered with JSON-RPC `-32601`;
- handler failures answered with a bounded, non-sensitive error and fail-closed domain outcome.

The SDK subprocess owns stdout as pure JSON-RPC. UI logging, prompts, and diagnostics must use the embedding host or stderr; writing human text to runtime stdout corrupts framing.

## Transport loss and replay

The current SDK client owns a subprocess, and shutdown/EOF disposes the runtime. Settle every pending question and approval before or during disposal. Do not leave an in-process `ask()` promise after transport close.

The Web API proxy has a different connection model: stable domain IDs and pending requests can be replayed to a new mux connection. Do not copy replay semantics into stdio without first defining process survival, connection generations, and exactly which authority transfers to the new client.

If future SDK reconnect keeps the runtime alive, replay must reuse the same domain request ID, mint a new connection-scoped JSON-RPC ID, invalidate the old generation, and accept only the first valid terminal answer.

## Route one approval across Web and messaging channels

Discussion #4733 proposes a Feishu card answerer for Sessions whose Agent Preset name ends in `-feishu`, while leaving the shipped Web answerer unchanged. The channel-neutral `approval/request` waterfall is the correct seam, but channel selection, decision ownership, and settlement must be explicit.

### One request has one decision owner

Do not let Web and Feishu race to answer the same approval. A Session can have multiple presentation observers, but one immutable interaction binding should own the decision:

```ts
interface ApprovalChannelBinding {
  kind: 'web' | 'feishu' | 'sdk'
  channelInstanceId: string
  principalPolicyId: string
}
```

A Preset suffix can be a temporary routing hint, but it is not a durable authorization contract. Preset naming conventions drift, copies can change names, and a third-party composition can reuse a suffix. Prefer a Session-owned binding created by trusted configuration and verified against the exact live root Agent. The Feishu listener handles only matching bindings and calls `next()` for every other Agent.

Do not use sibling listener order as policy priority. The rc.2 approval seam explicitly recommends one terminal answerer per deployment scope because waterfall registration order is not an authorization mechanism.

### Bind the card action to the exact authority

The card callback must authenticate and correlate:

- Feishu application and tenant;
- user/open id under an allowlist or role policy;
- chat, thread, and channel instance;
- DSH runtime generation and Session id;
- approval id and optional tool call id;
- one-shot outcome vocabulary;
- issued time, expiry, nonce, and schema version.

Do not make a guessable `auth_id` or filesystem path a bearer capability. The callback payload should carry a signed, short-lived opaque token or look up a high-entropy id in server-owned state. Validate the actual clicking principal; possession of a forwarded card must not be enough.

The approval card should disclose only the minimum rc.2 request fields: tool name, reason, and optional call id. rc.2 does **not** put tool arguments in `ApprovalRequest`, so a card must not imply that the approver reviewed exact command bytes unless another independently secured evidence path supplied them.

### Make timeout and click one linearizable race

Writing `timeout` before patching the card is the correct ordering principle, but a check-then-write JSON file is not yet an exactly-once settlement primitive. The click callback and timer need one atomic compare-and-set:

```text
pending@revision 4
  ├─ CAS(click, allowed-once, expected 4) → winner
  └─ CAS(timer, cancelled, expected 4)    → stale loser
```

Only the winner returns an outcome to the in-process `approval/request` promise. The `ApprovalService` remains the owner that appends the paired `approval/decided` event. The losing path observes the terminal record and performs no second decision. A late click receives a stale/expired acknowledgement and never returns `allowed-once`.

If a file-backed prototype is retained, require a private directory, no symlink following, restrictive permissions, atomic no-overwrite creation or revisioned rename, fsync where crash durability matters, bounded filenames, and cleanup. A resident service with an authenticated callback and transactional store is a safer production owner than one subprocess polling one status file per approval.

### Treat the card as a projection

The terminal decision record is authoritative; the visible card is a best-effort projection. After settlement, patch the original message to show actor-safe outcome or expiry. A patch timeout cannot reopen the decision and must not change the tool result.

Persist the schema family and message id used for the original send. Patch the same schema deliberately. Do not try Card 1.0, then guess Card 2.0 after an error: a fallback can target a message whose actual schema or ownership is unknown. Migrate old cards with an explicit recorded version and a tested renderer per version.

Button layout, disabled state, and countdown improve UX but do not enforce authority. Card forwarding, duplicate callbacks, platform retries, webhook reordering, and an unpatched zombie card must all fail closed at the settlement store.

### Package the integration at a supported seam

Keeping `dsh-im` unmodified is a useful upgrade property only if the callback contract it consumes is documented and versioned. Otherwise the design has an undeclared dependency that an upgrade can still break.

For a community implementation:

1. package a normal out-of-tree DSH plugin that registers one scoped `approval/request` answerer;
2. keep the Feishu client, callback verification, state owner, and card renderers inside that plugin or a versioned companion service;
3. declare compatible DSH and `dsh-im` versions and pin the callback schema;
4. avoid patching npx-managed DSH files or installing a private extension under the official package tree;
5. publish threat model, license, removal path, and end-to-end fixtures before proposing upstream inclusion.

Official inclusion is worth considering after the channel contract is provider-neutral. Core should own approval identity, ownership, settlement, and adapter interfaces; a Feishu package should own Feishu authentication and card UX.

### Multi-channel conformance additions

- [ ] Every Session has at most one approval decision owner.
- [ ] Channel routing uses an explicit trusted binding, not only a Preset-name suffix.
- [ ] Non-owning answerers always delegate with `next()` and cannot observe secret state.
- [ ] Feishu tenant, app, actor, chat, channel, Session, approval, call, expiry, and nonce are validated.
- [ ] A forwarded card cannot authorize an unapproved principal.
- [ ] Card text does not claim tool arguments were reviewed when rc.2 did not supply them.
- [ ] Click and timeout compete through one atomic compare-and-set.
- [ ] Duplicate, retried, reordered, and late callbacks cannot create a second outcome.
- [ ] Only the winning answerer result reaches `ApprovalService`; audit events remain service-owned.
- [ ] Message patch failure cannot reopen, alter, or delay the terminal tool decision.
- [ ] Original card schema and message identity are recorded; updates never guess a fallback schema.
- [ ] State storage rejects symlinks, cross-runtime ids, partial writes, and unauthorized readers.
- [ ] Restart recovery settles or cancels every pending approval without auto-allowing.
- [ ] Web-only, Feishu-only, and simultaneous-observer fixtures prove one decision owner.
- [ ] The `dsh-im` callback contract is versioned and tested across supported upgrades.
- [ ] Installation and removal use supported out-of-tree plugin boundaries.

## Harden the current loopback workaround

Until the wire grows server requests, an embedder can register an in-process provider that forwards to a private control channel. Treat that channel as an approval plane:

- bind to loopback or an authenticated local IPC endpoint;
- mint a per-runtime high-entropy credential and never place it in URLs or logs;
- authenticate the runtime instance, Session, request, and client principal;
- use POST for answers with no-store cache policy and CSRF protection where relevant;
- bound long-poll duration, outstanding asks, body size, and retries;
- propagate the original abort signal and delete pending state on every terminal edge;
- reject duplicate, late, cross-Session, and cross-runtime answers;
- default deny/abort on channel failure;
- dispose the provider and listener before the runtime exits.

This workaround restores functionality but creates a second protocol and credential boundary. It should be removed after the native SDK wire provides equivalent guarantees.

## Conformance gates

- [ ] Capability negotiation is explicit and versioned.
- [ ] Request handlers are installed before the client advertises support.
- [ ] Provider ownership conflicts fail initialization clearly.
- [ ] Questions and approvals use separate methods and result vocabularies.
- [ ] Connection, JSON-RPC, Session, domain request, and call identities correlate.
- [ ] Bidirectional JSON-RPC request IDs cannot collide internally.
- [ ] The server derives Session authority from the exact live root agent.
- [ ] Every valid answer is schema- and option-validated.
- [ ] Approval remains one-shot and paired with durable audit events.
- [ ] Missing capability fails closed with `NO_PROVIDER`/`unavailable` semantics.
- [ ] Caller abort, deadline, EOF, shutdown, and disposal settle pending requests.
- [ ] Late and duplicate answers cannot resume a settled tool.
- [ ] A hung UI does not block transport frame processing.
- [ ] Outstanding request count, payload size, and UI queue are bounded.
- [ ] Timeout and malformed responses never auto-approve.
- [ ] Plan/detail text and human answers are redacted from default logs.
- [ ] stdout remains newline-delimited JSON-RPC only.
- [ ] TypeScript and Python clients pass the same protocol fixtures.
- [ ] Generic question, Plan review, approval allow/reject, cancellation, and shutdown are tested end to end.
- [ ] Any future reconnect replays domain identity without accepting stale-generation answers.

## Primary sources

- [Official SDK interaction proposal #4708](https://github.com/deepseek-ai/deepseek-harness/discussions/4708)
- [Feishu approval-card channel proposal #4733](https://github.com/deepseek-ai/deepseek-harness/discussions/4733)
- [rc.2 SDK protocol contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/sdk/protocol/README.md)
- [rc.2 SDK server contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/sdk/server/README.md)
- [rc.2 TypeScript SDK client](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/sdk/client/src/client.ts)
- [rc.2 user-question seam](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/interaction/user-questions/README.md)
- [rc.2 approval seam](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/interaction/user-approval/README.md)
- [rc.2 Web proxy question tests](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/host/apiproxy/tests/api-proxy-question.spec.ts)
- [rc.2 Web proxy approval tests](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/host/apiproxy/tests/api-proxy-approval.spec.ts)
