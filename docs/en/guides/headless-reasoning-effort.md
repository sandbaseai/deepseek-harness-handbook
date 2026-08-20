---
title: Set Reasoning Effort for DeepSeek Harness Headless Runs
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
---

# Set reasoning effort for DeepSeek Harness headless runs

DeepSeek Harness rc.8 does not expose an <code>omp --thinking max</code>-style flag on the shipped one-shot command:

    dsh --profile headless "review this patch"

The headless app parses only a required task positional and <code>--help</code>. Reasoning selection belongs to the shared model route/default system, not to the headless runner. Web, headless, ACP, and other entry points resolve shared model adapter facts instead of inventing separate effort controls.

## Do not confuse declaration with selection

| Field | Owner | Meaning |
|---|---|---|
| <code>reasoningEfforts</code> | model entry | levels this exact model offers and their wire spellings |
| <code>reasoning</code> | <code>llm-pi-ai</code> provider profile | deployment default effort for requests that name none |
| <code>reasoningEffort</code> | saved model selection or request | selected effort for a particular Agent/request path |

Adding <code>reasoningEfforts</code> does not select <code>max</code>. It declares that <code>max</code> is a valid selectable capability. A request selecting an undeclared level fails before provider network I/O with <code>UNSUPPORTED_REASONING_EFFORT</code>.

## Path 1: save the shared default in Web

For an installation that also uses the Web profile:

1. start Web with the same <code>DSH_HOME</code> as the future headless command;
2. choose the provider and model in the model picker;
3. select the offered reasoning level;
4. send one disposable proof turn and inspect its request header;
5. run the next headless task with the same environment.

A successful picker change stores a complete <code>agent-default-model</code> selection in <code>$DSH_HOME/settings.yaml</code>. The headless runner reads the same <code>ctx.agentDefaultModel</code> service when it creates its fresh Agent.

This changes the default for newly created Agents. It does not rewrite existing Sessions.

## Path 2: set the provider deployment default

For a pi-ai-backed provider profile, use <code>reasoning</code> to choose the default effort:

    llm-pi-ai:
      providers:
        openai:
          apiKeyEnv: OPENAI_API_KEY
          baseURL: https://proxy.example.com/v1
          reasoning: max

The chosen level must be offered by the exact resolved model. Catalog models can inherit supported levels. A hand-declared model needs an explicit map:

    models:
      - id: reasoning-model
        reasoningEfforts:
          off:
          high: high
          max: ultra

Here the Harness selection ID <code>max</code> is dispatched as the provider wire value <code>ultra</code>. Do not copy that spelling unless the gateway contract requires it.

The official DeepSeek adapter uses different vocabulary. In the upstream headless example it separates <code>thinking: enabled</code> from <code>reasoningEffort: max</code>. Do not transplant fields between adapter families.

## Path 3: isolate one automation job

When one job needs a different default, prefer an explicit patch overlay and a separate home/profile:

    dsh --profile headless --patch ./max-reasoning.yml "review this patch"

Launcher flags must appear before the task. The patch must target the actual adapter row in the composed profile; inspect first:

    dsh --profile headless --dump-config

Keep the overlay version-controlled without credentials. Test that removing <code>--patch</code> returns to baseline. An overlay is not a first-class per-request effort flag and can affect auxiliary work in that process.

## What a future CLI flag must define

A safe flag needs an explicit precedence:

    per-request flag
      > saved Agent selection
      > provider profile default
      > provider/model default

It must define primary-Agent versus subagent scope, <code>off</code> versus omission, unsupported-level failure, persistence, durable evidence, retry behavior, and resume behavior. Otherwise a convenient flag can silently change cost or make resumed Sessions diverge.

## Verify the actual request

Visible reasoning text is not sufficient proof. Record:

    DSH version / commit:
    DSH_HOME:
    profile and overlays:
    provider / model:
    catalog-offered efforts:
    saved selection:
    provider-profile default:
    request/header reasoning effort:
    sanitized wire field and value:
    fresh Agent or resumed Session:

The authoritative check is the durable request header plus a sanitized provider request capture. A model can reason by provider default even when no selectable metadata is exposed.

## Acceptance gates

- [ ] installed headless help is checked;
- [ ] no unsupported <code>--thinking</code> flag is advertised;
- [ ] provider, model, and capability resolve together;
- [ ] <code>reasoningEfforts</code> only declares levels;
- [ ] the selected effort is offered by the exact model;
- [ ] adapter-specific vocabulary is preserved;
- [ ] the same <code>DSH_HOME</code> is used for a Web-saved default;
- [ ] a fresh Agent proves the selection;
- [ ] request/header records the effective effort;
- [ ] sanitized wire evidence matches the provider spelling;
- [ ] subagent and auxiliary-call scope is tested separately;
- [ ] an overlay is removable and contains no credential;
- [ ] unsupported effort fails before provider I/O;
- [ ] rollback restores the previous default;
- [ ] cost comparisons use equivalent prompts and routes.

## Primary sources

Verified against DeepSeek Harness rc.8 <code>141eb6fef83422698aef7a981029e843e8161534</code> on 2026-08-20.

- [Official headless reasoning question #3493](https://github.com/deepseek-ai/deepseek-harness/discussions/3493)
- [rc.8 headless command parser](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/bundle/headless/src/startup.ts)
- [rc.8 headless runner contract](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/bundle/headless/README.md)
- [Shared Agent default model contract](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/core/agent-default-model/README.md)
- [pi-ai reasoning profile contract](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/llm-pi-ai/README.md)
- [Official headless composition example](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/examples/headless-agent/cordis.yml)
