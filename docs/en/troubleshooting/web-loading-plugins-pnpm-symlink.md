---
title: Recover Web stuck on Loading plugins in a pnpm source checkout
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
---

# Recover `dsh web` stuck on “Loading plugins…” in a pnpm source checkout

In an rc.8 source checkout, the Host can finish server-side activation and listen successfully while the browser remains on `HARNESS / Loading plugins…` forever. One reported branch is a broken profile module fallback: pnpm workspace packages are symlinked, the fallback walker computes dependency lookup paths from a literal symlink anchor, and transitive client packages never become resolvable from the profile.

This is not a generic “clear the browser cache” symptom. Prove the client graph, bundle endpoints, and fallback links before changing pnpm layout or the profile.

## Recognize the exact branch

The reported rc.8 signature is:

```text
source checkout built with pnpm isolated node_modules
Host boot progress reaches 100 percent
browser stays on Loading plugins
browser console has no decisive application exception
one or more /plugins/@deepseek-ai/dsh-client-ui-*/client.js requests return 404
window.__DSH_BOOT__ omits expected Web UI package rows
$DSH_HOME/profiles/node_modules omits the same package links
```

Use the shipped Web bundle patch as the expected roster. Do not compare against a remembered package count: plugins can change across revisions. Join each declared client row to four facts:

| Layer | Evidence |
|---|---|
| composition | package is declared by the selected Web bundle |
| fallback | `$DSH_HOME/profiles/node_modules/<package>` resolves to the intended checkout package |
| host manifest | `window.__DSH_BOOT__` advertises the package and bundle URL |
| HTTP | the advertised `client.js` responds 200 with JavaScript |

A 404 for a URL that is not in the boot manifest belongs to a different caller or stale page. An omitted manifest row and an omitted fallback link together narrow the failure to Host-side package discovery.

## Why the symlink anchor matters

`healProfilesModuleFallback()` breadth-first walks dependencies from the CLI install anchor and creates a flat link for each resolvable package under `$DSH_HOME/profiles/node_modules`. Profiles use this Host-owned fallback so in-box packages share one runtime closure rather than installing duplicate Cordis, Agent, Session, or Tools packages.

For each dependency, rc.8 calls `packageDirFromAnchor(anchor, packageName)`. That helper asks `createRequire(anchor).resolve.paths(packageName)` for Node lookup directories and probes each candidate manifest.

With pnpm's isolated workspace layout, an anchor such as:

```text
apps/cli/node_modules/@deepseek-ai/dsh-web-app/package.json
```

can be a symlink into:

```text
packages/bundle/web-app/package.json
```

The reported defect is that lookup paths are derived from the literal first path rather than the real package path. The walker can resolve the bundle itself but miss dependencies linked under the real package's own `node_modules`, including UI renderer or branding packages. Server composition can still settle because the missing artifact is a client half; later, the browser never receives the service needed to replace its loading shell.

## Capture a minimal resolution proof

From the exact checkout and package-manager environment that launches DSH, capture:

```text
git commit:
node --version:
pnpm --version:
pnpm config get node-linker:
DSH_HOME:
CLI install anchor realpath:
Web bundle package.json literal path and realpath:
expected client package names from the bundle patch:
fallback link target for each expected package:
boot-manifest row and URL for each package:
HTTP status and content type for each URL:
```

In browser DevTools, inspect the served document rather than only the live JavaScript object. Preserve a sanitized copy of `window.__DSH_BOOT__` and the exact 404 paths. On the Host, compare `lstat`/link target with `realpath`; do not infer that a visible directory is a real directory.

To demonstrate the lookup difference without booting the complete app, use a disposable script inside the checkout that prints `createRequire(literalAnchor).resolve.paths(target)` and the same call after `realpathSync(literalAnchor)`. Do not publish user paths or environment secrets with the result.

## Choose the recovery by ownership

### You only need a working runtime

Use the exact published DSH package for the desired release line rather than a source-checkout launcher, in a fresh Harness home first. This avoids changing the repository dependency topology. Preserve the broken checkout and evidence if you intend to report or reproduce the source-build defect.

### You own and test the source checkout

The proposed source correction resolves the anchor with `realpathSync()` before calling `createRequire(...).resolve.paths(...)`, with a contained fallback to the original anchor if realpath resolution itself fails. Treat that as a source patch requiring review, not a profile setting.

After applying it on a disposable branch:

1. run the app-boot unit and profile-resolution tests;
2. remove only the launcher-managed fallback links or use a fresh `DSH_HOME`—do not recursively delete an unresolved home path;
3. restart so `healProfilesModuleFallback()` rebuilds the closure;
4. verify every expected fallback target resolves inside the selected checkout;
5. verify every expected boot-manifest row exists;
6. verify every advertised client bundle responds 200; and
7. prove the Web shell replaces the loading screen and can create one disposable Session.

The strongest regression test constructs an actual symlinked anchor whose dependency exists only under the real package path. A test that calls the helper with a normal directory does not cover the reported branch.

## Avoid repairs that split the runtime

Do not run a broad `npm install` inside the profile or install every missing `@deepseek-ai/dsh-*` package there. A nearer duplicate can make boot appear healthier while separating core service identity and breaking every native or MCP tool call later.

Also avoid these unsupported conclusions:

- switching to a hoisted linker proves the walker is correct;
- copying `client.js` files manually repairs package discovery;
- disabling the browser cache repairs an omitted server manifest row;
- server progress at 100 percent proves client activation; or
- one expected package count applies to every commit and custom profile.

If the manifest includes all expected rows and all bundle URLs return 200, route the incident to client Loader settlement or a missing service provider instead. If Host startup throws around HMR or Node internals before serving a stable page, use the separate HMR source-checkout guide.

## Acceptance checklist

- exact checkout commit, Node, pnpm, linker, launch cwd, and DSH home are recorded;
- expected client roster is derived from that commit's Web bundle;
- literal and real anchors are compared;
- missing fallback links match missing manifest rows;
- each manifest URL is probed directly;
- any source patch has a real symlink regression test;
- fallback healing is re-run from a safe fresh home or exact managed directory;
- no duplicate core runtime appears under the profile;
- Web mounts and creates a disposable Session; and
- removal or rollback restores the original source tree and Harness home boundary.

## Primary evidence

- [Official report #3528](https://github.com/deepseek-ai/deepseek-harness/discussions/3528)
- [rc.8 profile fallback walker](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/boot/app-boot/src/profile.ts)
- [rc.8 app-boot profile contract](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/boot/app-boot/README.md)
- [rc.8 client module registry](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/client/modules/src/index.ts)
- [rc.8 Web client boot contract](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/client/web/README.md)

## Related guides

- [Build rc.8 in an air-gapped environment](../getting-started/air-gapped-source-build.md)
- [Recover a duplicate core runtime](duplicate-core-runtime-closure.md)
- [Diagnose HMR Node-internals failures from a source checkout](hmr-expose-internals-source-checkout.md)
- [Install DeepSeek Harness](../getting-started/install-deepseek-harness.md)
