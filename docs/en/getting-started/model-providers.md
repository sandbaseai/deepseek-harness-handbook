---
title: Configure Model Providers in DeepSeek Harness
locale: en
content_revision: 3
status: canonical
verified_at: 2026-08-28
upstream_revision: cd5ef8148158c3a752a658978873241fdf8e2bbc
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

## Recover providers after an alpha.1 upgrade

Official report #4817 says previously configured third-party models disappeared and **Add provider** stopped responding after upgrading to `dsh@0.1.2-alpha.1`. The report does not include browser, Host, profile, or configuration evidence, so it does not yet prove that alpha.1 removed third-party-provider support. The alpha.1 official guide still documents catalog and custom providers, while its `llm-pi-ai` dynamic-configuration tests prove that a settings write can register a new route and make its models callable.

The upgrade did change the Models page's client/Host contract. rc.2 loaded one wrapped `llm.providers({})` RPC response; alpha.1 joins separate typed `llm.listProviders()` and `llm.listConfigurableProviders()` results, and its settings and credentials calls use the new Remote shapes. A stale browser bundle or a partially mixed package closure can therefore fail before provider configuration is evaluated. That is a compatibility boundary, not proof that it caused every silent button.

Route the first observable failure:

| UI boundary | Evidence to capture | Next owner |
|---|---|---|
| **Add provider** does not open a draft | browser console; failed `/api` request; served asset URL/hash; Host stderr | client bundle / Remote compatibility |
| the draft opens but the action stays disabled | Provider ID, base URL, protocol, and presence of at least one valid model row | form validation |
| Apply starts but no provider is stored | response/error for settings mutation; redacted `settings.yaml` section; Host settings error | settings and credential write |
| profile exists but picker has no models | resolved `llm-pi-ai.providers` entry; route registration error; model catalog failure | adapter activation/catalog |
| model is selectable but the first request fails | exact provider/model ID, endpoint response, credential reference, network reachability | provider transport |

Do not delete `$DSH_HOME`, `.credentials.yaml`, or the provider entry. First stop the writer and preserve the small evidence set without printing secrets:

```sh
dsh --version
dsh --profile web --dump-config > web-effective-config.txt
dsh plugin --profile web list --depth 0
```

Record how DSH was installed and upgraded, the launch command, `$DSH_HOME` path, Node version, browser console error, failed request response, and Host stderr over the same click. Inspect only the `llm-pi-ai` section name and provider/model IDs in `$DSH_HOME/settings.yaml`; do not paste `.credentials.yaml` or credential values into an issue.

Then choose the matching recovery:

1. **Installed release:** stop every old DSH process, verify the executable selected by the shell, restart the same `web` profile, and hard-reload the page. A tab connected to an old process is not repaired by installing a new CLI elsewhere.
2. **Source checkout:** run the repository's required build for the checked-out commit before starting it. The alpha.1 CLI reference explicitly warns that source launch does not check frontend freshness, so existing bundles can silently run older browser code.
3. **Mixed external profile packages:** use `dsh plugin --profile web list --depth 0` and `why <package>` to identify profile-owned copies. Do not install duplicate DSH core packages as a quick fix; in-box bundles must resolve from the running DSH installation, while third-party bundles own their declared dependency closure.
4. **Valid form but rejected write:** preserve the response and repair only the rejected field. For a truly custom route, supply an explicit protocol and model list; a route absent from the installed catalog cannot resolve from an empty profile.
5. **Stored route but old Session:** select the restored route in a new Session. Existing Sessions retain their recorded model selection.

The repair is proven only when the same process serves a matching client, the settings mutation returns success, the provider row survives a reload, a new Session lists the exact provider/model pair, and one bounded request reaches the intended endpoint. UI appearance alone does not prove the credential or inference route.

### Local Ollama through the custom-provider form

Ollama exposes an OpenAI-compatible API. Before opening DeepSeek Harness, prove that the endpoint and model are available from the machine or container running the Harness process:

```bash
curl http://127.0.0.1:11434/v1/models
ollama list
```

Then choose **Add a custom provider** and enter:

| Field | Value |
|---|---|
| Provider ID | `ollama` |
| Display name | `Ollama` |
| Base URL | `http://127.0.0.1:11434/v1` |
| API protocol | `openai-completions` |
| API key | leave blank |
| Model ID | the exact installed name, including a tag such as `qwen2.5-coder:7b` |

The current form does not reject a loopback HTTP URL. It enables creation only after the Provider ID is valid, the base URL is non-empty, and at least one valid model row exists. A blank key is accepted for a route that does not require authentication.

`localhost` is resolved by the Harness host, not by the browser displaying the Web UI. If Harness runs in Docker, a VM, WSL, or on another machine, `127.0.0.1` points inside that environment. Use an address reachable from the Harness process and keep Ollama off untrusted networks.

If **Fetch available models** fails, compare it with the direct `/v1/models` request above. You can enter the model manually when discovery is unavailable, but the first turn will still fail unless the host can reach the chat-completions endpoint and the model ID matches.

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
| Ollama form cannot be created | add at least one exact model ID; the base URL alone is not enough |
| Ollama works with `curl` on the laptop but not in Harness | test from the Harness host/container; its loopback may be different |
| Image refused before sending | declare `input: [text, image]` for that custom model |
| Provider rejects an image | remove the incorrect modality claim and start a new session |
| Composer blocks after provider deletion | choose another configured model |
| Add provider is silent immediately after alpha.1 upgrade | capture the browser/Host Remote failure; rule out a stale source bundle or mixed runtime before editing provider data |

## Official sources

- [Configure models](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/providers.md)
- [Configuration catalog](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/config-catalog.md)
- [`dsh-llm-deepseek`](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/llm/llm-deepseek)
- [Official alpha.1 provider-upgrade report #4817](https://github.com/deepseek-ai/deepseek-harness/discussions/4817)
- [alpha.1 Models store and Remote calls](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/client/ui-settings-models/src/client/store.ts)
- [alpha.1 dynamic provider configuration tests](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/llm/llm-pi-ai/tests/dynamic-config.spec.ts)
- [alpha.1 CLI source-build and profile reference](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/apps/cli/reference/README.md)
