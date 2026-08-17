---
title: DeepSeek Harness Updates and Breaking Changes
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-17
---

# DeepSeek Harness updates and breaking changes

This is the living desk for upstream changes that affect people building or operating Agents. It summarizes primary sources; it is not an official changelog.

## Handbook releases

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
