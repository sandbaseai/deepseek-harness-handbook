---
title: Fix Unknown Prompt Variables from MCP Tool Descriptions in Code Mode
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
---

# Fix `unknown prompt variable "{{hexagon}}"` in Code Mode

DeepSeek Harness rc.8 can reject prompt assembly when a third-party tool description contains a complete double-brace group such as `{{hexagon}}`. The real-world trigger is the Mermaid reference embedded by `@drawio/mcp`, but the failure class is not specific to draw.io:

```text
unknown prompt variable "{{hexagon}}" in section "tools:sdk";
registered variables: provider, model, cwd, ...
```

In `code` or `both` tool-presentation mode, DSH generates a model-facing SDK from every visible tool schema. Raw tool and property descriptions enter the `tools:sdk` prompt section. The system-prompt renderer then interprets every complete `{{name}}` group in that generated text as a strict Harness prompt variable.

Third-party prose has crossed into deployment-authored template syntax.

## Confirm the four-part signature

This guide applies when all four conditions hold:

1. the failure names section `tools:sdk`;
2. the unknown group appears in a tool or schema description;
3. effective tool presentation is `code` or `both`; and
4. the same tool set assembles in `native` mode or assembles after the offending tool is removed.

Capture the exact error, resolved configuration, preset, enabled MCP servers, and DSH version before changing anything:

```bash
dsh --profile web --dump-config > dsh-config.json
node --version
pnpm --version
```

If the configuration contains secrets, redact values while preserving key names, plugin order, presentation mode, and MCP package identities.

## Trace the complete data path

```mermaid
flowchart LR
  A[MCP tool schema] --> B[description contains {{hexagon}}]
  B --> C[Code Mode SDK renderer]
  C --> D[tools:sdk prompt section]
  D --> E[strict prompt interpolation]
  E --> F[unknown variable error]
```

At rc.8:

- `dsh-tools` registers `tools:sdk` only for effective `code` and `both` modes;
- the TypeScript renderer sends tool and property descriptions through `docLines()`;
- the Python renderer also turns those descriptions into generated SDK documentation;
- `renderPrompt()` subsequently calls the same strict interpolator for every section; and
- the interpolator scans for `{{`, validates a complete simple name, and throws when that name has no registered variable.

Fenced Markdown is not a protection. The generated TypeScript SDK is itself fenced, but the interpolator does not parse Markdown and does not skip code blocks.

## Why `native` behaves differently

Native presentation sends tool schemas through the model provider's function-calling surface. It does not generate the `tools:sdk` prompt section, so the description never crosses the system-prompt template parser.

`both` is not a workaround. It includes native schemas **and** the generated SDK; the same poisoned description still reaches `tools:sdk`.

## Immediate operator recovery

Choose the smallest reversible option for the current task.

### Use a native-only preset

If the selected model and task support native tool calling, clone the preset and set effective tool presentation to `native`. Start a fresh Session so the prompt and capability surface are rebuilt cleanly.

Prove:

- the resolved mode is `native`;
- no `tools:sdk` section is present;
- the draw.io MCP tools remain discoverable through native schemas; and
- one bounded read-only tool call succeeds before allowing writes.

### Disable the offending MCP server

If Code Mode is required, remove the draw.io MCP bridge from a disposable copy of the preset and start a fresh Session. This restores assembly but removes those tools; it is a diagnostic isolation step, not a feature-complete fix.

### Sanitize the description locally

For a controlled source checkout, sanitize complete double-brace openers at the boundary where third-party schema prose becomes generated SDK text. Apply the same rule to:

- top-level tool descriptions;
- nested parameter-property descriptions;
- TypeScript SDK output; and
- Python SDK output.

One conservative display transformation is `{{` → `{ {`. It preserves the readable intent while preventing strict variable recognition. Record the patch and expect upgrades to replace it.

Do not mutate only the published `@drawio/mcp` text and declare the Harness fixed. Another MCP server, plugin, or ordinary tool can carry the same group tomorrow.

