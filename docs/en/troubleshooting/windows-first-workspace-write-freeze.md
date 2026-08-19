---
title: DeepSeek Harness Windows First workspace-write Freeze
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-19
upstream_revision: 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
---

# The first Windows `workspace-write` command can freeze the Host

On native Windows with DeepSeek Harness rc.7, the first confined write for a large workspace can make every Web and RPC operation appear frozen while the requested shell command has not started. Later commands against the same workspace may begin almost immediately.

This is a one-time ACL materialization cost, not ordinary model latency.

> [!CAUTION]
> Do not repeatedly restart the Host during the first grant. Interrupting ACL propagation leaves the outcome uncertain and can force you to diagnose both an incomplete attempt and a new Host. Preserve the first timestamp and process state before intervening.

## Recognize the signature

The high-confidence pattern is:

1. the Harness Host is native `win32`;
2. the effective permission is `workspace-write`;
3. the workspace contains a wide or deep directory tree;
4. the first confined call stalls unrelated RPCs too;
5. CPU or filesystem activity belongs to the Harness process;
6. a later call on the same canonical workspace is dramatically faster.

If only one provider request is slow while Session RPC remains responsive, diagnose model latency instead. If stderr already contains a sandbox denial, the runner started and this is a different boundary. If the Minimal preset reports unsupported terminal inspection, use the [Windows Minimal Bash guide](windows-minimal-preset-bash.md).

## Why one grant blocks the control plane

The Windows sandbox derives a deterministic write SID from the canonical workspace path. On the first `workspace-write` confinement for that path, `LocalSandboxProvider.materializeAclGrant()` synchronously executes:

```ts
const grant = AclWriteGrant.create(workspaceWriteSid(workspaceRoot))
grant.add(workspaceRoot, true)
```

The standing grant carries inheritable object/container ACE flags. Applying it with `SetNamedSecurityInfoW` makes Windows propagate the ACE through descendants eagerly. The call stays on the JavaScript request path until the native operation returns.

```mermaid
flowchart LR
  U[First workspace-write call] --> C[confine request]
  C --> G[standing workspace grant]
  G --> N[SetNamedSecurityInfoW]
  N --> T[NTFS descendant propagation]
  T --> R[runner argv returned]
  R --> X[requested command starts]
```

Until `T` finishes, the Host cannot serve other JavaScript work. A terminal-spawn timeout, Session creation timeout, or frozen Web UI can therefore be a secondary symptom of the same synchronous operation.

## Why the second call is fast

The grant identity is deterministic per canonical workspace. Before changing the DACL, the ACL implementation checks whether the exact explicit ACE already exists on the root. A match skips the native apply and its eager re-propagation.

This is a standing cache across Sessions and restarts, not a per-command cache. It also explains two useful observations:

- the first use of a new or moved workspace can pay the cost again because its canonical identity changes;
- deleting the standing ACE removes the reuse benefit and makes a future call materialize it again.

Do not “clean up unknown ACLs” during diagnosis without first identifying their SID and role.

## Safe operator path on rc.7

1. Reproduce with a small disposable workspace first.
2. Keep the Host console visible and record the first-call start time.
3. Avoid choosing a drive root, home directory, dependency cache, or very large monorepo as the initial workspace.
4. Let one bounded first grant finish; do not issue concurrent retries for the same tree.
5. After completion, repeat the same harmless probe and compare elapsed time.
6. Confirm unrelated RPCs recover without restarting the Host.

For a large production tree, prepare a smaller task-specific checkout or worktree containing only the files the Agent needs. This reduces both ACL propagation breadth and the Agent's accidental write surface.

## Evidence bundle

Capture facts that distinguish ACL propagation from generic slowness:

```text
Harness version and executed commit
native process.platform / Node version
canonical workspace path
permission mode
approximate descendant count
first call start and completion timestamps
whether session.create or another RPC responds during the stall
second-call elapsed time on the same path
relevant Host stderr and process activity
```

Do not use the Web spinner alone as evidence. The decisive comparison is control-plane responsiveness during the first grant and the same-path second-call latency.

## Evaluate out-of-band grant proposals carefully

Moving DACL propagation to another process can keep the Host event loop responsive, but it changes the confinement state machine. A sound design must define what happens to the triggering tool call before the standing grant exists.

Failing closed during an in-flight grant is safer than running unconfined, but it needs an explicit “preparing workspace permission” result, bounded retry semantics, deduplication by canonical workspace, observable failure, and lifecycle cleanup. Returning a normal sandbox denial without this context can make the Agent retry aggressively and create a new loop.

Prewarming known workspaces can move the cost before interactive traffic, but it still performs the same persistent DACL mutation. It must be opt-in, path-bounded, auditable, and complete before the workspace is advertised ready.

The community implementation linked from the upstream report is an external plugin proposal, not proof of official support. Audit its package source, bundle patch, privilege boundary, failure behavior, and update policy before installing it.

## Durable upstream repair contract

A production repair should preserve these invariants:

1. the Host event loop remains responsive during first materialization;
2. no restricted child starts before the required ACE is confirmed;
3. concurrent requests for one canonical workspace share one in-flight operation;
4. failures remain fail-closed and expose a stable diagnostic;
5. completion makes the exact-ACE fast path authoritative;
6. a moved workspace receives a distinct identity;
7. shutdown does not leave an unobserved helper or promise;
8. UI and Agent receive an explicit preparing/ready/failure state;
9. standing workspace and revocable temp grants keep different lifecycles;
10. real Windows tests measure event-loop responsiveness, not only final ACL shape.

## Source evidence

- [Upstream report and proposed external implementation #3434](https://github.com/deepseek-ai/deepseek-harness/discussions/3434)
- [`materializeAclGrant()` request-path implementation](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/sandbox/sandbox-local/src/index.ts)
- [Windows ACL eager-propagation boundary](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/sandbox/sandbox-windows-acl/README.md)
- [`grantWrite` exact-ACE skip and DACL update](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/sandbox/sandbox-windows-acl/src/acl.ts)
- [Windows sandbox compatibility map](windows-compatibility.md)

