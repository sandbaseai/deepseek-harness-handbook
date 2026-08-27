---
title: Fix pi-ai image MIME rejection on OpenAI-compatible backends
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-27
upstream_ref: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Fix image MIME rejection on pi-ai provider routes

Use this guide when a vision-capable model accepts PNG or JPEG but an OpenAI-compatible backend rejects a WebP image with a misleading response such as:

```text
400 "'url' field must be a base64 encoded image."
```

Valid base64 is not enough. The request can be syntactically correct while its `data:<media-type>;base64,...` prefix names a format the backend refuses.

This guide is pinned to upstream commit [`b150a55`](https://github.com/deepseek-ai/deepseek-harness/tree/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e) (`0.1.1-rc.2`) and the LM Studio reproduction in [official discussion #4615](https://github.com/deepseek-ai/deepseek-harness/discussions/4615). The backend matrix is attributed to that report; the DSH conversion path and capability gap are independently verified in rc.2 source.

## Route the failure by layer

| Evidence | Owner | Next action |
|---|---|---|
| Composer rejects the file before send | DSH attachment intake | Use one of the deployment-advertised media types |
| `model ... does not declare image input` | DSH model-route metadata | Select or declare an image-capable model route |
| `cannot get property "fs" without inject` | Native `read_image` registration | Follow the [service-scope repair](read-image-fs-inject.md) |
| Backend accepts PNG/JPEG but rejects valid WebP data URI | Provider wire capability | Negotiate/declare media types or derive a compatible rendition |
| Backend rejects every image type | Route, endpoint, model, or request dialect | Prove one minimal supported request outside DSH |
| Decode/pixel error after MIME admission | Image bytes or provider decoder limits | Validate magic bytes, dimensions, animation, and encoded size |

Do not label every data-URI error “invalid base64.” Compare the exact prefix, decoded digest, and backend response across a tiny known-good format matrix.

## Follow the rc.2 image path

### Intake and durable storage

The local attachment service advertises four formats:

```ts
['image/png', 'image/jpeg', 'image/webp', 'image/gif']
```

Browser input accepts the same typed union. The store validates magic bytes, dimensions, byte limits, and content identity, then preserves the original media type in a content-addressed attachment reference.

This is a **storage capability**, not proof that every downstream provider route accepts all four formats.

### Model route

A pi-ai model profile can declare:

```yaml
input: [text, image]
```

That boolean-like modality answers whether the route can receive images at all. It does not currently express accepted MIME types, animation support, maximum dimensions, encoded-byte limits, or whether the wire wants data URIs versus another image reference shape.

### Request conversion

`llm-pi-ai/src/context.ts` reads the durable attachment, base64-encodes its original bytes, and forwards its original `mediaType`:

```ts
content.push({
  type: 'image',
  data: Buffer.from(stored.data).toString('base64'),
  mimeType: stored.ref.mediaType,
})
```

No format negotiation or transcode occurs here. pi-ai then owns the provider-specific serialization. For the reported OpenAI-compatible route, WebP reaches the backend as WebP and LM Studio rejects it even though the base64 payload is valid.

## Contain the incident without corrupting history

1. Stop retries. The same durable attachment and route produce the same rejection.
2. Record DSH, pi-ai, backend, and model versions; provider route ID and API dialect; request ID; HTTP status; and sanitized error body.
3. Record the durable attachment ID, declared MIME, decoded-byte digest, dimensions, animation flag, and encoded size. Do not publish image bytes or a data URI.
4. Prove the route with one tiny PNG. Then send byte-equivalent small fixtures for each claimed format.
5. Keep the failed Session log. Do not rewrite the original attachment or change its MIME label without changing its bytes.
6. For immediate work, convert a copy to a backend-supported format before attaching it. Preserve the original separately.

Changing `image/webp` to `image/png` while keeping WebP bytes is not conversion. DSH magic-byte validation should reject that mismatch, and a backend may fail later if it does not.

## Choose where compatibility belongs

### Route A: declare provider media capabilities

The durable fix starts with route metadata richer than `input: [image]`:

```yaml
providers:
  local-lm-studio:
    api: openai-completions
    image:
      mediaTypes: [image/png, image/jpeg, image/gif]
      animation: reject
      maxBytes: 5242880
      maxPixels: 40000000
```

The exact schema is an upstream design proposal, not a current rc.2 option. The important contract is that provider capability is explicit, versionable, and checked before egress.

Use endpoint interrogation only when the backend exposes authoritative capability metadata. Do not infer permanent support from one model name or a single successful request.

### Route B: derive a compatible rendition

When policy allows transcoding, keep the original attachment immutable and create a derived rendition at the provider-preparation boundary:

```text
original attachment
  → validate source
  → apply pinned rendition policy
  → decode with hard resource limits
  → normalize orientation and color
  → encode supported target
  → validate target
  → send target
```

Cache by source digest plus the full rendition policy: target MIME, encoder/version, size and pixel bounds, animation behavior, color/orientation rules, and quality. Publish the cache entry atomically and verify its digest on read.

The Session should continue to reference the original durable attachment. Request telemetry may record the derived rendition identity and policy version without storing raw bytes in logs.

### Route C: reject before provider egress

If conversion is unavailable or disallowed, fail locally with a truthful message:

```text
Provider route "local-lm-studio" accepts PNG, JPEG, and GIF images;
this attachment is WebP. Convert a copy or select a route that accepts WebP.
```

Local refusal is better than sending a known-incompatible request and surfacing the backend's misleading base64 error.

## Do not use best-effort fallback

A converter that catches any error and sends the original bytes anyway makes the safety contract non-deterministic. Known-incompatible WebP then reaches the backend after a decode, resource-limit, or encoder failure and returns the same remote 400.

Fail closed and preserve the conversion error. Bound:

- source and decoded byte counts;
- width, height, and total pixels;
- decode time and memory;
- frame count and animation duration;
- metadata size;
- output bytes and pixels;
- concurrent conversions;
- cancellation and temporary-file cleanup.

Treat image decoders as untrusted parsers. Run them with resource isolation appropriate to the deployment; a library merely being present in the dependency tree is not a security review or a stable public dependency.

## Preserve visual semantics

Conversion is not always lossless:

- animated WebP/GIF to PNG needs an explicit first-frame, all-frame, or reject policy;
- JPEG cannot preserve alpha;
- EXIF orientation must be applied or intentionally retained;
- ICC profiles and wide-gamut colors may change appearance;
- resizing can make small text unreadable to the model;
- metadata may contain private location or device information;
- repeated lossy encoding degrades evidence.

For screenshots and diagrams, PNG is a safe default when the backend supports it. For photographs, JPEG may be smaller but requires an explicit quality and alpha policy. Never silently flatten animation when motion carries task meaning.

## Provider conformance matrix

Run this matrix for each provider route and model, not once per adapter family:

| Case | Required observation |
|---|---|
| Tiny PNG | Accepted, correct dimensions and content |
| Tiny JPEG | Accepted or locally refused from declared capability |
| Tiny WebP | Accepted, transcoded deterministically, or locally refused |
| Tiny GIF | Animation policy applied and reported |
| MIME/bytes mismatch | Rejected before egress |
| Oversized encoded bytes | Rejected before unbounded decode |
| Decompression bomb dimensions | Rejected within memory/time budget |
| Corrupt/truncated source | Typed local conversion failure |
| Cancellation | Decoder and temporary artifacts settle |
| Replayed Session | Original attachment resolves; rendition policy remains observable |
| Backend capability change | Cache/policy version invalidates and conformance reruns |
| Text-only route | Refused before attachment read and provider egress |

## Acceptance gates

- [ ] The exact provider error and request ID are preserved without image data.
- [ ] Base64 validity and decoded digest are verified separately from MIME support.
- [ ] One tiny known-good format proves endpoint, model, and dialect.
- [ ] The provider/model media-type matrix is explicit and versioned.
- [ ] Storage formats are not presented as universal provider formats.
- [ ] The original attachment remains immutable and content-addressed.
- [ ] Any rendition has a distinct digest and complete policy identity.
- [ ] Source and target magic bytes match their declared MIME types.
- [ ] Pixel, byte, frame, time, memory, and concurrency limits fail closed.
- [ ] Converter failure never falls back to a known-incompatible original.
- [ ] Animation, alpha, orientation, color, resize, and metadata policies are tested.
- [ ] Conversion cancellation leaves no process or temporary-file residue.
- [ ] Unsupported media is refused locally before provider egress.
- [ ] Request telemetry links original and rendition identities without raw bytes.
- [ ] Session replay continues to resolve the original attachment.
- [ ] Provider upgrades rerun the conformance matrix before widening capabilities.

## Primary sources

- [Official LM Studio WebP report #4615](https://github.com/deepseek-ai/deepseek-harness/discussions/4615)
- [rc.2 pi-ai image context conversion](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/llm-pi-ai/src/context.ts)
- [rc.2 local attachment capabilities](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/attachment/attachment-local/src/index.ts)
- [rc.2 image attachment types](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/attachment/attachment/src/types.ts)
- [rc.2 browser image serialization](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-conversation/src/client/service.ts)
- [rc.2 pi-ai conversion tests](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/llm-pi-ai/tests/context.spec.ts)

