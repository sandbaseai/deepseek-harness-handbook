---
title: Control DeepSeek Harness Response and Reasoning Language
locale: en
content_revision: 3
status: canonical
verified_at: 2026-08-29
upstream_revision: 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
---

# Control response and reasoning language in DeepSeek Harness

If you write in Chinese but the Agent answers or reasons in English, diagnose two outputs separately:

## A different failure: reasoning can leak into the text channel

Do not confuse a language preference with a block-classification failure. Upstream Discussion [#3021](https://github.com/deepseek-ai/deepseek-harness/discussions/3021) records intermittent rc.7/rc.2 turns in which long provider reasoning is stored and rendered as ordinary `text`. The strongest signature is a multi-tool-call turn where `reasoning-chunks` drops to zero (or near zero), `text-chunks` inflates, and the durable `assistant/message` plus replay metadata contain `[text, tool-call]` with no `reasoning` block. The same-session neighboring turns can be healthy.

Use these checks before changing prompts or forcing a different language:

1. Compare one leaking turn with an adjacent healthy turn under the same provider, model, and reasoning setting.
2. Count typed `reasoning-chunks`, `text-chunks`, and `tool-call-chunks`; do not infer the channel from visible prose.
3. Inspect the durable block shape and replay metadata. If the reasoning block is absent there too, the client renderer is not the owner.
4. Preserve the exact DSH package, route, turn sequence, and sanitized request headers; avoid deleting the Session while collecting evidence.

This report points to the assembler/adapter seam that maps provider `reasoning_content` and interleaved tool-call deltas, not to translation. Until a release fixes that seam, treat leaked thinking as a privacy and output-budget defect: use a fresh disposable Session for sensitive work, keep reasoning display policy explicit, and report the smallest decoded evidence rather than the full hidden monologue.

## A clipped Think row is a rendering problem, not proof of leakage

Discussion [#4834](https://github.com/deepseek-ai/deepseek-harness/discussions/4834) describes a different presentation defect: the collapsed Think-row summary can begin mid-word with no leading ellipsis or fade. That visual crop can look like truncated or leaked reasoning, but it does not change the durable `reasoning`/`text` block classification. Inspect the stored assistant blocks and the expanded row before escalating a privacy incident.

For a UI fix, preserve the distinction between content and its preview: expose an explicit clipped state, keep the full text available through the disclosure, and test long unbroken strings, CJK text, RTL text, zoom, narrow viewports, and screen-reader labels. Do not “repair” a clipped preview by copying reasoning into the visible text channel or by changing provider serialization. A renderer-only change is not evidence that the upstream assembler bug in #3021 is fixed.

- **answer text** is the provider's visible assistant content;
- **reasoning text** is the provider's `reasoning_content`, rendered in a separate Think row.

DeepSeek Harness does not translate either stream. A Chinese browser interface also does not impose a Chinese model language.

> [!IMPORTANT]
> In rc.7, the shipped deployment persona is empty by default. The fixed Harness identity is one English sentence, and tool-specific prompt sections are commonly English, but there is no built-in global persona that says “always answer in English.” Inspect the effective composition, model route, conversation history, and gateway before assigning one cause.

## Four language owners

| Layer | Owns | What it does not own |
|---|---|---|
| user turn | immediate requested output language | future Sessions unless repeated |
| deployment persona | stable language and style preference in every assembled system prompt | guaranteed internal reasoning behavior |
| provider/model/gateway | generated answer and reasoning tokens | Harness UI locale |
| Web renderer | displays text and reasoning blocks | translation or language normalization |

The direct DeepSeek adapter adds no language prose. It sends the assembled system prompt, messages, tools, and call configuration, then maps `reasoning_content` and visible `content` into distinct blocks without rewriting their text.

## Start with a clean A/B test

Create a fresh Session on the same provider/model and send:

```text
Reply only in Simplified Chinese. Keep code, commands, identifiers, paths,
error messages, and URLs unchanged. Give the conclusion first.
```

Use a neutral task that does not quote a large English document. Compare:

```text
same provider/model
same reasoning effort
old Session vs fresh Session
answer language
Think-row language
request/header route and reasoning effort
```

Interpret the result:

| Result | Likely boundary |
|---|---|
| fresh answer is Chinese, old Session stays English | accumulated conversation/history bias |
| answer is Chinese, Think row is English | provider reasoning-language choice |
| both remain English in a fresh Session | prompt composition, gateway injection, or model behavior |
| only one provider route ignores the request | route-specific adapter, gateway, or model policy |
| changing browser locale changes labels but not output | expected UI-only localization |

## Add a deployment language persona

Inspect the current row before editing:

```sh
dsh --profile web --dump-config
```

The shipped base owns an existing row with id `system-prompt`. Override that row; do not insert a second `@deepseek-ai/dsh-system-prompt` service.

```yaml
- id: system-prompt
  config:
    persona: >-
      Default to Simplified Chinese for answers and user-facing explanations.
      Keep code, commands, identifiers, file paths, error messages, and URLs
      unchanged. Follow an explicit user language request when it differs.
```

Profile patch config is a complete row-config replacement, not a deep merge. If the effective row already sets `includeHarnessIdentity`, `includeRuntimeContext`, or `toolOrder`, preserve those fields in the override.

After the patch reloads, start a fresh Session and repeat the same A/B task. A long existing transcript may continue to bias the model even though the next request contains the new persona.

## Do not create a duplicate prompt service

This shape is wrong for a normal profile override:

```yaml
- insert:
    - id: another-system-prompt
      name: '@deepseek-ai/dsh-system-prompt'
```

The service is already composed. Adding another provider can produce duplicate-service or duplicate-section behavior instead of changing the existing deployment persona. Target `id: system-prompt` from the resolved graph.

## Reasoning language is a separate contract

The direct DeepSeek adapter streams `reasoning_content` exactly as received and Web displays it in a Think disclosure. Harness has no reasoning-translation stage.

A language persona may influence reasoning, but providers do not necessarily guarantee that hidden or exposed reasoning follows the answer language. If Chinese reasoning is a strict product requirement, verify it with the exact model and route rather than assuming prompt compliance.

If the reasoning text itself is unwanted, the direct DeepSeek route supports an `off` reasoning effort when deployment policy permits it. Prefer the model/settings control exposed by Web. For a profile-level adapter override, preserve every existing adapter field:

```yaml
- id: llm-deepseek
  config:
    thinking: enabled
    reasoningEffort: off
```

Adapter-owned `off` serializes `thinking: { type: disabled }` and omits `reasoning_effort`. A deployment configured with `thinking: disabled` exposes only `off`. Other adapters and gateways have different reasoning controls; do not copy this fragment to an unrelated provider.

Disabling reasoning changes model behavior and may reduce quality on complex tasks. It is not a translation feature.

## Check gateway and route injection

OpenAI-compatible gateways, proxies, hosted agent platforms, and provider presets may add their own system instructions. Record:

```text
selected provider and model
base URL hostname without credentials
effective system-prompt row
request/header reasoning effort
fresh-Session result
direct-provider versus gateway A/B
```

If the same model follows Chinese directly but not through the gateway, inspect gateway templates and role conversion. Do not keep adding stronger persona text to compensate for an unseen downstream system prompt.

## Keep instructions scoped correctly

Choose the smallest durable scope:

- one answer: explicit user message;
- one Session: first user instruction plus a fresh conversation;
- one deployment/profile: `system-prompt` persona;
- one specialized Agent preset: scoped persona owned by that preset;
- content-specific terminology: project instructions or a Skill, not the global persona.

Language preference is not a safety boundary. Commands, paths, error strings, and protocol identifiers should remain exact even when surrounding explanations are localized.

## Verify the effective behavior

Use five prompts in a fresh Session:

1. a short factual answer;
2. a code explanation containing identifiers;
3. a command with a file path;
4. an error diagnosis that must preserve the original error;
5. an explicit request for a different language to verify user override.

For each, record answer language, reasoning language when enabled, exact technical literals, provider/model, and final turn reason. Re-run after switching route to prove whether the behavior belongs to the profile or provider.

## Regression gates

1. browser locale and model output language remain independent;
2. the default empty persona is not misreported as an English persona;
3. the existing `system-prompt` row is overridden rather than duplicated;
4. complete config-replacement semantics preserve existing fields;
5. a fresh Session proves the new persona without old-history bias;
6. explicit user language requests can override the default preference;
7. code, commands, paths, errors, identifiers, and URLs remain exact;
8. answer and reasoning language are measured separately;
9. reasoning blocks remain provider text, not UI translation;
10. reasoning `off` is applied only to a route that supports it;
11. direct-provider and gateway A/B identifies downstream injection;
12. model or route changes repeat the language acceptance test.

## Source evidence

- [Community language report #3169](https://github.com/deepseek-ai/deepseek-harness/discussions/3169)
- [Pinned system-prompt config and assembly](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/system-prompt/src/index.ts)
- [Pinned empty shipped persona row](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/bundle/base/cordis.patch.yml)
- [Pinned DeepSeek reasoning configuration](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/llm/llm-deepseek/README.md)
- [Pinned reasoning/content stream translation](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/llm/llm-deepseek/src/translate.ts)
- [Pinned Web reasoning rendering](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/client/ui-conversation/src/client/chat/AssistantMarkdown.tsx)
- [Think-row clipping presentation report #4834](https://github.com/deepseek-ai/deepseek-harness/discussions/4834)
