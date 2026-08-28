---
title: Fix reasoning_content Replay Across Providers and Thinking Modes
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-27
verified_upstream: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Fix `reasoning_content` replay across providers and thinking modes

A Session works on one provider, then a DeepSeek-compatible `openai-completions` route rejects a later tool-using request:

```text
400 ... The `reasoning_content` in the thinking mode must be passed back to the API
```

Treat this as a **current-request/history serialization mismatch**, not a tool failure and not Session corruption. The same provider text can describe two opposite failures: a reasoning request that is missing required passback, or a non-reasoning request that still carries stale reasoning history.

## Route the two opposite 400s first

| Current request | Historical assistant wire shape | Likely boundary | First containment |
|---|---|---|---|
| thinking enabled | required `reasoning_content` missing | `llm-pi-ai` cross-provider compatibility | declare the requirement only on the affected route |
| thinking disabled | old `reasoning_content` still present | direct `llm-deepseek` mode-switch serialization | start a fresh Session, or keep thinking enabled for that Session |

Do not apply the first row's compatibility flag to the second row. It asks the serializer to emit more reasoning passback when the immediate problem is that an off-mode request still contains it.

## Fast route

1. Stop repeated retries; the same serialized history usually produces the same 400.
2. Record the exact target route, model, API protocol, and first failing turn/step.
3. Confirm whether the route is owned by `@deepseek-ai/dsh-llm-pi-ai` or the direct DeepSeek adapter, and record the current request's resolved thinking mode.
4. Reproduce in a copied Session or disposable profile; do not edit the original Session log.
5. For a hand-declared DeepSeek-compatible `openai-completions` route with thinking enabled, test the explicit compatibility switch shown below.
6. Verify both a fresh Session and the affected cross-provider history before promoting the change.

## Why provider switching changes the wire

```mermaid
flowchart LR
  A["Provider A response<br/>reasoning + tool call"] --> D["Durable Harness blocks<br/>text · reasoning · tool-call"]
  A --> M["Provider-private replay metadata<br/>model · API · signatures"]
  D --> R["llm-pi-ai replay conversion"]
  M --> R
  B["Provider B route selected"] --> R
  R --> F["Foreign assistant shape"]
  F --> W["OpenAI-completions serializer"]
  W --> X{"Target endpoint requires<br/>reasoning_content on assistant history?"}
  X -->|missing| E["HTTP 400"]
  X -->|present| Q["request admitted"]
```

At rc.2, `llm-pi-ai` stores provider-private replay metadata beside provider-neutral Harness content. Same-provider replay can restore validated signatures. A message without usable matching metadata becomes a foreign assistant message: its text, reasoning text, and tool calls remain, but the message deliberately does not pretend to originate from the new provider/model.

That distinction protects replay integrity. A signature from Provider A must not be relabeled as Provider B's native state merely to satisfy a request schema.

## Identify the adapter boundary

Inspect the resolved composition:

```sh
dsh --profile web --dump-config
```

Then record:

| Evidence | Why it matters |
|---|---|
| provider route key | selects the adapter registration and profile |
| model ID | selects model-level compatibility and reasoning metadata |
| resolved `api` | the switch below belongs only to `openai-completions` |
| sanitized `baseURL` host | URL-based compatibility detection may not recognize a private gateway |
| previous assistant source provider/model | decides whether native replay metadata can be reused |
| presence of tool calls | many thinking endpoints enforce stricter history rules on tool-use turns |

The direct `dsh-llm-deepseek` adapter has its own serializer. At rc.2 and alpha.1, both its text and image paths call an assistant serializer that emits every non-empty durable reasoning block as `reasoning_content`. The request builder resolves `reasoning_effort: off` to `thinking: {type: "disabled"}` separately; it does not pass that resolved mode into assistant serialization. A Session that first accumulated reasoning and then switches thinking off can therefore send both a disabled current mode and historical `reasoning_content`.

That source shape explains the incompatibility reported in upstream discussion #4822. It does not prove how every DeepSeek-compatible gateway treats the combination.

## Direct-adapter thinking-mode switch

Use this bounded matrix before changing configuration:

| Test | Expected diagnostic value |
|---|---|
| fresh Session, thinking off | proves the off-mode route works without reasoning history |
| same Session after a thinking turn, then off | isolates historical replay as the trigger |
| same history with thinking left enabled | distinguishes mode-switch mismatch from generally invalid history |
| copied Session after cold reload | proves the behavior is durable, not only in-memory state |

Safe containment today:

1. Start a fresh Session when switching reasoning off after a Session has reasoning history.
2. Alternatively, keep the Session's thinking mode consistent when policy, latency, and cost permit.
3. Preserve the original Session as evidence. Do not delete its reasoning blocks or rewrite its JSONL.
4. Capture only sanitized request keys and roles; reasoning text, prompts, and credentials are not needed for the reproduction.

A robust source fix should resolve the current thinking state before message conversion, pass that state through both text and image serialization, omit historical `reasoning_content` when thinking is disabled, and preserve provider-required passback when it is enabled. Regression tests should cover tool calls, reasoning-only turns, image requests, cold reload, on→off and off→on switches, and confirm that durable blocks are never mutated.

## Configuration-level containment

rc.2 exposes pi-ai's `requiresReasoningContentOnAssistantMessages` switch for `openai-completions` routes. A private DeepSeek-compatible endpoint whose hostname is not recognized can declare the requirement explicitly:

