---
title: DeepSeek Harness Skills Guide
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-14
---

# DeepSeek Harness Skills: reusable Agent instructions

Skills are optional instruction packages discovered through `ctx.skills`. They let a deployment or repository teach Agents a repeatable workflow without hard-coding that workflow into the Agent loop. A Skill is not a session event and loading one does not by itself prove that its instructions were followed.

```mermaid
flowchart LR
  Sources["Project · user · custom · bundled · remote"] --> Providers["Skill providers"]
  Providers --> Registry["ctx.skills\nlayer + rank resolution"]
  Registry --> Catalog["name + description\nsmall prompt surface"]
  Catalog --> Invoke["model or user invokes"]
  Invoke --> Body["load full Skill body\nand relative resources"]
```

## Where local Skills are discovered

Lower rank wins within one scope layer:

| Rank | Source | Directory |
|---:|---|---|
| 100 | project DSH | `<projectRoot>/.dsh/skills` |
| 200 | project Agents | `<projectRoot>/.agents/skills` |
| 300 | custom | configured custom Skill directories |
| 400 | user DSH | `<dshHome>/skills` |
| 500 | user Agents | `<agentsHome>/skills` |
| 600 | bundled | configured bundled Skill directory |

The project root is the nearest ancestor containing `.git`; without one, the current working directory becomes the project root. Project-scoped Skills therefore travel naturally with a repository.

## Valid shapes

Skill names use kebab-case. The local provider accepts:

```text
.dsh/skills/
  repository-review/
    SKILL.md
    references/
      checklist.md
  release-notes.md
```

Both a directory bundle (`<name>/SKILL.md`) and a flat `<name>.md` are valid. Nested recursive `**/SKILL.md` discovery is not supported.

## Progressive disclosure

The initial model catalog contains model-invocable Skill names and descriptions—not the full instruction bodies or absolute paths. The complete definition is loaded only after invocation. This keeps prompt cost lower and makes the description a routing contract.

A strong description says what the Skill produces and when to use it. The body should then contain the ordered workflow, safety conditions, required evidence, and links to relative resources.

## Model and user invocation are independent

Two frontmatter controls resolve into separate policies:

- `disable-model-invocation: true` hides a Skill from model-facing discovery;
- `user-invocable: false` prevents direct human invocation.

Omitting them permits both by default. A deployment can therefore provide model-only, user-only, dual-use, or trusted-loader-only Skills.

## Layering and duplicates

The registry merges a global host layer with the viewing Agent's scope chain. A nearer scope layer wins a duplicate name outright. Rank decides duplicates only inside the same layer, followed by provider registration order and local order.

That means an Agent preset can intentionally shadow a host Skill for one scoped Agent without changing every other Agent in the process.

## Hot refresh and failure behavior

Filesystem watchers invalidate the catalog when direct Skill entries change. Provider mutations emit `skills/change`, prompting consumers to fetch a new snapshot. An incomplete provider observation can still contribute usable Skills but is not cached as authoritative absence.

When a Skill seems missing, check:

1. valid kebab-case name;
2. supported direct directory or flat-file shape;
3. project-root detection;
4. invocation policy;
5. a nearer scope shadowing the same name;
6. incomplete provider discovery or watcher failure.

## Skill authoring checklist

- Keep the description short enough for a catalog and specific enough for routing.
- State trigger conditions and explicit non-goals.
- Separate read-only inspection from mutations.
- Define evidence of completion.
- Use placeholders, never real credentials.
- Keep relative resources inside the Skill bundle.
- Test both model invocation and direct user invocation where enabled.

## Official sources

- [Skills subsystem](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/skills.md)
- [Skill packages](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/skill)
- [Configuration catalog](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/config-catalog.md)
