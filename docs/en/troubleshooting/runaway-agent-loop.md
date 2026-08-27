---
title: Stop a Runaway DeepSeek Harness Agent Loop
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-27
upstream_ref: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Stop a runaway DeepSeek Harness Agent loop

A turn that keeps searching, retrying a failing tool, repeating a successful command, or narrating intended work without acting can consume far more model input than the original task suggests. Stop the active turn first, preserve the event sequence, and only then diagnose why execution continued.

> [!WARNING]
> At upstream commits `99f6f02` and rc.2 `b150a55`, the core `ReactLoopAgent.turn()` loop has no documented aggregate `maxSteps`, `maxTurns`, or per-turn spending limit. A provider-side quota or spending limit is the independent hard cost boundary. This is an operator recommendation, not a Harness feature.

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

Do not classify the incident from repeated prose alone. First count durable `turn/start`, `step/start`, `assistant/message`, `tool/call`, `tool/result`, and `user/message` events.

### 1. One assistant stream repeats narrative text

If one `step/start` contains one assistant stream whose text repeats `read ...`, `edit ...`, or “I will now ...” without a finalized tool-call block, this is a degenerate model output or provider/tool-protocol failure inside one request. It is not yet an Agent loop.

Compare the raw assistant chunks with the finalized `assistant/message`:

- repeated text chunks and one completed message point to generation degeneration;
- provider-native tool-call chunks that disappear from the final message point to adapter or assembler handling;
- plain text that merely resembles a tool call proves no runtime tool request;
- a `max-tokens` finish can truncate before an intended call, but raising the limit is not a guaranteed repair.

Use the [degenerate-output guard guide](degenerate-model-output.md) for one streaming attempt. Do not parse prose and execute it as a tool call; that converts untrusted model text into action without the tool protocol, schema validation, approval, or correlation identity.

### 2. Several completed turns contain only narrative

In rc.2, a successful assistant message with no `tool-call` block makes `step()` return `completed`. With no pending inbox input, `turn()` ends and the driver becomes idle. The core loop does not autonomously open another ordinary turn from that text.

Therefore every additional narrative-only turn needs a wake source. For each new `turn/start`, find the `user/message` claimed immediately before its first step and record its source:

- `{ kind: "goal", ... }` identifies an automatic Goal round;
- ordinary user input identifies a real follow-up;
- hook or plugin-generated content must retain its own source/provenance;
- a wake with missing or generic provenance is itself an observability defect.

Do not label the model as “looping across turns” until the event log proves who kept waking it. Goal rounds are bounded by `maxGoalRounds`, but each round is still a paid model request and can repeat a bad actionless pattern until paused, blocked, completed, or capped.

### 3. Several steps occur inside one turn

The core driver continues after tool results or claimed `next-step` input. A text-only completed step reaches `agent/turn-stopping`; a lifecycle extension can insert another message before the turn closes.

Join each `step/start` after the first to one of:

- tool calls and their finalized results;
- steering or injected `user/message` events;
- a turn-stopping hook or policy continuation;
- another documented step-boundary source.

If no such source exists, preserve the exact event sequence as a core-loop reproduction. Do not infer a hidden tool call from the assistant's wording.

### 4. Repeated successful tool calls

The Agent receives valid results but decides to search, list, or inspect again. Look for a repeating assistant tool-call → successful tool-result sequence with slightly changed arguments.

**Change before retrying:** narrow the task, restrict the tool surface, require a concrete completion condition, and run in a disposable workspace with a small provider budget.

### 5. Repeated tool failures

The same error is fed back through `inbox.nextStep`, and the model keeps choosing another attempt. Look for the same exit code, missing executable, permission denial, or malformed argument across successive steps.

**Change before retrying:** fix or remove the failing tool. Do not merely rephrase the prompt while the underlying failure remains reachable.

### 6. Provider retry storm

Transport, empty-response, or rate-limit errors can be retried below the Agent loop. The elapsed time and log shape differ from a sequence of successful assistant turns.

**Change before retrying:** record the provider status and retry classification, then reduce retry scope or fix the provider route. Do not diagnose this from the final UI message alone.

### 7. Background work accumulation

One visible task may have started child work, schedules, or detached processes whose ownership outlives the current screen.

**Change before retrying:** enumerate the owning processes and Session events, stop background owners explicitly, and test one bounded unit before restoring fan-out.

## Build a useful incident bundle

Record one ordered timeline rather than screenshots of the final error:

