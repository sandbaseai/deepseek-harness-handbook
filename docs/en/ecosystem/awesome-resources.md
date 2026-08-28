---
title: DeepSeek Harness Ecosystem Resources, Curated by Capability
locale: en
content_revision: 11
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
| Plugin composition examples | [dsh-cordis-rocks (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | The upstream catalog records runnable Cordis tutorials; verify current repository visibility before installing. |
| Find installed/public plugins | [dsh-find-plugins (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | The upstream catalog records the discovery tool; verify current repository visibility before installing. |
| Context cost audit | [dsh-context-doctor](https://github.com/Zhenyu98/dsh-context-doctor) | Measures instruction, skill-catalog, and tool-schema token cost and reports duplication or conflicts. |
| Plugin manifest checks | [dsh-plugin-check](https://github.com/dsh-external/dsh-plugin-check) | Performs read-only checks of plugin manifests, patch shape, build traps, and hub status. |
| Bilingual plugin directory | [Awesome-DeepSeek-Harness-Plugins](https://github.com/Zhiyuan-Fan/Awesome-DeepSeek-Harness-Plugins) | Browse plugins, extensions, tools, skills, clients, runtimes, and integrations in English and Chinese before selecting a candidate. |

Use discovery tools as indexes, not trust oracles. A listing is not proof that a package is safe, maintained, compatible with your release, or appropriate for a production profile.

## Memory, sessions, and recovery

| Capability | Resource | Why it is useful |
|---|---|---|
| Session repair | [dsh-session-repair-skill (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | The catalog records a read-first repair workflow; verify current repository visibility before installing. |
| Session health | [dsh-session-health](https://github.com/dsh-external/dsh-session-health) | Scans multi-frame Zstandard Session files for torn, empty, or corrupt artifacts. |
| Cross-session memory | [dsh-memory (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | The catalog records a long-term memory plugin; verify current repository visibility and prompt-injection boundaries first. |
| Cross-agent memory | [zilliztech/memsearch](https://github.com/zilliztech/memsearch) | Provides a DSH plugin and shared memory layer alongside other coding agents. |
| Session branching | [dsh-rewind](https://github.com/dsh-external/dsh-rewind) | Folds exploration after a checkpoint into a report while retaining the complete log. |
| Profile backup and recovery | [dsh-backup](https://github.com/xiaoyuyu6420/dsh-backup) | Captures upgrade snapshots, repairs session logs, redacts credentials, and supports restore before risky profile changes. |
| Cross-tool Session import | [dsh-session-hub (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | The catalog records cross-tool history import; verify current repository visibility before installing. |

Memory and repair tools can read sensitive prompts, tool output, and credentials. Test against a copied profile, keep an evidence digest, and confirm whether a command mutates the source before use. See the [Session log storage format](../reference/session-log-storage-format.md) guide for packed rows and version boundaries.

## Execution, routing, and research

| Capability | Resource | Why it is useful |
|---|---|---|
| Plan/execute routing | [dsh-plan-execute (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | The catalog records separate planning and execution models; verify current repository visibility before installing. |
| Deep research workflow | [dsh-deep-research](https://github.com/dsh-external/dsh-deep-research) | Provides an adaptive research orchestration workflow. |
| LLM fallback policy | [dsh-llm-fallbacks](https://github.com/dsh-external/dsh-llm-fallbacks) | Applies role-based retry and fallback policy; verify cost and retry limits. |
| Agent-to-agent routing | [DSH-Subagent-Model-Router](https://github.com/CypherNaught-0x/DSH-Subagent-Model-Router) | Routes delegated work to configured models and exposes join/wait behavior. |
| Agent budget guard | [dsh-agent-budget](https://github.com/dsh-external/dsh-agent-budget) | Adds an agent-tree token budget boundary; verify whether limits cover descendants and retries. |
| GitHub credential bridge | [dsh-gh-bridge (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | The catalog records a Keychain bridge; verify current repository visibility and audit secret scope carefully. |

Routing and fallback plugins can multiply provider calls. Establish a bounded budget, log the selected model and retry count, and keep approval and sandbox policy outside the plugin's marketing description.

## UI, files, and external tools

| Capability | Resource | Why it is useful |
|---|---|---|
| Browser panel | [dsh-browser-panel (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | The catalog records a visible browser panel; verify current repository visibility before installing. |
| Office files | [dsh-office (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | The catalog records an Office-file workflow; verify current repository visibility before installing. |
| Design workflows | [dsh-design (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | The catalog records design-agent workflows; verify current repository visibility before installing. |
| Cross-agent history | [dsh-chat-import](https://github.com/Nwflower/dsh-chat-import) | Imports histories from multiple coding agents as resumable DSH Sessions. |
| Translation | [dsh-plugin-translation](https://github.com/863683348/dsh-plugin-translation) | Adds segmented translation, glossary extraction, QA, and translation memory. |
| Pi bridge | [dsh-pi-adapter (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | The catalog records a Pi bridge; verify current repository visibility before installing. |
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
| Plugin workshop UI | [dsh-plugin-workshop](https://github.com/yyyyukari/dsh-plugin-workshop) | GitHub-powered search, trending windows, signature filtering, and explicit install/update/uninstall behavior. |
| Model comparison | [dsh-dual-model-eval](https://github.com/huangdaxianer/dsh-dual-model-eval) | Run the same coding prompt in isolated worktrees and compare traces before applying a candidate. |
| Planning discipline | [dsh-plans](https://github.com/Optim-Agent/dsh-plans) | Turn repository research into traceable plans, critic rounds, and a verifier checklist. |
| Agent team UI | [dsh-agent-team-gui](https://github.com/toolclub/dsh-agent-team-gui) | Manage persistent multi-model squads and bounded DAG runs from a visual control surface. |
| Context compression | [dsh-context-compressor](https://github.com/qwert702/dsh-context-compressor) | Reduce tool/history payloads for small models while keeping a resumable task flow. |
| Web search routing | [dsh-web-search-pro](https://github.com/anweat/dsh-web-search-pro) | Route multi-engine and platform search through extraction, caching, and browser rendering. |
| Cross-agent checkpoints | [task-passport](https://github.com/dongsheng123132/task-passport) | Carry machine-readable task state across multiple coding-agent runtimes. |
| Continuous evolution | [dsh-continual-evolve](https://github.com/ZK-Andy/dsh-continual-evolve) | Refine prompts, memories, skills, and subagent specs with versioning and rollback. |
| Knowledge packages | [dsh-kb-sieve](https://github.com/omdsh-dev/dsh-kb-sieve) | Assemble auditable knowledge-base packages from references and SQL. |
| Community catalog mirror | [fendouai/awesome-deepseek-harness](https://github.com/fendouai/awesome-deepseek-harness) | Bilingual directory with live link checks, machine-readable registries, and weekly trending refreshes. |

These entries are pointers for further reading, not a recommendation to install everything together. Combining context, memory, routing, and background-agent plugins can change prompt size, cost, and authority boundaries in ways that are hard to see from a marketplace description.

## High-signal community projects

The upstream catalog is not the only discovery surface. These public projects currently have meaningful community attention and are useful starting points for an Agent builder. Popularity is only a discovery signal; inspect the repository, release history, permissions, and install contract yourself.

| Focus | Resource | What to verify |
|---|---|---|
| Community plugin catalog | [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) | Whether each listing is current, public, and compatible with your DSH revision. |
| Context observability | [dsh-context](https://github.com/bowenliang123/dsh-context) | Token accounting, compression events, and data kept outside the session. |
| Mobile access | [dsh-pocket](https://github.com/shaobeichen/dsh-pocket) | LAN/public exposure, authentication, and session privacy when accessing DSH from a phone. |
| Vision bridge | [modlens](https://github.com/liustack/modlens) | Image upload path, external endpoints, and structured-output guarantees. |
| Agent teams | [dsh-agent-teams](https://github.com/NanmiCoder/dsh-agent-teams) | Child-agent authority, shared workspace behavior, and cancellation semantics. |
| Vision routing | [dsh-vision-router](https://github.com/ysr666/dsh-vision-router) | Provider fallback, key handling, and whether image turns remain auditable. |
| Community field guide | [DeepSeek Harness Orange Book](https://github.com/alchaincyf/deepseek-harness-orange-book) | Which observations are version-pinned experiments versus informal advice. |
| Workflow assembly | [dsh-equip-engine](https://github.com/wuykjl/dsh-equip-engine) | Plugin selection signals for synergy, conflicts, cost, and trust. |
| Skill migration | [dsh-skill-mover](https://github.com/mjylfz/dsh-skill-mover) | Cross-Agent skill discovery, deduplication, and rollback behavior. |
| Research intake | [dsh-hacker-news](https://github.com/heartleo/hn-cli/tree/main/plugins/hacker-news) | Feed, thread, search, and profile boundaries before adding live research context. |
| Session replay | [dsh-replay](https://github.com/zoahdev/dsh-replay) | Trajectory replay and diff behavior for debugging and review. |
| Desktop lifecycle | [dsh-tray](https://github.com/liulifu/dsh-tray) | Restart, multi-profile binding, recovery snapshots, and plugin-failure containment. |
| Local-first desktop feedback | [dsh-whale-musume](https://github.com/Sutera-Diffusus/dsh-whale-musume) | Work-state feedback and telemetry boundaries for a DSH Web desktop pet. |
| Session corruption repair | [dsh-corrupt-session-repair](https://github.com/MedicineKing/dsh-corrupt-session-repair) | Zero-install scanner, deterministic corpus, and repair evidence for crash-recovery sequence corruption; keep real logs private. |
| Codex-style Web UI | [dsh-codex-ui](https://github.com/MichengAI/dsh-codex-ui) | Public DSH Web extension points for workspace/session navigation, search, and turn orientation; verify compatibility before installing. |
| Nested follow-ups | [dsh-nested-followups](https://github.com/sluminositys/dsh-nested-followups) | Recursively isolated child Sessions for side questions; verify ancestry, tool scope, and no cross-branch writes. |

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

## Keep the map fresh without making it a trust list

Treat resource curation as a small release loop. Pin the upstream commit, diff names and URLs against the previous snapshot, and record why each new entry belongs to a capability. Run link checks, inspect each repository's manifest and recent activity, and publish the JSON map only after the checks pass. If a repository disappears, changes ownership, or becomes inactive, keep the old commit addressable but mark the entry as historical rather than silently replacing it. This preserves reproducibility while still giving Agents a current discovery surface.

For an automated consumer, cache the snapshot and compare `snapshot` before refreshing. A changed snapshot is a signal to re-audit—not permission to install new packages. Keep installation, network, and rollback evidence in the consuming project's own record.

## Source and boundary

- [Awesome DeepSeek Harness README](https://github.com/0xsline/awesome-deepseek-harness/blob/main/README.md)
- [Awesome DeepSeek Harness full catalog](https://github.com/0xsline/awesome-deepseek-harness/blob/main/CATALOG.md)
- [Community plugin audit guide](../security/community-plugin-audit.md)
- [Tool execution pipeline](../architecture/tool-execution-pipeline.md)
