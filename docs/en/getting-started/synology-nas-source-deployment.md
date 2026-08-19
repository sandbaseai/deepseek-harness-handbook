---
title: Run DeepSeek Harness on a Synology NAS
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-19
upstream_revision: 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
---

# Run DeepSeek Harness on a Synology NAS without breaking workspace resolution

DeepSeek Harness rc.7 can run from source on a Linux x64 Synology NAS, but a source checkout is a pnpm monorepo—not a relocatable `bin.ts` script. Treat Node, pnpm, workspace links, native addons, launch directory, and Web exposure as separate gates.

For normal use, prefer the published launcher:

```sh
npx @deepseek-ai/dsh web
```

Use the source path when you need to inspect or modify the repository and accept developer-preview churn.

> [!WARNING]
> Do not expose an unauthenticated Agent control plane with a raw `0.0.0.0:3080` bind. The Web Host can execute tools against NAS files. Keep loopback and use an authenticated tunnel or reverse proxy with TLS and access control.

## Preflight the execution world

Run every check as the same non-root service account that will own the Host:

```sh
uname -srm
node --version
node -p "process.platform + ' ' + process.arch"
corepack --version
pnpm --version
command -v node pnpm git
```

The pinned root manifest requires Node `^22.19.0 || >=24.0.0` and declares `pnpm@11.7.0`. Linux x64 with glibc matches an intended development path; do not assume every Synology model, DSM release, container image, or musl userland has the same ABI.

Use Corepack to honor the repository package-manager declaration rather than installing an unrelated global pnpm version:

```sh
corepack enable
corepack prepare pnpm@11.7.0 --activate
```

## Install from the repository root

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

The root script invokes `node --import tsx/esm apps/cli/src/bin.ts`. That bare `tsx/esm` specifier is resolved through the workspace installation. Running `node --import tsx/esm` from an arbitrary directory or hardcoding a path under `.pnpm` changes the module-resolution anchor and is not equivalent.

Do not begin with `pnpm install --ignore-scripts`. Native packages such as `node-pty`, Koffi, and esbuild may require their supported install/build flow. A later sequence of guessed `pnpm rebuild` commands does not prove that every required package completed its lifecycle.

Architecture-specific workspace packages can produce expected “unsupported platform” notices for the other CPU. Distinguish a skipped foreign artifact from failure to install the artifact for the current `linux x64` execution world.

## Prove each layer before starting Web

```sh
pnpm --version
pnpm list -r --depth -1
pnpm dsh --version
pnpm dsh --help
pnpm run build
pnpm dsh web
```

Interpret the boundary that fails:

| First failure | Likely boundary |
|---|---|
| Node engine refusal or missing zstd export | Node version actually executed |
| native addon load / ABI error | platform artifact, install script, or Node ABI |
| workspace package exists but cannot be imported | incomplete or wrong-root pnpm linking |
| `tsx` cannot be resolved outside the checkout | wrapper changed cwd or resolution anchor |
| `--expose-internals` required | source/HMR loader capability |
| URL prints but another device cannot connect | loopback bind or network topology |

Do not use `--shamefully-hoist` as the default repair for a missing workspace link. It changes dependency visibility and can hide a package-declaration defect. Preserve `pnpm-lock.yaml`, verify the current working directory, and reinstall from the root with the declared pnpm version. If reinstalling, keep the first lifecycle failure rather than the final cascade.

## Create a cwd-stable wrapper

If a source checkout must be callable from any directory, delegate back to the root script:

```sh
#!/bin/sh
set -eu

DSH_SOURCE_ROOT=/volume1/docker/deepseek-harness
cd "$DSH_SOURCE_ROOT"
exec pnpm dsh "$@"
```

Install the wrapper with a root-owned, world-executable mode only after reviewing the path:

```sh
sudo install -o root -g root -m 0755 ./dsh-wrapper /usr/local/bin/dsh
```

Do not embed API keys in it. The Host's working directory is also meaningful to workspace and environment resolution, so the explicit `cd` is part of the contract.

If this exact source revision reports that the HMR service requires `--expose-internals`, first use the dedicated [source-checkout HMR diagnosis](../troubleshooting/hmr-expose-internals-source-checkout.md). Adding a global `NODE_OPTIONS` flag can affect every Node child and should not become an unexplained permanent requirement.

## Access the NAS safely

The default `127.0.0.1:3080` bind is deliberately local. From another machine, prefer an SSH tunnel:

```sh
ssh -N -L 3080:127.0.0.1:3080 nas-user@nas.example
```

Then browse `http://127.0.0.1:3080` locally. For persistent multi-user access, put an authenticated TLS reverse proxy in front of the loopback listener and apply network allowlists. See the [remote Web control-plane guide](../troubleshooting/remote-web-secure-context.md).

A remote or SSH-launched Host should use the browse directory picker, not a native dialog on an unattended NAS. The automatic chooser uses bind host, SSH markers, display availability, and platform facts to select the backend at boot.

## Run it as a service only after the smoke test

The service should define:

- one dedicated non-root user;
- an explicit source root and working directory;
- an explicit `DSH_HOME` on persistent storage;
- a fixed Node/pnpm toolchain path;
- loopback Web binding;
- restart limits and captured stdout/stderr;
- graceful termination before upgrades;
- one writer per Session root.

Do not daemonize an unverified wrapper. First start it interactively, create a disposable workspace, run one bounded read-only Agent task, restart the Host, and prove the Session remains readable.

## Upgrade without mixing artifacts

```sh
cd /volume1/docker/deepseek-harness
git status --short
git fetch --tags origin
git switch --detach <reviewed-commit>
corepack prepare pnpm@11.7.0 --activate
pnpm install --frozen-lockfile
pnpm run build
pnpm dsh --version
```

Keep a known-good commit and its matching lockfile. Do not reuse built output from one revision with workspace links from another. Stop the service before replacing the checkout, then smoke-test before restoring remote access.

## Verification gates

1. the service user resolves the intended Node and pnpm binaries;
2. `process.platform` and `process.arch` match the installed artifacts;
3. installation runs at repository root without hoisting overrides;
4. the full build succeeds before Web starts;
5. the wrapper works from an unrelated directory;
6. no secret is embedded in the wrapper or unit file;
7. Web remains loopback-only behind an authenticated access path;
8. the remote directory picker uses browse mode;
9. one read-only Agent probe completes in a disposable workspace;
10. a restart preserves and reopens the test Session.

## Source evidence

- [Synology Linux x64 field report #3432](https://github.com/deepseek-ai/deepseek-harness/discussions/3432)
- [Official run-from-npm and run-from-source commands](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/README.md)
- [Pinned root engine, package manager, and scripts](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/package.json)
- [CLI entrypoint](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/apps/cli/src/bin.ts)
- [Remote directory-picker selection](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/host/directory-picker-auto/README.md)

