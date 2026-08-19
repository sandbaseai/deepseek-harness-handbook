---
title: Windows Folder Picker Crash and Unicode Truncation in DeepSeek Harness
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-19
upstream_revision: 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
---

# Route Windows folder-picker crashes and Unicode truncation

Use this guide when DeepSeek Harness on Windows reports:

```text
directory picker failed: directory picker failed:
win32 folder dialog worker exited before reporting a result
```

or when the native dialog returns a visibly shortened path and workspace creation later reports:

```text
workspace-invalid-path: cannot create a workspace at "D:\...\CAN盒子二次":
ENOENT: no such file or directory, realpath 'D:\...\CAN盒子二次'
```

The worker-exit message states only that the spawned picker terminated before it sent a terminal IPC message. The `ENOENT` case is different: the worker may have returned successfully, but `readUtf16()` corrupted the path before the Host validated it. At least four failures now need separate branches:

1. a Node-runtime-specific Koffi crash while decoding the selected UTF-16 path;
2. silent UTF-16LE truncation when a selected path contains a `U+XX00` code point;
3. an incomplete or incompatible native-module installation;
4. an unhealthy leftover DSH process whose child-process environment is no longer trustworthy.

Do not patch generated JavaScript, pin a random Koffi version, disable the sandbox, or grant full access before classifying the failure.

## Preserve the first evidence

Record the exact execution topology before reinstalling:

```powershell
node --version
npm --version
Get-Command node,npx | Format-List Name,Source
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
  Select-Object ProcessId,ParentProcessId,CommandLine
Get-NetTCPConnection -LocalPort 3080 -State Listen -ErrorAction SilentlyContinue
```

Also capture:

```text
DSH package version:
Launch command:
Native dialog appeared: yes / no
Crash occurred before selection or after selection:
ASCII path result:
CJK path result:
Path containing a U+XX00 character (for example 开 U+5F00):
Expected path versus path quoted by ENOENT:
Clean restart result:
```

Do not publish usernames, full private paths, profile files, credentials, or Session logs.

## Route by the last successful boundary

### A. Dialog opens, selection succeeds, then the worker exits

This signature points after COM dialog creation and before the selected path returns to the Host.

At the verified rc.7 source, `readUtf16()` reads the native address through:

```ts
Buffer.from(koffi.view(address, 32768))
```

The upstream discussion contains a focused reproduction reporting that this call succeeds on Node 22.23.2 and aborts on Node 24.18.1 for the picker path, independently of Koffi 3.1.1 versus 3.1.5. The official engine range includes both `^22.19.0` and `>=24.0.0`, so this is a component-specific compatibility conflict, not proof that Node 24 is globally unsupported.

Run a clean A/B with the exact same DSH release, home copy, path, and launch command under a current supported Node 22 release and your failing Node 24+ release. Stop every writer before copying or switching the home.

**Evidence for this branch:** dialog appears; choosing a directory triggers the worker exit; Node 22 succeeds while Node 24+ fails under otherwise identical conditions.

### B. Dialog returns, but the path is cut at a Han character

This is silent corruption, not a worker crash and not a workspace-validator bug. In rc.7, `readUtf16()` scans only the low byte of each UTF-16LE code unit:

```ts
while (end + 1 < bytes.length && bytes[end] !== 0) end += 2
```

A true UTF-16LE terminator is `00 00`. Characters whose code point ends in `00` are encoded with a zero low byte followed by a nonzero high byte. For example:

```text
开 U+5F00 → 00 5F
一 U+4E00 → 00 4E
刀 U+5200 → 00 52
退 U+9000 → 00 90
```

The rc.7 loop mistakes the first byte for the terminator. A selected path such as:

```text
D:\PythonProjects\Python\CAN盒子二次开发\can_auto_test
```

can therefore reach workspace validation as:

```text
D:\PythonProjects\Python\CAN盒子二次
```

`fs.realpath()` correctly rejects that nonexistent truncated path. Compare the expected selection with the exact path quoted by `ENOENT`; the first missing character is decisive evidence.

The source-level repair is a two-byte terminator test:

```ts
while (end + 1 < bytes.length
  && (bytes[end] !== 0 || bytes[end + 1] !== 0)) end += 2
```

Do not patch an installed `lib` file as an operator workaround. The durable upstream fix also needs a regression fixture containing a `U+XX00` character; generic “CJK” or ASCII fixtures do not guarantee this byte pattern.

**Evidence for this branch:** the dialog completes; the error quotes a path truncated immediately before `开`, `一`, `刀`, `退`, or another `U+XX00` code point; the full selected directory exists.

### C. Dialog never appears and native modules failed during install

