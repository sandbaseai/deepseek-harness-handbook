---
title: Verify the Official DeepSeek Harness Project
locale: en
content_revision: 3
status: canonical
verified_at: 2026-08-20
---

# Verify the official DeepSeek Harness project

Several unrelated repositories and packages use similar names. Before installing, reporting a bug, or applying a workaround, verify that all coordinates point to the DeepSeek AI agent runtime:

## Short answer: which DeepSeek Harness is official?

The official DeepSeek Harness is the open-source **Agent runtime** at [`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness). Its npm package is the scoped package **`@deepseek-ai/dsh`**, and its executable is **`dsh`**. It is not an unscoped Python package, a thin DeepSeek API client, a model-specific request wrapper, or any repository that merely uses `deepseek-harness` as its name.

The official README describes `dsh` as an agent harness with an “everything is a plugin” architecture. That product boundary includes profiles, an Agent loop, tools, approval and sandbox policy, Sessions, model adapters, MCP, and user interfaces. A library that only normalizes DeepSeek API requests may be useful, but it is a different project and should not inherit the official runtime's provenance.

| Coordinate | Official value verified 2026-08-20 |
|---|---|
| GitHub owner/repository | `deepseek-ai/deepseek-harness` |
| Repository description | `DeepSeek Harness: Everything is a Plugin.` |
| Default branch | `master` |
| Product page | `https://deepseek.com/harness` |
| CLI package | `@deepseek-ai/dsh` |
| CLI command | `dsh` |
| Current npm `latest` | `0.1.0-rc.7` |
| Current npm `next` | `0.1.0-rc.8` |
| Current GitHub release | `dsh-v0.1.0-rc.8` |
| rc.8 release commit | `141eb6fef83422698aef7a981029e843e8161534` |
| Runtime license | MIT |

## Runtime or API wrapper? Use the behavior test

Names are ambiguous; behavior is easier to classify:

| Test | Official DeepSeek Harness runtime | DeepSeek API wrapper or client |
|---|---|---|
| Primary install coordinate | `@deepseek-ai/dsh` | Varies; often an unscoped npm or Python package |
| Primary command | `dsh` with named profiles such as `web` | Usually a library import or request-oriented CLI |
| Product boundary | Agent composition, tools, policy, sandbox, Sessions, model routes, and UI | Model request/response handling |
| Model relationship | Model providers are replaceable adapters inside the runtime | DeepSeek API behavior is usually the core abstraction |
| Source of truth | `github.com/deepseek-ai/deepseek-harness` | The wrapper maintainer's repository |

Do not use this table to judge quality. Use it to identify which system a command, issue, security claim, or workaround actually describes.

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

The dist-tags are mutable. At the verification date, bare `npx @deepseek-ai/dsh` resolves through `latest` to rc.7, while `npx @deepseek-ai/dsh@next` resolves to rc.8. Treat the exact version as evidence captured at a time, not as a permanent promise.

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

For the rc.8 release:

```sh
git fetch --tags https://github.com/deepseek-ai/deepseek-harness.git
git rev-list -n 1 dsh-v0.1.0-rc.8
```

The tag should resolve to `141eb6fef83422698aef7a981029e843e8161534` at the verification date.

## Verify the artifact you actually run

An official package name does not prove which artifact a shell selected:

```sh
command -v dsh
dsh --version
npm list -g --depth=0 @deepseek-ai/dsh
pnpm list -g --depth=0 @deepseek-ai/dsh
```

For a clean-room test, pin the full version rather than relying on a moving dist-tag:

```sh
npx @deepseek-ai/dsh@0.1.0-rc.8 --version
npx @deepseek-ai/dsh@0.1.0-rc.8 web
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

## Common identity questions

### Is `deepseek-harness` on PyPI the official DeepSeek Harness?

Do not infer that from the project name. At the verification date, the official runtime's published CLI coordinate is the scoped npm package `@deepseek-ai/dsh`. Verify any Python distribution against its own declared owner and repository.

### Is every GitHub repository named `deepseek-harness` a fork of the official runtime?

No. GitHub repository names are not globally unique. Some similarly named projects are independent API wrappers or applications. Inspect the owner, `origin`, commit ancestry, and package manifest.

### Does the official runtime only work with DeepSeek models?

No. The official source defines model providers as plugins inside a larger Agent runtime. The DeepSeek AI owner and `dsh` package identify the project; they do not make the model adapter the entire product.

### Is this handbook official DeepSeek AI documentation?

No. It is an independent, source-backed SandBase community handbook. It links every version-specific claim to the official repository or released artifact.

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
- [Official rc.8 GitHub release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.0-rc.8)
- [Official CLI package manifest at rc.8](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/apps/cli/package.json)
- [Official repository README at rc.8](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/README.md)
- [Published `@deepseek-ai/dsh` package](https://www.npmjs.com/package/@deepseek-ai/dsh)
- [DeepSeek Harness product page](https://deepseek.com/harness)
