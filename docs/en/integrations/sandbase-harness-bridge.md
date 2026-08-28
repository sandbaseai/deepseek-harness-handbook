---
title: Run SandBase Harness through DeepSeek Harness
locale: en
status: reviewed
verified_at: 2026-08-29
sources:
  - https://github.com/sandbaseai/sandbase-harness/tree/37a95c3
  - https://github.com/deepseek-ai/deepseek-harness/tree/cd5ef8148158c3a752a658978873241fdf8e2bbc
---

# Run SandBase Harness through DeepSeek Harness

SandBase Harness is a local-first Agent runtime with sessions, sandboxes, memory, credentials, audit trails, and a Console. Its repository ships a DeepSeek Harness stdio MCP bridge. This guide keeps the two runtime boundaries visible.

## Runtime boundary

DeepSeek Harness owns the Agent turn, profile composition, approvals, and tool policy. SandBase Harness owns its API, persistent Agent/Session state, sandbox, and credential boundaries. The bridge is the transport seam:

```text
DeepSeek Harness profile -> stdio MCP bridge -> MANAGED_AGENTS_URL -> SandBase Harness API
```

The bridge does not make an arbitrary endpoint trustworthy. Treat URL, credentials, and reachable tools as explicit threat-model inputs.

## Bounded local setup

Use a tagged source checkout and a disposable DSH profile. The SandBase README currently documents `v0.3.7`; verify the tag and Node requirement before repeating it.

```bash
git clone --branch v0.3.7 --depth 1 https://github.com/sandbaseai/sandbase-harness.git
cd sandbase-harness && npm ci && npm run build
mkdir ../my-agents && cd ../my-agents
node ../sandbase-harness/dist/index.js init
node ../sandbase-harness/dist/index.js start
export MANAGED_AGENTS_URL=http://127.0.0.1:3000
dsh plugin --profile web add -w ../sandbase-harness
dsh web
```

Keep the API on loopback while probing. Do not replace the explicit checkout with an unscoped package or a package without the expected DSH bundle contract.

## Probe and evidence

1. List `mcp__sandbase__*` tools and record schemas.
2. Create a harmless test Agent and short Session without production credentials.
3. Confirm Console and DSH show the same Session ID and terminal state.
4. Stop the test Session from DSH and confirm downstream settlement.
5. Remove the profile layer and verify the base profile still boots.

Keep the SandBase tag, DSH revision, URL, tool names, approvals, Session IDs, and removal result. A successful call alone does not prove cancellation, replay, or credential safety.

## Permission checklist and rollback

- Bind to `127.0.0.1` until remote access is authenticated.
- Review bridge schemas before enabling write, credential, file, or sandbox operations.
- Keep credentials in SandBase's vault, never in prompts or committed profiles.
- Confirm whether the downstream sandbox is local, Docker, Kubernetes, or a worker before sending files.
- Pin both repositories and repeat the harmless probe after upgrades.

To roll back, stop SandBase, remove the out-of-tree profile layer, and boot the copied baseline profile. Restore its snapshot if it no longer starts; do not delete shared DSH state.

## Sources

- [SandBase Harness README and DSH bridge](https://github.com/sandbaseai/sandbase-harness/tree/37a95c3)
- [DeepSeek Harness first-plugin guide](../plugin-development/first-plugin.md)
- [Community plugin audit](../security/community-plugin-audit.md)
