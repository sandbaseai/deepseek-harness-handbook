---
title: Diagnose Read-only PowerShell Stderr Noise on Windows
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-28
sources:
  - https://github.com/deepseek-ai/deepseek-harness/discussions/4924
---

# Diagnose Read-only PowerShell Stderr Noise on Windows

Use this guide when a Windows command succeeds in DeepSeek Harness read-only mode (`exit code 0`) but emits repeated PowerShell `InvalidOperation` records on stderr. The noise is a sandbox bootstrap mismatch, not proof that the requested command failed.

## Keep the three channels separate

Record exit code, stdout, stderr, and the sandbox mode as separate fields. A successful command with two identical encoding errors is materially different from a command that returns a non-zero code.

| Evidence | Meaning |
|---|---|
| `exit code = 0` and expected stdout | The requested command completed |
| `InvalidOperation: Cannot create type...` on stderr | A restricted PowerShell preamble attempted a forbidden type construction |
| Same command in `workspace-write` has empty stderr | The command is not the source of the noise; compare language mode and preamble |
| Child reports `ConstrainedLanguage` | The ACL sandbox restriction is active, not necessarily broken |

Never discard stderr globally: first classify whether it came from the command or from the runtime's preamble.

## Reproduce with a harmless probe

Run only `node --version` or another command with deterministic output in both `read-only` and `workspace-write` profiles. Capture the exact argv, exit code, stdout, stderr, PowerShell language mode, and Harness release. Do not use a probe that writes to the workspace or prints environment secrets.

Expected diagnostic shape for the reported bug:

```text
read-only:      exit 0, stdout=v24.x, stderr=two encoding InvalidOperation records
workspace-write: exit 0, stdout=v24.x, stderr=empty
language mode:  read-only child = ConstrainedLanguage
```

This comparison establishes a boundary; it does not authorize disabling the ACL sandbox.

## Why the preamble causes it

`@deepseek-ai/dsh-pwsh-local` prepends an encoding preamble to each command. In the affected path it constructs `System.Text.UTF8Encoding` and assigns console/output encodings unconditionally. ConstrainedLanguage allows only core types, so those assignments fail before the user command starts. PowerShell then returns the preamble diagnostics alongside the command's own streams.

The intended security property is the restricted language mode. The narrow defect is executing a FullLanguage-only encoding operation inside that mode.

## Safe triage and workaround

1. Treat exit code and expected stdout as the command result; retain stderr as a separately classified runtime diagnostic.
2. Compare the same probe in a clean read-only child and a workspace-write child.
3. If a task treats any stderr as failure, route the result through a wrapper that recognizes this exact preamble signature and still requires exit code and output checks.
4. Do not switch a production task to workspace-write merely to remove the noise.
5. Do not suppress all stderr or strip the preamble without a regression test; real command errors must remain visible.

## Runtime fix and acceptance contract

A robust implementation guards encoding assignments with an exact `FullLanguage` check. FullLanguage retains the UTF-8 behavior; restricted modes leave host encoding untouched and avoid forbidden calls.

Accept the fix only when a real Windows ACL test proves all of these together:

- the child remains in `ConstrainedLanguage`;
- read/write capability boundaries retain their prior behavior;
- a successful read-only command has empty stderr;
- a genuinely failing command still exposes its own stderr and non-zero exit code.

Also run the focused argv test and the repository's documented typecheck/build gates. A macOS or unrestricted PowerShell test cannot prove the Windows ACL contract.

## Source

- [Upstream Windows read-only PowerShell report #4924](https://github.com/deepseek-ai/deepseek-harness/discussions/4924)
- [Reference fix and Windows regression test](https://github.com/ArmyWas/deepseek-harness/commit/caec78de2042bb1afd5b9e5d7a455557a05c0ec3)
