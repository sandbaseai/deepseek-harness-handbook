---
title: Retry OpenRouter In-Flight Budget Exhaustion
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-29
upstream_revision: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Retry OpenRouter in-flight budget exhaustion

Use this runbook when an OpenRouter-backed request fails with HTTP `402`, the provider reason `in_flight_budget_exhausted`, or wording such as “would exceed your available credits given your current in-flight requests.” In DeepSeek Harness rc.2, that signal can fall through the pi-ai classifier as a generic `PI_AI_ERROR`; the default retry policy then treats the turn as terminal. The upstream report is [discussion #4431](https://github.com/deepseek-ai/deepseek-harness/discussions/4431).

## Identify the boundary

The failure is a concurrency reservation cap, not proof that the account balance is empty. Confirm the provider and adapter path first:

```text
DSH commit / version:
Provider: OpenRouter
Model and profile:
Adapter: dsh-llm-pi-ai
HTTP status and reason:
Retry-After value, if present:
Concurrent requests observed:
```

Run one harmless request with concurrency reduced to one. If it succeeds while the same request fails under sustained parallel work, keep the incident at the provider-concurrency boundary. Do not “fix” it by adding a second API key or changing the model before recording the evidence; those changes can hide the reservation behavior.

## Classify the provider-attested marker

Do not classify every `402` as retryable. A balance denial may be terminal. The discriminator is the in-flight marker (`in_flight` or `in-flight`), or equivalent provider wording, and it should be checked before generic quota patterns. Otherwise a phrase such as “credits exhausted by in-flight requests” can be misclassified as `QUOTA_EXCEEDED`, which the normal retry policy intentionally does not retry.

The desired classifier contract is:

```text
in-flight budget marker -> RATE_LIMIT
ordinary balance / quota denial -> QUOTA_EXCEEDED (terminal)
unrelated 402 -> provider-specific or generic error
```

This preserves the semantic difference between “wait for reservations to settle” and “the account cannot pay for this request.”

## Preserve and bound Retry-After

The pi-ai adapter may flatten the original error and its cause chain into message text before classification. When the flattened message contains a serialized `Retry-After` value, extract the numeric seconds and pass it to the existing retry delay field. Honor the policy’s maximum delay; never sleep for an unbounded provider-controlled value.

An acceptance test should cover both forms:

1. A message containing `in_flight_budget_exhausted` and `Retry-After: 120` becomes `RATE_LIMIT` with a bounded provider delay.
2. A message containing a normal insufficient-credit or balance denial remains terminal.

Also verify that malformed, negative, or excessively large values fall back to the policy backoff instead of blocking the Agent indefinitely.

## Safe containment while waiting for a fix

Reduce parallel fan-out, disable background children for the affected profile, or use a copied profile with a lower concurrency limit. Keep the original session and provider response for comparison. Do not retry blindly in a tight loop: that increases the number of unsettled reservations and can extend the cooldown.

The success signal is a later request completing after the cooldown, with the retry attempt and selected provider visible in the session trace. If the retry still fails, separate a genuine balance denial, authentication error, or model capacity issue from the in-flight cap before changing configuration.

Primary source: [DeepSeek Harness discussion #4431](https://github.com/deepseek-ai/deepseek-harness/discussions/4431). The discussion links a minimal classifier fix and test in commit `5662172104`; treat it as an investigation reference, not an automatic install.
