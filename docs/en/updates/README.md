---
title: DeepSeek Harness Updates and Breaking Changes
locale: en
content_revision: 4
status: canonical
verified_at: 2026-08-29
upstream_revision: cd5ef8148158c3a752a658978873241fdf8e2bbc
---

# DeepSeek Harness updates and breaking changes

This is the living desk for upstream changes that affect people building or operating Agents. It summarizes primary sources; it is not an official changelog.

## dsh-v0.1.2-alpha.1: Client-module rewrite and PTC rename

**Released upstream:** 2026-08-27 (GitHub tag only)
**Verified:** 2026-08-29
**Upstream revision:** `cd5ef8148158c3a752a658978873241fdf8e2bbc`
**Status:** confirmed from the official tag, the tagged source, and the community highlights in official Discussion [#4867](https://github.com/deepseek-ai/deepseek-harness/discussions/4867).

The alpha.1 tag is a developer-preview milestone, not an npm release: `release-publish.yml` is manual-only (`workflow_dispatch`) and never ran for this tag, npm still serves `0.1.1-rc.2`, and the GitHub prerelease carries no assets. Build from source or from the tag before treating npm metadata as current. The tag spans 1079 commits since rc.2 across 241 dsh-family packages.

### Breaking changes for operators and plugin authors

- **`code-mode` is renamed `PTC mode`.** Session-persistent vocabulary keeps the old name; historical `code` Sessions need the [resume path](../troubleshooting/historical-code-preset-resume.md).
- **Client module system rewritten.** `dsh-client-runtime` became `dsh-client-modules` (lazy-CJS module table); Sessions moved into `dsh-api-session-controller`, workspaces into `dsh-api-workspace-controller`. Web plugins that reached into the old module system must be rebuilt and retested.
- **`ApiProxy` retired in favor of Remote controllers.** Settings, directory picker, session-export download route, connection fetch routes, and browser control are Remote now. The RPC envelope changed: `POST /<channel>/<endpoint>` requires the `method` field to equal the URL endpoint (`bad-request` otherwise) and a bare channel path returns 404.
- **Session format migration.** A new format-migration decoder pipeline (including legacy compact events) and a per-Session `projection_cache.json` (per-record JSON storage layout, cold-read seeding, smaller storage, upstream [#3048](https://github.com/deepseek-ai/deepseek-harness/discussions/3048)) change what a Session directory contains.
- **One-shot token authentication.** `dsh web` prints `http://<host>:<port>/?token=...`; a request without the token returns 401 and with it 303, and the token is regenerated on every start. `--port 0` selects a random port and `--no-open` skips the browser.
- **DOM selectors changed.** `[data-pane="conversation"]`-style selectors no longer work; panels are reachable through the new layout classes. Client-side plugins that query the old pane attributes fail silently.
- **Windows native layer.** New `win32-process` primitives (handles / suspend / terminate); CI runs MSVC with failover-standby ABI probes.

### New capabilities

Agent Teams (experimental, Web and CLI profiles); SDK/ACP bundles (`sdk-minimal` standalone profile, ACP application bundle, ACP standard v1 automation controls, Python SDK now ships a Windows x64 `dsh` executable); GitHub-event webhooks that create workspace Sessions; subagent model selection (Codex/Claude Code provider models, child-model allowlist, SDK-carried routing, discovery off by default); one-shot web fetch approval (SSRF guard); headless reasoning progress on stderr; compaction pricing per route for image pressure; Lexical composer, optimistic submit echo tied to `rpcId`, and exact per-turn token usage in the Web UI; global CJK/Latin auto-spacing (`text-autospace`).

### Launch-window caution: Node 24.0–24.11.1

On Node `24.0`–`24.11.1` the Web UI fails to boot with `HTML did not preload @deepseek-ai/dsh-client-modules/client.js` and no server-side log: the loader tags every `major >= 24` as the v2 shape that only lands in Node `24.12.0`, the client-modules resolver calls the wrong shape, the TypeError is swallowed, and the client table comes out empty. See the [boot-failure guide](../troubleshooting/client-modules-html-did-not-preload.md) for the discriminator table and recovery. Community reports: [#4885](https://github.com/deepseek-ai/deepseek-harness/discussions/4885), [#4955](https://github.com/deepseek-ai/deepseek-harness/discussions/4955), [#4959](https://github.com/deepseek-ai/deepseek-harness/discussions/4959); source-verified fix proposal and real-machine verification in [#4968](https://github.com/deepseek-ai/deepseek-harness/discussions/4968); one-command diagnosis via dsh-launch-doctor ([#4970](https://github.com/deepseek-ai/deepseek-harness/discussions/4970)).

### Who is affected

Plugin authors and operators of the Web UI on Node `24.0`–`24.11.1` are affected before any migration. Plugin authors should also verify RPC envelope shape, panel selectors, and bundle identity against an isolated alpha.1 profile before upgrading a production profile; the community compatibility reminder in Discussion [#4867](https://github.com/deepseek-ai/deepseek-harness/discussions/4867) lists the runtime-tested behavior deltas. Do not clear model configuration, Sessions, or credentials when boot fails: this failure occurs before those surfaces are usable.

### Migration and verification

1. Pin the exact source revision `cd5ef8148158c3a752a658978873241fdf8e2bbc` (or the tag) and confirm the Node version is `>= 24.12` or `22`.
2. Keep the previous `0.1.1-rc.2` install intact as a rollback target (see [upgrade and rollback](../getting-started/upgrade-and-rollback.md)).
3. Launch Web on a disposable profile and confirm the printed `?token=` URL boots.
4. Verify RPC probes use `POST /<channel>/<endpoint>` with a matching `method` field.
5. Rebuild and retest web plugins against the new client-modules contract before installing them into the main profile.

**Primary sources:** [alpha.1 tag](https://github.com/deepseek-ai/deepseek-harness/tree/cd5ef8148158c3a752a658978873241fdf8e2bbc), [community highlights and compatibility reminder #4867](https://github.com/deepseek-ai/deepseek-harness/discussions/4867), [Node 24 loader-shape fix proposal #4968](https://github.com/deepseek-ai/deepseek-harness/discussions/4968), and [dsh-launch-doctor announcement #4970](https://github.com/deepseek-ai/deepseek-harness/discussions/4970).

## dsh-v0.1.1-rc.2: Files-backed image input

**Released upstream:** 2026-08-21
**Verified:** 2026-08-22
**Upstream revision:** `b150a551b8d465e31e418e1b2eaf5e79bbb7d28`
**Status:** confirmed from the official release, adapter README, Files API client, and adapter source.

The rc.2 release changes the image-input operating contract for the official `deepseek-official` route:

- the adapter can upload derived request-image bytes through the OpenAI-compatible `/files` endpoint and send `file_id` blocks;
- a scoped local index reuses valid uploads for the same endpoint, API-key scope, and request variant;
- if file resolution fails or times out, the adapter rebuilds the entire chat request with base64 data URLs rather than mixing representations;
- image normalization and request-level byte/count budgets bound what reaches the provider, with older images omitted first when limits are exceeded;
- stale-file responses permit one mapping recovery and chat retry, while repeated stale-file errors stop rather than loop.

### Who is affected

Operators using image-capable DeepSeek models or OpenAI-compatible gateways should verify both model metadata and endpoint behavior. An explicit `models` list must include `inputModalities: [text, image]`; an omitted modality remains text-only. A gateway that supports chat but not `/files` will exercise the inline fallback and its separate base64 budget.

The change also affects operational data handling. Files uploads are remote copies with an expiry and provider quotas. Use synthetic images for first-run tests, avoid secrets, and reclaim harness-owned files when quota matters. Do not treat a successful model catalog lookup as proof that an endpoint accepts image input.

### Migration and verification

1. Pin `@deepseek-ai/dsh@0.1.1-rc.2` or the exact source revision above.
2. Dump the resolved profile and confirm the selected model declares image input.
3. Test a small synthetic image in a fresh Session.
4. Confirm whether the endpoint takes the Files API path or the inline fallback.
5. Record expiry, request limits, and sanitized provider failures before using real data.

See the handbook's [rc.2 image-input guide](../getting-started/deepseek-image-input.md), [installation guide](../getting-started/install-deepseek-harness.md), and [upgrade and rollback guide](../getting-started/upgrade-and-rollback.md) for exact commands and recovery paths.

**Primary sources:** [rc.2 release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.1-rc.2), [`dsh-llm-deepseek` README](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28/packages/llm/llm-deepseek/README.md), [Files API client](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28/packages/llm/llm-deepseek/src/files-api.ts), and [DeepSeek adapter](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28/packages/llm/llm-deepseek/src/adapter.ts).


The repository [changelog](../../../CHANGELOG.md) records reader-visible handbook and publishing changes. GitHub Releases provide immutable milestones; the live operator site deploys from `site/` in the same `main` commit, so a successful Pages deployment can be traced back to reviewed source.

## Current watchlist

Verified against upstream `master` on **2026-08-14**.

| Area | Why Agent builders should watch it | Primary source |
|---|---|---|
| Developer preview | compatibility-breaking changes are explicitly expected | [README](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.md#developer-preview) |
| Profile composition | bundle order and patches determine the actual runtime | [Architecture](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md#profiles-and-bundles) |
| Turn/step events | SDK, replay, steering, and debugging depend on the event contract | [Lifecycle](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/agent-lifecycle.md) |
| Tool execution | ordering, barriers, policy, and errors affect side effects | [Tool pipeline](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/tool-execution-pipeline.md) |
| Provider configuration | model routing changes affect first-run success | [Provider guide](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/providers.md) |

## Update format

Each future note should answer:

1. What changed upstream?
2. Which Agent builders or operators are affected?
3. Is the change confirmed, inferred, or experimental?
4. What should readers inspect or migrate?
5. Which commit, pull request, release, or official document proves it?

## Verification policy

- Prefer upstream commits, pull requests, releases, source, and official docs.
- Put the event date and verification date in every note.
- Separate facts from interpretation.
- Never label a rumor as a release.
- Update affected tutorials and their `content_revision` in the same change.

Watch the [official repository](https://github.com/deepseek-ai/deepseek-harness) and [Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions) for primary announcements.