## Do not use these shortcuts

- Do not register a fake prompt variable named `hexagon`; the next description can contain a different name, and substitution would corrupt tool documentation.
- Do not switch to `both`; it still generates `tools:sdk`.
- Do not disable strict interpolation globally. Deployment-authored sections rely on unknown-variable failures to catch configuration mistakes.
- Do not teach interpolation to ignore fenced blocks as the only fix. Tool descriptions are not guaranteed to be fenced, while Harness-authored templates may legitimately reference variables inside fences.
- Do not strip all braces from schemas. JSON examples, template examples, and diagram syntax may need literal braces for the model to use the tool correctly.
- Do not edit installed dependencies without recording the exact diff and expecting the next install to erase it.

## The trust-boundary repair

Strict interpolation is useful for text owned by the deployment. Tool descriptions are different: their producer can be an MCP server outside the Harness process, and no registered-variable contract applies to that prose.

A durable repair should preserve both properties:

1. Harness-authored templates still fail on unknown or malformed variables.
2. Third-party schema prose reaches the model as literal documentation, never as template syntax.

The narrowest rc.8-compatible repair is to escape SDK-bound description text before the generated section enters interpolation. A more explicit future design could distinguish literal sections from templated sections, but that changes the system-prompt API and needs a broader compatibility review.

## Regression gates

### Presentation matrix

- [ ] A tool description containing `{{hexagon}}` assembles in `native` mode.
- [ ] It assembles in TypeScript `code` mode and remains readable in the generated SDK.
- [ ] It assembles in Python `code` mode and remains readable.
- [ ] It assembles in `both` mode without removing native schemas.
- [ ] A nested property description with `{{example}}` follows the same rules.

### Template strictness

- [ ] An unknown variable in deployment-authored persona text still throws.
- [ ] A malformed complete group in deployment-authored text still throws.
- [ ] A registered variable still substitutes exactly once.
- [ ] Substituted values are not scanned a second time.
- [ ] Literal prose without a closing group remains literal according to the existing contract.

### Generated-SDK safety

- [ ] Tool order remains deterministic.
- [ ] Existing JSDoc closer escaping remains intact.
- [ ] Python quote, backslash, control-character, and surrogate escaping remains intact.
- [ ] Sanitization cannot create a new comment closer, string terminator, or prompt-variable group.
- [ ] The model can still identify and call the affected tool after sanitization.

## Route neighboring prompt failures

| Error evidence | First boundary |
|---|---|
| `unknown prompt variable … in section "tools:sdk"` | third-party schema prose crossed into strict interpolation |
| Same error in `deployment:persona` | deployment template references an unregistered name |
| `malformed prompt variable reference` | group shape or variable-name grammar |
| `prompt variable … has no value` | registered provider returned `undefined` |
| `no SDK renderer for …` | Code Mode runtime language has no registered renderer |
| `UNKNOWN_TOOL` after successful assembly | presentation/execution mismatch, not interpolation |
| Native mode fails at provider schema validation | tool JSON Schema compatibility, not generated SDK prose |

## Incident bundle

Include:

- exact DSH and MCP package versions;
- effective `tool-presentation.mode` and runtime language;
- the full error including section and registered-variable list;
- the smallest redacted tool schema that reproduces it;
- whether `native`, `code`, and `both` reproduce independently;
- whether the double-brace group occurs in the tool or a nested property description; and
- the generated SDK fragment after any proposed escaping.

## Primary sources

- [Official discussion #3454](https://github.com/deepseek-ai/deepseek-harness/discussions/3454)
- [rc.8 strict prompt interpolation](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/core/system-prompt/src/index.ts)
- [rc.8 TypeScript SDK renderer](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/core/tools/src/ts-types.ts)
- [rc.8 Python SDK renderer](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/core/tools/src/py-types.ts)
- [rc.8 tool-presentation and `tools:sdk` registration](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/core/tools/src/index.ts)
