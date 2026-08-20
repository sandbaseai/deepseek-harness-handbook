---
title: DeepSeek Harness Troubleshooting
locale: en
content_revision: 43
status: canonical
verified_at: 2026-08-20
---

# DeepSeek Harness troubleshooting

Diagnose the failing layer before reinstalling or changing configuration.

- [Recover an expired MCP session without a runaway tool loop](expired-mcp-session-loop.md)

- [Understand session model and deployment default coupling](session-model-default-coupling.md)
- [Fix dollar sign corruption in tapIndex plugins](tapindex-dollar-replacement.md)
- [Fix developer role 400 errors in OpenAI-compatible providers](openai-compatible-developer-role.md)
- [Fix macOS non-ASCII corruption in persistent Bash](macos-bash-nonascii-pty.md)

## Symptom index

| Symptom | Likely layer | First evidence to collect |
|---|---|---|
| MCP tools remain visible but every call returns `Unknown or expired MCP session` | application-level MCP session / stale tool generation | transport state, error code, connection generation, repeated-call count, and whether `initialize` plus `tools/list` reruns |
| `dsh` command does not start | Node/npm/package resolution | Node version and full terminal error |
| `npx @deepseek-ai/dsh web` shows an install prompt and appears frozen | npm exec confirmation / registry / fetch / lifecycle script | Node/npm versions, exact package, last line, registry, timing log, and `dsh --version` result |
| no MCP add button, or configured MCP tools do not appear | Agent preset / generation / MCP bridge | selected preset, fresh-Session A/B, transport, and first connection or registration error |
| Source `pnpm dsh web` says `--expose-internals is required for HMR service` | package-manager/native helper/HMR loader capability | Git SHA, pinned and actual pnpm versions, helper probe, direct-flag A/B |
| Global pnpm `dsh web` says an installed bare plugin cannot be found | isolated native platform-package resolution | exact CLI version, global root, dependency tree, physical package paths, project-local A/B |
| macOS workspace selection reports a path ending in `:/` and `ENOENT` | native picker AppleScript path conversion | exact picker output, normalized-path `test -d`, volume topology, picker backend |
| Web UI does not open | process/listen address | printed URL and terminal logs |
| Remote Web shell opens but data is empty | browser secure context / transport | URL origin, `window.isSecureContext`, and console error |
| Composer remains disabled | workspace selection | selected workspace in UI |
| Provider authentication fails | model route/credential | provider name and sanitized error |
| Chat works through a custom gateway but `web_search` returns 401, reserved-tool, or no-result-block errors | independent Web Search endpoint / credential / Anthropic dialect | search request event endpoint, credential reference name, gateway protocol, and structured response blocks |
| Chinese input receives an English answer or English Think row | user instruction / persona / provider / gateway | fresh-Session A/B, answer language, reasoning language, effective system-prompt row, and exact route |
| Session title remains a clipped first-prompt fallback on a reasoning model | auxiliary title route / shared reasoning-text output cap | latest title source, `session/title-llm-request`, maxTokens, and terminal finish reason |
| Web clears a prompt, the turn fails, and no user bubble appears | browser draft / Host admission / Agent inbox / Session durability | RPC outcome, composer restoration, ordered tail events, matching `user/message`, and `source.rpcId` |
| `DeepSeek API request to ... failed` before an HTTP response | Host-to-provider network transport | deepest cause, Node version, endpoint, proxy requirement, and TLS inspection state |
| Provider says requested messages plus completion exceed context | request token budget | message tokens, requested completion, and model window from the error |
| One word, phrase, or n-gram repeats until the output cap | model stream degeneration / repetition guard | raw text deltas, repeated unit and offset, finish reason, route, and retry policy |
| Every follow-up in one Session returns `400 ... Unterminated string` | persisted tool-call arguments | exported Session log, malformed `tool/call` seq, and fresh-Session A/B result |
| Every retry returns `400 insufficient tool messages following tool_calls` | provider transcript / missing tool results | assistant call ids, durable call/result pairs, first scheduler error, and closed turn reason |
| UI TTFT grows with mature Sessions or subagent fan-out | Host / provider / Session event pressure | `step/start`, gateway arrival/first-token, first `assistant/chunk`, event count, and active-step count |
| Host exits with `ERR_HTTP2_INVALID_SESSION` | provider transport / proxy / HTTP/2 session | complete stack, Node A/B result, and sanitized provider hostname |
| Agent sees the wrong files | workspace/scope | launch directory and selected workspace |
| Bash, grep, and glob all fail with `ENOENT` after a directory move | immutable Session cwd / subprocess workdir | recorded Session cwd, `test -d`, external `command -v bash`, and fresh-Session A/B |
| Tool waits indefinitely | approval/inbox | pending approval and last session event |
| Stop returns accepted but a download, install, or child process remains live | cooperative tool cancellation / process ownership | cancel response, last Session event, process tree, tool signal handling, and Agent idle time |
| A plugin tool using `spawnSync` freezes Web, cancellation, and Session flushes | synchronous subprocess / Host event loop | tool name, sync API, child command, stack sample, cancellation and health-probe result |
| Agent repeats tools or spends after the task should be done | agent loop / retry / background owner | ordered Session events, request count, and provider usage curve |
| Final answer is complete but the todo strip still shows `in_progress` | model todo snapshot / Session projection | last `todo/write`, last assistant message, `turn/end` reason, and next `turn/start` |
| Tool is denied | permission policy | operation, target, and active policy |
| Every tool fails as `UNKNOWN_TOOL` or `unknown tool ""` while chat works | provider stream identity / DeepSeek translator | first and continuation tool deltas, final `tool/call`, and same-prompt route A/B |
| Command runs in wrong environment | capability provider | resolved config and sandbox/backend |
| `run_code` is available while relying on `read-only` or `workspace-write` | Code Mode runtime trust boundary | effective tools mode, permission mode, code runtime, and outer isolation |
| Code Mode Skill card is complete but the model says no content was returned | nested dispatch / outer result / instructions context | `tool/code-dispatch`, outer `run_code` result, additional contexts, and next request |
| Agent waits but question or approval card is missing | WebSocket generation / pending interaction replay | stable rpcId, socket lifecycle, mux replay, resync ordering, and Host pending registry |
| Web reports `Output token limit reached` | request cap / provider capability / context headroom | request header, stop reason, prompt/output usage, model context, and server logs |
| `/compact` says it could not produce a useful summary and `compaction/end` names an incomplete checkpoint | compaction summary output cap | compaction provider/model, maxTokens, finish reason, usage, Session events, and local-server context-shift policy |
| PowerShell or Windows sandbox behaves differently | platform execution boundary | active `pwsh` rows, permission mode, and complete stderr |
| Minimal preset `bash` reports terminal inspection unsupported on `win32` | preset / persistent PTY / process inspector | selected preset, native platform, tool name, and exact stderr |
| First Windows `workspace-write` freezes Web and unrelated RPCs | synchronous ACL materialization | canonical root, tree size, first/second elapsed time, and control-plane responsiveness |
| Windows folder picker opens but the worker exits without a result | native dialog / Node-Koffi decode / stale Host | dialog timing, Node version, exact DSH PID, and project-local native import |
| Editing an existing Windows profile file reports `ReplaceFileW EACCES (Win32 5)` | atomic publication / HMR watcher | running Host owner, new-file A/B result, stopped-Host result, attributes, and ACL |
| Response disappears after reload | persistence/session log | session events and configured store |
| Session list is empty, or history reports a frame, sequence, or duplicate-start error | physical log / event ordering / client projection | exact signature, stopped-writer process list, immutable artifact copy, and repeated call IDs |
| Session crashes after its log is deleted or replaced | live/durable ownership | first persistence error and an offline artifact copy |
| Session resume refuses an unknown downstream plugin event type | durable event compatibility | plugin version, event type and seq, Harness revision, and whether the event is reconstruction-required |
| UI and transcript disagree | durable vs live event consumer | last `session/event` sequence |
| Profile stops booting after a plugin change | package/bundle/composition lifecycle | manifest diff, lockfile diff, and `--dump-config` before/after |
| Profile stops booting after a raw `cordis.patch.yml` insert | user layer / module resolution / Loader activation | both user layers, `--dump-default-config`, first import error, and profile-root resolution |
| Plugin boot reports `Cannot find package '@deepseek-ai/dsh-client-schema-form'` | plugin import / DSH distribution closure | DSH channel and version, importing file, plugin manifest, and physical package roots |
| Git plugin install succeeds, then boot reports a missing `dist/` or `lib/` export | package build artifact / loader import | install flags, package scripts and exports, allowBuilds, artifact tree, and first import stack |
| `dsh plugin ... add` reports `ERR_PNPM_ADDING_TO_ROOT` | profile package-manager workspace target | DSH and pnpm versions, selected profile, exact command, and profile workspace file |
| plugin add prints many `missing peer` warnings or an ignored-build notice | Host/profile dependency boundary / plugin build policy | requested ranges, resolved paths and versions, profile workspace, exact build identity, and real capability result |
| Persistent Bash reports `PTY shell exited during startup` | terminal backend executable | `/bin/bash` existence and `command -v bash` from the Harness host |

