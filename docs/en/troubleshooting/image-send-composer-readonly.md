---
title: Recover a Composer Stuck Read-Only after Sending an Image
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
---

# Recover a composer stuck read-only after sending an image

Use this runbook when the DeepSeek Harness Web composer still shows its textarea, caret, draft, or image preview but ignores typing after Send. The page offers no error or cancel action, and reload is the only visible recovery.

The rc.8 signature is a client input flight that entered <code>submitting</code> or <code>adjudicating</code> and never settled. The textarea is deliberately rendered:

    readOnly = machineBusy || workspaceTrigger

where <code>machineBusy</code> covers those two phases. This differs from a disabled composer caused by a missing workspace, unavailable model, offline parent Session, or policy gate.

## Contain without duplicating a send

Before pressing F5:

1. stop clicking Send or pressing Enter;
2. note the Session, draft text, image name/type/size, time, and whether a user message appeared;
3. inspect the conversation and activity view for an admitted prompt, queued item, active turn, or provider request;
4. preserve browser console and Network evidence if available;
5. verify external side effects if the prompt asked the Agent to mutate anything;
6. copy recoverable draft text to a safe temporary note;
7. reload once to rebuild the client input machine;
8. reopen the same Session and check whether the prompt already committed before retrying.

Do not blindly resubmit after reload. The browser may have lost the admission response after the Host accepted the prompt. A missing client acknowledgement is not proof that no message or side effect exists.

Draft image objects are runtime-owned browser state. Their preview may not survive a reload even when the text draft does. Keep the original file available and reattach only after checking Session truth.

## Route the exact lock

| Observation | Likely boundary |
|---|---|
| textarea has <code>data-phase="submitting"</code> and remains read-only | unresolved submit flight |
| phase is <code>adjudicating</code> after a slash command | unresolved command adjudication |
| textarea is disabled, not read-only | workspace/model/connection/policy availability |
| workspace picker opens when typing | workspace trigger, not submit lock |
| prompt exists in Session after reload | admission probably committed; do not duplicate |
| no prompt, no request, image encoding never finishes | browser file-read/serialization boundary |
| request remains pending after image encoding | carrier or Host admission boundary |
| Host admitted prompt but response vanished | acknowledgement/connection boundary |

Inspect <code>data-phase</code> in DevTools rather than inferring state from color or cursor behavior.

## Follow the image send chain

rc.8 sends a text-plus-image draft through these stages:

    browser File
      → arrayBuffer
      → base64 image content
      → session.prompt(content, mode, signal)
      → Host admission result
      → submit-settled
      → phase plain

The input machine creates one <code>AbortController</code> at Enter. Its signal reaches <code>session.prompt</code>, but image <code>arrayBuffer()</code> and base64 serialization happen first and do not receive that signal. No deadline is created in <code>beginAttempt()</code>. If any awaited stage never resolves and the shell remains mounted, <code>submit-settled</code> never arrives.

On component/session release, rc.8 aborts the in-flight controller and resets the phase to <code>plain</code>. Reload appears to fix the UI because it destroys and recreates this in-memory state; it does not explain whether Host admission succeeded.

## Capture a useful incident bundle

    DSH version / commit:
    OS and browser:
    Session id:
    input data-phase:
    draft text length:
    image count / MIME / bytes:
    time Enter was pressed:
    file arrayBuffer settled:
    base64 serialization settled:
    session.prompt request started:
    RPC id:
    Host admission response:
    durable user/message present:
    queued or active turn present:
    reload result:
    retry performed:

Never attach the image itself if it contains sensitive data. A synthetic image of the same type and byte size is a safer reproduction.

## Build a deterministic reproduction

For a client regression test, inject a default sink whose Promise never settles:

1. create a draft with one small synthetic PNG;
2. dispatch Enter once;
3. assert phase becomes <code>submitting</code> and textarea becomes read-only;
4. advance the proposed deadline;
5. assert the attempt signal aborts exactly once;
6. dispatch a failure settlement owned by the same sequence;
7. assert phase returns to <code>plain</code>, draft and image remain, and one error notice appears;
8. resolve the old Promise late and prove its stale completion cannot consume the new draft.

Repeat separately with a hanging image encoder, a hanging Host request, a lost response after acceptance, session release, reconnect, and tab visibility changes.

## Runtime repair contract

A safe implementation should:

1. give the entire admission flight one bounded deadline, including reference and image serialization;
2. propagate one AbortSignal through every cancellable stage;
3. on timeout, abort the current sequence and settle that exact attempt as failed;
4. retain draft text and attachments on uncommitted failure;
5. expose a visible Cancel pending send action before the deadline;
6. make cancel and timeout idempotent;
7. ignore every late result from an older sequence;
8. distinguish local serialization, transport, Host rejection, and unknown admission outcome;
9. query or reconcile by RPC/admission identity before offering Retry when outcome is unknown;
10. remove submitted attachments only after authoritative success;
11. keep release/disposal bounded even if an underlying browser API ignores abort;
12. emit duration and terminal-state telemetry without prompt or image bytes.

The timeout should not directly force <code>plain</code> outside the machine. It should produce the same sequence-checked settlement event as ordinary failure, so stale callbacks cannot unlock or clear a newer attempt.

## Choose the deadline carefully

One hardcoded short timeout can reject valid large images or slow remote Hosts. Prefer stage visibility plus a total upper bound:

| Stage | Operator signal | Timeout outcome |
|---|---|---|
| local file read / encode | Preparing image | retain draft; name local preparation |
| transport request | Sending | abort transport; classify response certainty |
| Host admission | Waiting for Host | reconcile RPC identity before retry |
| queued prompt | Queued | composer should unlock after admission, not after Agent completion |

The composer lock should cover admission, not the entire Agent turn. Once a prompt is durably accepted or queued, the input surface can follow queue/steer policy.

## Acceptance gates

- [ ] submitting and disabled states remain distinguishable;
- [ ] a finite deadline covers image preparation and Host admission;
- [ ] Cancel pending send is visible and keyboard accessible;
- [ ] cancel/timeout aborts only the owning sequence;
- [ ] late settlement cannot clear a newer draft;
- [ ] uncommitted failure retains text and images;
- [ ] successful admission consumes only captured attachments;
- [ ] unknown admission outcome blocks blind retry;
- [ ] reload recovery checks durable Session truth;
- [ ] image-only and text-plus-image sends share the same contract;
- [ ] slash-command adjudication has an equivalent escape;
- [ ] release remains safe during every stage;
- [ ] large valid images receive progress rather than silent read-only;
- [ ] notices name the failed stage without leaking content;
- [ ] tests cover reconnect and response loss after acceptance.

## Primary sources

Verified against DeepSeek Harness rc.8 <code>141eb6fef83422698aef7a981029e843e8161534</code> on 2026-08-20.

- [Official stuck read-only report #3501](https://github.com/deepseek-ai/deepseek-harness/discussions/3501)
- [rc.8 composer read-only projection](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/client/ui-conversation/src/client/skeleton/InputBar.tsx)
- [rc.8 input state machine](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/client/ui-conversation/src/client/input/machine.ts)
- [rc.8 submit Promise choreography](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/client/ui-conversation/src/client/input/facade.ts)
- [rc.8 image serialization and Session admission](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/client/ui-conversation/src/client/service.ts)
- [Prompt admission durability runbook](../troubleshooting/prompt-accepted-before-durable.md)
