---
title: Fix "HTML Did Not Preload @deepseek-ai/dsh-client-modules/client.js"
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-28
verified_upstream: cd5ef8148158c3a752a658978873241fdf8e2bbc
---

# Fix `HTML did not preload @deepseek-ai/dsh-client-modules/client.js`

Use this guide when the Web UI stops during boot with:

```text
client-modules: HTML did not preload @deepseek-ai/dsh-client-modules/client.js
```

This is a precise browser boot-protocol invariant. It does not mean that the package is absent from `node_modules`. It means the page's inline module-loader facade reached `create()`, searched its registration queue for `@deepseek-ai/dsh-client-modules`, and found no factory.

## Understand the expected order

At alpha.1, the Host renders these rows into the document head in order:

```text
1. inline window.__ModuleLoader__ queue facade
2. advisory preload links for application bundles
3. parser-blocking /plugins bootstrap combo script
4. inline window.__DSH_BOOT__ graph
5. the Web shell later calls __ModuleLoader__.create(...)
```

The bootstrap combo must execute step 3 and call `window.__ModuleLoader__.load(...)` before step 5. The error proves step 1 ran and step 5 happened. It does **not** by itself distinguish a missing script tag, a failed `/plugins` response, incorrect bytes, out-of-order HTML rewriting, stale mixed revisions, or an unsupported bare frontend server.

## Capture one immutable boot sample

Use a private/incognito browser window or disable cache for the capture. Save the exact HTML and the bootstrap response from the same page load; do not combine evidence from different reloads because each Host start can issue new revision URLs.

```bash
curl -fsS http://127.0.0.1:PORT/ -o dsh-index.html
grep -o '/plugins/[^"<]*' dsh-index.html
grep -n '__ModuleLoader__\|__DSH_BOOT__\|script src=' dsh-index.html
```

Then request the exact bootstrap URL copied from that HTML:

```bash
curl -i 'http://127.0.0.1:PORT/plugins/??...&rev=...'
```

Preserve status, content type, content length, redirect chain, content encoding, and a hash of the body. In browser DevTools, export a HAR and record the first console error. Redact credentials and private plugin names before sharing evidence.

The bootstrap URL is normally a revisioned `/plugins/??...` combo containing the client-modules row. Do not invent the URL, strip its `rev`, or reuse one captured before a restart.

### Check the Node resolver signature before blaming the browser

