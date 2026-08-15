---
title: DeepSeek Harness Troubleshooting
locale: en
content_revision: 4
status: canonical
verified_at: 2026-08-14
---

# DeepSeek Harness troubleshooting

Diagnose the failing layer before reinstalling or changing configuration.

## Symptom index

| Symptom | Likely layer | First evidence to collect |
|---|---|---|
| `dsh` command does not start | Node/npm/package resolution | Node version and full terminal error |
| Web UI does not open | process/listen address | printed URL and terminal logs |
| Composer remains disabled | workspace selection | selected workspace in UI |
| Provider authentication fails | model route/credential | provider name and sanitized error |
| Provider says requested messages plus completion exceed context | request token budget | message tokens, requested completion, and model window from the error |
| Agent sees the wrong files | workspace/scope | launch directory and selected workspace |
| Tool waits indefinitely | approval/inbox | pending approval and last session event |
| Tool is denied | permission policy | operation, target, and active policy |
| Command runs in wrong environment | capability provider | resolved config and sandbox/backend |
| PowerShell or Windows sandbox behaves differently | platform execution boundary | active `pwsh` rows, permission mode, and complete stderr |
| Response disappears after reload | persistence/session log | session events and configured store |
| Session crashes after its log is deleted or replaced | live/durable ownership | first persistence error and an offline artifact copy |
| UI and transcript disagree | durable vs live event consumer | last `session/event` sequence |

## Focused guides

- [MCP server not connecting or tools missing](mcp-server-not-connecting.md)
- [Sandbox denial versus `SANDBOX_UNAVAILABLE`](sandbox-denied-vs-unavailable.md)
- [Windows compatibility and troubleshooting](windows-compatibility.md)
- [Protect and recover live session logs](live-session-log-durability.md)
- [Fix context window exceeded errors](context-window-exceeded.md)

## Collect a minimal diagnostic bundle

Share no secrets. Record:

```text
Harness invocation:
Node and package-manager versions:
Operating system:
Profile:
Selected workspace:
Expected behavior:
Observed behavior:
Last durable session event:
Sanitized terminal/browser error:
```

Dump the resolved composition when the failure may depend on plugins or patches:

```sh
dsh --profile web --dump-config
```

## A reliable isolation order

1. **Process:** did the command start and remain alive?
2. **Surface:** can the browser or client reach it?
3. **Workspace:** is the intended scope selected?
4. **Provider:** can the configured route authenticate and stream?
5. **Agent loop:** did a turn and step start?
6. **Tool pipeline:** was the call classified, approved, executed, and post-processed?
7. **Persistence:** were durable events appended and replayed?

## Before reporting upstream

Reproduce on a clean disposable workspace, remove keys and private paths, identify the smallest failing profile, and search [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions). Include exact versions or an upstream commit SHA because the project is changing rapidly.

## Official sources

- [Architecture](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md)
- [Defensive patterns](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/defensive-patterns.md)
- [Postmortems](https://github.com/deepseek-ai/deepseek-harness/tree/master/docs/postmortem)
