---
title: Fix Single Tilde Strikethrough in DeepSeek Harness Markdown
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-28
verified_upstream: cd5ef8148158c3a752a658978873241fdf8e2bbc
---

# Keep a single `~` literal in Markdown

If a message such as `cost ~ time` renders as a strikeout or a phrase bounded by single tildes is crossed out, isolate the Markdown parser before changing the model prompt, locale, or stored Session. This is a renderer contract issue: GitHub Flavored Markdown requires double tildes for strikethrough, while the affected parser enables the micromark extension's single-tilde behavior by default.

## What the evidence says

At tagged alpha.1 commit [`cd5ef814`](https://github.com/deepseek-ai/deepseek-harness/tree/cd5ef8148158c3a752a658978873241fdf8e2bbc), both `parseGfm()` and `parseGfmWithMath()` call `gfm()` without `{ singleTilde: false }`. The same parser is used by streamed Markdown, finalized Markdown, and the plain-text projection. The upstream report [#4854](https://github.com/deepseek-ai/deepseek-harness/discussions/4854) supplies the runtime symptom and source locations; it does not by itself prove that every built bundle has the same function names or minifier output.

These controls separate the contract:

| Input | Expected GFM result | Diagnostic value |
|---|---|---|
| `a ~ b` | literal `~` | single punctuation must not open strikeout |
| `~word~` | literal tildes and text | one-tilde pairs are not strikethrough |
| `~~word~~` | strikethrough | the supported extension remains available |
| code span `` `~word~` `` | literal code | code parsing must win over strikeout |

Do not use a screenshot alone as proof. Save the exact input, rendered DOM/text, DSH version, Web bundle hash, and whether the failure appears during streaming, after finalization, or only in copied/plain text.

## Safe repair boundary

The source-level repair is narrow:

```diff
- extensions: [gfm(), cjkFriendlyStrong()],
+ extensions: [gfm({ singleTilde: false }), cjkFriendlyStrong()],
```

Apply the same option to the math-compatible parser. Verify the built artifact as well as the source: alpha.1 bundles may inline and minify the parser, so a source patch that is not present in the served asset is not a deployed repair. Never edit a live Session to remove tildes; that destroys the original message and cannot prove the renderer changed.

## Acceptance gates

- [ ] the same four control strings render correctly in streaming and finalized views;
- [ ] the plain-text projection preserves single tildes;
- [ ] `~~word~~` still strikes through when the feature is intended;
- [ ] code spans, links, CJK text, and math remain unchanged;
- [ ] the served Web asset contains the chosen parser behavior;
- [ ] a cold reload and a new Session reproduce the result; and
- [ ] the report records the exact DSH package, commit or bundle hash, and browser.

## Pinned sources

- [alpha.1 Markdown parser](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/client/ui-primitives/src/markdown/parse.ts)
- [alpha.1 Markdown root](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/client/ui-primitives/src/markdown/MarkdownText.tsx)
- [Official single-tilde report #4854](https://github.com/deepseek-ai/deepseek-harness/discussions/4854)
