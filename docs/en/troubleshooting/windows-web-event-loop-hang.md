---
title: Diagnose a Frozen DeepSeek Harness Web Host on Windows
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-27
upstream_revision: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Diagnose a Windows Web Host that stays listening but stops responding

Discussion #4755 reports a sharp boundary on Windows 11 with Node 22.22.2 and DeepSeek Harness 0.1.1-rc.2:

- `dsh web` is healthy while idle;
- submitting one message starts the failure;
- the process and listening socket remain present;
- every HTTP request then times out;
- CPU remains low and no child process is visible.

Those observations prove a live-process availability failure. They do **not** yet prove `Atomics.wait`, Zstandard, Landlock, a provider socket, or any other proposed root cause. Preserve the hung process and collect repeatable thread evidence before restarting it.

> [!WARNING]
> A full process dump can contain API keys, prompts, file paths, environment variables, and model output. Store it on an encrypted local volume, restrict access, and share it only through a private channel agreed with the maintainers. Never attach a full dump to a public GitHub discussion.

## Establish the exact failure boundary

Open a separate PowerShell window before reproducing. Resolve the listener to one process rather than assuming the first `node.exe` is DSH:

```powershell
$listener = Get-NetTCPConnection -LocalPort 3080 -State Listen -ErrorAction Stop
$dshPid = $listener.OwningProcess
Get-CimInstance Win32_Process -Filter "ProcessId = $dshPid" |
  Select-Object ProcessId, ParentProcessId, ExecutablePath, CommandLine
```

Record the output privately, together with:

```powershell
node --version
dsh --version
$dshProcess = Get-Process -Id $dshPid -ErrorAction Stop
Get-FileHash -LiteralPath $dshProcess.Path -Algorithm SHA256
```

Do not publish the full command line without reviewing it for paths, tokens, proxy credentials, and injected environment values.

Probe one cheap URL on a fixed cadence and write timestamps. This distinguishes a slow model turn from loss of Host responsiveness:

```powershell
1..20 | ForEach-Object {
  $started = Get-Date
  try {
    $response = Invoke-WebRequest http://127.0.0.1:3080/ -TimeoutSec 2 -UseBasicParsing
    "{0:o}`tHTTP {1}`t{2} ms" -f $started, $response.StatusCode, ((Get-Date) - $started).TotalMilliseconds
  } catch {
    "{0:o}`tTIMEOUT/ERROR`t{1}" -f $started, $_.Exception.Message
  }
  Start-Sleep -Seconds 1
}
```

Run the probe once while idle and once from a second terminal while submitting a single bounded message. Record the last successful probe, `turn/start`, provider request start, first provider byte, durable Session append, and first failed probe when those events are available.

| Observation | What it proves | What it does not prove |
|---|---|---|
| TCP remains `Listen` | the socket was not closed | the Node event loop is servicing accepts |
| all HTTP paths time out | Host responsiveness is lost, not only one Session view | which JS or native frame owns the wait |
| very low CPU | no sustained busy loop was measured | deadlock versus blocking I/O versus native wait |
| direct standalone `fetch` succeeds | that separate process can reach one endpoint | the DSH adapter, proxy, streaming, cancellation, or persistence path is healthy |
| no child process exists | the sampled parent has no live child | no worker thread, native addon, filesystem, or network wait exists |

## Capture three full dumps before killing the process

Use the official Microsoft Sysinternals ProcDump binary from a trusted location. Create a private directory with enough free space, then capture three full dumps five seconds apart:

```powershell
New-Item -ItemType Directory -Force C:\dsh-hang-dumps | Out-Null
procdump64.exe -accepteula -ma -n 3 -s 5 $dshPid C:\dsh-hang-dumps
Get-ChildItem C:\dsh-hang-dumps | Select-Object Name, Length, LastWriteTime
```

`-ma` requests a full user-mode dump. The three samples matter: one stack can catch a transient frame, while the same main-thread stack across all samples is stronger evidence of a stable wait.

Do not use ProcDump's `-h` trigger for this report. That trigger detects a process with a GUI window that stops responding to Windows window messages; a headless Node Web Host may have no qualifying window. Attach ProcDump manually to the verified listener PID after the HTTP probes fail.

Node diagnostic reports are useful for fatal errors and uncaught exceptions, but signal-triggered reports are not supported on Windows. A live main-thread stall may also prevent an injected JavaScript timer or API callback from running. Do not modify the global DSH install with a preload hook merely to obtain a report; the external dump preserves the running artifact.

## Read the samples as a sequence, not a keyword hunt

Open each dump in WinDbg and configure Microsoft symbols. Start with:

```text
!analyze -v
~
~* k
```

The useful deliverable is a sanitized comparison table, not only `!analyze` output:

| Dump | Main-thread top frames | Other Node/worker frames | CPU time delta | HTTP probe state |
|---|---|---|---:|---|
| 1 | exact module + offset | exact module + offset | baseline | timed out |
| 2 | exact module + offset | exact module + offset | delta | timed out |
| 3 | exact module + offset | exact module + offset | delta | timed out |

