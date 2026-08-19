---
title: DeepSeek Harness CLI and Headless Agent
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-19
upstream_revision: 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
---

# Use the DeepSeek Harness CLI without inventing a TUI

The shipped `dsh` command is a **profile launcher**, not an interactive terminal chat. DeepSeek Harness rc.7 ships two auto-initialized product profiles:

- `web` starts the browser interface;
- `headless` runs one task in one fresh persisted Session, prints the last non-empty assistant text, and exits.

A community terminal UI can be installed as another profile, but it owns its own command grammar, continuation behavior, trust boundary, and compatibility contract. Do not describe `headless` as an official TUI.

## Pick the command by lifecycle

| Goal | Command | Lifecycle |
|---|---|---|
| Inspect a composition without booting it | `dsh --profile web --dump-config` | print and exit |
| Work interactively in a browser | `dsh web` | long-lived Host |
| Run one automation task | `dsh --profile headless "task"` | one fresh Session, then exit |
| Add or remove profile bundles | `dsh plugin --profile <name> <pnpm args>` | mutate profile dependencies |
| Use a terminal chat | install and audit a compatible community profile | provider-defined |

The current working directory becomes the default workspace root for every mode. Choose it before launch; a prompt cannot move the Session to a safer repository after creation.

## First headless run

Open a disposable checkout at the exact directory the Agent may inspect:

```sh
npx @deepseek-ai/dsh@0.1.0-rc.7 --profile headless \
  "Inspect this repository. Do not edit files. Run read-only checks and report failures with file evidence."
```

On first use, the shipped `headless` template initializes under the active DSH home. The process mounts the base plus headless bundles, creates a fresh persisted Agent, submits the positional task as a user message, waits for quiescence, flushes the Session, prints the final text to stdout, and exits.

It does **not** mount the Host API, HTTP server, Web runtime, or browser client, and it opens no listening port.

## Understand stdout, stderr, and exit status

| Channel | rc.7 contract |
|---|---|
| stdout | Last non-empty assistant text from the owned run interval, followed by a newline |
| stderr | Empty on success; terminal Agent error code/message or boot diagnostics on failure |
| exit 0 | Final durable `turn/end` reason is `completed` |
| exit 1 | Final reason is not completed, or the direct runner fails |
| exit 130 | First SIGINT after an ordinary live run starts graceful shutdown |

Exit zero proves the Agent turn completed under its runtime contract. It does not prove a requested file, deployment, test, or external effect exists. Verify the world separately.

## A CI wrapper that preserves evidence

```sh
result_file="${RUNNER_TEMP}/dsh-result.txt"
error_file="${RUNNER_TEMP}/dsh-error.txt"

if npx @deepseek-ai/dsh@0.1.0-rc.7 --profile headless \
  "Review the current changes. Do not edit files. Report correctness risks with file paths." \
  >"$result_file" 2>"$error_file"; then
  test -s "$result_file"
else
  status=$?
  sed -n '1,120p' "$error_file" >&2
  exit "$status"
fi
```

Keep normal tests, linters, artifact checks, diffs, and deployment probes as independent gates. Treat assistant prose as review input, not a deterministic oracle.

### Approval behavior in unattended runs

The base composition contains an approval service, but the service does not prompt a terminal by itself. Missing answerers fail closed, and `approval: never` rejects without dispatch. A task that depends on an interactive grant can therefore fail or stall its plan rather than receive a hidden approval.

Before CI, inspect the resolved permission and approval rows. Prefer a task and tool surface that need no human escalation. Do not solve unattended approval by globally disabling the sandbox or granting broader Host access.

## Inspect before boot

```sh
dsh --profile headless --dump-default-config
dsh --profile headless --dump-config
```

The default dump includes shipped bundle layers only. The full dump adds profile, machine-local, and `--patch` overlays. Both preserve `!!js` expressions instead of evaluating app arguments, and neither boots the Agent.

Use the diff to answer:

- Which provider and credential sources can resolve?
- Which tool mode is active?
- Which permission and approval rules apply?
- Which persistence backend owns the fresh Session?
- Did a home-level or profile-level patch replace a complete row config?

## Launcher flags and app arguments are different

Launcher flags come first. The first unrecognized token starts the selected profile's app arguments:

```sh
dsh --profile web --port 8080
dsh --profile headless "run the tests"
dsh --profile web --help
dsh --help
```

`--port` belongs to the Web app. The task belongs to the headless app. A community TUI may define `--resume`, but that flag is not part of the shipped launcher contract.

## If you install a community TUI

Treat it as executable Host code, not a visual theme. Verify the repository, exact package tarball, publisher, license, install scripts, network destinations, persistence roots, Session compatibility, and removal path.

Use an isolated profile and DSH home first:

```sh
dsh plugin --profile tui add <reviewed-package-and-version>
dsh --profile tui --dump-config
dsh --profile tui --help
```

Do not assume it can resume Sessions created by Web or headless. Prove cold load on disposable data, then remove the plugin and prove the original profiles still start.

## Failure router

| Symptom | First boundary |
|---|---|
| `--profile <name> is required` | Launcher grammar |
| Headless says a task is required | App positional argument |
| Unknown `--resume` | Selected profile does not own that flag |
| Process exits before a turn | Composition, provider, credential, or startup |
| Agent reads the wrong repository | Invocation working directory |
| Requested effect never occurs | Approval, permission, sandbox, or tool outcome |
| Assistant text exists but CI is wrong | Missing independent evidence gate |
| Process never exits | Tool, child process, background job, or disposal quiescence |

## Official sources

- [Product CLI entry modes](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/apps/cli/README.md)
- [Exact CLI behavior reference](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/apps/cli/reference/README.md)
- [Headless bundle contract](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/bundle/headless/README.md)
- [Headless runner implementation](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/bundle/headless/src/index.ts)
- [Headless composition patch](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/bundle/headless/cordis.patch.yml)
- [Approval fail-closed contract](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/interaction/user-approval/README.md)
- [Community TUI discussion #67](https://github.com/deepseek-ai/deepseek-harness/discussions/67)
