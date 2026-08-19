---
title: Diagnose DeepSeek API Fetch Failures Behind a Proxy or Enterprise CA
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-19
---

# Diagnose DeepSeek API fetch failures behind a proxy or enterprise CA

Use this runbook when a model turn ends with an error such as:

```text
DeepSeek API request to https://api.deepseek.com failed
```

This exact outer message is a **Host-to-provider transport failure**. At upstream revision [`99f6f02`](https://github.com/deepseek-ai/deepseek-harness/commit/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca), the direct DeepSeek adapter emits it only when its global `fetch()` rejects before an HTTP response exists. DNS, refused connections, TLS validation, and proxy routing share this branch; the actionable detail is in the chained cause.

Do not confuse it with a browser-side `403` while opening the Web UI. Browser → Host ingress and Host → DeepSeek egress are independent connections.

## Preserve the error chain

Before changing configuration, record:

```text
Node version:
DSH version:
Launch command and shell:
Configured baseURL, without query or credentials:
Exact outer error:
First and deepest cause code/message:
Corporate proxy required: yes / no / unknown
TLS inspection used: yes / no / unknown
Same endpoint transport probe outside DSH:
```

Never paste an API key, authenticated proxy URL, full environment dump, or internal CA private key into an issue. A CA **certificate** is public trust material; its private key is not.

## Route the boundary before applying a fix

| Evidence | Boundary to investigate |
|---|---|
| `ENOTFOUND`, `EAI_AGAIN` | DNS resolution |
| `ECONNREFUSED`, `ETIMEDOUT`, unreachable route | firewall, proxy, VPN, or endpoint |
| `SELF_SIGNED_CERT_IN_CHAIN`, `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, certificate error | enterprise TLS interception or missing trust anchor |
| an HTTP `401` or `403` from the provider | request reached the provider or gateway; inspect credential, account, policy, and endpoint |
| HTTP `429` | quota or rate limiting, not proxy discovery |
| browser gets `403`, but the model error is `fetch failed` | diagnose ingress and egress separately |

The adapter deliberately separates these outcomes: rejected `fetch()` becomes `TRANSPORT`; non-2xx responses preserve HTTP status, provider message, request id, and valid `Retry-After` evidence.

## Run a credential-free transport probe

Use the same terminal that launches DSH. This probe sends no DeepSeek API key; any HTTP status proves DNS, TCP, TLS, and the selected proxy path reached an HTTP server.

### PowerShell

```powershell
node -e "fetch('https://api.deepseek.com').then(r => console.log('HTTP', r.status)).catch(e => { console.error(e, e.cause); process.exit(1) })"
```

### POSIX shell

```sh
node -e "fetch('https://api.deepseek.com').then(r => console.log('HTTP', r.status)).catch(e => { console.error(e, e.cause); process.exit(1) })"
```

If this fails with the same cause, keep debugging the Node process boundary. If it reaches HTTP while DSH still fails, compare the exact launch shell, environment, Node executable, resolved `baseURL`, and process owner.

## Branch A: the network requires an authorized proxy

DeepSeek Harness uses Node's global `fetch()` directly for this adapter. Merely defining `HTTPS_PROXY` is not sufficient on every supported Node minor: built-in environment-proxy support is version-gated and must be enabled at process startup.

First inspect the actual runtime rather than inferring from `package.json`:

```sh
node --version
node --help | grep -E -- '--use-env-proxy|use-system-ca'
```

On PowerShell:

```powershell
node --version
node --help | Select-String 'use-env-proxy|use-system-ca'
```

The Harness engine range begins at Node 22.19.0, while Node documents built-in environment-proxy support from later 22.x minors and the 24.x line. Feature-test the installed binary. If it lacks the proxy feature, upgrade to a supported Node minor that exposes it instead of injecting an unreviewed dispatcher into compiled DSH code.

Launch with your organization's approved proxy variables already set:

```sh
export HTTPS_PROXY='http://proxy.example:8080'
export NO_PROXY='localhost,127.0.0.1,::1'
export NODE_USE_ENV_PROXY=1
npx @deepseek-ai/dsh web
```

```powershell
$env:HTTPS_PROXY = 'http://proxy.example:8080'
$env:NO_PROXY = 'localhost,127.0.0.1,::1'
$env:NODE_USE_ENV_PROXY = '1'
npx @deepseek-ai/dsh web
```

Use only a proxy approved for the deployment. Keep loopback in `NO_PROXY` so local Web traffic does not leave the machine. If the proxy URL contains credentials, store and inject it through your organization's secret mechanism; do not save it in the profile or diagnostic bundle.

Re-run the credential-free Node probe with the same environment, then start DSH from that same shell.

## Branch B: the proxy performs TLS inspection

A proxy tunnel can work while TLS validation fails because Node does not trust the organization's issuing CA. Obtain the current PEM certificate from the administrator and extend trust **at process startup**:

```sh
export NODE_EXTRA_CA_CERTS='/approved/path/corporate-root.pem'
npx @deepseek-ai/dsh web
```

```powershell
$env:NODE_EXTRA_CA_CERTS = 'C:\approved\corporate-root.pem'
npx @deepseek-ai/dsh web
```

Node reads `NODE_EXTRA_CA_CERTS` only when the process starts. Setting it inside an already-running Host cannot repair that Host. On Node versions exposing `--use-system-ca`, the system trust store is another administrator-controlled option; verify the exact runtime and organizational policy first.

Do **not** set `NODE_TLS_REJECT_UNAUTHORIZED=0`. It disables certificate verification for the process and turns a trust-configuration problem into an interception vulnerability.

## Branch C: the request reached an HTTP endpoint

Once the error includes an HTTP status, stop changing proxy or CA settings.

| Status | Next evidence |
|---|---|
| 401 | selected credential reference, account, and sanitized provider response |
| 403 | provider/gateway policy, account entitlement, source-network restriction, and request id |
| 404 | resolved `baseURL`, gateway path contract, and selected model |
| 429 | provider retry delay, quota/balance evidence, and request id |
| 5xx | provider or gateway health plus a bounded retry on the same route |

The direct adapter resolves `baseURL` per request from settings, then trusted `DEEPSEEK_BASE_URL`, then `https://api.deepseek.com`. Record the winner without recording the key. A custom gateway receives Harness identity headers as well as the request, so treat it as part of the trusted provider boundary.

## Keep ingress separate

Opening `http://localhost:3080` or `http://127.0.0.1:3080` exercises Browser → Host. Sending a model turn exercises Host → provider. A browser origin or Host-header `403` can coexist with a working provider route; a provider transport failure can coexist with a perfectly rendered Web UI.

For remote Web access, follow the [remote Web control-plane guide](remote-web-secure-context.md). Do not change the Web host binding to fix outbound API access.

## Acceptance matrix

Complete all five checks from the same launch environment:

1. **Probe:** credential-free Node `fetch()` reaches an HTTP status.
2. **Trust:** no TLS verification warning or certificate-chain error appears.
3. **Local UI:** the intended loopback URL loads without sending local traffic through the proxy.
4. **Provider:** one bounded model turn reaches the configured route and streams a terminal result.
5. **Restart:** a fresh Host started from the documented shell retains the proxy and CA behavior.

Then remove any temporary verbose logging and preserve only sanitized evidence.

## Unsafe false fixes

- Do not disable TLS verification.
- Do not paste proxy credentials or API keys into YAML, screenshots, or issues.
- Do not assume `curl` success proves Node inherited the same proxy or CA configuration.
- Do not change `baseURL` to an unofficial relay merely to bypass network policy.
- Do not increase retry counts for deterministic DNS, certificate, or authentication failures.
- Do not expose the Web UI on `0.0.0.0` to repair provider egress.

## Sources

- [Direct DeepSeek adapter request and error boundary](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/llm/llm-deepseek/src/adapter.ts#L297-L338)
- [Direct adapter configuration and base URL resolution](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/llm/llm-deepseek/README.md)
- [Node built-in proxy support](https://nodejs.org/api/http.html#built-in-proxy-support)
- [Node `NODE_EXTRA_CA_CERTS` and proxy environment options](https://nodejs.org/api/cli.html#node_extra_ca_certsfile)
- [Original community failure report](https://github.com/deepseek-ai/deepseek-harness/discussions/175)
