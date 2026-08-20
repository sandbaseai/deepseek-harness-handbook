---
title: Fix CJK Stalls in DeepSeek Harness Persistent Bash
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-20
---

# Fix CJK stalls in persistent Bash

Use this runbook when a DeepSeek Harness persistent `bash` call containing Chinese, Japanese, Korean, accented, or other non-ASCII text waits for the complete tool timeout and then resets its shell.

Do not assume every non-ASCII timeout has the same cause. Two upstream reproductions cross the PTY boundary differently:

| Evidence after submission | Likely boundary |
|---|---|
| completion listing, `Display all ... possibilities?`, a mangled command, or a bare `>` continuation prompt | interactive readline is interpreting UTF-8 bytes as Meta key bindings because the child has no UTF-8 locale |
| literal non-ASCII becomes replacement punctuation before the completion marker | command serialization or one-write PTY transport corruption |
| command output appears complete, but the unique end marker never arrives | wrapper, prompt, or marker detection; inspect separately |

Increasing `timeoutMs` preserves all three failures. The deadline is where the Harness gives up, not where the bytes first become wrong.

## Prove the locale/readline branch

In rc.8, `terminal-bash` starts `/bin/bash --noprofile --norc -i`. Its terminal-specific environment sets `TERM`, pager controls, prompt markers, and DSH identifiers, but it does not set `LANG` or `LC_*`. The subprocess layer supplies a scrubbed ambient base, so a GUI-launched host can leave the interactive child in the C locale.

Readline is active because Bash is interactive. Under a non-UTF-8 locale, high-bit bytes can select Meta bindings instead of forming one character. The exact UTF-8 byte sequence determines the binding, which explains why many CJK commands work while a few apparently random commands wait for 300 seconds.

Collect evidence without sending another CJK command through the affected path:

```bash
locale
printf 'LANG=%s LC_ALL=%s\n' "${LANG-}" "${LC_ALL-}"
printf 'charmap='; locale charmap 2>/dev/null || true
/bin/bash --version | sed -n '1p'
```

Then inspect the failed call tail. A completion menu or PS2 `>` prompt strongly supports the readline branch. A healthy model response time and a cluster of calls ending at exactly the configured terminal timeout rule out model latency, but do not alone prove the byte mechanism.

## Run a bounded A/B test

Use a disposable Session and a command with no side effects:

| Variant | Expected diagnostic value |
|---|---|
| persistent interactive Bash, current environment | reproduces the failure |
| the same command through a one-shot non-interactive executor | bypasses readline |
| persistent Bash with `--noediting` | disables readline while preserving the interactive prompt contract |
| persistent Bash under a verified UTF-8 locale | makes readline decode multibyte characters as characters |

Test more than one CJK string. One passing command is weak evidence because only some byte sequences map to a blocking readline action.

## Apply the narrow user workaround

For a Bash terminal row in a user-owned Agent preset, explicitly disable line editing:

```yaml
- id: terminal-bash
  name: '@deepseek-ai/dsh-terminal-bash'
  config:
    timeoutMs: 300000
    shellArgs: [--noprofile, --norc, --noediting, -i]
```

Create a new Session after changing the composition, then repeat the bounded matrix. Edit the actual preset loader row; a `terminal-bash:` block in `~/.dsh/settings.yaml` is not a substitute because this plugin does not register that settings namespace.

If the active profile exposes a non-persistent local Bash executor, using it for commands with non-ASCII arguments is also a bounded workaround. Do not silently switch a privileged or side-effecting task to another executor without rechecking its sandbox and approval policy.

## Separate transport corruption

If literal CJK is visibly replaced or damaged but there is no readline prompt or completion evidence, retain the earlier PTY transport hypothesis. Compare:

```text
literal UTF-8 submitted through persistent Bash
ASCII-only command that generates the same UTF-8 bytes inside Bash
the same literal argument through one-shot bash -c
```

If only the literal persistent input changes, preserve the exact submitted bytes, rendered terminal tail, Bash version, and marker state. Do not claim that `--noediting` fixes this branch until the A/B result proves it.

## Durable repair boundary

The runtime should make its programmatic interactive shell deterministic:

1. provide an explicit UTF-8 locale when the host environment does not provide one, or expose a validated per-terminal environment contract;
2. consider `--noediting` for the default programmatically driven Bash, because no human uses readline editing in this PTY;
3. preserve the controlled OSC prompt marker, cancellation, sandbox, and cleanup contracts;
4. test locale absence and multiple high-bit byte patterns, not only one friendly Chinese string.

Transport escaping remains a separate repair boundary. Encoding non-ASCII command bytes as reviewed ASCII escapes can avoid a PTY input defect, but it must preserve quoting, newlines, exit status, and secrets and must not be presented as the locale fix.

## Regression gates

- An empty host `LANG` and `LC_*` cannot put the shipped persistent Bash into a C-locale readline trap.
- Multiple CJK, accented Latin, emoji, and mixed-script inputs round-trip exactly.
- `--noediting` retains prompt readiness and OSC completion detection.
- Quotes, backslashes, newlines, and carriage returns retain their meaning.
- Exit status, cancellation, deadline, and shell reset behavior remain intact.
- One-shot and persistent execution retain their distinct approval and sandbox policies.
- A failed command never exposes secrets in terminal diagnostics.
- Linux, macOS, Bash 3.2, and a current Bash are covered independently.

## Source boundary

Verified against DeepSeek Harness `0.1.0-rc.8` commit `141eb6fef83422698aef7a981029e843e8161534`. The rc.8 Bash terminal still defaults to an interactive profile-free shell and its terminal-specific environment has no locale variable.

- [C-locale readline reproduction #3522](https://github.com/deepseek-ai/deepseek-harness/discussions/3522)
- [Earlier PTY corruption reproduction #3391](https://github.com/deepseek-ai/deepseek-harness/discussions/3391)
- [rc.8 child environment and terminal spawn](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/terminal/terminal-bash/src/index.ts)
- [rc.8 Bash argument defaults](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/terminal/terminal-bash/src/config.ts)
- [rc.8 persistent command wrapper](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/shell/tool-bash-persistent/src/index.ts)
- [rc.8 local PTY send lifecycle](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/terminal/terminal-bash/src/session.ts)