```yaml
- id: llm
  name: '@deepseek-ai/dsh-llm-pi-ai'
  config:
    providers:
      private-deepseek:
        apiKeyEnv: PRIVATE_DEEPSEEK_API_KEY
        api: openai-completions
        baseURL: https://gateway.example.com/v1
        compat:
          thinkingFormat: deepseek
          requiresReasoningContentOnAssistantMessages: true
        models:
          - id: deepseek-compatible-reasoner
            name: Private DeepSeek-compatible reasoner
            contextWindow: 65536
            maxTokens: 8192
            reasoningEfforts:
              off:
              high: high
```

Use your actual route and model metadata. Do not copy the example capacities as provider facts.

The switch tells the OpenAI-completions serializer that replayed assistant messages need the compatibility field while reasoning is active. It is a **wire-shape declaration**, not proof that the gateway is DeepSeek, not restoration of a foreign provider's private signature, and not permission to invent hidden reasoning.

If a catalog route already describes the model, prefer a route-level `compat` override or `modelOverrides` rather than replacing the entire catalog with `models`. In `llm-pi-ai`, a non-empty `models` list replaces the served catalog.

## Safe A/B procedure

1. Export or copy the affected Session using supported tooling; keep the original immutable.
2. Create a disposable profile with the same target route but a distinct route key.
3. Add the compatibility switch only to that route.
4. Run a fresh reasoning + tool-call turn.
5. Replay a sanitized history containing an assistant reasoning block followed by a tool call from another provider.
6. Capture the target request shape at a controlled gateway or mock server. Redact authorization and content before sharing.
7. Compare the first failed and first admitted requests field by field.
8. Remove the disposable profile and any captured private payloads after the test.

Do not repeatedly submit a production Session merely to see whether the 400 changes. Each attempt can spend tokens before a later history validation fails.

## Interpret the result correctly

| Result | Interpretation | Next action |
|---|---|---|
| fresh and cross-provider cases pass | declared compat matches the endpoint | keep the scoped override and regression test it |
| fresh passes, old Session still fails | another historical message shape is incompatible | reduce the first failing prefix; inspect roles, tool pairs, and reasoning fields |
| request now carries the field but endpoint still rejects it | endpoint requires stronger semantic passback | use a supported same-provider path or gateway contract; do not fabricate signatures |
| direct DeepSeek route passes, pi-ai private route fails | adapter/profile compatibility boundary confirmed | keep routes distinct and report the minimal wire diff |
| both routes fail on the same history | shared durable content may be malformed | inspect assistant/tool pairing and first bad Session event |
| switching back to the original provider passes | cross-provider projection is decisive | start a clean target-provider Session or define an explicit migration contract |
| fresh off-mode Session passes, same Session after thinking fails | direct-adapter historical reasoning is decisive | use a fresh off-mode Session; report the mode-aware serialization gap |

## Prevention contract

A production system that permits provider switching should test a matrix, not one happy path:

- same provider and same model;
- same provider and different model;
- different provider with plain assistant text;
- different provider with reasoning only;
- different provider with reasoning plus tool calls;
- tool result followed by another reasoning turn;
- cold Session reload before the switch;
- reasoning enabled, disabled, and provider-default;
- endpoint recognized by catalog versus hand-declared private gateway;
- failure before any external effect versus failure after an effect with unknown outcome.

For every row, assert both Harness block preservation and the exact provider wire shape. “The UI still shows the Think row” does not prove that the next adapter serialized it correctly.

## What not to do

- Do not edit JSONL history to insert guessed `reasoning_content`.
- Do not copy a signature across providers or models.
- Do not delete tool results to make the request smaller.
- Do not classify every HTTP 400 as retryable.
- Do not enable a compatibility flag globally when only one route requires it.
- Do not enable `requiresReasoningContentOnAssistantMessages` to fix a direct-adapter thinking-off failure.
- Do not publish raw reasoning, prompts, credentials, or proprietary gateway payloads in an issue.

## Report a useful upstream reproduction

Include:

- exact DSH and adapter versions;
- target protocol and sanitized hostname class;
- source and target provider/model identities;
- smallest ordered Harness block sequence that fails;
- whether native replay metadata exists and matches the source;
- sanitized before/after wire message keys;
- fresh-Session, same-provider, and direct-adapter controls;
- whether the explicit compat switch changes the result on pi-ai routes;
- current wire `thinking.type`, and whether a fresh off-mode Session differs from an on→off Session.

This evidence separates a Harness replay defect, pi-ai conversion rule, incomplete route declaration, and endpoint-specific contract.

## Verification boundary

The pi-ai configuration and replay behavior above are source-verified at rc.2 commit [`b150a551`](https://github.com/deepseek-ai/deepseek-harness/tree/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e). The direct DeepSeek mode-blind assistant serialization is present in both rc.2 and alpha.1 commit [`cd5ef814`](https://github.com/deepseek-ai/deepseek-harness/tree/cd5ef8148158c3a752a658978873241fdf8e2bbc). The two provider 400s are community observations; this handbook did not send credentials or requests to those endpoints. Endpoint acceptance must be verified against its contract and a controlled request capture.

## Pinned official sources

- [`llm-pi-ai` configuration and wire compatibility](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/llm-pi-ai/README.md)
- [`llm-pi-ai` compat profile and resolution](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/llm-pi-ai/src/catalog.ts)
- [`llm-pi-ai` durable replay conversion](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/llm-pi-ai/src/replay.ts)
- [Direct DeepSeek assistant serialization](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/llm-deepseek/src/serialize.ts)
- [Community field report #4745](https://github.com/deepseek-ai/deepseek-harness/discussions/4745)
- [Thinking-off history field report #4822](https://github.com/deepseek-ai/deepseek-harness/discussions/4822)
