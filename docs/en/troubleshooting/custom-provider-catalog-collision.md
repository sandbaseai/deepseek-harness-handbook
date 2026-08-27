---
title: Recover a custom provider that collides with the installed catalog
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-27
upstream_revision: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Recover a custom provider that silently uses the catalog protocol

Use this runbook when a custom OpenAI-compatible provider has the intended `baseURL` and model, but the request uses another wire protocol—for example, `POST /v1/messages` instead of `POST /v1/chat/completions`—and returns 404.

Official report #4759 reproduces this with provider id `minimax`, an OpenAI-compatible MiniMax endpoint, and no explicit `api`. At pinned rc.2 source `b150a55`, this is deterministic routing behavior, not random endpoint fallback.

## Treat provider id as executable configuration

`llm-pi-ai` resolves the profile dictionary key as the provider route identity. `buildProvider()` then asks the installed pi-ai catalog for the same id:

```ts
const catalog = catalogProvider(spec.provider)
if (catalog !== undefined && spec.api === undefined) {
  return reuseCatalogProvider(catalog, spec)
}
```

`reuseCatalogProvider()` can override provider-level display metadata and materialized model `baseUrl`, but delegates `stream()` and `streamSimple()` to the installed catalog provider. Therefore:

| Provider id | Explicit `api` | Construction | Protocol owner |
|---|---|---|---|
| absent from installed catalog | omitted | rejected as unserviceable | none |
| absent from installed catalog | supported value | new configured provider | explicit protocol |
| present in installed catalog | omitted | reused catalog provider | installed catalog |
| present in installed catalog | supported value | new configured provider | explicit protocol |

A changed `baseURL` does not override the stream implementation. Endpoint and protocol are separate route facts.

## Recover with an explicit protocol

For a genuinely custom OpenAI Chat Completions endpoint, declare all three identities:

```yaml
llm-pi-ai:
  providers:
    minimax-openai-cn:
      displayName: MiniMax OpenAI CN
      apiKeyEnv: MINIMAX_API_KEY
      api: openai-completions
      baseURL: https://api.minimax.cn/v1
      models:
        - id: MiniMax-M3
```

Use an application-owned id such as `minimax-openai-cn` rather than intentionally replacing a catalog key. The distinct id keeps Sessions, defaults, credential references, logs, and rollback unambiguous. If continuity requires the catalog id, an explicit supported `api` still forces configured-provider construction, but test every catalog capability you are replacing.

Do not put the secret directly in YAML. `apiKeyEnv` is a credential reference; set the secret in the launcher environment or use the Models credential flow.

The pinned build accepts only:

- `openai-completions`;
- `openai-responses`; and
- `anthropic-messages`.

Do not infer the protocol from a provider marketing name or URL. Verify the endpoint contract you are authorized to use.

## Prove the route without exposing credentials

Start a fresh Session and collect one sanitized request boundary:

```text
DSH version and source commit:
profile owner and provider dict key:
displayName:
resolved model id:
explicit api value or <omitted>:
sanitized baseURL origin and path prefix:
HTTP method and final pathname:
request content-type and protocol-specific header names:
first response status and body category:
fresh-Session result:
rollback result:
```

Interpret the first path before changing keys:

| Observed request | Meaning |
|---|---|
| `POST .../chat/completions` | OpenAI Completions implementation owns dispatch |
| `POST .../responses` | OpenAI Responses implementation owns dispatch |
| `POST .../messages` | Anthropic Messages or a catalog provider using that dialect owns dispatch |
| no request; `needs an api` | non-catalog custom route omitted its protocol |
| no request; unsupported-protocol error | profile named a protocol outside this build's supported table |

A 404 on `/messages` is protocol-path evidence, not API-key evidence. A 401/403 after the correct path is credential, entitlement, or gateway-policy evidence.

## Preserve catalog behavior deliberately

Catalog reuse exists for a reason: native providers may own authentication discovery, compatibility quirks, dynamic implementation state, and protocols that the generic profile cannot reconstruct. Do not globally disable reuse to fix one collision.

An upstream hardening change should keep backward compatibility while making ambiguous intent visible. Reasonable acceptance gates are:

1. a catalog id with omitted `api` still reuses the catalog provider;
2. an explicit supported `api` still constructs the requested generic provider;
3. a changed `baseURL` plus omitted `api` on a catalog id produces a clear warning or confirmation in authoring surfaces;
4. the UI labels the inherited protocol before save;
5. saved configuration and effective runtime route agree;
6. tests assert the final protocol/path, not only provider id and model list;
7. secrets remain redacted; and
8. existing Sessions keep their durable provider/model identity while fresh Sessions prove the new route.

Do not silently reinterpret every `baseURL` override as OpenAI-compatible. Catalog providers can legitimately be repointed to same-protocol gateways, and a URL does not prove a wire dialect.

## Rollback

1. Preserve the failing sanitized route evidence.
2. Remove or disable the custom profile in an isolated settings copy.
3. Restore the known-good catalog-only provider or the previous distinct custom id.
4. Verify the effective provider directory after reload.
5. Start a fresh Session and prove its request path.
6. Keep the old Session for audit; do not rewrite its logged provider identity.

## Primary evidence

- [Official custom-provider collision report #4759](https://github.com/deepseek-ai/deepseek-harness/discussions/4759)
- [rc.2 provider construction and catalog reuse](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/llm-pi-ai/src/provider.ts)
- [rc.2 provider profile resolution](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/llm-pi-ai/src/config.ts)
- [rc.2 catalog-route tests](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/llm-pi-ai/tests/catalog.spec.ts)
- [Provider configuration guide](../getting-started/model-providers.md)
- [Bailian catalog identity runbook](bailian-token-plan-catalog-route.md)
