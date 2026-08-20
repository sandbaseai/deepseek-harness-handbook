---
title: Design Shared Dependency Caches for DeepSeek Harness workspace-write
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
---

# Design shared caches as explicit Agent capabilities

Use this guide when repeated DeepSeek Harness workspaces cannot reuse npm, pnpm, pip, Cargo, Go, or other dependency caches under `workspace-write`.

The tempting fix is an arbitrary list of extra writable Host paths. That makes installation faster, but it also lets one untrusted workspace persist bytes that a different workspace may later parse, link, import, execute, or trust. A shared cache is a cross-workspace write capability, not merely a performance setting.

## Establish the rc.8 boundary

In rc.8, `SandboxExecutionPolicy` carries only `mode`, `workspaceRoot`, and optional `sessionId`. The shared canonical-root function derives these write roots for `workspace-write`:

```text
session workspace
/tmp
os.tmpdir()
```

`SandboxPolicyService.Config` exposes `mode` and fallback `workspaceRoot`; it has no extra writable-root or cache-resource field. The filesystem sandbox and macOS Seatbelt profile consume the shared root derivation. Bubblewrap, Landlock, and Windows ACL use backend-specific grant mechanics, so changing one root array is not proof of cross-platform enforcement parity.

Do not tell users to add a nonexistent `extraWritableRoots` key. Do not switch an Agent to `danger-full-access` only to make package downloads reusable.

## Classify what the toolchain directory contains

| Path or concept | Often contains | Safe default |
|---|---|---|
| npm download cache | content-addressed responses and metadata | dedicated namespaced resource after integrity tests |
| pnpm store | package content, indexes, import/link state | exact pnpm/OS/architecture namespace; treat lifecycle scripts separately |
| pip cache | wheels, HTTP responses, locally built artifacts | separate downloaded versus locally built provenance |
| Go module cache | downloaded module source and VCS state | immutable/download-oriented namespace where possible |
| Cargo registry/cache | crates and indexes | separate from `CARGO_HOME/bin` and credentials |
| whole `~/.cache` | unrelated applications and mutable state | never the default grant |
| whole `~/.config`, `~/.npm`, `~/.cargo` | tokens, config, hooks, executables | do not mount as a generic writable cache |

Package managers are not passive readers. Install scripts, build hooks, native artifacts, symlinks, and executable bins can convert cached bytes into later code execution.

## Prefer a named cache resource

A durable design should model intent rather than accepting arbitrary host write roots:

```yaml
sandbox:
  caches:
    - id: npm-downloads
      hostPath: /var/cache/dsh/npm
      mountPath: /cache/npm
      sharing: profile
      mode: read-write
      quotaBytes: 10737418240
```

The profile then injects only the matching toolchain variable:

```text
npm_config_cache=/cache/npm
```

This is a proposed contract, not an rc.8 configuration. A cache resource needs at least:

- a stable id and explicit Host path;
- a sandbox-visible mount path that does not reveal unrelated Host layout;
- sharing scope such as Session, workspace, profile, or deployment;
- read-only versus read-write mode;
- toolchain/version/OS/architecture namespace;
- quota, expiry, cleanup, and corruption recovery;
- concurrency semantics and a single owner for destructive maintenance.

## Define the trust and sharing matrix

| Producer → consumer | Default decision |
|---|---|
| same Session → same Session | private cache is normally acceptable |
| same workspace → later Session | acceptable after workspace trust and toolchain identity are stable |
| different trusted workspaces in one profile | explicit opt-in with integrity and concurrency controls |
| untrusted workspace → trusted workspace | deny shared writable reuse by default |
| one profile → another profile | separate namespace unless policy explicitly joins their trust domains |
| Agent → human shell | never assume cached executables or hooks are safe to run |

Content-addressed storage reduces accidental duplication; it does not by itself prevent index poisoning, mutable metadata, malicious lifecycle scripts, or substitution before verification.

## Validate the path before every grant

At configuration admission:

1. require an absolute Host path and absolute sandbox mount path;
2. create the intended directory through a privileged, audited owner before canonicalization;
3. reject the workspace parent, filesystem root, DSH home, credential roots, SSH/GPG/keychain state, and tool executable directories;
4. reject overlaps between cache resources with incompatible sharing or modes;
5. record the canonical identity and the expected owner/permissions.

At runner startup, reopen or re-resolve the resource through a race-resistant mechanism and recheck containment. A path that was safe during config parsing can be replaced with a symlink before mount or ACL materialization.

## Prove every backend independently

The policy meaning must survive each enforcement dialect:

- bubblewrap: explicit bind/mount visibility and mount flags;
- Landlock: ruleset rights and kernel ABI coverage;
- Seatbelt: canonical subpath filters and `/tmp` alias behavior;
- Windows ACL/restricted token: capability SID grant, inheritance, cleanup, and stale ACE behavior;
- in-process filesystem tools: canonical containment identical to process tools.

An in-process `write` success does not prove Bash can write. A Bash success does not prove the directory is invisible outside the intended mount. Windows ACL success does not prove the grant disappears when required.

## Bounded operational choices today

Until an explicit cache-resource contract ships:

1. keep package-manager caches inside the current workspace when reuse is only needed within one project;
2. use `/tmp` for disposable, non-authoritative caching whose loss is acceptable;
3. prebuild dependencies or a container/image layer outside the Agent boundary and present reviewed artifacts read-only;
4. run a trusted, separately administered artifact proxy and retain normal package integrity verification;
5. use a purpose-built outer sandbox or CI cache owner when cross-workspace persistence is required.

Do not place credentials in transferred stores, build caches, environment captures, or Agent-visible cache metadata.

## Acceptance gates

- Cache configuration grants no arbitrary additional Host root.
- The cache path cannot contain or parent DSH state, credentials, or tool executables.
- The sandbox-visible path exposes only the named resource.
- Cache write succeeds; adjacent and parent writes fail.
- Symlink and mount-point substitution attempts fail closed.
- `read-only` mode does not become writable because a cache exists.
- Session, workspace, profile, and deployment sharing behave exactly as declared.
- Two concurrent writers follow a tested lock/atomic-publication contract.
- Corrupt entries can be quarantined without deleting unrelated state.
- Quota and expiry cannot delete a live writer's authoritative input.
- bwrap, Landlock, Seatbelt, Windows ACL, and filesystem-tool paths have real enforcement tests.
- Disabling the cache returns to a private or disposable fallback without widening permissions.

## Source boundary

Verified against DeepSeek Harness rc.8 commit `141eb6fef83422698aef7a981029e843e8161534`. rc.8 has no public extra-root or cache-resource field; the YAML above is a safer proposed design, not a supported command.

- [Upstream shared-cache request #3527](https://github.com/deepseek-ai/deepseek-harness/discussions/3527)
- [rc.8 writable-root derivation](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/sandbox/sandbox/src/roots.ts)
- [rc.8 sandbox policy service](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/sandbox/sandbox-policy/src/index.ts)
- [rc.8 sandbox execution-policy type](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/sandbox/sandbox/src/index.ts)
- [Code Mode trust-boundary guide](code-mode-worker-trust-boundary.md)
