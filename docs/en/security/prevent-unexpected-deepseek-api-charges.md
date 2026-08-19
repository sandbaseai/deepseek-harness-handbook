---
title: Prevent Unexpected DeepSeek API Charges in DeepSeek Harness
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
---

# Prevent unexpected DeepSeek API charges

DeepSeek Harness rc.7 ships two independent DeepSeek-backed network routes: the normal model adapter and the `web_search` provider. Clearing the model list in Settings changes discovery, but it does **not** unregister either route.

This is a configuration-boundary problem, not proof that every installation is being billed. A request reaches the public DeepSeek endpoint only when the relevant row is loaded, selected, and able to resolve a usable credential. Treat those conditions separately.

> [!CAUTION]
> If cost containment is urgent, revoke or cap the credential at the provider first. A Harness configuration change is not an authoritative spending limit, and an already-running process may still hold work in flight.

## The four boundaries

```mermaid
flowchart LR
  A[Catalog visibility<br>models: []] --> B[Route registration<br>llm-deepseek]
  B --> C[Route selection<br>default model or web search]
  C --> D[Credential resolution<br>DEEPSEEK_API_KEY]
  D --> E[Network dispatch<br>api.deepseek.com]
```

| Boundary | rc.7 behavior | What proves it is closed |
|---|---|---|
| Catalog visibility | `models` is advisory; an empty list hides advertised models | UI/model discovery is empty |
| Route registration | `llm-deepseek` still registers `deepseek-official`; `web-search-deepseek` separately registers the same provider ID in the Web seam | effective composition marks the row `disabled: true` |
| Route selection | new Agents default to `deepseek-official/deepseek-v4-flash`; Web search is pinned to `deepseek-official` | an alternate default is selected, or the consuming tool is disabled |
| Credential resolution | chat and search resolve `DEEPSEEK_API_KEY` independently at request time | key is revoked/absent and a controlled request fails before dispatch |

Closing only the first boundary does not close the other three.

## Why `models: []` is not an off switch

The rc.7 DeepSeek adapter describes `models` as an **advisory** catalog. `listModels()` returns that catalog, but `resolveModel()` accepts an uncatalogued model ID and builds fallback metadata. The adapter remains registered as `deepseek-official`.

Therefore this settings fragment:

```yaml
llm-deepseek:
  models: []
```

means “advertise no models.” It does not mean “unload the adapter,” “reject this provider ID,” or “erase the credential.”

Web search is a second path. The base bundle pins `web.searchProvider` to `deepseek-official` and loads `web-search-deepseek`, which calls the Anthropic-compatible DeepSeek Messages endpoint and resolves `DEEPSEEK_API_KEY` for each search. It does not send the request through `llm-deepseek`.

## Emergency stop

1. Stop new Agent turns and searches.
2. Cancel or shut down the running Harness process; confirm it exited.
3. Revoke, rotate, or restrict the DeepSeek API credential in the provider control plane.
4. Preserve the current profile, home patch, settings, process environment, and Session logs as evidence.
5. Check provider usage for the relevant key and time window. Do not infer zero cost from a quiet UI.

Credential revocation is the only step here that remains effective if the local composition is stale or another process uses the same key.

## Build a no-DeepSeek-egress profile

First configure and test the replacement provider. Record its exact provider and model IDs. Then stop Harness and back up both user layers:

```sh
cp "$DSH_HOME/settings.yaml" "$DSH_HOME/settings.yaml.before-cost-boundary"
cp "$DSH_HOME/cordis.patch.yml" "$DSH_HOME/cordis.patch.yml.before-cost-boundary" 2>/dev/null || true
```

If `DSH_HOME` is unset, rc.7 normally resolves it to `~/.dsh`. Use an explicit path rather than editing whichever directory happens to be current.

Add a machine-wide override to `$DSH_HOME/cordis.patch.yml`:

```yaml
- id: agent-default-model
  config:
    provider: my-approved-provider
    model: my-approved-model

- id: llm-deepseek
  disabled: true

- id: web-search-deepseek
  disabled: true

- id: tool-web
  disabled: true
```

