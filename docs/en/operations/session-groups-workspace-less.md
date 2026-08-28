---
title: Design Session Groups Without Inventing a Workspace
locale: en
content_revision: 5
status: canonical
verified_at: 2026-08-27
upstream_ref: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Design Session groups without inventing a Workspace

DeepSeek Harness rc.2 already groups Sessions by registered Workspace. A request for custom grouping and “workspace-less chats” asks for two different capabilities: mutable navigation metadata and an explicit execution mode. Do not make a folder label silently choose a filesystem root, sandbox, or tool authority.

> [!IMPORTANT]
> This is a design response to upstream discussion [#4721](https://github.com/deepseek-ai/deepseek-harness/discussions/4721), not documentation of a shipped custom-group feature. Current behavior below is verified at commit `b150a55`; the proposed contracts are recommendations.

Discussion #4765 restates four concrete operator gaps: ungrouped Sessions cannot be moved into a Workspace, Sessions under another Workspace are not globally discoverable, the UI has no delete action, and there is no cross-Workspace management view. They share a navigation surface, but they do not share one safe mutation.

## Map each UX gap to its owning contract

| Requested action | Current gap | Safe product boundary | Unsafe shortcut |
|---|---|---|---|
| show an ungrouped Session under another label | no mutable navigation membership | Session Collection referencing the same `SessionId` | rewrite `SessionHeader.cwd` or fabricate Workspace membership |
| execute against a different directory | immutable per-Session `cwd` | fork into a new rooted Session, or add a versioned execution-root event honored by every tool | bypass `attachSession` cwd validation |
| find Sessions across Workspaces | Workspace-scoped tree has no global search | paginated global Session index with Workspace, archive, Collection, and access filters | scan filenames and infer cwd from lossy directory names |
| remove a Session from the sidebar | archive exists; delete/unarchive do not | online archive now; future authenticated trash/delete API with writer coordination | delete `.jsonl` or `.jsonl.zstd` while a Host may own it |

The rejected `attachSession` call is valuable evidence: current Workspace accounting requires the Session's immutable `cwd` to match the Workspace path. Adding a “manual override” flag would not merely move a row. It would either lie about accounting or silently change which filesystem a historical Session can affect.

### Global discovery contract

An **All Sessions** view should query the running Host, not walk storage filenames in the browser or a companion script. Each row needs at least:

```text
SessionId / title / created and updated time
recorded cwd or explicit no-Workspace profile
registered Workspace match, if any
Collection membership, if supported
archive state
top-level / fork / subagent lineage class
storage health and loadability, without prompt contents
```

Pagination and search must define visibility across archive state, Workspace access, remote Hosts, profiles, and storage roots. A global index for one Host is not automatically a global index for every machine or credential domain.

### Keep projection values JSON-safe before publishing list events

An otherwise valid new Session can disappear from the list when a plugin writes an explicit `undefined` into a projection cache. Upstream discussion [#4915](https://github.com/deepseek-ai/deepseek-harness/discussions/4915) records this failure in `dsh-context`: the list path trusted a `SessionProjectionValue` cast, then lossless JSON validation rejected the `api-session/added` event before the first request had populated every optional field.

Treat projection caches as an untrusted boundary. Before emitting a list event:

1. validate against the actual `JsonValue` schema, not a TypeScript cast;
2. omit absent optional fields or encode them with an explicit nullable/absent representation;
3. reject the whole projection update with a typed diagnostic if a plugin value is not serializable;
4. preserve the durable Session header so a failed projection can be rebuilt without losing the Session.

The regression should create a Session, install the projection plugin, publish it before the first model request, and assert that the list contains the Session. Repeat with a populated optional field, a deliberately invalid value, a cold restart, and a rebuild from the durable source. A missing row is a projection/serialization incident—not evidence that the Session was never created—and widening the JSON schema to accept arbitrary values only hides the boundary.

Moving a row from this view into a Collection is presentation-only. Choosing **Use another folder** should instead create a new rooted Session (with an explicit lineage link) until the runtime ships a replay-safe execution-root event.

### Delete UX contract

A context-menu **Delete** button cannot safely be a thin wrapper around filesystem removal. It must distinguish:

- **Archive**: online, reversible visibility change supported by rc.2;
- **Trash**: recoverable removal requiring writer quiescence, unique generation, manifest, and restore conflict handling; and
- **Purge**: delayed irreversible retention action after tested backup and authorization.

Until Host APIs own trash, restore, and purge, the UI should offer Archive and a clearly scoped export—not pretend manual file deletion is a supported Session transaction. See the related archive/trash guide for the full storage protocol.

## Start with the shipped boundary

| rc.2 object | Stable meaning | Current behavior |
|---|---|---|
| `SessionHeader.id` | Session identity | immutable, independent of presentation |
| `SessionHeader.cwd` | absolute working directory at creation, if any | used by filesystem and bash-relative execution |
| `Workspace` | durable registration for one canonical existing directory | supplies a real group, title, order, and Session accounting |
| `Ungrouped` | browser bucket, not an execution capability | contains Sessions outside registered Workspace accounts |
| archive set | registry-global visibility state | hides Sessions without deleting logs or Workspace accounting |

The rc.2 browser builds one group per Host Workspace and a trailing `Ungrouped` bucket. Deleting a Workspace removes only its registration; its Session logs remain and appear under `Ungrouped`. That is useful evidence that membership and retention are already separable. It is **not** evidence that an ungrouped Session is safe to execute without a `cwd`.

## Split the request into two products

### 1. Session Collections

A Collection answers: “Where should this conversation appear in navigation?” It is mutable presentation metadata.

It must not change:

- `SessionId`, fork lineage, or subagent ancestry;
- `SessionHeader.cwd` or Workspace accounting;
- sandbox mode, permission grants, or tool availability;
- model, provider, preset, context, or retention;
- archive state or durable Session log contents.

Use “Collection” in the contract even if the UI label is “Group.” The name prevents confusion with the existing Workspace-backed `GroupNode` projection.

```ts
interface SessionCollection {
  id: CollectionId
  title: string
  orderKey: string
  revision: number
  createdAt: string
  updatedAt: string
}

interface CollectionMembership {
  sessionId: SessionId
  collectionId?: CollectionId // absent means No collection
  revision: number
}
```

Start with at most one Collection per top-level Session. Tags and many-to-many membership add ordering, duplicate-row, filtering, and permission questions that the stated navigation problem does not require.

### 2. No-Workspace execution profiles

“No Workspace” answers: “Which capabilities may this Session use without a selected project directory?” This is an execution contract, not a sidebar bucket.

Offer explicit profiles rather than an implicit fallback:

| Profile | Files and shell | Safe default | Lifecycle |
|---|---|---|---|
| conversation-only | unavailable | yes | ordinary Session retention |
| ephemeral sandbox | rooted in a newly allocated empty directory | only with a bounded sandbox policy | create before first tool call; expire by declared policy |
| attach-later | unavailable until the user selects a directory | yes | persist the explicit attachment event or create a new rooted Session |

Never fall back to the Host process directory, `$HOME`, `/`, the last-opened Workspace, or a directory inferred from a Collection title. Relative paths without an execution root must fail with a typed `workspace-required` result before a capability call starts.

## Keep the planes orthogonal

```text
Navigation plane                 Execution plane

Collection ──references──▶ SessionId ◀──identifies── SessionHeader
  title                         │                    cwd?
  order                         │                    lineage
  membership                    │                    preset
                                │
Archive visibility ─────────────┘        Sandbox policy + grants
                                            │
                                            ▼
                                     filesystem / bash
```

Renaming, moving, or deleting a Collection must leave the right-hand plane byte-for-byte unchanged. Changing an execution profile must never move a sidebar row as a side effect.

## Define Collection behavior

### Create and rename

- Normalize Unicode consistently and trim surrounding whitespace.
- Reject empty titles and enforce a bounded encoded length.
- Permit duplicate display titles; identity comes from `CollectionId`.
- Treat titles as untrusted text. Never render them as HTML or interpret them as paths.

### Move a Session

Use an idempotency key plus an expected membership revision. The Host commits one authoritative result and broadcasts the complete changed membership or a versioned delta.

```json
{
  "sessionId": "s-42",
  "collectionId": "c-research",
  "expectedRevision": 8,
  "idempotencyKey": "move-9d1c"
}
```

A stale tab receives `collection-conflict` with the current membership. It must refresh instead of replaying a blind last-writer move.

#### Do not confuse a Collection move with storage migration

Moving a navigation reference is a metadata mutation. Relocating an existing Session to another execution directory is a storage and authority migration. The latter is not supported by the public rc.2 Workspace interface: `attachSession` accepts a Session only when its persisted header `cwd` resolves to the same canonical directory as the Workspace.

An out-of-tree migrator that rewrites `SessionHeader.cwd` therefore needs an explicit experimental boundary. Copying only `session.jsonl.zstd`, rewriting its first line, calling internal registry methods, and deleting the old Session directory is not a safe transaction. It can race a writer, collide with an existing destination, strand Workspace accounting after a crash, discard unknown future Session-owned files, and depend on private APIs that may change without compatibility guarantees.

Before a supported migration API exists, prefer **fork into a new rooted Session**. If an operator still evaluates a cold-migration prototype, require all of these gates:

1. Prove the Session has no live writer and hold an exclusive migration lease through commit or rollback.
2. Inventory and preserve the complete Session-owned directory; treat unknown companion files as data, not garbage.
3. Create the destination with no-overwrite semantics and reject an existing Session ID or path before copying.
4. Preserve the append-oriented JSONL framing contract, or use an official persistence-layer transformation instead of fully decompressing and recompressing an unbounded log on the Host event loop.
5. Durably write and verify the destination before changing indexes; fsync files and parent directories where the platform requires it.
6. Update Session persistence and Workspace accounting through public, versioned APIs in one recoverable protocol. A private method such as `WorkspaceRegistry.indexHeader` is not a compatibility contract.
7. Cold-load the migrated Session, validate its identity, header, event sequence, and target `cwd`, then detach the old accounting entry.
8. Keep a manifest-backed backup until an independent restore test succeeds; delete the old directory only as the final committed step.
9. Inject failures after every boundary—copy, header transform, publish, index update, attach, detach, and cleanup—and verify restart recovery on POSIX and Windows.

“The decoded event lines still match” is useful but insufficient evidence. A migration test must also cover destination collision, concurrent writers, large logs with bounded memory, interrupted rename, stale indexes, unknown companion files, rollback collision, and authorization of any HTTP control endpoint.

### Delete a Collection

Deletion ungroups member Sessions atomically. It does not archive, purge, move, fork, or rewrite them. Return the affected Session IDs so clients can reconcile without guessing.

### Archive and restore

Archive is an independent visibility dimension. Preserve Collection membership while a Session is archived so restore returns it to the same navigation location. A Collection with only archived members may remain visible as empty or be hidden by a documented view rule; do not delete it implicitly.

### Forks and subagents

Do not infer membership from lineage at read time. For a user-created top-level fork, define an explicit policy—inherit the parent's Collection is the least surprising default—and persist the resulting membership. Keep subagent children out of the ordinary top-level Collection tree unless the product already exposes them there.

## Store mutable metadata outside the Session log

The rc.2 `SessionHeader` is immutable validated storage metadata and the Session event log is the durable conversation record. Collection title, order, and membership are frequently edited navigation state; placing them in the header would require a format migration, while placing every drag gesture in the conversation log would couple replay to one UI.

Use a coordinated, versioned metadata domain with:

- Collection records by stable ID;
- a deterministic Collection order;
- one optional membership per top-level Session;
- monotonically increasing revisions;
- a crash-recoverable mutation journal or atomic transaction;
- referential cleanup that ungroups rather than deletes Sessions.

The Session list remains authoritative for Session existence. A missing Session reference is pruned or quarantined during reconciliation; it must not resurrect a deleted log.

## Make no-Workspace state visible

The composer and header should show the execution profile before the first prompt:

- **Conversation only** — Files and terminal are unavailable.
- **Ephemeral sandbox** — Files expire according to the displayed policy.
- **Choose a folder** — Workspace-bound tools remain disabled until selection.

Tool discovery must match execution. Do not advertise `read`, `write`, or shell tools and then let their providers choose a backend default when `cwd` is absent. Either omit those tools from the model request or return a deterministic pre-execution refusal that the UI can explain.

If an existing Session with no `cwd` later attaches to a directory, choose one contract:

1. **Fork into a rooted Session** and preserve an explicit lineage link; or
2. add a versioned execution-root event whose replay semantics every tool honors.

The first is safer for rc.2 because `SessionHeader.cwd` is immutable and existing filesystem helpers read it directly. Mutating the header in place would violate the current storage contract.

## Migration sequence

1. Add read-only client support for an absent Collection capability.
2. Introduce capability negotiation and a versioned Collection snapshot.
3. Migrate existing Sessions to absent membership; keep Workspace grouping unchanged.
4. Add create, rename, reorder, move, and delete mutations with revision conflicts.
5. Let the browser switch between Workspace and Collection views without changing execution state.
6. Add conversation-only Sessions with workspace-bound tools omitted.
7. Add ephemeral or attach-later profiles only after lifecycle, cleanup, and replay tests pass.

Legacy peers should continue to show the Workspace tree. They may ignore Collection metadata, but they must never misinterpret it as a Workspace path.

## Failure router

| Observation | Likely boundary | Correct response |
|---|---|---|
| moving a row changes relative file behavior | Collection leaked into execution root | reject release; compare Session header and tool policy before/after |
| deleting a Collection deletes history | presentation and retention were coupled | restore logs; make deletion an atomic ungroup operation |
| two tabs bounce a Session between groups | unversioned writes | require expected revision and reconcile authoritative state |
| No-Workspace chat reads Host files | provider applied an implicit cwd | disable the tool or reject before provider resolution |
| shell is absent but filesystem tools remain | capability families diverged | derive all workspace-bound tools from one execution profile |
| attaching a folder changes an immutable header | in-place Session mutation | fork to a new rooted Session or define a versioned event contract |
| archived Session reappears under No collection | archive snapshot lost membership | preserve membership independently of visibility |
| duplicate Collection titles merge | title used as identity | key every operation and DOM row by `CollectionId` |

## Root navigation must not create ghost Sessions

Upstream discussion [#4963](https://github.com/deepseek-ai/deepseek-harness/discussions/4963) reports that opening the Web root URL creates an empty Session in the last-active Workspace. That is a navigation policy, not evidence that a user requested a new execution context. Keep the root route idempotent: either resume a clearly identified recent Session or show a picker, and only call the create path after an explicit action. If product policy intentionally creates a draft, mark it as an unstarted draft and exclude it from ordinary history, metrics, and search until the first user turn commits it. Test refresh, back/forward navigation, reconnect, and two tabs so one URL visit cannot multiply empty shells.

## Acceptance gates

- Existing rc.2 peers render the Workspace tree unchanged when Collection capability is absent.
- A new peer can switch between Workspace and Collection views without changing any Session header.
- Rename and reorder do not alter model context, cwd, sandbox, permissions, tools, lineage, or archive state.
- Duplicate Collection titles remain distinct by ID.
- Empty, oversized, malformed, and unsafe display titles fail validation.
- A move retry with the same idempotency key commits once.
- A stale expected revision returns the authoritative membership without overwriting it.
- Deleting a Collection atomically moves every member to No collection and preserves every Session log.
- Archive hides a Session while retaining its Collection membership.
- Restore returns the Session to the same Collection.
- A top-level fork follows the documented inheritance policy exactly once.
- Subagent children do not leak into the top-level tree through inherited membership.
- Conversation-only requests advertise no workspace-bound tools.
- Relative filesystem and shell calls without a root fail before reaching a provider backend.
- No path falls back to process cwd, home, root, last Workspace, or Collection title.
- Ephemeral roots are unique, canonical, sandboxed, quota-bound, and cleaned by a documented retention policy.
- Attaching a folder cannot mutate the immutable rc.2 Session header in place.
- A physical Session migration cannot overwrite an existing destination or run while any writer owns the source.
- Crash injection at every migration boundary yields exactly one loadable authoritative copy after restart.
- Migration preserves unknown Session-owned companion files and validates restore before source cleanup.
- Plugins use public Workspace and persistence contracts; private registry indexing is never treated as stable API.
- Reconnect installs one revision-consistent Collection and membership snapshot.
- Out-of-order deltas cannot roll state backward.
- A deleted or missing Session reference cannot recreate history.
- Collection labels are escaped as text and cannot become paths or markup.
- Search and pagination define whether filters intersect Collection, Workspace, and archive state.
- Metrics distinguish navigation membership from execution-profile adoption.
- Removing the feature leaves Session execution and durable history unchanged.

## Primary sources

- [rc.2 immutable `SessionHeader`, including optional `cwd`](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/core/session/src/types.ts)
- [rc.2 durable Workspace registry and Session accounting](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/workspace/workspace/src/index.ts)
- [rc.2 public Workspace contract and canonical-cwd validation](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/workspace/workspace/src/types.ts)
- [rc.2 Workspace-backed browser grouping and `Ungrouped`](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-workspace/src/client/tree.ts)
- [rc.2 filesystem resolution from per-Session `cwd`](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/fs/tool-fs/src/session-cwd.ts)
- [rc.2 Session-scoped sandbox mode](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/sandbox/sandbox-policy/src/session-mode.ts)
- [Upstream Session grouping and workspace-less request #4721](https://github.com/deepseek-ai/deepseek-harness/discussions/4721)
- [Upstream cross-Workspace discovery, move, and delete gaps #4765](https://github.com/deepseek-ai/deepseek-harness/discussions/4765)
- [Upstream root navigation creates an empty Session #4963](https://github.com/deepseek-ai/deepseek-harness/discussions/4963)

## Related handbook guides

- [Operate Session archive, trash, restore, and purge](session-archive-trash-delete.md)
- [Model multi-Session presentation contracts](../architecture/multi-session-presentation-contract.md)
- [Understand Session model and deployment-default coupling](../troubleshooting/session-model-default-coupling.md)
- [Separate sandbox denial from unavailable capabilities](../troubleshooting/sandbox-denied-vs-unavailable.md)
