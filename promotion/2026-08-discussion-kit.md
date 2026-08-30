# Discussion and Show & Tell promotion kit — 2026-08

This is a ready-to-publish draft for the next authenticated GitHub distribution
run. It is intentionally answer-first: publish only where the question or
topic matches, and keep the handbook link as the supporting artifact.

## Post A — MCP versus webMCP

**Title:** MCP and webMCP are different control planes in DeepSeek Harness

**Body:**

If a tool works in a local profile but not in the Web client, first identify
which MCP boundary you are testing. A stdio/HTTP MCP server is composed by the
Host; webMCP is exposed through the browser/client surface. A successful
server handshake does not prove that the browser has the same tool view,
origin, approval policy, or credential scope.

The practical check is to capture the resolved profile, Host tool inventory,
browser origin, and one sanitized tool-call event separately. Keep the first
probe read-only, then test approval and teardown. The handbook runbook has the
boundary table and failure branches: <https://sandbaseai.github.io/deepseek-harness-handbook/deepseek-harness-mcp.html>

Verified against DeepSeek Harness rc.2 (`b150a551`) on 2026-08-29. This is an
independent community guide, not an official DeepSeek AI announcement.

## Post B — Install success is not runtime success

**Title:** `npm install` can succeed while a DeepSeek Harness plugin still cannot boot

**Body:**

When a plugin is present in the profile but the Host exits with
`ERR_MODULE_NOT_FOUND`, separate three facts: the package was materialized,
the bundle was composed, and the declared runtime export exists. `--ignore-scripts`
can turn a visible build failure into a missing `dist/` artifact; it cannot
create the export.

The bounded recovery is to remove the plugin from a disposable profile, dump
the resolved composition, inspect the package export, and boot again. The
source-backed runbook records expected evidence and rollback:
<https://sandbaseai.github.io/deepseek-harness-handbook/git-plugin-missing-dist.html>

Verified against `99f6f02` on 2026-08-20. Community-maintained and independent
of DeepSeek AI.

## Post C — A useful contribution request

**Title:** Help validate one Agent-runtime failure boundary

**Body:**

The DeepSeek Harness Handbook is looking for small, reproducible corrections:
an exact command, a missing failure branch, or a fluent translation review.
Each guide pins the upstream revision and separates observed behavior from
inference. If a page differs from your runtime, please report the exact
version, operating system, first failing boundary, sanitized evidence, and
rollback result.

Start with the contribution contract:
<https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/CONTRIBUTING.md>

The project is an independent community handbook maintained by SandBase; it
does not speak for DeepSeek AI.

## Publishing and measurement

- Publish at most one of these to a given venue in a 7-day window.
- Use the exact guide URL; do not lead with a generic Star request.
- Record venue, URL, UTC timestamp, guide URL, and baseline Stars before posting.
- Recheck at 24 hours and 7 days: unique visitors, referrer, Stars, forks,
  issues, and substantive replies.
- Do not count a Star as campaign-attributed without a matching referrer or
  an explicit contributor report.

## Published evidence

- Venue: official `deepseek-ai/deepseek-harness` Discussion #4862
- Topic: filesystem tools treating HTTP(S) URLs as local paths
- Reply: <https://github.com/deepseek-ai/deepseek-harness/discussions/4862#discussioncomment-18202617>
- Published: 2026-08-30T00:34:00Z (UTC)
- Handbook URL used: <https://sandbaseai.github.io/deepseek-harness-handbook/filesystem-url-as-path.html>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `dsh-market/dsh-market` issue #404
- Topic: pre-install host compatibility checks for `engines.dsh`, capability probing for the Remote/session RPC, and recoverable plugin updates
- Reply: <https://github.com/dsh-market/dsh-market/issues/404#issuecomment-5466042981>
- Published: 2026-08-30T01:39:57Z (UTC)
- Handbook URLs used: <https://sandbaseai.github.io/deepseek-harness-handbook/plugin-peer-dependency-warnings.html>, <https://sandbaseai.github.io/deepseek-harness-handbook/upgrade-and-rollback.html>
- Baseline at publish: 88 Stars, 13 forks

