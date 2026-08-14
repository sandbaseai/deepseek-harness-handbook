---
title: Configure Model Providers in DeepSeek Harness
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-14
---

# Configure DeepSeek and other model providers

DeepSeek Harness separates the Agent runtime from the model route. You can configure DeepSeek directly, choose an installed catalog provider, or define a custom OpenAI-compatible gateway.

## DeepSeek: the shortest path

Start the Web UI, open **Settings → Models**, enter the DeepSeek API key on the DeepSeek card, and save. The next request uses the change without a server restart.

![Official DeepSeek Harness Models page showing the DeepSeek provider card](https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/docs/user/guide/providers-models-page.png)

_Official DeepSeek Harness screenshot; see the [source guide](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/providers.md)._

Keys are write-only in the UI. The official guide says the secret is stored in `$DSH_HOME/.credentials.yaml`; settings retain only a credential reference and the page receives a redacted descriptor.

## Catalog providers

Use **Add provider** for an installed provider such as Anthropic or OpenAI. The catalog supplies endpoint, protocol, and model metadata. Native-auth providers have different requirements: Bedrock, Vertex, Azure, and Codex need their own credential flows and configuration, not only a generic API-key field.

## Custom providers

Use **Add a custom provider** for a company gateway, self-hosted endpoint, or unlisted service. Supply:

- a permanent lowercase Provider ID;
- display name and base URL;
- API protocol and credential;
- at least one model.

Provider IDs become part of requests, saved sessions, defaults, and credential references. To rename one, create a new provider and remove the old route.

![Official DeepSeek Harness custom provider form](https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/docs/user/guide/providers-custom-form.png)

## Model discovery and image input

**Fetch available models** queries the form's current endpoint and credential. OpenAI-compatible discovery expects `GET /models`; endpoints without it require manual model entries.

Manually entered models default to text-only because the endpoint cannot reliably advertise modalities. Declare a vision model explicitly in `$DSH_HOME/settings.yaml`:

```yaml
llm-pi-ai:
  providers:
    my-gateway:
      apiKeyEnv: GATEWAY_API_KEY
      api: openai-completions
      baseURL: https://gateway.example/v1
      models:
        - id: vision-preview
          input: [text, image]
```

This is a claim about the route, not a capability test. If the endpoint cannot accept images, it can still reject the request.

## Session behavior

Selecting a model makes it the default for new sessions. A session that already sent a request keeps the model recorded in its own event log. When testing route changes, start a new session unless continuity is intentional.

## Troubleshooting table

| Error or symptom | Action |
|---|---|
| `MISSING_CREDENTIAL` | store the key in Models or provide the referenced environment variable |
| `UNKNOWN_MODEL` | select a configured model or add it to the custom route |
| Model discovery returns 401 | verify the key; otherwise enter models manually |
| Image refused before sending | declare `input: [text, image]` for that custom model |
| Provider rejects an image | remove the incorrect modality claim and start a new session |
| Composer blocks after provider deletion | choose another configured model |

## Official sources

- [Configure models](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/providers.md)
- [Configuration catalog](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/config-catalog.md)
- [`dsh-llm-deepseek`](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/llm/llm-deepseek)
