# Contributor instructions

This repository is a multilingual, independent community handbook for DeepSeek Harness.

## Product boundary

- DeepSeek Harness is the subject. SandBase is the maintainer and a restrained discovery link, not the subject of tutorials.
- Prefer official DeepSeek Harness documentation and source. Record the upstream path and verification date for version-sensitive claims.
- Never imply that this repository is an official DeepSeek AI project.
- Do not copy long passages from upstream documentation. Explain, test, and attribute.

## Content workflow

1. Update the English canonical page first.
2. Increment its `content_revision` when meaning changes.
3. Update `content-manifest.json`.
4. Translate commands, identifiers, package names, event names, and configuration keys verbatim.
5. Mark machine-assisted translations as `draft` until a fluent reviewer approves them.
6. Run `npm run check` before submitting a change.

## Safety

- Use placeholders for credentials and personal paths.
- Keep permission, approval, and sandbox claims separate.
- Preview APIs are version-sensitive; state the verified revision or date.
- Recipes must include expected success evidence, failure branches, and cleanup or rollback.

## Project handoff and promotion playbook

This repository is an English-first, multilingual community handbook about DeepSeek Harness. Its purpose is to explain the official project from an Agent developer's perspective and create qualified discovery for SandBase; it is not a replacement implementation and must not be presented as an official DeepSeek AI repository.

### Editorial focus

- Turn official Docs, Releases, Issues, and Discussions into practical Agent-runtime guidance.
- Cover provider/model boundaries, MCP and webMCP, prompt variables, plugins, manifests, Sessions, token accounting, retries, reverse proxies, multi-tenant hosting, mobile/PWA behavior, and launch diagnostics.
- Curate useful ecosystem projects from `0xsline/awesome-deepseek-harness`, but label community and catalog-only items clearly; do not imply endorsement.
- Every substantial update should include reproducible commands or configuration, expected evidence, failure branches, a source link, and a verification date or upstream revision.
- Keep English canonical pages authoritative, then synchronize localized pages and machine-readable discovery files (`content-manifest.json`, `site/llms.txt`, Atom feed, and `CHANGELOG.md`).

### Release and verification workflow

1. Inspect the latest upstream DeepSeek Harness release, Discussions, and Awesome catalog snapshot.
2. Write or update the English canonical page and increment `content_revision` when meaning changes.
3. Update the manifest, localized pages, README/resource indexes, `site/llms.txt`, feed, and changelog as applicable.
4. Run `npm run check`, `npm run check:resources`, and, for link changes, `npm run check:links`.
5. Commit to `main`, push, and create a GitHub release only when the content is a meaningful, source-backed increment.
6. After creating a release, align all machine-readable pointers to that release; do not create another release merely to fix a pointer.

### Promotion principles

- Use ethical, organic distribution only: relevant GitHub Discussions, Show & Tell updates, Awesome-list PRs, searchable English documentation, and useful release notes.
- Lead with an answer or engineering artifact; add the handbook link only when it directly helps. Avoid repetitive comments, spam, automated engagement, purchased/fake Stars, or claims of guaranteed growth.
- Track real GitHub Stars, forks, traffic, referrers, open PRs, and release state with `gh api`; treat these as changing metrics and re-check before reporting.
- Current working baseline (2026-08-30): 80 Stars, 13 forks, 82 curated resources, 173 canonical pages, 202 localized pages. The growth target is 100 genuine Stars.

### PR and fork hygiene

- Submit small, reviewable metadata or resource-list PRs to relevant community repositories.
- Create external-submission forks under the `sandbaseai` GitHub organization, using a clearly named temporary repository or branch.
- Keep the organization fork while its PR is open. As soon as the PR is merged or closed, delete only that temporary `sandbaseai` fork project (and its submission branch when applicable).
- Never modify, reset, archive, or delete a SandBase-owned formal project. Never delete an active PR fork or someone else's repository. Check repository purpose and PR state before cleanup; cleanup is limited to explicitly temporary submission forks created for that PR.
- Before continuing work, run `git status --short`, inspect recent commits, list releases and open PRs, and verify that no unrelated changes are overwritten.

### Useful status commands

```bash
git status --short
git log -3 --oneline
gh api repos/sandbaseai/deepseek-harness-handbook --jq '{stars:.stargazers_count,forks:.forks_count,watchers:.subscribers_count}'
gh release list --repo sandbaseai/deepseek-harness-handbook --limit 5
gh pr list --repo sandbaseai/deepseek-harness-handbook --state all
```
