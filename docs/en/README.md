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

- [Diagnose why AGENTS.md loaded but did not constrain an action](agent-patterns/agents-md-scope.md)
- [Design general files and provider-native PDF/video passthrough](integrations/general-file-attachments.md)
- [Trace `ask_user_question` aborts without inventing an answer timeout](troubleshooting/ask-user-question-aborted.md)
- [Diagnose Agents calling unknown `edit` or `str_replace_editor` tools](troubleshooting/unknown-edit-tool.md)
- [Restore Settings sections clipped below a long plugin navigation](troubleshooting/settings-plugin-nav-overflow.md)
- [Design Session Collections and explicit no-Workspace execution profiles](operations/session-groups-workspace-less.md)
- [Let an execution tool declare its code-card language](plugin-development/tool-code-card-language.md)
- [Control stale pending continuable-subagent follow-ups safely](agent-patterns/subagents.md#control-stale-pending-follow-ups-without-clearing-the-inbox)
- [Bound live Session heap growth independently from model context](operations/session-heap-growth.md)
- [Route an Agent that narrates work without calling tools](troubleshooting/runaway-agent-loop.md)
- [Design a multi-Session Web presentation contract](architecture/multi-session-presentation-contract.md)
- [Extend the Web UI with a persistent Client plugin](plugin-development/persistent-web-ui-client-plugin.md)
- [Generate strict Typert artifacts for an out-of-tree plugin](plugin-development/out-of-tree-typert-generation.md)
- [Design server-to-client questions and approvals for SDK embeddings](integrations/sdk-human-interaction-wire.md)
- [Fix valid WebP images rejected by a pi-ai provider route](troubleshooting/pi-ai-image-media-type.md)
- [Fix `read_image` failing with `cannot get property "fs" without inject`](troubleshooting/read-image-fs-inject.md)
- [Diagnose manual compaction aborted by its caller signal](troubleshooting/manual-compaction-caller-abort.md)
- [Fix pnpm store drift during plugin update](troubleshooting/pnpm-unexpected-store-plugin-update.md)
- [Route OpenCode Go models by protocol and entitlement](troubleshooting/opencode-go-model-routing.md)
- [Recover Web from a Client plugin boot failure](troubleshooting/web-client-plugin-boot-failure.md)
- [Design shared dependency caches as explicit workspace-write capabilities](security/workspace-write-shared-cache.md)
- [Configure Bailian Token Plan without losing catalog compatibility](troubleshooting/bailian-token-plan-catalog-route.md)
- [Stop expired MCP sessions from driving repeated tool-call loops](troubleshooting/expired-mcp-session-loop.md)
- [Fix Web Search authentication on a custom gateway](troubleshooting/web-search-custom-gateway-auth.md)
- [Diagnose npx hanging before DeepSeek Harness starts](troubleshooting/npx-install-prompt-hangs.md)
- [Detect and recover from degenerate repeated model output](troubleshooting/degenerate-model-output.md)
- [Unbrick a profile after an invalid overlay](troubleshooting/invalid-overlay-boot-failure.md)
- [Read the Session log storage format without losing packed output](reference/session-log-storage-format.md)
- [Compare DeepSeek Harness, Claude Code, and Codex](reference/deepseek-harness-vs-coding-agents.md)
- [Choose the right CLI lifecycle](getting-started/headless-agent.md)
- [Choose a memory architecture and migration path](architecture/sessions-vs-memory.md)
- [Keep concurrent Session roots single-writer](operations/single-writer-session-roots.md)
- [Archive, trash, and delete Sessions safely](operations/session-archive-trash-delete.md)
- [Diagnose a WebView MutationObserver CPU loop](troubleshooting/webview-mutation-observer-loop.md)
- [Design RTL and mixed-script rendering](troubleshooting/rtl-mixed-text-rendering.md)
- [Recover `spawn bash ENOENT` after a workspace moves](troubleshooting/workspace-moved-spawn-enoent.md)
- [Recover from a Windows folder-picker worker crash](troubleshooting/windows-folder-picker-worker-crash.md)
- [Diagnose a Windows Web Host that listens but stops responding](troubleshooting/windows-web-event-loop-hang.md)
- [Diagnose DeepSeek API fetch failures behind a proxy or enterprise CA](troubleshooting/deepseek-api-fetch-failed-proxy-ca.md)
- [Add an MCP server and diagnose missing tools](troubleshooting/mcp-server-not-connecting.md)
- [Upgrade and roll back safely](getting-started/upgrade-and-rollback.md)
- [Audit community plugins before installation](security/community-plugin-audit.md)
- [Install DeepSeek Harness safely](getting-started/install-deepseek-harness.md)
- [Build your first DeepSeek Harness plugin](plugin-development/first-plugin.md)
- [Run subprocesses safely inside tools](plugin-development/async-subprocess-tools.md)
- [Stop a tool that will not cancel](troubleshooting/stuck-tool-cancellation.md)
- [Author tool schemas for the enforced subset](plugin-development/tool-schema-subset.md)
- [What is DeepSeek Harness?](what-is-deepseek-harness.md)
- [Run the Web UI](getting-started/quickstart.md)
- [Use the Python SDK](getting-started/python-sdk.md)
- [Run a Headless Agent](getting-started/headless-agent.md)
- [Configure model providers](getting-started/model-providers.md)
- [Track the rc.2 Files-backed image-input release](updates/README.md)
- [Prevent unexpected DeepSeek API charges](security/prevent-unexpected-deepseek-api-charges.md)
- [Connect MCP servers](integrations/mcp.md)
- [Evaluate the ACP editor-integration boundary](integrations/acp-editor-boundary.md)
- [Render ACP permission requests safely](integrations/acp-permission-request-ui.md)
- [Understand the tool execution pipeline](architecture/tool-execution-pipeline.md)
- [Separate durable Sessions from long-term memory](architecture/sessions-vs-memory.md)
- [Design reusable Skills](agent-patterns/skills.md)
- [Choose a Subagent strategy](agent-patterns/subagents.md)
- [Stop Goal rounds while owned subagents are still running](agent-patterns/goal-round-subagent-wait.md)
- [Relay human clarification for a continuable subagent](agent-patterns/subagent-human-question-relay.md)
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
- [Fix missing `dsh-client-schema-form` after npm installation](troubleshooting/missing-client-schema-form.md)
- [Control response and reasoning language](troubleshooting/response-language-and-reasoning.md)
- [Recover a prompt accepted before it became durable](troubleshooting/prompt-accepted-before-durable.md)
- [Fix Session persistence on filesystems without hard links](troubleshooting/session-hard-link-unsupported.md)
- [Recover partial multi-agent work after subagent `unknown job`](troubleshooting/subagent-unknown-job-id.md)
- [Design session-scoped MCP around the ACP boundary](integrations/acp-session-scoped-mcp.md)
- [Fix rc.8 source builds when Node tries to parse pnpm](troubleshooting/windows-standalone-pnpm-npm-execpath.md)
- [Stop console windows flashing during Windows tool calls](troubleshooting/windows-console-window-flash.md)
- [Find a corrupt package manifest blocking profile boot](troubleshooting/corrupt-package-json-profile-boot.md)
- [Fix pi-ai `server_error` overloads that are not retried](troubleshooting/pi-ai-server-error-not-retried.md)
- [Recover a conversation that updates before its start Match](troubleshooting/conversation-update-before-start.md)
- [Recover a plugin materialized after pnpm exits nonzero](troubleshooting/plugin-add-nonzero-reconcile.md)
- [Recover a silent Node 24 and tsx root build](troubleshooting/node24-tsx-silent-build.md)
- [Fix double-brace tool text breaking Code Mode prompt assembly](troubleshooting/code-mode-unknown-prompt-variable.md)
- [Fix npm ETARGET while installing rc.8](troubleshooting/npm-etarget-rc8.md)
- [Fix Session titles that stay on the fallback with reasoning models](troubleshooting/session-title-reasoning-budget.md)
- [Fix spawn subagents that drop reasoning effort](troubleshooting/spawn-subagent-reasoning-effort.md)
- [Generate an installation evidence plan with Install Doctor](tools/install-doctor.md)

## Learning paths

- **First run:** Web UI, model configuration, workspace selection, and safe verification.
- **Agent builder:** Agent contract, context, tools, policy, sessions, and completion.
- **Runtime engineer:** Cordis composition, capability seams, lifecycle, and extension points.
- **Operator:** troubleshooting, persistence, cancellation, sandboxing, and upstream changes.

DeepSeek Harness is in developer preview. Follow the verification metadata and primary-source links on each page.
