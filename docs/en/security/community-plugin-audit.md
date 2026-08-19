---
title: DeepSeek Harness Community Plugin Audit
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-19
upstream_revision: 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
---

# Find and install DeepSeek Harness plugins without turning discovery into trust

The DeepSeek Harness plugin ecosystem is growing through the GitHub `dsh-plugin` topic, curated lists, repository search, and Agent-facing discovery tools. Those surfaces can tell you that a package exists. They cannot prove who controls its release, what code will execute during installation, which Host capabilities it registers, or whether removal restores a known-good profile.

Treat every community plugin as a Host software supply-chain decision.

> [!CAUTION]
> Plugin package scripts run during installation with package-manager permissions. Loaded Host plugins run with the permissions of the `dsh` process. Neither boundary is contained by the Agent's tool sandbox.

## Discovery is not verification

| Signal | Useful for | Does not prove |
|---|---|---|
| `dsh-plugin` GitHub topic | finding repositories | ownership, installability, or safety |
| curated plugin list | navigation and human descriptions | reproducible review of the current release |
| stars, forks, and recency | prioritizing attention | source integrity or least privilege |
| npm download count | adoption signal | that the published tarball matches the repository |
| Agent-generated install command | reducing typing | that executing the command is appropriate |
| successful `dsh plugin add` | package-manager completion | that the profile composes or boots safely |

The official project recommends the `dsh-plugin` topic for discoverability. It does not define the topic as an official marketplace or approval boundary.

## The six-gate workflow

```mermaid
flowchart LR
  A[Discover] --> B[Resolve identity]
  B --> C[Inspect artifact]
  C --> D[Map effects]
  D --> E[Install in isolated profile]
  E --> F[Verify and decide]
  F -->|accept| G[Pin evidence]
  F -->|reject| H[Remove and restore]
```

Do not skip from discovery to installation. Each gate produces evidence needed by the next.

## Gate 1: resolve package and repository identity

For an npm candidate, read metadata without executing the package:

```sh
npm view <package>@<version> \
  name version dist.integrity dist.tarball \
  repository.url homepage license \
  scripts dependencies peerDependencies --json
```

Record:

- exact scoped or unscoped package name;
- exact version and registry integrity;
- repository URL and directory declaration;
- lifecycle scripts, especially `preinstall`, `install`, `postinstall`, `prepare`, and `prepack`;
- dependency and peer-dependency surface;
- license and maintainer identity.

Then compare the registry metadata with the repository release or commit. A README that names a package does not prove the registry package points back to that repository.

## Gate 2: inspect the artifact without running scripts

Download the exact registry artifact into a disposable directory with scripts disabled:

```sh
audit_dir=$(mktemp -d)
npm pack --ignore-scripts --pack-destination "$audit_dir" \
  <package>@<version>
tar -tf "$audit_dir"/*.tgz
```

Before extracting, confirm the archive contains only the files the package claims to ship. Then inspect at minimum:

```text
package/package.json
package/cordis.patch.yml
package entry points named by main, exports, or bin
package files referenced by dsh.bundle.patch
package lifecycle scripts and their transitive commands
```

Do not rely only on repository source. The installed object is the published tarball identified by `dist.integrity`.

For a Git dependency, pin the full commit:

```text
github:owner/repository#<full-commit-sha>
```

A Git install may execute `prepare` to build source. pnpm 10 requires an explicit `allowBuilds` decision for that script. The allowance is permission to execute package code on the Host; it is not an error to dismiss automatically.

## Gate 3: map composition and effects

A DSH bundle declares its patch in the package manifest:

```json
{
  "dsh": {
    "bundle": {
      "patch": "./cordis.patch.yml"
    }
  }
}
```

Read that patch and every inserted or overridden plugin row. Build an effect inventory:

| Boundary | Questions |
|---|---|
| services | Which `ctx.*` services are required or provided? |
| tools | Which model-facing names, schemas, and external effects are registered? |
| credentials | Which environment variables, files, settings, or OAuth flows are read? |
| filesystem | Which Host or workspace paths can be read or changed? |
| subprocess | Which commands or child processes can start? |
| network | Which hosts receive requests or user/session data? |
| UI | Which Client slots, settings, or Tool cards can be replaced? |
| persistence | Which durable Session events, databases, or files are written? |
| lifecycle | What happens on load, HMR update, disposal, failure, and restart? |