Replace the two placeholder IDs with a route you have already proved. The home patch applies after bundle and per-profile layers, so it covers Web, headless, and other profiles launched from that Harness home.

Why disable `tool-web` too? With the shipped `web.searchProvider` still pinned to `deepseek-official`, disabling only the provider converts a possible paid request into `WEB_PROVIDER_CONFIGURED_MISSING`. Removing the model-facing tool makes the intended “no Web search from this deployment” boundary explicit. If you install an approved search provider instead, patch `web.searchProvider` to its exact ID and keep `tool-web` enabled.

Do not disable `agent-default-model` without supplying an alternative. New Agents need a usable model selection, and old Sessions may retain a session-specific selection. Create a fresh Session for the proof run.

## Verify the effective graph before boot

Composition evidence is available without loading the plugins:

```sh
dsh --profile web --dump-config > effective-web.yml
rg -n 'agent-default-model|llm-deepseek|web-search-deepseek|tool-web|disabled' effective-web.yml
```

Repeat for every deployed profile:

```sh
for profile in web headless; do
  dsh --profile "$profile" --dump-config > "effective-$profile.yml"
done
```

The evidence must show:

- the default provider and model equal the approved replacement;
- `llm-deepseek`, `web-search-deepseek`, and `tool-web` are disabled;
- a later `--patch` overlay did not re-enable or replace those rows;
- the process uses the intended `DSH_HOME`.

`--dump-default-config` is not sufficient: it excludes the user patch that enforces this boundary. Use `--dump-config` for the effective profile.

## Verify effects, not just configuration

Run a fresh Session in a disposable workspace with controlled network observation:

1. Confirm the selected model is the approved replacement.
2. Run one bounded prompt and verify the replacement provider receives it.
3. Confirm `web_search` is absent. If an alternate search provider is installed, run one query and verify its destination.
4. Observe DNS, proxy, firewall, or egress logs and confirm no request targets `api.deepseek.com` or the configured DeepSeek search base.
5. Check the DeepSeek provider usage view after its documented reporting delay.

Absence of `web/deepseek-search-llm-request` events is useful but not a complete network proof. Likewise, a disabled row proves composition intent but not that every older process has stopped.

## Telemetry is a separate decision

The shipped telemetry row defaults its mode to `DISABLED`. Telemetry is not the DeepSeek model-billing path. To hard-disable the row at launcher composition time, set any non-empty value:

```sh
export DSH_TELEMETRY_DISABLED=1
```

In rc.7, even the strings `0` and `false` disable telemetry; presence is the switch. Verify the effective config. Do not mix telemetry privacy evidence with model-cost evidence.

## Regression gates

- [ ] Provider-side key limits or revocation are defined independently of Harness.
- [ ] Every deployed process has stopped before configuration replacement.
- [ ] The replacement model route works before DeepSeek rows are disabled.
- [ ] `$DSH_HOME/cordis.patch.yml` is the file actually composed.
- [ ] `dsh --profile <name> --dump-config` shows all three disabled rows.
- [ ] New Sessions select the approved replacement provider and model.
- [ ] Existing Sessions are not reused blindly with a retained DeepSeek selection.
- [ ] `web_search` is absent or resolves to one explicitly approved provider.
- [ ] Controlled egress evidence shows no DeepSeek API destination.
- [ ] Provider usage is checked after the reporting delay.
- [ ] Telemetry is evaluated separately from paid model and search routes.
- [ ] Upgrade tests repeat the graph and egress checks before rollout.

## Primary sources

- [Official discussion #3446: default paid-route concern](https://github.com/deepseek-ai/deepseek-harness/discussions/3446)
- [Base bundle at rc.7](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/bundle/base/cordis.patch.yml)
- [DeepSeek adapter at rc.7](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/llm/llm-deepseek/src/adapter.ts)
- [DeepSeek adapter registration and settings at rc.7](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/llm/llm-deepseek/src/index.ts)
- [DeepSeek Web search provider at rc.7](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/web/web-search-deepseek/src/provider.ts)
- [Profile composition and telemetry switch at rc.7](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/apps/cli/src/profile-boot.ts)

