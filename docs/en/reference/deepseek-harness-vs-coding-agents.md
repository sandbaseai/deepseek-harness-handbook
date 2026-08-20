---
title: DeepSeek Harness vs Claude Code vs Codex
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
---

# DeepSeek Harness vs Claude Code vs Codex

The useful question is not “which agent is smartest?” The model, provider route, runtime, extension system, permission boundary, and durable state are separate choices.

DeepSeek Harness is a composable agent runtime. Claude Code and Codex are coding-agent products with their own local and hosted surfaces. They overlap on repository work, instructions, Skills, MCP, shell execution, permissions, and delegated agents, but those nouns do not imply interchangeable configuration or state.

## Decision matrix

| Choose for | DeepSeek Harness rc.8 | Claude Code | Codex |
|---|---|---|---|
| Primary product boundary | composable runtime assembled from profiles, bundles, patches, and services | coding agent with terminal, IDE, SDK, and automation surfaces | coding agent across CLI, IDE, app, and cloud workflows |
| Durable instructions | profile/system-prompt composition, `AGENTS.md`, Skills | `CLAUDE.md`, rules, Skills | `AGENTS.md`, Skills, prompt or thread context |
| External tools | native tools and MCP mounted through the selected composition | MCP plus built-in tools | MCP, apps/connectors, plugins, and built-in tools |
| Extension packaging | Cordis packages and DSH bundle patches; everything resolves into one service graph | plugins package Skills, agents, hooks, and MCP servers | plugins can package Skills, tools, MCP configuration, hooks, assets, and apps |
| Policy boundary | explicit tool policy, approval tools, capability providers, and sandbox services | deny/ask/allow rules, permission modes, managed policy, and hooks | sandbox mode, approval policy, requirements/admin policy, and scoped escalation |
| Session model | durable ordered Session events consumed by projections and resumable services | resumable conversations plus project/user state and auto memory | threads/tasks plus repository state; surface capabilities differ |
| Best fit | building or operating a custom agent product whose runtime graph must be inspectable and replaceable | using or extending Claude as a coding agent | using or extending Codex for repository engineering and parallel workflows |

This table compares control planes, not benchmark quality. Model availability, plans, enterprise policy, and product features change independently.

## Why DeepSeek Harness is a different layer

The official rc.8 architecture centers on a Cordis composition. A profile selects bundles and patches; those mount model providers, the Agent Loop, tools, policy, Session persistence, Web or headless clients, MCP, and other services. You can inspect the resolved graph with `--dump-config` and replace one service without declaring the entire product to be a new agent.

That is useful when your deliverable is the runtime itself:

- a custom operator UI or headless service;
- a controlled model/provider route;
- a product-specific tool and approval graph;
- durable Session events consumed by more than one projection;
- a plugin marketplace or independently versioned bundle; or
- a reproducible composition that another team can inspect.

The cost is ownership. You must validate package compatibility, profile resolution, state migrations, policy behavior, and every user-facing surface you compose.

## Where Claude Code is the shorter path

Claude Code already supplies a coding-agent loop and built-in repository tools. Its official extension map separates `CLAUDE.md`, Skills, subagents, agent teams, MCP, hooks, and plugins. Its permission system evaluates deny, ask, and allow rules, with managed settings available for organizational control.

Choose it when the job is primarily “give Claude a governed software-engineering workspace,” and the built-in product lifecycle is the desired boundary. Do not recreate a Cordis-style service graph merely to add one repeatable workflow; a Skill, hook, subagent, or MCP server may be the smaller extension.

## Where Codex is the shorter path

Codex already supplies repository-aware coding workflows across local and hosted surfaces. `AGENTS.md` carries durable repository guidance; Skills carry reusable procedures; MCP and apps/connectors add external capabilities; sandbox and approval settings constrain effects; tasks and worktrees support parallel or long-running work.

Choose it when the job is primarily “have Codex understand, change, test, and review this repository.” Use project instructions and configuration before building a second runtime around the agent. Surface behavior is not uniform: a CLI thread, IDE session, desktop task, and cloud task can have different execution and handoff boundaries.

## Similar names, different contracts

| Shared noun | Migration trap | Rebuild as |
|---|---|---|
| Session / thread | copying transcripts as if they were portable runtime state | a reviewed summary plus explicit source artifacts and provenance |
| Skill | assuming discovery paths, metadata, and invocation are identical | the target product's native Skill layout and a fresh discovery test |
| MCP | copying server config without permission, transport, or lifecycle checks | one read-only server probe followed by exact tool-policy tests |
| Subagent | assuming context inheritance and continuation semantics match | an explicit delegation contract with inputs, outputs, budget, and settlement |
| Plugin | treating packages as interchangeable extension units | a target-native package with isolated install, activation, removal, and rollback tests |
| Sandbox | mapping one mode name to another | capability-by-capability filesystem, network, process, and escalation tests |
| Memory | importing private transcripts into long-term recall | classified artifacts with consent, provenance, retention, and deletion rules |

## A practical selection test

Write one sentence for each boundary before choosing:

1. **Product:** Are you operating a coding agent, or building the runtime other agents will inhabit?
2. **Model:** Must the model/provider be replaceable independently of the product?
3. **Tools:** Are built-ins plus MCP sufficient, or must tools be services inside a composed graph?
4. **Policy:** Which effects require denial, approval, sandbox enforcement, or external review?
5. **State:** What must survive restart, which reader reconstructs it, and who owns migrations?
6. **Interface:** Do you need the supplied terminal/IDE/app, or your own Web, headless, ACP, or SDK client?
7. **Distribution:** Are you shipping a repository workflow, an extension, or a complete agent product?

If most answers are about using a coding agent inside repositories, start with Claude Code or Codex. If most answers are about composing and shipping the agent control plane, evaluate DeepSeek Harness. A team can use both layers: Codex or Claude Code can develop a DSH plugin, and a DSH Agent can call external services that those ecosystems also expose through MCP.

## Evaluation gates

- [ ] Use the same repository snapshot and bounded task.
- [ ] Keep model/provider identity explicit; do not attribute model differences to the harness.
- [ ] Record instruction files and their effective scope.
- [ ] Compare the visible tool roster and exact MCP schemas.
- [ ] Test read, write, shell, network, and destructive-action policy separately.
- [ ] Restart and prove which state survives.
- [ ] Measure cancellation, failure reporting, and recovery—not only the happy path.
- [ ] Verify extension installation, upgrade, disable, and removal.
- [ ] Record latency, token usage, provider cost, and operator time independently.
- [ ] Choose from evidence produced by your workflow, not feature-name parity.

## Primary sources

### DeepSeek Harness

- [Official rc.8 README](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/README.md)
- [Official architecture](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/docs/architecture.md)
- [Official configuration catalog](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/docs/config-catalog.md)

### Claude Code

- [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works)
- [Extension overview](https://code.claude.com/docs/en/features-overview)
- [Permission configuration](https://code.claude.com/docs/en/permissions)

### Codex

- [Official Codex repository](https://github.com/openai/codex)
- [Official configuration schema](https://github.com/openai/codex/blob/main/codex-rs/core/config.schema.json)
- [OpenAI Developers: Codex](https://developers.openai.com/codex/)

## Related Handbook guides

- [What is DeepSeek Harness?](../what-is-deepseek-harness.md)
- [Agent runtime architecture](../architecture/agent-runtime.md)
- [Sessions versus long-term memory](../architecture/sessions-vs-memory.md)
- [AGENTS.md scope and precedence](../agent-patterns/agents-md-scope.md)
- [Skills: discovery, precedence, and invocation](../agent-patterns/skills.md)
