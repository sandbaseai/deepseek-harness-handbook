---
title: DeepSeek Harness Updates and Breaking Changes
locale: en
content_revision: 3
status: canonical
verified_at: 2026-08-22
upstream_revision: b150a551b8d465e31e418e1b2eaf5e79bbb7d28
---

# DeepSeek Harness updates and breaking changes

This is the living desk for upstream changes that affect people building or operating Agents. It summarizes primary sources; it is not an official changelog.

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
