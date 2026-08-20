---
title: Recover DeepSeek Harness Web from a Client Plugin Boot Failure
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
---

# Recover the Web UI without hiding the failed plugin

Use this runbook when DeepSeek Harness Web shows `Failed to load plugins`, names one entry, or remains on the HARNESS boot screen while the Host still returns HTTP 200.

A healthy server does not prove a healthy browser runtime. In rc.8, the Host emits a boot graph and serves each Client bundle, but the browser fetches, registers, materializes, and applies those bundles. A JavaScript error can therefore fail entirely after the server has done its job.

## Read the boot screen as evidence

The rc.8 shell is intentionally self-sufficient. Its framework-free `BootPage` renders before plugin activation; React arrives later through the UI renderer, after every Loader entry activates. On failure the boot page remains, lists entries whose fiber state is `failed`, and prints the boot sweep report.

Record these before changing the profile:

- the exact entry id shown under `Failed to load plugins`;
- the complete error text, including an identifier such as `FISH_CSS is not defined`;
- the page URL and DSH version;
- the first relevant browser-console exception and stack;
- the failing bundle URL, normally `/plugins/<id>/client.js?rev=<rev>`;
- whether the failure follows a clean browser profile or another machine.

Do not infer that every listed entry is independently broken. A provider may fail first while dependents remain pending or fail during the final sweep.

## Locate the failing stage

| Stage | Evidence | Meaning |
|---|---|---|
| boot manifest | `window.__DSH_BOOT__` is absent or malformed | the shell cannot construct the graph |
| bundle arrival | request is 404/blocked, or `bundle script ... failed to load` | the classic script did not load |
| registration | `loaded without registering "<id>"` | script ran but did not register its row |
| materialization | `ReferenceError`, require-table miss, or require cycle | the registered factory failed while producing exports |
| plugin apply | entry becomes `failed`; console carries the thrown error | Cordis created the entry but its browser plugin did not activate |
| dependency settle | entry remains `pending (waiting for service...)` | a required provider never became active |

The rc.8 module system uses classic script elements for arrival. Bundle execution only registers a factory. The factory runs later during materialization, and the Cordis Loader then applies its exported plugin. A `200` response and syntactically valid file can still fail during factory execution or apply.

## Capture browser-side evidence

Open DevTools on the failed page.

1. In **Console**, preserve the first exception rather than only the final boot summary.
2. In **Network**, filter for `/plugins/` and record status, content type, transferred bytes, and final URL.
3. Open the exact failing `client.js?rev=...` response and confirm it belongs to the entry shown on screen.
4. If a source map is available, record the mapped file and line. Otherwise retain the generated offset and bundle revision.
5. Reload once with **Disable cache** enabled. Do not repeatedly reload while editing evidence.

For identifier failures, search the served response for both the declaration and first use. An unclosed comment, invalid transform, missing generated constant, or stale build can remove a declaration without making the HTTP response fail.

Do not paste an entire private bundle into an issue. Reduce it to the failing expression, mapped location, hash or revision, and reproduction.

## Prove profile ownership before removal

Inspect the effective composition and package-manager owner from a terminal that uses the same `DSH_HOME` and `web` profile:

```bash
dsh --profile web --dump-config > effective-web.yml
dsh plugin --profile web why <package-name>
```

Then classify the entry:

- **third-party bundle installed into the profile:** remove the exact top-level package with `dsh plugin --profile web remove <package-name>`;
- **local bundle installed by path, link, or Git spec:** repair and rebuild its checkout, then reinstall or update the same package spec;
- **manual overlay:** preserve and correct the contributing patch instead of pretending pnpm owns it;
- **shipped DeepSeek Harness entry:** do not remove it; reproduce on the exact release and use the normal upgrade or rollback runbook.

The boot entry id and npm package name may differ. Confirm the package manifest and its `dsh.bundle` contribution before running `remove`.

## Recover transactionally

1. Stop the Web process.
2. Preserve `$DSH_HOME/profiles/web/package.json`, lockfile, workspace file, and `cordis.patch.yml` if present.
3. Save `effective-web.yml` and the browser evidence.
4. Remove or repair only the proven owner.
5. Run `dsh --profile web --dump-config` again; it must succeed and no longer contain the unwanted layer.
6. Start `dsh --profile web` and reload the same URL.
7. Verify the shell reaches the real UI, then inspect the browser console and `/plugins/` requests again.
8. Reinstall a fixed plugin only after its built Client artifact is available and reviewed.

Do not delete all profiles, clear Sessions, erase credentials, edit generated files under `node_modules`, or switch off browser security. Those actions destroy evidence without repairing Client code.

## Understand the current recovery limit

rc.8 deliberately fails the boot if any entry is not active. It does not expose a supported Web safe-mode button that skips one failed entry, nor does it automatically roll back a failed HMR bundle. The loading shell reports browser-side failure through the page and console; it does not prove that the exception reached Host logs.

Treat these as proposed product capabilities, not current commands:

- quarantine one non-critical Client entry and continue only after dependency analysis;
- show package owner, bundle URL, source-map location, and first causal exception;
- send a bounded, redacted browser diagnostic event to the Host;
- offer a safe-mode restart with an explicit skipped-entry list;
- disable or roll back the proven package from a shell-owned recovery surface.

Skipping is unsafe when the failed entry provides identity, transport, authorization, settings, runtime, or another service required by the app shell. A safe mode needs a declared criticality and dependency contract; catch-and-continue is not sufficient isolation.

## Acceptance gates

- The first causal browser exception is retained separately from the final sweep report.
- Bundle arrival, registration, materialization, apply, and dependency waiting are distinguishable.
- The failed entry maps to a proven package or overlay owner before mutation.
- Removing one third-party bundle leaves unrelated profile dependencies intact.
- The effective composition succeeds before Web is restarted.
- The same URL reaches the real UI with no failed Loader entry.
- A fixed bundle carries a new reviewed artifact identity; stale cache is not mistaken for repair.
- Built-in or critical entries cannot be silently skipped.
- Any future diagnostic upload is bounded, redacted, and explicitly identifies browser-side provenance.
- A safe-mode test proves degraded functionality without capability widening.

## Source boundary

Verified against DeepSeek Harness rc.8 commit `141eb6fef83422698aef7a981029e843e8161534`. The safe-mode and Host-reporting controls above are design requirements, not rc.8 features.

- [Upstream Client plugin failure report #3536](https://github.com/deepseek-ai/deepseek-harness/discussions/3536)
- [rc.8 Web boot kernel](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/client/web/src/boot.ts)
- [rc.8 framework-free boot page](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/client/web/src/boot-page.ts)
- [rc.8 Client module system](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/client/modules/src/client/system.ts)
- [rc.8 HMR limitations](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/client/hmr/README.md)
- [Plugin installation recovery](plugin-install-recovery.md)
- [Upgrade and rollback](../getting-started/upgrade-and-rollback.md)
