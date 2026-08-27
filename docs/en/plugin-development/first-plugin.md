---
title: Build Your First DeepSeek Harness Plugin
locale: en
content_revision: 3
status: canonical
verified_at: 2026-08-28
---

# Build your first DeepSeek Harness plugin

This tutorial takes one small capability through the complete lifecycle: load a local TypeScript module into a source checkout, expose a typed model tool, package the plugin as a bundle, install it into an isolated profile, inspect the composed graph, and remove it cleanly.

> [!WARNING]
> A Harness plugin is trusted Host code. It runs outside the Agent sandbox with the permissions of the `dsh` process. Review every dependency and install script, use a disposable profile, and pin Git dependencies to a commit.

## Choose the right development path

| Objective | Use | What it proves |
|---|---|---|
| Learn the plugin API | source checkout plus `--patch` | the module loads and its lifecycle is correct |
| Test a model-facing tool | source checkout plus Web profile | the tool registry, schema, execution, and rendering work |
| Test real installation | bundle plus isolated profile | manifest discovery, pnpm installation, and layer reconciliation work |
| Publish for other users | built npm package or tarball | consumers receive runnable artifacts without your checkout |

Do not start by publishing. First prove the smallest local module, then the bundle, then the install path.

## 1. Verify the official source checkout

The official repository is `deepseek-ai/deepseek-harness`, and the official CLI package is `@deepseek-ai/dsh`.

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
git remote get-url origin
git rev-parse HEAD
corepack enable
pnpm install
pnpm run build
```

The remote must resolve to the DeepSeek AI repository. Record the commit because the plugin API is still in developer preview.

## 2. Create the smallest local plugin

From the repository root:

```sh
mkdir -p scratch-plugin/src
```

Create `scratch-plugin/src/my-plugin.ts`:

```ts
import type { Context } from '@deepseek-ai/cordis'

export const name = 'hello-plugin'

export function apply(ctx: Context) {
  console.log('[hello-plugin] loaded')
}
```

A plugin contributes capabilities through `apply(ctx)`. Keep side effects inside that lifecycle. Cordis automatically disposes registrations made through the context; external resources must return an explicit disposer from `ctx.effect()`.

Create `scratch-plugin/cordis.yml`, replacing the example with the absolute path to your checkout:

```yaml
- insert:
    - id: hello
      name: '/absolute/path/to/deepseek-harness/scratch-plugin/src/my-plugin.ts'
```

The path must be absolute because a patch contributes configuration but does not change the profile directory used for module resolution.

### Give editor diagnostics an explicit project

The overlay above is the complete **runtime** configuration. It does not make `scratch-plugin` part of the repository's TypeScript Project Reference graph. If an editor or a direct `tsc` invocation reports `Cannot find module '@deepseek-ai/cordis'`, add `scratch-plugin/tsconfig.json`:

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "composite": false,
    "declaration": false,
    "declarationMap": false,
    "incremental": false,
    "noEmit": true
  },
  "include": ["src"]
}
```

Then verify the scratch project directly:

```sh
pnpm exec tsc -p scratch-plugin/tsconfig.json
```

Extending `tsconfig.base.json` inherits the official source `paths`, including `@deepseek-ai/cordis`. The local file owns only the scratch project's inclusion and no-emit policy. Do not add `scratch-plugin` to the root Host aggregate, and do not add `include` or `files` to `tsconfig.base.json`; either change widens or narrows an official build graph merely to satisfy local editor discovery.

Boot the Web composition with the overlay:

```sh
pnpm dsh web --patch ./scratch-plugin/cordis.yml
```

Success means the terminal prints `[hello-plugin] loaded` and the Web UI still starts at `http://127.0.0.1:3080`.

## 3. Turn it into a typed Agent tool

Replace the module with:

```ts
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'greet-tool'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'greet',
    description: 'Greet someone by name.',
    parameters: {
      name: {
        type: 'string',
        required: true,
        description: 'The name to greet',
      },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      return `Hello, ${args.name}!`
    },
  }))
}
```

`inject = ['tools']` is a lifecycle dependency, not documentation. Cordis waits until the tool registry exists before calling `apply`. `execute` returns the canonical value; `render` converts that value into model-visible content.

Restart the command and ask:

> Use the `greet` tool to greet Ada. Report the exact tool result.

Verify the tool name, validated argument, call result, and rendered text in the trace. A natural-language greeting without a tool call is not proof that the plugin ran.

For nested objects, explicit nulls, `oneOf`, and raw-schema compatibility, use the [tool schema subset guide](tool-schema-subset.md). The implicit parameter root and explicit value objects intentionally have different `additionalProperties` rules.

## 4. Add configuration without hardcoding deployment choices

Export both a TypeScript type and a same-named Schemastery schema:

```ts
import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'

export interface Config {
  greeting: string
}

export const Config: Schema<Config> = Schema.object({
  greeting: Schema.string().default('Hello'),
})

export function apply(ctx: Context, config: Config) {
  console.log(config.greeting)
}
```

