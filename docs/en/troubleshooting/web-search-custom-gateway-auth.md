---
title: Fix DeepSeek Harness Web Search Authentication on a Custom Gateway
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
---

# Fix Web Search authentication on a custom gateway

DeepSeek Harness can chat successfully through a custom gateway while every `web_search` call fails with `401 Authentication Fails`, a reserved-tool error, or no structured search results. This is not contradictory: rc.8 ships two independent provider paths.

```text
conversation model
  → llm-deepseek
  → OpenAI-compatible chat base
  → DEEPSEEK_BASE_URL or llm-deepseek.baseURL

web_search tool
  → dsh-tool-web → ctx.web
  → web-search-deepseek
  → Anthropic Messages base + /messages
  → DEEPSEEK_SEARCH_BASE_URL or web-search-deepseek.baseURL
```

The search provider deliberately does not inherit `DEEPSEEK_BASE_URL`. Its default is `https://api.deepseek.com/anthropic/v1`, while its default credential reference is still `DEEPSEEK_API_KEY`. If that reference contains a key issued only by your custom chat gateway, search can send the gateway key to the official DeepSeek search endpoint and receive a valid 401.

## Contain an endpoint/key mismatch first

Stop repeated searches. Capture the effective endpoint without printing the credential. If a secret reached an unintended service, treat it as disclosed to that service and follow the issuing gateway's rotation policy.

For a deployment that should not search until configuration is reviewed, disable both the provider and its model-facing tool in the applicable user patch:

```yaml
- id: web-search-deepseek
  disabled: true

- id: tool-web
  disabled: true
```

Disabling only the provider leaves a visible `web_search` tool that fails at selection. Disabling only the tool leaves the provider mounted but removes model access through the shipped tool. Patch the intended profile or `$DSH_HOME/cordis.patch.yml`, then verify with `--dump-config`; do not assume editing a file stopped an older Host process.

## Prove which path failed

Record:

```text
DSH version or commit:
Conversation provider/model:
Conversation base hostname:
Search provider selected by the web row:
Search base hostname:
Search credential reference name (not value):
Search model:
Exact HTTP status and provider message:
Latest web/deepseek-search-llm-request endpoint:
Whether the gateway supports Anthropic Messages:
Whether it supports web_search_20250305:
```

The rc.8 search provider appends a secret-free `web/deepseek-search-llm-request` Session event immediately before dispatch. It records the resolved endpoint, API version, and body—but no headers or key. That event is stronger evidence than the currently selected chat model because search does not call `ctx.llm`.

| Evidence | Likely boundary |
|---|---|
| chat succeeds, search event targets `api.deepseek.com` | search base remained on its independent default |
| search endpoint is correct, HTTP 401/403 | credential reference resolves the wrong key or gateway auth differs |
| gateway rejects custom function name `web_search` as reserved | gateway interpreted the request as ordinary client tools, not the required native server tool |
| HTTP 200, no `web_search_tool_result` blocks | Messages API exists but native search did not run or response dialect is incomplete |
| request redirects | provider rejects redirects before following the new target |
| no request event | failure happened before dispatch, often credential resolution or cancellation |

## Configure a compatible search route

The built-in Settings section can update the endpoint for the next search. In a reviewed profile overlay, replace the existing row by ID:

```yaml
- id: web-search-deepseek
  config:
    apiKeyEnv: GATEWAY_SEARCH_API_KEY
    baseURL: https://gateway.example/anthropic/v1
    model: gateway-search-model
    maxTokens: 4096
    maxUses: 5
```

Store the key under the credential reference; do not put a literal secret in the patch. Use a separate reference when chat and search credentials have different issuers, scopes, or rotation lifecycles.

The base must be the Anthropic-compatible root. DSH appends `/messages`, so this example dispatches to:

```text
https://gateway.example/anthropic/v1/messages
```

Do not configure a URL already ending in `/messages`. The provider sends both `x-api-key` and `Authorization: Bearer` with the same secret so either common Anthropic-compatible auth style can resolve; the gateway must tolerate that header set.

