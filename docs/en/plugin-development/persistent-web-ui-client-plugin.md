---
title: Extend the DeepSeek Harness Web UI With a Persistent Client Plugin
locale: en
content_revision: 3
status: canonical
verified_at: 2026-08-27
upstream_ref: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Extend the Web UI with a persistent Client plugin

Use this guide when you want to add or replace a DeepSeek Harness Web UI feature without editing files inside an `npx` installation or maintaining patches against a moving upstream bundle.

The durable unit is an independently installed package with a browser half. Upgrading the Host may still require a compatibility update, but the package identity, source, tests, and removal path survive independently of the installed DSH bytes.

## Choose extension before mutation

| Goal | Preferred boundary | Upgrade behavior |
|---|---|---|
| Add content to an existing list or keyed region | register a new SlotMap entry | package remains separate; host contract must stay compatible |
| Replace one named control | occupy a `single` slot and implement the complete control | intentional shadow; retest owner props and behavior on upgrade |
| Add a new model tool or Host service | Host plugin, optionally with a Client half | UI and capability share one package lifecycle |
| Change a region with no declared slot | propose a slot upstream; use DOM post-processing only as an explicit fragile experiment | markup changes can break it without type errors |
| Maintain a private product fork | fork and own the complete build/rebase process | every upstream update is a merge, security, and release responsibility |

Do not store diffs beside an `npx` cache and ask an Agent to reapply them after updates. A semantic patch still targets private implementation details, can apply incorrectly after upstream changes, and has no package-level compatibility or uninstall contract.

## Discover the supported seat first

At rc.2, the Client SlotMap is the public composition surface. In a Cordis authoring environment, inspect the generated Client catalog before writing code:

```text
cordis_inspect what:"client"
```

For every candidate slot, record:

- exact key;
- `kind`: `single`, `list`, `keyed`, or `chain`;
- scope: global, Session, or optional Session;
- owner props supplied by the host region;
- required registration fields such as `id` or `order`;
- injected services and child slots;
- shipped occupants and replacement risk;
- source declaration and lifecycle owner.

Do not infer a slot key from visible text or a CSS selector. The generated catalog is built from actual `SlotMap` declarations and shipped registrations.

## Choose cardinality by ownership, not appearance

