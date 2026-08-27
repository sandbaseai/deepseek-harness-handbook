---
title: Pin OpenRouter Providers from DeepSeek Harness
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-27
upstream_revision: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Pin OpenRouter providers from DeepSeek Harness

OpenRouter accepts a request-body `provider` object for endpoint ordering, allowlists, fallback behavior, parameter support, data policy, and zero-data-retention routing. DeepSeek Harness `0.1.1-rc.2` cannot express that object in a generic provider profile.

This is intentional schema behavior, not YAML indentation trouble. The rc.2 pi-ai integration classifies `openRouterRouting` as withheld, excludes it from `PiAiCompatProfile`, rejects unknown or withheld compat keys, and forwards only the request options owned by the Harness LLM seam.

Use this guide to choose among three distinct outcomes:

1. keep OpenRouter's default routing;
2. encode stable routing in an OpenRouter Preset and reference that preset as the model;
3. design a source change that offers a typed routing field without introducing arbitrary JSON passthrough.

> [!WARNING]
> Do not add an undocumented `provider:` key to DSH settings or weaken strict schema validation. A silent raw-body merge can overwrite model, messages, tools, stream controls, identity, or security-sensitive vendor fields. Fail-loud whitelisting is the right boundary; the missing capability should be added to that boundary deliberately.

## Confirm the exact requirement

OpenRouter provider controls do not all mean “pin one backend”:

| Field | Meaning | Operational consequence |
|---|---|---|
| `order` | try named provider slugs first | other providers may still be used |
| `allow_fallbacks: false` | do not leave the chosen order after failure | lower availability |
| `only` | allow only named providers | reduced recovery set |
| `require_parameters` | use endpoints that support all request parameters | may eliminate otherwise valid endpoints |
| `data_collection` | allow or deny endpoints that may collect data | policy and availability tradeoff |
| `zdr` | restrict to Zero Data Retention endpoints | depends on account and endpoint eligibility |

Provider slugs can identify a provider family or an exact variant such as a turbo endpoint. Record the slug from OpenRouter's current provider catalog; do not infer it from a display name.

An `order` list alone is preference, not a hard pin. A hard routing claim needs either an appropriate `only` list or an ordered list with fallbacks disabled, plus a response-side verification.

## Why rc.2 rejects the field

At commit `b150a55`, `COMPLETIONS_COMPAT_GATE` classifies every upstream OpenAI Completions compatibility field. Most generic wire switches are offered. Vendor-owned fields including `openRouterRouting`, `vercelGatewayRouting`, and session-affinity controls are withheld.

The type and runtime gates reinforce each other:

```text
pi-ai upstream compat type
        ↓ classify every field
COMPLETIONS_COMPAT_GATE
        ↓ only disposition = offer
PiAiCompatProfile + Zod schema
        ↓ protocol-aware validation
materialized model compat
        ↓ adapter request options
pi-ai wire body
```

`assertOfferedCompatFields()` inspects every configured key before model materialization. A withheld field receives a specific rejection; an undeclared name is rejected as a field no wire protocol declares. This prevents a misspelling or wrong-protocol switch from being silently ignored.

The adapter then passes messages, tools, signal, reasoning level, temperature, maximum tokens, and Session identity to pi-ai. It does not accept an arbitrary request-body dictionary. Therefore these settings are not supported in rc.2:

```yaml
# Unsupported examples. Do not deploy.
compat:
  openRouterRouting:
    only: [azure]

extraBody:
  provider:
    only: [azure]
```

## Use an OpenRouter Preset for stable routing

OpenRouter Presets can store provider routing and be referenced directly through the request's model field as `@preset/<slug>`. This supplies a bounded workaround because DSH already sends a model id, while OpenRouter owns and validates the routing configuration.

Create and verify a preset in an authorized OpenRouter workspace. Keep the preset narrow:

```json
{
  "model": "openai/gpt-5-mini",
  "provider": {
    "only": ["azure"],
    "allow_fallbacks": false
  }
}
```

Then configure the exact preset reference as the model id on a dedicated DSH route. The following is a design shape; align key names and credential references with the pinned DSH settings schema:

```yaml
llm-pi-ai:
  providers:
    openrouter-azure:
      api: openai-completions
      baseURL: https://openrouter.ai/api/v1
      apiKeyEnv: OPENROUTER_API_KEY
      models:
        - id: "@preset/azure-gpt5-mini"
          name: Azure GPT-5 Mini via OpenRouter
          contextWindow: 400000
          maxTokens: 128000
```

Use capacities verified for the preset's actual model. Do not copy the illustrative numbers without checking the current model record. A profile `models` list replaces the route catalog, so a dedicated route prevents one preset entry from hiding an existing OpenRouter catalog.

### Keep the preset out of the Agent control plane

OpenRouter Presets can also store system prompts, generation parameters, and tools. For a DeepSeek Harness Agent, those fields can silently change the effective persona, tool catalog, cost, and security boundary after the DSH configuration has been reviewed.

For routing-only use:

- store only the model and provider routing fields;
- do not add a system prompt;
- do not add OpenRouter server tools or function tools;
- do not change temperature or output limits unless they are part of the reviewed deployment contract;
- restrict who can update the preset;
- record the preset slug, designated version, review time, and owner;
- re-run the verification gate after a preset update.

