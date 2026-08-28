---
title: DeepSeek Harness Ecosystem Resources, Curated by Capability
locale: en
content_revision: 3
status: canonical
verified_at: 2026-08-28
sources:
  - https://github.com/0xsline/awesome-deepseek-harness/blob/main/CATALOG.md
  - https://github.com/0xsline/awesome-deepseek-harness/blob/main/README.md
---

# DeepSeek Harness resources, curated by capability

The [Awesome DeepSeek Harness](https://github.com/0xsline/awesome-deepseek-harness) project maintains a large public index assembled from the DSH external hub and the `dsh-plugin` topic. This page is a smaller Agent-first map: it selects representative resources by the problem they solve, then routes you to the upstream project for installation and current compatibility.

The source index is licensed CC0. The descriptions below are concise editorial summaries, not endorsements or security reviews. Verify each repository's `package.json`, `dsh.bundle` manifest, permissions, release activity, and source before installing it into a real profile.

## Start with discovery and authoring

| Capability | Resource | Why it is useful |
|---|---|---|
| Plugin development | [dsh-plugin-dev](https://github.com/dsh-external/dsh-plugin-dev) | Field notes and skills for Cordis composition, TypeScript setup, Windows junctions, and persistence pitfalls. |
| Plugin authoring skills | [dsh-plugin-skills](https://github.com/dsh-external/dsh-plugin-skills) | Skills for building and testing DeepSeek Harness plugins. |
| Plugin composition examples | [dsh-cordis-rocks](https://github.com/dsh-external/dsh-cordis-rocks) | Runnable Cordis tutorials covering lifecycle, tools, skills, workflows, and runtime extension. |
| Find installed/public plugins | [dsh-find-plugins](https://github.com/dsh-external/dsh-find-plugins) | Searches a hub catalog, proposes an install path, and asks you to verify the result. |
| Context cost audit | [dsh-context-doctor](https://github.com/Zhenyu98/dsh-context-doctor) | Measures instruction, skill-catalog, and tool-schema token cost and reports duplication or conflicts. |
| Plugin manifest checks | [dsh-plugin-check](https://github.com/dsh-external/dsh-plugin-check) | Performs read-only checks of plugin manifests, patch shape, build traps, and hub status. |

Use discovery tools as indexes, not trust oracles. A listing is not proof that a package is safe, maintained, compatible with your release, or appropriate for a production profile.

## Memory, sessions, and recovery

| Capability | Resource | Why it is useful |
|---|---|---|
| Session repair | [dsh-session-repair-skill](https://github.com/dsh-external/dsh-session-repair-skill) | Detects and repairs damaged session history with a read-first workflow. |
| Session health | [dsh-session-health](https://github.com/dsh-external/dsh-session-health) | Scans multi-frame Zstandard Session files for torn, empty, or corrupt artifacts. |
| Cross-session memory | [dsh-memory](https://github.com/dsh-external/dsh-memory) | Adds long-term memory across Sessions; inspect its storage and prompt-injection boundaries first. |
| Cross-agent memory | [zilliztech/memsearch](https://github.com/zilliztech/memsearch) | Provides a DSH plugin and shared memory layer alongside other coding agents. |
| Session branching | [dsh-rewind](https://github.com/dsh-external/dsh-rewind) | Folds exploration after a checkpoint into a report while retaining the complete log. |
| Cross-tool Session import | [dsh-session-hub](https://github.com/dsh-external/dsh-session-hub) | Presents opencode, Claude Code, and Antigravity histories and imports them idempotently as native Sessions. |

Memory and repair tools can read sensitive prompts, tool output, and credentials. Test against a copied profile, keep an evidence digest, and confirm whether a command mutates the source before use. See the [Session log storage format](../reference/session-log-storage-format.md) guide for packed rows and version boundaries.

## Execution, routing, and research

| Capability | Resource | Why it is useful |
|---|---|---|
| Plan/execute routing | [dsh-plan-execute](https://github.com/dsh-external/dsh-plan-execute) | Routes planning and execution to separate configured models with an approval boundary. |
| Deep research workflow | [dsh-deep-research](https://github.com/dsh-external/dsh-deep-research) | Provides an adaptive research orchestration workflow. |
| LLM fallback policy | [dsh-llm-fallbacks](https://github.com/dsh-external/dsh-llm-fallbacks) | Applies role-based retry and fallback policy; verify cost and retry limits. |
| Agent-to-agent routing | [DSH-Subagent-Model-Router](https://github.com/CypherNaught-0x/DSH-Subagent-Model-Router) | Routes delegated work to configured models and exposes join/wait behavior. |
| Agent budget guard | [dsh-agent-budget](https://github.com/dsh-external/dsh-agent-budget) | Adds an agent-tree token budget boundary; verify whether limits cover descendants and retries. |
| GitHub credential bridge | [dsh-gh-bridge](https://github.com/dsh-external/dsh-gh-bridge) | Bridges a GitHub token from macOS Keychain into `gh` configuration; audit secret scope carefully. |

Routing and fallback plugins can multiply provider calls. Establish a bounded budget, log the selected model and retry count, and keep approval and sandbox policy outside the plugin's marketing description.

## UI, files, and external tools

| Capability | Resource | Why it is useful |
|---|---|---|
| Browser panel | [dsh-browser-panel](https://github.com/dsh-external/dsh-browser-panel) | Embeds a visible browser view so model actions can be inspected step by step. |
| Office files | [dsh-office](https://github.com/dsh-external/dsh-office) | Adds an Office-file workflow and document preview surface. |
| Design workflows | [dsh-design](https://github.com/dsh-external/dsh-design) | Provides design-agent workflows with visual verification and hash-bound delivery. |
| Cross-agent history | [dsh-chat-import](https://github.com/Nwflower/dsh-chat-import) | Imports histories from multiple coding agents as resumable DSH Sessions. |
| Translation | [dsh-plugin-translation](https://github.com/863683348/dsh-plugin-translation) | Adds segmented translation, glossary extraction, QA, and translation memory. |
| Pi bridge | [dsh-pi-adapter](https://github.com/dsh-external/dsh-pi-adapter) | Bridges Pi coding-agent extensions into a Cordis plugin. |
| Read-only security audit | [dsh-security-audit](https://github.com/dsh-external/dsh-security-audit) | Scans configuration, plugin provenance, Sessions, and network exposure into a redacted local report. |
| Safe structured tools | [dsh-tool-schema](https://github.com/dsh-external/dsh-tool-schema) | Validates and explains JSON Schema tool contracts without network access or dynamic execution. |

File and browser capabilities expand the effect surface. Confirm path allowlists, network destinations, attachment handling, and human approval behavior in a disposable profile before enabling them for a valuable workspace.

## More resources from the upstream catalog

The full catalog is intentionally broad. These additional projects are useful when you are designing an Agent workflow rather than only adding a single tool:

| Focus | Resource | What to inspect first |
|---|---|---|
| Agent comparison | [dsh-agent-arena](https://github.com/LeemanCheung/dsh-agent-arena) | Isolated worktrees, deterministic validation, and how the winning candidate is applied. |
| Multi-agent collaboration | [dsh-collaboration](https://github.com/Socialist-Sister/dsh-collaboration) | Dispatch protocol, model roster, relay topology, and multimodal bridge permissions. |
| Background agents | [dsh-background-agents](https://github.com/PerryLink/dsh-background-agents) | Child-session lifetime, tool scoping, delegation depth, and interruption behavior. |
| GitHub intelligence | [dsh-github-intelligence](https://github.com/zoahdev/dsh-github-intelligence) | Read-only boundaries, provider coverage, caching, and rate-limit handling. |
| Context visibility | [dsh-context](https://github.com/bowenliang123/dsh-context) | Per-request token accounting and whether compression/injection events are auditable. |
| MCP discovery | [dsh-mcp-lens](https://github.com/labmimors/dsh-mcp-lens) | Lazy connections, exact schemas, remote catalog trust, and cache bounds. |
| Memory governance | [dsh-memory-gate](https://github.com/GIT121995/dsh-memory-gate) | Claim authority rules, scope isolation, injection caps, and local storage format. |
| Cross-agent import | [dsh-chat-import](https://github.com/Nwflower/dsh-chat-import) | Source transcript handling, resumability, and reverse export behavior. |
| Search without a key | [dsh-free-web-search](https://github.com/delef/dsh-free-web-search) | Fallback order, page extraction, caching, and which engines send user data off-box. |
| Todo evidence | [dsh-todo-guard](https://github.com/a903067276-rgb/dsh-todo-guard) | Evidence states, restart recovery, and the boundary between verified and claimed work. |
| Core utility tools | [dsh-toolkit](https://github.com/dsh-external/dsh-toolkit) | Zero-dependency tool surface and input validation before enabling broad profiles. |
| Plugin marketplace | [dsh-plugin-hub](https://github.com/Noob-stupid/dsh-plugin-hub) | Index provenance, enable/disable semantics, rollback, and package verification. |

These entries are pointers for further reading, not a recommendation to install everything together. Combining context, memory, routing, and background-agent plugins can change prompt size, cost, and authority boundaries in ways that are hard to see from a marketplace description.

## Four practical starter paths

Use a small, testable path instead of assembling a profile from the entire catalog:

| If you are trying to… | Start with | Add only after the baseline is observable |
|---|---|---|
| Compare agents on the same coding task | [dsh-agent-arena](https://github.com/LeemanCheung/dsh-agent-arena) | [dsh-context](https://github.com/bowenliang123/dsh-context) for token and compression evidence. |
| Run a supervised multi-agent team | [dsh-collaboration](https://github.com/Socialist-Sister/dsh-collaboration) | [dsh-background-agents](https://github.com/PerryLink/dsh-background-agents) for durable children, then a budget guard. |
| Build a research-and-memory workflow | [dsh-deep-research](https://github.com/dsh-external/dsh-deep-research) | [dsh-memory-gate](https://github.com/GIT121995/dsh-memory-gate) and [dsh-free-web-search](https://github.com/delef/dsh-free-web-search), with source and cost logging. |
| Operate a governed production profile | [dsh-security-audit](https://github.com/dsh-external/dsh-security-audit) | [dsh-plugin-check](https://github.com/dsh-external/dsh-plugin-check), [dsh-tool-schema](https://github.com/dsh-external/dsh-tool-schema), and an explicit rollback test. |

For each path, capture the profile manifest, loaded modules, network destinations, token/cost behavior, and removal result. That evidence turns a catalog experiment into a repeatable Agent runbook.

## A safe selection loop

1. Start from the [Awesome catalog](https://github.com/0xsline/awesome-deepseek-harness/blob/main/CATALOG.md), then choose by capability rather than popularity.
2. Read the candidate repository's README, license, manifest, install script, and recent commits.
3. Compare its required DSH version and profile with the [community plugin audit guide](../security/community-plugin-audit.md).
4. Install into a copied profile; capture the exact command, package bytes, permissions, and loaded client modules.
5. Run a harmless probe, verify the observable success signal, and test removal or rollback.
6. Record the result in your project notes; a catalog entry is not a compatibility guarantee.

The upstream index changes frequently. Treat this page as a dated map and use the source catalog for the current complete list.

## Source and boundary

- [Awesome DeepSeek Harness README](https://github.com/0xsline/awesome-deepseek-harness/blob/main/README.md)
- [Awesome DeepSeek Harness full catalog](https://github.com/0xsline/awesome-deepseek-harness/blob/main/CATALOG.md)
- [Community plugin audit guide](../security/community-plugin-audit.md)
- [Tool execution pipeline](../architecture/tool-execution-pipeline.md)