## Focused guides

- [Fix Web Search authentication on a custom gateway](web-search-custom-gateway-auth.md)
- [Diagnose npx hanging before DeepSeek Harness starts](npx-install-prompt-hangs.md)
- [Detect and recover from degenerate repeated model output](degenerate-model-output.md)
- [Replace synchronous subprocess calls inside plugin tools](../plugin-development/async-subprocess-tools.md)
- [Stop a foreground tool that will not cancel](stuck-tool-cancellation.md)
- [DeepSeek API fetch failures behind a proxy or enterprise CA](deepseek-api-fetch-failed-proxy-ca.md)
- [`--expose-internals` HMR startup diagnosis](hmr-expose-internals-source-checkout.md)
- [Custom plugin events and Session resume compatibility](../plugin-development/custom-session-events.md)
- [Code Mode worker-thread trust boundary](../security/code-mode-worker-trust-boundary.md)
- [Fix a nested Code Mode Skill that never enters model context](code-mode-skill-context.md)
- [Recover a missing question or approval card after reconnect](missing-question-approval-after-reconnect.md)
- [Diagnose `Output token limit reached`](output-token-limit-reached.md)
- [Fix a compaction summary truncated at the token cap](compaction-summary-truncated.md)
- [Add an MCP server and diagnose missing tools](mcp-server-not-connecting.md)
- [`ERR_HTTP2_INVALID_SESSION` provider-transport crashes](http2-invalid-session.md)
- [Sandbox denial versus `SANDBOX_UNAVAILABLE`](sandbox-denied-vs-unavailable.md)
- [Windows compatibility and troubleshooting](windows-compatibility.md)
- [Fix Minimal preset Bash on native Windows](windows-minimal-preset-bash.md)
- [Diagnose the first Windows workspace-write freeze](windows-first-workspace-write-freeze.md)
- [Windows folder-picker worker crash](windows-folder-picker-worker-crash.md)
- [Plugin installation and known-good recovery](plugin-install-recovery.md)
- [Unbrick a profile after an invalid user overlay](invalid-overlay-boot-failure.md)
- [Find a corrupt package manifest behind a pathless boot SyntaxError](corrupt-package-json-profile-boot.md)
- [Fix pi-ai `server_error` overloads that are not retried](pi-ai-server-error-not-retried.md)
- [Recover a Git plugin missing its built export](git-plugin-missing-dist.md)
- [Fix `ERR_PNPM_ADDING_TO_ROOT` during plugin add](pnpm-adding-to-root-plugin.md)
- [Diagnose plugin peer-dependency and ignored-build warnings](plugin-peer-dependency-warnings.md)
- [Fix missing `dsh-client-schema-form` after npm installation](missing-client-schema-form.md)
- [Control response and reasoning language](response-language-and-reasoning.md)
- [Fix Session titles that stay on the fallback with reasoning models](session-title-reasoning-budget.md)
- [Recover a prompt accepted before it became durable](prompt-accepted-before-durable.md)
- [Remote Web UI, HTTPS, and `crypto.randomUUID`](remote-web-secure-context.md)
- [Session first-flush failure on filesystems without hard links](session-hard-link-unsupported.md)
- [Windows standalone-pnpm `npm_execpath` build failure](windows-standalone-pnpm-npm-execpath.md)
- [Stop console windows flashing during Windows tool calls](windows-console-window-flash.md)
- [Conversation update before its start Match](conversation-update-before-start.md)
- [Plugin add exits nonzero after materialization](plugin-add-nonzero-reconcile.md)
- [PTY shell path on NixOS and minimal Linux](pty-shell-path.md)
- [`spawn bash ENOENT` after a workspace moves](workspace-moved-spawn-enoent.md)
- [Protect and recover live session logs](live-session-log-durability.md)
- [Route and recover session-history corruption](session-history-corruption-triage.md)
- [Fix context window exceeded errors](context-window-exceeded.md)
- [Stop a runaway Agent loop and contain spend](runaway-agent-loop.md)
- [Recover a Session poisoned by invalid tool-call JSON](poisoned-session-invalid-tool-json.md)
- [Recover a Session poisoned by missing tool results](dangling-tool-calls-insufficient-results.md)
- [Diagnose a todo stuck in progress after the final answer](todo-stuck-in-progress.md)
- [Fix `UNKNOWN_TOOL` from empty streamed tool identity, including Bailian](streamed-tool-call-empty-identity.md)
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