Then supply the value on the inserted row:

```yaml
- insert:
    - id: hello
      name: '/absolute/path/to/deepseek-harness/scratch-plugin/src/my-plugin.ts'
      config:
        greeting: 'Hi'
```

Schema validation happens while the plugin loads. Put defaults and self-contained constraints in the schema so an invalid deployment fails early and visibly.

## 5. Package the plugin as an installable bundle

A bundle and a profile are different objects:

- the **bundle** is the package you ship; its `dsh.bundle.patch` points to a configuration layer;
- the **profile** is a runnable composition under `$DSH_HOME/profiles/<name>`; `dsh plugin` maintains its ordered bundle list.

Create this minimal built-JavaScript package:

```text
hello-plugin/
├── package.json
├── cordis.patch.yml
└── index.js
```

`package.json`:

```json
{
  "name": "dsh-hello-plugin",
  "version": "0.1.0",
  "type": "module",
  "main": "index.js",
  "files": ["index.js", "cordis.patch.yml"],
  "dsh": { "bundle": { "patch": "./cordis.patch.yml" } }
}
```

`index.js`:

```js
export const name = 'hello-plugin'

export function apply() {
  console.log('[hello-plugin] loaded')
}
```

`cordis.patch.yml`:

```yaml
- insert:
    - id: hello
      name: dsh-hello-plugin
```

A package without the `dsh.bundle` declaration can still install as a dependency, but it contributes no composition layer.

## 6. Install, inspect, boot, and remove

From the directory containing `hello-plugin`:

```sh
dsh plugin --profile plugin-lab add ./hello-plugin
dsh --profile plugin-lab --dump-config
dsh --profile plugin-lab
dsh plugin --profile plugin-lab remove dsh-hello-plugin
```

The dump must show a `dsh-hello-plugin` layer and the inserted `hello` row before you boot. Install only one new bundle per test cycle so the first broken boundary remains attributable.

The effective layer order is:

1. profile bundles in manifest order;
2. the profile's `cordis.patch.yml`;
3. `$DSH_HOME/cordis.patch.yml`;
4. `--patch` overlays in command-line order.

Later layers win per row. A patch replaces the row's complete `config` value rather than deep-merging individual keys.

## 7. Publish without surprising consumers

Choose one distribution path:

| Distribution | Consumer behavior | Author responsibility |
|---|---|---|
| npm package | installs prebuilt artifacts | build before publish and include runtime files |
| packed tarball | installs a local immutable file | inspect `pnpm pack` contents and checksum the artifact |
| Git dependency | fetches source and may run `prepare` | make the build self-contained and document the exact commit |

pnpm 10 blocks Git dependency build scripts until the consumer explicitly allows them. That allowance executes package code on the Host during installation, outside the Agent sandbox. Treat it as a trust decision, not a routine setup checkbox.

## Acceptance checklist

- [ ] The official repository and inspected commit are recorded.
- [ ] The local module loads through one explicit overlay.
- [ ] The scratch project type-checks through its own config when editor or CLI diagnostics are required.
- [ ] Every hard service dependency appears in `inject`.
- [ ] Tool arguments and canonical output are validated.
- [ ] External resources have a lifecycle disposer.
- [ ] The package contains its built entry point and patch file.
- [ ] `dsh.bundle.patch` resolves inside the installed package.
- [ ] `--dump-config` shows the expected bundle and row.
- [ ] A clean profile boots and invokes the tool.
- [ ] Removal deletes both the dependency and composition layer.
- [ ] Git installs are commit-pinned and build permission is explicit.

## Failure router

| First failure | Inspect first |
|---|---|
| module not found | absolute local path or packaged `main` entry |
| editor cannot resolve `@deepseek-ai/cordis` | scratch `tsconfig.json` extending the repository base config |
| plugin installs but no layer appears | `dsh.bundle.patch` in the installed manifest |
| service is not declared | missing `inject` or unsafe direct `ctx.service` access |
| configuration rejected | exported Schemastery `Config` schema and supplied row |
| tool never appears | tools injection, registration name, and active Agent composition |
| Git install has no built output | self-contained `prepare` plus pnpm `allowBuilds` decision |
| profile worked before install | manifest, lockfile, and dump-config diff from known-good state |

## Official sources

- [Your first plugin](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/docs/user/develop/basic/index.md)
- [Build a tool](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/docs/user/develop/basic/tool.md)
- [Plugin configuration](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/docs/user/develop/basic/config.md)
- [Package and install a plugin](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/docs/user/develop/basic/publish.md)
- [CLI profile and plugin contract](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/apps/cli/reference/README.md)
- [TypeScript project layout and base-path contract](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/docs/development.md#typescript-project-layout)
- [Services and dependency lifecycle](https://github.com/deepseek-ai/deepseek-harness/blob/cd5ef8148158c3a752a658978873241fdf8e2bbc/docs/user/develop/framework/service.md)
