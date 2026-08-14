---
title: DeepSeek Harness Quickstart
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-14
---

# DeepSeek Harness quickstart: first useful agent run

This path starts the official Web UI, connects a model, limits the first task to a known workspace, and gives you observable evidence that the harness is working.

> [!WARNING]
> DeepSeek Harness is in developer preview. Run the first task in a disposable repository, do not paste secrets into chat, and read every approval request before accepting it.

## 1. Start the Web UI

Install a current Node.js release, open a terminal in the repository you want the agent to inspect, then run:

```sh
npx @deepseek-ai/dsh web
```

The default address is `http://127.0.0.1:3080`. Keep the terminal open: its logs are the first place to look when the browser cannot connect.

## 2. Configure a model

Open **Settings → Models**, add the API key for your provider, and save. DeepSeek is the direct path; the official provider guide also documents other providers and custom OpenAI-compatible endpoints.

Use an environment-specific key with a spending limit. Never commit it to the repository or include it in a bug report.

## 3. Choose the workspace

Select **Choose workspace**, add the directory where you started `dsh`, then select it. A new UI intentionally leaves the workspace unset; the composer remains unavailable until you choose one.

For the first run, use a small test repository. The agent may be able to read and edit files, run commands, delegate work, and maintain a plan depending on the active configuration.

## 4. Run a bounded task

Start a session and send:

> Inspect this repository without changing files. Summarize its purpose, list its main packages, and cite the files that support each conclusion.

This prompt gives the agent a clear objective, an explicit no-write boundary, and a verifiable result.

## 5. Verify the run

A successful first run has all four signals:

- the browser receives a streamed response;
- the answer refers to real files in the selected workspace;
- the session remains visible after the response finishes;
- no write or command approval was silently granted.

If the UI loads but the task fails, separate the layers before changing anything:

| Symptom | Check first |
|---|---|
| Browser cannot connect | terminal process and printed URL |
| Composer is disabled | selected workspace |
| Authentication/provider error | model route and API key |
| Tool denied | active permission and approval policy |
| Wrong files appear | selected workspace and launch directory |

## Inspect the actual composition

The Web UI is a profile, not the whole runtime. Print the resolved Cordis tree with:

```sh
npx @deepseek-ai/dsh --profile web --dump-config
```

This is the fastest way to see which bundles, services, tools, and policy layers your machine actually boots.

## Run from source

Use this path when contributing upstream or inspecting packages:

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

Package-manager installs execute code from the repository. Review the project, use a disposable environment, and pin the upstream revision for repeatable work.

## Next

- [Understand the agent runtime](../architecture/agent-runtime.md)
- [Follow one complete turn](../architecture/agent-lifecycle.md)
- [Troubleshoot by symptom](../troubleshooting/README.md)

## Official sources

- [DeepSeek Harness README](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.md)
- [Official Web UI guide](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/index.md)
- [Official provider guide](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/providers.md)
