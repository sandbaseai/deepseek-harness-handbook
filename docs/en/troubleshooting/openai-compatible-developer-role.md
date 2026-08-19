---
title: Fix Developer Role 400 Errors in DeepSeek Harness OpenAI-Compatible Providers
locale: en
content_revision: 1
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

## Why rc.7 configuration cannot express the exact fix

The rc.7 `llm-pi-ai` compatibility schema exposes only:

```yaml
compat:
  thinkingFormat: deepseek
  supportsReasoningEffort: true
```

It does not expose `supportsDeveloperRole`. Changing `thinkingFormat` controls the reasoning payload dialect, not the system-message role. Changing `supportsReasoningEffort` controls a reasoning field, not role support.

## Capture before changing the route

Record:

- provider route ID, protocol, and exact base URL;
- model ID and declared `reasoningEfforts`;
- the first outbound system-message role;
- the complete 400 body and request ID;
- an A/B request that differs only between `developer` and `system`.

Do not log the API key or full user prompt.

## Recovery choices

### 1. Use a verified compatible route

For production, route through a provider profile whose system role and reasoning dialect are already verified. This is the safest immediate option when request integrity matters.

### 2. Declare a non-reasoning compatibility route

If the gateway can serve the model without selectable reasoning metadata, a separate route with `reasoningEfforts: false` avoids marking it as a reasoning model. Verify the actual outbound role and model behavior. Do not claim that this disables provider-side reasoning unless the provider documents that behavior.

### 3. Apply a temporary local dependency patch

For an isolated test installation, forcing `supportsDeveloperRole: false` for the affected endpoint can prove the diagnosis. Treat this as disposable evidence: reinstalling or upgrading replaces `node_modules`, and a process restart is required.

### 4. Fix the configuration boundary upstream

The durable design is to expose `supportsDeveloperRole` in the Harness compatibility profile, or add a correct built-in provider detector. A user-defined OpenAI-compatible route should be able to declare the roles its gateway accepts without editing dependencies.

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
- The corrected route succeeds without changing credentials or user content.
- Reasoning controls still match the documented provider behavior.
- Unrelated providers preserve their previous role selection.
- Restart and reinstall behavior is documented for any local patch.
- Secrets and prompt bodies remain absent from the incident report.

## Source boundary

Verified against DeepSeek Harness `0.1.0-rc.7` commit `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca` and its pinned `@earendil-works/pi-ai` dependency range.

- [Upstream Ark reproduction #3379](https://github.com/deepseek-ai/deepseek-harness/discussions/3379)
- [`llm-pi-ai` compatibility schema](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/llm/llm-pi-ai/src/config.ts)
- [Reasoning and compatibility resolution](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/llm/llm-pi-ai/src/catalog.ts)
- [Official generic provider guide](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/llm/llm-pi-ai/README.md)
