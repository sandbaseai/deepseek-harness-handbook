---
title: Configure Bailian Token Plan without Losing Catalog Compatibility
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
---

# Configure Bailian Token Plan without losing catalog compatibility

Use this guide when a manually declared Alibaba Cloud Bailian Token Plan route produces one or more of these symptoms:

- no reasoning-effort selector;
- `developer is not one of ['system', 'assistant', 'user', 'tool', 'function']`;
- `API key is invalid` or `no adapter registered` after adding a compatibility field;
- only the models listed in YAML remain visible.

These symptoms can share one cause: replacing a provider identity that DeepSeek Harness already knows with a hand-declared OpenAI-compatible route. The endpoint may be healthy and the credential may be correct while the route has lost installed model metadata.

## Use the catalog route first

For the Bailian Token Plan CN catalog, start with the smallest profile:

```yaml
llm-pi-ai:
  providers:
    qwen-token-plan-cn:
      displayName: Bailian Token Plan CN
      apiKeyEnv: AIBABA_API_KEY
```

Set `AIBABA_API_KEY` in the environment of the process that starts DSH. Do not paste the secret into the profile.

Omitting `api`, `baseURL`, and `models` is intentional. It preserves the installed catalog's endpoint, protocol, model list, reasoning levels, and wire-compatibility facts. Verify the exact provider key exposed by your installed release rather than assuming a key from a newer build.

## Why the manual route loses capabilities

A hand-declared model such as this has no installed catalog entry under its custom provider identity:

```yaml
providers:
  aibaba:
    api: openai-completions
    baseURL: https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1
    apiKeyEnv: AIBABA_API_KEY
    models:
      - id: qwen3.7-max
```

The request can still authenticate and generate text, but DSH must derive capabilities from what the declaration supplies. If `reasoningEfforts` is absent, a hand-declared model exposes no reasoning selector. If endpoint detection treats the route like OpenAI, a reasoning request can use the `developer` role even though this Bailian endpoint accepts `system` instead.

The selector is evidence about model metadata, not evidence that the provider supports or lacks reasoning internally.

## Do not diagnose a 400 as an API-key failure

Capture the first provider response before changing credentials:

| Evidence | Meaning |
|---|---|
| HTTP 401/403 before a model response | credential, account, entitlement, or gateway authentication |
| HTTP 400 naming `developer` | authentication succeeded; message-role compatibility is wrong |
| `settings-rejected` naming a field | profile/schema boundary; the new route was not accepted |
| `no adapter registered for provider` | route registration failed or the selected provider key is absent |
| old route still works after an edit | the settings watcher preserved the last good registration |

The rc.7 settings watcher can log that it is “keeping the previously registered routes after a refused update.” A downstream credential-looking message may therefore describe the route that remained registered, not the edit you thought was active.

## Version boundary: rc.7 and rc.8 differ

In rc.7, configurable `compat` contains only:

```yaml
compat:
  thinkingFormat: deepseek
  supportsReasoningEffort: true
```

Adding `supportsDeveloperRole` is outside that release's profile schema. Do not use it as an rc.7 recovery. Prefer the built-in catalog route or upgrade in an isolated profile.

In rc.8, the compatibility schema expands and explicitly includes `supportsDeveloperRole`. A genuinely custom `openai-completions` route can declare:

```yaml
compat:
  supportsDeveloperRole: false
```

Treat this as a versioned configuration feature, not a portable YAML key. Pin the runtime and validate the resolved configuration before deployment.

## Understand `models`: replacement, inheritance, and overrides

On a catalog route, a non-empty `models` array replaces the served catalog. Every model that should remain visible must appear in that array. An entry with only `id` inherits fields from the installed catalog when that ID exists:

```yaml
qwen-token-plan-cn:
  apiKeyEnv: AIBABA_API_KEY
  models:
    - id: qwen3.7-max
    - id: deepseek-v4-pro
```

This is a deliberate narrowed catalog, not an additive list.

rc.8 also documents `modelOverrides` for changing individual installed models while retaining the rest of the catalog:

```yaml
qwen-token-plan-cn:
  apiKeyEnv: AIBABA_API_KEY
  modelOverrides:
    qwen3.7-max:
      maxTokens: 32768
```

An override must name a model already present in the installed catalog. It cannot sit beside a replacing `models` list, and it cannot add an unknown image or audio model. A model absent from the catalog still requires a complete declaration, and declaring `models` still replaces the route's visible set.

## Add a custom model deliberately

If you must serve a model absent from the installed catalog:

1. dump or inspect the catalog route you are replacing;
2. list every model the route must continue to serve;
3. declare the new model's protocol, endpoint inheritance, capacities, input modalities, reasoning levels, and compatible wire behavior;
4. validate in an isolated DSH home/profile;
5. compare provider catalog, selector metadata, first request wire shape, and tool round-trip with the known-good route;
6. promote only after rollback restores the original catalog-only profile.

Do not assume image/audio models work merely because their IDs resolve. The model's input and response protocol must be representable by the selected adapter.

## Evidence-driven recovery

1. Save the current profile and sanitized resolved config.
2. Return the route to the minimal catalog declaration.
3. restart or reload the exact profile owner.
4. verify the route appears and the expected catalog models return.
5. open a fresh Agent Session and inspect reasoning choices for the exact model.
6. capture the first request role and provider response without logging secrets.
7. add one supported override at a time only if the catalog default is insufficient.
8. after each change, prove the active configuration changed; do not infer activation from a saved form.

## Acceptance gates

- [ ] the runtime version and commit are recorded;
- [ ] the provider key matches the installed configurable-provider directory;
- [ ] the API key exists only in the launcher environment or secret store;
- [ ] the minimal catalog route registers without manual endpoint fields;
- [ ] expected catalog models remain visible;
- [ ] the reasoning selector matches the exact model metadata;
- [ ] the first wire message uses a role the endpoint accepts;
- [ ] a provider 400 is not relabeled as authentication failure;
- [ ] schema rejection is visible and names the invalid field;
- [ ] a `models` list is treated as replacement;
- [ ] `modelOverrides` names only installed models and is not combined with `models`;
- [ ] custom models are tested for protocol and modality, not only ID lookup;
- [ ] a fresh Session proves the new model surface;
- [ ] rollback restores the catalog-only route;
- [ ] logs and reports contain no API key.

## Primary sources

Verified against DeepSeek Harness rc.7 `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca` and rc.8 `141eb6fef83422698aef7a981029e843e8161534` on 2026-08-20.

- [Official Bailian Token Plan report #3495](https://github.com/deepseek-ai/deepseek-harness/discussions/3495)
- [rc.7 llm-pi-ai configuration schema](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/llm/llm-pi-ai/src/config.ts)
- [rc.8 llm-pi-ai configuration schema](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/llm-pi-ai/src/config.ts)
- [rc.8 catalog resolution](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/llm-pi-ai/src/catalog.ts)
- [rc.8 provider configuration contract](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/llm-pi-ai/README.md)
- [Developer-role compatibility runbook](openai-compatible-developer-role.md)
