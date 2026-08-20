---
title: Configure OpenCode Go Models in DeepSeek Harness
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
---

# A model listing is not a callable route

Use this guide when an OpenCode Go key can fetch models in DeepSeek Harness but only some selected models work, or a failed request is reduced to `API key is invalid`.

Do not rotate the key from that label alone. The current OpenCode Go catalog spans three wire protocols, and account settings may also change which regional models the subscription can use. Authentication, entitlement, model identity, endpoint prefix, and protocol are separate facts.

## Pin the product endpoint first

OpenCode documents the Go model-list endpoint as:

```text
https://opencode.ai/zen/go/v1/models
```

The corresponding DSH base URL is the prefix:

```text
https://opencode.ai/zen/go/v1
```

Do not substitute the ordinary Zen prefix `/zen/v1`. A key can be valid for one product surface without authorizing another.

## Read the official model table as a routing table

OpenCode Go currently publishes model-specific endpoints. Examples include:

| Model | Model id | Wire path | DSH protocol |
|---|---|---|---|
| DeepSeek V4 Flash | `deepseek-v4-flash` | `/chat/completions` | `openai-completions` |
| GPT 5.6 Luna | `gpt-5.6-luna` | `/responses` | `openai-responses` |
| Qwen3.7 Plus | `qwen3.7-plus` | `/messages` | `anthropic-messages` |

This table changes independently of the DSH release. Recheck the official Go page before adding models.

## Understand what Fetch available models proves

In rc.8, a custom OpenAI-compatible route probes `<baseURL>/models` with Bearer authentication. The parser adopts:

- model id;
- optional display name;
- optional context-window fields;
- optional output-cap fields.

It does not read a per-model request protocol or endpoint path. The result proves that one credential reached the listing endpoint and that the response advertised identifiers. It does not prove:

- each model is entitled for this account;
- each model is enabled for the account's region;
- the selected route protocol matches that model;
- a conversation request will use the correct path and body;
- the advertised capacities or modalities are complete.

## Split one gateway into protocol-homogeneous routes

A custom rc.8 provider route has one route-level `api`. Its `models` entries do not carry independent protocol or base-URL fields. Therefore, do not adopt the full mixed OpenCode Go listing into one custom route.

Use separate route identities with the same credential reference and base prefix:

```yaml
providers:
  opencode-go-chat:
    displayName: OpenCode Go · Chat
    apiKeyEnv: OPENCODE_GO_API_KEY
    api: openai-completions
    baseURL: https://opencode.ai/zen/go/v1
    models:
      - id: deepseek-v4-flash
      - id: deepseek-v4-pro

  opencode-go-responses:
    displayName: OpenCode Go · Responses
    apiKeyEnv: OPENCODE_GO_API_KEY
    api: openai-responses
    baseURL: https://opencode.ai/zen/go/v1
    models:
      - id: gpt-5.6-luna

  opencode-go-messages:
    displayName: OpenCode Go · Messages
    apiKeyEnv: OPENCODE_GO_API_KEY
    api: anthropic-messages
    baseURL: https://opencode.ai/zen/go/v1
    models:
      - id: qwen3.7-plus
```

This is an illustrative subset, not a promise that those models are enabled for your account. Use the Models UI to store the credential instead of placing a literal key in YAML.

Model discovery supports only `openai-completions` and `openai-responses`. The Messages route must be entered by hand because rc.8 intentionally returns `DISCOVERY_UNSUPPORTED` for protocols whose listing shape it cannot safely guess.

## Classify the first provider response

Capture the HTTP status, sanitized response body, provider request id, selected DSH route, model id, and request path.

| Evidence | Primary branch |
|---|---|
| `GET /models` returns 401/403 | wrong product endpoint, credential, or subscription access |
| listing works; every model call returns 401 | request auth/header or product-endpoint mismatch |
| listing works; only one model family fails | protocol/path mismatch or model entitlement |
| `/chat/completions` works; `/responses` fails | Responses route or model entitlement, not a globally invalid key |
| provider body names region or availability | change the account/provider setting only after verifying its data-residency effect |
| DSH sends a model to the wrong path | split or correct the route; do not rotate the key |
| a new Session works after route correction | the old Session retained its logged provider/model selection |

The UI phrase `API key is invalid` is a presentation summary. The provider response and observed request route are the incident evidence.

## Treat the region option as policy

The upstream #3538 discussion reports that enabling models deployed in China can change availability. That is account-side OpenCode behavior, not an rc.8 DSH configuration key.

Before enabling it, determine:

- which models become available;
- where prompts, attachments, and tool-derived context are processed;
- whether organizational policy permits that region;
- whether the option affects only new requests;
- how to reverse it and confirm the prior boundary.

Do not recommend a region toggle as a universal authentication fix.

## Verify one route at a time

1. Save the exact OpenCode Go base prefix and credential reference.
2. Fetch models only on a listable route; retain the returned ids without assuming protocol.
3. Cross-check each chosen id against OpenCode's official Go endpoint table.
4. Put it under the matching DSH protocol route.
5. Start a new Session and send one bounded text-only prompt.
6. Confirm the observed request path, model id, status, and provider request id.
7. Repeat independently for each protocol family.
8. Add tools, images, reasoning, or long context only after the base text route passes.

## Acceptance gates

- The base URL contains `/zen/go/v1`, not the ordinary Zen prefix.
- No API key value appears in settings exports, screenshots, logs, or issues.
- Every configured model has a verified official Go endpoint and matching DSH protocol.
- Mixed protocol families use separate route identities.
- Model listing success is not reported as generation success.
- A 401/403 retains the sanitized provider body and request id.
- One failing model does not trigger blind rotation of a key that works elsewhere.
- Region changes are reviewed as data-residency and entitlement policy.
- Each route passes a fresh-Session text request on its expected wire path.
- Existing Sessions are not used to prove a changed default route.

## Source boundary

Verified against DeepSeek Harness rc.8 commit `141eb6fef83422698aef7a981029e843e8161534` and the OpenCode Go documentation checked on 2026-08-20. OpenCode's model roster and entitlement policy can change; its live official table is authoritative for current model endpoints.

- [Upstream OpenCode Go report #3538](https://github.com/deepseek-ai/deepseek-harness/discussions/3538)
- [Official OpenCode Go endpoints](https://dev.opencode.ai/docs/go/)
- [rc.8 model discovery implementation](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/llm-pi-ai/src/discovery.ts)
- [rc.8 provider profile schema](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/llm-pi-ai/src/config.ts)
- [Configure model providers](../getting-started/model-providers.md)
- [Diagnose developer-role compatibility](openai-compatible-developer-role.md)
