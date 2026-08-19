---
title: Fix DeepSeek Harness Session Hard-Link Failures
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
---

# Fix Session persistence when the filesystem cannot create hard links

On POSIX platforms, DeepSeek Harness rc.7 publishes the first durable Session log with `link(temp, final)` and then removes the temporary name. A filesystem or execution environment that refuses hard links can fail the first flush with an error such as:

```text
EACCES: permission denied, link
.../session.jsonl.zstd.<random>.tmp
-> .../session.jsonl.zstd
```

This is not a pnpm package-store failure and not a Zstandard decode failure. The temporary file was written and synced; publication of the first committed log failed.

> [!CAUTION]
> Do not replace the call with ordinary POSIX `rename()` as a production workaround. The current hard link is the no-overwrite commit primitive: two processes racing to materialize the same Session ID cannot silently replace each other.

## What the hard link guarantees

```mermaid
flowchart LR
  A[Write sibling temp<br>exclusive create] --> B[fsync temp]
  B --> C[link temp → final<br>fails if final exists]
  C --> D[fsync directory]
  D --> E[unlink temp]
```

The design provides three properties:

1. **Complete-before-visible:** the final directory entry appears only after the complete header and first event batch are written and synced.
2. **No overwrite:** `link()` returns `EEXIST` when the final path already exists.
3. **Crash durability:** the parent directory is synced after publication.

The temporary and final names briefly refer to the same inode. That aliasing is a means to achieve atomic, no-clobber publication; it is not the long-term storage model.

## Confirm the failing boundary

Use the exact Session directory shown in the error. Before changing the deployment, record:

```sh
node --version
dsh --version
printf 'DSH_HOME=%s\n' "${DSH_HOME:-$HOME/.dsh}"
mount | rg '(/storage|\.dsh|sessions)'
```

Then run a harmless capability probe in a new directory on the same filesystem:

```sh
probe_root="${DSH_HOME:-$HOME/.dsh}/hardlink-probe"
mkdir -p "$probe_root"
printf 'probe\n' > "$probe_root/source"
ln "$probe_root/source" "$probe_root/alias"
ls -li "$probe_root/source" "$probe_root/alias"
```

Success shows the same inode number and a link count of at least two. Failure with `EACCES`, `EPERM`, `EOPNOTSUPP`, `ENOTSUP`, or a platform-specific permission message confirms that this location cannot satisfy the rc.7 publication contract.

Remove only the probe directory after confirming its exact path:

```sh
rm "$probe_root/alias" "$probe_root/source"
rmdir "$probe_root"
```

Do not probe inside a real Session directory; a stray file there can confuse incident evidence and future layout checks.

## Immediate response

1. Stop sending new prompts to the affected process.
2. Preserve the exact error, Session ID, profile, `DSH_HOME`, mount type, and runtime version.
3. Copy any still-visible final answer or user prompt from the UI before shutdown; the first durable Session log may not exist.
4. Stop every Web, headless, SDK, or supervised process using the same Session root.
5. Verify that no process still has the old root open before migrating state.

The failed POSIX path removes its unpublished temporary file in `finally`. A missing final `session.jsonl.zstd` therefore does not imply a hidden recoverable temp remains. Do not manufacture a Session log from fragments without validating the header, sequence, and compression frames.

## Safe recovery A: move the Harness home

Choose a local filesystem that supports same-filesystem hard links, file and directory `fsync`, exclusive file creation, and normal POSIX rename semantics. Test it with the probe above first.

With every writer stopped:

```sh
old_home="${DSH_HOME:-$HOME/.dsh}"
new_home="/local-durable-storage/dsh-home"
mkdir -p "$new_home"
cp -a "$old_home/." "$new_home/"
DSH_HOME="$new_home" dsh --profile web --dump-config > /tmp/dsh-effective.yml
```

Inspect the dump and confirm `session-persistence-jsonl.config.root` resolves under the new home. Start one disposable Session, append one bounded turn, stop cleanly, and prove that its log survives restart before moving production traffic.

Do not run the old and new homes concurrently. Session roots are single-writer even on a fully capable filesystem.

