---
title: Install DeepSeek Harness Safely
locale: en
content_revision: 4
status: canonical
verified_at: 2026-08-28
upstream_revision: cd5ef8148158c3a752a658978873241fdf8e2bbc
---

# Install DeepSeek Harness: choose the right execution topology

The official quick path is `npx @deepseek-ai/dsh web`. It is excellent for a first look, but the command alone does not answer three operational questions: which version executed, where its profile state lives, and whether you are testing a published artifact or a source checkout.

This guide separates those choices before configuration or troubleshooting begins.

> [!WARNING]
> DeepSeek Harness is in developer preview and can run tools that read or modify the selected workspace. Start in a disposable repository, use limited credentials, and review every approval request.

## Treat unreleased Node versions as a separate variable

An upstream startup report used macOS 27 beta with Node `v25.9.0` and observed a process that appeared to hang before the UI became usable ([discussion #111](https://github.com/deepseek-ai/deepseek-harness/discussions/111)). The report does not prove that Node 25 caused the hang, but it is enough to keep the runtime version in the reproduction record.

For a first comparison, use the Node range declared by the exact DSH source revision (the rc.8 checkout declares `^22.19.0 || >=24.0.0`), then A/B the same profile and `DSH_HOME` on the beta runtime. Capture `node --version`, package version, launch command, first visible log line, and whether the process opens a port. Do not “fix” a startup hang by deleting profile state until the supported-runtime comparison has been preserved.

## Verify the package before execution

The official coordinates are:

```text
Repository  deepseek-ai/deepseek-harness
npm package @deepseek-ai/dsh
Executable  dsh
Release     dsh-v0.1.1-rc.2
Commit      b150a551b8d465e31e418e1b2eaf5e79bbb7d28
Integrity   sha512-UP1UIh6q3Gme/yXRn/QL2P8IsVlv8Shpg22TRJIZPsCRWLm4CBiA1MUvXmJAfsOEETBMLAl+xWPtFw6ICsN3wg==
```

Read registry metadata before running package code:

```sh
npm view @deepseek-ai/dsh \
  name version dist-tags repository.url homepage bin --json
```

Confirm the scoped name, DeepSeek AI repository, expected version, and `dsh` binary. A repository title, unscoped package, or copied `dsh` command is not sufficient provenance.

## A GitHub release is not automatically an npm release

At the 2026-08-28 verification point, the official channels are intentionally—or temporarily—split:

| Coordinate | Observed value | What it authorizes |
|---|---|---|
| GitHub Release | `dsh-v0.1.2-alpha.1` | release notes and source tag exist |
| Git tag | `dsh-v0.1.2-alpha.1` → `cd5ef814…` | exact source checkout is addressable |
| source CLI manifest | `@deepseek-ai/dsh` version `0.1.2-alpha.1` | source build reports the prerelease version |
| npm `latest` | `0.1.1-rc.2` | bare npm/npx installation resolves rc.2 |
| npm `next` | `0.1.1-rc.2` | `@next` also resolves rc.2 |
| npm exact alpha query | `E404` for `@deepseek-ai/dsh@0.1.2-alpha.1` | no registry artifact is available from the queried registry |

These statements are compatible. A release page and a package manifest describe repository state; npm installation requires a registry packument entry and downloadable tarball for the exact version. Do not infer publication from matching text in `package.json`.

Capture all channels without executing the candidate:

```sh
npm view @deepseek-ai/dsh version dist-tags versions --json
npm view @deepseek-ai/dsh@0.1.2-alpha.1 \
  version dist.integrity dist.tarball --json
git ls-remote --tags https://github.com/deepseek-ai/deepseek-harness.git \
  refs/tags/dsh-v0.1.2-alpha.1
```

Route the result:

- **Need a supported npm artifact:** use the exact registry-visible rc.2 coordinate and its integrity; do not rename it alpha.1.
- **Need to test alpha.1 source:** check out the official tag, use its declared Node and pnpm versions, build the whole workspace, isolate `DSH_HOME`, and report the Git commit plus dirty state.
- **Need an alpha.1 npm tarball:** wait for the official publisher. A GitHub source archive is not a substitute for a built multi-package npm closure.
- **See alpha.1 on another registry or mirror:** capture the registry URL, package metadata, tarball integrity, and publisher provenance before execution. It is not evidence that the official npm registry has the artifact.

Do not use `npm install github:deepseek-ai/deepseek-harness#dsh-v0.1.2-alpha.1` as a shortcut. The repository root is a private pnpm workspace, the CLI depends on many `workspace:^` packages, and the npm CLI artifact expects built `lib` output. A Git dependency does not reproduce the official multi-package publish pipeline.

## Choose by objective

| Objective | Topology | Command | Tradeoff |
|---|---|---|---|
| First bounded evaluation | ephemeral npm execution | `npx @deepseek-ai/dsh@0.1.1-rc.2 web` | smallest setup; package cache is not a deployment manifest |
| Repeatable local evaluation | project-local exact dependency | `npm install --save-exact @deepseek-ai/dsh@0.1.1-rc.2` | version recorded in a disposable project and lockfile |
| Upstream development or unpublished prerelease evaluation | official source checkout at an exact tag | `pnpm install && pnpm run build && pnpm dsh web` | tests source and locally built artifacts, not a published npm package |
| Persistent shell-wide command | global install | package-manager global bin | convenient but easiest to confuse with another executable or stale store |

The official README documents npm execution and source execution. Project-local and global forms are ordinary package-manager topologies around the published `dsh` binary; use them only when their operational tradeoff is useful.

## Path A: exact-version first run

From a disposable repository:

```sh
npx @deepseek-ai/dsh@0.1.1-rc.2 web
```

Open `http://127.0.0.1:3080`, configure a limited model credential, select the exact disposable workspace, and begin with a read-only task.

In another terminal, preserve evidence:

```sh
npx @deepseek-ai/dsh@0.1.1-rc.2 --version
npx @deepseek-ai/dsh@0.1.1-rc.2 --profile web --dump-config > resolved-web.yml
```

The explicit version prevents a moving npm tag from changing the artifact between reproductions. It does not make the profile immutable: user and profile patches can still change the resolved composition.

## Path B: project-local exact dependency

Use a small launcher project when a team needs a lockfile and a repeatable npm artifact:

```sh
mkdir dsh-lab
cd dsh-lab
npm init -y
npm install --save-exact @deepseek-ai/dsh@0.1.1-rc.2
npx dsh --version
npx dsh web
```

Commit the manifest and lockfile only if the launcher itself belongs in version control. Do not place model credentials in either file.

This topology records the package version but still uses the same user-level DSH home and profiles unless you deliberately isolate `DSH_HOME`. For a disposable comparison, point `DSH_HOME` at a new temporary directory and remove it after preserving the evidence you need.

## Path C: run the official source checkout

Use this path to contribute upstream, inspect internal packages, or compare a source revision with a published artifact:

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
git remote get-url origin
git checkout b150a551b8d465e31e418e1b2eaf5e79bbb7d28
corepack enable
pnpm install
pnpm run build
pnpm dsh web
```

`pnpm dsh` starts the TypeScript launcher, but production Web startup still requires built package and frontend artifacts. Run `pnpm run build` after a fresh checkout and whenever artifacts may be stale.

Record both the Git revision and any dirty diff:

```sh
git rev-parse HEAD
git status --short
pnpm dsh --version
```

A clean checkout at the release commit is useful for source-to-package comparison. A modified checkout is a different runtime and must be reported as such.

## Path D: global installation

A global `dsh` is convenient for repeated interactive use but has the weakest visible provenance. Before trusting it, record:

```sh
command -v dsh
dsh --version
npm prefix --global
npm list --global @deepseek-ai/dsh --depth=0
```

On Windows, use `where dsh` instead of `command -v dsh`. If multiple paths appear, the first one selected by the shell wins.

Do not debug a global native-binding or module-resolution failure by repeatedly reinstalling over the same store. Compare against an exact-version project-local install in a new directory. If the local form works, preserve the global prefix, executable path, package-manager version, and physical module layout before changing them.

## State is separate from the executable

Changing how the CLI is installed does not automatically create clean profile state. A profile lives under `$DSH_HOME/profiles/<name>` and is composed from:

1. installed bundle patches in profile-manifest order;
2. the profile's `cordis.patch.yml`;
3. the home-level `$DSH_HOME/cordis.patch.yml`;
4. command-line `--patch` overlays.

The invoking directory is the default workspace root. Therefore a valid reproduction record needs three independent coordinates:

```text
Executable: path + reported version + package/source identity
State:      DSH_HOME + profile manifest + patch files
Workspace:  launch directory + selected workspace realpath
```

## First-run acceptance test

After the Web UI starts:

1. confirm the terminal printed the expected address;
2. select the exact disposable workspace;
3. configure a limited credential without committing it;
4. ask for a read-only inventory with cited file paths;
5. verify the streamed answer refers to real files;
6. confirm no write or command approval was silently granted;
7. save `--dump-config` output and the version record.

Use this first task:

> Inspect this repository without changing files. Summarize its purpose, list its main packages, and cite the files that support each conclusion.

## Installation failure router

| First symptom | Compare first | Do not assume |
|---|---|---|
| package name or repository mismatch | npm metadata and official coordinates | a matching executable name is official |
| exact prerelease returns npm `E404` but GitHub Release exists | npm versions, exact-version query, Git tag, and source manifest | a GitHub release guarantees an npm tarball |
| `dsh` reports an unexpected version | shell-selected path and global/project package tree | reinstalling changed the selected binary |
| source checkout cannot boot | Git revision, pnpm version, and `pnpm run build` | the TypeScript launcher builds missing artifacts |
| global install cannot load a native helper | exact-version project-local A/B | the profile plugin itself is missing |
| UI opens with old behavior | executable identity plus source build freshness | the current source files produced the browser bundle |
| clean install still loads old settings | `DSH_HOME` and profile patches | executable installation owns all runtime state |
| wrong files appear in the Agent | launch directory and selected workspace | the profile name determines the workspace |

## Reproduction record

```text
Official package metadata checked at:
Requested package version:
Executable path:
Reported dsh version:
Source remote and commit, if applicable:
Dirty source diff present: yes / no
Node and package-manager versions:
DSH_HOME:
Profile name:
Resolved config captured: yes / no
Launch directory:
Selected workspace realpath:
First failing command and complete first error:
Exact-version project-local comparison result:
```

## Official sources

- [Official DeepSeek Harness README at rc.2](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28/README.md)
- [Official CLI README at rc.2](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28/apps/cli/README.md)
- [CLI profile, plugin, and source-execution contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28/apps/cli/reference/README.md)
- [Official CLI package manifest](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28/apps/cli/package.json)
- [Official rc.2 release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.1-rc.2)
- [Official alpha.1 GitHub Release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.2-alpha.1)
- [Official alpha.1 CLI manifest](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/apps/cli/package.json)
- [npm publication gap report #4833](https://github.com/deepseek-ai/deepseek-harness/discussions/4833)
