---
title: Understand DeepSeek Harness Session Model and Deployment Default Coupling
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-19
---

# Understand session model and deployment default coupling

In DeepSeek Harness rc.7, selecting a model in an ordinary Web session does two things:

1. it changes the addressed session's in-memory selection;
2. it saves the same resolved selection as the deployment-wide `agent-default-model` setting.

The second effect means a session-level UI action can change which model later blank sessions and direct entry points receive.

## Trace the write path

```text
Web model picker
  -> session.selectModel
  -> validate and resolve provider / model / effort
  -> selectionFor(agent).current = selected
  -> saveDefaultModelSelection(selected)
  -> ctx.agentDefaultModel.saveSelection(selected)
  -> settings.yaml: agent-default-model
```

The session assignment occurs before the Settings write. A storage failure is logged and does not undo the session switch. Without a Settings provider, the save is a no-op, so the selection remains session-local.

## Separate four state lifetimes

| State | Owner | When it changes | Who consumes it |
|---|---|---|---|
| Composition default | Base bundle | Bundle configuration | Deployments without a user override |
| Deployment default | `ctx.agentDefaultModel` and Settings | In rc.7, every accepted Web model selection | New Agents and direct entry points |
| Session selection | Agent scope | `session.selectModel` | The next prompt assembly in that session |
| Durable request route | `request/header` event | When a request actually consumes a selection | Restored session history and audit |

An unconsumed session selection is live process state. It becomes durable only when the next request header records it.

## Why the coupling matters

- A specialist model selected for one conversation silently becomes the default for later conversations.
- A provider switch can redirect future token spend to another API key or plan.
- The interactive picker awaits the Settings save, so Settings lock contention can delay a valid session switch.
- A later subagent may inherit a route captured at a different lifecycle boundary, making the visible parent selection an incomplete explanation of actual spend.

## Safe operating procedure for rc.7

1. Record the current `agent-default-model` section before a temporary switch.
2. Make the session switch and confirm the next request header contains the intended provider, model, and effort.
3. Treat the deployment default as changed after every accepted Web selection.
4. Restore the intended default explicitly after the specialist turn.
5. Start a fresh session or subagent and verify its first request header instead of inferring its route from the parent UI.
6. If switching takes seconds, inspect Settings writer locks before blaming model discovery.

Do not edit `settings.yaml` while the application is writing it. Stop the relevant process or use its Settings surface, keep a backup, validate YAML, and restart cleanly.

## Better product boundary

A session picker should update only the addressed session. A separate Settings action, or an explicit **Switch and set as default** action, should own deployment-wide persistence. That split also removes Settings I/O from the interactive session switch path.

## Verification gates

- Switching session A does not change the route in an existing session B.
- The next request in session A records the new complete selection.
- A newly created session uses the documented deployment default.
- Settings persistence failure does not undo a valid session-local switch.
- Session switching does not wait on deployment Settings persistence.
- An explicit default action changes both Web-created and headless-created future Agents.
- Tests cover provider, model, reasoning effort, and clearing a stale effort.

## Source boundary

Verified against DeepSeek Harness `0.1.0-rc.7` commit `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`.

- [Upstream Discussion #3398](https://github.com/deepseek-ai/deepseek-harness/discussions/3398)
- [`session.selectModel` implementation](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/host/apiproxy/src/api-proxy.ts)
- [ApiProxy default wiring](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/host/apiproxy/src/index.ts)
- [`AgentDefaultModelConfig`](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/agent-default-model/src/index.ts)
- [Official implementation note](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/.agents/notes/implemented/feature/2026-08-07-default-model-follows-the-picker.md)