Inspect the original npm output for Koffi or native build/install-script failure. An isolated `npx` dependency tree does not necessarily use a globally installed `koffi` or `node-pty`; installing another global copy can leave the failing tree unchanged.

Use an exact-version project-local install as a clean diagnostic rather than modifying the npx cache in place:

```powershell
mkdir dsh-picker-repro
cd dsh-picker-repro
npm init -y
npm install --ignore-scripts @deepseek-ai/dsh@0.1.0-rc.7
npm rebuild koffi
npx dsh web
```

The `--ignore-scripts` step is inspection staging, not a runnable final install. Review the package manager's allowed-build instructions and native build output before enabling scripts. A build must produce the native artifact in the same dependency tree that `dsh` resolves.

**Evidence for this branch:** dialog never appears; install or rebuild output names Koffi/native compilation; the same tree cannot import the binding.

### D. A listener survives after the terminal or wrapper exits

If port 3080 remains owned by an unexpected `node.exe`, stop admission and terminate the verified leftover DSH process. Do not kill every Node process on the machine.

Confirm the PID and command line first:

```powershell
Get-NetTCPConnection -LocalPort 3080 -State Listen |
  Select-Object OwningProcess
Get-CimInstance Win32_Process -Filter "ProcessId = <verified-pid>" |
  Select-Object ProcessId,ParentProcessId,CommandLine
```

After the verified process exits, start DSH once from a normal foreground terminal and retry the picker.

**Evidence for this branch:** a stale DSH listener existed; the worker succeeds after terminating only that process and performing a clean foreground start.

## Recover now with the shipped browse backend

The native picker is not the only official directory-picker implementation. The shipped browse backend renders inside the Web client and uses Node filesystem primitives instead of the Win32 COM/Koffi worker.

Back up the profile patch, then replace the adaptive picker row by ID in:

```text
%USERPROFILE%\.dsh\profiles\web\cordis.patch.yml
```

Add this overlay entry without deleting unrelated user rows:

```yaml
- id: directory-picker
  name: '@deepseek-ai/dsh-host-directory-picker-browse'
```

The auto chooser and a concrete backend must not both remain as separate live rows, because both provide the same single directory-picker capability. Replacing the existing `directory-picker` row by ID preserves the seam.

After a clean restart, the workspace action should open **Select Workspace Directory** inside the browser. Test listing, path entry, selection, and workspace creation with a disposable directory.

### Roll back

Restore the original patch or replace the row with the adaptive chooser:

```yaml
- id: directory-picker
  name: '@deepseek-ai/dsh-host-directory-picker-auto'
```

Restart and verify the resolved composition before trying the native dialog again.

## Avoid high-risk false fixes

| Attempt | Why it is unsafe or weak |
|---|---|
| Edit `lib/index.js` inside a global or npx cache | Unversioned, overwritten by reinstall, and difficult to audit |
| Replace Win32 durable file operations with plain rename | Changes Session/config durability semantics beyond the picker |
| Run with unrestricted permissions | A native decode crash is not an authorization failure |
| Pin Koffi without an A/B | The reported Node 24 picker signature reproduced across multiple Koffi versions |
| Install a global native package | The isolated DSH tree may not resolve it |
| Kill every `node.exe` | Can terminate unrelated development or production workloads |

## Acceptance matrix

| Test | Native rc.7 | Browse fallback |
|---|---|---|
| Dialog opens | record | in-browser card opens |
| ASCII path returns exactly | record | required |
| ordinary CJK path returns exactly | record | required |
| path containing `开` (U+5F00) returns exactly | record | required |
| Cancel leaves no workspace | required | required |
| Abort closes the interaction | required | required |
| New Session uses selected cwd | required | required |
| Restart preserves workspace identity | required | required |

Keep browse mode if it meets the product need. If reporting the native failure, attach the Node A/B, exact package version, worker timing, sanitized path class, and clean-process result.

## Primary sources

- [Official failure discussion #30](https://github.com/deepseek-ai/deepseek-harness/discussions/30)
- [Confirmed rc.7 UTF-16LE truncation report #3291](https://github.com/deepseek-ai/deepseek-harness/discussions/3291)
- [Original directory-name truncation report #3188](https://github.com/deepseek-ai/deepseek-harness/discussions/3188)
- [rc.7 Win32 UTF-16 decode path](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/host/directory-picker-native/src/win32-dialog-bindings.ts)
- [Native picker contract](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/host/directory-picker-native/README.md)
- [Adaptive picker selection contract](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/host/directory-picker-auto/README.md)
- [Browse picker contract](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/host/directory-picker-browse/README.md)
- [Official Web composition picker row](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/bundle/web-app/cordis.patch.yml)
