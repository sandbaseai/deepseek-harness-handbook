---
title: Fix ERR_PNPM_ADDING_TO_ROOT When Adding a DeepSeek Harness Plugin
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-19
---

# Fix `ERR_PNPM_ADDING_TO_ROOT` when adding a plugin

Use this guide when a documented DeepSeek Harness plugin command initializes a profile and then stops before installing anything:

```text
dsh: initialized profile web at .../profiles/web
ERR_PNPM_ADDING_TO_ROOT Running this command will add the dependency to the workspace root
dsh: pnpm failed in profile directory .../profiles/web
```

This error is about the profile's package-manager boundary, not the plugin's runtime behavior.

## Why the documented command can fail

DeepSeek Harness stores each profile as a package directory. In rc.7, profile initialization creates:

- a private `package.json` containing dependencies and the ordered `dsh.profile.bundles` list;
- a user `cordis.patch.yml` layer;
- a `pnpm-workspace.yaml` whose only package is `.`.

The plugin subcommand initializes that directory, then launches `pnpm` with the profile directory as its working directory. It forwards the remaining arguments without adding a workspace-root flag. Therefore:

```sh
dsh plugin --profile web add example-plugin
```

becomes the equivalent of `pnpm add example-plugin` while already standing at a pnpm workspace root. pnpm versions that enforce the root-add safeguard reject it and ask for explicit intent.

## Apply the bounded workaround

Use the same DSH-owned profile operation, but explicitly acknowledge the workspace root:

```sh
dsh plugin --profile web add -w <package>
```

Keep `-w` after `add`, where it is forwarded to pnpm. Replace `<package>` only with a package identity you have already verified. The flag does not audit or sandbox the package; it only resolves pnpm's target ambiguity.

Do not bypass the guard globally with `ignore-workspace-root-check=true`. That changes behavior for unrelated workspaces and hides whether a future command targeted the intended package root.

## Prove the complete install

A zero exit from pnpm is necessary but not sufficient. Verify all four boundaries:

1. **Dependency:** the selected profile's `package.json` lists the expected package and version range.
2. **Materialization:** the package resolves from that profile's installation boundary.
3. **Bundle activation:** a package declaring `dsh.bundle` appears in `dsh.profile.bundles`; a plain dependency should not.
4. **Composition:** `dsh --profile web --dump-config` succeeds and shows only the intended new layer.

Then start the profile in a disposable workspace and exercise one bounded capability. Keep the pre-install manifest and lockfile diff so removal can be verified.

## Separate nearby failures

| Signature | Boundary | Next action |
|---|---|---|
| `ERR_PNPM_ADDING_TO_ROOT` | explicit workspace-root target | retry the same reviewed package with `add -w` |
| `pnpm not found on PATH` | Host executable resolution | install or expose pnpm to the DSH process |
| blocked `prepare` / `allowBuilds` hint | dependency build policy | review the package and add only the exact printed key to the profile workspace file |
| package installs but no bundle is activated | package manifest contract | inspect whether the package declares `dsh.bundle.patch` |
| profile fails after activation | runtime composition | restore the manifest/lockfile and use the plugin recovery runbook |

A `url.parse()` deprecation warning can appear near the root-add error. Treat the explicit nonzero pnpm error as the controlling failure unless evidence shows otherwise.

## Durable repair shape

The DSH CLI owns the profile directory and its workspace shape, so it should encode that intent rather than require every plugin author to document an implementation flag. A narrow repair can add `--workspace-root` to profile-root mutation verbs before forwarding to pnpm, while leaving diagnostic commands and user-supplied path specs unchanged.

Regression coverage should use an affected pnpm release and the newest supported release:

- initialize a fresh profile;
- run the documented command without requiring a user-supplied `-w`;
- assert a zero exit and the expected dependency;
- reconcile a bundle into `dsh.profile.bundles`;
- confirm `--dump-config` succeeds;
- remove the package and confirm the bundle layer disappears;
- preserve relative `file:` and local-checkout anchoring.

## Source boundary

Verified against DeepSeek Harness `0.1.0-rc.7` commit `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca` and the upstream pnpm-version matrix in Discussion #3405.

- [Upstream reproduction and compatibility matrix #3405](https://github.com/deepseek-ai/deepseek-harness/discussions/3405)
- [Plugin command forwarding](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/apps/cli/src/plugin.ts)
- [Profile workspace initialization](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/boot/app-boot/src/profile.ts)
- [CLI help example](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/apps/cli/src/args.ts)
- [Official profile plugin-management contract](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/apps/cli/reference/README.md)
- [Plugin installation and recovery](plugin-install-recovery.md)
