---
title: Run Subprocesses Safely Inside DeepSeek Harness Tools
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
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

## Avoid shell injection

Changing `execSync(commandString)` to async `exec(commandString)` removes blocking but keeps a shell-injection boundary. Prefer `execFile(binary, argv)` or `spawn(binary, argv)` with `shell: false`. Never concatenate model or user input into a shell command.

On Windows, `.bat` and `.cmd` files require a shell or explicit `cmd.exe`; do not enable `shell: true` globally as a portability shortcut.

## Prove the repair

In a disposable workspace verify success, nonzero exit, cancellation, timeout, output overflow, another Session, Web health, persistence pressure, and plugin disposal. Use OS process inspection—not only a resolved Promise—to prove no child or grandchild remains.

## Acceptance gates

- [ ] No tool-body path calls `spawnSync`, `execSync`, or `execFileSync`.
- [ ] The child API is asynchronous and avoids an unnecessary shell.
- [ ] Executable and arguments remain separate.
- [ ] `exec.signal` reaches the process owner.
- [ ] Timeout ownership and process-tree escalation are explicit.
- [ ] Every pipe is consumed or intentionally ignored.
- [ ] Buffered output has a documented maximum; large output streams or spills.
- [ ] Nonzero exits preserve prior Agent-visible semantics.
- [ ] Cancellation, timeout, and disposal leave no descendants.
- [ ] The promise settles only after owned work reaches quiescence.
- [ ] Another Session and the Web control plane remain responsive.
- [ ] The Session contains one authoritative result for the call.

## Primary sources

Verified against DeepSeek Harness rc.8 commit `141eb6fef83422698aef7a981029e843e8161534` on 2026-08-20.

- [Official `spawnSync` freeze report #3477](https://github.com/deepseek-ai/deepseek-harness/discussions/3477)
- [rc.8 tool execution contract](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/core/tools/src/index.ts#L222-L255)
- [rc.8 tool subsystem documentation](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/docs/subsystems/tools.md)
- [rc.8 subprocess lifecycle seam](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/docs/subsystems/subprocess.md)
- [Node.js child-process documentation](https://nodejs.org/api/child_process.html)
- [Tool execution pipeline](../architecture/tool-execution-pipeline.md)
