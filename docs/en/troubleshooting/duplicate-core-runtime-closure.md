---
title: Recover a duplicated DeepSeek Harness core runtime
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-27
upstream_ref: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Recover when a second core package copy breaks every tool call

Use this runbook when DeepSeek Harness boots, tool-free chat works, but a native or MCP tool call fails with:

```text
dsh: UNKNOWN: Cannot read properties of undefined (reading 'prepare')
```

The static failure can appear after installing a community plugin with plain npm inside a profile. npm may auto-install peer dependencies, materializing a second copy of `@deepseek-ai/dsh-tools` beneath the profile. The running module graph then contains two physical instances of the package-local scheduler key. A superficially similar failure can instead begin after earlier tools succeeded in the same Host process; route that timeline separately rather than calling every `prepare` crash a static duplicate.

## Why plain chat can pass

The rc.8 and rc.2 tool scheduler is stored under this package-local key:

```ts
export const TOOL_RUNTIME_SCHEDULER: unique symbol = Symbol('@deepseek-ai/dsh-tools.scheduler')
```

The Agent loop imports that symbol and reads:

```ts
ctx.tools[TOOL_RUNTIME_SCHEDULER].prepare(...)
```

Two physical module instances create two different symbols even when package names, versions, and source bytes match. If the ToolRuntime service registers its scheduler under symbol A while the Agent loop asks with symbol B, the property is undefined and `.prepare` throws on the first tool call. Model-only turns never cross this boundary, so boot and chat are weak health checks.

This error proves that the scheduler lookup returned `undefined`. A duplicate or independently evaluated `@deepseek-ai/dsh-tools` module is a direct mechanism, but the error string alone does not prove how that split arose.

## Classify the timeline before changing packages

| First failing call | Strongest current hypothesis | Discriminating evidence |
|---|---|---|
| First tool call in a fresh Host process | Static physical duplicate or incompatible module closure | Resolve `@deepseek-ai/dsh-tools` from Host and plugin/profile anchors |
| First tool call after relaunch, but late in a resumed Session | Static defect in the new process, not a mid-Session mutation | Compare process start time with the last successful tool event |
| Tool calls succeeded earlier in the same process, then all fail | Runtime generation/HMR/recomposition defect | Prove one PID, module generation and plugin lifecycle edges around the first failure |
| Restart restores tools without changing disk | Process-local bad state is likely; static duplicate is not established | Repeat under the same on-disk closure and capture load/generation identity |
| One tool fails but native and MCP controls succeed | Tool-specific failure, not the shared scheduler slot | Compare paired `tool/call` and `tool/result` across tool families |

A Session turn number is not a process timeline. A failure at turn 14 may still be the first tool call after the Host was relaunched and the Session resumed. Record PID/start time or a durable boot generation before describing the failure as mid-process.

Likewise, extra profile-local `@deepseek-ai/dsh-*` packages are evidence of closure drift, but only a second evaluation of the module that creates `TOOL_RUNTIME_SCHEDULER` directly creates a different key. Finding `dsh-credentials`, `dsh-home-paths`, or `dsh-typert-protocol` at another version does not by itself prove the scheduler-symbol mechanism. Follow their dependency edges and resolved imports before assigning causality.

## Preserve the two resolution paths

Before changing the profile, record:

```text
dsh version and executable path:
DSH_HOME and profile directory:
profile package.json and lockfile:
package manager and install command used:
first complete stack with prepare failure:
Host PID, start time, and boot/profile generation:
last successful tool/call and paired tool/result in that PID:
first failing tool/call and missing/present tool/result:
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

For a mid-process transition, package inventory is not enough. Capture:

- plugin mount, update, disable, disposal, and HMR events around the first failure;
- the exact PID and module-generation identity before and after the transition;
- whether ToolRuntime itself was replaced while an Agent loop retained an older imported key;
- a control Session created after the transition in the same process;
- the same controls after a restart without changing disk.

Do not run a whole-filesystem search from an Agent whose tool scheduler is already broken. Use an operator shell outside DSH and bound it to the installation and profile roots.

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

If earlier tool calls succeeded in the same proven PID, restart is a valid containment step but not a root-cause repair. Preserve logs and lifecycle evidence first, restart once, and test the identical on-disk closure. If restart alone repairs the failure, investigate plugin reload/recomposition ownership before deleting packages.

Do not delete the only lockfile or profile manifest without a preserved copy. Do not assume removing the top-level duplicate is enough; nested copies and another lockfile can rematerialize it.

## Avoid misleading fixes

- Upgrading only the duplicated copy can make the split harder to diagnose.
- Adding every missing peer satisfies npm metadata but violates Host singleton ownership.
- Replacing `Symbol()` with `Symbol.for()` may hide this one failure while leaving duplicated service classes, context augmentation, `instanceof`, registries, and event identity split.
- Optional chaining around the scheduler turns a deterministic failure into silently skipped tools.
- Retrying the same Agent turn cannot change Node's resolved module graph.
- Parsing the late error as a teardown issue ignores that tool dispatch is the first consumer of the mismatched symbol.
- Treating unrelated version-drifted core packages as proof of a second scheduler symbol skips the required import-resolution edge.
- Disabling one plugin and restarting changes both plugin composition and process generation; it identifies a useful trigger boundary, not which change repaired the slot.

## Protect the damaged Session

The failing call may leave a durable `tool/call` without a matching `tool/result`. The current crash path then closes the step and turn with an error. Some providers reject a later request when an assistant tool call is not followed by the expected tool response.

Do not repeatedly retry the same damaged tail. Preserve the Session log, then use the supported copy/new-Session recovery path so the next provider request has balanced history. Any automatic repair must append a typed synthetic outcome such as “tool not started” only when the runtime can prove execution never crossed the scheduler boundary; it must not invent a successful result or erase the original event.

Verify recovery at two levels:

1. runtime: one native and one MCP tool settle with `tool/result`;
2. history: the copied/resumed Session reaches the provider without an orphaned tool call.

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
- a fresh-process first-call failure is distinguished from a proven mid-process transition;
- unrelated core-package drift is reported as risk evidence, not scheduler-symbol proof;
- lifecycle telemetry identifies the ToolRuntime and Agent-loop generations;
- restart-only recovery remains classified as containment until the generation defect is found;
- an orphaned `tool/call` recovery preserves the original event and appends only a truthful typed outcome; and
- diagnostics never disclose credentials or full private paths unnecessarily in shared reports.

## Primary evidence

- [Official duplicate-core report #3516](https://github.com/deepseek-ai/deepseek-harness/discussions/3516)
- [Official first-call and mid-process evidence #4601](https://github.com/deepseek-ai/deepseek-harness/discussions/4601)
- [Official rc.2 scheduler lookup report #4667](https://github.com/deepseek-ai/deepseek-harness/discussions/4667)
- [rc.8 package-local scheduler symbol](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/core/tools/src/index.ts)
- [rc.8 Agent-loop scheduler lookup](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/core/agent-loop/src/tool-calls.ts)
- [rc.8 profile fallback and package-manager configuration](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/boot/app-boot/src/profile.ts)
- [rc.2 package-local scheduler symbol](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/core/tools/src/index.ts)
- [rc.2 Agent-loop scheduler lookup](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/core/agent-loop/src/tool-calls.ts)
