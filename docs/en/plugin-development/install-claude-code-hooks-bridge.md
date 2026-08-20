---
title: Install the Claude Code hooks bridge out of tree
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
---

# Install the Claude Code hooks bridge without duplicating the Harness runtime

The published `@deepseek-ai/dsh-hooks-claude-code` bridge lets a DeepSeek Harness profile run a supported subset of command hooks from Claude Code `hooks.json`. An out-of-tree profile can fail at boot with:

```text
Cannot find package '@deepseek-ai/dsh-hook-protocol' imported from
.../profiles/<profile>/node_modules/@deepseek-ai/dsh-hooks-claude-code/lib/index.js
```

This is a package-ownership gap. The bridge declares `dsh-hook-protocol` as a peer. rc.8 profiles deliberately disable automatic peer installation so plugins reuse the Host's single core closure. But the CLI distribution does not provide the hooks protocol through the same fallback surface, so the peer remains unresolved unless installed explicitly.

## Pin the complete hooks pair

Do not use unversioned package names. At the verification date, npm `latest` for both packages points to older `0.0.1` lines, while `next` points to `0.1.0-rc.8`. Exact versions prevent dist-tag movement and cross-line peer mismatch.

For an exact rc.8 deployment:

```bash
dsh plugin --profile headless add \
  @deepseek-ai/dsh-hooks-claude-code@0.1.0-rc.8 \
  @deepseek-ai/dsh-hook-protocol@0.1.0-rc.8
```

For rc.7, use both exact rc.7 packages instead. Do not install an rc.8 bridge into an rc.7 Host merely because both are prereleases. Capture the selected DSH executable, profile, registry, and package metadata before installation.

The protocol is an explicitly required bridge library; other runtime peers such as Agent, Tools, Session, Shell, and Cordis should continue resolving from the Host-owned fallback. Do not add the entire peer list to the profile.

## Verify the dependency topology

After installation, require:

```text
bridge exact version:
protocol exact version:
bridge peer range accepts protocol:
protocol peer ranges accept Host closure:
bridge physical realpath:
protocol physical realpath:
dsh-tools Host realpath:
dsh-tools profile realpath (must canonicalize to Host or be absent):
lockfile and package.json diff:
```

Use `pnpm why --recursive` for the bridge, protocol, and each identity-bearing core package. A working boot is insufficient: a duplicated core copy may not fail until the first tool call.

## Add the plugin row deliberately

Point `configPath` at a reviewed file. Relative paths resolve from the process launch cwd at plugin load, not from each Session workspace. One configuration applies process-wide and is parsed once; per-Session discovery and live reload are not implemented.

```yaml
- id: hooks-claude-code
  name: '@deepseek-ai/dsh-hooks-claude-code'
  config:
    configPath: /absolute/path/to/hooks.json
```

Prefer an absolute path for a service deployment. Record `pluginRoot` and `projectDir` when hook commands depend on Claude substitution variables. The hook process itself runs in the Agent Session cwd for agent-scoped points.

## Treat hooks as executable policy

The bridge executes shell-form command hooks at interception points around prompts, tools, turns, and subagents. A hooks file can read workspace data, run programs, block tool calls, inject model-visible context, and force another model step. Review it at the same trust level as a native plugin or CI script.

Keep secrets out of persisted hook output and injected context. Bound timeouts and output. Test cancellation. An unconditional blocking Stop hook can force repeated continuation because rc.8 does not yet implement the consecutive-block cap.

The bridge supports only a subset of Claude Code semantics. Unsupported events and handler types are skipped; several mapped events have partial payload/output behavior. “The file loaded” does not prove policy equivalence with Claude Code.

## Acceptance matrix

- exact bridge and protocol versions share one release line;
- installation performs no unreviewed core peer materialization;
- every identity-bearing core package resolves to one canonical instance;
- missing config is contained and visible without crashing boot;
- one supported `SessionStart` or prompt hook fires as documented;
- one `PreToolUse` decision is honored;
- a native tool and an MCP tool still execute through the Host scheduler;
- hook timeout and cancellation terminate the child process;
- injected context carries plugin provenance and contains no secret;
- unsupported events are visibly skipped rather than falsely claimed;
- restart reproduces the same dependency and hook behavior; and
- removing the bridge and protocol restores the previous composition cleanly.

## If installation created a second core closure

Stop the Host and preserve the profile manifest, patch, and lockfile. Rebuild the profile with the supported pnpm workflow and `autoInstallPeers: false`; reinstall only the exact bridge, exact protocol, and other reviewed out-of-tree plugins. Then follow the [duplicate core runtime recovery](../troubleshooting/duplicate-core-runtime-closure.md) before trusting tool execution.

## Primary evidence

- [Official out-of-tree peer report #3515](https://github.com/deepseek-ai/deepseek-harness/discussions/3515)
- [rc.8 bridge package manifest](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/hooks/hooks-claude-code/package.json)
- [rc.8 protocol package manifest](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/hooks/hook-protocol/package.json)
- [rc.8 bridge behavior and limitations](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/hooks/hooks-claude-code/README.md)
- [rc.8 profile peer/fallback design](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/boot/app-boot/src/profile.ts)