Classify conservatively:

- the same main-thread native wait in all three dumps supports a stable blocking or deadlock candidate;
- movement through different poll and callback frames may indicate progress that the two-second HTTP probe cannot observe;
- a zlib, filesystem, TLS, proxy, native-addon, subprocess, or scheduler frame is a lead only when its ownership and repetition are visible;
- a module merely being loaded is not evidence that it caused the hang;
- different stacks under direct and TUN-proxy runs are stronger than the proxy changing success by itself.

Do not publish private symbols, heap strings, environment blocks, command-line secrets, or raw memory excerpts.

## What rc.2 source does and does not support

The pinned production source does not contain `Atomics.wait()` or `execSync()` under `packages/` or `apps/`. Its production `spawnSync()` calls are limited to specific paths such as plugin installation, sandbox backend probes, and Windows process-tree termination. A message with no tool call does not by itself prove any of those paths executed.

The JSONL backend does use Zstandard by default, but its append encoder calls promisified `node:zlib` `zstdCompress`; seeing a `.jsonl.zstd` file is therefore not proof of a synchronous main-thread compression wait. The default bundle may contain platform-specific packages that never materialize or execute on Windows. Package presence is not call-path evidence.

Use source to narrow the candidate set, then require a dump or trace to connect the live process to a frame.

## Run bounded A/B tests after preserving the first incident

Change one boundary at a time and use a new disposable Session for each run:

| Test | Hold constant | Change | Interpretation |
|---|---|---|---|
| idle control | build, profile, port, network | no message | proves startup stability only |
| one text-only turn | prompt, Session age, provider | direct versus TUN route | network path is correlated only if repeatable |
| provider control | model request and network | standalone fetch versus full DSH turn | separates reachability from the Harness lifecycle |
| fresh Session | build, route, prompt | Session identity | tests history-specific state, not persistence implementation alone |
| tool-free response | build, route, Session | prompt that should require no tool | absence of a visible tool call narrows, but does not prove, scheduler paths |
| repeated dump set | exact failing run | sample time only | stable frames distinguish a wait from slow progress |

Do not remove plugins from shared profile bundles while another Host is running. Do not delete Session files, switch compression on a live store, or rotate credentials as a first diagnostic. If you evaluate a configuration variant, use a copied profile/home, a new Session root, and a documented rollback.

The TUN observation in #4755 deserves a controlled matrix. A standalone direct `fetch` and a streamed DSH request are different workloads: proxy discovery, TLS session behavior, response streaming, cancellation, DNS, and provider adapter logic may differ. Repeat both routes with the same build and prompt, then compare dumps and request timing rather than concluding that the proxy fixed the scheduler.

## Recover without losing the evidence boundary

After all dumps finish:

1. record the final listener, process, and file timestamps;
2. hash the dump files and keep them private;
3. treat any in-flight tool or external mutation as outcome-unknown;
4. attempt one ordinary `Ctrl+C` in the owning terminal;
5. if the process cannot handle it, stop the verified PID only after confirming it still owns the listener;
6. restart once and use a new disposable Session for the next A/B;
7. do not let an automatic watchdog erase the first hung process before capture.

```powershell
Get-FileHash C:\dsh-hang-dumps\*.dmp -Algorithm SHA256
Get-NetTCPConnection -LocalPort 3080 -State Listen | Select-Object OwningProcess
Stop-Process -Id $dshPid
```

The last command is destructive to the running turn. Execute it only after dump completion and PID re-verification.

## Upstream report checklist

- [ ] Exact Windows build, Node version, DSH version, install mode, and executable hash.
- [ ] Listener PID joined to executable path and sanitized command line.
- [ ] Idle and post-submit HTTP probe timelines.
- [ ] Last durable Session event and provider timing, without prompts or secrets unless explicitly approved.
- [ ] Three private full dumps and a sanitized repeated-stack comparison.
- [ ] Direct versus TUN A/B repeated more than once with one variable changed.
- [ ] Confirmation whether a tool call, sandbox probe, process termination, or persistence append actually occurred.
- [ ] Outcome of graceful shutdown and exact point where a forced stop became necessary.

## Primary sources

- [Official field report #4755](https://github.com/deepseek-ai/deepseek-harness/discussions/4755)
- [rc.2 local sandbox probes](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/sandbox/sandbox-local/src/index.ts)
- [rc.2 Windows subprocess termination](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/subprocess/subprocess-local/src/spawn.ts)
- [rc.2 asynchronous Zstandard frame encoder](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/session/session-persistence-jsonl/src/zstd.ts)
- [Node.js diagnostic report API](https://nodejs.org/api/process.html#processreportwritereportfilename-err)
- [Microsoft Sysinternals ProcDump](https://learn.microsoft.com/en-us/sysinternals/downloads/procdump)
- [Microsoft: analyze a user-mode dump with WinDbg](https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/analyzing-a-user-mode-dump-file)
