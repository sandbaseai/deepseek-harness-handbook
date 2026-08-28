---
title: Recover Follow-ups Parked After an Active Turn
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-29
upstream_revision: 141eb6fe
---

# Recover follow-ups parked after an active turn

Use this runbook when a message submitted during an active Agent turn is accepted by the UI but never receives a response after the first turn ends. Upstream discussion [#4952](https://github.com/deepseek-ai/deepseek-harness/discussions/4952) reports the `user/message` and `agent/inbox/spliced` events being persisted while no new `turn/start` is emitted after `turn/end`.

## Recognize the wake-latch boundary

The symptom is not a provider timeout or a model refusal. The composer clears, the active turn eventually settles, the Agent status becomes `idle`, and the follow-up remains parked. A second retry can add another parked item without producing a turn.

Capture a small evidence bundle before starting a new session:

```text
DSH version / commit:
Profile and workspace:
Session persistence mode:
Active turn start/end sequence:
Follow-up user/message sequence:
agent/inbox/spliced sequence:
Next turn/start observed: yes / no
Provider request for the follow-up observed: yes / no
```

If the follow-up has a persisted splice event but no subsequent `turn/start`, keep the incident at the driver wake boundary. The absence of a provider request is useful evidence: the message never reached model routing.

## Reproduce without losing the original log

Use a copied profile and a disposable workspace. Start a harmless multi-step prompt, submit a short second message while the first turn is still running, then wait for `turn/end`. Inspect the session log with the repository’s supported reader or a decompressor; do not edit the source log during diagnosis.

Expected ordering:

```text
turn/start (first)
user/message (follow-up)
agent/inbox/spliced
turn/end (first)
turn/start (follow-up)
turn/end (follow-up)
```

The failure ordering ends after the first `turn/end`. Compare a fresh session where the follow-up is sent while idle so that inbox admission and ordinary turn startup remain separate controls.

## Keep `followup()` semantics explicit

The runtime contract says a follow-up becomes the sole ordinary message of its own turn. Do not “repair” the symptom by replaying the text into the composer, mutating the session log, or blindly starting another Agent. Those workarounds can duplicate user input and destroy the distinction between a parked message and a new request.

The likely fix boundary is the post-turn wake latch: when a non-cancel follow-up is spliced during an active turn, the driver must retain a wake request and consume it after the turn settles. A correct implementation should be idempotent—one parked item produces one new turn—and should not wake a disposed or cancelled Agent.

## Acceptance and containment

Test at least these cases in a copied profile:

1. One follow-up during an active turn starts exactly one child turn after `turn/end`.
2. Two follow-ups preserve ordering and each starts once, without merging into the parent turn.
3. A follow-up queued immediately before cancellation is either explicitly cancelled or admitted according to the documented policy, never silently parked.
4. A disposed Agent does not wake after its owner closes.
5. A restart preserves the parked message and exposes it as recoverable state instead of dropping it.

Until a fix is available, avoid sending interactive follow-ups during long turns, or use a copied profile with a bounded single-turn workflow. Preserve the original session log and tell users when a message was accepted but not admitted; silent loss is the dangerous part of this failure.

Primary source: [DeepSeek Harness discussion #4952](https://github.com/deepseek-ai/deepseek-harness/discussions/4952), verified against the rc.8 source revision `141eb6fe`.
