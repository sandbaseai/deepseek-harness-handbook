---
title: Run Subprocesses Safely Inside DeepSeek Harness Tools
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-27
upstream_revision: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Run subprocesses safely inside DeepSeek Harness tools

Do not call `spawnSync`, `execSync`, or `execFileSync` inside a DeepSeek Harness tool body. These APIs block the Host event loop until the child exits. In an async Agent runtime, that can freeze Web requests, Session persistence callbacks, cancellation, approval, other tools, and the timeout intended to stop the call.

An official report captured a stronger failure on macOS and Node 22: `spawnSync` entered its nested libuv loop while an async tool continuation was running in a microtask checkpoint, and the Host stopped responding permanently. Whether or not a deployment reproduces that exact re-entrancy stack, synchronous subprocess work violates the current DSH tool lifecycle: async work must forward `exec.signal`, settle after its owned work reaches quiescence, and remain cancellable.

```text
Agent dispatch → async execute(args, exec) → spawnSync()
  ├─ session.cancel cannot run
  ├─ timeout wrapper cannot settle
  ├─ Session write completion cannot progress
  └─ Web health request stops responding
```

Replace the synchronous call before tuning persistence, worker-pool size, or retry policy.

This is a different failure from a child that exits abruptly. An asynchronously spawned child may crash, terminate itself, close its pipes early, or be killed by the process owner. That event must settle one tool call; it must not terminate the Host. Diagnose the two cases separately.

## Route a child crash to the correct layer

Official report #4713 describes a Windows community desktop build based on `dataelement/dsh-desktop`. A third-party Python application called `os.kill(os.getpid(), 0)` while trying to probe liveness. On Windows, Python does not give `sig=0` the POSIX probe meaning: values other than the two console-control events call `TerminateProcess`, and the supplied value becomes the exit code. The Python process therefore terminated itself.

That explains the child's disappearance. It does not, by itself, prove why the Electron application exited. Keep four identities separate:

```text
third-party program
  ↓ owned by
shell / PowerShell executor
  ↓ hosted by
official DSH Host process
  ↓ embedded or supervised by
community desktop main process
```

Capture the process tree and the first terminal fact for each boundary. “Tool interrupted, then the window closed” can mean:

- the tool result never settled and a wrapper treated rejection as fatal;
- an unhandled stream `error` reached the desktop main process;
- the official Host exited and the desktop wrapper mirrored that exit;
- the desktop process itself crashed independently;
- a supervisor terminated both processes;
- the user interface disconnected while the Host remained alive.

Do not report a core Harness regression until the reproduction uses an official composition or identifies the official package and line that crossed the failure boundary.

## Know the current rc.2 subprocess contract

At commit `b150a55`, `dsh-subprocess-local` uses asynchronous `child_process.spawn()`. Runtime termination resolves `handle.done` with `{ exitCode, signal }`; only a spawn-level failure rejects. The implementation:

- listens for `error`, `exit`, and `close` and guards settlement once;
- waits for `close`, or a bounded post-exit pipe-drain grace, before resolving;
- destroys only Harness-owned collected pipes at settlement;
- attaches an `error` listener to supplied stdin and treats `EPIPE` as best-effort;
- keeps bounded stdout and stderr tails and optionally spills the complete stream;
- reacts to `AbortSignal` with tree-scoped termination;
- retains the live handle until `waitForExit()` confirms its owned tree boundary;
- installs synchronous exit cleanup for Host exit paths that can still execute JavaScript.

The upstream tests explicitly make a child exit without reading roughly 1 MiB of stdin. The resulting `EPIPE` does not reject or crash the Host; `done` reports the child's exit code. Separate tests exercise ordinary managed-tree cleanup after direct Host exit, an uncaught exception, and an unhandled rejection.

These are strong source-level expectations, not proof about an arbitrary desktop distribution. A packager can replace the process owner, omit the official provider, add its own pipes, or turn a contained rejection into a fatal main-process error.

## Find and capture the blocking path

```sh
rg -n "\b(spawnSync|execSync|execFileSync)\b" src packages plugins
```

Review transitive helpers too. A tool may appear async while calling a synchronous wrapper several layers below. Record one harmless, bounded reproduction:

```text
DSH version or commit:
Node and operating-system versions:
Plugin version and tool name:
Exact synchronous API and executable:
Call start and last durable Session event:
HTTP health-probe and cancellation results:
Sanitized process stack/sample:
```

Do not reproduce against a production Session or a command with side effects. A frozen child may have completed its external effect even when the tool never returned a result.

## Migrate a buffered command to `execFile`

Use `execFile` when output is bounded and no shell syntax is required. Pass executable and arguments separately, forward the DSH signal, bound the buffer, and keep Windows console creation explicit.

