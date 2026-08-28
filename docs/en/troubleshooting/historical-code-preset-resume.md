---
title: Resume Historical DeepSeek Harness Sessions After the code to ptc Preset Rename
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-28
upstream_revision: cd5ef8148158c3a752a658978873241fdf8e2bbc
---

# Resume a historical `code` Session after the preset became `ptc`

Use this runbook when an alpha.1 Web or command surface refuses a historical Session with this signature:

```text
resume failed for session "session-...":
agent-presets: preset "code" not found
(available: standard, ptc, minimal, cordis)
```

This is a preset-identity migration failure, not evidence that the Session log is corrupt. Preserve the Session and restore a compatible preset name before considering any durable-history edit.

## Separate the new PTC vocabulary from durable Session data

The alpha.1 release continues the rename in user-facing documentation and spill-policy prose: new references should say **PTC** (the shipped preset id is `ptc`), not “Code Mode” or the old `code` preset. That vocabulary cleanup does **not** retroactively migrate a stored Session. A historical header or projection can still contain `code`, while event and plugin names may intentionally retain Code terminology for compatibility.

When reviewing an upgrade, treat these as two independent checks:

| Layer | What to expect after the upgrade | Safe operator action |
|---|---|---|
| Presentation and current docs | PTC/`ptc` naming in the shipped roster, notes, and spill policy | update new runbooks and screenshots to PTC terminology |
| Durable Session identity | an existing `agentPreset: code` may remain | preserve it and use the explicit compatibility alias below |
| Session-persistent event/plugin vocabulary | legacy Code names may remain by design | do not bulk-rename serialized values |

The upstream rename follow-up is therefore evidence about terminology, not permission to rewrite compressed history. If a log opens under a current `ptc` Session but its archived projection still says `code`, keep the original artifact and record which compatibility object resolved it.

## Why the old name blocks the whole Session

The rename commit `3ca9c7d489` moved the shipped preset directory and id from `code` to `ptc`. Its commit contract explicitly kept Session-persistent Code Mode vocabulary unchanged until a later Session-format migration, but the preset id itself is also durable:

```text
Session creation header.agentPreset
  → agentPreset Session projection
  → resumeObserved()
  → composeAgent(recorded preset id)
  → agentPresets.resolve(id)
  → standing preset mount
```

Alpha.1's `resumeObserved()` reads the current `agentPreset` projection and passes it directly to `composeAgent()`. `composeAgent()` resolves that exact id before publishing the Agent. A historical projection equal to `code` therefore fails against a roster containing only `standard`, `ptc`, `minimal`, and `cordis`.

This failure can surface while opening a Session, warming the command directory, reading Skills, or building a cold conversation view. Those surfaces share the same missing composition authority; repairing each UI caller separately would leave the Session unresumable elsewhere.

## Preserve the migration evidence

Before changing the preset roster:

1. stop every DSH writer using the same home;
2. copy the affected Session directory and hash the original;
3. record the producing revision, target revision, Session id, `DSH_HOME`, profile, and full first error;
4. confirm the durable header or `agentPreset` projection names `code`;
5. list the target roster and confirm `ptc` exists while `code` does not;
6. preserve any locally edited pre-rename `code` preset separately.

Do not replace `"code"` with `"ptc"` inside compressed Session bytes. The preset is referenced by durable header/projection state, and ad-hoc edits can break frame boundaries, checksums, event identities, or future migration evidence.

## Choose the compatibility object

| Situation | Safest compatibility object | Limitation |
|---|---|---|
| the Session used the shipped preset and no local edits | user preset named `code`, copied from current shipped `ptc` | resumes under alpha.1's current PTC composition, not byte-for-byte historical dependencies |
| an exact pre-rename preset directory was preserved | reviewed user preset named `code` restored from that directory | old plugin names or APIs may be incompatible with alpha.1 |
| provenance is unknown or the Session has sensitive side effects | keep the old Session read-only; start a clean `ptc` Session with a verified handoff | does not continue the original Agent identity |
| many homes or Sessions need migration | wait for or build a versioned resolver migration with explicit `code → ptc` coverage | requires an upstream/runtime change, not a one-off log edit |

The official alpha.1 preset authoring capability is copy-only. It can copy an existing preset's entire directory into the writable user root under a new id, without accepting caller-supplied composition text. Because the shipped root contains no `code` id, a user copy can provide the missing historical name.

## Bounded recovery with a user-level alias

Use a disposable copy of the Harness home first.

1. Start alpha.1 with the affected Session copy and an isolated `DSH_HOME`.
2. Open the Agent preset settings surface without resuming the affected Session.
3. Copy the shipped `ptc` preset.
4. Set the new preset id to `code`; use a display name such as `Legacy code compatibility`.
5. Restart the Host so the cold path is tested, not only an already-mounted roster.
6. Confirm the roster contains both `ptc` and the user-owned `code` copy.
7. Open the copied historical Session and verify Chat, Trajectory, command listing, Skills, and one read-only request.
8. Compare the resolved tool roster and prompt surface with the evidence you retained from the producing build.

