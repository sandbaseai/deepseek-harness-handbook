---
title: Diagnose DeepSeek Harness Plugin Peer Dependency Warnings
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
---

# Diagnose `missing peer` warnings during plugin installation

`dsh plugin --profile web add <plugin>` may print many pnpm peer warnings for Cordis, React, or `@deepseek-ai/dsh-*`, followed by a separate ignored-build notice. Do not classify the whole install as either safe or broken from warning count alone.

DeepSeek Harness profiles intentionally do not auto-install peers. The running Host supplies part of the peer surface through a maintained parent fallback so plugins share the same runtime services. Other warnings can still identify a real version conflict, a genuinely absent third-party library, or blocked native code.

> [!CAUTION]
> Do not add every warned `@deepseek-ai/*`, Cordis, React, or service-definition package directly to the profile. A nearer duplicate can shadow the Host-owned singleton and split service identity even though the warnings disappear.

## Understand the three module layers

```text
$DSH_HOME/profiles/web/node_modules
  out-of-tree plugin and its ordinary dependencies

$DSH_HOME/profiles/node_modules
  Host-maintained flat fallback: app and bundle dependency closure

running dsh installation
  authoritative in-box bundles and shared runtime packages
```

The generated profile workspace uses:

```yaml
packages:
  - .
nodeLinker: hoisted
autoInstallPeers: false
```

Node resolves from the plugin's profile directory upward. When a peer is absent from `profiles/web/node_modules`, resolution can reach `profiles/node_modules`, whose symlinks are healed on each launch from the running installation's dependency and peer-dependency closure.

This is why pnpm can report “missing from this workspace” while the same package is intentionally available to the plugin at runtime.

## Route every warning independently

| Warning evidence | Classification | Action |
|---|---|---|
| Host-owned peer resolves through the maintained fallback and satisfies the requested range | expected profile warning | record it; do not install a duplicate |
| Host-owned peer resolves, but its version does not satisfy the plugin range | Host/plugin compatibility mismatch | use a compatible plugin or Harness version |
| third-party peer does not resolve anywhere in the Host/profile path | genuine missing peer | follow the plugin publisher's declared installation contract |
| two plugin dependencies require incompatible ranges of the same library | dependency conflict | fix or pin at the owning plugin boundary; test an override only as a bounded workaround |
| `Ignored build scripts` or a Git `prepare` failure | build policy | review and allow the exact build identity; this is not a peer warning |
| install succeeds but an exported `dist/` or `lib/` file is absent | missing artifact | remove the bundle and use the [missing build artifact guide](git-plugin-missing-dist.md) |

Package names are not enough to classify a warning. Record the requested semver range, the exact resolved path and version, and which layer owns that copy.

## Collect a minimal evidence bundle

```text
Harness version and installation method
Node and pnpm versions
operating system and architecture
profile name and resolved profile directory
exact plugin spec, version, and commit
complete pnpm warning section and exit code
each peer name and requested range
resolved peer path and actual version
pnpm-workspace.yaml before and after
profile package.json and lockfile diff
first boot or tool error, if any
```

Keep peer warnings, build-policy output, and runtime failures in separate sections. A successful `pnpm` exit proves package-manager completion, not plugin compatibility.

## Prove the Host fallback before ignoring a warning

Run a clean profile boot once so Harness heals its fallback links, then inspect from the exact profile directory. A small Node probe can use that profile manifest as its resolution anchor:

```js
const { createRequire } = require('node:module')
const fromProfile = createRequire('/absolute/path/to/profiles/web/package.json')
console.log(fromProfile.resolve('@deepseek-ai/cordis'))
```

Repeat for the warned package. The result should point either into the selected profile or the maintained `profiles/node_modules` fallback. Then inspect the resolved package's actual manifest version and compare it with the plugin's peer range.

Do not call a warning benign when:

- resolution fails;
- the resolved version misses the requested range;
- the path points to an unexpected duplicate under the plugin;
- the plugin requires a concrete implementation that the Host does not ship;
- runtime service registration or injection fails.

