---
title: Recover a duplicated DeepSeek Harness core runtime
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
---

# Recover when a second core package copy breaks every tool call

Use this runbook when DeepSeek Harness boots, tool-free chat works, but the first native or MCP tool call fails with:

```text
dsh: UNKNOWN: Cannot read properties of undefined (reading 'prepare')
```

The failure can appear after installing a community plugin with plain npm inside a profile. npm may auto-install peer dependencies, materializing a second copy of `@deepseek-ai/dsh-tools`, `dsh-agent`, `dsh-session`, or adjacent core packages beneath the profile. The running module graph then contains two physical instances of types and identity-bearing constants that must be singletons.

## Why plain chat can pass

The rc.8 tool scheduler is stored under this package-local key:

```ts
export const TOOL_RUNTIME_SCHEDULER: unique symbol = Symbol('@deepseek-ai/dsh-tools.scheduler')
```

The Agent loop imports that symbol and reads:

```ts
ctx.tools[TOOL_RUNTIME_SCHEDULER].prepare(...)
```

Two physical module instances create two different symbols even when package names, versions, and source bytes match. If the ToolRuntime service registers its scheduler under symbol A while the Agent loop asks with symbol B, the property is undefined and `.prepare` throws on the first tool call. Model-only turns never cross this boundary, so boot and chat are weak health checks.

This is a module-identity split, not ordinary semver incompatibility and not a teardown race.

## Preserve the two resolution paths

Before changing the profile, record:

```text
dsh version and executable path:
DSH_HOME and profile directory:
profile package.json and lockfile:
package manager and install command used:
first complete stack with prepare failure:
native tool control result:
MCP tool control result:
resolved dsh-tools path from the profile:
resolved dsh-tools path from the DSH installation:
realpath, version, and file digest for both:
dependency tree for every duplicated @deepseek-ai core package:
```

Run resolution probes from both anchors. The exact command depends on ESM exports, but the result must be a physical entry-module path, not only a package version string. Canonicalize symlinks before comparison; pnpm store paths and the rc.8 fallback deliberately use links.

Useful read-only inventory:

```bash
pnpm why --recursive @deepseek-ai/dsh-tools
npm ls --all @deepseek-ai/dsh-tools
```

Also inspect the profile-local `node_modules/@deepseek-ai` and the shared `$DSH_HOME/profiles/node_modules` fallback. A duplicate nested inside a third-party plugin may not appear at the profile root.

## Understand the intended rc.8 topology

rc.8 creates profile workspace config with `autoInstallPeers: false`. It also maintains a flat `$DSH_HOME/profiles/node_modules` fallback containing links to packages owned by the DSH installation and its bundles. Node's normal parent walk lets out-of-tree plugins reuse that single core closure without the profile package manager installing in-box packages again.

A third-party profile dependency should own its genuinely external dependencies. Its DSH runtime contracts should be compatible peers resolved from the Host closure. Installing missing core peers into the profile may silence the package manager while splitting runtime identity.

## Recover transactionally

1. Stop every DSH process using the profile.
2. Copy the profile manifest, patch, lockfile, and package-manager configuration to a timestamped recovery directory.
3. Inventory third-party plugin packages that must remain.
4. Recreate the profile dependency closure with the supported DSH/pnpm workflow and `autoInstallPeers: false`.
5. Install only the reviewed out-of-tree plugins; do not add DSH core packages as profile dependencies.
6. Confirm each identity-bearing `@deepseek-ai/*` core resolves to one canonical physical instance.
7. Dump and review the effective composition.
8. Boot one isolated Host and run a model-only turn, one native tool, and one MCP tool.
9. Stop and boot again to prove the repair survives restart.

Do not delete the only lockfile or profile manifest without a preserved copy. Do not assume removing the top-level duplicate is enough; nested copies and another lockfile can rematerialize it.

## Avoid misleading fixes

- Upgrading only the duplicated copy can make the split harder to diagnose.
- Adding every missing peer satisfies npm metadata but violates Host singleton ownership.
- Replacing `Symbol()` with `Symbol.for()` may hide this one failure while leaving duplicated service classes, context augmentation, `instanceof`, registries, and event identity split.
- Optional chaining around the scheduler turns a deterministic failure into silently skipped tools.
- Retrying the same Agent turn cannot change Node's resolved module graph.
- Parsing the late error as a teardown issue ignores that tool dispatch is the first consumer of the mismatched symbol.

## Boot-time invariant design

A useful invariant should report package name, version, importing plugin, logical resolution anchor, canonical realpath, and expected Host realpath. Compare identity-bearing core packages, not every transitive utility. Fail before Agent creation when two non-equivalent realpaths are live.

Symlinks require care: two paths can canonicalize to the same file and are safe, while identical versions at two physical paths remain unsafe. An invariant should also catch nested plugin copies and explain the supported reinstall path without deleting user configuration automatically.

## Regression contract

- supported profile installation resolves one physical core closure;
- community plugin peers reuse the Host copy with auto-install disabled;
- plain npm auto-peer duplication is detected before Session creation;
- equal-version duplicate physical copies fail with both paths named;
- symlink aliases to one canonical file do not false-positive;
- a nested duplicate is detected;
- model-only, native-tool, MCP-tool, and Code Mode probes cover different consumers;
- failed boot leaves the profile files unchanged;
- reinstall preserves reviewed plugin versions and user patch;
- restart does not rematerialize duplicates; and
- diagnostics never disclose credentials or full private paths unnecessarily in shared reports.

## Primary evidence

- [Official duplicate-core report #3516](https://github.com/deepseek-ai/deepseek-harness/discussions/3516)
- [rc.8 package-local scheduler symbol](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/core/tools/src/index.ts)
- [rc.8 Agent-loop scheduler lookup](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/core/agent-loop/src/tool-calls.ts)
- [rc.8 profile fallback and package-manager configuration](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/boot/app-boot/src/profile.ts)