```ts
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { defineTool } from '@deepseek-ai/dsh-tools'

const execFileAsync = promisify(execFile)
type ChildFailure = Error & { code?: string | number; stdout?: string; stderr?: string }

export const inspectRepo = defineTool({
  name: 'inspect_repo',
  description: 'Read bounded repository metadata without a shell.',
  parameters: { cwd: { type: 'string', required: true } },
  output: {
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        exitCode: { type: 'integer', required: true },
        stdout: { type: 'string', required: true },
        stderr: { type: 'string', required: true },
      },
    },
    render: (_args, value) => [{
      type: 'text',
      text: value.stdout || value.stderr || `exit ${value.exitCode}`,
    }],
  },
  timeoutMs: 30_000,
  async execute(args, exec) {
    try {
      const { stdout, stderr } = await execFileAsync(
        'git', ['status', '--short', '--branch'], {
          cwd: args.cwd,
          encoding: 'utf8',
          maxBuffer: 512 * 1024,
          signal: exec.signal,
          windowsHide: true,
        },
      )
      return { exitCode: 0, stdout, stderr }
    } catch (cause) {
      if (exec.signal.aborted) throw cause
      const error = cause as ChildFailure
      return {
        exitCode: typeof error.code === 'number' ? error.code : 1,
        stdout: error.stdout ?? '',
        stderr: error.stderr ?? error.message,
      }
    }
  },
})
```

This preserves a command-outcome shape for nonzero exits. If the old tool treated nonzero exit as a tool failure, throw a sanitized error instead; do not silently change Agent-visible semantics.

`timeoutMs` is enforced by the tool-call-timeout policy and asserts that the implementation forwards `exec.signal`. Verify the selected composition mounts that policy; metadata alone cannot terminate an uncooperative child.

## Stream or own the process tree when needed

`execFile` buffers stdout and stderr and terminates the child when `maxBuffer` is exceeded. Use asynchronous `spawn` and consume every pipe for long logs or protocols. Use the DSH subprocess capability when the composition supplies it and helpers may spawn descendants.

The DSH subprocess seam makes the lifetime explicit:

- argv is an array and is never shell-interpreted;
- cwd, stdio, environment, and grace period are explicit;
- the caller signal starts termination;
- termination is process-tree scoped on POSIX and Windows;
- collected output exposes bounded tails and spill evidence;
- `waitForExit()` observes the tree, not only the direct child.

A raw `ChildProcess.kill()` may stop only the direct process while leaving grandchildren alive.

## Preserve cancellation and settlement

Forward `exec.signal` to the I/O owner. Do not race a child promise against a timer and return while the process still runs. The DSH registry does not abandon a tool promise and cannot hard-kill same-process code.

When cancellation wins, stop new work, terminate the process tree, drain or close pipes, wait through the bounded escalation policy, and settle the same tool promise. Do not retry automatically: the external effect may be partially complete.

## Contain every stream and event edge

When a plugin uses raw `child_process.spawn()` instead of the DSH seam, it owns every EventEmitter error surface. At minimum:

```ts
import { spawn } from 'node:child_process'

const child = spawn(binary, argv, {
  cwd,
  shell: false,
  windowsHide: true,
  stdio: ['pipe', 'pipe', 'pipe'],
})

const outcome = await new Promise<{ exitCode: number | null; signal: NodeJS.Signals | null }>(
  (resolve, reject) => {
    let settled = false
    const finish = (exitCode: number | null, signal: NodeJS.Signals | null) => {
      if (settled) return
      settled = true
      resolve({ exitCode, signal })
    }
    const fail = (error: Error) => {
      if (settled) return
      settled = true
      reject(error)
    }
    child.once('error', fail) // spawn/kill/abort failure, not an ordinary runtime exit
    child.once('close', finish) // stdio has closed; exit can arrive earlier
    child.stdin?.on('error', error => {
      if ((error as NodeJS.ErrnoException).code !== 'EPIPE') fail(error)
    })
  },
)
```

This sketch is not a full replacement for `ctx.subprocess`: it lacks cancellation, bounded output, tree termination, spill, and post-exit drain limits. Prefer the seam when it is available. If using raw streams, also attach bounded consumers to stdout and stderr; unread pipes can block a still-running child.

Treat these facts differently:

| Fact | Expected channel | Host action |
|---|---|---|
| child exits 0 | `close(0, null)` | return a successful result |
| child exits nonzero | `close(code, null)` | return or throw the documented command outcome |
| child is killed | `close(null, signal)` where the platform exposes it | return an interrupted/killed outcome |
| Windows termination yields a numeric status | platform-specific exit fact | preserve the raw code; do not invent a POSIX signal |
| executable or cwd is missing | child `error`, commonly `ENOENT` | reject one tool call with a sanitized diagnostic |
| stdin closes early | writable `error`, commonly `EPIPE` | stop writing; preserve the authoritative child outcome |
| output pipe read fails | readable `error` | settle the tool once and clean up the tree |
| desktop RPC/socket closes | wrapper transport event | isolate from the child outcome and record both identities |