Upstream discussion [#4885](https://github.com/deepseek-ai/deepseek-harness/discussions/4885) reports the same visible error on Node `24.9.0`, while Node 22 starts normally. In that case `resolveSync` was called with the older argument order; Node 24 threw a type error, the loader caught it and returned `undefined`, and the resulting empty client table caused the HTML invariant to fail. The browser message is therefore downstream evidence, not proof of a missing package or a cache defect.

Record the Node version, the first Host-side resolver exception, and whether the client table is empty before changing proxy or HTML settings. Compare a pinned Node 22 run with the same profile and source revision, then rebuild the client modules under the intended Node version. Do not “fix” the symptom by relaxing the preload assertion: a missing registration still means the Web runtime cannot safely construct its client graph.

## Route the failure

| Evidence | Boundary | Next action |
|---|---|---|
| HTML lacks `__ModuleLoader__`, bootstrap script, or `__DSH_BOOT__` | wrong server or missing Host index injection | verify launch command, listening process, profile, and response origin |
| HTML contains the bootstrap script but Network shows 404 | graph/route/revision mismatch | compare the HTML and request against the same Host generation; restart cleanly |
| response is HTML, login page, proxy error, or wrong MIME body | reverse proxy or route interception | bypass proxy locally; preserve `/plugins` path, query, and response bytes |
| request is blocked, canceled, CSP-rejected, or TLS-failed | browser/network policy | inspect DevTools reason and response/security headers |
| 200 JavaScript arrives but no client-modules registration appears | wrong, truncated, cached, or rewritten bundle bytes | hash direct and browser responses; inspect bundle for its registration id |
| bootstrap executes after the shell | script ordering was changed | remove `async`/`defer` injection and HTML optimizers; retain parser blocking |
| direct Host URL works but public URL fails | proxy/CDN/service worker boundary | purge the exact cached HTML and `/plugins` objects; exclude immutable revisions from rewriting |

### Detect a bare frontend launch

`apps/web` describes its `dist/` as being served by the CLI's `dsh web`. Its `dev` script is plain Vite. The client-modules Host plugin dynamically composes `window.__DSH_BOOT__`, registers the `/plugins` route, and injects the bootstrap script into the index response. Serving the static frontend alone cannot reproduce that Host contract.

If the page came from `vite`, a generic static server, an IDE preview, or a copied `dist/`, stop treating HTTP 200 as proof of a valid DSH Web boot. Launch the supported CLI/Web composition, then test the URL printed by that process. Bare Vite may be useful only when the documented development composition supplies the corresponding Host and injection path.

## Safe recovery sequence

1. Save the failing HTML, HAR, console stack, Host log, launch command, version, profile, and process listening on the port.
2. Fetch the same URL directly from localhost, bypassing reverse proxies and service workers.
3. Confirm the served HTML contains the queue facade, a parser-blocking bootstrap `<script src="/plugins/...">`, and `__DSH_BOOT__` in that order.
4. Fetch that exact bootstrap URL and require HTTP 200 JavaScript from the same Host generation.
5. If local direct boot works, repair or purge the proxy/CDN/service-worker layer without changing the DSH install.
6. If the direct Host response is incomplete, verify the intended Web composition loaded `dsh-client-modules` and inspect Host fiber/activation errors.
7. For a source checkout, build the repository with the pinned Node/pnpm/lockfile path before launch; do not mix generated client bundles from another revision.
8. Restart once, open a cache-disabled browser, and prove one internally consistent generation boots.

Do not begin by deleting Session storage, model configuration, credentials, or workspaces. This failure occurs before those application surfaces are usable and those deletions do not restore the bootstrap registration.

## Avoid mixed-generation fixes

Alpha.1 gives initial plugin revisions process-scoped nonces and serves advertised combo responses as immutable. A proxy that caches HTML longer than its referenced bundle availability, drops the query string, normalizes the `??` combo syntax, or serves a previous process's bundle can create an impossible page generation.

Keep these invariants:

- HTML and every referenced bootstrap URL belong to one Host generation;
- `/plugins` query strings arrive byte-for-byte at the DSH Host;
- no optimizer adds `async`, `defer`, `type=module`, or moves the bootstrap tag;
- security middleware permits the injected inline boot scripts and same-origin bootstrap request under the deployment's intended policy;
- service workers and browser caches cannot pair stale HTML with a new Host;
- a failed bundle request is visible and never replaced with a branded HTML error page carrying status 200.

## Maintainer regression contract

A Web deployment should continuously prove:

1. the rendered index contains exactly one queue facade before any bootstrap combo;
2. every bootstrap batch is a classic parser-blocking script in graph order;
3. the bootstrap combo returns the advertised revision and registers the client-modules id;
4. `create()` runs only after that registration exists;
5. `__DSH_BOOT__` matches the same composed graph and generation;
6. unknown or stale combo revisions fail visibly instead of returning fallback HTML;
7. root/index aliases receive the same structured injections;
8. proxy, compression, CSP, cold-cache, warm-cache, restart, and service-worker cases retain the order;
9. bare static/Vite launches either use a supported boot bridge or fail with an explicit unsupported-launch diagnostic;
10. browser tests assert the actual request and registration timeline, not merely a final HTTP 200.

## Evidence template

```text
Harness version/commit:
install or source checkout:
launch command and cwd:
profile/patches:
Node and pnpm versions:
browser and extensions:
page URL and listening process:
proxy/CDN/service worker present:
saved HTML hash:
bootstrap script URL:
bootstrap status/content-type/body hash:
script tag attributes and order:
__DSH_BOOT__ revision:
first console error:
Host activation/fiber error:
direct-local result vs public result:
```

## Verification boundary

The queue facade, exact error condition, structured index injection order, parser-blocking bootstrap rows, graph global, revisioned `/plugins` route, and corresponding source tests are verified at official alpha.1 commit [`cd5ef814`](https://github.com/deepseek-ai/deepseek-harness/tree/cd5ef8148158c3a752a658978873241fdf8e2bbc). Discussion #4836 supplies only the browser error and stack, so no specific cause—launch method, proxy, missing response, cache, or bundle corruption—is proven for that environment yet.

## Pinned official sources

- [Alpha.1 client-modules Host and boot injections](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/client/modules/src/index.ts)
- [Alpha.1 structured index renderer](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/host/webserver/src/injections.ts)
- [Alpha.1 Web server index injection path](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/host/webserver/src/index.ts)
- [Alpha.1 client-modules architecture and build requirements](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/client/modules/README.md)
- [Alpha.1 boot protocol tests](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/client/modules/tests/node-half.client.spec.ts)
- [Alpha.1 Web frontend package contract](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/apps/web/package.json)
- [Boot error report #4836](https://github.com/deepseek-ai/deepseek-harness/discussions/4836)
