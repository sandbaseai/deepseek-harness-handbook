---
title: Design a programmatic DeepSeek Harness headless contract
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
---

# Design session, model, JSON, and exit semantics for headless embedding

DeepSeek Harness rc.8 ships a one-shot headless profile for humans and shell pipelines:

```bash
dsh --profile headless "run the tests"
```

It creates a fresh random Session, reads the deployment default model, prints the last non-empty assistant text, writes a terminal Agent error to stderr, flushes persistence, and exits 0 only for a completed turn. It does not currently expose session identity, per-run model selection, or structured output flags.

Official proposal #3518 asks for `--session-id`, `--model`, and `--json`. Those additions are useful, but each crosses a runtime ownership boundary. Treat them as a public automation protocol, not as three Commander options.

## Define session identity before the flag name

rc.8 exposes two different Agent factory semantics:

| Factory identity | Missing persisted Session | Existing persisted Session |
|---|---|---|
| exact `sessionId` | create | resume its materialized history |
| `resumeSessionId` | fail | resume |

Therefore a proposed get-or-create `--session-id` maps naturally to the stable exact `sessionId` path, not directly to `ctx.agents.resume({ resumeSessionId })`. If the CLI wants strict resume, give it separate semantics such as `--resume-session` or an explicit mode. Do not silently create after a miss when the user asked to resume; a typo would fork history.

A stable Session is conversation persistence, not long-term memory and not a distributed lock. Two concurrent headless processes must not write the same Session root or activate the same exact identity. Require one writer, serialize invocations externally, or fail on an active lease. Preserve the Session's recorded cwd and deployment semantics on resume instead of silently treating the caller's new working directory as authoritative.

## Make model selection an exact route

A model is not only a display name. The route owns provider dialect, endpoint, credential reference, context capacity, reasoning controls, role compatibility, cache semantics, and cost.

Prefer an exact `provider/model` selector. If shorthand model-only input is accepted, resolve it against an explicit, recorded provider and reject ambiguity. Never scan providers and choose the first matching catalog entry.

On a resumed Session, decide whether `--model`:

- changes only the next request route;
- updates the Session's selected model for subsequent runs; or
- is forbidden unless it matches persisted state.

Whichever policy is chosen must be logged in the request header and returned in structured output. Validate provider, model, credential availability, and model capability before dispatch—not after tool work begins.

## Treat JSON stdout as a versioned protocol

When `--json` is active, stdout must contain exactly one complete JSON document and a trailing newline. Logs, progress, warnings, tool output, spinners, and dependency diagnostics belong on stderr or an explicitly separate event channel.

A minimal envelope should distinguish invocation, Session, route, outcome, and error:

```json
{
  "schemaVersion": 1,
  "sessionId": "session-...",
  "provider": "deepseek",
  "model": "deepseek-chat",
  "text": "...",
  "stopReason": "completed",
  "durationMs": 1234,
  "toolSummary": { "calls": 2, "failed": 0 },
  "error": null
}
```

Do not put raw tool arguments/results, prompts, credentials, reasoning text, or complete Session events in the default envelope. A compact summary needs documented counting rules: interval start sequence, call identity, retry treatment, cancellations, parallel calls, and failures.

JSON string escaping must preserve arbitrary assistant text, including newlines, Unicode, control characters, and content that resembles terminal escape sequences. Construct the object and serialize it once; never interpolate JSON manually.

## Keep exit code and JSON outcome consistent

Suggested invariant:

| Outcome | Exit | JSON `stopReason` | `error` |
|---|---:|---|---|
| completed turn | 0 | `completed` | `null` |
| terminal Agent error | non-zero | `error` | stable code/message |
| cancellation or interruption | non-zero | explicit terminal reason | stable structured object |
| startup/usage failure before Session | non-zero | `startup-error` or no document by documented rule | diagnostic on stderr |

Avoid reporting exit 0 merely because valid JSON was printed. Also avoid a partially written document when flush or serialization fails. Decide whether persistence flush is part of success; rc.8 currently flushes before summarizing and exiting.

## Current rc.8 evidence

The startup provider parses only `[task...]` and `--help`. The runner:

1. awaits Loader settlement;
2. reads `agentDefaultModel.currentSelection()`;
3. creates `session-${randomUUID()}`;
4. installs that selection in the Agent scope;
5. submits one ordinary user message;
6. waits for idle and flushes the Session;
7. folds only the owned event interval;
8. prints the last non-empty assistant text; and
9. exits 0 only when the interval ends `completed`.

That interval boundary is valuable for structured output: a resumed Session must summarize only the current invocation, not old messages. Keep `firstSeq` before the new follow-up and derive tool counts, terminal reason, and text from that interval.

## Acceptance matrix

- no new flags preserves byte-compatible plain-text behavior where promised;
- omitted session identity creates a fresh random Session;
- exact get-or-create identity creates once and resumes later;
- strict resume rejects a missing id without creating anything;
- two concurrent writers to one id are rejected or serialized;
- resumed history retains contiguous sequence and turn numbering;
- resumed cwd and model policy are explicit;
- unknown, ambiguous, or unauthorized model routes fail before dispatch;
- JSON mode writes exactly one parseable stdout document;
- arbitrary Unicode and multiline text round-trip;
- stderr never corrupts stdout JSON;
- tool summary counts only the current owned interval;
- Session flush failure cannot produce a successful exit;
- completed, error, cancelled, and startup-failure cases have stable exit mapping;
- SIGINT reaches Agent/tool cancellation and produces a bounded terminal result; and
- schema evolution is versioned and additive within a major contract.

## Safer embedding choices today

Until these flags exist upstream, choose by required control:

- one disposable task: use the shipped plain-text headless profile;
- machine-owned Session lifecycle or exact structured events: embed the Python SDK or a custom profile over the Agent factory;
- temporary per-run model experiment: use an isolated reviewed patch and verify the request header;
- multi-tenant service: use a long-lived owner with explicit authentication, authorization, quotas, cancellation, Session isolation, and structured API boundaries rather than spawning an unbounded CLI per request.

## Primary evidence

- [Official programmatic headless proposal #3518](https://github.com/deepseek-ai/deepseek-harness/discussions/3518)
- [rc.8 headless startup parser](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/bundle/headless/src/startup.ts)
- [rc.8 headless runner](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/bundle/headless/src/index.ts)
- [rc.8 Agent create/resume identity contract](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/core/agent-loop/README.md)