OpenRouter addresses the latest designated preset version through the stable slug. That improves operational iteration but means the DSH profile alone is not a complete deployment record.

## Verify the provider that actually served the request

Do not treat a successful response as proof of provider pinning. Capture a bounded test through an authorized account and compare:

1. the exact DSH route and model id;
2. the outbound request model field, with secrets and messages redacted;
3. the OpenRouter generation or routing record;
4. the provider and endpoint variant that served the request;
5. whether any fallback occurred;
6. the expected model, usage, and cost metadata;
7. a deliberate negative case where the allowed provider is unavailable or ineligible.

For a hard pin with fallbacks disabled, the negative case should fail rather than silently choose another provider. Never cause a real production outage to run this test; use a disposable account, synthetic prompt, or a controlled eligibility mismatch.

## When a local gateway is appropriate

A reviewed local or internal gateway can inject the `provider` object before forwarding to OpenRouter. Use this only when Presets cannot meet the deployment requirement, such as per-tenant or per-request routing selected by trusted policy.

The gateway must own a typed policy, not accept model-generated JSON. At minimum:

- bind callers to an authenticated tenant and approved routing policy id;
- replace, rather than merge, the provider-routing object;
- refuse unknown provider slugs and fields;
- preserve DSH cancellation and streaming backpressure;
- strip secrets and message content from routine logs;
- cap body and response sizes;
- expose upstream status, request id, chosen policy, and attempt count;
- keep tool schemas, messages, model, and stream controls immutable unless explicitly owned;
- verify TLS and never expose a credential-bearing unauthenticated listener.

This adds another failure and trust boundary. A localhost URL is not automatically safe, especially when Web and Host run for multiple users.

## Shape the upstream source change

The smallest durable source change is not `extraBody: Record<string, unknown>`. It is a typed, protocol-gated `openRouterRouting` profile field whose type follows pi-ai's upstream compatibility type.

A complete change should:

1. flip `openRouterRouting` from `withhold` to `offer` for `openai-completions`;
2. expose the exact upstream type through `PiAiCompatProfile`;
3. add the field to the strict Zod schema;
4. preserve the compile-time “every offered field is documented” and type-equality proofs;
5. define route-level versus model-level precedence;
6. prove non-OpenRouter routes cannot accidentally use it;
7. prove the final pi-ai wire request contains the expected `provider` object;
8. redact routing details appropriately in diagnostics;
9. document whether catalog routes and hand-declared OpenRouter routes may set it;
10. add upgrade coverage for pi-ai type changes.

If the field remains catalog-vendor-owned by design, a supported per-provider override seam is preferable to unscoped request passthrough.

## Failure router

| Symptom | Boundary | First evidence |
|---|---|---|
| settings reject `openRouterRouting` | DSH compat vocabulary | rc.2 gate disposition and error text |
| preset model is missing from selector | DSH model catalog | exact route generation and `models` replacement semantics |
| request returns unknown model | OpenRouter preset reference | workspace, slug, active version, API key ownership |
| response uses another provider | routing semantics | `only`, `order`, fallbacks, account policy, generation record |
| tools or persona change unexpectedly | preset contents | designated version, stored system and tools fields |
| works until preset edit | mutable remote configuration | version history, owner, review and rollback record |
| local gateway breaks streaming | proxy lifecycle | abort propagation, iterator teardown, buffering, upstream request id |
| DSH works but provider pin cannot be proven | observability | OpenRouter routing/generation metadata and negative test |

## Acceptance gate

- [ ] The deployment states whether routing is preference, allowlist, or hard pin.
- [ ] Provider slugs come from the current OpenRouter catalog.
- [ ] Fallback behavior is explicit and tested.
- [ ] The DSH profile contains no unsupported raw-body or compat keys.
- [ ] A routing-only preset contains no system prompt or tools.
- [ ] Preset ownership and designated version are recorded.
- [ ] The dedicated DSH route does not hide an unrelated installed catalog.
- [ ] Model capacities match the actual model behind the preset.
- [ ] A synthetic successful request records the serving provider.
- [ ] A controlled negative case proves the fallback claim.
- [ ] Usage and cost metadata remain attributable to the intended Session.
- [ ] A local gateway, if used, authenticates callers and accepts only policy ids.
- [ ] Cancellation and streaming remain bounded through the gateway.
- [ ] Logs contain no API keys, prompts, tool arguments, or full response bodies.
- [ ] Rollback covers both DSH configuration and the remote preset or gateway policy.

## Primary sources

- [Custom OpenRouter request-body field request #4707](https://github.com/deepseek-ai/deepseek-harness/discussions/4707)
- [rc.2 pi-ai compatibility gates and profile](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/llm-pi-ai/src/catalog.ts)
- [rc.2 strict pi-ai configuration schema](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/llm-pi-ai/src/config.ts)
- [rc.2 pi-ai adapter request boundary](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/llm-pi-ai/src/adapter.ts)
- [Official OpenRouter provider routing](https://openrouter.ai/docs/guides/routing/provider-selection)
- [Official OpenRouter Presets](https://openrouter.ai/docs/guides/features/presets)
