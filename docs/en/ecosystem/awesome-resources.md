---
title: DeepSeek Harness Ecosystem Resources, Curated by Capability
locale: en
content_revision: 22
status: canonical
verified_at: 2026-08-29
sources:
  - https://github.com/0xsline/awesome-deepseek-harness/blob/main/CATALOG.md
  - https://github.com/0xsline/awesome-deepseek-harness/blob/main/README.md
---

# DeepSeek Harness resources, curated by capability

The [Awesome DeepSeek Harness](https://github.com/0xsline/awesome-deepseek-harness) project maintains a large public index assembled from the DSH external hub and the `dsh-plugin` topic. This page is a smaller Agent-first map: it selects representative resources by the problem they solve, then routes you to the upstream project for installation and current compatibility.

The source index is licensed CC0. The descriptions below are concise editorial summaries, not endorsements or security reviews. Verify each repository's `package.json`, `dsh.bundle` manifest, permissions, release activity, and source before installing it into a real profile.

## A five-minute catalog audit

Treat an entry as a lead for an Agent experiment, not as an install command. Before loading a resource, capture the pinned catalog snapshot and repository commit, then answer five questions: what process owns the code, which files or Sessions can it read, which network destinations can it reach, which provider credentials can it use, and how do you remove it without losing the profile? A useful first pass is read-only: inspect the manifest, package scripts, lockfile, build hooks, and documented permissions without executing lifecycle scripts.

For a disposable profile, record the baseline (`node --version`, DSH version, enabled bundles, and a redacted environment summary), install only one candidate, and run one bounded task. Compare loaded modules, child processes, filesystem writes, outbound hosts, token usage, and Session mutations against the baseline. Keep the evidence digest beside the experiment. If the resource changes routing, memory, or approval behavior, require an explicit before/after review rather than accepting a successful demo as proof of compatibility.

Use this decision rule when an entry is ambiguous: **catalog-only** means link discovery is useful but repository visibility or installability still needs proof; **source-linked** means the URL and purpose were checked, not that the package is safe; **validated in your profile** means you reproduced the behavior with a pinned revision and recorded rollback evidence. The JSON index preserves the first two states; your local experiment log should be the authority for the third.

### Copyable evidence template

```text
candidate: <owner/repository>@<commit>
profile: <disposable profile path>
baseline: DSH <version>; bundles=<list>; node=<version>
permissions: files=<allowlist>; network=<hosts>; credentials=<none or named scope>
task: <one bounded prompt and expected artifact>
observed: modules=<...>; writes=<...>; children=<...>; requests=<...>; tokens=<...>
rollback: disable/uninstall command=<...>; profile restored=<yes/no>; evidence=<digest or log path>
decision: catalog-only | source-linked | validated in this profile
```

Keeping this record next to the Session evidence makes a later upgrade comparable: rerun the same task against the new commit, diff the permission and network fields first, then inspect output quality. If any field is unknown, leave the decision at `source-linked` instead of silently promoting it.

## Start with discovery and authoring

| Capability | Resource | Why it is useful |
|---|---|---|
| Plugin development | [dsh-plugin-dev](https://github.com/dsh-external/dsh-plugin-dev) | Field notes and skills for Cordis composition, TypeScript setup, Windows junctions, and persistence pitfalls. |
| Plugin authoring skills | [dsh-plugin-skills](https://github.com/dsh-external/dsh-plugin-skills) | Skills for building and testing DeepSeek Harness plugins. |
| Plugin evolution | [dsh-evolve](https://github.com/william-jin-cmu/dsh-evolve) | Experiments with auditable Agent self-evolution; keep mutations versioned, reviewable, and reversible. |
| Plugin composition examples | [dsh-cordis-rocks (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/07278233cba25e6f2d011018751187b7a4d8ed52/CATALOG.md) | The upstream catalog records runnable Cordis tutorials; verify current repository visibility before installing. |
| Find installed/public plugins | [dsh-find-plugins](https://github.com/Nagi-ovo/dsh-find-plugins) | Finds, installs, and verifies GitHub plugins from an Agent workflow; inspect install commands and trust boundaries first. |
| Context cost audit | [dsh-context-doctor](https://github.com/Zhenyu98/dsh-context-doctor) | Measures instruction, skill-catalog, and tool-schema token cost and reports duplication or conflicts. |
| Plugin manifest checks | [dsh-plugin-check](https://github.com/dsh-external/dsh-plugin-check) | Performs read-only checks of plugin manifests, patch shape, build traps, and hub status. |
| Data analysis | [dsh-data-agent](https://github.com/omdsh-dev/dsh-data-agent) | Connects DSH to databases for conversational analysis; constrain credentials, SQL scope, and result exfiltration before use. |
| Adversarial workflow review | [dsh-inspect](https://github.com/omdsh-dev/dsh-inspect) | Runs a checkup → fix → review loop on the official workflow engine with an explicit verification pass. |
| Bilingual plugin directory | [Awesome-DeepSeek-Harness-Plugins](https://github.com/Zhiyuan-Fan/Awesome-DeepSeek-Harness-Plugins) | Browse plugins, extensions, tools, skills, clients, runtimes, and integrations in English and Chinese before selecting a candidate. |

Use discovery tools as indexes, not trust oracles. A listing is not proof that a package is safe, maintained, compatible with your release, or appropriate for a production profile.

## Memory, sessions, and recovery

| Capability | Resource | Why it is useful |
|---|---|---|
| Session repair | [dsh-session-repair-skill (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/07278233cba25e6f2d011018751187b7a4d8ed52/CATALOG.md) | The catalog records a read-first repair workflow; verify current repository visibility before installing. |
| Session health | [dsh-session-health](https://github.com/dsh-external/dsh-session-health) | Scans multi-frame Zstandard Session files for torn, empty, or corrupt artifacts. |
| Cross-session memory | [dsh-memory (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/07278233cba25e6f2d011018751187b7a4d8ed52/CATALOG.md) | The catalog records a long-term memory plugin; verify current repository visibility and prompt-injection boundaries first. |
| Cross-agent memory | [zilliztech/memsearch](https://github.com/zilliztech/memsearch) | Provides a DSH plugin and shared memory layer alongside other coding agents. |
| Session branching | [dsh-rewind](https://github.com/dsh-external/dsh-rewind) | Folds exploration after a checkpoint into a report while retaining the complete log. |
| Profile backup and recovery | [dsh-backup](https://github.com/xiaoyuyu6420/dsh-backup) | Captures upgrade snapshots, repairs session logs, redacts credentials, and supports restore before risky profile changes. |
| Cross-tool Session import | [dsh-session-hub (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/07278233cba25e6f2d011018751187b7a4d8ed52/CATALOG.md) | The catalog records cross-tool history import; verify current repository visibility before installing. |

Memory and repair tools can read sensitive prompts, tool output, and credentials. Test against a copied profile, keep an evidence digest, and confirm whether a command mutates the source before use. See the [Session log storage format](../reference/session-log-storage-format.md) guide for packed rows and version boundaries.

## Execution, routing, and research

| Capability | Resource | Why it is useful |
|---|---|---|
| Plan/execute routing | [dsh-plan-execute (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/07278233cba25e6f2d011018751187b7a4d8ed52/CATALOG.md) | The catalog records separate planning and execution models; verify current repository visibility before installing. |
| Deep research workflow | [dsh-deep-research](https://github.com/dsh-external/dsh-deep-research) | Provides an adaptive research orchestration workflow. |
| LLM fallback policy | [dsh-llm-fallbacks](https://github.com/dsh-external/dsh-llm-fallbacks) | Applies role-based retry and fallback policy; verify cost and retry limits. |
| Agent-to-agent routing | [DSH-Subagent-Model-Router](https://github.com/CypherNaught-0x/DSH-Subagent-Model-Router) | Routes delegated work to configured models and exposes join/wait behavior. |
| Agent budget guard | [dsh-agent-budget](https://github.com/vibeinging/dsh-agent-budget) | Adds an Agent-tree token budget boundary; verify descendant, retry, and provider accounting before relying on the limit. |
| Provider fallback policy | [dsh-llm-fallbacks](https://github.com/omdsh-dev/dsh-llm-fallbacks) | Applies role-aware provider fallback policy; bound retries, spend, and data-routing changes before enabling it. |
| GitHub credential bridge | [dsh-gh-bridge (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/07278233cba25e6f2d011018751187b7a4d8ed52/CATALOG.md) | The catalog records a Keychain bridge; verify current repository visibility and audit secret scope carefully. |

Routing and fallback plugins can multiply provider calls. Establish a bounded budget, log the selected model and retry count, and keep approval and sandbox policy outside the plugin's marketing description.

## UI, files, and external tools

| Capability | Resource | Why it is useful |
|---|---|---|
| Browser panel | [dsh-browser-panel (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/07278233cba25e6f2d011018751187b7a4d8ed52/CATALOG.md) | The catalog records a visible browser panel; verify current repository visibility before installing. |
| Office files | [dsh-office (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/07278233cba25e6f2d011018751187b7a4d8ed52/CATALOG.md) | The catalog records an Office-file workflow; verify current repository visibility before installing. |
| Design workflows | [dsh-design (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/07278233cba25e6f2d011018751187b7a4d8ed52/CATALOG.md) | The catalog records design-agent workflows; verify current repository visibility before installing. |
| Cross-agent history | [dsh-chat-import](https://github.com/Nwflower/dsh-chat-import) | Imports histories from multiple coding agents as resumable DSH Sessions. |
| Translation | [dsh-plugin-translation](https://github.com/863683348/dsh-plugin-translation) | Adds segmented translation, glossary extraction, QA, and translation memory. |
| Mobile access | [dsh-mobile](https://github.com/lehhair/dsh-mobile) | Adds mobile access to a running DSH surface; verify authentication, network exposure, and read-only defaults. |
| ACP provider bridge | [dsh-paseo](https://github.com/renat3u/dsh-paseo) | Bridges DSH to Paseo for parallel Agent runs; verify external process and credential boundaries. |
| Pi bridge | [dsh-pi-adapter (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/07278233cba25e6f2d011018751187b7a4d8ed52/CATALOG.md) | The catalog records a Pi bridge; verify current repository visibility before installing. |
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
| Model gateway tiering | [lynkr-dsh-plugin](https://github.com/veerareddyvishal144/lynkr-dsh-plugin) | Route DSH requests through a self-hosted difficulty-aware gateway; verify provider credentials, fallback policy, and spend limits before enabling it. |
| Context compression | [dsh-context-compressor](https://github.com/qwert702/dsh-context-compressor) | Reduce tool/history payloads for small models while keeping a resumable task flow. |
| Web search routing | [dsh-web-search-pro](https://github.com/anweat/dsh-web-search-pro) | Route multi-engine and platform search through extraction, caching, and browser rendering. |
| Cross-agent checkpoints | [task-passport](https://github.com/dongsheng123132/task-passport) | Carry machine-readable task state across multiple coding-agent runtimes. |
| Continuous evolution | [dsh-continual-evolve](https://github.com/ZK-Andy/dsh-continual-evolve) | Refine prompts, memories, skills, and subagent specs with versioning and rollback. |
| Knowledge packages | [dsh-kb-sieve](https://github.com/omdsh-dev/dsh-kb-sieve) | Assemble auditable knowledge-base packages from references and SQL. |
| Community catalog mirror | [fendouai/awesome-deepseek-harness](https://github.com/fendouai/awesome-deepseek-harness) | Bilingual directory with live link checks, machine-readable registries, and weekly trending refreshes. |

These entries are pointers for further reading, not a recommendation to install everything together. Combining context, memory, routing, and background-agent plugins can change prompt size, cost, and authority boundaries in ways that are hard to see from a marketplace description.

### Five additions from the latest catalog sweep

The machine-readable index now includes five additional hub projects that make the Agent control loop easier to inspect:

| Capability | Resource | Agent boundary to test |
|---|---|---|
| Code intelligence | [dsh-code-map](https://github.com/dsh-external/dsh-code-map) | Confirm symbol indexing stays inside the workspace and does not silently upload source. |
| Progressive tools | [dsh-tool-search](https://github.com/dsh-external/dsh-tool-search) | Measure prompt-size reduction and verify undisclosed tools cannot be invoked implicitly. |
| Session health | [dsh-session-health](https://github.com/dsh-external/dsh-session-health) | Run the scanner read-only against a copied profile before attempting repair. |
| Vision bridge | [dsh-vision-toolkit](https://github.com/dsh-external/dsh-vision-toolkit) | Check image retention, provider routing, and structured evidence for every image turn. |
| Workflow visualization | [dsh-web-workflow-visualizer](https://github.com/dsh-external/dsh-web-workflow-visualizer) | Review generated workflow scripts and approval gates before enabling mutations. |

These five are source-linked discovery leads, not compatibility claims. The [JSON index](https://sandbaseai.github.io/deepseek-harness-handbook/awesome-deepseek-harness-resources.json) is the canonical count and link surface for Agents.

### Session composition and operator surfaces

The latest upstream catalog also contains several building blocks for making Agent work observable and reversible. Four are currently catalog-only pointers: the repository may be private, renamed, or unavailable even though the pinned catalog records it.

| Capability | Resource | Agent boundary to test |
|---|---|---|
| Exploration checkpoints | [dsh-checkpoint (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/07278233cba25e6f2d011018751187b7a4d8ed52/CATALOG.md) | Confirm a checkpoint is metadata only and does not rewrite the source Session. |
| Context rewind | [dsh-rewind](https://github.com/dpskh/dsh-rewind) | Verify the report is reproducible and the complete log remains recoverable. |
| Cross-tool search | [dsh-session-search (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/07278233cba25e6f2d011018751187b7a4d8ed52/CATALOG.md) | Check which local Session roots are read and whether indexes persist prompt content. |
| Side Sessions | [dsh-sidechain](https://github.com/omdsh-dev/dsh-sidechain) | Test that /side and /btw cannot silently write to the parent task. |
| Child-Agent visibility | [dsh-subagent-tree (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/07278233cba25e6f2d011018751187b7a4d8ed52/CATALOG.md) | Inspect delegation depth, cancellation, and branch ownership in the workspace. |
| Visible browser actions | [dsh-browser-panel (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/07278233cba25e6f2d011018751187b7a4d8ed52/CATALOG.md) | Record navigation, downloads, and credentials before allowing browser writes. |
| Office artifacts | [dsh-office (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/07278233cba25e6f2d011018751187b7a4d8ed52/CATALOG.md) | Keep document paths, conversion tools, and output retention explicit. |
| Cordis learning examples | [dsh-cordis-examples (catalog snapshot)](https://github.com/0xsline/awesome-deepseek-harness/blob/07278233cba25e6f2d011018751187b7a4d8ed52/CATALOG.md) | Start from minimal lifecycle/tool examples before adding authority-bearing hooks. |

These additions expand discovery coverage; they do not change the handbook's compatibility policy. Use the `availability` field in the JSON index to distinguish a checked repository from a catalog-only lead.

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
| Agent tracing | [Braintrust DeepSeek Harness plugin](https://www.braintrust.dev/docs/integrations/agent-frameworks/deepseek-harness) | Traces user turns, LLM steps, tool calls, and child Sessions; verify API-key scope and data residency before enabling it. |
| Live voice preview | [dsh-live-voice](https://github.com/Jstn-1g/dsh-live-voice) | Consent-bound manual Qwen audio turns; verify recording gesture, destination disclosure, transcript promotion, and teardown before any credential-backed test. |
| Desktop lifecycle | [dsh-tray](https://github.com/liulifu/dsh-tray) | Restart, multi-profile binding, recovery snapshots, and plugin-failure containment. |
| Local-first desktop feedback | [dsh-whale-musume](https://github.com/Sutera-Diffusus/dsh-whale-musume) | Work-state feedback and telemetry boundaries for a DSH Web desktop pet. |
| Session corruption repair | [dsh-corrupt-session-repair](https://github.com/MedicineKing/dsh-corrupt-session-repair) | Zero-install scanner, deterministic corpus, and repair evidence for crash-recovery sequence corruption; keep real logs private. |
| Codex-style Web UI | [dsh-codex-ui](https://github.com/MichengAI/dsh-codex-ui) | Public DSH Web extension points for workspace/session navigation, search, and turn orientation; verify compatibility before installing. |
| Nested follow-ups | [dsh-nested-followups](https://github.com/sluminositys/dsh-nested-followups) | Recursively isolated child Sessions for side questions; verify ancestry, tool scope, and no cross-branch writes. |
| Launch diagnosis | [dsh-launch-doctor](https://github.com/Shizuku-keop/dsh-launch-doctor) | Zero-dependency checks for Node resolver shape, `__DSH_BOOT__`, preload tags, and `/plugins`; inspect source and token handling before automation. |

## Additional picks from the community catalog

The upstream README also highlights smaller projects that are useful when an Agent workflow needs a clear operational boundary. These are source-backed pointers; the links were checked on 2026-08-29.

| Focus | Resource | Why it belongs in an Agent workflow |
|---|---|---|
| Operations and recovery | [dsh-harness-ops](https://github.com/fakechris/dsh-harness-ops) | Packages snapshot rotation, self-healing web startup, and interrupted-session continuation so recovery is observable instead of an ad-hoc restart. |
| Agent-to-agent routing | [dsh-routed-subagent](https://github.com/bpc-oss/dsh-routed-subagent) | Mounts a bounded child run on a selected preset with model/provider overrides and continuable background jobs. |
| Session workflow | [dsh-track](https://github.com/fakechris/dsh-track) | Keeps decisions, captured ideas, and task state in an evidence-oriented lifecycle that an Agent can query. |
| Persistent squads | [dsh-kirocrew](https://github.com/zoahdev/dsh-kirocrew) | Bridges a DSH Agent to a persistent development workspace over ACP, making the external boundary explicit. |
| Commander workflow | [dsh-commander](https://github.com/qwert702/dsh-commander) | Separates planning from execution by turning structured task blocks into explicit actions in the Web UI. |
| Parallel evaluation | [dsh-kimicode-swarm](https://github.com/hongyue0721/dsh-kimicode-swarm) | Dispatches independent subtasks with bounded concurrency, live progress, and resumable Agent IDs. |

Before installing any of these, inspect the repository's manifest, permissions, model-routing defaults, and teardown path. A catalog entry is a discovery lead, not a compatibility or security guarantee.

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
- [Upstream Braintrust plugin announcement #4960](https://github.com/deepseek-ai/deepseek-harness/discussions/4960)
- [Upstream DSH Live Voice preview #4958](https://github.com/deepseek-ai/deepseek-harness/discussions/4958)
