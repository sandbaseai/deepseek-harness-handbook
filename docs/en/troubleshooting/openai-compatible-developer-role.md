---
title: Fix Developer Role 400 Errors in DeepSeek Harness OpenAI-Compatible Providers
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-19
---

# Fix `developer` role 400 errors in OpenAI-compatible providers

Use this guide when a custom DeepSeek Harness provider rejects a request like:

```text
400 InvalidParameter: messages.role has invalid value developer;
supported values are system, assistant, user, tool
```

This is not an API-key failure. The request reached the gateway, but the adapter and gateway disagree about the role used for the system prompt.

## Trace the role decision

For an `openai-completions` route backed by pi-ai, the system prompt can become `developer` when both conditions are true:

```text
model.reasoning = true
compat.supportsDeveloperRole = true
```

A hand-declared model with `reasoningEfforts` has reasoning metadata. pi-ai then derives compatibility from the provider identity and base URL. If an OpenAI-compatible gateway is not in its non-standard endpoint detection, it can be assumed to support `developer` even when its protocol accepts only `system`.

The Ark endpoints reported in upstream Discussion #3379 demonstrate this boundary: the same request succeeds with `system` and fails with `developer`.

## Respect the rc.7 versus rc.8 boundary

The rc.7 `llm-pi-ai` compatibility schema exposes only:

```yaml
compat:
  thinkingFormat: deepseek
  supportsReasoningEffort: true
```

It does not expose `supportsDeveloperRole`. Changing `thinkingFormat` controls the reasoning payload dialect, not the system-message role. Changing `supportsReasoningEffort` controls a reasoning field, not role support.

rc.8 adds `supportsDeveloperRole` to the configurable compatibility profile for `openai-completions` and the three OpenAI Responses protocols. It can be set at route level or per model; a model value wins per field over the route value, then the installed catalog, then pi-ai detection.

For a gateway whose entire route accepts only `system`, keep reasoning efforts and declare the wire fact explicitly:

```yaml
llm-pi-ai:
  providers:
    volcengine:
      apiKeyEnv: VOLCENGINE_API_KEY
      api: openai-completions
      baseURL: https://ark.cn-beijing.volces.com/api/plan/v3
      compat:
        supportsDeveloperRole: false
      models:
        - id: deepseek-v4-flash
          reasoningEfforts:
            off: null
            high: high
            max: max
```

Do not leave `supportsDeveloperRole:` valueless. rc.8 rejects null rather than silently falling through to URL detection.

## Capture before changing the route

Record:

- provider route ID, protocol, and exact base URL;
- model ID and declared `reasoningEfforts`;
- the first outbound system-message role;
- the complete 400 body and request ID;
- an A/B request that differs only between `developer` and `system`.

Do not log the API key or full user prompt.

## Recovery choices

### 1. On rc.8, declare the route or model compatibility

Set `compat.supportsDeveloperRole: false`, restart or reload through the normal settings lifecycle, create a fresh Session, and capture the first outbound role. This preserves the reasoning selector while keeping the system prompt on `system`.

Use a model-level override when only one model behind a mixed route needs it:

```yaml
models:
  - id: deepseek-v4-flash
    reasoningEfforts:
      high: high
    compat:
      supportsDeveloperRole: false
```

### 2. Use a verified compatible route

For production, route through a provider profile whose system role and reasoning dialect are already verified. This is the safest immediate option when request integrity matters.

### 3. On rc.7, declare a non-reasoning compatibility route

If the gateway can serve the model without selectable reasoning metadata, a separate route with `reasoningEfforts: false` avoids marking it as a reasoning model. Verify the actual outbound role and model behavior. Do not claim that this disables provider-side reasoning unless the provider documents that behavior.

### 4. Apply a temporary local dependency patch

For an isolated test installation, forcing `supportsDeveloperRole: false` for the affected endpoint can prove the diagnosis. Treat this as disposable evidence: reinstalling or upgrading replaces `node_modules`, and a process restart is required.

### 5. Backport the rc.8 configuration boundary deliberately

If rc.7 must remain deployed, prefer a reviewed backport of the rc.8 configuration contract over an untracked `node_modules` edit. Preserve exact source, build, package, and rollback identity. A built-in detector can still improve defaults, but a private gateway's URL cannot reliably describe its role contract.

## Verification matrix

| Case | Expected role | Expected result |
|---|---|---|
| affected reasoning route before correction | `developer` | reproducible 400 |
| same endpoint with role correction | `system` | request accepted |
| non-reasoning model | `system` | unchanged behavior |
| verified native OpenAI route | provider contract | no regression |
| `openai-responses` route | independently captured | protocol-specific result |

Test both `openai-completions` and `openai-responses` if the deployment exposes both. They have separate compatibility paths.

## Acceptance gates

- Wire capture proves the system-message role.
- The effective DSH version is rc.8 before relying on the native compat key.
- The corrected route succeeds without changing credentials or user content.
- Reasoning controls still match the documented provider behavior.
- Unrelated providers preserve their previous role selection.
- Restart and reinstall behavior is documented for any local patch.
- Secrets and prompt bodies remain absent from the incident report.

## Source boundary

Verified against DeepSeek Harness `0.1.0-rc.8` commit `141eb6fef83422698aef7a981029e843e8161534`. rc.7 lacks the configurable field; rc.8 exposes it at route and model scope.

- [Upstream Ark reproduction #3379](https://github.com/deepseek-ai/deepseek-harness/discussions/3379)
- [Reasoning-depth plus system-role report #3531](https://github.com/deepseek-ai/deepseek-harness/discussions/3531)
- [rc.8 `llm-pi-ai` compatibility schema](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/llm-pi-ai/src/config.ts)
- [rc.8 reasoning and compatibility resolution](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/llm-pi-ai/src/catalog.ts)
- [rc.8 generic provider guide and compat example](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/llm-pi-ai/README.md)
