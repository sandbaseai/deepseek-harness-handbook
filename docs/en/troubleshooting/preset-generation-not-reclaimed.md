---
title: Recover a stale DeepSeek Harness preset generation
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
---

# Recover after a preset edit collides with its previous generation

Use this runbook when saving `agent.cordis.yml` succeeds, but the next Session creation fails with `agent-preset-invalid`, `failed to apply loader entry tool-cordis`, or `Host Cordis inspect provider "Service" is already registered` until the Web Host restarts.

This is a runtime-generation problem, not proof that the YAML is invalid. DeepSeek Harness keeps a standing composition for each Agent preset. When the composition stamp changes, a later Session mounts a new generation, while Sessions already joined to the previous generation must keep their original plugin graph.

At rc.8 source revision `141eb6f`, the roster does not count joined Agents and does not reclaim a superseded generation. A row such as `tool-cordis` also registers fixed provider IDs in a process-global registry. The new generation can therefore collide with registrations still owned by the old generation.

## Distinguish two collision paths

| Failure | First owner | Second contender | Typical trigger |
|---|---|---|---|
| Same-preset generation collision | generation A of preset X | generation B of preset X | save X, then create another Session |
| Cross-preset collision | preset X containing `tool-cordis` | preset Y containing `tool-cordis` | mount both in one Host lifetime |

Both can end at `already registered`, but the durable fixes differ. Generation reclamation addresses the first path after no Agents remain joined. Moving or scoping process-global registrations addresses the second. Making registration silently idempotent is unsafe unless disposer ownership and provider equivalence are defined.

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

A process restart is the rc.8 mitigation because whole-tree teardown releases the old generation's effects. It is not proof that hot editing is fixed.

For production, treat a preset composition like deployable code: edit a candidate outside the serving Host, validate it, drain the old Host, then replace the deployment. Avoid an editor or plugin that repeatedly persists into the live preset directory.

## Why common shortcuts are risky

- **Deleting old Session logs:** runtime scopes and durable files have different owners; deletion also destroys recovery evidence.
- **Retrying Session creation:** each attempt repeats a deterministic mount boundary and obscures the first error.
- **Removing duplicate checks:** two unequal providers with one ID would become order-dependent.
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
7. process-global providers mount once at Host ownership, or registrations use an explicit scoped/ref-counted contract;
8. provider replacement defines equality, handoff, and disposer semantics;
9. new Session creation surfaces the mount failure in the UI; and
10. shutdown disposes every generation, watcher, timer, and registration.

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
| Host restart and Session restore | deterministic mount order; failure is visible |

Also measure watcher count, open handles, registry entries, and standing-generation count across repeated edit cycles. Passing Session creation while leaking every prior generation is not a complete fix.

## Primary evidence

- [Official same-preset generation report #3513](https://github.com/deepseek-ai/deepseek-harness/discussions/3513)
- [Official cross-preset collision report #1827](https://github.com/deepseek-ai/deepseek-harness/discussions/1827)
- [rc.8 `ensureStanding` implementation and reclaim TODO](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/preset/agent-presets/src/index.ts)
- [rc.8 documented standing-generation limitation](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/preset/agent-presets/README.md)
- [rc.8 `tool-cordis` provider registration](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/extensions/tool-cordis/src/index.ts)
- [rc.8 process-global inspect registry](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/extensions/cordis-host-runner/src/inspect-registry.ts)