- Venue: `0xsline/awesome-deepseek-harness` issue #529
- Topic: community plugin catalog evidence, package integrity, capability/permission scope, and non-endorsement labeling
- Reply: <https://github.com/0xsline/awesome-deepseek-harness/issues/529#issuecomment-5466026216>
- Published: 2026-08-30T01:36:11Z (UTC)
- Handbook URL used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/ecosystem/awesome-resources.md>
- Baseline at publish: 88 Stars, 13 forks

- Venue: `BreakfastDaPaiDang/saki` issue #71
- Topic: DSH upstream pin synchronization, semantic conflict classification, cross-platform/runtime gates, and rollback
- Reply: <https://github.com/BreakfastDaPaiDang/saki/issues/71#issuecomment-5466031596>
- Published: 2026-08-30T01:37:31Z (UTC)
- Handbook URLs used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/reference/version-evidence.md>, <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/getting-started/upgrade-and-rollback.md>
- Baseline at publish: 88 Stars, 13 forks

- Venue: `mintgao/dsh-desktop` issue #25
- Topic: alpha.1 Desktop adoption failures, package-graph/build-stage classification, clean-profile smoke, and rollback
- Reply: <https://github.com/mintgao/dsh-desktop/issues/25#issuecomment-5466021427>
- Published: 2026-08-30T01:34:57Z (UTC)
- Handbook URL used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/getting-started/upgrade-and-rollback.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `CherryHQ/cherry-studio` issue #18802
- Topic: DSH runtime adapter conformance, runtime generations, event projection, Snapshot/replay, and transport-neutral Agent protocol
- Reply: <https://github.com/CherryHQ/cherry-studio/issues/18802#issuecomment-5466016304>
- Published: 2026-08-30T01:33:42Z (UTC)
- Handbook URLs used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/architecture/agent-lifecycle.md>, <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/integrations/acp-editor-boundary.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `Qinling-Melon-Farmers/dsh-memoir` issue #8
- Topic: multilingual agent-facing strings, prompt/schema provenance, memory-language preservation, and reversible locale rollout
- Reply: <https://github.com/Qinling-Melon-Farmers/dsh-memoir/issues/8#issuecomment-5466010541>
- Published: 2026-08-30T01:32:14Z (UTC)
- Handbook URL used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/architecture/prompt-assembly-provenance.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `alondero/buildmesh` issue #1364
- Topic: DSH Agent lifecycle correlation, completion versus input-required semantics, signal health, and cross-client deduplication
- Reply: <https://github.com/alondero/buildmesh/issues/1364#issuecomment-5466005054>
- Published: 2026-08-30T01:30:52Z (UTC)
- Handbook URL used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/architecture/agent-lifecycle.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `omdsh-dev/dsh-accessibility` issue #7
- Topic: alpha.1 accessibility candidate provenance, real-AT versus automation gates, remaining-surface ledger, and rollback
- Reply: <https://github.com/omdsh-dev/dsh-accessibility/issues/7#issuecomment-5466001181>
- Published: 2026-08-30T01:29:52Z (UTC)
- Handbook URL used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/security/community-plugin-audit.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `marius-patrik/dsh-stack` issue #163
- Topic: pinned DSH submodule upgrade, coherent package graph, plugin compatibility, and rollback receipts
- Reply: <https://github.com/marius-patrik/dsh-stack/issues/163#issuecomment-5465996680>
- Published: 2026-08-30T01:28:39Z (UTC)
- Handbook URL used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/getting-started/upgrade-and-rollback.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `xmanrui/dsh-im` issue #82
- Topic: DSH alpha.1 plugin API drift (`apiProxy`/`listDirectory`), package-graph compatibility, and recovery-mode rollback
- Reply: <https://github.com/xmanrui/dsh-im/issues/82#issuecomment-5465992666>
- Published: 2026-08-30T01:27:36Z (UTC)
- Handbook URLs used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/troubleshooting/plugin-install-recovery.md>, <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/getting-started/upgrade-and-rollback.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `sakibsadmanshajib/hive` issue #1262
- Topic: MCP config delivery versus runtime consumption, tenant/Session isolation, and observable launch receipts
- Reply: <https://github.com/sakibsadmanshajib/hive/issues/1262#issuecomment-5465987865>
- Published: 2026-08-30T01:26:21Z (UTC)
- Handbook URL used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/integrations/mcp.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `google/gvisor` issue #14145
- Topic: gVisor/runsc as a DSH sandbox backend, separating tool admission from OCI enforcement and proving cleanup
- Reply: <https://github.com/google/gvisor/issues/14145#issuecomment-5465984067>
- Published: 2026-08-30T01:25:23Z (UTC)
- Handbook URLs used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/troubleshooting/sandbox-denied-vs-unavailable.md>, <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/security/workspace-write-shared-cache.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `Rxiain/dsh-openviking` issue #3
- Topic: SettingsScope runtime capability drift, mixed package graphs, Client plugin isolation, and rollback
- Reply: <https://github.com/Rxiain/dsh-openviking/issues/3#issuecomment-5465979469>
- Published: 2026-08-30T01:24:16Z (UTC)
- Handbook URL used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/troubleshooting/plugin-install-recovery.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `Jstn-1g/dsh-live-voice` issue #20
- Topic: served-Web versus `file://` + IPC voice carrier boundaries, bounded duplex receipts, and teardown evidence
- Reply: <https://github.com/Jstn-1g/dsh-live-voice/issues/20#issuecomment-5465975273>
- Published: 2026-08-30T01:23:12Z (UTC)
- Handbook URL used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/reference/official-project-identity.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: official `deepseek-ai/deepseek-harness` Discussion #5060
- Topic: portable community distribution provenance, embedded runtime identity, state migration, and rollback evidence
- Reply: <https://github.com/deepseek-ai/deepseek-harness/discussions/5060#discussioncomment-18202817>
- Published: 2026-08-30T01:22:00Z (UTC)
- Handbook URLs used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/reference/official-project-identity.md>, <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/getting-started/upgrade-and-rollback.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: official `deepseek-ai/deepseek-harness` Discussion #5031
- Topic: Session-local composer history, draft versus durable prompt boundaries, and IME/shortcut safety
- Reply: <https://github.com/deepseek-ai/deepseek-harness/discussions/5031#discussioncomment-18202812>
- Published: 2026-08-30T01:20:56Z (UTC)
- Handbook URLs used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/troubleshooting/web-ime-composition.md>, <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/troubleshooting/prompt-accepted-before-durable.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: official `deepseek-ai/deepseek-harness` Discussion #1676
- Topic: Windows Store PowerShell discovery, inherited PATH, alias version drift, and spawn ENOENT evidence
- Reply: <https://github.com/deepseek-ai/deepseek-harness/discussions/1676#discussioncomment-18202806>
- Published: 2026-08-30T01:19:54Z (UTC)
- Handbook URL used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/troubleshooting/windows-compatibility.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: official `deepseek-ai/deepseek-harness` Discussion #5067
- Topic: durable external plugin events, installed-package identity, and per-run Subagent workspace contracts
- Reply: <https://github.com/deepseek-ai/deepseek-harness/discussions/5067#discussioncomment-18202802>
- Published: 2026-08-30T01:18:33Z (UTC)
- Handbook URLs used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/plugin-development/custom-session-events.md>, <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/agent-patterns/subagents.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: official `deepseek-ai/deepseek-harness` Discussion #5051
- Topic: third-party provider reasoning-level capability declarations, profile persistence, and wire evidence
- Reply: <https://github.com/deepseek-ai/deepseek-harness/discussions/5051#discussioncomment-18202796>
- Published: 2026-08-30T01:16:55Z (UTC)
- Handbook URLs used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/getting-started/model-providers.md>, <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/guides/headless-reasoning-effort.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: official `deepseek-ai/deepseek-harness` Discussion #5052
- Topic: running-session Direct-Steer submission, newline behavior, draft preservation, and durable admission evidence
- Reply: <https://github.com/deepseek-ai/deepseek-harness/discussions/5052#discussioncomment-18202791>
- Published: 2026-08-30T01:15:56Z (UTC)
- Handbook URLs used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/troubleshooting/prompt-accepted-before-durable.md>, <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/troubleshooting/stuck-turn-stop-and-retry.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: official `deepseek-ai/deepseek-harness` Discussion #5053
- Topic: empty-session ARIA semantics, landmarks, keyboard behavior, and measured contrast evidence
- Reply: <https://github.com/deepseek-ai/deepseek-harness/discussions/5053#discussioncomment-18202787>
- Published: 2026-08-30T01:14:57Z (UTC)
- Handbook URL used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/troubleshooting/settings-plugin-nav-overflow.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: official `deepseek-ai/deepseek-harness` Discussion #5054
- Topic: Plan review Markdown/code-block rendering, composer slot isolation, and Web bundle identity
- Reply: <https://github.com/deepseek-ai/deepseek-harness/discussions/5054#discussioncomment-18202783>
- Published: 2026-08-30T01:13:57Z (UTC)
- Handbook URL used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/architecture/prompt-assembly-provenance.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: official `deepseek-ai/deepseek-harness` Discussion #5057
- Topic: Session archive versus trash/delete semantics, writer coordination, and lifecycle-safe UI actions
- Reply: <https://github.com/deepseek-ai/deepseek-harness/discussions/5057#discussioncomment-18202781>
- Published: 2026-08-30T01:13:02Z (UTC)
- Handbook URL used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/operations/session-archive-trash-delete.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: official `deepseek-ai/deepseek-harness` Discussion #5058
- Topic: phone-width sidebar drawer behavior, focus/accessibility, and overlay ownership boundaries
- Reply: <https://github.com/deepseek-ai/deepseek-harness/discussions/5058#discussioncomment-18202771>
- Published: 2026-08-30T01:12:04Z (UTC)
- Handbook URL used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/architecture/multi-session-presentation-contract.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: official `deepseek-ai/deepseek-harness` Discussion #5064
- Topic: null-origin `WorkerTunnel` URL resolution and separate WebView/IPC/auth boundaries
- Reply: <https://github.com/deepseek-ai/deepseek-harness/discussions/5064#discussioncomment-18202763>
- Published: 2026-08-30T01:10:55Z (UTC)
- Handbook URL used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/reference/official-project-identity.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `CZM1998/dsh_cot_gw_dyn` issue #1
- Topic: distinguish dynamic tool-surface changes from prompt-prefix cache invalidation
- Reply: <https://github.com/CZM1998/dsh_cot_gw_dyn/issues/1#issuecomment-5465916757>
- Published: 2026-08-30T01:09:06Z (UTC)
- Handbook URL used: <https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/architecture/prompt-assembly-provenance.md>
- Baseline at publish: 87 Stars, 13 forks

