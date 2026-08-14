---
title: DeepSeek Harness Sandbox Denied vs Unavailable
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-14
---

# Sandbox denial versus `SANDBOX_UNAVAILABLE`

These failures mean different things:

- **denial:** the sandbox ran and blocked a forbidden file effect;
- **sandbox unavailable:** no usable backend could enforce the requested confined policy, so the call failed closed;
- **ordinary command failure:** the command ran inside the boundary and returned an error of its own.

## Check the requested mode

| Mode | Filesystem effect |
|---|---|
| `read-only` | deny writes except required backend sinks such as `/dev/null` |
| `workspace-write` | allow writes under the workspace and promised temp area |
| `danger-full-access` | bypass confinement and run the original command |

These modes govern filesystem effects. They do not claim to isolate network access or process visibility.

## Full versus partial enforcement

Backends report `full` or `partial`. Partial means an active backend cannot enforce every promised file boundary on that host or kernel. Callers requiring an absolute boundary must reject partial enforcement or surface it clearly; they must not silently treat it as full.

## Diagnosis

1. Record the resolved mode and canonical workspace root for the call.
2. Identify the selected platform backend: Linux bwrap/Landlock, macOS Seatbelt, or Windows ACL restricted token.
3. Distinguish the backend's denial signature from a runner-start failure.
4. If the error is `SANDBOX_UNAVAILABLE`, fix or install a usable backend—do not retry unconfined.
5. If the mode is unexpectedly `danger-full-access`, inspect session overrides, approved retry mode, and deployment default.

## Safety invariant

A confined request must either produce enforcing argv or fail closed. Silent passthrough without confinement is not a valid recovery path.

## Official sources

- [Process Sandbox subsystem](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/sandbox.md)
- [Local sandbox provider](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/sandbox/sandbox-local)
