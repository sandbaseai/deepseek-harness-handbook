---
title: Generate Strict Typert Artifacts for an Out-of-Tree DeepSeek Harness Plugin
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-28
upstream_ref: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Generate strict Typert artifacts for an out-of-tree plugin

Use this guide when `WorkspaceTypertGenerator` exits successfully but emits no `typert.host`, `typert.client`, or `typert.remote-client` artifacts for a plugin developed outside the DeepSeek Harness monorepo.

The empty result is not proof that the package has no Typert surface. In rc.2, discovery is workspace-shaped: it starts from face aggregate TypeScript configs, follows project references, and admits only packages whose resolved roots live below the workspace `packages` directory.

## Know the required artifacts

For an analyzed Host face, the generator emits `lib/typert.host.js` and `lib/typert.host.d.ts`. If that Host surface contains `@Remote` methods, it also emits the strict browser projection:

```text
lib/typert.remote-client.js
lib/typert.remote-client.d.ts
```

A Client face emits `lib/typert.client.js` and `lib/typert.client.d.ts`.

These are not interchangeable with a permissive SRC descriptor. A browser Remote client needs the generated strict codecs and projected method types. Treat hand-written polling or an untyped route as a different integration design, not as equivalent Typert output.

## Route the three silent-empty gates

### 1. `root` means workspace root

The `WorkspaceTypertGenerator` constructor documents `root` as the directory containing the face aggregate configs. Passing the external package directory is not a focused-package mode. If that directory has no aggregate config, the analyzer intentionally skips the missing face and can return an empty selection.

### 2. Discovery follows project references, not `include`

For each existing aggregate, registration walks only `parsed.projectReferences`. An aggregate with `include` entries but no `references` can parse successfully and still register zero packages.

```text
<workspace>/tsconfig.host.json
  references[]
    -> <workspace>/packages/community/example/tsconfig.json
```

### External packages can pass discovery and still fail Remote generation