## Keep shared runtime packages single-instance

Cordis services and DSH service definitions depend on shared identity. Installing another copy nearer to the plugin changes ordinary Node resolution precedence. The plugin may then import one package instance while the Host registered services against another.

Symptoms can appear far from installation:

- service injection remains unresolved;
- tools register in one registry but the Agent uses another;
- duplicate service registration throws;
- client and Host contracts disagree;
- removal appears incomplete because two copies remain addressable.

Silencing pnpm is not worth creating this split. Preserve the Host fallback unless a plugin explicitly owns an isolated non-runtime dependency.

## Handle version mismatches honestly

Suppose a plugin requests `@deepseek-ai/dsh-settings@0.1.0-rc.7` peers while the running Host supplies rc.6. Runtime resolution may find a package, but the peer contract is still unsatisfied.

Do not assume injection will make the mismatch safe. Choose one compatible tuple:

1. upgrade Harness to a version supplying the requested peer set;
2. install a plugin release compatible with the current Harness;
3. test a publisher-provided compatibility range;
4. defer the plugin.

Record the entire tuple—Harness artifact, plugin artifact, Node platform, and peer versions—rather than adding isolated rc.7 packages into an rc.6 Host.

## Treat overrides as experiments, not repairs

A pnpm override can force one dependency version, but it does not prove API or ABI compatibility. Before using one:

1. identify which package owns the wrong declaration;
2. inspect both requested ranges and changelogs;
3. verify JavaScript API and native ABI compatibility;
4. apply it only in a disposable profile;
5. test config dump, boot, actual capability, removal, and second boot;
6. open an upstream fix at the plugin that published the inaccurate graph.

The durable repair is a corrected plugin release. A local override is deployment-specific debt that must remain visible.

## Separate ignored build scripts

pnpm's build-policy notice is orthogonal to peer resolution. In rc.7, Git-hosted plugins that ship source usually build through `prepare`. pnpm 10 may block that script and print an exact identity to allow.

Use the profile path printed by DSH, review the dependency and its scripts, add only the exact key pnpm reported under `allowBuilds`, and rerun the original install. Do not copy a generic `onlyBuiltDependencies` list from another pnpm version or authorize packages merely because their names appeared in a discussion.

After a native build, test the real capability—a PTY process, SSH connection in a safe environment, or exact module import—not just the absence of a warning.

## DSH does not overwrite an existing workspace file

At rc.7, `initProfile()` writes `pnpm-workspace.yaml` only when the file is absent. The plugin CLI then forwards arguments to pnpm and reconciles only the profile `package.json` bundle list. It does not rewrite existing workspace YAML fields.

If a manual setting disappears, capture the exact file path and before/after diff. Verify the selected profile, `DSH_HOME`, pnpm behavior, and any external profile manager before attributing the write to DSH.

## Acceptance gates

1. every warning has a requested range and resolved owner;
2. Host-owned peers resolve through the expected fallback;
3. resolved versions satisfy their declared ranges;
4. no duplicate Cordis or DSH service package shadows the Host copy;
5. genuine third-party peers are installed only through the plugin contract;
6. peer conflicts and ignored build scripts remain separate diagnoses;
7. each permitted build identity was reviewed and recorded;
8. native capabilities are exercised after build;
9. config dump contains only the intended bundle changes;
10. the plugin boots and performs one bounded real task;
11. removal restores dependency and bundle state;
12. a second boot proves no duplicate or stale runtime remains.

## Source evidence

- [Community peer-warning investigation #3101](https://github.com/deepseek-ai/deepseek-harness/discussions/3101)
- [Pinned profile workspace and Host fallback implementation](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/boot/app-boot/src/profile.ts)
- [Pinned plugin forwarder and bundle reconciliation](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/apps/cli/src/plugin.ts)
- [Pinned CLI plugin-management contract](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/apps/cli/reference/README.md#plugin-management)
- [Pinned profile fallback tests](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/boot/app-boot/tests/profile.spec.ts)
