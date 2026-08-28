---
title: Diagnose a DeepSeek Harness WebView MutationObserver CPU Loop
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-27
upstream_ref: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Diagnose a WebView MutationObserver CPU loop

Use this runbook when a DeepSeek Harness desktop window becomes completely unresponsive, its WebContent renderer holds a CPU core near 100 percent, and a native sample repeatedly lands in `MutationObserver::deliver` or a JavaScript mutation callback.

That stack proves a renderer is repeatedly delivering DOM mutation records. It does **not** identify the callback owner, the triggering DOM node, or the code that registered the observer.

### Route Safari marker clipping separately

Upstream discussion [#4917](https://github.com/deepseek-ai/deepseek-harness/discussions/4917) reports ordered-list markers clipped on the left edge in Safari while the same Markdown renders normally in Chrome. A clipped `1.` or `2.` with normal text flow is a layout/overflow symptom, not evidence of a MutationObserver feedback loop. First compare browsers, capture the computed list padding and `list-style-position`, and check horizontal clipping at the message container. Only investigate observer ownership when CPU, mutation counts, or a repeated callback trace also crosses the loop boundary below.

Do not “fix” the Safari symptom by deleting the Session or disabling every plugin. Preserve a screenshot and DOM/CSS sample, then test a sufficient marker gutter (for example, the existing source-list spacing) or an inside-positioned marker in a disposable client. Keep the ordered-list fixture and the WebView performance trace as separate evidence artifacts.

Official report [#4737](https://github.com/deepseek-ai/deepseek-harness/discussions/4737) recovered after all Sessions for one project were moved out of the active Session root. That is strong evidence that the active presentation surface matters. It does not yet prove which Session, event, rendered block, extension, wrapper script, or interaction creates the feedback loop.

## Keep four ownership planes separate

| Plane | What it owns | Evidence that names it |
|---|---|---|
| DSH Host | Session log, query window, API and archive state | Host PID, logs, Session IDs, RPC trace |
| Official Web client | React projection, conversation scrollport, renderers | exact DSH artifact, loaded module URL/digest, browser performance trace |
| Desktop wrapper | WebView creation, preload/injected scripts, native process lifecycle | wrapper version/source, WebContent parent PID, loaded resource list |
| Client plugin or external injection | DOM observers, translation, status decoration, accessibility or browser extensions | registration stack, script URL/digest, clean-client A/B |

The rc.2 repository contains `apps/cli` and `apps/web`; it does not contain the Tauri desktop shell described in #4737. A repository-wide search of tracked rc.2 production sources finds no first-party `MutationObserver` registration. The occurrences are test probes, including the complex-history performance suite. This does not prove official Web code is innocent: bundled dependencies, dynamic client plugins, wrapper preload code, or a different artifact can still register an observer. It means the native stack alone cannot assign ownership to the official Web source tree.

## Contain without destroying the trigger

1. Stop clicking and repeated renderer restarts. Preserve one native sample and exact timestamps.
2. Record the desktop wrapper, DSH, Node, OS, WebKit/browser, profile, and selected Workspace/Session identifiers.
3. Capture Host and renderer PID lineage. The high-CPU renderer and the Host are different processes.
4. Stop every process that can write the profile before copying evidence.
5. Make a whole-root, access-controlled snapshot of the affected profile and record its digest manifest.
6. Restart against the original only after the evidence copy is complete.

Do not delete or rewrite Session JSONL, projection caches, or Workspace state. Do not post full Sessions, heap snapshots, DOM dumps, or rendered HTML publicly; they can contain prompts, tool output, credentials, file content, and private paths.

The official `workspace.archiveSession` path is non-destructive: it hides a Session from grouping surfaces while keeping its log and Workspace accounting. Use that Host-owned operation for live containment when the UI remains responsive enough. rc.2 does not provide a matching unarchive operation, so do not use live archiving as an experimental binary-search switch unless permanent hiding is acceptable.

## Prove the callback owner

Run A/B tests from copies, not by repeatedly mutating the only evidence root.

### A. Wrapper versus official Web

Use the same copied profile and exact selected Session:

- open the official `dsh web` route in a clean standalone browser profile;
- open the desktop wrapper with its normal WebView;
- keep DSH artifact, Host, profile copy, viewport, and selected Session constant.

If only the wrapper freezes, capture its preload scripts and loaded resources before blaming Session projection. If both freeze with the same Session, continue at the Web/client plane.

### B. Clean client versus injected client

Create one client with no browser extensions, translation tools, accessibility overlays, user scripts, DevTools snippets, or third-party client plugins. “Disabled in configuration” is not sufficient evidence; prove the suspect script is absent from the loaded resource list and no registration path runs.

A proper callback-owner trace records where `new MutationObserver(...)` was constructed. When DevTools remains usable, instrument creation before loading the affected Session in the disposable client:

```js
const NativeMutationObserver = globalThis.MutationObserver
globalThis.MutationObserver = class TracedMutationObserver extends NativeMutationObserver {
  constructor(callback) {
    console.trace('MutationObserver registered')
    super(callback)
  }
}
```

This is a diagnostic-only client override. It changes runtime identity and timing, so a non-reproduction is not proof of absence. Never deploy it as a fix.

For each registered observer preserve:

- construction stack and script URL;
- observed root and options (`subtree`, `characterData`, `childList`, attributes);
- callback count and mutation-record count per animation frame;
- whether the callback writes to a node inside its own observed subtree;
- the first repeated target path and mutation type.

### C. Session content versus Session size

“All 18 Sessions removed” gives a project-level trigger set, not a minimal reproduction. On an offline cloned profile, test immutable generations that contain different subsets while keeping the client artifact constant. Never merge or renumber logs.

Once one Session is isolated, reduce a **sanitized exported fixture**, not the authoritative log. Preserve event order and block types while replacing private payloads with deterministic markers. Test these dimensions independently:

- event count and visible surface-node count;
- one very large text block;
- Markdown tables, code, math, nested lists, and bidirectional text;
- tool-result renderers and structured JSON trees;
- streaming/update events versus a settled replay;
- attachment and image blocks;
- selected Chat versus Trajectory view.

A small fixture that freezes identifies content shape. A large fixture with all special blocks removed that still freezes points toward scale, retained DOM, or client lifecycle.

## Detect the feedback edge

The causal loop needs both an observation and a write:

```text
DOM mutation
  → observer callback
  → selector/traversal
  → text or attribute write
  → new record inside observed scope
  → next microtask delivery
```

Count each edge. A stack containing `querySelectorAll` and `setNodeValue` is consistent with this loop but still does not show that every callback iteration writes a different value. A repair should avoid the feedback edge by contract:

- observe the narrowest owned root, not `document`;
- ignore records created by the observer's own output nodes;
- compare old and desired value before writing;
- disconnect or suppress observation around owned writes;
- batch at most once per animation frame when presentation can lag;
- cap records, scanned nodes, and callback wall time;
- trip a circuit breaker and identify the affected Session instead of freezing the shell;
- disconnect on component/plugin disposal and Session switches.

Do not use a timeout that silently resumes the same full-document scan forever. Do not drop arbitrary mutation records if that can leave accessibility labels, localization, or security indicators stale.

## Performance and regression gates

- [ ] The exact high-CPU PID is identified as Host, wrapper, or renderer.
- [ ] One native sample and one browser performance trace share a timestamp window.
- [ ] Loaded script URLs and digests identify every client contribution.
- [ ] A standalone official Web versus desktop-wrapper A/B changes only the shell.
- [ ] A clean client proves extensions and client plugins absent, not merely disabled.
- [ ] The observer construction stack names its owning script.
- [ ] The observed root and options are recorded.
- [ ] Mutation batches, records, selector scans, writes, and wall time are bounded.
- [ ] An owned write cannot immediately rematch itself indefinitely.
- [ ] Session switch and plugin disposal disconnect every observer they own.
- [ ] A minimal sanitized fixture reproduces the content or scale dimension.
- [ ] Large-history performance measures DOM nodes, listeners, heap, script, layout, and retained state.
- [ ] A circuit breaker preserves navigation and identifies the isolated Session.
- [ ] Failed rendering does not modify, delete, or renumber durable Session events.
- [ ] Archive remains a visibility operation; evidence retention is explicit.
- [ ] A fresh Session and the affected Session both work after the repair without the diagnostic override.

## Incident bundle

```text
DSH package/version/commit:
Desktop wrapper name, version, and source:
OS and WebKit/browser version:
Host, wrapper, and renderer PIDs/parents:
Selected Workspace and sanitized Session ID:
Native sample timestamp and hot stack:
Loaded script/module URL and digest list:
Observer registration stack:
Observed root and options:
Mutation batches/records/writes per second:
DOM nodes, listeners, JS heap, script/layout time:
Standalone Web versus wrapper result:
Clean client versus injected client result:
Minimal sanitized fixture dimensions:
Containment or archive action performed:
Private evidence location and retention owner:
```

## Primary sources

- [WebView MutationObserver loop report #4737](https://github.com/deepseek-ai/deepseek-harness/discussions/4737)
- [rc.2 official application roots](https://github.com/deepseek-ai/deepseek-harness/tree/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/apps)
- [rc.2 complex-history performance probes](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/apps/web/tests/complex-history.perf.ts)
- [rc.2 conversation shell and scrollport contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-conversation/README.md)
- [rc.2 Session archive wire contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/host/apiproxy/README.md)
- [rc.2 Session log export contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/session-query/session-log-export/README.md)
