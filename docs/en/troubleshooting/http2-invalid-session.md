---
title: Diagnose ERR_HTTP2_INVALID_SESSION Crashes in DeepSeek Harness
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-15
---

# Diagnose `ERR_HTTP2_INVALID_SESSION` crashes

If `dsh web` exits with `Error [ERR_HTTP2_INVALID_SESSION]: The session has been destroyed`, diagnose the model-provider transport before reinstalling DeepSeek Harness. The exception is emitted by Node's HTTP/2 stack and may surface through `undici` while a provider request is in flight.

This guide was verified against upstream revision [`47f9438`](https://github.com/deepseek-ai/deepseek-harness/commit/47f943859bef60e4160492346772ded9b24f765a).

## Recognize the failure

A representative terminal tail looks like this:

```text
node:internal/http2/core
Error [ERR_HTTP2_INVALID_SESSION]: The session has been destroyed
    at ClientHttp2Session.request
    at requestStream (node:internal/deps/undici/undici:...)
```

The important evidence is the complete stack and *when* it occurs:

| Failure point | First hypothesis to test |
|---|---|
| before the Web URL is printed | startup or composition failure, not this guide |
| when the first model turn starts | provider endpoint, TLS, proxy, or HTTP/2 negotiation |
| during streaming output | upstream connection closure or stale pooled session |
| after several successful turns | connection reuse, idle timeout, proxy, or gateway behavior |

Do not infer an out-of-memory failure from the process exit alone. An HTTP/2 session error describes a transport lifecycle failure, not available RAM.

## Run a controlled A/B test

Use the same disposable workspace and prompt for every run. Change only one variable at a time.

### 1. Capture versions without secrets

In PowerShell:

```powershell
node --version
npm --version
npx @deepseek-ai/dsh --version
```

Node 26 is not automatically unsupported: the upstream package declares `^22.19.0 || >=24.0.0`, and upstream compatibility CI includes Node 26. Still, comparing with Node 24 helps identify a runtime-specific transport regression.

If you use nvm-windows:

```powershell
nvm install 24
nvm use 24
node --version
npx @deepseek-ai/dsh web
```

**Success evidence:** the same provider request completes repeatedly on Node 24.

**If both versions fail:** continue to the network and provider tests; the Node version is no longer the leading discriminator.

### 2. Capture the uncaught stack

```powershell
$env:NODE_OPTIONS = "--trace-uncaught"
npx @deepseek-ai/dsh web
```

Reproduce once and retain the terminal output. Remove API keys, authorization headers, query-string credentials, and private paths before sharing it.

Clean up the temporary option after the test:

```powershell
Remove-Item Env:NODE_OPTIONS
```

### 3. Isolate the network path

Repeat the same turn with the system proxy or VPN disabled, then on a different trusted network if available.

```text
Run A: normal network + current provider
Run B: no proxy/VPN + current provider
Run C: alternate trusted network + current provider
```

**Success evidence:** only one network path fails consistently.

**Interpretation:** inspect that path's reverse proxy, TLS termination, HTTP/2 idle timeout, and connection-reset logs. Do not disable certificate verification as a workaround.

### 4. Isolate the provider route

Use a second configured provider/profile with the same prompt. Record only:

```text
Provider adapter:
Base URL hostname (no path, query, or key):
Direct or reverse-proxied:
Streaming enabled:
Turns completed before failure:
```

If one route is stable and another crashes, the differentiator is likely the endpoint or its network path—not the workspace or Web UI.

Dump the active composition when profile selection may be involved:

```powershell
dsh --profile web --dump-config
```

Sanitize the output before attaching it to a report.

## Decision table

| Result | Next action |
|---|---|
| Node 24 succeeds; Node 26 fails | report a Node-version regression with both traces |
| direct connection succeeds; proxy/VPN fails | inspect the intermediary's H2/session settings |
| one provider fails; another succeeds | report the failing adapter, sanitized hostname, and gateway behavior |
| every route fails immediately | test DNS/TLS reachability and verify resolved profile configuration |
| Web UI stays up but one turn fails visibly | capture the durable turn error; this differs from a host-process crash |
| host process exits from the uncaught exception | report the complete stack and minimal reproduction upstream |

## What to include in an upstream report

```text
Operating system and build:
DSH package version:
Node versions tested:
Provider adapter:
Sanitized base hostname:
Proxy/VPN/reverse proxy:
Streaming on/off:
Minimal prompt:
Turns before failure:
Complete sanitized stack:
Node 24 result:
Node 26 result:
```

A resilient host should turn a failed provider transport into a diagnosable turn failure rather than terminate the whole process. Whether a request can be retried safely depends on whether output or tool effects have already occurred; never blindly replay a partially completed agent turn.

## Official sources

- [Supported Node engine range](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/package.json#L8-L10)
- [Node 22/26 compatibility matrix](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/.github/workflows/ci.yml#L283-L302)
- [Upstream development requirements](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/docs/development.md#L7-L13)
- [Upstream transport-error discussion](https://github.com/deepseek-ai/deepseek-harness/discussions/1655)
