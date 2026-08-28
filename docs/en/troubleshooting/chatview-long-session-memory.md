---
title: Diagnose ChatView Memory Growth in Long DeepSeek Harness Sessions
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-28
sources:
  - https://github.com/deepseek-ai/deepseek-harness/discussions/4900
---

# Diagnose ChatView memory growth in long sessions

Use this guide when a `dsh web` tab becomes progressively heavier as a Session grows, especially when Safari/WebKit reaches gigabytes of RSS while the Node Host remains stable. Upstream report [#4900](https://github.com/deepseek-ai/deepseek-harness/discussions/4900) measured 4.7–6.6 GB WebContent RSS (and higher before a guard) on a 32 GB Mac, while a reload returned memory to baseline.

## Prove the owning process first

Record the DSH version/commit, browser, Session size and event count, compressed log size, Host RSS, and renderer RSS at fixed intervals. Compare a fresh Session, a long Session, and one reload. A renderer that grows with visible history while the Host stays flat points to the client projection; it does not prove a server leak or data loss.

```text
Session events / Markdown / tool cards
  → ChatView full projection
  → retained DOM + event objects
  → WebContent RSS grows with history
```

Do not use compressed JSONL size as a proxy for DOM cost. A 10 MB log can expand into thousands of Markdown trees, code blocks, tool cards, attachment nodes, and retained React/event objects.

## Separate virtualization from compaction

Virtualization/windowing lets the client reclaim off-screen message DOM while keeping the durable Session intact. Compaction changes context or stored representation and has different correctness risks. A reload lowering RSS is evidence of renderer retention, not a compaction fix. Do not delete or rewrite Session logs to make the tab smaller.

Capture a browser performance trace and DOM/node count before proposing a fix. Verify whether the active client artifact contains a real overscan/windowing boundary; the absence of a `virtualization` or `windowing` path in a bundle is a lead, not by itself a proof of the complete root cause.

## Safe user-side containment

1. Preserve the Session log and note the current turn, scroll position, and renderer PID.
2. End or split a long-running conversation at a meaningful task boundary; start a new Session rather than deleting history.
3. If the UI is still responsive, reload the tab and record the before/after RSS and whether the Host remained stable.
4. For unattended use, a narrowly scoped OS guard may restart only the WebContent process above a documented threshold; keep the Host and durable root untouched, and record every restart.
5. Report the smallest reproducible fixture: event count, block types, browser, viewport, and RSS timeline. Redact prompts, paths, credentials, and tool output.

Treat a guard as containment with a UX cost (scroll position and in-memory UI state reset), not as a correctness fix. Never send `SIGKILL` to the Host or remove the Session root as a memory workaround.

## Maintainer acceptance contract

A client-side fix should demonstrate all of the following:

- long histories retain durable replay and scroll-to-history behavior;
- off-screen message DOM is reclaimed within a bounded overscan window;
- Markdown, code, tool results, attachments, and streaming updates do not bypass the window;
- selected Chat/Trajectory views do not duplicate the entire event tree;
- node count, heap, layout, and renderer RSS are measured across a controlled history-size series;
- reload, Session switch, and unmount release listeners, observers, and retained event objects;
- a renderer circuit breaker preserves navigation and identifies the affected Session;
- no performance path mutates or renumbers durable Session events.

Test short, medium, and thousands-of-event fixtures in Safari/WebKit and at least one Chromium browser. Report a regression budget instead of claiming that one reload “fixed” the leak.

## Sources

- [Long-session ChatView memory report #4900](https://github.com/deepseek-ai/deepseek-harness/discussions/4900)
- [Protect live Session logs](live-session-log-durability.md)
- [Recover Session history without destroying evidence](session-history-corruption-triage.md)
