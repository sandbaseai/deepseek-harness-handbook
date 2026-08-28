---
title: Recover a Client Cordis Inspect Query That Stays Pending
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-28
sources:
  - https://github.com/deepseek-ai/deepseek-harness/discussions/4926
  - https://github.com/deepseek-ai/deepseek-harness/tree/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Recover a client Cordis inspect query that stays Pending

If a `cordis_inspect_query` call with `platform: "client"` remains Pending after the browser has answered, do not treat it as a slow model or a stuck WebSocket first. In the reported `0.1.1-rc.2` case, the page returned a concrete `{ ok: false }` refusal, the Host discarded that refusal, and `queryClient()` had no timeout or other terminal condition. The Agent turn could therefore wait forever until a user cancelled it.

## The boundary to prove

There are three separate contracts:

1. The tool constructs a client-platform inspect request.
2. A browser page resolves that request, either successfully or with a refusal.
3. The Host settles the pending Promise and emits a terminal tool result.

An `ok: false` page answer proves the second contract has completed. It does not prove the third. Capture those layers separately before changing provider credentials, browser state, or the Session.

## Reproduction from the upstream report

The upstream reproduction asks the model to call:

```json
{
  "platform": "client",
  "provider": "Service",
  "method": "listService",
  "input": { "service": "agentPresets" }
}
```

`agentPresets` is a Host-side service, so the client catalog answers with a refusal such as `no catalogued Service named "agentPresets"`. In the reported implementation, `resolveClientQuery()` effectively does this:

```js
if (!resolution.ok) return { accepted: false };
```

The refusal is ignored, the pending map entry remains live, and `queryClient()` waits without a deadline. A second retry only creates another pending request; it does not repair the missing settlement path.

## Evidence checklist

Capture a redacted trace containing:

- the tool-call id, platform, provider, method, and request timestamp;
- the page response, including `ok`, `reason`, and message, without prompt or credential values;
- the Host pending-map entry before and after the page response;
- whether a terminal `tool/result` was emitted;
- the user cancellation timestamp, if cancellation was the only exit;
- the count of connected pages and whether each one returned the same refusal.

The decisive signature is **page refusal present + no terminal Host result + no timeout**. A missing page response is a different branch and should end as a bounded timeout, not as an inferred provider failure.

## Safe operator response

1. Cancel the current turn once. Do not repeatedly retry the same client query; each retry can add another unresolved pending entry.
2. Preserve the Session and the redacted trace. Do not edit compressed Session frames to synthesize a successful inspection result.
3. If the requested service is Host-owned, route the query to the Host platform rather than asking a client page to answer it.
4. If the task genuinely requires a client page, retry only after a page is connected and the provider/method is known to exist in the client catalog.
5. Restart the Web client only as a containment step, then run one harmless probe and verify a terminal result after a cold restart.

## Implementation contract for a durable fix

The proposed fix in Discussion #4926 preserves first-valid-page behavior while making every other branch finite:

- retain the first `ok: false` refusal on the pending entry;
- allow a different connected page to return `ok: true` and win;
- arm a bounded timeout in `queryClient()`;
- settle with the remembered refusal when pages answered but none could resolve the request;
- settle with a distinct timeout error when no page answered;
- clear the timer on success, refusal settlement, and abort;
- remove the pending entry exactly once on every terminal path.

The acceptance matrix is small and should be regression-tested:

| Scenario | Required terminal result |
|---|---|
| refusal, then deadline | the concrete first refusal |
| refusal, then valid page | the valid answer |
| no page answers | a bounded timeout error |
| caller cancels | cancellation, with no later result |
| fast valid page | the valid answer without waiting for the deadline |

Do not “fix” this by treating every refusal as final immediately: another page may still answer validly. Do not fix it by making the timeout infinite or by swallowing the refusal: both preserve an unbounded Agent turn.

## What this does not prove

- A timeout does not prove the provider is unavailable.
- A client refusal does not prove the Host service is broken.
- A cancelled tool call does not prove the underlying page stopped work unless the page acknowledges cancellation.
- A successful inspection does not authorize a side effect; keep approval and sandbox policy on their own boundaries.

See the [Agent tool execution pipeline](../architecture/tool-execution-pipeline.md) for the Permission/Approval/Guard/Sandbox sequence, and the upstream [#4926 discussion](https://github.com/deepseek-ai/deepseek-harness/discussions/4926) for the original reproduction and proposed behavior matrix.
