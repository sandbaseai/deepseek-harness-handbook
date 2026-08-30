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