## Do not continue after an unknown global exception

Adding a process-wide `uncaughtException` or `unhandledRejection` handler that logs and continues is not a subprocess fix. Node's official guidance treats `uncaughtException` as a last-resort synchronous cleanup point because application state may be undefined. Continuing can leave Cordis effects, tool ownership, Session persistence, or IPC in a partially mutated state.

Use global handlers only to:

1. emit a bounded crash diagnostic without secrets;
2. synchronously terminate owned child trees where possible;
3. preserve the original nonzero exit semantics;
4. let an external supervisor restart the Host;
5. recover durable Sessions through their normal replay path.

Fix the local rejected Promise or missing EventEmitter `error` listener at its owner. Do not convert an invariant failure into apparent success.

## Reproduce without risking real work

Use a disposable workspace, synthetic Session, and a child whose only effect is its own termination. Never target a PID discovered by name and never run the probe inside the Host process.

Test these layers independently:

1. run the child through the official PowerShell or subprocess composition without the desktop wrapper;
2. repeat through the desktop distribution;
3. record parent and child PIDs before the call;
4. capture child `error`, `exit`, and `close` facts with timestamps;
5. capture Host exit code, stderr tail, crash report, and last durable Session sequence;
6. capture desktop main-process exit code and renderer disconnect separately;
7. prove whether the official Host PID remains alive after the child settles;
8. restart from the copied Session and verify the last committed event.

A clean child-failure test should yield exactly one failed or interrupted tool result while a second harmless command, another Session, and a Web health request still work. A Host-survival test is incomplete if it checks only that the window remains visible.

## Avoid shell injection

Changing `execSync(commandString)` to async `exec(commandString)` removes blocking but keeps a shell-injection boundary. Prefer `execFile(binary, argv)` or `spawn(binary, argv)` with `shell: false`. Never concatenate model or user input into a shell command.

On Windows, `.bat` and `.cmd` files require a shell or explicit `cmd.exe`; do not enable `shell: true` globally as a portability shortcut.

## Prove the repair

In a disposable workspace verify success, nonzero exit, self-termination, external forced termination, stdin `EPIPE`, output-pipe failure, cancellation, timeout, output overflow, another Session, Web health, persistence pressure, desktop-wrapper disconnect, and plugin disposal. Use OS process inspection, not only a resolved Promise, to prove no child or grandchild remains.

## Acceptance gates

- [ ] No tool-body path calls `spawnSync`, `execSync`, or `execFileSync`.
- [ ] The child API is asynchronous and avoids an unnecessary shell.
- [ ] Executable and arguments remain separate.
- [ ] `exec.signal` reaches the process owner.
- [ ] Timeout ownership and process-tree escalation are explicit.
- [ ] Every pipe is consumed or intentionally ignored.
- [ ] Buffered output has a documented maximum; large output streams or spills.
- [ ] Nonzero exits preserve prior Agent-visible semantics.
- [ ] An abrupt child exit settles one tool call and the Host PID survives.
- [ ] Windows numeric termination status is not mislabeled as a POSIX signal.
- [ ] Stdin `EPIPE` and output-stream errors have local owners.
- [ ] Child, official Host, desktop main process, and renderer identities are recorded separately.
- [ ] A community desktop failure is reproduced against the official composition before assigning a core regression.
- [ ] Global exception handlers perform crash cleanup and exit; they do not continue unknown state.
- [ ] Cancellation, timeout, and disposal leave no descendants.
- [ ] The promise settles only after owned work reaches quiescence.
- [ ] Another Session and the Web control plane remain responsive.
- [ ] The Session contains one authoritative result for the call.

## Primary sources

Verified against DeepSeek Harness `0.1.1-rc.2` commit `b150a551b8d465e31e418e1b2eaf5e79bbb7d28e` on 2026-08-27.

- [Official `spawnSync` freeze report #3477](https://github.com/deepseek-ai/deepseek-harness/discussions/3477)
- [Windows child termination and community desktop crash report #4713](https://github.com/deepseek-ai/deepseek-harness/discussions/4713)
- [rc.2 local subprocess runtime](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/subprocess/subprocess-local/src/spawn.ts)
- [rc.2 EPIPE containment regression test](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/subprocess/subprocess-local/tests/spawn.spec.ts)
- [rc.2 Host-exit tree cleanup tests](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/subprocess/subprocess-local/tests/process-exit.spec.ts)
- [rc.2 subprocess provider contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/subprocess/subprocess-local/README.md)
- [Python `os.kill()` Windows semantics](https://docs.python.org/3.12/library/os.html#os.kill)
- [Node.js child-process documentation](https://nodejs.org/api/child_process.html)
- [Tool execution pipeline](../architecture/tool-execution-pipeline.md)
