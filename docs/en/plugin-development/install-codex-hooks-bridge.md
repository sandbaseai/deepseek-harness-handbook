---
title: Install the Codex hooks bridge out of tree
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
---

# Install the Codex hooks bridge without duplicating the Harness runtime

The published `@deepseek-ai/dsh-hooks-codex` plugin lets a DeepSeek Harness profile run a deliberate subset of an existing Codex `hooks.json` configuration on Harness interception points. It is a compatibility bridge, not a complete Codex runtime and not permission-policy equivalence.

The bridge depends on `@deepseek-ai/dsh-hook-protocol` as a peer. Out-of-tree profiles should install that protocol explicitly while continuing to reuse Agent, Tools, Session, persistence, invariants, LLM, Shell, and Cordis from the Host-owned runtime closure.

## Pin the bridge and protocol together

At the verification date, npm `latest` points to the older `0.0.1-rc.1` family while `next` points to `0.1.0-rc.8`. Never let a moving dist-tag choose one half of the pair.

For an exact rc.8 deployment:

```bash
dsh plugin --profile headless add \
  @deepseek-ai/dsh-hooks-codex@0.1.0-rc.8 \
  @deepseek-ai/dsh-hook-protocol@0.1.0-rc.8
```

Use the same exact release line as the selected DSH Host. Keep profile peer auto-installation disabled. Installing every warned peer locally can create a second core closure whose types look compatible while scheduler, service, or event identity is split at runtime.

Record before and after:

```text
dsh executable and version:
profile name and realpath:
registry and dist-tags observed:
bridge exact version and realpath:
protocol exact version and realpath:
Host dsh-tools and cordis realpaths:
profile dsh-tools and cordis realpaths (Host-equivalent or absent):
package.json and lockfile diff:
```

## Add one reviewed process-level config

```yaml
- id: hooks-codex
  name: '@deepseek-ai/dsh-hooks-codex'
  config:
    configPath: /absolute/path/to/.codex/hooks.json
    model: deepseek-chat
    defaultTimeoutMs: 600000
    stderrSummaryMaxChars: 500
```

`configPath` is read once when the plugin loads. A relative path resolves from the process launch directory, not from each Agent Session workspace. Use an absolute path for a service deployment and restart after changing the file. A missing file, invalid JSON, or invalid regex is contained as a warning and registers no hooks; prove registration rather than treating a successful Host boot as success.

Hook commands run in the Agent Session cwd, inherit the executor environment, and receive snake_case JSON on stdin without a trailing newline. The bridge performs no Codex plugin environment injection or config-time placeholder substitution. Review commands for those assumptions before reuse.

## Know the five supported interception points

| Codex event | Harness point | Implemented effect |
|---|---|---|
| `SessionStart` | `agent/session-start` | stdout or `additionalContext` can be injected; execution is detached |
| `UserPromptSubmit` | `agent/pre-step` | exit-2 block rejects; accepted context is appended with plugin provenance |
| `PreToolUse` | `tools/pre-execute` | hook can deny; it cannot approve or rewrite input |
| `PostToolUse` | `tools/post-execute` | hook can block with feedback or add context |
| `Stop` | `agent/turn-stopping` | blocking steers the Agent into another step |

Matchers are unanchored regular expressions. Tool events match the real Harness tool name; `SessionStart` matches the Session source. `UserPromptSubmit` and `Stop` ignore matchers. Only synchronous command handlers run.

The bridge drops unsupported events: `PermissionRequest`, `PreCompact`, `PostCompact`, `SubagentStart`, and `SubagentStop`. It also skips asynchronous and non-command handlers. This matters operationally: loading a familiar hooks file does not prove that its security controls remain active.

## Treat the semantic gaps as policy gaps

- `PreToolUse` can block but does not honor pre-approval or `updatedInput`.
- Non-shell tool arguments are reduced to a `{ command }` shape rather than faithfully serialized.
- `systemMessage` and `continue: false` are not enforced as Codex would enforce them.
- `SessionStart` is detached, so slow context can miss the first request.
- A blocking `Stop` hook can force an unbounded sequence of extra model turns unless the hook self-limits.
- The configured `model` and a fixed `permission_mode: "default"` are payload labels, not proof of the active model or effective permission policy.
- Codex user, project, session, managed, and plugin config layering is not reproduced.

Do not migrate a deny rule, approval requirement, or compliance control by copying the JSON alone. Restate the intended invariant, test the exact Harness decision boundary, and keep native permission, approval, and sandbox policy authoritative.

## Minimal bounded acceptance test

Use a disposable workspace and a hook config with visible, non-secret outputs:

1. prove the bridge and protocol resolve to the pinned release line;
2. prove no local copy shadows Host-owned core packages;
3. run one `SessionStart` hook and observe source-attributed context;
4. deny one harmless tool with `PreToolUse` and verify the tool does not execute;
5. allow a different native tool and one MCP tool through the normal scheduler;
6. run one `PostToolUse` context hook and confirm its durable source is `hooks-codex`;
7. cancel a long hook and prove its child process terminates;
8. restart the Host and reproduce the same topology and decisions; and
9. remove both bridge packages and the plugin row, then prove the previous composition is restored.

Never include credentials in hook stdout, stderr, injected context, or persisted summaries. A hook is executable Host policy with workspace access, not presentation metadata.

## Primary evidence

- [rc.8 Codex bridge behavior and limitations](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/hooks/hooks-codex/README.md)
- [rc.8 Codex bridge source](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/hooks/hooks-codex/src/index.ts)
- [rc.8 Codex config parser](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/hooks/hooks-codex/src/config.ts)
- [rc.8 bridge package manifest](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/hooks/hooks-codex/package.json)
- [rc.8 protocol package manifest](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/hooks/hook-protocol/package.json)

## Related guides

- [Install the Claude Code hooks bridge](install-claude-code-hooks-bridge.md)
- [Recover a duplicated core runtime](../troubleshooting/duplicate-core-runtime-closure.md)
- [Audit a community plugin before installation](../security/community-plugin-audit.md)