Installed protocol packages introduce a second boundary. Upstream reports [#2981](https://github.com/deepseek-ai/deepseek-harness/discussions/2981) and [#4579](https://github.com/deepseek-ai/deepseek-harness/discussions/4579) show that recognizing `@Remote` metadata is not enough when the Agent-scoped `Agent` or `SessionId` wire type is declared in `node_modules`. A public type can be canonical and exported yet be rejected as “not a workspace-owned public type.”

Treat the dependency as an external type-graph target, not as a package to copy into workspace registration. Accept only an exact, non-root `package.json#exports` subpath whose resolved file remains inside the dependency root. Preserve its resolved symbol identity through the generated declaration; do not replace `Agent` with a caller-supplied string or redeclare a look-alike `SessionId` alias. Those workarounds remove Host lookup, Agent Scope, or codec identity from the Remote contract.

Prove this layer separately: resolve the physical package root and exact export subpath; reject root and wildcard exports; inspect the generated import target for the canonical wire symbol; typecheck same-named symbols from two dependencies; then pack the plugin and run a real browser Remote call through the generated strict codec. If metadata discovery fails, diagnose #2981 first. If discovery succeeds but the public wire symbol is rejected, diagnose this ownership/export layer. “Generator exited zero” proves neither.

### 3. The resolved package root must be inside `packages`

After resolving a reference, rc.2 checks whether the package root is within `<workspace>/packages`. It uses real paths. A symlink placed under `packages` but resolving to an external directory does not evade this containment check. The referenced directory must also contain a readable `package.json` with a string `name`.

## Why a generic empty-result exception is unsafe

The upstream tests treat empty analysis as valid when neither face aggregate exists and when an aggregate exists but has no project references. That supports optional faces. Changing the analyzer to throw whenever it discovers nothing would break that contract.

The stronger diagnostic belongs one layer higher: compare explicit package or manifest intent with actual output. If a selected package declares Typert exports or expected Typert files but generation emits nothing, the build should fail with the skipped discovery boundary and inspected paths.

## Prove discovery before generation

Capture this evidence in order:

1. Absolute, real workspace root passed to the generator.
2. Absolute Host and Client aggregate paths, plus whether each exists.
3. Parsed project references for every existing aggregate.
4. Canonical config path and package root for every reference.
5. Whether each canonical root is within `<workspace>/packages`.
6. Manifest path, package name, exports, and `files` entries.
7. `discover()` output: package name, root, and faces.
8. `generate()` output: package, face, destination, and Remote presence.
9. Exact files written and their digests.
10. Package tarball contents and a browser-side Remote invocation.

Do not jump from exit code to package publishing. An exit code of zero proves only that the supported empty-workspace path did not throw.

## Use a pinned staging workspace today

Until an explicit out-of-tree entry point exists, generate in a disposable, pinned checkout rather than modifying a dirty development checkout.

1. Create a clean temporary checkout at the exact upstream commit used by the plugin.
2. Copy the package source, manifest, and TypeScript configs into a unique directory below `packages/community/`.
3. Preserve the real package name and export surface.
4. Add its project reference to the correct aggregate with an explicit, reviewable patch.
5. Install from the pinned lockfile and run the official generator from the workspace root.
6. Require `discover()` to contain the expected package and face before accepting generation.
7. Require the exact expected artifact set; do not accept an empty glob.
8. Verify every required manifest export and `files` entry.
9. Copy only the generated artifacts back to the external package.
10. Record provenance and delete the temporary checkout.

Do not stage through a symlink to the original external package. The analyzer canonicalizes paths before applying the workspace containment rule.

## Record reproducible provenance

Vendor a machine-readable record beside the generated files:

```json
{
  "upstreamCommit": "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e",
  "generator": "@deepseek-ai/dsh-typert-generator",
  "inputDigest": "sha256:...",
  "outputs": {
    "lib/typert.host.js": "sha256:...",
    "lib/typert.host.d.ts": "sha256:...",
    "lib/typert.remote-client.js": "sha256:...",
    "lib/typert.remote-client.d.ts": "sha256:..."
  }
}
```

Do not record the temporary absolute path or credentials. In CI, repeat generation in a fresh checkout and compare both the required file set and digests. A missing output, extra output, or changed digest fails the build and asks for an intentional regeneration review.

## Verify manifest publication

For a Host package with Remote methods, the relevant manifest shape is:

```json
{
  "exports": {
    "./typert": {
      "types": "./lib/typert.host.d.ts",
      "default": "./lib/typert.host.js"
    },
    "./remote": {
      "types": "./lib/typert.remote-client.d.ts",
      "default": "./lib/typert.remote-client.js"
    }
  },
  "files": [
    "lib/typert.host.js",
    "lib/typert.host.d.ts",
    "lib/typert.remote-client.js",
    "lib/typert.remote-client.d.ts"
  ]
}
```

For a Client face, the validated export subpath is `./client/typert`, pointing to `typert.client.d.ts` and `typert.client.js`.

Validation currently runs only after an artifact exists. It catches “emitted but not exported,” not “manifest declares Typert intent but discovery emitted nothing.” Add an independent build assertion for the converse.

## Design a supported single-package entry point

A future `generateForPackage(packageDir)` should make the package boundary explicit without inheriting ambient workspace discovery. Its contract should define:

- the canonical package directory and allowed source roots;
- Host, Client, or dual-face TypeScript configs;
- export subpaths that form the public analysis surface;
- dependency resolution and allowed external symbols;
- strict codec requirements for Remote methods;
- deterministic output paths and stable ordering;
- manifest-intent validation in both directions;
- diagnostics for every skipped root, config, export, and declaration;
- no accidental reads from unrelated packages in the caller's workspace.

Renaming the existing constructor option to `workspaceRoot`, or replacing the positional argument with a named options object, would also make the current scope harder to misread.

## Failure router

| Observation | First boundary to inspect |
|---|---|
| No aggregate config exists | wrong constructor root or intentionally absent face |
| Aggregate exists, discovery is empty | parsed `projectReferences`, not `include` |
| Reference exists, package is absent | real-path containment below `<workspace>/packages` |
| Package registers but no face is discovered | public export graph and explicit Typert roots |
| Artifact emits, then generation throws | exact `exports` and `files` contract |
| Local files exist but consumers cannot import them | packed tarball contents and export resolution |
| Remote client imports but runtime calls fail | Host mount, namespace, codecs, and protocol compatibility |
| Regeneration changes bytes unexpectedly | pinned commit, lockfile, inputs, and provenance |

## Acceptance gates

- The generator receives a canonical workspace root.
- The intended face aggregate exists.
- The aggregate explicitly references the staged package config.
- The staged package resolves below the workspace `packages` directory.
- The manifest name matches the selected package name.
- `discover()` returns the intended package and face.
- `generate()` returns at least one expected artifact.
- The exact artifact allowlist is present; empty and extra sets fail.
- Host and Client exports point to the correct face files.
- Remote export exists only when Remote methods are emitted.
- `files` includes every published JavaScript and declaration artifact.
- The packed package contains the same verified bytes.
- A clean consumer can resolve every declared subpath.
- A browser Remote call crosses the generated strict codec boundary.
- CI regeneration from the pinned checkout is deterministic.
- The temporary workspace is removed after artifacts and provenance are secured.

## Source boundary

Verified against DeepSeek Harness `0.1.1-rc.2` commit `b150a551b8d465e31e418e1b2eaf5e79bbb7d28e` and the out-of-tree generation reports in discussions #4679, #2981, and #4579.

- [Out-of-tree Typert generation discussion #4679](https://github.com/deepseek-ai/deepseek-harness/discussions/4679)
- [Typert misses `@Remote` metadata from npm protocols (#2981)](https://github.com/deepseek-ai/deepseek-harness/discussions/2981)
- [Typert rejects external public Agent wire types (#4579)](https://github.com/deepseek-ai/deepseek-harness/discussions/4579)
- [Workspace generator implementation](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/typert/generator/src/workspace.ts)
- [Workspace discovery and containment](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/typert/generator/src/analyzer.ts)
- [Empty-selection contract tests](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/typert/generator/tests/type-model.spec.ts)
- [Official Typert generator documentation](https://github.com/deepseek-ai/deepseek-harness/tree/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/typert/generator)
