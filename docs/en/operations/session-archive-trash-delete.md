---
title: Archive, Trash, and Delete DeepSeek Harness Sessions Safely
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-27
upstream_ref: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
sources:
  - https://github.com/deepseek-ai/deepseek-harness/discussions/2613
---

# Archive, trash, and delete Sessions safely

DeepSeek Harness currently supports **archiving**, not physical Session deletion or unarchive. Archive through the running Host when you only want a Session hidden. Treat trash, restore, cache cleanup, and permanent deletion as offline storage migrations until the official persistence contract grows a deletion API.

The official discussion on the missing unarchive path (#2613) is a useful compatibility check: if a UI appears to restore an archived Session, verify whether it is editing internal storage rather than calling a supported Host operation. Keep the original log and record the storage mutation before attempting recovery.

This guide is pinned to upstream commit [`b150a55`](https://github.com/deepseek-ai/deepseek-harness/tree/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e) (`0.1.1-rc.2`) and responds to [official discussion #4716](https://github.com/deepseek-ai/deepseek-harness/discussions/4716). The standalone manager discussed there fills a real UI gap, but its live file-mutation claims cross contracts the official runtime does not expose.

## Choose the operation before touching storage

| Intent | Safe current route | What remains durable |
|---|---|---|
| Hide an old Session | Call the official `workspace.archiveSession` RPC while the Host is running | Session log, workspace membership, archive state |
| Back up a Session | Export through the Session-log service, including descendants or images when required | Portable export plus the original log |
| Reclaim disk temporarily | Stop every writer, snapshot the whole DSH root, then move one verified artifact to a no-overwrite trash generation | Snapshot, manifest, trash artifact |
| Restore a trashed Session | Keep every writer stopped; refuse an existing ID; restore the exact artifact and verify its header | Original immutable header and event log |
| Permanently purge | Apply a retention delay, prove backup restore, then purge offline | Nothing in the primary root; backup follows its own retention |

Archive is a domain operation. It is serialized through the workspace registry and publishes the full `archivedSessionIds` snapshot. It hides the Session from grouping surfaces without deleting its log or removing its workspace slot. Editing `workspace.json` directly bypasses that operation queue.

## Why “not the current Session” is not enough

The JSONL persistence backend permits **one live writer per Session**. The selected browser tab or most recently modified directory is not an ownership lease: background Sessions, another Host, an SDK process, or a second profile pointed at the same root can still own a writer.

The official backend coordinates append, repair, batching, flush, and disposal inside its owning process. A second process must not write or move that Session until the owner reaches quiescent disposal. Therefore a cleanup tool must fail closed when it cannot prove all users of the storage root are stopped.

Do not rely on process-name searches alone. Wrapper launchers, renamed executables, containers, services, remote mounts, and permission failures all produce false negatives. An uncertain detector means **do not mutate**.

## Understand the three stores

### 1. Session logs are authoritative

The current layout is:

```text
<session-root>/
  --<normalized-cwd>--/
    <encoded-session-id>/
      session.jsonl.zstd
```

The first logical record is an immutable `SessionHeader`; later records form an append-only, contiguous event stream. Compression may instead be `none`, producing `session.jsonl`. The configured encoding and root are part of the deployment contract.

Never reconstruct the original `cwd` by reversing the project directory name. Separator replacement and truncation are intentionally lossy. Read and validate the header through the official backend; two different paths may normalize to the same directory.

### 2. The projection cache is derived

`session_projcache` stores fold checkpoints, not Session authority. Its records are versioned, identity-bound, possibly stale, and discarded on mismatch. The log leads; the cache follows. A missed cache write costs a longer replay and is designed to self-heal.

Do not make cache surgery part of a first deletion design. Deleting rows while a Host is alive races background writes; deleting the wrong row is unnecessary work; retaining a stale row is safe because lifecycle identity validation rejects it.

### 3. Workspace state is coordinated domain data

`workspace.json` is not merely a disposable index. It owns workspace ordering, membership, and the global archive set. Direct multi-file edits can leave the log move complete while registry mutation fails, or let a live Host overwrite the external change.

Use the official archive RPC for online hiding. Since rc.2 has no deletion or unarchive API, a general-purpose external tool cannot promise a version-independent transaction across this domain.

## A defensible offline trash protocol

### Phase A: freeze and inventory

1. Record the exact DSH version, profile, Session root, storage root, and encoding.
2. Stop every Web, headless, SDK, desktop, service, and background process using either root.
3. Verify quiescence from the service manager and open-handle view, not only a process-name substring.
4. Read the target through the official persistence backend. Match requested ID, header ID, header `cwd`, and derived artifact path.
5. Decide whether descendants and referenced media are independent retention units. Export them first when the backup must be portable.

### Phase B: snapshot before mutation

Create a restorable snapshot of the **whole coordinated root set**, not just one transcript. Record filesystem identity, byte counts, and digests. Test the restore procedure on a separate root before calling the snapshot a backup.

Keep prompts, tool results, credentials, and file contents out of logs and manifests sent to telemetry. A digest and opaque Session ID are usually enough for reconciliation.

### Phase C: publish one trash generation

Never map a Session to one reusable `.trash/<id>` directory. A second deletion must not erase the first recovery point. Use a unique generation such as:

```text
.trash/<encoded-id>/<UTC timestamp>-<random nonce>/
  artifact/
  manifest.json
```

The manifest should include:

- Session ID and immutable header digest
- original artifact path relative to the validated root
- encoding, size, content digest, and filesystem identity
- trash generation ID, creation time, and retention deadline
- tool version and pinned DSH version
- transaction state and crash-recovery instruction

Publish with no-overwrite semantics. On one filesystem, rename the artifact and sync both parent directories. Across filesystems, copy to a private staging path, sync, verify the digest, publish without replacement, sync again, and only then remove the source. Persist a small transaction journal so restart can distinguish copying, published, and source-removed states.

### Phase D: restart and prove

Restart one Host against the same roots and prove:

1. healthy boot with no storage-identity or registry error;
2. remaining Sessions list and replay correctly;
3. the trashed ID is absent from persistence discovery;
4. projection-cache misses refold from authoritative logs;
5. archive snapshots and workspace grouping remain internally consistent.

If stale workspace accounting is unacceptable, stop here and wait for an upstream deletion contract. Inventing a workspace record or decoding a lossy directory name into `cwd` can make the UI look repaired while binding the Session to the wrong project.

## Restore without merging histories

Restore is another offline transaction:

1. Stop and re-prove every writer is quiescent.
2. Verify the trash manifest, artifact digest, immutable header, and DSH format version.
3. Refuse restoration if the destination ID or artifact already exists anywhere in the Session root.
4. Restore to the exact validated original path with no-overwrite publication.
5. Do not concatenate, merge, or renumber two logs with the same ID.
6. Restart and load the Session through the official backend; let projections self-heal.
7. Keep the trash generation until the restored Session has passed replay and a new snapshot exists.

An unarchive operation is not present in rc.2. Direct removal from `archivedSessionIds` may appear to work today, but it is an internal-storage edit, not a supported compatibility contract.

## Review checklist for standalone managers

Before using or shipping a community Session manager, require all of these:

- [ ] It pins and checks supported DSH versions and storage encodings.
- [ ] Writer detection fails closed and covers every process sharing the roots.
- [ ] It never treats “not selected” or “not most recent” as proof of quiescence.
- [ ] It validates the Session header instead of decoding the lossy project directory.
- [ ] Archive uses the official Host RPC while online.
- [ ] Physical mutation is disabled while any Host can write.
- [ ] A whole-root snapshot is verified before the first destructive step.
- [ ] Every trash operation creates a unique no-overwrite generation.
- [ ] Cross-device moves use staged copy, sync, digest verification, and a crash journal.
- [ ] An existing Session ID makes restore fail; histories are never merged.
- [ ] Projection-cache cleanup is optional and never treated as authoritative deletion.
- [ ] Workspace changes are version-pinned, offline, transactional, and independently recoverable.
- [ ] Partial failure is surfaced with an exact recovery state.
- [ ] Descendant Sessions and referenced media have an explicit policy.
- [ ] Windows open handles, antivirus, sync clients, and network filesystems are tested.
- [ ] Purge has retention, authorization, audit, and tested-backup gates.
- [ ] “Secure erase” is not promised for SSD, copy-on-write, snapshot, or cloud storage.
- [ ] A second delete/restore cycle proves idempotence and preserves the first generation.

## Practical recommendation for rc.2

Use official Archive when the goal is decluttering. Export before risky maintenance. If disk reclamation is mandatory, stop all Hosts, snapshot the complete root set, move only a header-validated artifact into a unique trash generation, and accept that current workspace accounting has no official delete transaction. Do not trade recoverability for a cleaner sidebar.

## Primary sources

- [Session persistence JSONL contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/session/session-persistence-jsonl/README.md)
- [Projection cache contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/session/session-projection-cache/README.md)
- [Workspace registry implementation](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/workspace/workspace/src/index.ts)
- [API proxy Session archive contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/host/apiproxy/README.md)
- [Current UI workspace limitations](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-workspace/README.md)
- [Standalone manager discussion #4716](https://github.com/deepseek-ai/deepseek-harness/discussions/4716)
