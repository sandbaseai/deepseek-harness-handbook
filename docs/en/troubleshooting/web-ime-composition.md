---
title: Recover Web IME composition in DeepSeek Harness
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
---

# Recover Web IME composition without guessing at Enter handling

Use this runbook when the DeepSeek Harness Web composer prints raw pinyin, kana, or jamo instead of opening the operating-system candidate window. Keep that symptom separate from a second failure in which a candidate appears but Enter submits the prompt too early.

The official macOS report is specific: the system Simplified Pinyin input method works elsewhere, `dsh tui` accepts Chinese, but a new rc.8 Web Session inserts Latin letters directly. That comparison localizes the failure to the browser composer path; it does not yet identify the responsible layer.

## Start with the two observable failures

| Observation | Boundary to inspect first | Do not conclude yet |
|---|---|---|
| No candidate window; raw phonetic letters enter the textarea | browser/OS IME negotiation, DOM replacement, extension, stale asset | that Enter arbitration caused it |
| Candidate window appears, but Enter sends or changes the draft | composition-event ordering and composer keyboard arbitration | that the OS input method is broken |
| Other sites fail in the same browser profile | browser profile, extension, OS input source | that Harness owns the failure |
| TUI works but a clean Web browser profile fails | Web client/build boundary | that provider, model, or Session storage owns it |

## Preserve build and browser evidence

Before changing settings, record:

```text
dsh --version:
install command and resolved executable:
page URL and response build/hash evidence:
browser name and exact version:
macOS version and input source:
normal browser profile result:
private/guest profile result:
fresh Session result:
candidate window appears: yes/no
compositionstart/input/compositionend sequence:
Enter submits during composition: yes/no
```

Reloading a page does not prove that its JavaScript matches the CLI shown in another terminal. Stop old Hosts, verify the listening PID, and test a cache-bypassed load before calling the result rc.8.

## Run a bounded isolation matrix

1. Confirm the same input source works in the browser address bar and a plain textarea on another origin.
2. Test a guest or private browser window with extensions disabled.
3. Start one fresh DSH Web Session. Do not reuse the failing Session as the only control.
4. Test both candidate selection and ordinary Enter submission.
5. If possible, compare one Chromium browser and Safari on the same machine.

Interpret one changed variable at a time. A clean-profile success points to an extension, injected script, spell/translation helper, or profile policy. A browser-family split points to event ordering or layout behavior. Failure in every browser but not the TUI keeps the Web bundle, composer state, and OS/browser integration in scope.

## Capture the event sequence

In browser DevTools, select the composer textarea and monitor `compositionstart`, `compositionupdate`, `beforeinput`, `input`, `compositionend`, and `keydown`. Record each event's type, data, inputType, key, `isComposing`, keyCode, and whether default was prevented. Do not paste private prompt text into a public issue.

A healthy candidate-selection trace should establish a composition interval. Key handling inside that interval must not turn Enter, Space, or arrows into Harness actions. The final committed text should reach the controlled draft without duplicate insertion or premature send.

If no composition event fires at all, inspect the actual focused element, DOM remounts, browser extensions, and stale assets before editing `onKeyDown`. If events fire but an action is consumed during the interval, reduce the trace to the first wrongly prevented event.

## What rc.8 already implements

At source revision `141eb6f`, the official composer:

- binds `onCompositionStart` and `onCompositionEnd` on its textarea;
- keeps a composition ref across React renders;
- delays clearing that ref for Safari's closing-key ordering;
- also checks `nativeEvent.isComposing` and legacy keyCode 229;
- bypasses Space and Enter arbitration while composing; and
- tests that composition Enter does not send through all three guard paths.

This evidence narrows the investigation. It does not prove that every packaged browser artifact emits the expected events, that candidate-window initiation succeeds, or that no wrapper replaces the textarea. The existing unit test covers premature Enter submission, not the complete OS candidate-window lifecycle.

## Safe recovery order

1. Preserve the failing trace and build identity.
2. Stop duplicate or stale Web Hosts and start the exact intended CLI.
3. Reload without cached assets and retest a fresh Session.
4. Retest in a clean browser profile with extensions disabled.
5. If only one browser fails, report the exact engine version and event trace.
6. If the official build fails consistently, attach a minimal sanitized trace to the upstream report.

Do not disable all keyboard arbitration, replace the controlled textarea with an unreviewed contenteditable, or patch generated JavaScript as a production fix. Those changes can break commands, structured references, queue steering, accessibility, and draft durability.

## Regression contract for a fix

A repair is complete only when:

- composition starts and updates without remounting the focused textarea;
- pinyin, kana, and Korean IME candidates can be selected;
- Enter, Space, arrows, Backspace, and Escape do not trigger Harness actions while composing;
- the post-`compositionend` closing key is not mistaken for submit on Safari;
- the committed text reaches the draft exactly once;
- ordinary Enter sends exactly once after composition settles;
- Shift+Enter still inserts a newline;
- command and reference popups still arbitrate keys outside composition;
- fresh and resumed Sessions behave the same; and
- tests include a real-browser IME or protocol-level integration case, not only synthetic React events.

## Primary evidence

- [Official Web IME report #3504](https://github.com/deepseek-ai/deepseek-harness/discussions/3504)
- [rc.8 composer implementation](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/client/ui-conversation/src/client/skeleton/InputBar.tsx)
- [rc.8 composition Enter regression test](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/client/ui-conversation/tests/input-bar.client.spec.tsx)

