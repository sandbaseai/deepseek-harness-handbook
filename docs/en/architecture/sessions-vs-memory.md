---
title: DeepSeek Harness Sessions vs Long-Term Memory
locale: en
content_revision: 4
status: canonical
verified_at: 2026-08-27
upstream_revision: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Sessions are not long-term memory

DeepSeek Harness has durable sessions, but a durable session is not automatically a cross-session memory system. The distinction matters: session replay reconstructs one interaction; long-term memory deliberately moves selected facts across interaction boundaries.

On the verified upstream `0.1.1-rc.2` revision, the shipped composition has an event-sourced Session service, an opt-in transcript-query family, and examples for third-party memory servers through MCP. It does **not** ship a generic `ctx.memory` service. Treat proposals for such a service as design work, not as an available runtime API.

```mermaid
flowchart LR
  User["User turn"] --> Session["Append-only SessionEvent log"]
  Session --> Surface["Model-visible surface"]
  Surface --> Loop["Agent loop"]
  Loop --> Session

  Loop --> Tool["Explicit memory tool"]
  Tool --> Store["External memory provider"]
  Store --> Tool
  Tool --> Session

  Session -. "resume or fork" .-> NewLoop["Later loop"]
  Store -. "scoped recall" .-> OtherSession["Different session"]
```

## Four mechanisms, four contracts

| Mechanism | What it owns | Boundary | Model visibility |
|---|---|---|---|
| Session log | Durable events for one Agent interaction | One session and its lineage | `deriveMessages()` projects the current surface |
| Resume or fork | Reuse of a validated session log or completed prefix | Same session, or a child with lineage | Reconstructed from the selected durable events |
| Compaction | A smaller replacement surface for older balanced history | One session | Summary/checkpoint replaces only the selected model-visible range |
| Long-term memory | Selected facts, observations, or profiles | Potentially many sessions | Only when a tool or prompt-assembly policy retrieves it |

A fifth mechanism—**Skills or workspace instructions**—stores stable operating guidance. Do not put policy into semantic memory and hope retrieval happens. If an Agent must always follow a rule, mount that rule deterministically.

## Transcript search already exists, but it is opt-in

