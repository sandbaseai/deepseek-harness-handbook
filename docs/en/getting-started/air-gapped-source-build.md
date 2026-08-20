---
title: Build DeepSeek Harness rc.8 in an air-gapped environment
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
---

# Build rc.8 offline without losing source provenance

Use this guide when an offline rc.8 source build stops at:

```text
Error: Command failed: git rev-parse HEAD
at repositoryCommitHash (.../scripts/client-build-environment.ts:49:29)
```

The failure occurs before `build:lib` or `build:web`. It does not prove that pnpm could not resolve an offline dependency. The rc.8 root build first embeds a source identity in browser artifacts and writes a build-environment record. It resolves that identity from `DSH_CLIENT_COMMIT_HASH` when explicitly supplied; otherwise it calls Git in the repository root.

An extracted source snapshot with no `.git` directory therefore fails even when every package is already cached. Git being installed is insufficient: `git rev-parse HEAD` also needs a valid checkout and reachable `HEAD`.

## Keep four offline boundaries separate

| Boundary | Required evidence | Typical failure |
|---|---|---|
| source provenance | verified tag/commit, archive or bundle digest | `git rev-parse HEAD` exits 128 |
| dependency closure | lockfile, exact pnpm, populated store, native packages | offline resolution or lifecycle failure |
| build environment | Node range, public `DSH_CLIENT_*` values | unsupported runtime or non-reproducible browser bytes |
| artifact identity | build record plus artifact digest | later gate rejects stale or mismatched outputs |

The #3510 environment uses Node 25.1.0 and pnpm 11.7.0. Those values satisfy rc.8's declared Node range (`^22.19.0 || >=24.0.0`) and exact `packageManager` (`pnpm@11.7.0`). The reported stack reaches the new rc.8 commit-resolution step, so changing Node or pnpm is not the first repair for that signature.

## Preferred transfer: preserve Git metadata

On a connected, trusted staging machine:

```bash
git clone --filter=blob:none https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
git fetch --tags --force
git checkout --detach dsh-v0.1.0-rc.8
git rev-parse HEAD
git status --porcelain
git bundle create ../deepseek-harness-rc8.bundle dsh-v0.1.0-rc.8
```

Require commit `141eb6fef83422698aef7a981029e843e8161534` and an empty status. Hash the bundle with the organization's approved SHA-256 tool, transfer both bundle and recorded digest through the controlled media path, verify the digest offline, then:

```bash
git clone deepseek-harness-rc8.bundle deepseek-harness
cd deepseek-harness
git checkout --detach dsh-v0.1.0-rc.8
git rev-parse HEAD
```

This keeps the source identity independently queryable and makes the default `pnpm run build` path work without network access.

## Supported fallback for a verified metadata-free snapshot

rc.8 explicitly accepts `DSH_CLIENT_COMMIT_HASH` before attempting Git. Only use this path when the snapshot has already been authenticated as the exact commit. Never insert a convenient or invented hash merely to make the build green.

PowerShell:

```powershell
$env:DSH_CLIENT_COMMIT_HASH = '141eb6fef83422698aef7a981029e843e8161534'
pnpm run build
```

Windows Command Prompt:

```bat
set DSH_CLIENT_COMMIT_HASH=141eb6fef83422698aef7a981029e843e8161534
pnpm run build
```

POSIX shell:

```bash
export DSH_CLIENT_COMMIT_HASH=141eb6fef83422698aef7a981029e843e8161534
pnpm run build
```

The function accepts 7–40 hexadecimal characters and embeds the lowercase seven-character prefix. Prefer the full commit in the transfer manifest and environment so human audit evidence stays unambiguous.

## Prepare the dependency closure while connected

Use the exact rc.8 lockfile and pnpm version. On a staging host matching the offline OS and architecture:

1. enable or install pnpm 11.7.0 through the approved toolchain;
2. check out the exact source commit;
3. populate the pnpm store from the lockfile;
4. perform a clean frozen-lockfile install and complete build;
5. preserve the store, lockfile, patches, native package artifacts, and build log;
6. scan and hash the transfer set; and
7. rehearse installation with networking disabled before delivery.

On the offline host, point pnpm at the transferred store and require offline, frozen resolution. Do not copy only `node_modules` from another OS or architecture. rc.8 includes platform-specific native closures such as `node-pty`, Koffi, and custom-loader packages.

Exact store transport commands depend on the organization's pnpm store topology and media policy. Record `pnpm store path`, OS, architecture, Node, pnpm, lockfile digest, and every allowed lifecycle script rather than assuming a cache directory is portable.

## Verify the result

A successful exit is not the whole acceptance test. Require:

```text
source commit: 141eb6fef83422698aef7a981029e843e8161534
source transfer SHA-256:
pnpm-lock.yaml SHA-256:
Node version:
pnpm version: 11.7.0
offline install command and exit:
build command and exit:
.dsh-build/client-build-environment.json present:
recorded DSH_CLIENT_COMMIT_HASH: 141eb6f
recorded artifact fileCount and SHA-256:
dsh version:
Web boot/listen result:
one fresh Session result:
```

The build record binds the selected public client environment to a digest of the generated Web and client artifacts. Preserve it with the artifacts; do not reuse a record after editing or partially rebuilding outputs.

## Unsafe shortcuts

- Do not initialize a new Git repository and make a synthetic commit; it misstates upstream provenance.
- Do not set the hash to `0000000` or a random value.
- Do not bypass build-record validation or edit generated browser assets.
- Do not run a non-frozen install that silently changes the dependency graph.
- Do not transfer credentials inside the pnpm store, shell history, build environment, or client-prefixed variables.
- Do not call an online build “air-gapped” merely because the final Host has no egress.

## Regression contract for upstream

- a real rc.8 Git checkout resolves and embeds its exact HEAD;
- a verified non-Git source tree builds with explicit `DSH_CLIENT_COMMIT_HASH`;
- missing Git metadata and missing explicit identity fail with an actionable message;
- malformed explicit hashes fail before artifacts are written;
- the build record contains the selected seven-character commit prefix;
- artifact mutation invalidates the recorded digest;
- official-profile gates require the exact public environment;
- no secret-like non-client variable is embedded;
- offline frozen installation performs no registry request; and
- Windows PowerShell, Command Prompt, and POSIX environment paths are tested.

## Primary evidence

- [Official offline rc.8 report #3510](https://github.com/deepseek-ai/deepseek-harness/discussions/3510)
- [rc.8 commit-resolution implementation](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/scripts/client-build-environment.ts)
- [rc.8 root build orchestration](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/scripts/build.ts)
- [rc.8 root runtime and pnpm contract](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/package.json)

