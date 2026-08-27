---
title: Fix read_image “cannot get property fs without inject”
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-27
upstream_ref: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Fix `read_image`: cannot get property `fs` without inject

If DeepSeek Harness exposes the native `read_image` tool but every call fails immediately with:

```text
Error: cannot get property "fs" without inject
```

do not convert the image, replace your model, or weaken filesystem policy. In the current rc.2 source, the tool is registered through an attachment-scoped context that does not declare the `fs` and `tools` services used by its executor.

This guide is pinned to upstream commit [`b150a55`](https://github.com/deepseek-ai/deepseek-harness/tree/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e) (`0.1.1-rc.2`) and the reproduction in [official discussion #4612](https://github.com/deepseek-ai/deepseek-harness/discussions/4612). The report used Windows and rc.6; the same call site remains in rc.2 source. We did not independently execute the Windows binary, so the runtime reproduction is attributed to the report while the source defect is independently verified.

## Route the exact failure first

`read_image` has several deliberate gates. Their messages identify different owners:

| Observed result | Boundary | Correct next action |
|---|---|---|
| `unknown tool "read_image"` | No durable attachment service, or tool restriction | Mount/check attachments and inspect the Agent preset |
| `cannot get property "fs" without inject` | Cordis registration scope | Apply the source fix below or wait for an upstream package release |
| `route could not be resolved` | No usable LLM route metadata | Fix the selected provider/model route |
| `model ... does not declare image input` | Model capability metadata | Select or declare an image-capable route |
| `only accepts PNG/JPEG/WebP/GIF paths` | Extension admission | Convert or rename only when bytes and extension truly match |
| `extension declares ... bytes use a different image format` | Magic-byte validation | Convert the file or give it the correct supported extension |
| `exceeds ... bytes/pixels` | Attachment limits | Resize/compress within the configured deployment bounds |

The injection error occurs before image bytes are read. Changing the file cannot repair it.

## Why sibling filesystem tools still work

The root filesystem plugin declares:

```ts
export const inject = ['tools', 'fs', 'systemPrompt']
```

`read`, `write`, and `edit` register against that outer `ctx`, so `ctx.fs` and `ctx.tools` property access satisfies the Cordis guard.

`read_image` is conditional: it should exist only while a durable attachment store is mounted. The current call site creates an attachment-scoped accessor and passes that narrower accessor into the helper:

```ts
ctx.inject(['attachments'], (imageCtx) => {
  applyReadImageTool(imageCtx)
})
```

The helper later registers through `ctx.tools` and executes `ctx.fs.readBytes(...)`. Its optional services are already retrieved dynamically with `ctx.get('attachments')` and `ctx.get('llm')`, but the property-access services are not declared on `imageCtx`. Cordis correctly refuses the undeclared access.

This explains the unusual health pattern:

1. the plugin mounts;
2. sibling tools work;
3. `read_image` appears in the tool catalog;
4. the model spends a tool call;
5. the service guard fails only when the tool path dereferences `fs`.

“Plugin active” and “tool schema visible” are therefore insufficient smoke tests.

## Repair a source checkout

Keep the attachment service as the registration-lifetime gate, but register the executor against the outer context that owns its declared property services:

```diff
- ctx.inject(['attachments'], (imageCtx) => {
-   applyReadImageTool(imageCtx)
+ ctx.inject(['attachments'], () => {
+   applyReadImageTool(ctx)
  })
```

This preserves the intended lifecycle:

- no attachment store: `read_image` is absent;
- attachment store mounts: the tool registers;
- attachment store disposes: the scoped registration disposes;
- execution: `tools`, `fs`, and `systemPrompt` come from the plugin-declared outer context;
- optional `attachments` and `llm`: resolved at execution through `ctx.get(...)`.

Widening the inner injection list to include `fs` and `tools` may satisfy the guard, but it communicates the wrong ownership: attachments gate the tool's presence, while `fs` and `tools` are unconditional root-plugin dependencies. Passing the outer context matches the helper's documented contract.

Do not patch a bundled `node_modules/.../lib/index.js` in place as a durable fix. Reinstallation erases the change, multiple package copies can leave the active one untouched, and a minified/bundled artifact can differ from source. Use a pinned source build or an explicit package patch recorded by your package manager, then remove it when an upstream release contains the fix.

## Add the missing regression

Existing registration tests prove that `read_image` appears with attachments and disappears when the attachment fiber is disposed. Add an execution assertion through the composition-created tool, not a direct call to `applyReadImageTool(ctx)`:

```ts
it('executes through the attachment-scoped registration with declared fs access', async () => {
  await writeFile(join(dir, 'red.png'), PNG_1X1)
  const ctx = await setup()

  const result = await readImage(
    ctx,
    { file_path: 'red.png' },
    agentOn('vision-model'),
  )

  expect(result.isError).toBe(false)
  expect(result.content.some(block => block.type === 'image')).toBe(true)
})
```

The essential property is that `setup()` mounts the root `ToolFs` plugin and the call resolves the registered tool. A unit test that invokes the helper with the outer context bypasses the defective call site and cannot catch this regression.

Also keep lifecycle coverage:

1. tool absent before attachments mount;
2. tool present and executable after mount;
3. tool absent after attachment disposal;
4. tool present and executable after remount;
5. sibling filesystem tools remain registered throughout attachment disposal;
6. all tools disappear when the root plugin disposes.

## Verify the repaired path

Use a tiny known-good PNG inside the Session workspace and an exact route that declares image input.

```text
read_image({ "file_path": "fixtures/red-1x1.png" })
```

A successful canonical result contains a durable attachment identity and metadata:

```json
{
  "path": "fixtures/red-1x1.png",
  "image": {
    "attachmentId": "sha256:...",
    "mediaType": "image/png",
    "bytes": 68,
    "width": 1,
    "height": 1,
    "name": "red-1x1.png"
  }
}
```

Then prove the full boundary, not only the absence of one error:

- the returned content contains the native image block;
- the attachment object is durably readable and digest-valid;
- the Session log stores the attachment reference rather than duplicating raw bytes;
- replay can resolve the reference;
- a text-only model receives the explicit capability refusal before filesystem I/O;
- detaching the attachment service withdraws only `read_image`;
- a missing target records the same filesystem absence observation as `read`.

## Temporary containment

For a packaged installation without a verified patch:

1. Preserve the exact DSH version, profile, error, and active package path.
2. Avoid repeated Agent retries; the scope cannot improve between calls.
3. Use an audited external image-inspection tool only if its filesystem, privacy, and model-egress boundaries are acceptable.
4. Do not use text `read` for binary image bytes; it intentionally rejects binary files.
5. Upgrade only after release notes or source inspection show the corrected registration, then remove the workaround and rerun the lifecycle test.

An external vision CLI changes the security and durability path: image bytes may leave the DSH attachment service, and its result will not automatically gain the same content-addressed replay contract. Treat it as containment, not equivalence.

## Acceptance gates

- [ ] The failure text is captured exactly before configuration changes.
- [ ] The active DSH and `@deepseek-ai/dsh-tool-fs` versions are recorded.
- [ ] The executing package path is identified; duplicate installations are excluded.
- [ ] `read`, `write`, and `edit` behavior is measured separately.
- [ ] The attachment service is proven mounted when `read_image` appears.
- [ ] The selected route declares image input.
- [ ] The source call site passes the declared outer context to the helper.
- [ ] Registration remains conditional on attachment availability.
- [ ] The regression test executes the composition-registered tool.
- [ ] The test fails on the old call site with the same injection error.
- [ ] The test passes after the one-line scope repair.
- [ ] Attachment disposal withdraws only `read_image`.
- [ ] Remount makes the tool executable again.
- [ ] Success returns a durable, digest-valid image attachment.
- [ ] Unsupported route, type, size, missing-file, and lifecycle failures retain distinct messages.
- [ ] Any package-manager patch is pinned, reviewable, and scheduled for removal.

## Primary sources

- [Official report #4612](https://github.com/deepseek-ai/deepseek-harness/discussions/4612)
- [rc.2 filesystem tool composition](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/fs/tool-fs/src/index.ts)
- [rc.2 `read_image` executor](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/fs/tool-fs/src/read-image.ts)
- [rc.2 filesystem tool contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/fs/tool-fs/README.md)
- [rc.2 `read_image` tests](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/fs/tool-fs/tests/read-image.spec.ts)