- Venue: official `deepseek-ai/deepseek-harness` Discussion #5059
- Topic: Session persistence writes rejected events and breaks search
- Reply: <https://github.com/deepseek-ai/deepseek-harness/discussions/5059#discussioncomment-18202619>
- Published: 2026-08-30T00:36:00Z (UTC)
- Handbook URL used: <https://sandbaseai.github.io/deepseek-harness-handbook/session-history-corruption-triage.html>
- Baseline at publish: 87 Stars, 13 forks

- Venue: official `deepseek-ai/deepseek-harness` Discussion #4425
- Topic: adding DSH session-source support to Agent Sessions
- Reply: <https://github.com/deepseek-ai/deepseek-harness/discussions/4425#discussioncomment-18202649>
- Published: 2026-08-30T00:45:00Z (UTC)
- Handbook URL used: <https://sandbaseai.github.io/deepseek-harness-handbook/deepseek-harness-session-log-format.html>
- Baseline at publish: 87 Stars, 13 forks

The reply documents the rc.8 storage boundary and explicitly states that it is
not evidence of a real DSH corpus or completed steward validation. The first
attempt was deleted because shell expansion removed inline identifiers; only
the corrected reply above is live.

- Venue: official `deepseek-ai/deepseek-harness` Discussion #5055
- Topic: fail-closed settings secret redaction and plugin audit boundaries
- Reply: <https://github.com/deepseek-ai/deepseek-harness/discussions/5055#discussioncomment-18202660>
- Published: 2026-08-30T00:50:00Z (UTC)
- Handbook URL used: <https://sandbaseai.github.io/deepseek-harness-handbook/deepseek-harness-plugin-audit.html>
- Baseline at publish: 87 Stars, 13 forks

