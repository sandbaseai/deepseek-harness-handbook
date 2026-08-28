---
title: Fix TUI Slash Commands Failing with "Cannot Read Properties of Undefined (Reading 'aborted')"
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-28
verified_upstream: cd5ef8148158c3a752a658978873241fdf8e2bbc
---

# Fix TUI slash commands failing on `signal.aborted`

Use this guide when a third-party DeepSeek Harness TUI immediately rejects every registry-backed slash command with an error like:

```text
Command failed: TypeError: Cannot read properties of undefined (reading 'aborted')
```

This signature points to an adapter call-shape mismatch, not a `/compact` handler failure. The official alpha.1 command runtime requires four positional arguments:

```ts
commands.execute(agent, line, images, signal)
```

If an adapter calls `execute(agent, line, controller.signal)`, JavaScript assigns the `AbortSignal` to `images` and leaves `signal` undefined. The registry resolves the command, then reads `signal.aborted` before invoking its handler. Every known registry command therefore fails at the same boundary.

## Confirm the failure class

Run three probes in the same TUI process:

| Probe | Expected observation | Meaning |
|---|---|---|
| a TUI-local command such as `/sessions` | works | the TUI input loop itself is alive |
| a registry command such as `/compact` | fails on `undefined.aborted` | the registry adapter path is broken |
| another registry command such as `/goal` or `/plan` | fails with the same stack boundary | failure is command-independent |

Then capture the installed versions and the actual loaded files. Package-manager metadata alone is insufficient when a global install, stale bundle, linked checkout, or multiple Node prefixes may be involved.

```bash
node --version
pnpm --version
pnpm root -g
pnpm list -g --depth 1
command -v dsh
```

On Windows also record whether the launcher came from PowerShell, Command Prompt, Git Bash, WSL, or another shell. Do not infer the loaded TUI bundle solely from the displayed package version; locate the stack's `app.js` and inspect both `commands.execute` call sites.

## Apply the adapter fix

Pass an explicit empty image array before the signal:

```ts
const execution = await commands.execute(
  agent,
  '/compact',
  [],
  controller.signal,
)

const execution = await commands.execute(
  agent,
  line,
  [],
  controller.signal,
)
```

Use `[]`, rather than pretending the third argument does not exist. The official parameter is `readonly EncodedImageAttachment[]`, the official Web/Session paths send an empty array for text-only commands, and official command tests exercise that same shape. If the TUI later supports command images, pass the normalized encoded image array in that slot instead.

Patch every registry dispatch path. In the reported TUI 0.3.0 bundle, one call serves the low-context `/compact` action and another serves slash commands typed in the composer. Fixing only the visible composer path leaves automatic/manual compaction broken; fixing only compaction leaves other commands broken.

Do not patch the official registry to make `signal` optional as the primary fix. That would hide an adapter ABI error, would not turn the misplaced `AbortSignal` into a valid image list, and could allow a command to continue after its owning UI request is canceled.

## Verify behavior, not just the exception

After rebuilding or replacing the TUI bundle, restart the process and verify:

1. `/compact` no longer throws before its handler;
2. another registered command executes and renders its settled result;
3. a TUI-local command still takes the local path;
4. an unknown slash command remains unknown rather than becoming a model prompt;
5. canceling a pending command reaches the fourth-argument signal;
6. the low-context compaction action uses the corrected call site;
7. a clean reinstall loads the patched bundle rather than a stale global copy.

The absence of `undefined.aborted` is necessary but not sufficient. A swapped or fabricated argument can move the failure downstream. Assert the adapter call directly:

```ts
expect(commands.execute).toHaveBeenCalledWith(
  agent,
  '/compact',
  [],
  controller.signal,
)
```

Add the same assertion for the generic composer dispatch. Also test an already-aborted signal: the official registry must reject it before publishing `command/run` or invoking the handler.

## If the four-argument patch does not fix it

Trace these boundaries in order:

| Observation | Next check |
|---|---|
| stack still points to `signal.aborted` | prove the running process loaded the edited `app.js`; remove stale global/link ambiguity |
| registry returns `undefined` with no exception | command syntax or name did not resolve; inspect `commands.list(agent)` / registration composition |
| command settles with an error result | inspect the command handler and its durable `command/run` → `command/done` lifecycle |
| only image-bearing commands fail | validate encoded image envelopes, command `input.images`, attachment store, and limits |
| only cancellation fails | preserve the real `AbortSignal`; check adapter ownership and listener cleanup |
| Web works but TUI fails | compare adapter arguments and loaded composition, not the command implementation |

Avoid repeatedly running state-changing commands while diagnosing. A handler error can occur after `command/run` and after partial external work; reconcile durable lifecycle events and external effects before replaying it.

## Maintainer regression contract

A compatible TUI command adapter should:

1. bind the exact receiving Agent;
2. forward the complete slash-command line unchanged;
3. always provide an image array, including `[]` for text-only input;
4. forward the request-owned `AbortSignal` in the fourth position;
5. keep local-only commands out of the registry path;
6. distinguish unknown commands from rejected and failed executions;
7. render the settled `CommandResult` without submitting it as a user/model message;
8. cover composer dispatch, context-low compaction, images, unknown commands, cancellation, and clean packaged installation.

Prefer a typed source-level adapter and compile it against the supported `@deepseek-ai/dsh-commands` version. A JavaScript bundle or `any`-typed boundary turns a detectable four-argument incompatibility into a runtime crash.

## Evidence template

```text
Harness version/commit:
TUI package/version:
Node and package-manager version:
OS and shell:
dsh executable path:
global package root:
loaded TUI app.js path:
command entered:
local or registry-backed:
execute arguments observed:
full stack (redacted):
command/run appended: yes / no
command handler entered: yes / no
result after four-argument patch:
```

Remove tokens, prompts, private paths, and command output that contains sensitive data.

## Verification boundary

The four-argument registry contract, pre-handler `signal.aborted` check, text-only empty image array, command lifecycle, and cancellation behavior are source-verified at official alpha.1 commit [`cd5ef814`](https://github.com/deepseek-ai/deepseek-harness/tree/cd5ef8148158c3a752a658978873241fdf8e2bbc). The two three-argument TUI call sites and package versions are reported in discussion #4839; the TUI repository or source package was not identified in that report, so this handbook does not independently attest to its full bundle. Treat the proposed TUI patch as integration guidance until its maintainer publishes and verifies a fixed artifact.

## Pinned official sources

- [Alpha.1 command runtime and `execute` contract](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/interaction/commands/src/index.ts)
- [Alpha.1 command architecture](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/interaction/commands/README.md)
- [Alpha.1 command runtime tests](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/interaction/commands/tests/commands.spec.ts)
- [Alpha.1 `/compact` four-argument integration test](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/compaction/command-compact/tests/command-compact.spec.ts)
- [Alpha.1 Session client text-only command call](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/api/session-controller/src/client/sessions/session.ts)
- [TUI argument-order report #4839](https://github.com/deepseek-ai/deepseek-harness/discussions/4839)
