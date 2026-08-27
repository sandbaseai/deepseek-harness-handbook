---
title: DeepSeek Harness ACP Editor Integration Boundary
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-27
upstream_revision: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Use DeepSeek Harness ACP without mistaking automation for an editor UI

DeepSeek Harness rc.2 ships an Agent Client Protocol server, but its official contract is automation-only. A compatible editor or controller can start it as a custom ACP process and exchange baseline requests, yet that does not make it a complete control plane.

Use this guide to evaluate `dsh-acp` with Zed or another ACP host, prove the capabilities that exist, and avoid advertising tool telemetry, in-band usage accounting, or Session recovery before the bridge implements them.

## ACP, MCP, and the DSH SDK are different seams

| Interface | Direction | Purpose |
|---|---|---|
| ACP server | editor or parent client → DSH Agent | create and drive Agent Sessions over JSON-RPC stdio |
| MCP client | DSH Agent → external tool server | discover and call tools/resources |
| DSH SDK server | programmatic client → DSH runtime | DSH-native Session events and lifecycle over its own protocol |

An editor supporting ACP does not automatically expose its MCP servers to rc.2 DSH. The official ACP bridge rejects non-empty `mcpServers`. Likewise, DSH's richer SDK `session.event` stream is not the ACP wire.

## The rc.2 capability ledger

| Capability | rc.2 ACP behavior | Client consequence |
|---|---|---|
| initialize | one protocol version; baseline text/resource-link prompt capability | connection can negotiate |
| new Session | supported with one absolute `cwd` | create a fresh editor thread |
| prompt | text plus flattened resource links; one in-flight prompt per Session | basic request/response works |
| assistant text | committed text and image blocks become `agent_message_chunk` updates | the wire label still does not imply raw token deltas |
| cancellation | addressed Session cancels and settles pending prompt | stop action can work |
| permission request | one-shot allow/reject for bridge-owned tool calls | client can apply machine policy |
| images/audio/embedded context | not advertised and rejected | editor attachments do not cross |
| additional directories | non-empty list rejected | one primary workspace only |
| forwarded MCP servers | non-empty list rejected | editor MCP configuration is unavailable to DSH through ACP |
| reasoning/tool activity/plans/titles/usage | omitted | no tool timeline or runtime-owned cost attribution |
| Session list/load/resume/fork/delete | unsupported | editor history cannot restore a DSH thread |
| per-Session close | unsupported | connection owns all Sessions |

The protocol name `agent_message_chunk` is not proof of token streaming. The bridge subscribes to durable `session/event`, filters to `assistant/message`, and projects its non-empty text and image blocks. Tool events and message usage remain inside the Harness event/log boundary.

## Separate presentation from control-plane facts

The automation-only design intentionally excludes editor presentation such as plans, titles, modes, and human-facing tool cards. That is a reasonable small protocol surface. An automated controller, however, still has two machine concerns that final assistant content cannot answer:

| Control question | Missing ACP fact | Operational consequence |
|---|---|---|
| What is the Agent doing? | correlated `tool_call` and `tool_call_update` | timeout, cancellation, audit, and tool policy operate blind |
| What did this turn consume? | prompt usage or `usage_update` | tenant metering must be reconstructed at the model gateway |

Do not parse prose to recover either fact. Do not treat the JSONL persistence format as a remote API: it requires shared filesystem access, is not exposed through ACP, and has a different compatibility boundary.

The pinned ACP SDK already models `tool_call`, `tool_call_update`, and `usage_update`; Harness events already carry `tool/call`, `tool/result`, and optional usage on `assistant/message`. The missing seam is projection, not data production. Discussion #4691 provides a concrete field-level mapping and a production workaround report.

## The current message path

```mermaid
sequenceDiagram
  participant E as ACP editor/client
  participant B as dsh-acp bridge
  participant A as DSH Agent
  participant S as Session log
  E->>B: session/new(cwd)
  B->>A: agents.create(fresh id)
  E->>B: session/prompt(text)
  B->>A: followup(user message)
  A->>S: assistant/chunk × N
  Note over B,S: rc.2 ACP omits raw chunks and tool events
  A->>S: assistant/message committed
  S-->>B: session/event
  B-->>E: agent_message_chunk(whole text block)
  A-->>B: whole Agent becomes idle
  B-->>E: prompt response(stopReason)
```

Prompt settlement waits for whole-Agent idle, not merely the correlated `turn/end`. Steering or injected work can therefore contribute committed messages before the response settles. Token-limit endings map to `end_turn`; a correlated model error rejects the prompt.

## Run the official source demo as a bounded probe

