---
title: Diagnose an Auth Token That Cannot Be Obtained or Entered
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-28
sources:
  - https://github.com/deepseek-ai/deepseek-harness/discussions/4918
---

# Diagnose an Auth Token That Cannot Be Obtained or Entered

An alpha release may fail in two distinct places: the security flow may not produce a token, or the extension/UI may not accept a token that already exists. Treat them as separate contracts. Never paste a real credential into an issue, screenshot, shell history, or Session log.

## Split acquisition from entry

| Symptom | First boundary to inspect |
|---|---|
| The security flow returns no token | Auth request, callback, origin, or provider response. |
| A token exists but the field rejects it | UI field state, validation, storage, or extension bridge. |
| Login succeeds but the next request is unauthorized | Token scope, selected provider, expiry, or outbound header mapping. |
| Web and extension disagree | Compare their origins and storage/bridge ownership; do not copy secrets between them casually. |

The upstream report for `0.1.2-alpha.1` mentions both obtaining and entering the token, so one “authentication failed” label is not enough evidence.

## Preserve a redacted trace

Record the release, profile, origin, and exact action that fails. In Developer Tools, inspect the first failed request and its status, but redact `Authorization`, cookies, query-string credentials, and response bodies before sharing. A `401` proves rejection; it does not identify whether the token is missing, expired, scoped for another route, or stripped by a bridge.

## If acquisition fails

1. Confirm the auth flow is running on the expected origin and port.
2. Check whether the callback or popup is blocked, redirected, or returning a non-2xx response.
3. Compare the request method, callback URL, and provider route with the release documentation.
4. Retry once in a clean profile to separate stale storage or extension interference from the server response.
5. Stop before rotating credentials; first preserve the status, redirect chain, and first console exception.

## If entry fails

Test a disposable, already-redacted placeholder only to determine whether the field accepts input. If the field is disabled, immediately inspect the UI state and extension bridge rather than repeatedly pasting a secret. If submission succeeds but storage does not, verify the selected profile and credential-store permission without printing stored values.

## Related guides

- [Keep provider identity separate from API compatibility](../getting-started/model-providers.md)
- [Prevent unexpected DeepSeek API charges](../security/prevent-unexpected-deepseek-api-charges.md)
- [Diagnose a blank Web client in Firefox](firefox-web-client-blank.md)

## Source

- [Upstream alpha.1 auth report #4918](https://github.com/deepseek-ai/deepseek-harness/discussions/4918)
