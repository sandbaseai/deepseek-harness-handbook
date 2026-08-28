---
title: Evaluate a Codex-Style DeepSeek Harness Web Client Plugin
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-29
upstream_revision: 4941
---

# Evaluate a Codex-style DeepSeek Harness Web client plugin

Use this guide when you want a denser workspace and Session workflow without replacing the DeepSeek Harness runtime. Upstream discussion [#4941](https://github.com/deepseek-ai/deepseek-harness/discussions/4941) describes `dsh-codex-ui`, an independently maintained Web client plugin from [MichengAI](https://github.com/MichengAI/dsh-codex-ui). It is a community extension, not an official DeepSeek AI product and not a Host fork.

## Keep the ownership boundary visible

The useful architectural claim is narrow: the plugin changes the client presentation through published extension points while consuming the Host’s existing workspace and Session services. It should not create a second conversation store, patch DeepSeek Harness source, or rewrite durable records. Uninstalling it should restore the default navigation.

Treat these as separate checks:

| Question | Evidence to capture |
|---|---|
| Is the package the one you intended to install? | npm package name, version, integrity, repository, and release commit |
| Does it load as a Web client plugin? | `dsh plugin --profile web --dump-config` and the loaded bundle identity |
| Does it use public extension points? | manifest and source references to sidebar, layout, locale, conversation, and settings hooks |
| Does it preserve Host-owned state? | Session file hash and workspace/Session behavior before and after install |
| Does removal restore the baseline? | clean-profile comparison after disable/uninstall and browser cache refresh |

## Install in a copied Web profile

Start with a disposable profile and a workspace that contains no private Session history. The project’s upstream example is:

```powershell
dsh plugin --profile web add @michengai/dsh-codex-ui@latest --registry=https://registry.npmjs.org/
dsh --profile web --dump-config
```

Restart the Web Host and hard-refresh the browser. Require both a mounted bundle in the configuration dump and a visible UI change. A successful package command alone does not prove that the client plugin was composed into the running Web profile.

Pin a version for any shared or production profile. Record the registry response, package integrity, DSH revision, profile name, and the exact command; `@latest` is suitable for a disposable probe, not a reproducible deployment.

## Probe the Agent-facing workflow

Use a small acceptance matrix instead of judging the screenshot:

1. Create, rename, pin, archive, fork, and delete a disposable conversation; verify the Host Session identity remains consistent.
2. Search for a workspace, Session, setting, and quick action; confirm results do not expose another user’s profile or private path.
3. Run a harmless tool call and verify running/unread state changes settle after the turn ends.
4. Navigate across turns and reload the browser; confirm the same Session resumes rather than a client-only shadow copy.
5. Disable the plugin, restart, and compare the default sidebar and Session list with the baseline.

Keep UI convenience separate from authority. A contextual menu that offers archive, fork, or delete is not proof that the operation has the same approval, authorization, or audit semantics as the Host API. Verify the underlying request and the resulting durable event where the action matters.

## Failure routing

| Symptom | Likely boundary | Next probe |
|---|---|---|
| Package installs but the default sidebar remains | profile composition or stale Web client | inspect `--dump-config`, restart the Host, and hard-refresh |
| UI appears but Sessions disappear or duplicate | client projection versus Host service | compare Session IDs and persisted records before changing storage |
| Search reveals unexpected paths or conversations | query scope or redaction boundary | use a disposable profile and inspect request parameters |
| Uninstall leaves the old UI | browser cache/service worker or incomplete removal | stop the Host, clear only the copied profile’s client cache, and reload |
| One action works in the UI but fails at the Host | presentation contract versus capability/approval contract | capture the network request and Host response; do not widen permissions |

The safe rollback is profile-scoped: disable the plugin, stop the Web Host, preserve the evidence bundle, restart with the baseline profile, and compare one known Session. Do not delete durable Sessions to make a UI discrepancy disappear.

## Source and provenance

- [Upstream discussion #4941](https://github.com/deepseek-ai/deepseek-harness/discussions/4941)
- [dsh-codex-ui repository](https://github.com/MichengAI/dsh-codex-ui)
- [DeepSeek Harness community-plugin audit](../security/community-plugin-audit.md)
- [Awesome resource entry](../ecosystem/awesome-resources.md#high-signal-community-projects)
