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

### External comment formatting

- Format GitHub issue and pull-request replies as explicit HTML blocks so the rendered comment keeps its visual hierarchy across GitHub views: use `<h3>` for section labels, `<p>` for paragraphs, `<ul><li>` or `<ol><li>` for lists, and `<a href="…">…</a>` for handbook links.
- Keep one blank line between block elements. Use a compact sequence such as `Review`, `Suggested contract`, `Regression matrix`, and `Handbook reference`; do not mix Markdown heading syntax with HTML headings in the same reply.
- Prefer the JSON request-body form when creating or editing a long comment: write a temporary JSON payload, call `gh api … -X PATCH --input <file>` (or the corresponding comments endpoint), read the returned `body` and `updated_at` to verify the write, then remove the temporary file. Never place credentials or unredacted secrets in the payload, shell history, process arguments, or logs.
- If a comment edit reports a transient API failure, read the comment first to confirm whether it changed before retrying; do not create a duplicate comment while the write state is uncertain.

### Source-backed external reviews

- Before publishing or editing an external issue/PR review, inspect the target project's actual source, tests, and stated base revision. Treat a report or reproduction as a hypothesis until the relevant functions and branches have been checked.
- Make the review traceable to concrete evidence: link the target project's issue/reproduction and the exact source files or revision that support the diagnosis. Keep observed behavior, inference, and proposed contract separate; do not claim a fix for code or failure modes outside the inspected scope.
- Every recommendation must be actionable and specific to the target code: name the ownership/state/serialization boundary, the failure branch, and regression cases that would prove the change. Do not publish generic reliability checklists that are not grounded in the target implementation.
- This is a DeepSeek Harness handbook, not documentation for Pibo, Hermes Agent, or another external project. For an external review, the target project's source, tests, issue, and documentation are the direct remediation path. Link a handbook page only when it gives reusable guidance that genuinely helps with the reported boundary; label it explicitly as an independent, community-maintained Harness analogy, never as the external project's documentation or fix. Omit the handbook link when it would not help the affected users.
- After creating or editing a comment, read back the rendered body and update timestamp. If the comment is found to be too broad, inaccurate, or misleading about applicability, correct it with target-project evidence before continuing promotion.

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

## Session start and continuous execution

- The north-star objective is to make this the best DeepSeek Harness handbook on the web: the most accurate, useful, current, discoverable, and well-organized Agent-first reference, measured by editorial quality and genuine developer adoption rather than vanity metrics alone.
- At the beginning of every session, first review `README.md`, the top-level directory structure, documentation indexes, manifests, and the site navigation for drift, duplication, missing sections, or confusing entry points. Only after that review the latest repository state, recent commits, releases, open PRs, traffic signals, and the last recorded promotion outcome before choosing work.
- Use the startup review to maintain a coherent information architecture: keep canonical English pages easy to find, ensure localized pages and indexes point to valid content, and make the README explain the audience, scope, evidence policy, and fastest path to value.
- Treat the previous session's achieved baseline as the starting point. Set the next measurable organic-growth target to 120% of that baseline (for example, a target of 100 genuine Stars becomes 120 after it is achieved), and record the new target in the handoff or changelog when relevant.
- Do not pause for routine confirmation: within this repository's established scope, proceed autonomously with source-backed content updates, checks, releases, relevant outreach, and cleanup of eligible temporary forks.
- Continue iterating across sessions until the active target is achieved or the user explicitly stops or changes the goal. Do not manufacture engagement, automate or purchase Stars, spam communities, or claim that a target is guaranteed.
- “Default authorization” does not override platform permissions, repository ownership rules, secrets handling, destructive-action safeguards, or required external approvals. Stop and report when an action would modify/delete a formal SandBase project, delete an active PR fork, or require authority not already granted.
- At the end of each session, leave a concise status trail: baseline, target, actions taken, verification results, open blockers, and the next safe action.