Recheck the repository and referrer metrics at 24 hours and 7 days. Do not
claim this reply caused a Star without matching referrer or contributor
evidence.

## Distribution audit — 2026-08-30

- Current baseline: 87 Stars, 13 forks, 4 watchers.
- The primary `0xsline/awesome-deepseek-harness` list already contains the
  handbook in its curated section; no duplicate PR was opened.
- `sandbaseai/awesome-agent-runtime` also links the handbook beside the
  official runtime.
- The local checkout was fast-forwarded to remote `main` at
  `865dd36f2b9620ff813041ef6cbbddb0d0db8473`, which adds continuous-execution
  and promotion-handoff policy to `AGENTS.md`.
- `npm run check:links` completed successfully: 173 canonical pages, 202
  localized documents, 1080 external links checked. GitHub returned 403 for
  some external link probes, so those warnings are retained as verifier
  limitations rather than treated as link correctness proof.

- Venue: official `deepseek-ai/deepseek-harness` Discussion #5062
- Topic: Windows `link:` removal residue, `ERR_PNPM_EPERM`, and misleading build advice
- Reply: <https://github.com/deepseek-ai/deepseek-harness/discussions/5062#discussioncomment-18202678>
- Published: 2026-08-30T00:58:00Z (UTC)
- Handbook URL used: <https://sandbaseai.github.io/deepseek-harness-handbook/plugin-recovery.html>
- Baseline at publish: 87 Stars, 13 forks

