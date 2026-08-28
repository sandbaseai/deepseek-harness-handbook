---
title: Diagnose npx Hanging While Installing DeepSeek Harness
locale: en
content_revision: 3
status: canonical
verified_at: 2026-08-28
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
---

# Diagnose `npx` hanging while installing DeepSeek Harness

When `npx @deepseek-ai/dsh web` prints that `@deepseek-ai/dsh@0.1.0-rc.7` must be installed and then appears to freeze, DeepSeek Harness has usually not started yet. Since npm 7, `npx` delegates to `npm exec`; a package absent from the local project is installed into an npm-cache execution directory and placed on `PATH` for that invocation.

The message is an install confirmation, not proof that DeepSeek Harness detected an upgrade or began migrating profiles.

```text
npx command
  → package spec + dist-tag resolution
  → install confirmation
  → metadata and tarball fetch
  → dependency extraction + install scripts
  → temporary executable on PATH
  → dsh process starts
  → Web Host boots
```

Do not clear all npm caches or delete `~/.dsh` before locating the missing transition. Neither action supplies evidence about which phase is waiting.

## Capture the boundary

Record:

```text
Operating system:
node --version:
npm --version:
Exact command:
Last complete terminal line:
Elapsed time:
npm registry:
Proxy or enterprise CA required:
Package version requested by the prompt:
Path to the npm timing/debug log:
Whether dsh --version ever printed:
Whether a Web listening URL ever printed:
```

If the last line is npm's install question, answer it once or repeat the exact command with `--yes`. If npm shows HTTP, extraction, dependency, or lifecycle activity, the wait is still inside npm. If `dsh --version` works from the same exact package but `web` hangs, route the incident to Harness startup instead.

## Pin before diagnosing

At verification time, the official package tags resolve as follows:

```text
latest → 0.1.0-rc.7
next   → 0.1.0-rc.8
```

Dist-tags are mutable. Capture them, then select one exact version:

```sh
npm view @deepseek-ai/dsh dist-tags --json
npm view @deepseek-ai/dsh@0.1.0-rc.7 version dist.integrity --json
```

Do not diagnose a moving bare tag and change release channels at the same time. `--yes` belongs before the package when using `npx`:

```sh
npx --yes @deepseek-ai/dsh@0.1.0-rc.7 --version
npx --yes @deepseek-ai/dsh@0.1.0-rc.7 web
```

With `npm exec`, use `--` to make the npm/DSH argument boundary explicit:

```sh
npm exec --yes --package=@deepseek-ai/dsh@0.1.0-rc.7 -- dsh --version
npm exec --yes --package=@deepseek-ai/dsh@0.1.0-rc.7 -- dsh web
```

Start with `--version`. It proves package resolution, extraction, executable selection, and Node startup without adding Web profile boot, browser launch, workspace selection, or provider initialization.

## Route the npm phase

### 1. Confirmation is waiting

`npx` prompts before installing a package that is absent locally. In terminals or wrappers where stdin is hidden, the question can look like a frozen upgrade. `--yes` suppresses only that confirmation; it does not fix a slow registry or lifecycle script.

### 2. Registry metadata is waiting

Inspect effective configuration without printing credentials:

```sh
npm config get registry
npm ping
npm view @deepseek-ai/dsh@0.1.0-rc.7 version --json
```

If the configured registry is an internal mirror, test that mirror as the deployment owner intends. Do not bypass an enterprise registry, proxy, or TLS policy merely to make the command succeed. npm honors standard HTTP and HTTPS proxy environment variables; capture only whether they are set, never their credential-bearing values.

### 3. Fetch, extraction, or dependency work is waiting

Repeat the version probe with observable npm output:

```sh
npx --yes --prefer-online --loglevel=http --timing \
  @deepseek-ai/dsh@0.1.0-rc.7 --version
```

`--timing` prints the debug-log path and records phase timing. `--loglevel=http` shows registry requests without enabling the most verbose potentially sensitive trace. Review logs before sharing them: npm attempts to redact common credentials, but its documentation explicitly says not to rely on that for every secret.

If the last activity is a lifecycle script, repeat once with `--foreground-scripts` so npm exposes script output:

```sh
npx --yes --foreground-scripts --timing \
  @deepseek-ai/dsh@0.1.0-rc.7 --version
```

Do not add `--ignore-scripts` as a generic workaround. Skipping a dependency's required native build can convert an observable install failure into a later missing-binding crash.

### 4. Cache state is suspected

npm's cache is content-addressed and self-verifying. Prefer:

```sh
npm cache verify
npm cache npx ls
```

For a clean A/B, use a new temporary cache rather than deleting the shared one:

```sh
npx_cache=$(mktemp -d)
npm exec --cache "$npx_cache" --yes \
  --package=@deepseek-ai/dsh@0.1.0-rc.7 -- dsh --version
```

On PowerShell:

