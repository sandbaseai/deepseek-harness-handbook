---
title: Declare a Tool-Owned Code Card Language
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-27
upstream_ref: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Declare a tool-owned code card language

A third-party execution tool can describe itself as `kind: "execute"` and provide source text, yet rc.2 Web still chooses the Code row from the literal wire name `run_code` and labels that body as TypeScript. Move the grammar hint into the tool's provider-neutral call view without turning presentation metadata into execution authority.

> [!NOTE]
> This is a source-backed compatibility design for upstream discussion [#4724](https://github.com/deepseek-ai/deepseek-harness/discussions/4724), not a shipped rc.2 feature. The official call-view schema does not yet include a language field.

## The rc.2 mismatch

Four layers disagree:

1. `GenericCallView` already carries `kind` and `rawInput`, but no grammar hint.
2. `run_code.presentCall()` returns `kind: "execute"` and the program in `rawInput`.
3. Web `classifyTool()` maps the exact name `run_code` to its `code` variant.
4. `ToolRow` renders every code variant through `CodeBlock` with `lang="typescript"`.

The Code Runtime seam is already language-shaped. Its contract recognizes `typescript` and `python` as well-known languages, the Code Mode schema and generated SDK change by runtime language, and rc.2 ships a Python presentation path even though its Web card still says TypeScript.

This creates two distinct failures:

- another execution tool cannot opt into the existing Code row because the reserved `run_code` name cannot be registered or shadowed;
- a valid non-TypeScript `run_code` can display the correct program under an incorrect language banner and grammar.

## Trace the current path

```text
ToolDefinition.presentCall(args)
  -> GenericCallView { kind: "execute", rawInput: code }
  -> Host/client callView transport
  -> GenericToolCard
  -> classifyTool(wireName)
  -> run_code ? "code" : "others"
  -> CodeBlock(code, "typescript")
```

The rendering decision happens after the tool already supplied semantic intent. Falling back to a name table is useful for legacy views, but it should not override a richer explicit view.

## Add one provider-neutral grammar hint

A minimal additive field belongs on `GenericCallView`:

```ts
export interface GenericCallView {
  card: 'generic'
  title: string
  kind?: ToolCallKind
  rawInput?: unknown
  language?: string
  content?: ContentBlock[]
  locations?: FileLocation[]
}
```

Define its semantics narrowly:

- `language` is a syntax-highlighting and display-banner hint;
- it has meaning only when `kind === "execute"` and `rawInput` is a string;
- it does not choose the Code Runtime, model protocol, sandbox, policy, executable, tool name, or content type;
- a client may ignore it and render a generic card;
- an unknown value renders verbatim as the banner and uses the highlighter's plain-text fallback;
- it is not a request to fetch or execute a grammar module.

Do not call the field `runtime`, `engine`, or `interpreter`. Those names imply execution semantics the view must not own.

## Make `run_code` use the same language source

Avoid deriving the banner from model-authored code, the tool description, or a second independent mapping. The validated `CodeRuntime.language` already selects the Code Mode schema and SDK.

One implementation shape is to make the resolved flavor carry its canonical language:

```ts
interface RunCodeFlavor {
  readonly language: CodeSdkLanguage
  readonly description: string
  readonly codeDescription: string
}

const TYPESCRIPT_FLAVOR: RunCodeFlavor = {
  language: 'typescript',
  // existing fields
}

const PYTHON_FLAVOR: RunCodeFlavor = {
  language: 'python',
  // existing fields
}
```

Then `presentCall()` reads the same validated flavor used by schema projection:

```ts
presentCall: args => {
  const flavor = resolveFlavor(peekRuntime)
  return {
    card: 'generic',
    title: args.description,
    kind: 'execute',
    rawInput: args.code,
    language: flavor.language,
  }
}
```

This is illustrative code. An implementation may instead return `{ language, flavor }`, but there must be one validation path. A mounted unknown runtime language should continue to fail loudly rather than showing a guessed grammar.

## Select the view before the wire name

Preserve legacy behavior while preferring explicit tool intent:

```ts
function classifyCall(toolName: string, callView: ToolCallView | null): ToolRowVariant {
  if (callView?.card === 'generic'
    && callView.kind === 'execute'
    && typeof callView.rawInput === 'string'
    && typeof callView.language === 'string'
    && callView.language !== '') {
    return 'code'
  }
  return classifyTool(toolName)
}
```

The Code row must take its program body and language from the same validated view:

```tsx
<CodeBlock code={callView.rawInput} lang={callView.language} />
```

Do not select the Code row from `language` alone. Requiring the generic card, execute intent, string body, and non-empty language prevents an unrelated read/search tool from accidentally changing its complete card shape by emitting one extra field.

## Preserve fallback behavior

The additive contract needs an explicit compatibility matrix:

| Call evidence | Row | Language |
|---|---|---|
| new execute view + non-empty language + string body | Code | view language |
| rc.2 `run_code` view without language | legacy Code | current TypeScript fallback until producer upgrades |
| third-party execute view without language | generic execute row | none |
| language present but non-execute kind | existing name/view fallback | ignored |
| language present but body is not a string | generic or existing fallback | ignored |
| unknown grammar id | Code, if the semantic tuple is valid | banner shown; plain text body |
| missing or malformed call view | name-table fallback | existing behavior |

Do not silently label legacy `run_code` as Python from the client profile. The call view is durable execution evidence; a client-local runtime guess can drift from the runtime that actually produced an older call.

## Keep the wire and replay safe

`ToolCallView` crosses the Host/client boundary and appears in live and settled call projections. Treat the addition as a wire-schema change even though it is optional:

1. update the source type and generated API catalogs;
2. update remotes and client fixture types;
3. serialize only lossless JSON strings;
4. preserve the field on live-to-settled call projection;
5. test a cold Session replay, not only a live call;
6. keep an older client functional when it ignores the field;
7. keep a newer client functional when an older Host omits it.

Bound the string length and normalize only for lookup. Display can retain the original provider-owned identifier, while the highlighter uses its own alias map. Do not interpolate the value into a CSS class, HTML fragment, dynamic import path, or executable command.

## Third-party tool example

After the contract lands, a plugin-owned persistent Python REPL could present:

```ts
presentCall(args): GenericCallView {
  return {
    card: 'generic',
    title: args.description,
    kind: 'execute',
    rawInput: args.program,
    language: 'python',
  }
}
```

That opt-in affects only the card. The tool still owns validation, policy, execution, timeout, result shaping, and cleanup through the ordinary tool pipeline.

For rc.2, do not attempt to register the reserved `run_code` name or patch the installed Web bundle. Either accept the generic row or ship a persistent Client plugin with a keyed tool-call view for the plugin's own exact tool name, following the [persistent Web UI extension guide](persistent-web-ui-client-plugin.md).

## Failure router

| Observation | Boundary | Next action |
|---|---|---|
| Python code shows a TypeScript banner | hardcoded client grammar | compare durable call view with row props |
| third-party execute tool gets generic row | name-based variant fallback | verify execute intent, string body, and language tuple |
| language arrives at Host but disappears in Web | remote/catalog/projection chain | inspect live and settled `callView` values |
| unknown language crashes shiki | highlighter fallback defect | reject dynamic grammar loading; preserve plain fallback |
| changing language changes which runtime executes | authority-boundary defect | remove presentation metadata from execution selection |
| old Session changes banner after profile switch | client-local inference | persist and replay producer-owned language hint |
| code card displays `[object Object]` | non-string body | refuse Code variant and use generic JSON rendering |
| custom tool cannot register `run_code` | reserved transport | keep its own wire name and explicit call view |

## Regression gates

- `language` is optional and older producers remain valid.
- Older clients ignore the new field without failing decode.
- New clients preserve the rc.2 name-table fallback when the field is absent.
- A generic execute view with a non-empty language and string body selects the Code row.
- A third-party tool does not need the `run_code` name.
- `run_code` TypeScript and Python calls render matching banners and grammars.
- Schema, SDK, runtime, and card language share one validated source.
- An unknown mounted Code Runtime language still fails loud at the owning boundary.
- An unknown presentation grammar renders plain text without crashing.
- The language hint never chooses an executable or runtime.
- The language hint never changes permission, sandbox, or approval policy.
- Non-execute views ignore the field.
- Non-string raw input does not enter the Code row.
- Empty and overlong language values are rejected or ignored deterministically.
- The value is never used as HTML, CSS, a path, or a dynamic import target.
- Live and settled call projections preserve the same view.
- Cold replay renders the same language as the original call.
- Profile changes do not relabel an already durable call.
- Generated API catalogs and remote fixtures include the optional field.
- A plugin-specific keyed Client view still overrides the generic fallback normally.

## Primary sources

- [rc.2 provider-neutral tool presentation types](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/core/tools/src/presentation.ts)
- [rc.2 Code Mode presenter and language flavor](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/core/tools/src/code-mode.ts)
- [rc.2 name-based Web tool-row classification](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-tool/src/client/tool/models/tool-call-model.ts)
- [rc.2 hardcoded TypeScript Code row](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-tool/src/client/tool/components/ToolRow.tsx)
- [rc.2 CodeBlock grammar and plain fallback](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-primitives/src/markdown/CodeBlock.tsx)
- [rc.2 Code Runtime language contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/code-runtime/code-runtime/README.md)
- [Upstream tool-owned code-card proposal #4724](https://github.com/deepseek-ai/deepseek-harness/discussions/4724)

## Related handbook guides

- [Extend Web UI with a persistent Client plugin](persistent-web-ui-client-plugin.md)
- [Build your first plugin](first-plugin.md)
- [Understand the tool execution pipeline](../architecture/tool-execution-pipeline.md)
- [Choose the Code Mode worker trust boundary](../security/code-mode-worker-trust-boundary.md)