[Request #4752](https://github.com/deepseek-ai/deepseek-harness/discussions/4752) describes cross-conversation raw-text search as absent. The rc.2 source has a more precise boundary:

| Layer | Shipped capability | Default base behavior |
|---|---|---|
| Service | `ctx.sessionQuery` exact reads, filters, lineage, event relationships, and search interface | mounted through the SQLite implementation |
| Index | SQLite FTS over logical current-surface user, assistant, and steering records | `openAt: never`; full-text calls return `SESSION_QUERY_SEARCH_DISABLED` and SQLite is not opened |
| Host/Web API | bounded `session.search` projection over Sessions already visible through `session.list` | available only when content search is enabled; sidebar search otherwise matches metadata |
| Model tools | `session_search`, `session_event_search`, trace, and exact event-read tools | `tool-session-query` is shipped but not mounted by default |

This is neither automatic long-term memory nor a missing extension point. It is an existing retrieval subsystem whose expensive and sensitive surfaces require deployment opt-in. A profile can override the SQLite row to `openAt: first-search` or `startup`, normally with a durable index path, and can deliberately mount the model-tool package. Do not infer those choices from the package being present in the repository.

### Keep human search and Agent search distinct

The Host `session.search` route and model tools share a corpus but expose different authority and result contracts:

- the Host route derives visibility from `session.list`, revalidates every hit, returns at most 20 visible Session/snippet pairs, and bounds each snippet to 240 Unicode code points;
- model `session_search` is workspace-authorized, omits the caller Session, hides unauthorized lineage boundaries, and does not expose provider cursors, workspace paths, or a model-controlled result limit;
- current-Session `session_event_search` stops before the step that invoked it so the active tool call cannot retrieve itself;
- exact event reads should follow a relevant search hit rather than returning whole transcripts in the initial result.

Search results are untrusted historical evidence. They can contain stale instructions, secrets, tool output, or text written under a different policy. Keep source Session and event identity visible, retrieve the minimum exact range needed, and never promote matched transcript text into system instructions.

### Enable it as a privacy-sensitive derived index

The SQLite database is a rebuildable index, not the durable Session source of truth. An operational enablement record should name:

```text
source Session roots and visibility scope
openAt mode and durable index path
who can call Web search and model tools
indexed event kinds and current-surface semantics
snippet, result, work, and cancellation bounds
archive, deletion, retention, backup, and rebuild behavior
audit policy for human and Agent queries
```

Test deletion and authorization against the index, not only the Session files. A stale hit after access revocation or Session deletion is a privacy failure even if opening the original Session is denied.

## Decide what you are migrating

"Move my Codex or Claude Code memory" can refer to four different artifacts. Inventory them before choosing a plugin or writing an importer.

| Source artifact | What it usually means | DSH destination |
|---|---|---|
| Project instructions | Rules that should apply on every run | Project Skill or workspace instruction |
| User preferences | Selected facts reused across new Sessions | Scoped long-term memory |
| Conversation transcript | Evidence from one prior interaction | Imported archive or read-only search index, not a live Session append |
| Tool configuration | Commands, MCP servers, permissions, or model routes | Reviewed DSH profile, plugin, or MCP configuration |

Do not bulk-inject every source file into the system prompt. That hides provenance, spends context on irrelevant records, and turns stale notes into high-priority instructions. Preserve the original files, import into a disposable namespace, and make retrieval explicit enough to inspect.

### Migration acceptance record

Record these fields for each imported item:

```text
source_agent, source_path, source_digest, source_updated_at
imported_at, importer_version, destination_scope, destination_record_id
```

The source digest makes a rerun idempotent and lets an operator distinguish unchanged, updated, and deleted source files. A dry run should report those three sets without mutating either side.

## What the Session service guarantees

The Session log is the append-only source of truth for an Agent's interaction history. Message history is derived from its ordered surface rather than maintained as a second mutable transcript. Persistence is supplied by plugins that subscribe to `session/event`, flush writes, and later seed a resumed session.

That gives operators strong properties:

- a provider request can be reconstructed with its model route and message prefix;
- tool calls and results remain ordered durable facts;
- a completed event prefix can be forked with lineage metadata;
- compaction can replace an older model-visible range without rewriting the raw history.

It does not decide which user facts deserve reuse next month, whether another Agent may see them, or how a user deletes them. Those are memory-product decisions.

## The shipped memory path is an explicit tool path

The official repository includes default-off MCP overlays for third-party memory servers. The generic MCP client launches the chosen server and exposes its tools. The model must call a write tool to store a fact and a search or recall tool to retrieve it.

This explicit path has a useful property: memory access is visible as a tool effect. It can be logged, approved, denied, timed out, and evaluated. It also has a limitation: a fact is not recalled unless the model or another deterministic policy invokes the capability.

Use a short instruction when the provider's tool descriptions are insufficient:

```text
When the user asks you to remember something, call a memory write tool.
When historical information may be relevant, search memory and use only
records that match the current user and task scope.
```

An instruction improves tool selection. It does not create isolation, retention, or trust boundaries.

## Choose state by the job

| Requirement | Prefer |
|---|---|
| Reopen the same conversation after a restart | Session persistence and resume |
| Explore an alternative from a completed point | Session fork |
| Keep a long task within the context budget | Compaction |
| Reuse a user preference in a new session | Scoped long-term memory |
| Apply a rule on every run | Skill, profile, or workspace instruction |
| Keep an audit fact that must never depend on model recall | Durable application record outside model memory |

If two rows apply, compose them. A support Agent may use a durable session for the active case, a memory store for approved customer preferences, and an application database for the contractual case record.

## Production contract for a memory capability

Before mounting a memory provider, make these decisions explicit.

### 1. The host owns identity

The model may choose the note or query. It must not choose the tenant, principal, Agent, or workspace whose memory is accessed.

```text
Model-owned: query, note, recall intent
Host-owned: tenant, principal, Agent, workspace, provider route
```

Derive scope from authenticated execution context. Never accept a model-authored user ID as an isolation boundary.

### 2. Writes are durable effects

A save can survive the current turn and influence later sessions. Decide whether it requires approval, what audit event proves commitment, and how a user can inspect or delete it.

Give each logical save a harness-owned idempotency key. Agent retry, transport retry, or session resume must not create duplicate memories.

### 3. Timeout may mean unknown outcome

If a provider client cannot accept an `AbortSignal`, bounding the Agent's wait does not cancel the remote write. A timed-out save may commit later. Report that state as `OUTCOME_UNKNOWN`, retain the idempotency key, and reconcile before retrying.

### 4. Recall returns untrusted data

Stored text can be stale, malicious, or written under another workflow. Return typed records with stable ID, scope, source, timestamps, and confidence. Tell the model to treat recalled content as evidence, never as higher-priority instructions.

### 5. Availability shapes the tool surface

Do not advertise memory tools when no provider is usable. Conditional registration keeps the assembled tool schema honest. Structured runtime errors still matter for a provider that becomes unavailable after registration.

### 6. Bound retrieval

Cap result count, bytes, and estimated tokens. Define ranking and tie behavior. An unbounded memory search can consume the context window or let one noisy namespace dominate the prompt.

## Minimal cross-session evaluation

Use a disposable provider namespace and a non-sensitive nonce such as `validation drink = amber tea 7319`.

1. In session A, ask the Agent to remember the nonce.
2. Confirm a memory write tool ran and returned a durable record ID.
3. Create session B without copying session A's transcript.
4. Ask for the validation drink and explicitly request a memory search.
5. Confirm a search tool ran, returned the same scoped record, and the answer cited that record.
6. Create session C under another test principal. Confirm the nonce is absent.
7. Repeat the original save with the same idempotency key. Confirm there is still one logical record.
8. Inject instruction-like text into a test memory. Confirm it is quoted as data and cannot override the active Agent policy.
9. Re-run the same import. Confirm unchanged source digests do not create duplicate records.
10. Change one source fact and import again. Confirm the old record remains auditable or is explicitly superseded rather than silently overwritten.

### Success evidence

- session B recalls the exact nonce through a visible tool call;
- session C cannot retrieve it;
- duplicate delivery does not create a second logical memory;
- audit data names the provider, host-owned scope, operation, record ID, and outcome;
- disabling the provider removes the tools or produces the documented runtime-unavailable transition.

### Failure branches

| Symptom | Inspect first |
|---|---|
| Session B knows the nonce without a search | Transcript leakage or automatic prompt injection |
| Session B cannot recall it | Tool registration, provider process, namespace, or retrieval ranking |
| Session C can recall it | Host identity and provider isolation mapping |
| Two records appear after retry | Missing or provider-ignored idempotency |
| Timeout followed by a late record | Unknown-outcome handling and reconciliation |
| Retrieved text changes Agent policy | Trust labeling and prompt hierarchy |
| A second import duplicates everything | Source digests, idempotency, and update semantics |
| An old fact silently wins | Conflict policy, timestamps, and supersession records |

## Evaluate a community memory plugin before installing it

A GitHub repository, npm package, and enthusiastic discussion comment are discovery signals, not compatibility or security evidence. Memory plugins execute inside or beside the Host and can observe sensitive prompts, files, and durable state.

Use this release gate:

1. Match the repository, npm publisher, package tarball, license, and exact version.
2. Inspect install scripts, runtime dependencies, network destinations, filesystem roots, and declared DSH injections.
3. Confirm where recall enters the model surface and whether the insertion is visible in Session evidence.
4. Test tenant and workspace isolation with two disposable principals.
5. Test uninstall and cold restart without the plugin. Existing Sessions must still load, or the plugin must document the durable dependency.
6. Back up the complete profile and memory store before testing migration against real data.

The [community plugin audit](../security/community-plugin-audit.md) provides the full artifact-inspection and recovery workflow.

### Case study: `dsh-memory-lite` 0.1.0

The community plugin at revision [`fd373ae`](https://github.com/pacoyi/dsh-memory-lite/tree/fd373ae4957807214d597c6b24a60f06481ae13c) is small enough to audit directly. Its explicit four-operation tool, visible tool results, human-readable JSON, bounded result count, loopback UI route, and zero runtime dependencies are useful prototype properties. They do not yet provide a production memory contract.

The most important correction is privacy language. The README says “Nothing leaves your machine,” but a `recall` or `list` result is rendered as a normal text tool result. DeepSeek Harness persists that result in the Session and includes it in the model-visible conversation surface. On the next model step, recalled memory can therefore be sent to the configured remote model provider. The store itself is local; the retrieved content is not local-only.

At this revision, restrict evaluation to disposable, non-sensitive data because:

- every project and profile owned by the same operating-system home shares one fixed `~/.dsh/memory-lite.json`; there is no tenant, user, Workspace, Agent, or profile namespace;
- tool and browser writes perform independent read-modify-write cycles without an in-process queue, cross-process lock, revision check, or idempotency key, so concurrent saves can allocate the same ID and the later whole-file write can lose the other update;
- `writeFile()` replaces the live store directly, without a synced temporary file, no-overwrite publish, backup generation, or directory durability protocol; a crash can leave invalid or truncated JSON;
- `loadStore()` treats missing **and corrupt** JSON identically as an empty store; the next successful save can overwrite the only damaged copy instead of failing closed or quarantining it;
- notes, tags, entry count, file bytes, and rendered output bytes have no bounds beyond the 100-record result-count cap; one large note or many tags can consume context and disk independently of `limit`;
- recalled strings carry no scope, provenance, author, update time, trust label, supersession state, or source digest, so the model cannot distinguish a user-approved preference from stale or instruction-like text;
- the model can save and permanently forget entries without an approval or application-level audit record, and a retry can duplicate a save;
- the Settings delete action has no confirmation or undo, while editing the JSON file manually during Host activity races plugin writes;
- the package pins an early `@deepseek-ai/dsh-tools` peer range and publishes no automated concurrency, crash-recovery, upgrade, privacy, or real-Host lifecycle tests.

Do not place credentials, customer data, private source, authentication material, or policy instructions in this store. If evaluating 0.1.0, use one stopped profile and one synthetic namespace, keep an external backup, avoid manual edits while it runs, and assume every recalled byte can reach the selected provider and remain in the Session log.

A minimally safe next revision should:

1. derive an opaque scope from Host-owned execution context and include it in every key;
2. serialize mutations through one queue and use a cross-process lock plus revision or compare-and-swap;
3. write a synced temporary generation, validate it, publish atomically, and retain a recoverable prior generation;
4. distinguish missing, unsupported-version, and corrupt stores; quarantine corruption and refuse mutation;
5. validate and bound note/tag/count/file/result bytes and estimated result tokens;
6. return typed records with scope, provenance, created/updated time, trust label, and stable ID;
7. require explicit approval or policy for save/forget, with idempotency and durable audit evidence;
8. label recalled text as untrusted evidence and never treat it as system or developer instruction;
9. state clearly that retrieval may send content to the selected model provider and duplicate it into Session history;
10. test two simultaneous Hosts, interrupted writes, duplicate retries, corrupt files, large entries, cross-scope denial, uninstall, and restore.

## Current upstream status

- Durable Session events, resume, fork, and compaction are shipped runtime mechanisms.
- The session-query family, SQLite FTS provider, Host search projection, and model tools are shipped; base content search is disabled with `openAt: never`, and the model tools are not mounted by default.
- Third-party memory is available through default-off MCP example overlays.
- A first-party `ctx.memory` capability seam has been proposed in the community, but it is not part of the verified shipped API.

Pin the upstream revision you deploy and re-check this boundary after upgrades.

## Official sources

- [Session package](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/session/README.md)
- [Session implementation](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/core/session/src/index.ts)
- [rc.2 session-query family](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/session-query/README.md)
- [rc.2 SQLite search provider](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/session-query/session-query-sqlite/README.md)
- [rc.2 workspace-authorized model tools](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/session-query/tool-session-query/README.md)
- [Cross-conversation transcript-search request #4752](https://github.com/deepseek-ai/deepseek-harness/discussions/4752)
- [Third-party memory MCP examples](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/examples/mcp-memory/README.md)
- [MCP client](https://github.com/deepseek-ai/deepseek-harness/tree/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/mcp/mcp-client)
- [Community memory migration discussion](https://github.com/deepseek-ai/deepseek-harness/discussions/14)
- [Community `ctx.memory` proposal](https://github.com/deepseek-ai/deepseek-harness/discussions/1638)
- [`dsh-memory-lite` 0.1.0 source](https://github.com/pacoyi/dsh-memory-lite/tree/fd373ae4957807214d597c6b24a60f06481ae13c)
- [`dsh-memory-lite` announcement #4835](https://github.com/deepseek-ai/deepseek-harness/discussions/4835)