[Request #4764](https://github.com/deepseek-ai/deepseek-harness/discussions/4764) identifies a real composition mismatch. In rc.2, the completed Turn Node exposes `conversation.chat.turnTail` as a `chain`. Chain entries are selectors: each derives a match from the engine-owned Turn, the first accepted entry owns the extension region, and later entries do not render. That is correct for mutually exclusive whole-tail presentations. It cannot safely compose independent cost, model, latency, cache, or policy badges.

Use the slot kind to express who may coexist:

| Kind | Ownership question | Good example | Bad fit |
|---|---|---|---|
| `single` | who replaces this complete affordance? | one full model selector | an optional badge |
| `chain` | which one renderer owns this case? | mutually exclusive completed-turn tail | several independent metrics |
| `keyed` | which renderer owns this domain key? | tool or command type dispatch | multiple contributors for one key |
| `list` | which independent cells coexist in order? | actions, badges, status rows | mutually exclusive whole-region selection |

A per-Turn badge seat should therefore be an additive Session-scoped `list` with stable `id`, deterministic `order`, and the immutable Turn identity and closing sequence in its owner props. Each registration must be allowed to render `null` for a Turn it does not annotate. One contributor must never hide another merely because it has data first.

### Keep badges as projections, not new truth

Cost and model badges often arrive from durable usage, route, or policy events. The badge renderer should project those frozen records; it should not fetch a current model setting and relabel historical Turns. Define absence explicitly:

- no matching record means no badge, not zero cost;
- partial usage stays partial and visibly qualified;
- a streaming Turn does not receive a finalized badge early;
- replay after upgrade derives the same value from the same durable events;
- redaction and visibility policy apply before owner props reach third-party cells.

Placing the list between the existing tail chain and `IconActions` is a presentation choice, not the whole contract. Test wrapping, density, keyboard order, screen-reader naming, narrow widths, long localized values, and at least three simultaneous registrations. Registration and disposal must update every active Session scope without remounting the Turn body or changing its durable node identity.

## Understand the model-selector example

The model control is declared as:

```ts
'conversation.input.model': {
  kind: 'single'
  scope: 'session'
  owner: InputControlOwnerProps
}
```

The shipped `@deepseek-ai/dsh-client-ui-model-selection` package already occupies it. Registering another component does not append a search box to the existing selector. Because the seat is `single`, the new entry shadows the shipped occupant and must render the entire model affordance, including loading, selection, effort, disabled state, accessibility, error recovery, and subagent constraints.

If the product requirement is only “add search,” first evaluate an upstream contribution to the shipped selector. A replacement plugin is appropriate only when you accept ownership of the whole control.

## Declare an installable dual-face package

The Host loader needs a normal package entry so the package can enter the composition. The Client module registry then resolves that loader entry's package manifest and looks for `dsh.client` with `platform: "web"`.

A representative manifest is:

```json
{
  "name": "@example/dsh-model-picker",
  "version": "0.1.0",
  "type": "module",
  "main": "./lib/index.js",
  "exports": {
    ".": {
      "types": "./lib/types/index.d.ts",
      "default": "./lib/index.js"
    },
    "./client": {
      "types": "./lib/types/client/index.d.ts",
      "default": "./lib/client.js"
    },
    "./package.json": "./package.json"
  },
  "dsh": {
    "client": {
      "platform": "web",
      "inject": [
        "@deepseek-ai/dsh-client-runtime",
        "@deepseek-ai/dsh-client-ui-conversation"
      ]
    }
  },
  "files": [
    "lib/index.js",
    "lib/client.js",
    "lib/types/**/*.d.ts"
  ]
}
```

`./package.json` is load-bearing in rc.2. The Client module registry uses `require.resolve("<entry>/package.json")`. If the export map hides that subpath, resolution fails, the package receives a cached negative verdict, and it does not become a Client graph row until the Host restarts after the package is fixed.

`dsh.client.inject` contains **package-name graph edges** used for browser bundle arrival. It is not the same as the Client plugin's exported Cordis `inject` list, which names runtime services such as `slots`.

## Keep the Node and browser halves distinct

Minimal Node entry:

```ts
import type { Context } from '@deepseek-ai/cordis'

export const name = 'example-model-picker'

export function apply(_ctx: Context) {
  // The package has no Host behavior beyond entering the loader graph.
}
```

Representative Client entry:

```ts
import React from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'

export const inject = ['slots']

function SearchableModelPicker({ locked }: { locked: boolean }) {
  return React.createElement('button', { disabled: locked }, 'Choose model')
}

export function apply(ctx: ClientContext) {
  ctx.slots.inject('conversation.input.model', () =>
    ctx.slots.register(
      { name: 'conversation.input.model' },
      SearchableModelPicker,
    ),
  )
}
```

This only proves seating and owner-prop flow; it is not a complete model picker. A production replacement must use the supported per-Session model directory and selection services, preserve the current route, handle loading generations and selection failures, and cover addressed subagent behavior.

## Build the browser artifact as a loader factory

The rc.2 Web runtime does not import arbitrary ESM plugin bundles. It serves a browser-targeted CJS artifact whose top level registers a lazy factory:

```text
window.__ModuleLoader__.load({ id, factory })
```

The official shared build preset uses:

- `entry: { client: ... }`;
- `outDir: "lib"` and exact `lib/client.js` output;
- `format: "cjs"`;
- `platform: "browser"`;
- `clean: false` so the Client build cannot erase the Node half;
- platform modules as externals;
- browser-safe dependencies inlined;
- a build-time purity gate against cross-plugin value imports;
- a wrapper that provides the module/exports factory contract;
- source maps and plugin-owned CSS-module injection.

Out-of-tree packages cannot assume the monorepo-relative `clientBundle()` helper is a published stable authoring API. Pin the exact supported toolchain or reproduce its emitted contract in a package-local build config, then test the final bytes against the runtime loader. Do not publish raw TypeScript or an ordinary ESM chunk as `./client`.

Run the Node and browser outputs in one build plan, or keep `clean: false` in every stage. A second build that cleans `lib/` can leave a valid Host entry but remove `client.js` immediately before packaging.

## Respect the browser module boundary

The Client loader shares a fixed platform module table. Cross-plugin collaboration belongs in Cordis services and slots, not in arbitrary value imports from another plugin package.

Why this matters:

- bundling another runtime package can create duplicate singleton or class identity;
- leaving an unknown package external produces a `require()` the browser module table cannot answer;
- type-only imports disappear and are safe only if no value import survives;
- generated Remote projections and explicitly browser-safe wire types are data contracts, not shared runtime owners.

Make peer dependencies explicit, but do not confuse npm resolution with browser module availability.

## Install and prove the entire boot chain

Test in an isolated profile with one new package:

1. Pack the package and inspect the tarball.
2. Confirm it contains `lib/index.js`, `lib/client.js`, declarations, and `package.json`.
3. Install it as a profile dependency and add its Host entry to the composition.
4. Dump the effective composition and confirm the exact entry name.
5. Restart Web after changing manifest discovery fields; negative metadata results are cached for the process lifetime.
6. Inspect `window.__DSH_BOOT__.entries` and find the exact package id, bundle URL, revision, and dependency edges.
7. Request `/plugins/<encoded-package-id>/client.js?rev=<rev>` and require JavaScript with the matching loader handoff id.
8. Confirm bundle registration, materialization, Client fiber activation, and slot occupancy.
9. Test both the intended replacement and the shipped behavior after removal.

The boot graph uses the loader entry name as the package id. A mismatch between package name, composition entry, and loader handoff can register bytes that the requested graph row never receives.

## Failure router

| Symptom | First evidence | Likely boundary |
|---|---|---|
| Host entry loads, no boot row appears | manifest export of `./package.json`, `dsh.client.platform`, Host restart | package discovery |
| Startup says Client bundle not found | resolved `./client` path and packed `lib/client.js` | build or publication |
| Bundle URL returns 404 | boot row id, encoded route, on-disk artifact | serving boundary |
| Script loads, no module registers | `window.__ModuleLoader__.load` handoff and matching id | bundle wrapper |
| `exports is not defined` | factory prologue and CJS wrapper | build format |
| Unknown synchronous `require` | final externals and browser module table | module purity |
| Client fiber waits forever | exported runtime-service `inject` list | Cordis dependency |
| Entry mounts but nothing is visible | exact slot key, scope, kind, occupant, and owner lifecycle | SlotMap contract |
| Existing model selector disappears | `single` slot replacement | expected shadow, incomplete replacement |
| UI works until the next package build | build stage that cleans `lib/` | dual-output artifact ownership |

## Upgrade contract

For every DSH update:

1. pin and record the new upstream revision;
2. diff the target SlotMap declaration and generated catalog entry;
3. diff the shipped occupant and owner props;
4. rebuild with the compatible Client loader contract;
5. install into a fresh profile rather than upgrading the only working profile;
6. run slot, keyboard, screen-reader, error, Session-switch, and removal tests;
7. keep the previous package and DSH versions as an atomic rollback pair.

A plugin survives replacement of the installed DSH package; it does not make private APIs stable. Version compatibility must remain explicit.

## PWA assets are part of the client contract

Upstream report [#4962](https://github.com/deepseek-ai/deepseek-harness/discussions/4962) shows an Android PWA installing with a white square when the manifest exposes only an SVG favicon with `purpose: any`. A persistent client plugin that changes the Web surface also owns the installable shell: provide maskable raster icons at the required sizes, keep the artwork inside the adaptive-icon safe zone, and verify a fresh install on Android rather than trusting the desktop browser preview. Check that the manifest, service-worker cache, theme color, and uninstall path all refer to the same plugin revision; an icon fix must not silently pin stale client assets.

## Acceptance gates

- The feature targets a documented SlotMap key or explicitly declares its DOM dependency as fragile.
- Slot kind, scope, owner props, and shipped occupants are recorded.
- A `single` slot replacement covers the complete displaced affordance.
- A `chain` is used only when one accepted renderer owns the whole region.
- Independent per-record metadata uses a stable ordered `list`; one empty entry cannot suppress another.
- Historical badges derive from durable addressed evidence rather than current global state.
- Package, composition entry, loader handoff, and boot row use one identity.
- `./package.json` is exported and resolvable from the profile anchor.
- `dsh.client.platform` is exactly `web`.
- Package graph `inject` and runtime service `inject` are not mixed.
- The packed package contains both Node and browser artifacts.
- `./client` resolves to the exact browser bundle.
- The browser bundle uses the required lazy CJS loader-factory contract.
- No second build stage deletes the other face's outputs.
- Cross-plugin value imports do not duplicate or escape the module table.
- The boot manifest contains the expected row and revision.
- The slot entry activates, renders, updates, and disposes in the correct scope.
- Removal restores shipped behavior without editing DSH files.
- Upgrade tests pin both the DSH and plugin revisions.

## Source boundary

Verified against DeepSeek Harness `0.1.1-rc.2` commit `b150a551b8d465e31e418e1b2eaf5e79bbb7d28e` and official discussions #4683 and #4764. The manifest and loader-factory examples describe the rc.2 contract; public out-of-tree authoring helpers may change.

- [How to modify the DSH Web UI discussion #4683](https://github.com/deepseek-ai/deepseek-harness/discussions/4683)
- [Per-Turn badge list-slot request #4764](https://github.com/deepseek-ai/deepseek-harness/discussions/4764)
- [rc.2 completed-Turn slot declarations](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-conversation/src/client/contract/slots.ts)
- [rc.2 completed-Turn render-site registration](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-conversation/src/client/chat/register-node-renderers.ts)
- [rc.2 Client package discovery and boot graph](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/modules/src/index.ts)
- [rc.2 shared Client bundle contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/tsdown.client.ts)
- [Model-selector SlotMap declaration](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-conversation/src/client/contract/slots.ts)
- [Shipped model-selector registration](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-model-selection/src/client/index.ts)
- [Generated Client slot catalog](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/extensions/cordis-client-runner/src/client/slot-catalog.ts)
