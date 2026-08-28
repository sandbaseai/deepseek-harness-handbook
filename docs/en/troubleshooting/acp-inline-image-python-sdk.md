---
title: Diagnose ACP Inline Images in the Python SDK
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-29
upstream_revision: cd5ef8148158c3a752a658978873241fdf8e2bbc
---

# Diagnose ACP inline-image failures in the Python SDK

Use this runbook when an ACP prompt containing an inline image (`type: image`, base64 `data`, and `mimeType`) ends with `finish_reason: error` and empty output. Upstream discussion [#4943](https://github.com/deepseek-ai/deepseek-harness/discussions/4943) reports the failure on `0.1.2-alpha.1`; its follow-up identifies an adapter contract mismatch rather than a generic provider outage.

## Separate the three image contracts

There are three different boundaries to test:

1. **ACP admission** accepts a content block and forwards it to the runtime.
2. **The DeepSeek adapter** turns that block into a model request.
3. **File mode** uploads bytes and then references the resulting file in a completion request.

The report's root-cause notes say the `dsh-llm-deepseek` adapter reads `block.attachment.*` unconditionally. A valid ACP inline block has `data` and `mimeType`, not an attachment reference, so the adapter can throw before a provider request is made. This is evidence for the reported path, not proof that every image route or release is broken.

## Run a bounded matrix

Record the exact DSH version or commit, SDK version, image MIME type, byte length, and the first error line. Then keep each probe independent:

| Probe | What it isolates | Useful result |
|---|---|---|
| text-only ACP prompt | ACP session and provider baseline | text succeeds; image path is implicated |
| inline image block | adapter's inline contract | `TypeError`/`TRANSPORT` before provider request points at the adapter |
| attachment-reference block | runtime attachment contract | success or a clear missing-registration error |
| file upload followed by `file_id` | file-mode request shape | upload success does not prove completion compatibility |

Do not retry a failed inline image as a different format while claiming the original path is fixed. Preserve the request payload shape and transport trace for each row.

## Interpret file-mode false positives

The same report says `POST /v1/files` can succeed while `chat/completions` later rejects a `file_id` image with `missing field image_url` or `Unsupported image_url format`. Treat upload success as a storage acknowledgement only. Verify the subsequent completion payload and provider error before concluding that file mode is supported. A successful upload must not suppress a required base64 fallback.

## Safe containment

Until the adapter and SDK contracts are aligned:

- use text-only prompts to validate the ACP session and provider route;
- do not register or expose a made-up `attachment` object from Python;
- keep image bytes local and redact base64 from issue logs;
- preserve the failing payload schema, stack trace, and whether a provider request was observed;
- avoid silently converting inline data to a file reference unless the target adapter documents that contract.

The acceptance gate for a fix is end-to-end: Python can register or upload an image through a documented API, ACP admission preserves its identity, the adapter emits the provider's accepted image shape, and the resulting assistant turn is non-empty. A green upload request alone is not sufficient.

## Evidence template

```text
DSH version / commit:
Python SDK version:
ACP transport:
Image MIME / bytes:
Inline or attachment-reference shape:
File upload response (redacted):
Completion request shape (redacted):
Provider request observed: yes / no
First error line:
finish_reason:
```

Primary source: [upstream discussion #4943](https://github.com/deepseek-ai/deepseek-harness/discussions/4943). The adapter behavior and acceptance gate should be rechecked against the pinned source revision before production use.
