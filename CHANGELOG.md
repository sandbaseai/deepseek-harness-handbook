# Changelog

All notable handbook and publishing changes are recorded here. DeepSeek Harness itself has a separate upstream release history.

## 0.2.9 - 2026-08-19

### Added

- A macOS workspace-picker guide for firmlinked APFS paths where AppleScript leaks a terminal HFS colon before the POSIX slash.
- Exact picker-output evidence, a narrow normalization boundary, reversible recovery choices, and adapter-plus-registry acceptance tests.

## 0.2.8 - 2026-08-19

### Added

- A source-backed diagnosis for pnpm global installs where native platform-package resolution fails before an installed bare plugin is misleadingly reported as missing.
- Physical-layout evidence, an exact-version project-local A/B, reversible recovery paths, and a cold-restart acceptance test for future fixes.

## 0.2.7 - 2026-08-19

### Added

- A plugin-development guide for custom durable Session events, strict unknown-event refusal, and the currently incomplete downstream `ignorable` writer path.
- Storage-by-semantics guidance, cold-resume compatibility gates, immutable recovery steps, and a reusable plugin release record.

## 0.2.6 - 2026-08-19

### Added

- A source-startup guide for `--expose-internals is required for HMR service` that separates the visible flag from package-manager and native-helper discovery failures.
- Install-topology routing, pinned-pnpm validation, a clean-clone A/B, helper-resolution probe, and a direct-flag diagnostic that is explicitly not a durable workaround.

## 0.2.5 - 2026-08-19

### Added

- A defensive Code Mode trust-boundary guide that separates worker-thread reliability containment from enforceable OS isolation.
- A deployment decision matrix, non-invasive exposure checks, native-mode rollback, outer-isolation requirements, and incident-response checklist.

## 0.2.4 - 2026-08-19

### Added

- A Windows recovery runbook for `ReplaceFileW EACCES (Win32 5)` when an existing profile file is held by HMR.
- A reversible stop, evidence, backup, edit, dump-config, restart, and rollback workflow that preserves atomic publication semantics.

## 0.2.3 - 2026-08-19

### Added

- A TTFT measurement guide that separates Host outbound, provider, and Host inbound latency before attributing a slow first token.
- A source-backed A/B ladder for mature Sessions, concurrent subagents, Session snapshot rebuilds, token-meter observation, and fork seed validation.

## 0.2.2 - 2026-08-19

### Added

- A recovery runbook for Sessions that repeatedly fail with provider JSON errors after malformed streamed tool-call arguments enter durable history.
- A safe evidence workflow using the Web Session export, fresh-Session isolation, and read-only inspection instead of live compressed-log edits.

## 0.2.1 - 2026-08-19

### Added

- A source-backed emergency runbook for cancelling runaway Agent turns, distinguishing repeated tool calls from provider retries and background work, and containing spend with an independent provider-side boundary.
- A visual control matrix that separates concurrency, response output, compaction, tool timeouts, retries, and account quotas.

## 0.2.0 - 2026-08-17

### Added

- Operational runbooks for context-window overflow, plugin recovery, HTTP/2 session failures, remote Web secure-context failures, non-FHS PTY shells, live session durability, and Windows startup boundaries.
- Architecture guidance for Sessions versus long-term memory.
- Provider guidance for local Ollama and bounded subagent scaling.
- A versioned static site source under `site/`.

### Changed

- GitHub Pages now deploys automatically from the same `main` commit that owns the site source.
- Language coverage is reported explicitly instead of implying translation parity.
- CI checks both repository structure and external documentation links.

### Fixed

- Removed the manual `gh-pages` publishing gap that left the live site behind merged handbook content.

## 0.1.1 - 2026-08-15

- Added the first reviewed guide map and normalized the Apache-2.0 license.

## 0.1.0 - 2026-08-14

- Published the initial agent-first handbook, field guide, and contribution workflow.
