# DeepSeek Harness Handbook

[English](README.md) · [简体中文](docs/zh-CN/README.md) · [日本語](docs/ja/README.md) · [한국어](docs/ko/README.md) · [Español](docs/es/README.md)

[![GitHub stars](https://img.shields.io/github/stars/sandbaseai/deepseek-harness-handbook?style=flat&logo=github&label=Stars&color=0b7a53)](https://github.com/sandbaseai/deepseek-harness-handbook/stargazers) [![Content check](https://github.com/sandbaseai/deepseek-harness-handbook/actions/workflows/content-check.yml/badge.svg?branch=main)](https://github.com/sandbaseai/deepseek-harness-handbook/actions/workflows/content-check.yml) [![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-0b7a53.svg)](LICENSE)

![DeepSeek Harness Handbook — Agent-first, multilingual, source-backed](assets/deepseek-harness-handbook-social-preview.png)

> The agent-first, multilingual field guide to understanding, running, debugging, and extending [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

If this handbook saves you time, **star the repository** and watch releases. That signal helps more Agent builders find source-backed DeepSeek Harness guidance.

**[Open the cheat sheet](docs/en/reference/cheat-sheet.md)** · **[Get started in five minutes](docs/en/getting-started/quickstart.md)** · **[Build a repository research Agent](docs/en/recipes/repository-research-agent.md)** · **[Contribute](CONTRIBUTING.md)**

DeepSeek Harness is more than a model wrapper. It is a composable agent runtime that connects model providers, tools, approval, sandboxing, durable sessions, subagents, and user interfaces through a plugin graph. This independent handbook explains those systems from the perspective of people building and operating agents.

The project is maintained by [SandBase](https://sandbase.ai/). It is not an official DeepSeek AI project.

> [!IMPORTANT]
> DeepSeek Harness is in developer preview and may introduce compatibility-breaking changes. Pages in this handbook name their verification date and link to primary sources. Pin the revision you deploy.

## Start with your goal

| I want to… | Start here |
|---|---|
| Keep the essential commands and checks in one tab | [DeepSeek Harness cheat sheet](docs/en/reference/cheat-sheet.md) |
| Choose the right official runnable example | [Official examples map](docs/en/examples/official-examples-map.md) |
| Understand what DeepSeek Harness actually is | [DeepSeek Harness explained](docs/en/what-is-deepseek-harness.md) |
| Run the Web UI safely | [Five-minute quickstart](docs/en/getting-started/quickstart.md) |
| Use it from Python | [Python SDK quickstart](docs/en/getting-started/python-sdk.md) |
| Run one task in automation or CI | [Headless Agent guide](docs/en/getting-started/headless-agent.md) |
| Configure DeepSeek or another provider | [Model provider guide](docs/en/getting-started/model-providers.md) |
| Connect external MCP tools | [MCP integration guide](docs/en/integrations/mcp.md) |
| Add reusable Agent instructions | [Skills guide](docs/en/agent-patterns/skills.md) |
| Delegate work to child Agents | [Subagents guide](docs/en/agent-patterns/subagents.md) |
| Understand the runtime | [The agent-runtime mental model](docs/en/architecture/agent-runtime.md) |
| Understand one complete turn | [Agent Loop and Session Events](docs/en/architecture/agent-lifecycle.md) |
| Understand approval, guards, and tool effects | [Tool execution pipeline](docs/en/architecture/tool-execution-pipeline.md) |
| Build an Agent rather than a loose collection of tools | [Agent design map](docs/en/agent-patterns/designing-an-agent.md) |
| Research a repository without publishing changes | [Repository Research Agent recipe](docs/en/recipes/repository-research-agent.md) |
| Run or debug DeepSeek Harness on Windows | [Windows compatibility guide](docs/en/troubleshooting/windows-compatibility.md) |
| Fix persistent Bash on NixOS or minimal Linux | [PTY shell-path guide](docs/en/troubleshooting/pty-shell-path.md) |
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
- **Multilingual by design:** translations declare their canonical source revision and review status.

## Published guide map

Every item below is available now. Planned coverage lives in the [public roadmap](ROADMAP.md).

### Getting started

- [What is DeepSeek Harness?](docs/en/what-is-deepseek-harness.md)
- [Five-minute Web UI quickstart](docs/en/getting-started/quickstart.md)
- [Python SDK quickstart](docs/en/getting-started/python-sdk.md)
- [Headless Agent and CI](docs/en/getting-started/headless-agent.md)
- [Configure model providers](docs/en/getting-started/model-providers.md)

### Architecture

- [The agent-runtime mental model](docs/en/architecture/agent-runtime.md)
- [Agent Loop and Session Events](docs/en/architecture/agent-lifecycle.md)
- [Tool execution pipeline](docs/en/architecture/tool-execution-pipeline.md)

### Agent patterns

- [Designing an Agent](docs/en/agent-patterns/designing-an-agent.md)
- [Skills: discovery, precedence, and invocation](docs/en/agent-patterns/skills.md)
- [Subagents: providers, delegation, and continuation](docs/en/agent-patterns/subagents.md)

### Recipes

- [Repository Research Agent](docs/en/recipes/repository-research-agent.md)

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

### Searchable operations

- [DeepSeek Harness cheat sheet](docs/en/reference/cheat-sheet.md)
- [Troubleshooting index](docs/en/troubleshooting/README.md)
- [MCP server not connecting](docs/en/troubleshooting/mcp-server-not-connecting.md)
- [Sandbox denial versus sandbox unavailable](docs/en/troubleshooting/sandbox-denied-vs-unavailable.md)
- [Windows compatibility and troubleshooting](docs/en/troubleshooting/windows-compatibility.md)
- [PTY shell path on NixOS and minimal Linux](docs/en/troubleshooting/pty-shell-path.md)
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
