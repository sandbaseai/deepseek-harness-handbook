---
title: DeepSeek Harness Troubleshooting
locale: en
content_revision: 19
status: canonical
verified_at: 2026-08-19
---

# DeepSeek Harness troubleshooting

Diagnose the failing layer before reinstalling or changing configuration.

## Symptom index

| Symptom | Likely layer | First evidence to collect |
|---|---|---|
| `dsh` command does not start | Node/npm/package resolution | Node version and full terminal error |
| Source `pnpm dsh web` says `--expose-internals is required for HMR service` | package-manager/native helper/HMR loader capability | Git SHA, pinned and actual pnpm versions, helper probe, direct-flag A/B |
| Global pnpm `dsh web` says an installed bare plugin cannot be found | isolated native platform-package resolution | exact CLI version, global root, dependency tree, physical package paths, project-local A/B |
| macOS workspace selection reports a path ending in `:/` and `ENOENT` | native picker AppleScript path conversion | exact picker output, normalized-path `test -d`, volume topology, picker backend |
| Web UI does not open | process/listen address | printed URL and terminal logs |
| Remote Web shell opens but data is empty | browser secure context / transport | URL origin, `window.isSecureContext`, and console error |
| Composer remains disabled | workspace selection | selected workspace in UI |
| Provider authentication fails | model route/credential | provider name and sanitized error |
| Provider says requested messages plus completion exceed context | request token budget | message tokens, requested completion, and model window from the error |
| Every follow-up in one Session returns `400 ... Unterminated string` | persisted tool-call arguments | exported Session log, malformed `tool/call` seq, and fresh-Session A/B result |
| UI TTFT grows with mature Sessions or subagent fan-out | Host / provider / Session event pressure | `step/start`, gateway arrival/first-token, first `assistant/chunk`, event count, and active-step count |
| Host exits with `ERR_HTTP2_INVALID_SESSION` | provider transport / proxy / HTTP/2 session | complete stack, Node A/B result, and sanitized provider hostname |
| Agent sees the wrong files | workspace/scope | launch directory and selected workspace |
| Bash, grep, and glob all fail with `ENOENT` after a directory move | immutable Session cwd / subprocess workdir | recorded Session cwd, `test -d`, external `command -v bash`, and fresh-Session A/B |
| Tool waits indefinitely | approval/inbox | pending approval and last session event |
| Agent repeats tools or spends after the task should be done | agent loop / retry / background owner | ordered Session events, request count, and provider usage curve |
| Tool is denied | permission policy | operation, target, and active policy |
| Command runs in wrong environment | capability provider | resolved config and sandbox/backend |
| `run_code` is available while relying on `read-only` or `workspace-write` | Code Mode runtime trust boundary | effective tools mode, permission mode, code runtime, and outer isolation |
| PowerShell or Windows sandbox behaves differently | platform execution boundary | active `pwsh` rows, permission mode, and complete stderr |
| Windows folder picker opens but the worker exits without a result | native dialog / Node-Koffi decode / stale Host | dialog timing, Node version, exact DSH PID, and project-local native import |
| Editing an existing Windows profile file reports `ReplaceFileW EACCES (Win32 5)` | atomic publication / HMR watcher | running Host owner, new-file A/B result, stopped-Host result, attributes, and ACL |
| Response disappears after reload | persistence/session log | session events and configured store |
| Session crashes after its log is deleted or replaced | live/durable ownership | first persistence error and an offline artifact copy |
| Session resume refuses an unknown downstream plugin event type | durable event compatibility | plugin version, event type and seq, Harness revision, and whether the event is reconstruction-required |
| UI and transcript disagree | durable vs live event consumer | last `session/event` sequence |
| Profile stops booting after a plugin change | package/bundle/composition lifecycle | manifest diff, lockfile diff, and `--dump-config` before/after |
| Persistent Bash reports `PTY shell exited during startup` | terminal backend executable | `/bin/bash` existence and `command -v bash` from the Harness host |

## Focused guides

- [`--expose-internals` HMR startup diagnosis](hmr-expose-internals-source-checkout.md)
- [Custom plugin events and Session resume compatibility](../plugin-development/custom-session-events.md)
- [Code Mode worker-thread trust boundary](../security/code-mode-worker-trust-boundary.md)
- [MCP server not connecting or tools missing](mcp-server-not-connecting.md)
- [`ERR_HTTP2_INVALID_SESSION` provider-transport crashes](http2-invalid-session.md)
- [Sandbox denial versus `SANDBOX_UNAVAILABLE`](sandbox-denied-vs-unavailable.md)
- [Windows compatibility and troubleshooting](windows-compatibility.md)
- [Windows folder-picker worker crash](windows-folder-picker-worker-crash.md)
- [Plugin installation and known-good recovery](plugin-install-recovery.md)
- [Remote Web UI, HTTPS, and `crypto.randomUUID`](remote-web-secure-context.md)
- [PTY shell path on NixOS and minimal Linux](pty-shell-path.md)
- [`spawn bash ENOENT` after a workspace moves](workspace-moved-spawn-enoent.md)
- [Protect and recover live session logs](live-session-log-durability.md)
- [Fix context window exceeded errors](context-window-exceeded.md)
- [Stop a runaway Agent loop and contain spend](runaway-agent-loop.md)
- [Recover a Session poisoned by invalid tool-call JSON](poisoned-session-invalid-tool-json.md)
- [Diagnose slow TTFT in mature Sessions](slow-ttft-mature-sessions.md)
- [Fix `ReplaceFileW EACCES` on Windows HMR-watched config](windows-replacefile-eacces.md)

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