- Venue: official `deepseek-ai/deepseek-harness` Discussion #5056
- Topic: cold Session UI follow stream versus durable history
- Reply: <https://github.com/deepseek-ai/deepseek-harness/discussions/5056#discussioncomment-18202682>
- Published: 2026-08-30T01:02:00Z (UTC)
- Handbook URL used: <https://sandbaseai.github.io/deepseek-harness-handbook/session-log-durability.html>
- Baseline at publish: 87 Stars, 13 forks

- Venue: official `deepseek-ai/deepseek-harness` Discussion #5063
- Topic: authenticated WebView embedding and native-shell trust boundaries
- Reply: <https://github.com/deepseek-ai/deepseek-harness/discussions/5063#discussioncomment-18202685>
- Published: 2026-08-30T01:07:00Z (UTC)
- Handbook URL used: <https://sandbaseai.github.io/deepseek-harness-handbook/official-deepseek-harness.html>
- Baseline at publish: 87 Stars, 13 forks

- Venue: official `deepseek-ai/deepseek-harness` Discussion #5065
- Topic: multiline active Goal editing and execution-boundary acceptance tests
- Reply: <https://github.com/deepseek-ai/deepseek-harness/discussions/5065#discussioncomment-18202692>
- Published: 2026-08-30T01:12:00Z (UTC)
- Handbook URL used: <https://sandbaseai.github.io/deepseek-harness-handbook/deepseek-harness-prompt-assembly-provenance.html>
- Baseline at publish: 87 Stars, 13 forks