The authoring implementation writes copies under the first user-trust preset root, normally `<dshHome>/.agent-presets`, rejects invalid or occupied ids, dereferences symlinks, tightens permissions, and never overwrites a shipped preset. Preserve the generated `code` directory as the rollback object.

Do not assume a successful open proves semantic equivalence. The rename commit changed more than a directory label across the PTC presentation stack, while intentionally retaining some durable Code vocabulary. The alias proves that alpha.1 can compose a Session whose durable preset identity is `code`; it does not prove every old tool behavior is identical.

## Migrate ongoing work without rewriting history

A nonblank Session cannot switch presets. Alpha.1 enforces that rule because changing tools and prompt sections mid-conversation could strand historical tool calls that the new composition cannot make.

After recovering access:

- treat the old Session as an auditable historical record;
- reconcile any pending or externally visible side effects;
- create a new Session explicitly using `ptc`;
- transfer a concise, reviewed handoff rather than the full unbounded transcript;
- verify the new Session's header/projection records `ptc`;
- keep the `code` compatibility preset while any historical Session may need cold replay, export, search, command discovery, or fork inspection.

Deleting the alias does not stop an already-mounted live Agent, but a later cold resume will fail again. Remove it only after an inventory proves no retained Session depends on `code`, or after an upstream migration owns that mapping.

## Failed approaches

- **Changing the default preset to `ptc`:** defaults apply when no explicit id is recorded; the historical projection explicitly says `code`.
- **Selecting `ptc` after opening:** resume fails before the nonblank Agent is available, and nonblank preset switching is intentionally locked.
- **Renaming fields inside the Session file:** destroys evidence and may violate physical and logical persistence invariants.
- **Copying only `agent.cordis.yml` by hand:** a preset is a directory that may include metadata, Skills, and assets; the official copy operation owns the whole tree and permissions.
- **Keeping an old runtime permanently:** useful as a read-only control, but it does not establish an upgrade path or current security posture.
- **Silently mapping every unknown preset to the default:** can give a historical Agent a different tool and policy surface without operator consent.

## Runtime migration contract

A durable fix should make the compatibility decision explicit and versioned:

1. map only the known historical `code` id to `ptc`, never arbitrary unknown ids;
2. apply the mapping consistently to resume, cold presenters, command and Skill catalogs, forks, search, export, and subagent inheritance;
3. preserve the original durable identity or append an explicit migration record—never silently rewrite the only copy;
4. surface that a compatibility mapping was applied and which target composition ran;
5. refuse the mapping when a user-owned `code` preset exists and precedence would be ambiguous;
6. prove the mapped PTC composition can interpret the retained Session-persistent Code vocabulary;
7. provide rollback to the unmigrated artifact and old source revision;
8. inventory every Session requiring the alias before removing support.

## Regression gates

- A pre-rename Session whose projection is `code` cold-opens on alpha.1 through the owned compatibility path.
- A new alpha.1 Session records `ptc`, not `code`.
- A genuinely unknown preset still returns `agent-preset-not-found` with the available roster.
- A user-authored `code` preset is not silently shadowed or replaced.
- Chat, Trajectory, commands, Skills, search, export, fork, and resume resolve the same composition.
- The historical log remains byte-for-byte unchanged unless a versioned migration explicitly owns a new artifact.
- PTC presentation understands retained durable Code event/plugin vocabulary.
- Removing compatibility is refused or warned while retained Sessions still project `code`.

## Source boundary

Verified against the official rename commit `3ca9c7d4891760ba366123bf9f5d45ed7133c088`, the alpha.1 release commit `cd5ef8148158c3a752a658978873241fdf8e2bbc`, and the follow-up terminology sync `188d77e` on 2026-08-28. Discussion #4829 is the incident observation; this handbook did not mutate or execute the reporter's Session.

- [Historical Session failure report #4829](https://github.com/deepseek-ai/deepseek-harness/discussions/4829)
- [Official `code` → `ptc` rename commit](https://github.com/deepseek-ai/deepseek-harness/commit/3ca9c7d4891760ba366123bf9f5d45ed7133c088)
- [Follow-up PTC terminology sync](https://github.com/deepseek-ai/deepseek-harness/commit/188d77e)
- [Alpha.1 Session resume and preset composition](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/api/session-controller/src/agent.ts)
- [Alpha.1 preset identity and unknown-preset error](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/preset/agent-presets/src/preset.ts)
- [Alpha.1 preset authoring and copy boundary](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/preset/agent-presets/src/authoring.ts)
- [Alpha.1 preset service, copy, mount, and nonblank switch contract](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/packages/preset/agent-presets/src/index.ts)
- [Preserve Session evidence before recovery](session-history-corruption-triage.md)
