---
title: Stop a Runaway DeepSeek Harness Agent Loop
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-19
---

# Stop a runaway DeepSeek Harness Agent loop

A turn that keeps searching, retrying a failing tool, or repeating a successful command can consume far more model input than the original task suggests. Stop the active turn first, preserve the event sequence, and only then diagnose why the loop continued.

> [!WARNING]
> At upstream commit `99f6f02`, the core `ReactLoopAgent.turn()` loop has no documented aggregate `maxSteps`, `maxTurns`, or per-turn spending limit. A provider-side quota or spending limit is the independent hard cost boundary. This is an operator recommendation, not a Harness feature.

## The 30-second emergency sequence

1. **Cancel the active turn.** In the TUI, press <kbd>Esc</kbd> or <kbd>Ctrl+C</kbd> while the Agent is running. In a foreground CLI process, send `Ctrl+C`; a second signal forces immediate exit during graceful shutdown.
2. **Confirm activity stopped.** Watch the provider usage graph and the Harness process. Do not assume a frozen UI means model calls stopped.
3. **Preserve evidence.** Copy the session log and terminal output before deleting or compacting anything. Remove credentials and private content before sharing.
4. **Do not resume the same loop unchanged.** Start a new Session only after changing the failing tool, prompt boundary, permission surface, or provider budget.

If cancellation does not stop provider usage, terminate the process that owns the runtime and revoke or disable the exposed credential. Keep provider-side caps small enough that this last line of defense is useful.

## Controls that sound similar but are not the same

| Control | What it bounds | What it does **not** bound |
|---|---|---|
| `maxParallelToolCalls` | Concurrent tool calls within one Agent step | Number of steps, total tool calls, tokens, or spend across a turn |
| Provider/model `maxTokens` | Generated output for one model request | Input tokens accumulated over repeated steps or total turn cost |
| Compaction | Model-visible context size when thresholds are reached | Number of model requests or repeated tool-call decisions |
| Tool timeout | Wall time of one tool execution | Later retries or calls to other tools |
| LLM retry policy | Retry timing and eligible provider failures | Agent-level reasoning loops after successful model responses |
| Provider quota/spending limit | External account or project consumption | Correct Agent behavior or preservation of the local Session log |

Lowering concurrency may reduce the burst rate, but it does not convert an unbounded step loop into a bounded turn. Compaction can let a long turn continue with a smaller context; it is not a circuit breaker.

## Identify the loop you actually have

### 1. Repeated successful tool calls

The Agent receives valid results but decides to search, list, or inspect again. Look for a repeating assistant tool-call → successful tool-result sequence with slightly changed arguments.

**Change before retrying:** narrow the task, restrict the tool surface, require a concrete completion condition, and run in a disposable workspace with a small provider budget.

### 2. Repeated tool failures

The same error is fed back through `inbox.nextStep`, and the model keeps choosing another attempt. Look for the same exit code, missing executable, permission denial, or malformed argument across successive steps.

**Change before retrying:** fix or remove the failing tool. Do not merely rephrase the prompt while the underlying failure remains reachable.

### 3. Provider retry storm

Transport, empty-response, or rate-limit errors can be retried below the Agent loop. The elapsed time and log shape differ from a sequence of successful assistant turns.

**Change before retrying:** record the provider status and retry classification, then reduce retry scope or fix the provider route. Do not diagnose this from the final UI message alone.

### 4. Background work accumulation

One visible task may have started child work, schedules, or detached processes whose ownership outlives the current screen.

**Change before retrying:** enumerate the owning processes and Session events, stop background owners explicitly, and test one bounded unit before restoring fan-out.

## Build a useful incident bundle

Record one ordered timeline rather than screenshots of the final error:

```text
Harness package version and source commit:
Profile, model route, and provider:
Turn start and cancellation timestamps:
Repeated assistant/tool event sequence:
Tool arguments and sanitized result or error:
Per-request usage, if emitted:
Provider usage curve and project limit:
What Esc/Ctrl+C/process termination did:
Smallest bounded reproduction:
```

The most useful count is not only “tokens used.” Count model requests, Agent steps, tool calls, repeated error signatures, and the time from cancellation to the last provider charge.

## A bounded recovery rehearsal

1. Create a fresh disposable workspace and a new Session.
2. Use a project credential with a small provider-side quota.
3. Expose only the minimum read-only tools required for the reproduction.
4. State the completion condition and a small search/attempt budget in the task contract. Treat prompt wording as guidance, not enforcement.
5. Watch the event sequence and provider usage live.
6. Cancel after the first unexpected repetition; prove that calls stop.
7. Preserve the successful trace as a regression fixture before expanding scope.

### Optional community budget plugin

The community `dsh-budget` plugin advertises session, daily, and monthly budget policies:

```sh
dsh plugin --profile web add dsh-budget
```

Treat it as third-party defense in depth. Its reported cost depends on its own meter and configured prices, and its documented default over-limit policy is `alert`. Select and test `block` or `degrade` explicitly if you need enforcement. Keep an independent provider-side limit even when the plugin is installed.

## When to report upstream

Report the smallest reproducible event sequence, not an account balance alone. State whether the repetition was in the Agent loop, a tool, an LLM retry layer, or detached work. Link the exact upstream commit because this developer-preview behavior can change.

Related reports include [#3228](https://github.com/deepseek-ai/deepseek-harness/discussions/3228), [#3229](https://github.com/deepseek-ai/deepseek-harness/discussions/3229), [#2821](https://github.com/deepseek-ai/deepseek-harness/discussions/2821), and [#3171](https://github.com/deepseek-ai/deepseek-harness/discussions/3171).

## Primary sources

- [Agent loop implementation at verified commit `99f6f02`](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/agent-loop/src/agent.ts)
- [`maxParallelToolCalls` configuration](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/agent-loop/README.md)
- [Rolling tool-call concurrency implementation](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/agent-loop/src/tool-calls.ts)
- [Basic compaction contract](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/compaction/compaction-basic/README.md)
- [LLM retry contract](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/llm/llm-retry/README.md)
- [CLI shutdown behavior](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/apps/cli/reference/README.md)
- [TUI cancellation design note](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/.agents/notes/archived/simplification/2026-07-21-tui-remove-cancel-command.md)
- [`dsh-budget` community announcement](https://github.com/deepseek-ai/deepseek-harness/discussions/2553)

