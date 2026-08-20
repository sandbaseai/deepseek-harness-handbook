---
title: Stop Console Windows Flashing During DeepSeek Harness Tool Calls
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
---

# Stop console windows flashing during DeepSeek Harness tool calls on Windows

When an Electron-hosted DeepSeek Harness Agent starts PowerShell, Node, Git, or another console program on Windows, a black console window can appear and disappear for every tool call. The visible symptom is one window, but rc.8 has two process-creation paths with different repair boundaries:

```text
Agent tool
├─ local subprocess path ── Node child_process.spawn()
└─ Windows ACL sandbox ─── restricted token + CreateProcessAsUserW()
```

Do not apply a PowerShell-only flag or disable the sandbox before proving which path created the window.

## Capture the controlling path

Record the exact runtime and resolved composition before changing it:

```powershell
dsh --version
node --version
Get-ComputerInfo | Select-Object WindowsProductName,WindowsVersion,OsBuildNumber
dsh --profile <profile> --dump-config > dsh-config-sanitized.txt
```

Remove credentials and private paths from the dump. Then run the smallest matrix from the same desktop host:

| Probe | Why it matters |
|---|---|
| one `pwsh` command that prints stdout and stderr | proves the primary console symptom and pipe integrity |
| one `node -e` or `git --version` command | separates a general process-creation defect from PowerShell UX |
| the same commands through the selected sandbox | identifies the restricted-token path |
| the same commands from a visible terminal-hosted DSH process | separates GUI-parent behavior from command behavior |

Use Process Explorer, Process Monitor, or an equivalent local process-tree capture if configuration evidence does not identify the creator. Record the parent process, executable, command line, and whether the call was sandboxed. Do not record secrets passed in arguments.

## Route the two paths independently

### Path A: local subprocess service

At rc.8, `packages/subprocess/subprocess-local/src/spawn.ts` calls Node `spawn()` without `windowsHide`; its Windows branch also uses `taskkill` during teardown without that option. From a GUI parent with no console, a console-subsystem child can therefore receive a visible window.

The source repair belongs at the process-creation calls:

- set `windowsHide: true` on Windows for the local `spawn()` path;
- apply the same policy to the `spawnSync('taskkill', ...)` teardown path;
- preserve argument arrays, inherited pipes, cwd, environment, cancellation, and exit semantics;
- assert the option in the existing mocked child-process tests.

This covers unsandboxed local children. It does not prove that a child created inside the Windows ACL sandbox will be hidden.

### Path B: Windows ACL sandbox

The sandbox does not use Node's `spawn()` for the final child. Its runner constructs `STARTUPINFOW` and calls `CreateProcessAsUserW()` with a restricted token. The rc.8 source deliberately avoids `CREATE_NO_WINDOW` and `CREATE_NEW_CONSOLE`: the package records that restricted-token children can fail with `STATUS_DLL_INIT_FAILED (0xC0000142)` when those flags are used.

The structure already contains `wShowWindow`, but rc.8 encodes only `STARTF_USESTDHANDLES`. A source-level repair can keep the required console allocation while requesting an initially hidden window:

```text
dwFlags = STARTF_USESTDHANDLES | STARTF_USESHOWWINDOW
wShowWindow = SW_HIDE
```

Apply the same encoding contract to both sandbox spawn variants. This is distinct from `CREATE_NO_WINDOW`: `STARTF_USESHOWWINDOW` controls the initial display state through `STARTUPINFO`; it does not remove the console creation contract that the restricted token requires.

## Why common fixes are incomplete

- **Only add `windowsHide`:** fixes Node-created local children, not the final child created by `CreateProcessAsUserW()` inside the sandbox.
- **Inject `pwsh -WindowStyle Hidden`:** is PowerShell-specific and applies after process creation; it does not cover Node or Git and may still expose a frame.
- **Use `Start-Process -WindowStyle Hidden` as proof:** that cmdlet sets creation-time startup information. It does not prove that passing `-WindowStyle Hidden` to an already-created `pwsh.exe` has identical timing.
- **Set `CREATE_NO_WINDOW`:** conflicts with the sandbox's documented restricted-token failure boundary.
- **Disable the sandbox:** removes a security boundary to fix a display problem.
- **Patch generated global `node_modules`:** produces an unreviewed, upgrade-fragile installation and weakens reproduction evidence.

## Bounded operator options before an official fix

Prefer a published DSH version containing a reviewed fix. Until one exists:

1. Keep the exact failing release and process-tree evidence.
2. If policy permits, run the affected workflow from a visible terminal-hosted DSH process or an isolated WSL/remote worker and verify that its sandbox contract still matches the task.
3. For source evaluation, use a disposable checkout and implement both creation-path changes; never modify the production installation in place.
4. Preserve a known-good executable and profile so the evaluation can be rolled back completely.

A workaround that suppresses the window but silently changes sandboxing, approval, stdout/stderr, or cancellation behavior has failed the acceptance contract.

## Acceptance gates

- [ ] No visible console appears for PowerShell, Node, Git, or a failing command.
- [ ] Both local-subprocess and Windows ACL sandbox paths are exercised.
- [ ] Both sandbox spawn variants encode `STARTF_USESHOWWINDOW` and `SW_HIDE`.
- [ ] Restricted-token children no longer reproduce `0xC0000142`.
- [ ] stdout, stderr, stdin, exit code, signal, timeout, and cancellation remain correct.
- [ ] Sandbox denial and allowed-write behavior remain unchanged.
- [ ] `taskkill` teardown creates no visible console and still terminates the process tree.
- [ ] Paths with spaces and non-ASCII characters remain intact.
- [ ] No shell or command-string quoting is introduced.
- [ ] macOS and Linux behavior is unchanged.
- [ ] A cold desktop restart reproduces the fix without generated-file edits.

## Incident record

```text
DSH version or commit:
Windows build and host type (Electron/Web/terminal):
Profile and sanitized composition:
Tool and exact sanitized command:
Observed parent -> child process path:
Sandbox active: yes / no / unknown
Window appears at start / teardown:
stdout, stderr, exit, cancellation results:
Control path result:
```

## Primary sources

- [Official console-window report and two-path investigation #3460](https://github.com/deepseek-ai/deepseek-harness/discussions/3460)
- [rc.8 local subprocess spawn](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/subprocess/subprocess-local/src/spawn.ts)
- [rc.8 Windows ACL sandbox spawn](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/sandbox/sandbox-windows-acl/src/spawn.ts)
- [rc.8 Windows ABI constants and restricted-token notes](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/sandbox/sandbox-windows-acl/src/win32-abi.ts)
- [Node.js `child_process` `windowsHide`](https://nodejs.org/api/child_process.html)
- [Microsoft `STARTUPINFOW`](https://learn.microsoft.com/windows/win32/api/processthreadsapi/ns-processthreadsapi-startupinfow)
- [Microsoft `CreateProcessAsUserW`](https://learn.microsoft.com/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessasuserw)