- Venue: official `deepseek-ai/deepseek-harness` Discussion #5046
- Topic: persistent Bash history expansion, missing markers, and false 300-second hangs
- Reply: <https://github.com/deepseek-ai/deepseek-harness/discussions/5046#discussioncomment-18202695>
- Published: 2026-08-30T01:17:00Z (UTC)
- Handbook URL used: <https://sandbaseai.github.io/deepseek-harness-handbook/long-running-terminal.html>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `Arnon-hs/open-source` metadata issue #4
- Topic: refresh handbook catalog metadata
- Reply: <https://github.com/Arnon-hs/open-source/issues/4#issuecomment-5465858607>
- Published: 2026-08-30T00:55:28Z (UTC)
- Handbook URL used: <https://sandbaseai.github.io/deepseek-harness-handbook/llms.txt>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `Javis603/token-monitor` issue #497
- Topic: Windows DSH Desktop session-path discovery and token counting
- Reply: <https://github.com/Javis603/token-monitor/issues/497#issuecomment-5465863023>
- Published: 2026-08-30T00:56:33Z (UTC)
- Handbook URL used: <https://sandbaseai.github.io/deepseek-harness-handbook/deepseek-harness-session-log-format.html>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `getpaseo/paseo` issue #3590
- Topic: version-pinned DeepSeek Harness ACP provider catalog integration
- Reply: <https://github.com/getpaseo/paseo/issues/3590#issuecomment-5465866344>
- Published: 2026-08-30T00:57:24Z (UTC)
- Handbook URLs used: <https://sandbaseai.github.io/deepseek-harness-handbook/acp-editor-boundary.html>, <https://sandbaseai.github.io/deepseek-harness-handbook/acp-session-mcp.html>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `TIGER-AI-Lab/ClawBench` issue #309
- Topic: reproducible DeepSeek Harness benchmark adapter and smoke matrix
- Reply: <https://github.com/TIGER-AI-Lab/ClawBench/issues/309#issuecomment-5465869742>
- Published: 2026-08-30T00:58:18Z (UTC)
- Handbook URLs used: <https://sandbaseai.github.io/deepseek-harness-handbook/agent-harness-scorecard.html>, <https://sandbaseai.github.io/deepseek-harness-handbook/version-evidence.html>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `NVIDIA/NemoClaw` issue #9332
- Topic: candidate-only DSH state classification, snapshot consistency, and upgrade refusal
- Reply: <https://github.com/NVIDIA/NemoClaw/issues/9332#issuecomment-5465873542>
- Published: 2026-08-30T00:59:17Z (UTC)
- Handbook URLs used: <https://sandbaseai.github.io/deepseek-harness-handbook/session-log-durability.html>, <https://sandbaseai.github.io/deepseek-harness-handbook/version-evidence.html>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `rohitg00/agentmemory` issue #1208
- Topic: DSH adapter event ordering, memory/telemetry separation, and cleanup gates
- Reply: <https://github.com/rohitg00/agentmemory/issues/1208#issuecomment-5465878135>
- Published: 2026-08-30T01:00:20Z (UTC)
- Handbook URLs used: <https://sandbaseai.github.io/deepseek-harness-handbook/deepseek-harness-memory.html>, <https://sandbaseai.github.io/deepseek-harness-handbook/custom-session-events.html>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `wsz987/dsh-channels` issue #3
- Topic: post-release compatibility evidence for dsh-channels v0.5.0 and DSH rc.2
- Reply: <https://github.com/wsz987/dsh-channels/issues/3#issuecomment-5465882659>
- Published: 2026-08-30T01:01:15Z (UTC)
- Handbook URLs used: <https://sandbaseai.github.io/deepseek-harness-handbook/plugin-recovery.html>, <https://sandbaseai.github.io/deepseek-harness-handbook/version-evidence.html>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `MrPunyapal/laravel-auditor` issue #11
- Topic: DSH Skills discovery, MCP overlay scope, and installer rollback evidence
- Reply: <https://github.com/MrPunyapal/laravel-auditor/issues/11#issuecomment-5465888489>
- Published: 2026-08-30T01:02:19Z (UTC)
- Handbook URLs used: <https://sandbaseai.github.io/deepseek-harness-handbook/deepseek-harness-skills.html>, <https://sandbaseai.github.io/deepseek-harness-handbook/deepseek-harness-mcp.html>, <https://sandbaseai.github.io/deepseek-harness-handbook/plugin-recovery.html>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `alondero/buildmesh` issue #1123
- Topic: separate DSH harness, DeepSeek provider, Session, and API-account contracts
- Reply: <https://github.com/alondero/buildmesh/issues/1123#issuecomment-5465899728>
- Published: 2026-08-30T01:04:52Z (UTC)
- Handbook URLs used: <https://sandbaseai.github.io/deepseek-harness-handbook/official-deepseek-harness.html>, <https://sandbaseai.github.io/deepseek-harness-handbook/deepseek-harness-cli.html>, <https://sandbaseai.github.io/deepseek-harness-handbook/session-model-default.html>
- Baseline at publish: 87 Stars, 13 forks