Environment fallback is also separate:

```sh
export DEEPSEEK_SEARCH_BASE_URL=https://gateway.example/anthropic/v1
```

Changing only `DEEPSEEK_BASE_URL` cannot redirect built-in search. Prefer the settings/credential planes for a managed deployment, then prove the effective composition:

```sh
dsh --profile web --dump-config > effective-web.yml
rg -n 'web$|web-search-deepseek|tool-web|baseURL|apiKeyEnv|searchProvider' effective-web.yml
```

Redact literal secrets if the dump contains any before sharing it.

## Protocol compatibility is stricter than “OpenAI-compatible”

The built-in search provider makes a full Anthropic Messages model request whose body contains:

```json
{
  "tools": [{
    "type": "web_search_20250305",
    "name": "web_search",
    "max_uses": 5
  }]
}
```

A compatible gateway must:

1. accept `POST {baseURL}/messages` with the configured `anthropic-version`;
2. recognize `web_search_20250305` as a native server tool, not a client-defined function;
3. run search server-side;
4. return `web_search_tool_result` blocks containing `web_search_result` items;
5. preserve citation blocks when snippets are expected.

An OpenAI chat-completions gateway can be perfectly adequate for conversation traffic and still be incompatible with this search route. Pointing search at it may replace a 401 with a 400 or with `DeepSeek returned no web_search_tool_result blocks`; that is not recovery.

## Choose one of three honest outcomes

### Use official DeepSeek search

Keep the official Anthropic base and resolve an official DeepSeek key under the search credential reference. The conversation can still use another provider. Record the independent cost and data boundary: every search is a separate model request and may perform up to `maxUses` server-side searches.

### Use a verified compatible gateway

Set the search base, model, and credential reference together. Verify the endpoint event, gateway access log, structured result blocks, source mapping, and credential rotation.

### Disable or replace built-in search

If the gateway lacks native Anthropic search semantics, disable `web-search-deepseek` and either disable `tool-web` or install a reviewed provider implementing the `ctx.web` search seam. When replacing it, patch the `web` row's `searchProvider` to the replacement's exact ID. Audit community plugins before installation; identical tool names do not prove identical trust, cost, or SSRF boundaries.

## Acceptance gates

- [ ] conversation and search endpoints are recorded separately;
- [ ] credential reference names are recorded without secret values;
- [ ] any misdelivered credential follows issuer rotation policy;
- [ ] repeated failing searches are stopped during diagnosis;
- [ ] `--dump-config` proves the intended provider rows and endpoint override;
- [ ] the search base does not already end in `/messages`;
- [ ] the search key is valid for the resolved search hostname;
- [ ] the gateway accepts the Anthropic Messages request and header set;
- [ ] `web_search_20250305` is a native server tool on that gateway;
- [ ] the response contains structured `web_search_tool_result` blocks;
- [ ] the Session request event names the expected endpoint and model;
- [ ] no credential appears in logs, screenshots, patches, or reports;
- [ ] one bounded search returns citeable sources;
- [ ] independent search latency, token cost, and `maxUses` are accepted;
- [ ] an incompatible route is disabled or replaced rather than described as fixed.

## Primary sources

Verified against DeepSeek Harness rc.8 commit `141eb6fef83422698aef7a981029e843e8161534` on 2026-08-20.

- [Official custom-gateway authentication report #408](https://github.com/deepseek-ai/deepseek-harness/discussions/408)
- [rc.8 DeepSeek Web Search provider](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/web/web-search-deepseek/src/provider.ts)
- [rc.8 settings and environment resolution](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/web/web-search-deepseek/src/index.ts)
- [rc.8 provider contract and limitations](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/web/web-search-deepseek/README.md)
- [rc.8 shipped Web composition](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/bundle/base/cordis.patch.yml#L397-L417)
- [Prevent unexpected DeepSeek API charges](../security/prevent-unexpected-deepseek-api-charges.md)
- [Audit a community plugin before installation](../security/community-plugin-audit.md)
