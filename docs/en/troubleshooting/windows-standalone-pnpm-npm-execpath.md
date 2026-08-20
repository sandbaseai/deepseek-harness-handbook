---
title: Fix DeepSeek Harness Builds When Node Tries to Parse pnpm
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-20
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
---

# Fix `Invalid or unexpected token` when Node parses pnpm

DeepSeek Harness rc.8 repository scripts assume `npm_execpath` names a JavaScript package-manager entrypoint. pnpm 11 can instead expose a native executable, POSIX launcher, Windows executable, or command shim. The scripts still place that path after `process.execPath`.

On Linux, the result can be:

```text
node /.../@pnpm/exe/.../pnpm run build:lib
```

If that `pnpm` is an ELF executable, Node prints its `ELF` header and throws `SyntaxError: Invalid or unexpected token`. A POSIX shell launcher can similarly be parsed as JavaScript instead of being executed by its shebang.

On Windows, the equivalent is:

```text
node C:\...\@pnpm\exe\pnpm.exe run build:lib
```

Node tries to parse or load the native PE executable as JavaScript. The exact signature depends on the platform, Node loader path, and pnpm distribution:

```text
SyntaxError: Invalid or unexpected token
```

The first output line may expose `ELF` on Linux or binary-looking text beginning with the Windows PE marker `MZ`. Another Windows environment can instead report:

```text
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".exe"
```

These are presentations of one repository build-runner incompatibility: Node received a non-JavaScript package-manager entrypoint where it expected JavaScript. It is not a failure in the package being built, a pnpm store corruption, or the same problem as `ERR_PNPM_ADDING_TO_ROOT` during plugin installation.

## Confirm all three identities

From the official source checkout at the exact release commit, first use the cross-platform probe:

```bash
node --version
pnpm --version
pnpm exec node -p "process.env.npm_execpath"
node -p "process.platform"
git rev-parse HEAD
```

On Linux or macOS, classify the returned path without executing it:

```bash
file -- "$(pnpm exec node -p 'process.env.npm_execpath')"
```

On Windows, also record command resolution:

```powershell
node --version
pnpm --version
pnpm exec node -p "process.env.npm_execpath"
Get-Command pnpm -All | Select-Object Source, CommandType
git rev-parse HEAD
```

For rc.8, the repository declares:

```text
Node: ^22.19.0 or >=24.0.0
pnpm: 11.7.0
commit: 141eb6fef83422698aef7a981029e843e8161534
```

Route the result:

| `npm_execpath` value | Meaning |
|---|---|
| ends in `.js`, `.cjs`, or `.mjs` | Node wrapping is structurally valid |
| ELF, Mach-O, or other native executable | rc.8 scripts will pass native pnpm to Node incorrectly |
| POSIX shell script with a shebang | executable launcher; Node wrapping is invalid |
| ends in `.exe` | standalone native Windows pnpm; Node wrapping is invalid |
| empty or undefined | runner was not invoked through the expected package-manager environment |
| ends in `.cmd` | shell shim; do not pass it to Node or spawn it shell-free as if it were native |

Meet the Node engine independently. Upgrading Node can remove one gate while leaving the `.exe` failure unchanged.

## Why one command fans out into many failures

```mermaid
flowchart LR
  A[pnpm run build] --> B[npm_execpath = pnpm entrypoint]
  B --> C[script spawns process.execPath]
  C --> D[node pnpm.exe ...]
  D --> E[ELF / MZ syntax or loader error]

  B --> F[build.ts]
  B --> G[run-gates.ts]
  B --> H[run-web-snapshots.ts]
  B --> I[coverage-partitions.ts]
```

At rc.8, the same assumption affects:

- `pnpm run build` through `scripts/build.ts`;
- `check:all` and CI aggregates through `scripts/run-gates.ts`;
- `test:web:ci` through `scripts/run-web-snapshots.ts`;
- partitioned coverage through `scripts/coverage-partitions.ts`.

The first nested command fails before package compilation or tests begin. Do not debug TypeScript, Vite, Vitest, or a workspace package until the child-process command line is correct.

## Current recovery: use the repository-pinned JavaScript entrypoint

Keep the failing environment as evidence. In a fresh terminal, use a pnpm distribution that exposes a JavaScript entrypoint and exactly matches the repository declaration. Corepack is the bounded recovery path for a repository with a `packageManager` field:

```text
corepack enable
corepack prepare pnpm@11.7.0 --activate
corepack pnpm --version
corepack pnpm exec node -p "process.env.npm_execpath"
```

