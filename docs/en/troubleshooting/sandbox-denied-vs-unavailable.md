---
title: DeepSeek Harness Sandbox Denied, Unavailable, or Invalid Escalation
locale: en
content_revision: 4
status: canonical
verified_at: 2026-08-28
verified_upstream: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Sandbox denial, `SANDBOX_UNAVAILABLE`, or invalid escalation

Four failures that mention sandboxing require different actions:

| Signal | Meaning | Did the requested effect run? |
|---|---|---|
| file-access denial marker | an active sandbox blocked a forbidden file effect | attempted inside the boundary; denied |
| `SANDBOX_UNAVAILABLE` | no usable backend could enforce the confined policy | no; failed closed |
| `sandbox escalation ... is not strictly wider` | the call asked for an invalid same-or-narrower one-shot mode | no; rejected before approval or execution |
| ordinary command/file error | the effect reached its executor and failed normally | possibly; inspect operation evidence |

Do not handle all four by switching to Full Access. First identify the call's effective mode and whether the model supplied escalation arguments.

## When macOS says `spawn sandbox-exec ENOENT`

An executable lookup that succeeds in the host shell does not prove that the Harness sandbox runner can start. In report [#4849](https://github.com/deepseek-ai/deepseek-harness/discussions/4849), macOS could resolve `/usr/bin/sandbox-exec`, and Node could spawn that absolute path directly, while both the default `sandbox-exec` command and the `dsh-sandbox-local` Seatbelt implementation still returned `spawn ... ENOENT` from the Bash tool. Classify this as a **runner-start or environment-bridge failure**, not as a file-access denial and not as evidence that the requested command ran.

Capture these facts before changing the permission preset:

1. the exact executable path and the Harness/Node versions;
2. a host-side `command -v sandbox-exec` plus a minimal Node spawn of the bare and absolute paths;
3. the selected sandbox provider and its resolved executable path; and
4. whether an ordinary unsandboxed control is permitted in a disposable Session.

If the host controls work but the provider path fails, preserve the failed call and report the provider/environment boundary. Do not “repair” it by silently running the original command with Full Access: an unavailable backend must fail closed until the provider can prove an enforcing start.

## The mode order

For filesystem authority, rc.2 defines one strict order:

```text
read-only < workspace-write < danger-full-access
```

| Mode | Filesystem effect |
|---|---|
| `read-only` | deny writes except backend-required sinks such as `/dev/null` |
| `workspace-write` | allow writes under the canonical workspace and promised temp area |
| `danger-full-access` | bypass confinement and run against Host process authority |

These modes govern filesystem effects. They do not claim to isolate network access or process visibility. `danger-full-access` is an explicit bypass, not a sandbox profile with more rules.

## What `sandbox_permissions` means

`sandbox_permissions` is not a declaration of the current policy and not a normal argument to include on every write. It asks for a **one-call escalation** after the ordinary call needs a wider filesystem mode.

| Effective mode | Valid requested modes |
|---|---|
| `read-only` | `workspace-write`, `danger-full-access` |
| `workspace-write` | `danger-full-access` |
| `danger-full-access` | none |

The request must include a non-empty `justification`, an approval service and Agent must be available, and the exact request must be approved before execution. A same-mode request is intentionally rejected:

```text
sandbox escalation to "danger-full-access" is not strictly wider than this call's current "danger-full-access" mode
```

This proves that escalation validation ran before the file or command effect. It does **not** prove that Full Access itself denied the operation.

## Why the field can still appear in the schema

At rc.2, tool producers advertise escalation fields when the mounted filesystem or shell executor has a confining default. The effective mode can then differ per Session. The closed schema may therefore still show `workspace-write` and `danger-full-access` while one Session is already in Full Access.

Execution-time validation is authoritative: the selected value must be strictly wider than that call's effective mode. Schema visibility is not an instruction to always populate the field.

## Diagnose a non-widening request

1. Preserve the failed tool-call arguments and exact error.
2. Record the Session's effective permission preset and the call's resolved sandbox mode.
3. Check whether the arguments contain both `sandbox_permissions` and `justification`.
4. Determine what produced them: model output, SDK/client transformation, plugin wrapper, or a manually constructed call.
5. Retry the same ordinary operation **without both escalation fields** only when evidence shows the rejected call never ran.
6. If the ordinary call then fails, classify that result independently as denial, unavailable backend, or normal operation failure.

For a Full Access Session, the expected ordinary call shape is:

```json
{"path":"relative/path.txt","content":"example"}
```

It is not:

```json
{"path":"relative/path.txt","content":"example","sandbox_permissions":"danger-full-access","justification":"Use the already active mode"}
```

Do not automatically strip fields inside the executor and continue. Rejecting malformed authority requests keeps the audit trail truthful and prevents a client or model bug from becoming silent privilege behavior.

## Evaluate the proposed no-op behavior without weakening real escalation

Report #4763 observes a systematic producer failure: under a Full Access Session, a model reflexively fills the registry-global `sandbox_permissions` and `justification` fields on nearly every Bash, PowerShell, write, and edit call. Because `danger-full-access` has no wider mode, those calls can never represent a useful escalation and fail before their ordinary effect.

The proposal is to treat two shapes as no-ops:

1. any requested target when the effective mode is already `danger-full-access`; and
2. a requested mode equal to the effective confined mode.

This can improve liveness without granting additional authority, but it changes malformed authority input from fail-closed error to ordinary execution. Treat it as a versioned compatibility policy, not as a self-evidently neutral parser cleanup.

The current call order matters. `validateEscalationArgs()` runs before `approveEscalation()` at tool call sites. A blank `justification` can therefore fail before a no-op decision implemented only inside `approveEscalation()` is reached. A complete patch must define which layer recognizes a no-op pair and whether it consumes both fields before pairing and sentence validation.

### Required decision table

| Effective mode | Requested mode | Justification | Proposed result |
|---|---|---|---|
| `danger-full-access` | `workspace-write` | absent, blank, or nonblank | ignore pair; execute once at standing Full Access |
| `danger-full-access` | `danger-full-access` | absent, blank, or nonblank | ignore pair; execute once at standing Full Access |
| `workspace-write` | `workspace-write` | paired according to chosen policy | ignore pair; execute once at standing Workspace Write |
| `workspace-write` | `danger-full-access` | nonblank | preserve strict widening, approval, and one-call grant |
| `read-only` | `workspace-write` or `danger-full-access` | nonblank | preserve strict widening, approval, and one-call grant |
| any confined mode | unknown, narrower, or malformed request | any | fail closed with no effect |
| invalid effective mode | any | any | fail closed; never reinterpret as Full Access |

Ignoring `workspace-write` while already in Full Access must not downgrade the call or report that a sandbox ran. It means “use the standing mode,” not “honor the requested target.” Likewise, a same-mode no-op must not emit approval events, create a one-call grant, or change durable Session policy.

### Evidence and regression gates

- preserve the raw received call arguments in bounded audit evidence before normalization;
- emit an observable compatibility marker or counter for ignored no-op escalation fields;
- exercise Bash, PowerShell, write, and edit through the shared decision path;
- prove each ordinary effect executes exactly once and returns its normal result;
- prove no approval prompt/event is created for a no-op;
- prove every genuinely wider request still validates a non-empty sentence before approval;
- prove denied, cancelled, unavailable, and agent-less approval outcomes remain fail closed;
- prove an unknown effective mode never falls through to unconstrained execution;
- keep registry-global schema behavior compatible with a narrower per-Session override; and
- test models/clients that omit the optional fields as the unchanged control.

An alternative upstream design is to make tool presentation Session-aware and hide impossible targets before model generation. That reduces malformed calls but changes tool-schema identity across Sessions and can affect provider prefix caching. It is a separate tradeoff from execution-time no-op compatibility.

## Diagnose denial versus unavailable backend

1. Record the resolved mode and canonical workspace root for the call.
2. Identify the selected platform backend: Linux bwrap/Landlock, macOS Seatbelt, or Windows ACL restricted token.
3. Distinguish the backend's denial signature from a runner-start failure.
4. If the error is `SANDBOX_UNAVAILABLE`, fix or install a usable backend—do not retry unconfined.
5. If an allowed path was denied, verify canonical-path and symlink resolution before changing policy.
6. If the mode is unexpectedly Full Access, inspect Session overrides, permission-preset events, and deployment defaults.

## Full versus partial enforcement

Backends report `full` or `partial`. Partial means an active backend cannot enforce every promised file boundary on that host or kernel. Callers requiring an absolute boundary must reject partial enforcement or surface it clearly; they must not silently treat it as full.

## Regression matrix

| Effective mode | Call shape | Expected outcome |
|---|---|---|
| `read-only` | ordinary read | execute under confinement |
| `read-only` | ordinary write | denial with bounded escalation guidance |
| `read-only` | request `workspace-write` + justification | approval, then one-call retry if granted |
| `workspace-write` | in-root ordinary write | execute under confinement |
| `workspace-write` | request `workspace-write` | reject as non-widening, no prompt, no effect |
| `workspace-write` | request `danger-full-access` + justification | approval, then one-call bypass if granted |
| `danger-full-access` | ordinary write | execute without sandbox-provider confinement |
| `danger-full-access` | request `danger-full-access` | reject as non-widening, no prompt, no effect |
| any confined mode | missing usable backend | `SANDBOX_UNAVAILABLE`, fail closed |

Approval policy `never` must not convert an invalid escalation into ordinary execution. The caller should omit escalation fields for an ordinary Full Access call.

## Safety invariants

- A confined request must either produce enforcing execution or fail closed.
- A one-call grant must be strictly wider, explicitly justified, and approved for that exact call.
- Same-mode requests must not create meaningless approval prompts.
- Removing invalid escalation fields is safe only after proving the rejected call produced no effect.
- Full Access must remain distinguishable from partial or failed confinement in results and audit evidence.

## Verification boundary

The mode order, schema behavior, strict-widening validation, and fail-closed semantics above are source-verified against DeepSeek Harness rc.2 commit [`b150a551`](https://github.com/deepseek-ai/deepseek-harness/tree/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e). A report that a client or model supplied same-mode escalation fields is runtime observation; identifying which producer inserted them requires the original tool-call evidence.

## Pinned official sources

- [Sandbox subsystem at rc.2](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/subsystems/sandbox.md)
- [Escalation validation at rc.2](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/sandbox/sandbox/src/escalation.ts)
- [Escalation unit tests at rc.2](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/sandbox/sandbox/tests/escalation.spec.ts)
- [Filesystem tool escalation contract at rc.2](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/fs/tool-fs/README.md)
- [Bash tool escalation contract at rc.2](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/shell/tool-bash/README.md)
- [Community report #4742](https://github.com/deepseek-ai/deepseek-harness/discussions/4742)
- [Full Access reflexive-field report and no-op proposal #4763](https://github.com/deepseek-ai/deepseek-harness/discussions/4763)
- [macOS `sandbox-exec` runner-start report #4849](https://github.com/deepseek-ai/deepseek-harness/discussions/4849)
