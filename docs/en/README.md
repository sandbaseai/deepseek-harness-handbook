---
title: DeepSeek Harness Handbook
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-14
---

# English handbook

This is the canonical language edition. Begin with the [quickstart](getting-started/quickstart.md), then use the [agent-runtime map](architecture/agent-runtime.md) to understand why model calls, tools, sessions, and safety controls are separate parts of one Agent system.

## Featured guides

- [Choose the right CLI lifecycle](getting-started/headless-agent.md)
- [Choose a memory architecture and migration path](architecture/sessions-vs-memory.md)
- [Keep concurrent Session roots single-writer](operations/single-writer-session-roots.md)
- [Recover `spawn bash ENOENT` after a workspace moves](troubleshooting/workspace-moved-spawn-enoent.md)
- [Recover from a Windows folder-picker worker crash](troubleshooting/windows-folder-picker-worker-crash.md)
- [Diagnose DeepSeek API fetch failures behind a proxy or enterprise CA](troubleshooting/deepseek-api-fetch-failed-proxy-ca.md)
- [Add an MCP server and diagnose missing tools](troubleshooting/mcp-server-not-connecting.md)
- [Upgrade and roll back safely](getting-started/upgrade-and-rollback.md)
- [Audit community plugins before installation](security/community-plugin-audit.md)
- [Install DeepSeek Harness safely](getting-started/install-deepseek-harness.md)
- [Build your first DeepSeek Harness plugin](plugin-development/first-plugin.md)
- [What is DeepSeek Harness?](what-is-deepseek-harness.md)
- [Run the Web UI](getting-started/quickstart.md)
- [Use the Python SDK](getting-started/python-sdk.md)
- [Run a Headless Agent](getting-started/headless-agent.md)
- [Configure model providers](getting-started/model-providers.md)
- [Prevent unexpected DeepSeek API charges](security/prevent-unexpected-deepseek-api-charges.md)
- [Connect MCP servers](integrations/mcp.md)
- [Understand the tool execution pipeline](architecture/tool-execution-pipeline.md)
- [Separate durable Sessions from long-term memory](architecture/sessions-vs-memory.md)
- [Map AGENTS.md scope and precedence](agent-patterns/agents-md-scope.md)
- [Design reusable Skills](agent-patterns/skills.md)
- [Choose a Subagent strategy](agent-patterns/subagents.md)
- [Build a Repository Research Agent](recipes/repository-research-agent.md)
- [Choose a safe remote Web access topology](troubleshooting/remote-web-secure-context.md)
- [Diagnose a todo that remains in progress after the final answer](troubleshooting/todo-stuck-in-progress.md)
- [Fix a Code Mode Skill that reaches UI but not model context](troubleshooting/code-mode-skill-context.md)
- [Fix Minimal preset Bash on native Windows](troubleshooting/windows-minimal-preset-bash.md)
- [Diagnose the first Windows workspace-write freeze](troubleshooting/windows-first-workspace-write-freeze.md)
- [Run from source on a Synology NAS](getting-started/synology-nas-source-deployment.md)
- [Recover a missing question or approval card after reconnect](troubleshooting/missing-question-approval-after-reconnect.md)
- [Diagnose `Output token limit reached`](troubleshooting/output-token-limit-reached.md)
- [Recover a Git plugin missing its built export](troubleshooting/git-plugin-missing-dist.md)
- [Fix a compaction summary truncated at the token cap](troubleshooting/compaction-summary-truncated.md)
- [Diagnose plugin peer-dependency and ignored-build warnings](troubleshooting/plugin-peer-dependency-warnings.md)
- [Control response and reasoning language](troubleshooting/response-language-and-reasoning.md)
- [Recover a prompt accepted before it became durable](troubleshooting/prompt-accepted-before-durable.md)

## Learning paths

- **First run:** Web UI, model configuration, workspace selection, and safe verification.
- **Agent builder:** Agent contract, context, tools, policy, sessions, and completion.
- **Runtime engineer:** Cordis composition, capability seams, lifecycle, and extension points.
- **Operator:** troubleshooting, persistence, cancellation, sandboxing, and upstream changes.

DeepSeek Harness is in developer preview. Follow the verification metadata and primary-source links on each page.