A plugin that registers a harmless-looking tool can still execute Host code during `apply()`. Review module-scope and lifecycle effects, not only the model-facing schema.

### Incident: installation can replace the Agent's world

An rc.7 report showed `@struktoai/mirage-dsh@0.0.1` changing the Web profile from Host-backed filesystem and shell providers to a Mirage workspace. Inspection of the exact public npm artifact, without running scripts, confirms that its declared bundle patch disables these existing rows:

```yaml
- id: fs-sandbox
  disabled: true
- id: bash-sandbox
  disabled: true
- id: pwsh-sandbox
  disabled: true
- id: tool-pwsh
  disabled: true
- id: tool-fs-search
  disabled: true
```

It then inserts `mirage`, `mirage-fs`, and `mirage-shell`, initially with a RAM mount at `/tmp`. The effect is not merely “three more plugins.” It substitutes the services behind filesystem and shell behavior and removes Host-native search and PowerShell from the composed graph.

This is an intentional design in the inspected artifact: comments in its published `cordis.patch.yml` explicitly describe the provider swap. The audit problem is that `dsh plugin add` automatically reconciles a dependency declaring `dsh.bundle.patch` into the profile's ordered bundle stack; a successful install does not present the resulting core-row diff as an approval boundary.

The official composer supports this behavior by design:

- profile bundles apply in manifest order over an empty root;
- a later patch targets an existing row by `id`;
- `disabled` can change independently of the row's plugin identity;
- profile and home patches apply after bundle layers;
- `--dump-config` prints both the effective tree and source-layer comments without booting plugins.

Therefore, judge the **resolved Agent capability graph**, not whether a package calls itself an extension.

## Detect capability drift before boot

Capture both the shipped bundle baseline and the current effective profile before installation:

```sh
dsh --profile plugin-lab --dump-default-config > default-before.yml
dsh --profile plugin-lab --dump-config > effective-before.yml
```

After adding one exact package, dump again **before booting the profile**:

```sh
dsh plugin --profile plugin-lab add <package>@<exact-version>
dsh --profile plugin-lab --dump-config > effective-after.yml
diff -u effective-before.yml effective-after.yml
```

Classify every changed row:

| Change | Required decision |
|---|---|
| new row | Is the new service, tool, UI, process, or network effect expected? |
| existing row disabled | Which Agent capability disappears, and on which platforms? |
| provider identity replaced | Does the same tool now address a different filesystem, shell, or trust domain? |
| existing `config` replaced | Which defaults or runtime expressions were lost? |
| row enabled | Was dormant Host code or telemetry activated? |
| source comment changes | Which package or user layer owns the final value? |

Search by stable row IDs, not only npm package names. On rc.7, a core-capability review should at least track:

```text
fs-sandbox  tool-fs  tool-fs-search
bash-sandbox  pwsh-sandbox  tool-bash  tool-pwsh
sandbox  sandbox-policy  approval
credentials  session-persistence-jsonl  attachment-local
```

Platform expressions matter. The base profile enables the Bash stack on non-Windows hosts and the PowerShell stack on Windows. A literal `disabled: true` applied later disables that row on every platform; do not infer the impact from a dump captured on only one operating system.

> [!IMPORTANT]
> Tool names can remain familiar while their backing service changes. Prove the workspace identity, path semantics, persistence, permission boundary, and subprocess environment observed by an actual disposable Agent turn.

## Gate 4: preserve a known-good profile

Before installation, capture the profile state and resolved graph:

```sh
dsh --profile plugin-lab --dump-config > before.yml
```

Preserve through version control or a dated copy outside the live profile:

```text
$DSH_HOME/profiles/plugin-lab/package.json
$DSH_HOME/profiles/plugin-lab/pnpm-lock.yaml
$DSH_HOME/profiles/plugin-lab/pnpm-workspace.yaml
$DSH_HOME/profiles/plugin-lab/cordis.patch.yml
$DSH_HOME/cordis.patch.yml
```