## Safe recovery B: move only the Session root

If profiles, credentials, and settings must remain in the original Harness home, override the persistence row in `$DSH_HOME/cordis.patch.yml`:

```yaml
- id: session-persistence-jsonl
  config:
    root: /local-durable-storage/dsh-sessions
```

Stop every writer before copying existing Session directories. Preserve ownership, permissions, timestamps, and exact names:

```sh
mkdir -p /local-durable-storage/dsh-sessions
cp -a "${DSH_HOME:-$HOME/.dsh}/sessions/." /local-durable-storage/dsh-sessions/
dsh --profile web --dump-config > /tmp/dsh-effective.yml
```

Verify that the effective row points to the new root. Keep the old root read-only as a rollback snapshot until listing, loading, appending, restart, and rollback tests pass.

This override changes Session persistence only. Attachments, settings, credentials, profiles, and other state may still live under `DSH_HOME`; inventory them separately if the original filesystem has broader durability limitations.

## Why the obvious fallbacks are not equivalent

| Candidate | No overwrite | Complete-before-visible | Crash-durable directory entry | rc.7-equivalent? |
|---|---:|---:|---:|---:|
| `link(temp, final)` | yes | yes | yes after directory fsync | baseline |
| POSIX `rename(temp, final)` | no; replaces existing final | yes | yes after directory fsync | no |
| `copyFile(temp, final, COPYFILE_EXCL)` | yes | not guaranteed; final exists during copy | requires extra file + directory sync | no |
| open final with `wx`, then write | yes | no; partial final is visible | requires careful sync | no |
| process-local mutex + rename | only within one process | yes | possible | no across processes |

A durable upstream fallback needs a cross-process no-clobber protocol, atomic visibility to readers, directory durability, cleanup after every failure point, and tests on filesystems that reject `link()`. “The Session ID is probably unique” is not a substitute: collision defense is an explicit storage invariant.

## Acceptance gates for an upstream fallback

- [ ] Fallback activates only for errors proven to mean unsupported or forbidden hard links.
- [ ] A real `EACCES` caused by directory permissions is not silently bypassed.
- [ ] Two processes materializing the same Session ID yield exactly one winner.
- [ ] The loser cannot overwrite or append to the winner's log.
- [ ] Readers never observe a partial header or partial first compressed frame.
- [ ] A crash before publication leaves no final artifact.
- [ ] A crash after publication preserves a complete, discoverable log.
- [ ] File data and the parent directory entry reach the intended durability boundary.
- [ ] Temporary artifacts are cleaned without deleting a committed log.
- [ ] Raw JSONL and Zstandard modes preserve the same semantics.
- [ ] Existing logs remain append-only after restart and repair.
- [ ] The test matrix includes HarmonyOS-like storage, network filesystems, containers, and ordinary local POSIX filesystems.

## Route similar errors correctly

| Symptom | First boundary |
|---|---|
| `link ...tmp -> session.jsonl.zstd` on first flush | POSIX Session materialization |
| `rename` failure while saving `settings.yaml` | generic atomic replacement, not Session publication |
| pnpm reports package import or store link failure | package-manager installation topology |
| append fails after a Session log already exists | append/fsync/space/permission path, not first publication |
| `EEXIST` for the final Session log | same-ID collision or stale existing artifact; load/resume instead of overwriting |
| Zstandard checksum or frame error on load | committed-log integrity and recovery path |

## Primary sources

- [Official discussion #3444: filesystem cannot create hard links](https://github.com/deepseek-ai/deepseek-harness/discussions/3444)
- [rc.7 POSIX Session materialization implementation](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/session/session-persistence-jsonl/src/index.ts#L527-L568)
- [rc.7 JSONL persistence durability contract](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/session/session-persistence-jsonl/README.md#durability-and-crash-semantics)
- [rc.7 base-bundle Session root](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/bundle/base/cordis.patch.yml#L98-L102)
- [Live Session log durability guide](live-session-log-durability.md)
- [Single-writer Session topology](../operations/single-writer-session-roots.md)

