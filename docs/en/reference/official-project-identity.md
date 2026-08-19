---
title: Verify the Official DeepSeek Harness Project
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-19
---

# Verify the official DeepSeek Harness project

Several unrelated repositories and packages use similar names. Before installing, reporting a bug, or applying a workaround, verify that all coordinates point to the DeepSeek AI agent runtime:

| Coordinate | Official value verified 2026-08-19 |
|---|---|
| GitHub owner/repository | `deepseek-ai/deepseek-harness` |
| Repository description | `DeepSeek Harness: Everything is a Plugin.` |
| Default branch | `master` |
| Product page | `https://deepseek.com/harness` |
| CLI package | `@deepseek-ai/dsh` |
| CLI command | `dsh` |
| Current npm `latest` and `next` | `0.1.0-rc.7` |
| Current GitHub release | `dsh-v0.1.0-rc.7` |
| Release commit | `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca` |
| Runtime license | MIT |

This handbook is an independent SandBase community project. It documents the official runtime but is not published by DeepSeek AI.

## Verify before installing

Read registry metadata without executing package code:

```sh
npm view @deepseek-ai/dsh name version dist-tags repository.url homepage --json
```

Expected identity signals:

```json
{
  "name": "@deepseek-ai/dsh",
  "version": "0.1.0-rc.7",
  "repository.url": "git+https://github.com/deepseek-ai/deepseek-harness.git"
}
```

The dist-tags are mutable. Treat the exact version as evidence captured at a time, not as a permanent promise.

## Verify a source checkout

From inside the checkout:

```sh
git remote get-url origin
git branch --show-current
git rev-parse HEAD
git status --short
node -p "require('./apps/cli/package.json').name"
```

A fork can contain valid work while its `origin` is not the official repository. Record both the remote and commit. Do not describe a fork commit as released upstream until the official tag contains it.

For the rc.7 release:

```sh
git fetch --tags https://github.com/deepseek-ai/deepseek-harness.git
git rev-list -n 1 dsh-v0.1.0-rc.7
```

The tag should resolve to `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca` at the verification date.

## Verify the artifact you actually run

An official package name does not prove which artifact a shell selected:

```sh
command -v dsh
dsh --version
npm list -g --depth=0 @deepseek-ai/dsh
pnpm list -g --depth=0 @deepseek-ai/dsh
```

For a clean-room test, pin the full version:

```sh
npx @deepseek-ai/dsh@0.1.0-rc.7 --version
npx @deepseek-ai/dsh@0.1.0-rc.7 web
```

Capture output before reinstalling. An `npx` cache, project-local dependency, global installation, packaged application, and source checkout can all select different artifacts.

## Names that are not sufficient evidence

None of these, by itself, proves official project identity:

- a repository named `deepseek-harness`;
- an unscoped package with “deepseek” or “harness” in its name;
- a `dsh` executable somewhere on `PATH`;
- a fork whose README links to DeepSeek;
- a package claiming OpenAI-compatible or DeepSeek API support;
- a tutorial that copies the official installation command.

Compare owner, package scope, repository declaration, exact version, and release commit together.

## Route contributions and incidents correctly

| Work | Destination |
|---|---|
| Runtime bug, proposal, or plugin showcase | official `deepseek-ai/deepseek-harness` Discussions or pull requests |
| Handbook correction or new operator guide | `sandbaseai/deepseek-harness-handbook` issue or pull request |
| Fix living only in a fork | cite the fork commit and state that it is not released upstream |
| Security-sensitive runtime finding | follow the official repository security policy or maintainer disclosure route |

Never move a runtime bug into the handbook tracker merely because a guide links to it. Never imply that SandBase can approve or release an upstream runtime fix.

## Minimal provenance record

```text
Repository remote:
Repository commit:
GitHub release tag:
Package name:
Package version:
Package repository.url:
Resolved executable path:
Executable-reported version:
Install topology: npx / npm global / pnpm global / project local / source / packaged
Observed date and time zone:
```

## Primary sources

- [Official DeepSeek Harness repository](https://github.com/deepseek-ai/deepseek-harness)
- [Official rc.7 GitHub release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.0-rc.7)
- [Official CLI package manifest at rc.7](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/apps/cli/package.json)
- [Official repository README at rc.7](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/README.md)
- [Published `@deepseek-ai/dsh` package](https://www.npmjs.com/package/@deepseek-ai/dsh)
- [DeepSeek Harness product page](https://deepseek.com/harness)