The repository example is the authoritative executable composition:

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
git checkout b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
corepack pnpm install --frozen-lockfile
DEEPSEEK_API_KEY=... corepack pnpm run demo:acp
```

Stdout is protocol-only newline-delimited JSON-RPC. Send diagnostics to stderr; one stray stdout log corrupts the transport. Use a limited provider key and a disposable workspace because the example composes filesystem, Bash, subagent, workflow, compaction, and hook capabilities.

Do not paste a credential into editor settings. Prefer an environment supplied to the process by a secret manager or a wrapper whose permissions and stdout behavior you have reviewed.

## Register it as a custom Zed Agent for testing

Zed's current External Agents UI can add a custom ACP process. A source-checkout probe can use a wrapper command that changes to the pinned repository and runs `pnpm run demo:acp`. Keep the wrapper's stdout protocol-pure.

Conceptual `agent_servers` entry:

```json
{
  "agent_servers": {
    "deepseek-harness-rc8-probe": {
      "type": "custom",
      "command": "/absolute/path/to/dsh-acp-wrapper",
      "args": [],
      "env": {}
    }
  }
}
```

This is a developer probe, not a claim that DSH is in the ACP Registry or provides a production editor integration. Zed's own documentation says External Agents own their runtime, model, authentication, tools, and native configuration; Zed model keys do not automatically configure the external process.

## Probe what exists

Use a disposable project and record the ACP log.

1. Start one fresh thread and confirm `initialize` plus `session/new` succeed.
2. Send a short prompt and timestamp the first provider activity, first ACP text update, commit, and prompt response.
3. Confirm the first ACP text arrives after `assistant/message`, not for every `assistant/chunk`.
4. Trigger a bounded tool call and confirm no `tool_call` or `tool_call_update` arrives.
5. Capture the prompt response and confirm no runtime-owned token usage arrives in-band.
6. Cancel one running prompt and verify it settles as cancelled without affecting another Session.
7. Under `workspace-write`, trigger one permission escalation and test both one-shot outcomes.
8. Restart the ACP process and confirm the previous Session id is unknown.
9. Attempt non-empty `mcpServers` or `additionalDirectories` only in a disposable test and retain the expected invalid-params response.

Use Zed's `dev: open acp logs` command for the host-side wire trace. Sanitize prompts, paths, tool arguments, and environment data before sharing.

## Do not promise these editor experiences yet

- **Token streaming:** committed block delivery can still be labeled a chunk on the wire.
- **Thinking display:** reasoning stays in DSH Session events and is not projected to ACP.
- **Tool cards:** the bridge omits call, progress, result, and presentation metadata.
- **Runtime-owned usage:** reconcile at the model gateway only as an explicit workaround; it is not equivalent to an ACP per-turn receipt.
- **Restored threads:** a persisted JSONL Session is not reachable through ACP load/resume.
- **Editor context parity:** image, audio, embedded context, extra roots, and forwarded MCP servers reject.
- **Zed-native policy:** DSH owns provider routing and the composed capability graph; the editor is not the security boundary.

If the desired experience is an interactive terminal application, use a real CLI/TUI in a terminal thread. If the desired client needs complete DSH durable events today, evaluate the DSH SDK instead of relabeling ACP committed messages as live progress.

## What a complete editor-facing bridge needs

### Streaming projection

Project raw `assistant/chunk` text deltas to ACP incrementally, while handling retries and replacement correctly. A failed or retried provider attempt must not leave stale text in an editor that cannot retract it. Define whether reasoning and tool activity use standard ACP update kinds and preserve call identity through start, progress, permission, result, and cancellation.

### Minimal automation telemetry

If the bridge remains committed-message-only, it can still expose machine facts without becoming an editor UI. Map `tool/call` to `tool_call` using the existing call id, name, and raw input; map `tool/result` to a terminal `tool_call_update`; and attach normalized usage to the prompt response or a `usage_update`. Define redaction for arguments and results before enabling this across trust boundaries.

### Session discovery and resume

Add protocol-supported list/load/resume behavior backed by the existing persistence coordinator. Resume must use the exact persisted Session and its original Agent composition, reject duplicate live ownership, run crash repair once, establish a replay watermark, and avoid re-emitting historical output as new streaming content.

### Capability negotiation

Advertise only implemented prompt, filesystem, terminal, MCP, and Session capabilities. Validate host-supplied roots and servers rather than silently ignoring them. Treat the editor process, DSH process, provider, and tool backends as separate trust and billing boundaries.

## Acceptance matrix

- Text deltas arrive before committed assistant messages and preserve Unicode boundaries.
- Retry replacement removes or supersedes abandoned partial text deterministically.
- Reasoning visibility follows an explicit opt-in/redaction policy.
- Tool lifecycle updates preserve one stable call id.
- Tool inputs and outputs follow an explicit redaction and retention policy.
- Successful, failed, and cancelled tools each terminate exactly once.
- Prompt usage agrees with provider accounting for cached and reasoning tokens.
- Permission, cancellation, and prompt settlement do not regress.
- Session list returns only authorized roots and sanitized metadata.
- Resume loads one exact persisted Session with single-writer ownership.
- Historical replay is distinguishable from new live output.
- Reconnect resumes from a watermark without duplicate chunks.
- Unsupported host capabilities remain unadvertised and fail clearly.
- Multiple Sessions remain isolated across cwd, cancellation, and disposal.
- Source demo, SDK client, and at least one real editor host pass the same protocol fixtures.

## Primary sources

Verified against DeepSeek Harness rc.2 commit `b150a551b8d465e31e418e1b2eaf5e79bbb7d28e` and current Zed External Agents documentation on 2026-08-27.

- [Upstream editor-integration request #3453](https://github.com/deepseek-ai/deepseek-harness/discussions/3453)
- [ACP telemetry request #4691](https://github.com/deepseek-ai/deepseek-harness/discussions/4691)
- [rc.2 ACP implementation](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/acp/acp/src/index.ts)
- [rc.2 ACP automation contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/acp/acp/README.md)
- [rc.2 runnable ACP example](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/examples/acp-agent/README.md)
- [rc.2 Session event types](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/core/session/src/types.ts)
- [Zed External Agents](https://zed.dev/docs/ai/external-agents)
- [Zed ACP debugging and Agent Panel](https://zed.dev/docs/ai/agent-panel)