```powershell
$NpxCache = New-Item -ItemType Directory -Path ([IO.Path]::GetTempPath()) -Name ([guid]::NewGuid())
npm exec --cache "$NpxCache" --yes --package=@deepseek-ai/dsh@0.1.0-rc.7 -- dsh --version
```

Delete only the temporary directory after preserving needed logs. `npm cache clean --force` removes shared evidence, causes refetching, and is not npm's recommended corruption repair.

## Prove when DeepSeek Harness starts

The package phase is complete only when the `dsh` executable begins. Compare these probes in order:

| Probe | What success proves |
|---|---|
| `npm view ... version` | registry metadata path works |
| exact `dsh --version` through `npm exec` | package fetch, cache, extraction, bin selection, and Node entrypoint work |
| exact `dsh --help` | CLI command surface loads |
| exact `dsh web` | profile composition and Web Host begin booting |
| printed listening URL | Web server reached its listen boundary |

If `--version` succeeds but `web` does not, retain the exact same version and diagnose the first Harness error. Dumping the resolved composition, testing a disposable DSH home, and checking profile/plugin closure are more relevant than changing npm cache state.

### When npm itself spins or OOMs

Recent field reports add a different install boundary. Discussions [#3786](https://github.com/deepseek-ai/deepseek-harness/discussions/3786), [#3890](https://github.com/deepseek-ai/deepseek-harness/discussions/3890), [#4236](https://github.com/deepseek-ai/deepseek-harness/discussions/4236), and the newer [#4872](https://github.com/deepseek-ai/deepseek-harness/discussions/4872) describe npm 10/11 spending all CPU—or exhausting the default Node heap—while resolving the published package's peer graph. In those reports there is no registry traffic and no Harness process yet. Treat this as npm Arborist/dependency resolution, not a Web boot hang. #4872 adds a useful control: the same environment completed with pnpm, which narrows the boundary to the package-manager path but does not prove the package graph is correct.

Capture the exact package version, Node/npm versions, RSS or heap evidence, and whether the same attempt completes with the repository's supported package manager. As a bounded diagnostic, one isolated install with `--legacy-peer-deps` can test whether peer resolution is the boundary; it is not a production fix. That flag skips peer contracts and may leave runtime packages absent, so install only in a disposable directory and follow with `dsh --version` plus a Web smoke test. Do not present a successful legacy-peer install as proof that the published dependency metadata is correct, and do not add the flag to every command without recording the trade-off.

Do not run repeated `npx` attempts in parallel. They can compete for bandwidth, repeat package work, obscure which log belongs to which attempt, and leave several future Host processes if the network recovers.

## Acceptance gates

- [ ] the exact Node, npm, package version, registry, OS, and command are recorded;
- [ ] “Need to install” is classified as npm confirmation, not Harness migration;
- [ ] `--yes` is placed before the package in `npx` syntax;
- [ ] the selected dist-tag is resolved to an exact version;
- [ ] metadata, package execution, CLI load, and Web boot are tested separately;
- [ ] HTTP and timing output identify the last active npm phase;
- [ ] logs are reviewed and redacted before sharing;
- [ ] enterprise proxy, registry, and CA policy are preserved;
- [ ] lifecycle scripts are observed before any policy change;
- [ ] no required install script is silently skipped;
- [ ] `npm cache verify` precedes destructive cache operations;
- [ ] a fresh-cache A/B uses an isolated temporary directory;
- [ ] DSH state is not deleted for a pre-entrypoint npm failure;
- [ ] retries are sequential and bounded;
- [ ] the final report states whether `dsh --version` and the Web listen boundary were reached.

## Primary sources

Verified on 2026-08-20 against the official package registry and DeepSeek Harness rc.8 commit `141eb6fef83422698aef7a981029e843e8161534`.

- [Official report #3485](https://github.com/deepseek-ai/deepseek-harness/discussions/3485)
- [npm peer-resolution CPU loop report #3786](https://github.com/deepseek-ai/deepseek-harness/discussions/3786)
- [Linux npm OOM report #3890](https://github.com/deepseek-ai/deepseek-harness/discussions/3890)
- [npm install peer-dependency loop report #4236](https://github.com/deepseek-ai/deepseek-harness/discussions/4236)
- [npx npm dependency-resolution OOM report #4872](https://github.com/deepseek-ai/deepseek-harness/discussions/4872)
- [npm exec and npx execution contract](https://docs.npmjs.com/cli/v11/commands/npm-exec/)
- [npm cache guidance](https://docs.npmjs.com/cli/v11/commands/npm-cache/)
- [npm logging and timing guidance](https://docs.npmjs.com/cli/v11/using-npm/logging/)
- [npm configuration reference](https://docs.npmjs.com/cli/v11/using-npm/config/)
- [Official DeepSeek Harness installation guide](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/README.md)
- [Upgrade and rollback safely](../getting-started/upgrade-and-rollback.md)
