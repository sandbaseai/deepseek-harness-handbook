---
title: Design RTL and Mixed-Script Rendering for DeepSeek Harness
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-27
upstream_ref: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Design RTL and mixed-script rendering

DeepSeek Harness rc.2 renders user text, assistant Markdown, the composer, and custom-question controls without an explicit HTML `dir` contract. The browser therefore derives paragraph direction from surrounding defaults and the Unicode bidirectional algorithm. Arabic, Hebrew, Persian, Urdu, and other right-to-left text can become difficult to read when mixed with English product names, code, paths, numbers, and punctuation.

Use this guide to design and verify an upstream fix or client plugin. Do not treat global text alignment as bidirectional support.

## `dir="auto"` is a useful baseline, not universal inference

HTML `dir="auto"` uses the first strong directional character to choose the element's base direction. W3C documents both its value and its corner cases. For example:

```text
مرحبا بالعالم          → first strong character is RTL
Hello كيف حالك اليوم  → first strong character is LTR
```

The second string can be intended as an Arabic sentence introduced by an English product or greeting. `auto` cannot know that intent. A whole-string “RTL majority” detector may improve that case, but it is another heuristic:

- counting characters overweights long English identifiers;
- counting words depends on segmentation across Arabic, Hebrew, Persian, Urdu, emoji, punctuation, and code;
- “any RTL” can flip an English paragraph containing one Arabic name;
- document-level inference can misdirect an English paragraph inside an Arabic answer;
- model-generated text has no reliable author-supplied language metadata.

There is no single estimator that is correct for every arbitrary mixed-script paragraph. Make the policy explicit, versioned, and testable. When an authoritative direction exists—user locale, field schema, or authored message metadata—prefer it over inference.

## Separate document, block, and inline direction

| Scope | Recommended owner | Why |
|---|---|---|
| Message/document root | authored direction or configured estimator | establishes the inherited base direction |
| Paragraph, heading, list item, quote | block estimator with explicit override only when needed | mixed documents need local correction |
| Table/list container | structural component | marker/column order belongs to the container, not arbitrary descendants |
| Inline user-supplied token | `bdi` or isolated span | prevents a name/path/number from changing surrounding order |
| Code, terminal, diff, ASCII diagram | renderer-specific policy, normally LTR layout | syntax and columns must remain stable even with RTL comments |
| Composer stack | one shared direction state | textarea, backdrop, mirror, selection, and measured height must agree |

HTML `dir` carries semantic direction and inheritance. Prefer it to a CSS-only `text-align` patch. Alignment is a visual choice; it does not establish the Unicode paragraph embedding level or isolate dynamic inline content.

## Audit the rc.2 surfaces

The pinned source uses separate primitives and editors:

- `MessageText` for literal user and steering content;
- `MarkdownText` and its block renderer for assistant output and other Markdown;
- `InputBar` for the layered conversation composer;
- `QuestionComposer` for custom answers;
- dedicated code, terminal, diff, JSON, table, link, and attachment renderers.

A patch that changes only chat bubbles leaves typing, streamed Markdown, questions, compaction summaries, plan reviews, search/web cards, or structured renderers inconsistent. A global `dir="rtl"` on the application root is worse: it can reverse navigation, code, paths, JSON, tables, and controls that must stay LTR.

## Define one direction service

Use one pure direction resolver shared by literal text, Markdown blocks, and editors:

```ts
type TextDirection = 'ltr' | 'rtl'

interface DirectionDecision {
  direction: TextDirection
  source: 'authored' | 'locale' | 'inferred' | 'default'
  policyVersion: string
}
```

Requirements:

1. input is plain text, never HTML;
2. empty and neutral-only strings have a documented fallback;
3. Unicode normalization policy is explicit and does not alter rendered text;
4. bidi controls are detected and handled as data, not silently stripped;
5. code-like spans can request an LTR structural policy without rewriting content;
6. streaming updates recompute only the affected block, not the entire document;
7. identical input and policy return an identical decision;
8. no inference result is presented as detected language.

If a dominance heuristic is selected, publish its exact units and ties. “Count RTL” is not enough to reproduce behavior. Keep the resolver replaceable so real-world fixtures can improve policy without editing every renderer.

