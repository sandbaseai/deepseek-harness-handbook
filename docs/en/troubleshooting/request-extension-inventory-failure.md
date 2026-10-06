---
title: Isolate Plugin Inventory Failures from Model Requests
locale: en
content_revision: 2
status: canonical
verified_at: 2026-10-07
upstream_revision: cd5ef8148158c3a752a658978873241fdf8e2bbc
---

# Isolate plugin inventory failures from model requests

## Audience and outcome

Use this runbook when every model request fails with `REQUEST_EXTENSION` or `DeepSeek request extension
preparation failed` after a plugin inventory step throws. Upstream discussion
[#4950](https://github.com/deepseek-ai/deepseek-harness/discussions/4950) reports the failure on the
alpha.1 source checkout: the inventory field is provider metadata, but its preparation error blocks the
whole request instead of degrading to an empty inventory with a warning.

**Outcome:** you can name the exact condition that makes an inventory row unresolvable, reproduce the
failure deterministically in a disposable profile, and contain it without disabling the whole plugin
graph or weakening approval and sandbox policy.

## Prerequisites

- A DSH installation where `plugin-package-inventory-deepseek` is loaded (it is declared by the base
  bundle and enabled by default).
- Write access to `$DSH_HOME/profiles/<profile>/cordis.patch.yml`.
- A disposable profile for the reproduction. Do not reproduce this in the profile you rely on.
- For the published-artifact route: DSH Desktop, or any install where the component ships inside the
  application bundle rather than in the profile's `node_modules`.

## Identify the failing boundary

Run a text-only prompt with the same provider, model, profile, and workspace. Then compare a profile with
`plugin-package-inventory-deepseek` enabled and disabled. Record whether the provider request is observed
at all. If disabling only the inventory extension restores requests, classify the incident as extension
preparation—not authentication, model routing, or prompt content.

The desired contract is narrow: inventory failure should produce an empty optional field plus an
observable warning, matching the existing graceful handling for a missing extension service. It must not
silently broaden permissions or hide unrelated plugin failures.

### Most common trigger: a mount row whose nearest manifest has a `name` but no `version`

The inventory resolver distinguishes two kinds of Loader row. A **bare package name** is resolved through
the package anchors. Anything else—an absolute or relative path, or a specifier containing `:`—is treated
as a **path** and resolved by walking up from the module directory to the nearest `package.json`.

For that path case the resolver demands a full package identity, and its own caller already tolerates
failure: the collection loop skips entries whose identity is `undefined`. The resolver nevertheless
throws when the nearest manifest is incomplete, and `dsh-llm-deepseek` re-wraps that throw as
`REQUEST_EXTENSION`.

The trap is that **the nearest manifest is usually DSH's own profile manifest, which ships with a `name`
but no `version`**. So any plugin mounted from a directory that does not carry its own `package.json`
resolves upward onto a manifest that can never satisfy the check.

Two properties make this branch easy to reach and hard to read:

- It is independent of what the mounted plugin does. The request fails before the model is called.
- The UI shows only the wrapped error. The original reason survives in the error's `cause`, so the visible
  message points at the provider rather than at the mount row.

## Reproduce it in a disposable profile

Create a plugin directory with an entry module but **no** `package.json`:

```bash
mkdir -p "$DSH_HOME/profiles/scratch/plugins/no-manifest"
printf 'export function apply() {}\n' > "$DSH_HOME/profiles/scratch/plugins/no-manifest/index.ts"
```

Mount it by absolute path in that profile's patch layer:

```yaml
# $DSH_HOME/profiles/scratch/cordis.patch.yml
- insert:
    - id: no-manifest
      name: "<absolute path to>/.dsh/profiles/scratch/plugins/no-manifest/index.ts"
```

Start DSH on that profile and run any prompt against the official DeepSeek provider. Compare with the
same prompt after adding a compliant manifest in the same directory:

```json
{ "name": "dsh-local-no-manifest", "version": "0.0.0", "private": true }
```

## Observable success criteria

| Step | Expected observation |
|---|---|
| Prompt with the incomplete mount row | Request fails with `REQUEST_EXTENSION`; no provider request is observed |
| Second prompt, same profile | Fails identically; the failure is not transient and does not depend on prompt content |
| Inspect the row's nearest `package.json` | It declares a `name` and no `version` |
| Add a `name` + `version` manifest in the plugin directory and restart | Prompt succeeds |
| Remove only the manifest and restart | Failure returns, deterministically |

The restart requirement is expected: identity resolution is cached per process.

## Capture a bounded evidence bundle

```text
DSH version / commit:
Published component version (if shipped inside the app bundle):
Profile and workspace:
Provider / model:
Inventory plugin and revision:
Inventory preparation error:
REQUEST_EXTENSION error:
Provider request observed: yes / no
Same prompt with inventory disabled:
Nearest manifest path and its declared fields:
Module directory of the offending row:
```

Preserve the first inventory stack trace and the request boundary. Do not paste credentials, full plugin
manifests, or conversation content into an issue.

Because a published package and a source checkout are different evidence identities, record the package
version separately from any source revision, and say which one you actually observed. A reproduction on a
published desktop build does not by itself pin the behaviour of `master`, and the reverse also holds.

## Likely failure branches

| Symptom | Likely branch |
|---|---|
| Every request fails, including text-only prompts | Inventory preparation; check mount rows before suspects like credentials or routing |
| Only DeepSeek fails; other providers are fine | Still inventory preparation—the wrapping error code is raised on the DeepSeek request path |
| Failure appears immediately after adding a plugin | That row's nearest manifest is incomplete; verify it before editing anything else |
| Disabling the row restores requests | Confirms the row, not the plugin's own logic, is the boundary |
| Disabling the inventory extension restores requests but disabling one row does not | More than one unsafe row, or a row added through a preset rather than the patch layer |
| Original reason is not visible in the UI | Read the `cause` of the surfaced error; the visible message is a wrapper |

## Safe containment and rollback

Contain in the least invasive order. Each step should be reversible by reverting a single file.

**Level 1 — make the mounted module self-describing.** Add a `package.json` with a non-empty `name` and
`version` to the plugin's own directory, then restart. This keeps the inventory extension, the plugin
graph, and every other row intact, and it addresses the actual condition rather than masking it. Prefer
this when the row is one you control.

**Level 2 — remove or disable the offending row.** If the module cannot carry a manifest, disable just
that row through a patch override rather than deleting source:

```yaml
- id: <row-id>
  disabled: true
```

**Level 3 — disable the inventory extension.** Use this only to confirm the boundary, and note that it
also removes the inventory metadata. Keep the field visibly absent rather than fabricating a complete
catalog, so downstream consumers cannot mistake missing metadata for an empty inventory.

Across all levels: require an explicit profile diff and a zero-error response; do not disable the entire
plugin graph, and do not add a blanket error swallow.

## Acceptance gates for a fix

A credible fix must prove both paths: successful inventory is attached to a request, while inventory
failure preserves the model request, emits a diagnostic, and yields an empty optional field. Test repeated
requests, a cold profile boot, and an unrelated extension failure to ensure the fallback does not mask
real request errors.

Additionally, for this specific trigger:

| Case | Expected |
|---|---|
| Nearest manifest has a `name` but no `version` | Request succeeds; the entry is skipped; a diagnostic is emitted |
| Nearest manifest has no `name` | Same |
| No manifest found while walking up | Same |
| A bare package name that cannot be resolved | Same degradation, for the same reason |
| A fully resolvable entry | Still appears in the inventory with correct fields |
| Repeated requests and a cold boot | Stable results |
| An unrelated extension failure | Must not be absorbed by this fallback |

The degraded result must be observably incomplete—not an empty catalog presented as a complete one. A
fallback that returns success with fabricated or silently truncated metadata is not acceptable, because
downstream consumers cannot distinguish it from a healthy inventory.

## Primary sources and verification

- Upstream discussion [#4950](https://github.com/deepseek-ai/deepseek-harness/discussions/4950) — original
  report of the request-level failure.
- Upstream source, pinned: `@deepseek-ai/dsh-plugin-package-inventory-deepseek`. The relevant symbols are
  the identity resolver's manifest check and its collection loop's `undefined` handling in
  `packages/llm/plugin-package-inventory-deepseek/src/index.ts`.
- Published artifact identity used for this revision: `@deepseek-ai/dsh-plugin-package-inventory-deepseek`
  version `0.2.0-rc.2`, as shipped inside the DeepSeek Harness Desktop application bundle. The component
  was read from the application archive rather than from a profile `node_modules` tree, so npm and source
  identities are recorded separately.
- Related failure with a different trigger and the same error code:
  [discussion #5439](https://github.com/deepseek-ai/deepseek-harness/discussions/5439).
- Verification date: 2026-10-07. Platform: Windows. The reproduction was performed on a disposable
  profile; no credentials, personal paths, or conversation content are included above.

The condition described here is an observed behaviour of the pinned revisions, not a compatibility
promise. Other triggers of the same failure path may exist and are not excluded by this runbook.