```text
Harness package version and source commit:
Profile, model route, and provider:
Turn start and cancellation timestamps:
Turn/step/message/call/result event sequence:
Source of every user/message that opened another turn or step:
Raw assistant chunk types and finalized message block types:
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

For a narrative-only report, run four controlled cases against the same exact route:

1. fresh Session, same tool and short context;
2. fresh Session after compaction-sized context is reconstructed without private data;
3. same prompt with automatic Goal rounds disabled;
4. same prompt with a known tool-capable control model or provider route.

Change one variable at a time. A fresh Session fixing the behavior is correlation, not proof that checkpoint or compaction caused it. Capture the request header, visible tool schema names, adapter route, finish reason, and message block types in every case.

## Design an actionless-round circuit breaker

A safe detector operates on protocol facts, not an LLM judgment that prose lacks “substance.” Define one actionless completion as:

- an automatically sourced turn or step;
- a completed assistant message;
- zero finalized `tool-call` blocks;
- zero accepted durable state-transition events owned by the automation;
- no explicit goal completion, blocking, or user question transition.

Count consecutive actionless completions per `(Agent lifecycle, automation source, goal revision)`. Reset only on a proven action or an authenticated human message. At the threshold:

1. stop injecting automatic continuations;
2. pause or block the owning goal/policy rather than fabricating a tool call;
3. append one typed diagnostic naming the counted turns and source;
4. leave the Agent idle and preserve the Session;
5. require a human or reviewed policy change to resume.

Do not apply this breaker to ordinary user turns merely because the assistant answered with text. Explanation, refusal, clarification, and a legitimate final answer are actionless by design. The automation source is the load-bearing scope.

Prompt reinforcement such as “call the tool immediately after deciding” can improve model behavior, but it is guidance, not enforcement. The runtime breaker remains responsible for cost containment.

## Narrative-loop failure router

| Evidence shape | Owning boundary | Safe next action |
|---|---|---|
| one stream, repeated text chunks | model generation / adapter stream | cancel; test degenerate-output guard and control route |
| one message, prose resembles a call | model decision | do not execute prose; verify tool schemas and route capability |
| tool-call chunks vanish before final message | adapter / assembler | preserve chunks and finalized block list; report minimal fixture |
| multiple turns, each preceded by Goal source | Goal round automation | pause goal; apply source-scoped actionless threshold |
| multiple turns, each preceded by a plugin message | owning plugin | disable or bound that continuation source |
| multiple steps after text-only completion | turn-stopping or next-step injection | identify exact inserted message and listener |
| repeated provider attempts, no new turn/step | retry layer | inspect retry classification and backoff |
| UI repeats one durable assistant message | client projection | compare unique event sequence/message id before another model call |
| fresh Session works after long history fails | context correlation only | run controlled context/compaction matrix; do not rewrite old history |

## Regression gates

- One text-only assistant completion ends the ordinary turn when no inbox input exists.
- Plain text resembling a tool call never crosses tool execution.
- Raw chunk types and finalized block types remain inspectable and correlated.
- Every additional turn names the message and source that woke it.
- Every additional step names tool-result or next-step input provenance.
- Goal-sourced actionless turns stop at the configured threshold before `maxGoalRounds` when the breaker is enabled.
- The breaker is scoped by Agent lifecycle, automation source, and goal revision.
- A real tool call, explicit goal transition, or authenticated human input resets the correct counter.
- An ordinary explanatory or refusal response is never blocked as actionless automation.
- Circuit breaking pauses the owner; it never manufactures tool name, arguments, result, or success.
- Cancellation stops new model admission and preserves completed message evidence.
- A provider-side quota remains effective if every local breaker fails.
- Fresh/long-context, Goal-on/off, and control-route cases record the same evidence fields.
- Compaction is not named as cause without a minimized before/after request reproduction.
- Duplicate UI projection is distinguished from duplicate provider requests by durable ids and sequence.

### Optional community budget plugin

The community `dsh-budget` plugin advertises session, daily, and monthly budget policies:

```sh
dsh plugin --profile web add dsh-budget
```

Treat it as third-party defense in depth. Its reported cost depends on its own meter and configured prices, and its documented default over-limit policy is `alert`. Select and test `block` or `degrade` explicitly if you need enforcement. Keep an independent provider-side limit even when the plugin is installed.

## When to report upstream

Report the smallest reproducible event sequence, not an account balance alone. State whether the repetition was in the Agent loop, a tool, an LLM retry layer, or detached work. Link the exact upstream commit because this developer-preview behavior can change.

Related reports include [#3228](https://github.com/deepseek-ai/deepseek-harness/discussions/3228), [#3229](https://github.com/deepseek-ai/deepseek-harness/discussions/3229), [#2821](https://github.com/deepseek-ai/deepseek-harness/discussions/2821), [#3171](https://github.com/deepseek-ai/deepseek-harness/discussions/3171), and the narrative-without-tools report [#4717](https://github.com/deepseek-ai/deepseek-harness/discussions/4717). The latter contains no event log or minimized request yet, so its checkpoint/compaction attribution remains a hypothesis.

## Primary sources

- [Agent loop implementation at verified commit `99f6f02`](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/agent-loop/src/agent.ts)
- [rc.2 Agent loop completion and continuation semantics](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/core/agent-loop/src/agent.ts)
- [rc.2 Goal round driver and round limit](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/goal/goal-round-driver/src/index.ts)
- [`maxParallelToolCalls` configuration](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/agent-loop/README.md)
- [Rolling tool-call concurrency implementation](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/agent-loop/src/tool-calls.ts)
- [Basic compaction contract](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/compaction/compaction-basic/README.md)
- [LLM retry contract](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/llm/llm-retry/README.md)
- [CLI shutdown behavior](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/apps/cli/reference/README.md)
- [TUI cancellation design note](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/.agents/notes/archived/simplification/2026-07-21-tui-remove-cancel-command.md)
- [`dsh-budget` community announcement](https://github.com/deepseek-ai/deepseek-harness/discussions/2553)
