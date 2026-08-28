---
title: Isolate Plugin Inventory Failures from Model Requests
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-30
upstream_revision: cd5ef8148158c3a752a658978873241fdf8e2bbc
---

# Isolate plugin inventory failures from model requests

Use this runbook when every model request fails with `REQUEST_EXTENSION` or `DeepSeek request extension preparation failed` after a plugin inventory step throws. Upstream discussion [#4950](https://github.com/deepseek-ai/deepseek-harness/discussions/4950) reports the failure on the alpha.1 source checkout: the inventory field is provider metadata, but its preparation error blocks the whole request instead of degrading to an empty inventory with a warning.

## Identify the failing boundary

Run a text-only prompt with the same provider, model, profile, and workspace. Then compare a profile with `plugin-package-inventory-deepseek` enabled and disabled. Record whether the provider request is observed at all. If disabling only the inventory extension restores requests, classify the incident as extension preparation—not authentication, model routing, or prompt content.

The desired contract is narrow: inventory failure should produce an empty optional field plus an observable warning, matching the existing graceful handling for a missing extension service. It must not silently broaden permissions or hide unrelated plugin failures.

## Capture a bounded evidence bundle

```text
DSH version / commit:
Profile and workspace:
Provider / model:
Inventory plugin and revision:
Inventory preparation error:
REQUEST_EXTENSION error:
Provider request observed: yes / no
Same prompt with inventory disabled:
```

Preserve the first inventory stack trace and the request boundary. Do not paste credentials, full plugin manifests, or conversation content into an issue.

## Safe containment and acceptance

As a temporary containment, disable only the failing inventory extension in a copied profile and rerun a harmless prompt. Require an explicit profile diff and a zero-error response; do not disable the entire plugin graph or use a blanket error swallow. Keep the inventory field visibly absent/empty so downstream consumers cannot mistake missing metadata for a complete catalog.

A credible fix must prove both paths: successful inventory is attached to a request, while inventory failure preserves the model request, emits a diagnostic, and yields an empty optional field. Test repeated requests, a cold profile boot, and an unrelated extension failure to ensure the fallback does not mask real request errors.

Primary source: [upstream discussion #4950](https://github.com/deepseek-ai/deepseek-harness/discussions/4950).
