---
title: Run a DeepSeek Harness Headless Agent
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-14
---

# Run a DeepSeek Harness Headless Agent

The `headless` profile runs one non-interactive task in a fresh persisted session, prints the final assistant text, and exits. It is the simplest official surface for scripts and CI jobs that do not need a browser server.

## First run

Open a disposable checkout at the directory you want the Agent to treat as its workspace:

```sh
npx @deepseek-ai/dsh --profile headless \
  "Inspect this repository, run its read-only checks, and report failures with file evidence."
```

The invoking directory is the default workspace root. The `headless` profile auto-initializes from the shipped template on first use.

## What the command guarantees

- exactly one nonblank task is accepted;
- a fresh session is created and persisted;
- final assistant text is written to standard output;
- invalid commands, configuration errors, and boot failures exit nonzero.

Do not assume that prose in the final answer proves a side effect happened. For automation, verify files, test output, session events, or downstream state independently.

## A safer CI pattern

Start with a read-only validation task and capture the output:

```sh
result_file="${RUNNER_TEMP}/dsh-result.txt"
npx @deepseek-ai/dsh --profile headless \
  "Review the current changes. Do not edit files. Report correctness risks with file paths." \
  > "$result_file"
test -s "$result_file"
```

Treat the Agent's text as review input, not as a deterministic test oracle. Keep ordinary linters and tests as separate CI gates.

## Inspect before automating

```sh
dsh --profile headless --dump-default-config
dsh --profile headless --dump-config
```

The first command shows the shipped composition. The second shows the resolved profile after user and command-line patches. Review tools, persistence, sandbox mode, approval behavior, and credentials before granting the job access to a real repository.

## Run from an upstream checkout

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh --profile headless "summarize the package graph"
```

The upstream headless example composition includes a coding Agent with local Bash/filesystem tools, subagent delegation, workflows, TODOs, and JSONL persistence. Pin a commit when copying or patching it: the project remains in developer preview.

## Failure checklist

| Symptom | Check |
|---|---|
| command exits before a turn | CLI grammar, configuration, profile boot, credential |
| Agent reads the wrong repository | process working directory |
| task waits for human input | approval policy is unsuitable for unattended execution |
| tool writes outside expectations | resolved sandbox mode and underlying process access |
| final output exists but job is incomplete | verify external evidence, not only assistant text |
| CI never exits | tool timeout, child process, continuation, or session shutdown |

## Official sources

- [`@deepseek-ai/dsh` CLI](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/README.md)
- [Headless Agent example](https://github.com/deepseek-ai/deepseek-harness/blob/master/examples/headless-agent/README.md)
- [CLI behavior reference](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/reference/README.md)
