---
title: Keep Dollar Amounts Literal in Web Rendering
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-30
upstream_revision: cd5ef8148158c3a752a658978873241fdf8e2bbc
---

# Keep dollar amounts literal in Web rendering

Use this runbook when assistant prose containing two or more dollar signs renders with missing `$` characters, fused words, or split comma-grouped amounts. Upstream discussion [#4951](https://github.com/deepseek-ai/deepseek-harness/discussions/4951) reproduces the issue in `0.1.1-rc.2` and identifies the client Markdown renderer—not storage, the browser, or paste—as the failing boundary.

## Prove the content is intact

Compare the stored/source message with the rendered DOM. A source such as `Use a $12,345 fee and a $67,890 price` should remain byte-for-byte intact in the Session or API payload. If the source is correct but the DOM drops dollar signs or whitespace, classify this as a projection defect and preserve the original message; do not rewrite the Session.

The reported renderer enables micromark math tokenizers (`mathText`, `mathFlow`, and `dollarSign`). In ordinary prose, paired `$` delimiters can swallow intervening text. This is a deterministic parser boundary and can be reproduced in plain Node with the same extension configuration.

## Run a bounded probe

Test these strings through the exact Web renderer version under investigation:

```text
one price: $12,345
two prices: $12,345 and $67,890
lone symbol: 5$ fee
fenced math: $$x^2$$
```

Record the source string, rendered text/HTML, renderer package version, and whether the Session/API payload changed. A lone `$` and a pair of amounts are important controls; a browser-specific reproduction is not required to establish the parser boundary.

## Safe fix boundary

The correction belongs in the renderer configuration: make inline math opt-in, limit math to an explicit fenced form, or apply an output-only escaping rule that leaves stored content and generated files unchanged. Do not escape `$` while generating or persisting messages, and do not claim a provider or model fix when only the display projection changed.

Acceptance requires literal dollar amounts with normal spacing, preserved fenced math where intentionally supported, unchanged stored content, and coverage for every `MarkdownText` consumer. Recheck the result after upgrades because the handbook is pinned to the source revision named above.

Primary source: [upstream discussion #4951](https://github.com/deepseek-ai/deepseek-harness/discussions/4951).