- Venue: official `deepseek-ai/deepseek-harness` Discussion #5066
- Topic: missing pi-ai model artifact in an npx cache during profile boot
- Reply: <https://github.com/deepseek-ai/deepseek-harness/discussions/5066#discussioncomment-18202744>
- Published: 2026-08-30T01:09:00Z (UTC)
- Handbook URLs used: <https://sandbaseai.github.io/deepseek-harness-handbook/git-plugin-missing-dist.html>, <https://sandbaseai.github.io/deepseek-harness-handbook/corrupt-package-json-profile-boot.html>
- Baseline at publish: 87 Stars, 13 forks

- Venue: `Jstn-1g/dsh-live-voice` issue #19
- Topic: independently reproduced, source-pinned DSH alpha authentication smoke and immutable sanitized failure receipts
- Reply: <https://github.com/Jstn-1g/dsh-live-voice/issues/19#issuecomment-5466048505>
- Published: 2026-08-30T01:41:12Z (UTC)
- Handbook URLs used: <https://sandbaseai.github.io/deepseek-harness-handbook/version-evidence.html>, <https://sandbaseai.github.io/deepseek-harness-handbook/upgrade-and-rollback.html>
- Baseline at publish: 88 Stars, 13 forks

- Venue: `wingsky-1/dsh-plugin-hub` issue #348
- Topic: alpha.1 client i18n namespace/key manifests, listener disposal, locale-switch regression gates, and type-only dependency verification
- Reply: <https://github.com/wingsky-1/dsh-plugin-hub/issues/348#issuecomment-5466052696>
- Published: 2026-08-30T01:42:08Z (UTC)
- Handbook URL used: <https://sandbaseai.github.io/deepseek-harness-handbook/community-plugin-audit.html>
- Baseline at publish: 88 Stars, 13 forks

- Venue: `xmanrui/dsh-im` issue #85
- Topic: isolate Telegram long-poll and outbound API dispatchers, manage Agent lifecycle, and preserve uncertain-delivery semantics during retries
- Reply: <https://github.com/xmanrui/dsh-im/issues/85#issuecomment-5466057005>
- Published: 2026-08-30T01:43:08Z (UTC)
- Handbook URLs used: <https://sandbaseai.github.io/deepseek-harness-handbook/stuck-turn-stop-and-retry.html>, <https://sandbaseai.github.io/deepseek-harness-handbook/version-evidence.html>
- Baseline at publish: 88 Stars, 13 forks

- Venue: `Fishquito7/dsh-skill-mcp-panel` issue #10
- Topic: session capability adapters, explicit global-scope fallback, runtime schema checks, and unload/scope regression evidence
- Reply: <https://github.com/Fishquito7/dsh-skill-mcp-panel/issues/10#issuecomment-5466060450>
- Published: 2026-08-30T01:43:56Z (UTC)
- Handbook URLs used: <https://sandbaseai.github.io/deepseek-harness-handbook/plugin-install-recovery.html>, <https://sandbaseai.github.io/deepseek-harness-handbook/version-evidence.html>
- Baseline at publish: 88 Stars, 13 forks

- Venue: `wingsky-1/xiaozhuge` issue #156
- Topic: separate alpha.1 bundle-load and behavior gates, capability-based API adaptation, RPC acceptance evidence, and full package-graph rollback
- Reply: <https://github.com/wingsky-1/xiaozhuge/issues/156#issuecomment-5466064093>
- Published: 2026-08-30T01:44:45Z (UTC)
- Handbook URLs used: <https://sandbaseai.github.io/deepseek-harness-handbook/version-evidence.html>, <https://sandbaseai.github.io/deepseek-harness-handbook/plugin-install-recovery.html>
- Baseline at publish: 88 Stars, 13 forks

- Venue: `wenzetan/dsh-llm-newapi` issue #3
- Topic: split AggregateError into independent loader failures, verify runtime exports, isolate plugin boot impact, and gate cross-version provider compatibility
- Reply: <https://github.com/wenzetan/dsh-llm-newapi/issues/3#issuecomment-5466067989>
- Published: 2026-08-30T01:45:35Z (UTC)
- Handbook URLs used: <https://sandbaseai.github.io/deepseek-harness-handbook/plugin-peer-dependency-warnings.html>, <https://sandbaseai.github.io/deepseek-harness-handbook/plugin-install-recovery.html>, <https://sandbaseai.github.io/deepseek-harness-handbook/version-evidence.html>
- Baseline at publish: 88 Stars, 13 forks
