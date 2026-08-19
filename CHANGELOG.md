# Changelog

All notable handbook and publishing changes are recorded here. DeepSeek Harness itself has a separate upstream release history.

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
