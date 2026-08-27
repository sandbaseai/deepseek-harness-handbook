---
title: Recover a stale DeepSeek Harness preset generation
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-27
upstream_revision: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Recover after a preset edit collides with its previous generation

Use this runbook when saving `agent.cordis.yml` succeeds, but the next Session creation fails with `agent-preset-invalid`, `failed to apply loader entry tool-cordis`, or `Host Cordis inspect provider "Service" is already registered` until the Web Host restarts.

This is a runtime-generation problem, not proof that the YAML is invalid. DeepSeek Harness keeps a standing composition for each Agent preset. When the composition stamp changes, a later Session mounts a new generation, while Sessions already joined to the previous generation must keep their original plugin graph.

At `0.1.1-rc.2` source revision `b150a55`, the roster does not count joined Agents and does not reclaim a superseded generation. A row such as `tool-cordis` also registers fixed provider IDs in a process-global registry. The new generation can therefore collide with registrations still owned by the old generation.

## Distinguish two collision paths

| Failure | First owner | Second contender | Typical trigger |
|---|---|---|---|
| Same-preset generation collision | generation A of preset X | generation B of preset X | save X, then create another Session |
| Cross-preset collision | preset X containing `tool-cordis` | preset Y containing `tool-cordis` | mount both in one Host lifetime |

Both can end at `already registered`, but the durable fixes differ. Generation reclamation addresses the first path after no Agents remain joined. Moving or safely sharing process-global registrations addresses the second. Making registration silently idempotent is unsafe unless disposer ownership and provider equivalence are defined.

Official report #4675 proves the cross-preset path through the supported preset-copy flow: copy the shipped `cordis` preset, leave `tool-cordis` mounted, then select the built-in and copied presets in one Web Host lifetime. Whichever preset mounts second loses. Closing or archiving a Session does not release the standing mount.

## Preserve the live-generation evidence

Do not keep clicking New Session. Record:

```text
dsh --version and executable path:
Host PID and start time:
preset id and absolute composition path:
file mtime and size before/after save:
Sessions already joined to the preset:
first failing session.create RPC and complete error:
first duplicate provider id:
whether a different preset containing tool-cordis was mounted:
whether restart restores creation:
```

Keep old Sessions open only when operationally necessary. Their behavior is evidence that generation A remains live; deleting Session files does not prove its runtime scope has disposed.

## Safe recovery for operators

1. Stop creating Sessions from the affected preset.
2. Preserve the edited preset and the prior known-good copy.
3. Let active turns settle, then export or record every Session that must be resumed.
4. Stop the owning DSH Host gracefully and verify the exact PID exited.
5. Validate the composition in a disposable, isolated DSH home or test deployment.
6. Start one Host with the intended preset version.
7. Create one fresh Session, then resume only the required old Sessions.
8. Confirm a second fresh Session can be created without another file edit.

A process restart is the rc.2 mitigation because whole-tree teardown releases the old generation's effects. It is not proof that hot editing or cross-preset coexistence is fixed.

For production, treat a preset composition like deployable code: edit a candidate outside the serving Host, validate it, drain the old Host, then replace the deployment. Avoid an editor or plugin that repeatedly persists into the live preset directory.

## Why common shortcuts are risky

- **Deleting old Session logs:** runtime scopes and durable files have different owners; deletion also destroys recovery evidence.
- **Retrying Session creation:** each attempt repeats a deterministic mount boundary and obscures the first error.
- **Removing duplicate checks:** two unequal providers with one ID would become order-dependent.
- **Replacing the existing provider:** when replacement B disposes, its normal disposer removes the entry and leaves still-mounted A without a provider.
- **Using a bare reference counter:** an accidentally repeated disposer can decrement twice and evict a provider while another owner is live.
- **Sharing one disposer:** an old generation could unregister a provider still used by the new one.
- **Forcing old Sessions onto the new graph:** their durable tool history may name capabilities or semantics that no longer match.
- **Editing generated JavaScript:** the change is not reproducible and may leave the coordinated package graph split.

## Durable runtime contract

A robust fix needs explicit generation ownership:

1. stamp invalidation marks generation A superseded but does not mutate joined Agents;
2. generation B mounts through a single-flight path;
3. every bind, compose, and recompose increments the correct generation's join ownership;
4. Agent scope disposal or rebind decrements exactly once;
5. superseded A disposes only after its joined count reaches zero;
6. failed B releases all partial effects and does not drop the still-valid A pointer accidentally;
7. process-global providers mount once at Host ownership, or equivalent registrations share one canonical entry through explicit holder identity;
8. a different manifest under the same provider ID still throws before ownership changes;
9. new Session creation surfaces the mount failure in the UI; and
10. shutdown disposes every generation, watcher, timer, and registration.

## Safe shared-registration contract

The four Host inspect provider IDs are `Service`, `Event`, `Builtin`, and `Tool`. Sharing is safe only after proving equivalent registrations answer independently of the preset fiber that happened to mount first. At rc.2:

- `Service`, `Event`, and `Builtin` query generated Host facts and do not depend on the mounting preset context;
- `Tool` closes over `ctx`, but resolves visible schemas from the requesting Agent supplied in the query context; and
- provider manifests remain the compatibility boundary.

The registry should keep one canonical registration per ID plus a set of opaque live-holder tokens:

```text
register equivalent manifest:
  create one unique holder token
  retain the existing canonical registration

dispose holder:
  delete exactly that token
  remove the provider only when no holders remain

register different manifest under same ID:
  reject without replacing the live registration
```

Holder identity matters more than a numeric refcount. Cordis effect disposers are expected to be idempotent; deleting an already absent token is harmless, while decrementing a count twice can silently remove a provider still owned by another preset.

Manifest equivalence must use a canonical, key-order-independent representation. Object property order is not semantic compatibility. Query-function identity alone is also insufficient because equivalent providers can be created by distinct preset mounts.

## Regression matrix

Test more than the happy save-then-create case:

| Scenario | Required result |
|---|---|
| edit with zero joined Agents | old generation disposes before or during safe replacement |
| edit with one live old Session | old Session keeps A; new Session receives B without provider collision |
| two rapid saves | one authoritative newest generation; no orphan scope |
| concurrent Session creation at stale stamp | single-flight B; no B/C fork |
| B mount fails | A remains usable by joined Agents; partial B effects are gone |
| Agent recompose A → B | ownership moves exactly once |
| two presets need inspect tools | process-global provider ownership remains unambiguous |
| equivalent A and B mount, then B disposes | A continues to list and query all four providers |
| one holder disposer runs twice | remaining holders and provider entries are unchanged |
| same ID with a different manifest | mount fails loudly; the original provider remains usable |
| Host restart and Session restore | deterministic mount order; failure is visible |

Also measure watcher count, open handles, registry entries, and standing-generation count across repeated edit cycles. Passing Session creation while leaking every prior generation is not a complete fix.

## Primary evidence

- [Official same-preset generation report #3513](https://github.com/deepseek-ai/deepseek-harness/discussions/3513)
- [Official cross-preset collision report #1827](https://github.com/deepseek-ai/deepseek-harness/discussions/1827)
- [Official copied-preset reproduction #4675](https://github.com/deepseek-ai/deepseek-harness/discussions/4675)
- [rc.2 `ensureStanding` implementation and reclaim TODO](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/preset/agent-presets/src/index.ts)
- [rc.2 documented standing-generation limitation](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/preset/agent-presets/README.md)
- [rc.2 `tool-cordis` provider registration](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/extensions/tool-cordis/src/index.ts)
- [rc.2 process-global inspect registry](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/extensions/cordis-host-runner/src/inspect-registry.ts)
