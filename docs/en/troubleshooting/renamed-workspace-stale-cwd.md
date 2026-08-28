---
title: Recover a DeepSeek Harness Session After Workspace Rename
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-29
upstream_revision: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Recover a session after the workspace was renamed

Use this runbook when a previously working Web session starts reporting `spawn bash ENOENT`, `ripgrep launch failed`, or sandbox failures after the project directory was renamed or moved outside DeepSeek Harness. Upstream discussion [#4953](https://github.com/deepseek-ai/deepseek-harness/discussions/4953) shows one stale absolute cwd being reused by several Agent tools.

## Read the symptom as a stale state boundary

The error does not necessarily mean that `bash`, `rg`, or `sandbox-exec` is missing. Compare the session’s recorded workspace with the directory that now exists:

```text
Recorded workspace / cwd:
Current workspace path:
Session and DSH revision:
Default file policy:
Tool with implicit cwd:
Tool with explicit valid path/workdir:
```

Run a harmless command with an explicit `workdir` pointing at the new directory. If that succeeds while the same command without `workdir` fails, the executable is present and the session default cwd is stale. For `glob` and `grep`, keep the search target and process cwd separate: a valid `path` does not prove that the runner’s inherited cwd is valid.

## Map the fan-out before changing permissions

One invalid absolute path can be consumed by all of these boundaries:

| Consumer | Typical symptom | What it proves |
|---|---|---|
| Bash spawn | `spawn bash ENOENT` with no `workdir` | the child process cwd may not exist |
| Glob/grep runner | ripgrep launch failure even with a valid target path | search target and spawn cwd are distinct |
| Persistent terminal | terminal cannot start or resumes in the old path | terminal state inherited the session workspace |
| `workspace-write` policy | new directory is rejected as outside the workspace | policy root still points at the old path |
| Sandbox runner | `sandbox-exec ENOENT` or an unusable-root error | runner cwd/root resolution failed before the command |

Do not jump directly to `danger-full-access`. A broader mode can hide the stale workspace binding while weakening the evidence and the file boundary.

## Preserve an evidence bundle

Keep the original session and state files unchanged while diagnosing:

```text
Session identifier:
Old workspace path and existence check:
New workspace path and access check:
First failing event/turn:
Explicit-workdir control result:
Implicit-workdir result:
glob/grep target path and result:
Persistent-terminal result:
Policy mode and denial hint:
```

Redact usernames, repository names, credentials, and full conversation content before sharing. A filesystem rename outside DSH does not produce a migration event; the old path is valuable evidence of what the session believed, not a path to edit blindly in a packed log.

## Safe recovery options

Prefer these options in order:

1. Start a new session bound to the current directory and verify the policy root before running tools.
2. If the Web UI exposes a supported workspace rebind operation, use it and confirm that the session header, policy root, terminal cwd, and storage index all change together.
3. For a disposable profile, manually migrate only through documented state-management tooling, retaining a backup and a before/after path digest.
4. Use explicit `workdir` as a temporary command-level workaround; it does not repair terminals, search runners, or `workspace-write` policy state.

Never rewrite `session.jsonl.zstd` by hand to replace a path. A text substitution can invalidate framing, leave derived indexes inconsistent, or make the Agent appear attached to a directory it is not authorized to access.

## Acceptance contract for a product fix

A durable fix should validate the default cwd at session load and before every spawn, then return a structured `WORKSPACE_NOT_FOUND` or `INVALID_CWD` diagnostic with the old path and a rebind action. After rebinding, prove all of the following without editing logs:

- bash runs without an explicit `workdir`;
- glob and grep search the new workspace;
- a persistent terminal starts in the new workspace;
- `workspace-write` permits the new root and rejects paths outside it;
- sandbox errors distinguish a missing executable from a missing cwd;
- a denial hint recommends only a genuinely wider policy mode.

The rebind must be atomic across workspace identity, session header, policy root, terminal state, and storage index. A UI-only path change is not enough if the next Agent turn still inherits the old cwd.

Primary source: [DeepSeek Harness discussion #4953](https://github.com/deepseek-ai/deepseek-harness/discussions/4953). Related recovery context: [#2914](https://github.com/deepseek-ai/deepseek-harness/discussions/2914) and [#3806](https://github.com/deepseek-ai/deepseek-harness/discussions/3806).
