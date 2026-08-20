---
title: Stop Repeated Tool Failures from an Expired MCP Session
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
---

# Stop repeated tool failures from an expired MCP session

Use this runbook when an MCP server keeps its transport open but rejects every tool call with:

```text
MCP error -32001: Unknown or expired MCP session
```

DeepSeek Harness rc.8 reconnects after a transport close or failed connection generation. An application-level JSON-RPC error from `tools/call` follows a different path: the MCP bridge turns it into an ordinary failed tool result for the model. It does not classify `-32001`, close the client, invalidate the generation, refresh `tools/list`, or trip a repeated-error breaker.

```text
transport remains open
  → tools remain registered
  → tools/call returns -32001
  → executor throws ordinary tool error
  → model replans against same visible tools
  → same stale MCP generation is called again
```

Changing the conversation model cannot renew the server-side MCP session.

## Contain the live loop

1. Cancel the active Agent turn once and wait for it to become idle.
2. Stop sending “continue” prompts in that Session.
3. Record the server-qualified tool name, JSON-RPC code, normalized message, turn, step, call count, and elapsed time.
4. Disable or unload the affected MCP client row, or stop the exact Host process through its normal supervisor.
5. Start one clean connection generation and require successful initialization plus `tools/list` before permitting another call.
6. Use a fresh Agent Session for the proof call so the request surface is rebuilt from the recovered tool catalog.
7. Retry only a read-only or proven-idempotent operation. Verify external state before repeating a write.

Do not let the model “try a different argument” against the same deterministic session-expiry response. Parameter changes cannot repair transport/session ownership.

For a persistent outage, disable the exact MCP row in the relevant profile or home patch:

```yaml
- id: my-mcp-server
  disabled: true
```

Use the real row ID from `dsh --profile <profile> --dump-config`; do not copy the placeholder. Disabling an MCP client removes its entire server-qualified tool set, so review dependent workflows before applying a machine-wide patch.

## Prove this is not an ordinary disconnect

Capture:

```text
DSH version or commit:
MCP transport (stdio or HTTP):
Server name and qualified tool name:
Last successful initialize timestamp:
Last successful tools/list timestamp:
Transport close/error observed: yes / no
Exact JSON-RPC code and sanitized message:
First and last failing turn/step:
Identical error count:
Host reconnect log lines:
Tool still visible after first -32001: yes / no
External side effect status:
```

Interpret the evidence:

| Observation | Boundary |
|---|---|
| transport closes; logs show reconnect attempts | ordinary connection-supervisor outage |
| transport stays open; every call returns `-32001` | server session expired inside a nominally live generation |
| reconnect succeeds and `tools/list` runs again | fresh generation established |
| tools remain visible after reconnect budget exhaustion | verify whether another row owns the same public names |
| only one Agent repeatedly retries after recovery | stale Agent request surface or model loop; reproduce in a fresh Session |
| different errors alternate across tools | do not collapse them into one expiry fingerprint |

The absence of an `onclose` callback is important. rc.8's supervisor enters backoff through `generationDown()` only when connection establishment fails or the MCP SDK reports the generation closed. A `callTool()` rejection does not call that path.

## Understand the current reconnect contract

For a real transport loss, rc.8 defaults to:

```text
enabled: true
initial delay: 500 ms
maximum delay: 30 s
maximum consecutive attempts: 10
```

During that outage, the last good tool generation stays registered and calls may fail until recovery. A successful reconnect creates a new MCP client, performs discovery again, and replaces the registered generation. Exhaustion unregisters the tools and stops reconnecting until plugin reload or Host restart.

Increasing `maxAttempts` does not help when no transport loss is detected. The counter never starts for a still-open expired application session.

## Recover the exact owner

### Stdio server

Reloading the MCP plugin or restarting the Host should close the owned child and create a new stdio transport. Verify the old process exits before the new generation starts; overlapping servers can hide which process owns the tool result.

### Stateful HTTP server

Restarting the client can establish a new protocol session only if the server's initialization flow issues one. Preserve the endpoint, auth reference, negotiated protocol version, and server logs. A reverse proxy that keeps or rewrites session headers may reproduce the expiry immediately.

### Shared remote service

Do not restart an entire shared service merely because one client session expired. Invalidate the exact DSH client generation first, then use the service's documented session lifecycle. Coordinate with the service owner if a new initialize is also rejected.

## Separate recovery from retry safety

Reconnection answers “is there a usable MCP generation?” It does not answer “should the failed business operation run again?”

| Operation | Automatic retry after recovery |
|---|---|
| list, read, search with no side effect | at most once, when the server contract confirms read-only semantics |
| idempotent write with a stable idempotency key | at most once after checking the prior outcome |
| file mutation, issue creation, deployment, payment, message send | verify or ask; do not blindly replay |
| outcome unknown because the response was lost | treat as potentially completed |

A `-32001` response usually suggests rejection before tool execution, but DSH cannot infer every server's ordering from the code alone. Keep the tool-specific contract authoritative.

## Repair contract for runtime authors

A robust repair needs coordination between the tool bridge and connection supervisor:

1. classify server/session-invalid errors with an explicit configurable predicate rather than matching arbitrary prose only;
2. atomically mark the current generation unhealthy on the first matching error;
3. allow one single-flight close/reconnect transition for all concurrent calls;
4. stop admitting new calls to that generation;
5. publish operator-visible recovery state and remove or mark affected tools unavailable;
6. create a new client/transport and rerun initialization plus complete paginated `tools/list`;
7. replace tool registrations only after the new generation is coherent;
8. permit at most one policy-approved retry for safe calls;
9. open a circuit when the recovered generation returns the same expiry fingerprint;
10. make cancellation and plugin disposal drain the recovery transition.

The fingerprint should include at least server identity, tool identity, JSON-RPC code, and a normalized bounded message. A breaker keyed only by message text can suppress unrelated servers; one keyed by full arguments will miss the same deterministic failure across model replans.

Reasoning-delta aggregation is a separate persistence/performance decision. It can reduce event count, but it does not repair the MCP session or stop billable model replanning.

## Acceptance gates

- [ ] one `-32001` is distinguishable from a transport close;
- [ ] the first expiry invalidates only the owning MCP generation;
- [ ] concurrent failures create one recovery transition;
- [ ] no new call enters the invalidated generation;
- [ ] recovery reruns initialization and complete tool discovery;
- [ ] the new tool generation replaces the old one without duplicates;
- [ ] failed recovery removes or visibly disables affected tools;
- [ ] retry count is finite and observable;
- [ ] only read-only or proven-idempotent calls qualify automatically;
- [ ] unknown write outcomes are verified before replay;
- [ ] a repeated expiry after reconnect opens the circuit;
- [ ] cancellation stops backoff and recovery safely;
- [ ] fresh-Session A/B uses the recovered catalog;
- [ ] model changes are not presented as session recovery;
- [ ] reasoning event volume is measured separately from lifecycle correctness.

## Primary sources

Verified against DeepSeek Harness rc.8 commit `141eb6fef83422698aef7a981029e843e8161534` on 2026-08-20.

- [Official expired-session report #3489](https://github.com/deepseek-ai/deepseek-harness/discussions/3489)
- [rc.8 MCP connection supervisor](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/mcp/mcp-client/src/connection.ts)
- [rc.8 MCP tool executor](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/mcp/mcp-client/src/tools.ts)
- [rc.8 MCP client lifecycle contract](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/mcp/mcp-client/README.md)
- [Add an MCP server and diagnose startup/reconnect](mcp-server-not-connecting.md)
- [Stop a runaway Agent loop](runaway-agent-loop.md)
