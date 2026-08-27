---
title: Diagnose Unknown edit Tools in DeepSeek Harness
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-27
upstream_ref: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Diagnose unknown `edit` tools in DeepSeek Harness

`Error: unknown tool "edit"` is not a file-permission error. The call failed at tool lookup before DeepSeek Harness resolved a path, checked read-before-edit freshness, asked for approval, or reached a filesystem backend. Inspect the current Session's actual Agent assembly instead of asking the model to guess another editor name.

> [!NOTE]
> This guide responds to the screenshot in upstream discussion [#4728](https://github.com/deepseek-ai/deepseek-harness/discussions/4728). The image proves two rejected names—`edit` and `str_replace_editor`—but does not include the selected Agent Preset, `DSH_TOOLS_MODE`, resolved composition, or model-request tool list. Those missing facts prevent a single definitive configuration diagnosis.

## Read the error at the correct layer

At rc.2 commit `b150a55`, a genuinely unresolved tool name becomes `ToolNotFoundError` with code `UNKNOWN_TOOL`. This happens before the tool body. Therefore the following did **not** happen:

- no `file_path` was resolved against the Session `cwd`;
- no file was opened or decoded;
- no read-before-edit observation was checked;
- no literal `old_string` match was attempted;
- no sandbox boundary rejected the operation;
- no write approval could make the missing tool appear.

Do not widen permissions or use `danger-full-access` to repair registry lookup. That increases authority while leaving the missing definition unchanged.

## Know the shipped rc.2 surfaces

| Agent / mode | Model-direct tool surface | Correct edit route |
|---|---|---|
| Standard or Cordis, native mode | `read`, `write`, `edit`, plus other composed tools | call `edit` with snake_case arguments |
| Minimal preset | persistent `bash` and `str_replace_editor` only | call `str_replace_editor` using its declared schema |
| Code preset or `DSH_TOOLS_MODE=code` | `run_code` only | call the generated filesystem SDK from inside one `run_code` program |
| `DSH_TOOLS_MODE=both` | native tools plus `run_code` | use the route actually declared to the model |
| custom Agent Preset | exactly what its composition resolves | inspect, do not infer from another product or old Session |

The names are not aliases. `edit`, `str_replace_editor`, OpenCode's editor vocabulary, and Anthropic-style computer tools are different registrations with different schemas and lifecycles.

Code-only mode deserves a special distinction. If `edit` exists in the Agent scope but direct calls are collapsed behind `run_code`, rc.2 returns an explanatory error telling the model to call `edit` inside `run_code`. A bare `unknown tool "edit"` instead means the lookup found no visible `edit` definition for that Agent at dispatch time.

## Capture the five facts that settle the case

```text
Exact DSH package version and source commit:
Selected Agent Preset for this Session:
DSH_TOOLS_MODE at Host startup:
Resolved Agent composition rows:
Tool names sent in the failing model request:
Durable tool/call name and tool/result error code:
```

The model request is the most direct exposure proof: it tells you which names the model was allowed to choose in that turn. The resolved composition tells you why those names existed—or did not.

Do not treat the Web card label alone as a registry inventory. Presentation can render an unknown call generically after the provider already emitted it.

## Recover without corrupting the profile

### If the Session should use Standard

1. Confirm the selected preset is Standard, not a custom or Minimal preset.
2. Confirm its resolved composition contains `@deepseek-ai/dsh-tool-fs`.
3. Confirm the model request declares `edit`.
4. Start a **new Session** after correcting preset selection or composition. A running Session owns its Agent assembly; changing a future-session default is not proof that the existing Agent changed.
5. Ask the new Session to read a disposable UTF-8 fixture and make one literal edit.

### If the Session should use Minimal

1. Select the shipped Minimal preset when creating the Session.
2. Verify the request declares exactly `bash` and `str_replace_editor`.
3. Use the schema declared in that request; do not substitute Standard's `edit` arguments.
4. Start a new Session after changing the preset.

### If the Session should use Code Mode

1. Verify the request exposes only `run_code`.
2. Verify the system prompt contains the generated SDK section.
3. Use one `run_code` call and invoke the declared SDK binding inside it.
4. Do not emit a model-direct `edit` or `str_replace_editor` call.

### If this is a converted custom Agent

Converting an MCP server list does not automatically compose native filesystem tools. MCP configuration describes remote tool providers; `@deepseek-ai/dsh-tool-fs` is a Host plugin backed by `ctx.fs` and policy services. Add the intended capability through the supported Agent Preset composition, including its required provider and sandbox rows, then inspect the resolved graph before booting a fresh Session.

Do not copy a single `tool-fs` row blindly from another profile. The rc.2 tool expects a filesystem provider; a confining provider also requires `ctx.sandboxPolicy`. Composition must close over those dependencies.

## Prove the repaired path in a disposable workspace

Create a temporary file outside valuable repositories:

```text
alpha
beta
```

Then ask the Agent to:

1. read the file;
2. replace exactly `beta` with `gamma`;
3. read it again;
4. report the tool names it actually called.

For Standard/native mode, the durable sequence should contain:

```text
tool/call  name=read
tool/result success
tool/call  name=edit
tool/result success
tool/call  name=read
tool/result success
```

Reading first matters after lookup succeeds: rc.2's default filesystem observation policy can refuse an edit that has no current observation. That refusal is a later layer with a different remedy; it must not be confused with `UNKNOWN_TOOL`.

## Failure router

| Exact result | Broken boundary | Next action |
|---|---|---|
| bare `unknown tool "edit"` | no visible registration for this Agent | inspect preset, mode, composition, and request inventory |
| `unknown tool "edit": only run_code is callable directly…` | Code Mode collapse | invoke the declared SDK inside `run_code` |
| `tool "edit" is disabled` | policy or scoped availability | inspect the denial owner; do not rename the tool |
| invalid arguments for `edit` | schema mismatch | use `file_path`, `old_string`, `new_string`, optional `replace_all` |
| file must be read before editing | observation/freshness policy | read the exact target, then retry against current content |
| old text absent or appears multiple times | literal-match contract | copy a unique exact span or choose `replace_all` deliberately |
| sandbox file access denied | execution authority | request only the minimum supported escalation or choose an allowed target |
| path not found | Session cwd or target spelling | inspect the Session root and resolved path |
| `str_replace_editor` unknown in Standard | wrong preset vocabulary | use declared `edit`, not the Minimal tool name |
| both `edit` and `str_replace_editor` are bare unknown | custom/empty/different tool assembly is likely | capture the request list; do not keep guessing names |

## Prevent the retry loop

After one `UNKNOWN_TOOL`, the runtime or prompt should provide the current callable inventory or a route hint. A model that alternates remembered names from other agents can spend multiple steps without crossing any useful boundary.

A safe circuit breaker can:

- count unknown-tool results by turn and distinct name;
- attach the authoritative callable names for that Agent generation;
- stop automatic retries after a small bound;
- ask for configuration repair when the required capability is absent;
- avoid suggesting a similarly named tool unless it is actually declared;
- record the Agent Preset and tool-mode generation with the diagnostic.

Never automatically install or enable a filesystem capability because the model asked for a missing editor. Capability composition is an operator decision with security consequences.

## Regression gates

- Standard/native requests declare `edit` and execute a read-edit-read fixture.
- Minimal requests declare `bash` and `str_replace_editor`, not `edit`.
- Code-only requests declare only `run_code` and include the generated SDK instructions.
- Both mode exposes the documented union without duplicate names.
- A custom preset with no filesystem capability returns typed `UNKNOWN_TOOL` without touching a path.
- A Code-collapsed direct call includes the `run_code` route hint.
- A genuinely missing name remains distinguishable from a collapsed visible tool.
- Unknown lookup occurs before approval, guards, path resolution, and tool execution.
- Changing the default preset affects a newly created Session and does not silently mutate an existing Agent.
- Tool inventories are captured per model request and Agent generation.
- An HMR or disposal withdrawal cannot leave a stale model-request definition callable.
- `edit` argument names remain snake_case and schema-validated.
- Read-before-edit refusal appears only after `edit` successfully resolves.
- Literal mismatch, stale observation, sandbox denial, and missing path retain distinct error classes.
- Permission escalation cannot turn `UNKNOWN_TOOL` into a registered tool.
- MCP import does not imply native filesystem composition.
- A confining filesystem composition fails closed when sandbox policy is missing.
- Unknown-tool retries stop after a bounded number of distinct failed names.
- The recovery test uses disposable files and verifies final bytes independently.
- Logs and screenshots are reviewed for paths, prompts, and credentials before sharing.

## Primary sources

- [rc.2 typed `UNKNOWN_TOOL` lookup failure](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/core/tools/src/index.ts)
- [rc.2 filesystem tool contract and visible schemas](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/fs/tool-fs/README.md)
- [rc.2 native `edit` registration and read-before-edit route](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/fs/tool-fs/src/edit.ts)
- [rc.2 shipped Agent Presets and tool-mode reference](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/apps/cli/reference/README.md)
- [rc.2 Web Agent Preset tool-surface tests](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/apps/cli/tests/web-agent-presets.e2e.ts)
- [Upstream unknown file-edit tool report #4728](https://github.com/deepseek-ai/deepseek-harness/discussions/4728)

## Related handbook guides

- [Separate sandbox denial from unavailable capabilities](sandbox-denied-vs-unavailable.md)
- [Recover empty streamed tool identity](streamed-tool-call-empty-identity.md)
- [Choose an official example without inheriting its trust boundary](../examples/official-examples-map.md)
- [Inspect a custom plugin composition](../plugin-development/first-plugin.md)