## Keep the composer geometrically consistent

The conversation composer can have a visible textarea, syntax/backdrop layer, and hidden sizing mirror. Apply one decision to their common owner or to all layers atomically. Otherwise line wrapping, cursor position, selection geometry, placeholder direction, and measured height can diverge.

Test direction changes while typing:

```text
empty → English → Arabic → English-prefixed Arabic → code/path → cleared
```

The direction update must not reset selection, composition events, undo history, draft ownership, or IME state. Avoid remounting the textarea merely to change `dir`.

## Preserve code and dynamic inline tokens

Do not run paragraph inference over raw Markdown source and apply one result to every descendant. Rendered code fences, inline code, URLs, paths, tool names, hashes, timestamps, and JSON need isolation or an explicit structural direction.

Use bidirectional isolation for dynamic inline strings whose direction is unknown. Do not insert invisible Unicode direction controls into durable Session content as a display fix; they alter copy/paste, search, diffs, model replay, and security review. Apply semantic markup in the presentation layer.

Security-sensitive UI should display control characters visibly or flag them. Bidirectional controls can make source text appear in a different visual order from its logical order.

## Conformance matrix

Test every supported browser/WebView and theme with exact logical text plus screenshots and DOM assertions:

| Fixture | Required behavior |
|---|---|
| Arabic/Hebrew-only paragraph | RTL base direction |
| English-only paragraph | LTR base direction |
| English product prefix + RTL sentence | chosen policy is documented and stable |
| RTL sentence + English technical terms | readable order without reversing terms |
| digits, dates, currency, punctuation | neutral runs stay attached correctly |
| nested Markdown list and quote | block and container directions compose |
| table with RTL prose and LTR values | columns, cells, and values remain intelligible |
| fenced code, inline code, path, URL | structural LTR/isolation policy preserved |
| Arabic comments in code | glyph order readable without reversing syntax columns |
| streamed assistant output | no direction thrash or full-tree remount |
| composer backdrop/textarea/mirror | identical wrap, scroll, height, and selection geometry |
| custom question field | typing and submitted replay match |
| copied text | logical content unchanged; no injected control characters |
| screen reader | reading order and labels remain meaningful |

## Acceptance gates

- [ ] Every text-bearing surface has an explicit direction owner or documented inheritance.
- [ ] `dir="auto"` behavior and first-strong limitations are tested.
- [ ] The selected estimator is versioned with exact token/count/tie rules.
- [ ] Authored direction overrides inference.
- [ ] Document and block decisions can differ without oscillation.
- [ ] Lists and tables assign direction at their structural container.
- [ ] Dynamic inline text is isolated from surrounding direction.
- [ ] Code, terminal, diff, JSON, paths, and URLs keep stable logical layout.
- [ ] No display fix mutates durable Session strings.
- [ ] Bidi control characters are covered by a security fixture.
- [ ] Streaming changes only affected block decisions.
- [ ] Composer layers share one atomic direction decision.
- [ ] Direction changes preserve selection, IME composition, undo, and draft state.
- [ ] LTR-only DOM parity remains unchanged where no explicit attribute is required.
- [ ] Arabic, Hebrew, Persian, and Urdu fixtures are reviewed by fluent readers.
- [ ] Chromium, WebKit, and Firefox/WebView behavior is recorded separately.

## Primary sources

- [Mixed English-prefix RTL report #696](https://github.com/deepseek-ai/deepseek-harness/discussions/696)
- [Community RTL integration proposal #4009](https://github.com/deepseek-ai/deepseek-harness/discussions/4009)
- [rc.2 literal message primitive](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-primitives/src/markdown/MessageText.tsx)
- [rc.2 Markdown root](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-primitives/src/markdown/MarkdownText.tsx)
- [rc.2 Markdown block renderer](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-primitives/src/markdown/render.tsx)
- [rc.2 conversation composer](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-conversation/src/client/skeleton/InputBar.tsx)
- [Unicode Bidirectional Algorithm](https://unicode.org/reports/tr9/)
- [W3C inline bidirectional markup examples](https://www.w3.org/International/articles/inline-bidi-markup/bidi_examples.en)
- [MDN HTML `dir` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/dir)
