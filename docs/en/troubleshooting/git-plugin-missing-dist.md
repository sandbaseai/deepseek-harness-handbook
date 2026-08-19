---
title: Recover a Git Plugin Missing Its Built Export
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
---

# Recover a Git plugin that installed without `dist/`

If DeepSeek Harness stops booting after a Git-hosted plugin install and reports `ERR_MODULE_NOT_FOUND` for `dist/dsh.js`, `lib/index.js`, or another declared export, the package was materialized but its runtime artifact was not.

This is not a missing Harness installation and not the same as `ERR_PNPM_ADDING_TO_ROOT`. The broken plugin has already joined the profile composition, so its missing loader entry can stop the whole Host before Web opens.

> [!CAUTION]
> Do not make `--ignore-scripts` the permanent fix. It suppresses untrusted install code, but a source-only Git dependency whose exports point at generated files cannot run without a successful, reviewed build.

## Recognize the four-stage failure

```text
Git source materialized
  → package declares dsh.bundle
  → bundle adds loader entry such as graph-memory/dsh
  → package export points to absent dist/dsh.js
  → plugin tree failed to load; Host exits nonzero
```

Two community reports reproduce this pattern with different packages: `graph-memory` lacked `dist/dsh.js`; `dsh-agent-teams` lacked `lib/index.js` and `lib/client.js`. In both cases, removing the bundle restored startup.

## Separate three neighboring states

| Evidence | State | Correct boundary |
|---|---|---|
| `pnpm` exits nonzero and prints an `allowBuilds` key | build was blocked | review the package and allow the exact build identity, then rerun install |
| install succeeds under `--ignore-scripts`, but declared export is absent | build was bypassed | remove the plugin; do not boot or enable it |
| export exists, but importing it throws | runtime/plugin defect | preserve the first stack and test the exact artifact in isolation |

`allowBuilds` and `--ignore-scripts` are not equivalent. The first permits one reviewed dependency identity to run its install build. The second prevents scripts from producing required artifacts.

## Preserve evidence before recovery

Record the following without copying credentials:

```text
Harness version and platform
profile name
exact install command and exit code
plugin package name, Git URL, and commit
package.json scripts, exports, and dsh.bundle declaration
pnpm-workspace.yaml allowBuilds entry
presence of dist/ or lib/ export targets
first plugin-tree stack trace
profile package.json and lockfile diff
```

Do not repeatedly restart the Host. The first import error is the useful boundary; later UI connection failures are downstream symptoms.

## Restore the profile without booting it

Plugin management is a separate CLI path and does not require the Web profile to boot. Remove the dependency through the same profile owner:

```sh
dsh plugin --profile web remove <package-name>
```

The CLI forwards the command to pnpm in the profile directory and, after a successful command, reconciles `dsh.profile.bundles` against installed dependencies. Verify both dependency and composition state:

```sh
dsh plugin --profile web why <package-name>
dsh --profile web --dump-config
dsh --profile web
```

Expected evidence:

1. `why` no longer resolves the removed dependency;
2. the removed bundle does not appear in `dsh.profile.bundles` or the config dump;
3. Web reaches its listening state without the previous import error.

If the remove command itself fails, stop all Harness writers, back up the profile directory, and use pnpm from that exact profile directory. Do not delete the whole Harness home or unrelated Sessions.

## Reinstall only after proving an installable artifact

Choose one of these honest distribution paths:

### Published package with built files

Prefer a registry or tarball artifact that already contains every exported runtime file. Inspect the exact archive before installation:

```sh
npm pack <package>@<version> --dry-run
```

Confirm the declared `exports` targets, bundle patch, and runtime files are present.

### Git source with a reviewed `prepare`

If the plugin intentionally builds from Git source:

1. pin the dependency to a commit;
2. inspect `prepare`, transitive scripts, and build inputs;
3. add only the exact key pnpm printed under `allowBuilds` in the selected profile's `pnpm-workspace.yaml`;
4. rerun the original `dsh plugin --profile ... add ...` command without `--ignore-scripts`;
5. verify every export target before boot.

On Windows, a `prepare` script that invokes `./scripts/setup-hooks.sh` may fail before compilation because it assumes a POSIX shell. The durable fix belongs in the plugin: use a cross-platform build script or publish prebuilt artifacts. Bypassing the script merely converts a visible install failure into a later boot failure.

### Local checkout for diagnosis

Build a pinned checkout in an isolated workspace, run its tests, and inspect the generated tree before installing a local path. A local success is diagnostic evidence, not proof that the Git or registry distribution contains the same bytes.

## Why the whole Host exits

In rc.7, `dsh plugin` is a thin pnpm forwarder followed by bundle reconciliation. Reconciliation checks whether the installed package declares a bundle; it does not validate every module export referenced by that bundle.

At application boot, the composed loader tree mounts as one fail-loud unit. A parse, resolution, import, or activation failure becomes `plugin tree failed to load`, disposes the root, and exits nonzero. That behavior protects the operator from running a partially composed capability graph, but it also means one broken community bundle can make Web unavailable.

Plugin isolation would require an explicit product policy: which rows may fail independently, how dependent services are disabled, and how the degraded state is surfaced. Silently skipping an arbitrary failed Host plugin could be more dangerous than a loud stop.

## Publisher release gate

Plugin authors should verify the bytes consumers actually install:

1. every `exports` target exists in `npm pack --dry-run` output;
2. `dsh.bundle.patch` exists and references valid loader entries;
3. a clean Git install runs `prepare` on Linux, macOS, and Windows—or the package ships built files;
4. install without scripts fails before activation when artifacts are generated-only;
5. install, `--dump-config`, boot, remove, and second boot all pass in a disposable profile;
6. the Git commit, package version, archive checksum, and generated files are recorded.

## Operator regression gates

1. a blocked build remains an install failure, not a successful activation;
2. a bypassed build is detected by checking declared exports;
3. the first missing module path identifies the package boundary;
4. removal works without booting the broken profile;
5. successful removal reconciles the bundle list;
6. unrelated in-box bundles remain unchanged;
7. a clean config dump excludes the removed package;
8. a clean boot restores Web;
9. reinstall uses a pinned and inspected artifact;
10. all exported runtime targets exist before boot;
11. Windows build scripts avoid shell-specific assumptions;
12. cleanup removes the test dependency and preserves unrelated Sessions.

## Source evidence

- [Two-package community reproduction #3154](https://github.com/deepseek-ai/deepseek-harness/discussions/3154)
- [Pinned plugin forwarder and reconciliation](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/apps/cli/src/plugin.ts)
- [Pinned CLI plugin-management contract](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/apps/cli/reference/README.md#plugin-management)
- [Pinned profile composition](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/boot/app-boot/src/profile.ts)
- [Pinned fail-loud application boot](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/boot/app-boot/src/index.ts)
- [Official package and install tutorial](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/docs/user/develop/basic/publish.md)
