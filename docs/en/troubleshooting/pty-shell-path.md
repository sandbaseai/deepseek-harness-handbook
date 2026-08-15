---
title: DeepSeek Harness PTY Shell Path on NixOS and Minimal Linux
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-15
---

# Fix `PTY shell exited during startup` when `/bin/bash` does not exist

The persistent Bash tool and the one-shot Bash tool use different execution paths. On a minimal Agent preset, the persistent tool opens an interactive PTY through `@deepseek-ai/dsh-terminal-bash`. Its default executable is the absolute path `/bin/bash`.

NixOS, minimal containers, and other non-FHS environments may provide Bash elsewhere. When `/bin/bash` is absent, the PTY can exit during startup even though `bash` is available on `PATH`.

## Confirm the failing boundary

Run these checks in the same host or container that runs Harness:

```sh
test -x /bin/bash && echo /bin/bash-present || echo /bin/bash-missing
command -v bash
"$(command -v bash)" --noprofile --norc -c 'printf "bash-ok\n"'
```

Interpret the result:

| Evidence | Meaning |
|---|---|
| `/bin/bash` missing, discovered Bash succeeds | configure the persistent terminal backend with the discovered absolute path |
| both paths fail | install Bash or fix the execution environment before changing Harness |
| one-shot `bash` works but persistent Bash fails | inspect `terminal-bash`, not the model-facing `tool-bash` row |
| configured path starts but the PTY still exits | preserve stderr and inspect sandbox, arguments, cwd, and readiness separately |

Do not use `process.env.SHELL` without checking it. The terminal backend supplies Bash-specific arguments, `PROMPT_COMMAND`, and prompt readiness behavior; a path to zsh, fish, or another shell is not an equivalent replacement.

## Configure the owning row

The relevant row is `terminal-bash`, not `tool-bash` or `persistent-bash`:

```yaml
- id: terminal-bash
  name: '@deepseek-ai/dsh-terminal-bash'
  config:
    shellPath: /run/current-system/sw/bin/bash
    timeoutMs: 300000
```

Replace the example with the exact absolute path returned by `command -v bash`. Preserve every other config field already present in the row.

## Do not edit the shipped preset

Agent presets are full compositions. Create a user-owned copy before changing one:

1. Open **Settings → Agent presets**.
2. Duplicate the preset that exposes the failing persistent Bash tool.
3. Give the copy a new lowercase identifier.
4. Open its folder from the settings row.
5. Add `shellPath` to the existing `terminal-bash` row in `agent.cordis.yml`.
6. Return to the preset list and confirm the copy is not marked **Failed to load**.
7. Create a new session on that preset and run `printf 'pty-ok\n'`.

User-authored presets normally live under:

```text
$DSH_HOME/.agent-presets/<preset-id>/agent.cordis.yml
```

A running session keeps the preset generation it already joined. Test the edited composition in a new session rather than expecting an existing PTY session to change executable.

## Why a profile-level `tool-bash` patch is insufficient

In the Web composition, the host-level one-shot `tool-bash` row is disabled and Agent presets supply their own model-facing tools. The persistent Bash path is owned inside the preset by this chain:

```mermaid
flowchart LR
  A[persistent-bash tool] --> B[terminals service]
  B --> C[terminal-bash backend]
  C --> D[subprocess PTY]
  D --> E[configured Bash executable]
```

Changing a top-level `tool-bash` row neither changes `terminal-bash.shellPath` nor rewrites a shipped preset. Configure the backend in a user-owned preset.

## Success evidence

Collect all of these before treating the workaround as complete:

```text
Resolved Bash path is absolute and executable.
Custom preset is listed without a broken reason.
A new session selects the custom preset.
The first persistent Bash call prints expected output.
A second call preserves shell state when persistence is expected.
```

If the second call loses state, the PTY startup problem is solved but the session may be using the one-shot Bash tool instead of `tool-bash-persistent`.

## Official sources

- [Persistent terminal Bash config and `/bin/bash` default](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/terminal/terminal-bash/src/config.ts)
- [Executable passed to the subprocess PTY](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/terminal/terminal-bash/src/index.ts)
- [Minimal preset persistent shell composition](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/apps/cli/config/agent-presets/minimal/agent.cordis.yml)
- [Agent preset copy, generation, and user-root contract](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/preset/agent-presets/README.md)
- [NixOS startup failure report](https://github.com/deepseek-ai/deepseek-harness/discussions/1913)
