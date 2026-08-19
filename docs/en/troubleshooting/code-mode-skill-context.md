---
title: DeepSeek Harness Code Mode Skill Context
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-19
upstream_revision: 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
---

# A Skill visible in the UI may still be invisible to the model

In DeepSeek Harness rc.7 Code Mode, this program can successfully load a Skill while returning no Skill instructions to the next model step:

```ts
await tools.skill({ name: "domain-modeling" })
```

The Web trajectory may show a complete `Skill · domain-modeling` card, yet the outer tool result says:

```text
(run_code completed with no output)
```

Both observations can be correct. They belong to different contracts.

> [!WARNING]
> Do not treat a visible nested Skill card as evidence that the next model request contains the Skill body. Inspect the outer `run_code` result or an explicitly injected context.

## Three observers, three payloads

| Observer | Receives | Source |
|---|---|---|
| Code program | canonical `{ name, provider, resourceBase?, content }` value | nested SDK binding result |
| Web UI and replay | rendered Skill content | durable `tool/code-dispatch` event |
| next model step | outer logs/return plus `additionalContexts` | root `run_code` result and loop injection |

Code Mode intentionally keeps ordinary nested results execution-local. Only the outer program's `console.log(...)` output and return value become the root tool result. A nested dispatch is logged for UI and replay, but `deriveMessages()` excludes `tool/code-dispatch` events.

This is the optimization Code Mode promises for searches, reads, and other intermediate data. The program can combine or reduce them without placing every raw result into conversation history.

## Where the Skill contract diverges

The rc.7 `skill` tool returns the full Skill as canonical JSON and renders the same value with `renderSkillContent`. Its documentation says it does not add a synthetic context because a freshly loaded native tool result is already available to the next model step.

That statement holds for a model-direct Native call:

```text
model → skill tool/result → next model request
```

Under Code Mode, the same content terminates inside the program unless the program returns or prints it:

```text
model → run_code → tools.skill → canonical value inside worker
                          └────→ tool/code-dispatch for UI only
                no return/log → empty outer result → next model request
```

The Skill loader currently calls neither `exec.deferContext(...)` nor a post-execute path that supplies `additionalContexts`. Code Mode already forwards nested additional contexts onto the outer result in dispatch order—even when the program later fails—so the transport seam exists; this Skill path does not use it.

## Do not confuse nearby cases

| Symptom | Boundary |
|---|---|
| top-level `skill` is unknown in code-only mode | tool exposure; call the generated SDK inside `run_code` |
| nested `tools.skill()` throws | name, visibility, provider, or lookup failure |
| nested call succeeds and outer result is empty | program emitted nothing; current context gap |
| UI Skill card is complete | durable dispatch presentation, not model-context proof |
| explicit user `/skill-name` works | separate pre-step instructions injection path |
| returning `content` works | explicit outer-output workaround, subject to output budget |

## Safe workaround on rc.7

Capture the canonical value and return only what the model must follow:

```ts
const loaded = await tools.skill({ name: "domain-modeling" })
return loaded.content
```

This is semantically clearer than fire-and-forget, but it has costs:

- the model must remember a special rule for this tool;
- returning the full body conflicts with the usual “extract only what you need” Code Mode guidance;
- the body consumes the outer output budget and becomes ordinary tool-result text rather than identified instructions context;
- printing and later automatic injection could duplicate content after an upstream fix.

When the user can explicitly invoke the Skill, `/name` follows a different, deterministic pre-step path: it renders the Skill as a source-identified instructions message closest to the model answer. This is not proof that model-selected Code Mode invocation works the same way.

## Durable repair shape

If loading a Skill means “install these instructions into the next model step,” the leaf tool should create an identified instructions context from the successfully loaded value:

1. resolve and validate the exact model-visible Skill;
2. build the canonical return value once;
3. render the same value with `renderSkillContent`;
4. attach it through `exec.deferContext(...)` with Skill provenance;
5. let Native and Code transports preserve the context after the tool result;
6. define deduplication when the Code program also prints or returns the body.

The repair should remain specific to instruction-bearing tools. Automatically injecting every nested result would erase Code Mode's core boundary and dramatically expand model context.

An alternative post-execute policy can attach `additionalContexts` for successful nested `skill` calls without modifying the provider. It must resolve provenance from the authoritative result, avoid attaching on failure or policy block, and stay scoped to this exact tool registration.

## Evidence to capture

Preserve one minimal Session trace:

```text
tools mode and code runtime
generated SDK declaration for skill
outer run_code tool/call arguments
tool/code-dispatch-start and tool/code-dispatch
nested canonical value observed by the program
outer run_code tool/result
additionalContexts, if any
next request messages
```

The decisive comparison is not “did the UI display the card?” It is:

```text
nested dispatch content
vs outer root result
vs appended source-identified context
vs next model request
```

## Regression matrix

1. Native model-direct Skill load exposes instructions exactly once.
2. Code Mode fire-and-forget load injects instructions exactly once after the outer result.
3. A failed or blocked Skill load injects nothing.
4. Two successful Skill loads preserve dispatch order and distinct provenance.
5. A later program exception does not lose already deferred Skill contexts.
6. UI SkillRow still renders the durable nested dispatch.
7. `tool/code-dispatch` still derives no model message by itself.
8. User `/name` invocation remains deterministic and does not double-load.
9. Ordinary nested tools remain execution-local.
10. Output caps do not truncate the injected instruction channel silently.

## Primary sources

- [Official Code Mode contract](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/tools/README.md#code-mode-schema-and-system-prompt)
- [Code Mode context-forwarding regression tests](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/tools/tests/code-mode.spec.ts#L1054-L1117)
- [Nested dispatch exclusion from model history](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/tools/tests/code-mode.spec.ts#L1554-L1572)
- [Official Skill tool implementation](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/skill/tool-skill/src/index.ts#L81-L161)
- [Official Skill tool context contract](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/skill/tool-skill/README.md#model-facing-tool)
- [Explicit user Skill injection path](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/skill/tool-skill/src/index.ts#L163-L204)
- [Upstream report #3425](https://github.com/deepseek-ai/deepseek-harness/discussions/3425)