The last command must print a `.js`, `.cjs`, or `.mjs` path before continuing. If system policy prevents `corepack enable`, use Corepack explicitly without changing global shims:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm run build
```

Verify `npm_execpath` under the exact invocation first. Do not assume the word “Corepack” proves which binary won PATH resolution.

An npm-installed `pnpm@11.7.0` package can also expose its JavaScript bin, but installing another global manager adds PATH ambiguity. Prefer an explicit Corepack command for the bounded recovery, and retain `command -V -a pnpm` or `Get-Command pnpm -All` with the evidence.

## Re-run from the first meaningful gate

After the entrypoint and Node engine are correct:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm run build
corepack pnpm run typecheck:contracts-ready
corepack pnpm run check:all
```

Record the first new failure. A later native addon, test, snapshot, lint, or generated-artifact error is a different boundary; do not attribute it to `npm_execpath` merely because the environment previously had that problem.

## Do not use these shortcuts

- Do not rename `pnpm.exe` to `.js` or `.cjs`; file extension does not change its format.
- Do not set `npm_execpath` globally to a guessed path; package managers own that invocation variable.
- Do not enable `shell: true` as a universal fix. It changes quoting, injection, expansion, signal, and executable-resolution behavior; a package-manager path is data, not a command string.
- Do not patch only `scripts/build.ts`; three other runners carry the same assumption.
- Do not remove `packageManager` or ignore the rc.8 Node engine to make a local command appear green.
- Do not delete the pnpm store or lockfile: the failure occurs before package resolution is the controlling boundary.

## Upstream repair contract

The runner should classify the concrete entrypoint:

```text
JavaScript (.js/.cjs/.mjs)
  command = process.execPath
  args    = [entrypoint, ...packageManagerArgs]

Native executable (ELF, Mach-O, .exe, or extensionless native binary)
  command = entrypoint
  args    = packageManagerArgs

Executable POSIX launcher with a valid shebang
  command = entrypoint
  args    = packageManagerArgs

Windows command shim (.cmd/.bat)
  resolve the package's JavaScript or native target through a documented Windows branch
  do not silently turn every platform into shell-string execution
```

A shared helper should own this decision so build, gates, Web snapshots, and coverage cannot drift.

### Regression gates

- [ ] JavaScript pnpm entrypoints remain wrapped with the current Node executable.
- [ ] Native `pnpm.exe` is spawned directly with no shell.
- [ ] Native ELF/Mach-O pnpm and executable POSIX launchers run directly on their platforms.
- [ ] `.cmd` and `.bat` shims are not passed to Node.
- [ ] Missing `npm_execpath` fails with the runner-specific actionable error.
- [ ] Paths containing spaces and non-ASCII characters work on Windows.
- [ ] Arguments remain an array; no command-string quoting is introduced.
- [ ] Exit status, signal, inherited stdio, cwd, and environment remain unchanged.
- [ ] `build.ts` uses the shared helper for both nested build scripts.
- [ ] `run-gates.ts` uses it for `run` and `exec` gates.
- [ ] Web snapshot and coverage partition runners use the same command/args pair.
- [ ] Unit tests cover `.cjs`, `.js`, `.mjs`, `.exe`, missing input, and mixed-case extensions.
- [ ] Unit tests also use a real temporary executable with spaces and metacharacters in its path.
- [ ] Real Linux pnpm 11 `@pnpm/exe` and Windows standalone-pnpm builds pass build, contracts, gates, coverage, and Web snapshots.

## Route neighboring pnpm failures

| Symptom | First boundary |
|---|---|
| binary-looking `MZ` output followed by `Invalid or unexpected token` | runner made Node parse native pnpm as JavaScript |
| `ELF` followed by `Invalid or unexpected token` | runner made Node parse a Linux native pnpm executable |
| shell syntax is reported as JavaScript | runner made Node parse a POSIX launcher |
| Node reports unknown `.exe` extension | runner made Node load native pnpm as a module |
| `npm_execpath is unavailable` | script invocation environment |
| `ERR_PNPM_ADDING_TO_ROOT` | plugin target is a workspace root |
| ignored build scripts or missing native artifact | pnpm build policy and package artifact |
| package cannot resolve after global install | isolated global dependency graph |
| engine mismatch before scripts run | Node or pnpm version contract |

## Primary sources

- [Official discussion #3440](https://github.com/deepseek-ai/deepseek-harness/discussions/3440)
- [mise-installed pnpm reproduction #3475](https://github.com/deepseek-ai/deepseek-harness/discussions/3475)
- [Linux pnpm 11 ELF reproduction #3532](https://github.com/deepseek-ai/deepseek-harness/discussions/3532)
- [Official rc.8 release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.0-rc.8)
- [rc.8 `scripts/build.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/scripts/build.ts)
- [rc.8 `scripts/run-gates.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/scripts/run-gates.ts)
- [rc.8 `scripts/run-web-snapshots.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/scripts/run-web-snapshots.ts)
- [rc.8 `scripts/coverage-partitions.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/scripts/coverage-partitions.ts)
- [rc.8 root package contract](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/package.json)
