# DeepSeek Harness Handbook

[English](README.md) · [简体中文](docs/zh-CN/README.md) · [日本語](docs/ja/README.md) · [한국어](docs/ko/README.md) · [Español](docs/es/README.md)

[![GitHub stars](https://img.shields.io/github/stars/sandbaseai/deepseek-harness-handbook?style=flat&logo=github&label=Stars&color=0b7a53)](https://github.com/sandbaseai/deepseek-harness-handbook/stargazers) [![Content check](https://github.com/sandbaseai/deepseek-harness-handbook/actions/workflows/content-check.yml/badge.svg?branch=main)](https://github.com/sandbaseai/deepseek-harness-handbook/actions/workflows/content-check.yml) [![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-0b7a53.svg)](LICENSE)

![DeepSeek Harness Handbook — Agent-first, multilingual by design, source-backed](assets/deepseek-harness-handbook-social-preview.png)

> The agent-first, English-canonical field guide to understanding, running, debugging, and extending [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), with reviewed Simplified Chinese coverage and multilingual foundations.

If this handbook saves you time, **star the repository** and watch releases. That signal helps more Agent builders find source-backed DeepSeek Harness guidance.

**[Fix the Windows folder picker](https://sandbaseai.github.io/deepseek-harness-handbook/windows-folder-picker-crash.html)** · **[Use the DSH CLI](https://sandbaseai.github.io/deepseek-harness-handbook/deepseek-harness-cli.html)** · **[Choose a memory architecture](https://sandbaseai.github.io/deepseek-harness-handbook/deepseek-harness-memory.html)** · **[Keep Session roots single-writer](https://sandbaseai.github.io/deepseek-harness-handbook/deepseek-harness-single-writer.html)**

**Live operator site:** [Browse the visual field guides](https://sandbaseai.github.io/deepseek-harness-handbook/) · [Subscribe to new guides](https://sandbaseai.github.io/deepseek-harness-handbook/feed.xml) · [Read the changelog](CHANGELOG.md)

DeepSeek Harness is more than a model wrapper. It is a composable agent runtime that connects model providers, tools, approval, sandboxing, durable sessions, subagents, and user interfaces through a plugin graph. This independent handbook explains those systems from the perspective of people building and operating agents.

The project is maintained by [SandBase](https://sandbase.ai/). It is not an official DeepSeek AI project.

> [!IMPORTANT]
> DeepSeek Harness is in developer preview and may introduce compatibility-breaking changes. Pages in this handbook name their verification date and link to primary sources. Pin the revision you deploy.

## Start with your goal

| I want to… | Start here |
|---|---|
| Understand the shipped CLI, automate one task, or evaluate a community TUI | [DeepSeek Harness CLI map](https://sandbaseai.github.io/deepseek-harness-handbook/deepseek-harness-cli.html) |
| Recover when the Windows folder-picker worker exits without a result | [Windows folder-picker crash guide](https://sandbaseai.github.io/deepseek-harness-handbook/windows-folder-picker-crash.html) |
| Move Codex or Claude Code memory without losing provenance or isolation | [Sessions, Skills, and long-term memory](https://sandbaseai.github.io/deepseek-harness-handbook/deepseek-harness-memory.html) |
| Run Web, headless, ACP, or SDK processes concurrently without sharing a writable Session root | [Single-writer Session topology](https://sandbaseai.github.io/deepseek-harness-handbook/deepseek-harness-single-writer.html) |
| Fix `spawn bash ENOENT` after moving or renaming a workspace | [Moved-workspace recovery runbook](https://sandbaseai.github.io/deepseek-harness-handbook/workspace-moved-spawn-enoent.html) |
| Upgrade an exact runtime and preserve a proven rollback | [Upgrade and rollback guide](https://sandbaseai.github.io/deepseek-harness-handbook/upgrade-deepseek-harness.html) |
| Find and audit a community plugin before Host execution | [Community plugin audit](https://sandbaseai.github.io/deepseek-harness-handbook/deepseek-harness-plugin-audit.html) |
| Choose an exact, reproducible installation topology | [Install DeepSeek Harness safely](https://sandbaseai.github.io/deepseek-harness-handbook/install-deepseek-harness.html) |
| Create, invoke, and debug a reusable Skill | [DeepSeek Harness Skills lab](https://sandbaseai.github.io/deepseek-harness-handbook/deepseek-harness-skills.html) |
| Build, test, package, and install my first plugin | [First DeepSeek Harness plugin lab](docs/en/plugin-development/first-plugin.md) |
| Verify the official repository, package, release, and executable | [Official DeepSeek Harness identity guide](docs/en/reference/official-project-identity.md) |
| Check current rc.7 boundaries and safer next actions | [DeepSeek Harness rc.7 Field Status](https://sandbaseai.github.io/deepseek-harness-handbook/field-status.html) |
| Capture the package and source revision that actually ran | [DeepSeek Harness Version Evidence](https://sandbaseai.github.io/deepseek-harness-handbook/version-evidence.html) |
| Find the first broken runtime boundary | [Interactive Failure Router](https://sandbaseai.github.io/deepseek-harness-handbook/diagnose.html) |
| Keep the essential commands and checks in one tab | [DeepSeek Harness cheat sheet](docs/en/reference/cheat-sheet.md) |
| Choose the right official runnable example | [Official examples map](docs/en/examples/official-examples-map.md) |
| Understand what DeepSeek Harness actually is | [DeepSeek Harness explained](docs/en/what-is-deepseek-harness.md) |
| Run the Web UI safely | [Five-minute quickstart](docs/en/getting-started/quickstart.md) |
| Use it from Python | [Python SDK quickstart](docs/en/getting-started/python-sdk.md) |
| Run one task in automation or CI | [CLI and Headless Agent guide](https://sandbaseai.github.io/deepseek-harness-handbook/deepseek-harness-cli.html) |
| Configure DeepSeek or another provider | [Model provider guide](docs/en/getting-started/model-providers.md) |
| Fix a context-window or token-budget error | [Context window exceeded guide](docs/en/troubleshooting/context-window-exceeded.md) |
| Stop a repeating Agent turn before it exhausts a budget | [Runaway Agent loop emergency runbook](docs/en/troubleshooting/runaway-agent-loop.md) |
| Recover when every turn in one Session returns invalid JSON | [Poisoned Session recovery guide](docs/en/troubleshooting/poisoned-session-invalid-tool-json.md) |
| Explain slow first-token latency before blaming the provider | [Mature Session TTFT guide](docs/en/troubleshooting/slow-ttft-mature-sessions.md) |
| Fix `ReplaceFileW EACCES` while editing a Windows profile | [Windows HMR-watched config recovery](docs/en/troubleshooting/windows-replacefile-eacces.md) |
| Decide whether worker-thread Code Mode fits the security boundary | [Code Mode trust-boundary guide](docs/en/security/code-mode-worker-trust-boundary.md) |
| Fix source startup reporting `--expose-internals` is required | [HMR loader-capability diagnosis](docs/en/troubleshooting/hmr-expose-internals-source-checkout.md) |
| Fix a pnpm global install that reports an installed plugin as missing | [Global native-binding resolution guide](docs/en/troubleshooting/pnpm-global-native-binding.md) |
| Fix macOS workspace selection when the path ends in `:/` | [macOS native picker path guide](docs/en/troubleshooting/macos-workspace-picker-trailing-colon.md) |
| Persist downstream plugin events without breaking Session resume | [Custom Session event compatibility](docs/en/plugin-development/custom-session-events.md) |
| Connect external MCP tools | [MCP integration guide](docs/en/integrations/mcp.md) |
| Add reusable Agent instructions | [Skills guide](docs/en/agent-patterns/skills.md) |
| Delegate work to child Agents | [Subagents guide](docs/en/agent-patterns/subagents.md) |
| Understand the runtime | [The agent-runtime mental model](docs/en/architecture/agent-runtime.md) |
| Understand one complete turn | [Agent Loop and Session Events](docs/en/architecture/agent-lifecycle.md) |
| Choose between Session persistence and long-term memory | [Sessions are not long-term memory](docs/en/architecture/sessions-vs-memory.md) |
| Understand approval, guards, and tool effects | [Tool execution pipeline](docs/en/architecture/tool-execution-pipeline.md) |
| Build an Agent rather than a loose collection of tools | [Agent design map](docs/en/agent-patterns/designing-an-agent.md) |
| Research a repository without publishing changes | [Repository Research Agent recipe](docs/en/recipes/repository-research-agent.md) |
| Run or debug DeepSeek Harness on Windows | [Windows compatibility guide](docs/en/troubleshooting/windows-compatibility.md) |
| Recover a profile after a plugin change | [Plugin install and recovery guide](docs/en/troubleshooting/plugin-install-recovery.md) |
| Diagnose an `ERR_HTTP2_INVALID_SESSION` crash | [HTTP/2 provider-transport troubleshooting](docs/en/troubleshooting/http2-invalid-session.md) |
| Access the Web UI remotely without exposing an unauthenticated Agent shell | [Remote Web control-plane guide](https://sandbaseai.github.io/deepseek-harness-handbook/remote-web-secure-context.html) |
| Fix persistent Bash on NixOS or minimal Linux | [PTY shell-path guide](docs/en/troubleshooting/pty-shell-path.md) |
| Protect or recover a session log | [Live session log durability](docs/en/troubleshooting/live-session-log-durability.md) |
| Fix a failing installation or run | [Troubleshooting index](docs/en/troubleshooting/README.md) |
| Track upstream changes | [Updates and breaking changes](docs/en/updates/README.md) |

## The agent-first mental model

```mermaid
flowchart LR
  U[User goal] --> A[Agent contract]
  A --> C[Profile + Bundles + Patches]
  C --> G[Cordis plugin graph]
  G --> L[Agent Loop]
  L --> M[Model provider]
  L --> T[Tools + policy + approval + sandbox]
  L --> S[Durable Session events]
  S --> L
  S --> H[Web, headless, SDK, clients]
```

An agent is not just a prompt. A useful Agent has a task boundary, allowed effects, completion condition, model route, tool surface, permission policy, session strategy, failure behavior, and an operator-visible result. DeepSeek Harness supplies the runtime vocabulary for assembling those responsibilities without forcing every product into one fixed loop or interface.

## What makes this handbook different

- **Agent-first:** concepts are organized around building, running, and debugging Agents.
- **Source-backed:** version-sensitive claims link to official documentation or source.
- **Operational:** every tutorial includes success evidence, failure branches, and safety boundaries.
- **Visual:** architecture pages prioritize diagrams over walls of text.
- **Living:** updates, breaking changes, and troubleshooting pages follow upstream development.
- **Multilingual by design:** English is canonical; translations declare their source revision and review status. Current depth is [reported explicitly](#language-coverage).

## Language coverage

| Locale | Current status | Published coverage |
|---|---|---|
| English | Canonical | 44 pages |
| 简体中文 | Reviewed | Navigation plus three core guides |
| 日本語 | Draft | Navigation only |
| 한국어 | Draft | Navigation only |
| Español | Draft | Navigation only |

The locale links at the top do not imply feature parity. English remains the source of truth until a translation points to the current canonical revision and has been reviewed by a fluent contributor.

## Published guide map

Every item below is available now. Planned coverage lives in the [public roadmap](ROADMAP.md).

### Getting started

- [What is DeepSeek Harness?](docs/en/what-is-deepseek-harness.md)
- [Install DeepSeek Harness safely](docs/en/getting-started/install-deepseek-harness.md)
- [Upgrade and roll back safely](docs/en/getting-started/upgrade-and-rollback.md)
- [Five-minute Web UI quickstart](docs/en/getting-started/quickstart.md)
- [Python SDK quickstart](docs/en/getting-started/python-sdk.md)
- [Headless Agent and CI](docs/en/getting-started/headless-agent.md)
- [Configure model providers](docs/en/getting-started/model-providers.md)

### Architecture

- [The agent-runtime mental model](docs/en/architecture/agent-runtime.md)
- [Agent Loop and Session Events](docs/en/architecture/agent-lifecycle.md)
- [Sessions are not long-term memory](docs/en/architecture/sessions-vs-memory.md)
- [Tool execution pipeline](docs/en/architecture/tool-execution-pipeline.md)

### Agent patterns

- [Designing an Agent](docs/en/agent-patterns/designing-an-agent.md)
- [Skills: discovery, precedence, and invocation](docs/en/agent-patterns/skills.md)
- [Subagents: providers, delegation, and continuation](docs/en/agent-patterns/subagents.md)

### Recipes

- [Repository Research Agent](docs/en/recipes/repository-research-agent.md)

### Operations

- [Keep concurrent Session roots single-writer](docs/en/operations/single-writer-session-roots.md)

### Official examples

- [Choose the right upstream example](docs/en/examples/official-examples-map.md)
- Headless CLI task runner
- Python SDK and JSON-RPC runtime
- ACP automation server
- MCP memory overlays
- Self-modifying Cordis composition
- Session-local schedules

### Integrations

- [Connect MCP servers](docs/en/integrations/mcp.md)

### Plugin development

- [Build your first DeepSeek Harness plugin](docs/en/plugin-development/first-plugin.md)
- [Custom durable Session event compatibility](docs/en/plugin-development/custom-session-events.md)

### Security

- [Audit community plugins before installation](docs/en/security/community-plugin-audit.md)
- [Code Mode worker-thread trust boundary](docs/en/security/code-mode-worker-trust-boundary.md)

### Searchable operations

- [Verify the official DeepSeek Harness project](docs/en/reference/official-project-identity.md)
- [DeepSeek Harness rc.7 Field Status](https://sandbaseai.github.io/deepseek-harness-handbook/field-status.html)
- [DeepSeek Harness Version Evidence](https://sandbaseai.github.io/deepseek-harness-handbook/version-evidence.html)
- [Interactive Failure Router](https://sandbaseai.github.io/deepseek-harness-handbook/diagnose.html)
- [DeepSeek Harness cheat sheet](docs/en/reference/cheat-sheet.md)
- [Troubleshooting index](docs/en/troubleshooting/README.md)
- [MCP server not connecting](docs/en/troubleshooting/mcp-server-not-connecting.md)
- [`ERR_HTTP2_INVALID_SESSION` provider-transport crashes](docs/en/troubleshooting/http2-invalid-session.md)
- [Sandbox denial versus sandbox unavailable](docs/en/troubleshooting/sandbox-denied-vs-unavailable.md)
- [Windows compatibility and troubleshooting](docs/en/troubleshooting/windows-compatibility.md)
- [Windows folder-picker worker crash](docs/en/troubleshooting/windows-folder-picker-worker-crash.md)
- [Plugin installation and known-good recovery](docs/en/troubleshooting/plugin-install-recovery.md)
- [Remote Web access, SSH, HTTPS, and trust](docs/en/troubleshooting/remote-web-secure-context.md)
- [PTY shell path on NixOS and minimal Linux](docs/en/troubleshooting/pty-shell-path.md)
- [Protect and recover live session logs](docs/en/troubleshooting/live-session-log-durability.md)
- [Recover `spawn bash ENOENT` after a workspace moves](docs/en/troubleshooting/workspace-moved-spawn-enoent.md)
- [Fix context window exceeded errors](docs/en/troubleshooting/context-window-exceeded.md)
- [Stop a runaway Agent loop and contain spend](docs/en/troubleshooting/runaway-agent-loop.md)
- [Recover a Session poisoned by invalid tool-call JSON](docs/en/troubleshooting/poisoned-session-invalid-tool-json.md)
- [Diagnose slow TTFT in mature Sessions](docs/en/troubleshooting/slow-ttft-mature-sessions.md)
- [Fix `ReplaceFileW EACCES` on Windows HMR-watched config](docs/en/troubleshooting/windows-replacefile-eacces.md)
- [Treat worker-thread Code Mode as host-trusted](docs/en/security/code-mode-worker-trust-boundary.md)
- [Fix `--expose-internals` HMR startup from a source checkout](docs/en/troubleshooting/hmr-expose-internals-source-checkout.md)
- [Fix pnpm global native-binding plugin resolution](docs/en/troubleshooting/pnpm-global-native-binding.md)
- [Fix macOS workspace picker trailing-colon paths](docs/en/troubleshooting/macos-workspace-picker-trailing-colon.md)
- [Persist custom plugin events without breaking Session resume](docs/en/plugin-development/custom-session-events.md)
- [Updates and breaking changes](docs/en/updates/README.md)

## Repository structure

```text
docs/<locale>/
  getting-started/     installation and first runs
  architecture/        runtime and lifecycle explanations
  agent-patterns/      design decisions for real agents
  recipes/             reproducible agent builds
  troubleshooting/     symptom-driven diagnostic pages
  ecosystem/           plugins, tools, skills, and comparisons
  updates/             upstream change coverage
scripts/               content and translation verification
content-manifest.json  canonical revision and locale status
```

## Editorial and commercial boundary

DeepSeek Harness remains the subject of every technical page. SandBase maintains the handbook and may provide a restrained link to related Agent, model, Skill, or MCP discovery resources. A mention is never presented as an official DeepSeek recommendation, a compatibility guarantee, or a security endorsement.

## Contributing

Corrections, reproducible examples, diagrams, troubleshooting cases, upstream change notes, and fluent translation reviews are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and run `npm run check` before submitting a pull request.

New here? Choose a scoped task from the [public roadmap](ROADMAP.md), or open a [documentation request](https://github.com/sandbaseai/deepseek-harness-handbook/issues/new?template=documentation-request.yml). Reproducible evidence is more valuable than a large patch.

## Primary sources

- [DeepSeek Harness official repository](https://github.com/deepseek-ai/deepseek-harness)
- [Official architecture documentation](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md)
- [Official Agent lifecycle](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/agent-lifecycle.md)
- [Official capability seams](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/capability-seams.md)
- [Official tool execution pipeline](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/tool-execution-pipeline.md)
- [Official user guides](https://github.com/deepseek-ai/deepseek-harness/tree/master/docs/user/guide)

## License

Apache-2.0. See [LICENSE](LICENSE).
