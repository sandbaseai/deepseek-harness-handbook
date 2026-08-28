---
title: Diagnose a Blank Web Client in Firefox
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-28
sources:
  - https://github.com/deepseek-ai/deepseek-harness/discussions/4919
---

# Diagnose a Blank Web Client in Firefox

If DeepSeek Harness shows history and accepts prompts in Chrome but Firefox renders an empty surface, treat it as a **client bootstrap or browser-compatibility boundary** first. Do not reset the Session directory or rotate provider credentials until the same server has been tested from another browser.

This guide is based on the upstream Firefox report for `0.1.1-rc.2` and is deliberately diagnostic: the report does not yet establish a single Firefox-specific root cause.

## 1. Classify the failure

Record four observations before changing anything:

| Observation | What it suggests |
|---|---|
| Chrome can list history and start a turn | The server, profile, and Session data are probably reachable. |
| Firefox is blank before a workspace is selected | Client bootstrap, cached assets, or a browser API boundary is more likely. |
| Firefox renders the shell but cannot create a conversation | Inspect the first failed API request and console exception. |
| Both browsers fail | Move to server, profile, provider, or persistence diagnostics. |

## 2. Capture Firefox evidence without mutating data

Open Firefox Developer Tools before refreshing the page:

1. In **Console**, preserve the log and reload once. Capture the first exception, not only the final cascade.
2. In **Network**, enable “Persist Logs”, reload, and filter for `fetch`, `WebSocket`, and requests returning `4xx` or `5xx`.
3. Check whether the document, JavaScript chunks, and stylesheet requests are `200`. A chunk or service-worker mismatch can leave a blank shell while the server is healthy.
4. Record the Firefox version, DeepSeek Harness version, profile, and whether the page is opened over `http://localhost` or a remote origin.

Avoid clearing all browser data as a first step: it destroys the evidence needed to distinguish stale assets from a runtime error.

## 3. Re-test with a clean browser state

Use a private Firefox window or a fresh Firefox profile and disable extensions for one run. If the clean profile works, re-enable extensions one at a time and inspect storage or content-blocking errors. If it remains blank, compare the failing request and console stack with Chrome.

When a service worker is present, unregister only the site’s worker and reload. Do not delete the Session directory; browser storage and server-side Session persistence are different layers.

## 4. Check the server boundary

Confirm that Chrome and Firefox use the same origin and port. Then verify that the Web UI process is still listening and that a direct health or document request returns successfully. If Firefox is remote, check origin, proxy, certificate, and WebSocket forwarding separately; a page can load while its event channel is blocked.

## 5. Escalate with a minimal reproduction

An actionable upstream report should include:

- exact DeepSeek Harness version and Firefox version;
- local versus remote origin and profile name;
- whether a private window reproduces the issue;
- the first console exception;
- the failing Network request, status, and response type;
- a comparison result from Chrome on the same server.

Redact tokens, cookies, workspace paths, and Session contents. Link the report to the upstream discussion so maintainers can correlate browser behavior with the shipped client revision.

## Related guides

- [Recover Web from a Client plugin boot failure](web-client-plugin-boot-failure.md)
- [Diagnose a WebView MutationObserver CPU loop](webview-mutation-observer-loop.md)
- [Run the Web UI](../getting-started/quickstart.md)

## Source

- [Upstream Firefox report #4919](https://github.com/deepseek-ai/deepseek-harness/discussions/4919)