Never use a production profile as the first install target. Create a disposable profile and workspace with no production credentials.

## Gate 5: install one exact candidate

For an npm release whose artifact and scripts you reviewed:

```sh
dsh plugin --profile plugin-lab add <package>@<exact-version>
dsh --profile plugin-lab --dump-config > after.yml
```

For a reviewed Git commit:

```sh
dsh plugin --profile plugin-lab add \
  github:owner/repository#<full-commit-sha>
```

Compare `before.yml`, `after.yml`, the manifest, lockfile, workspace build allowances, and physical installed package. Confirm that the only new bundle layer and dependency closure are the ones you expected.

Do not boot when the diff contains an unexplained disable, provider replacement, credential source, network destination, or loss of a sandbox/approval row. Removal is safer than stacking an emergency override whose row configuration you have not reconstructed completely:

```sh
dsh plugin --profile plugin-lab remove <package>
dsh --profile plugin-lab --dump-config > effective-removed.yml
diff -u effective-before.yml effective-removed.yml
```

Install one plugin at a time. Otherwise the first failed boot cannot be attributed reliably.

## Gate 6: verify behavior and cleanup

Test with a disposable workspace, limited credentials, and the narrowest permission preset compatible with the plugin's declared purpose.

Verify:

1. the profile composes before boot;
2. the plugin registers only the expected services, tools, and Client surfaces;
3. denied operations fail safely;
4. invalid configuration fails loudly;
5. network destinations match the inventory;
6. restart and HMR do not duplicate effects;
7. disposal stops processes, listeners, timers, and connections;
8. removal deletes both the dependency and bundle layer;
9. the restored profile dump matches the known-good composition.
10. filesystem and shell probes reach the intended workspace rather than a substitute mount.
11. platform-native tool availability matches the pre-install baseline.
12. approval and sandbox-denial behavior remains unchanged unless the reviewed purpose requires a documented change.

Remove the candidate with:

```sh
dsh plugin --profile plugin-lab remove <package>
dsh --profile plugin-lab --dump-config > removed.yml
```

If installation or removal failed partway, stop the profile before restoring the captured manifest and lockfile. Do not edit a live profile repeatedly until it happens to boot.

## Minimum evidence record

```text
Discovery source:
Repository URL:
Reviewed repository commit:
Package name and exact version:
Registry dist.integrity:
Published tarball inspected: yes / no
Lifecycle scripts reviewed:
dsh.bundle.patch target:
Inserted or overridden rows:
Host services and effects:
Credential and network boundaries:
Known-good profile captured:
before/after dump-config diff:
Denial and cleanup tests:
Removal result:
Reviewer and date:
```

## Red flags that stop the install

- package metadata points to a different or missing repository;
- the tarball contains unexplained executables or files absent from source review;
- install scripts download or execute unpinned remote content;
- a Git dependency requests a build allowance without a self-contained reviewed build;
- the bundle overrides unrelated core rows without explaining why;
- the install changes a core row but no pre-boot effective-config diff was reviewed;
- familiar tool names now resolve to a different filesystem or shell trust domain without explicit operator approval;
- credentials are requested through chat, committed config, or undocumented files;
- network destinations are dynamic, hidden, or broader than the feature requires;
- removal, disposal, or rollback behavior is absent;
- the author treats stars, curation, or successful installation as a security review.

## Official sources

- [Official discovery guidance for the `dsh-plugin` topic](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/README.md)
- [Official CLI plugin-management contract](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/apps/cli/reference/README.md#plugin-management)
- [Official package and install tutorial](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/docs/user/develop/basic/publish.md)
- [Official plugins and lifecycle guide](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/docs/user/develop/framework/index.md)
- [Official profile layer and row replacement contract](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/docs/architecture.md)
- [Official config-dump implementation](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/apps/cli/src/dump-config.ts)
- [Official base filesystem and shell rows](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/bundle/base/cordis.patch.yml)
- [Published Mirage bundle patch at the inspected release](https://unpkg.com/@struktoai/mirage-dsh@0.0.1/cordis.patch.yml)
- [Core-provider replacement report #3421](https://github.com/deepseek-ai/deepseek-harness/discussions/3421)
