---
title: Fix Missing dsh-client-schema-form After npm Installation
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
---

# Fix `Cannot find package '@deepseek-ai/dsh-client-schema-form'`

A community plugin can install successfully and then stop a fresh DeepSeek Harness profile during boot:

```text
failed to import loader entry
Cannot find package '@deepseek-ai/dsh-client-schema-form'
```

This is not proof that the profile needs another arbitrary dependency. It is a distribution-closure mismatch: the plugin imports a DeepSeek client package that is not present in the selected DSH installation closure.

At the verification point, the official rc.8 CLI manifest does not declare `@deepseek-ai/dsh-client-schema-form`, and the rc.8 source tree does not contain that package. npm does publish the package separately, but its tags are on a different line: `latest` is `0.0.1-rc.1`, `next` is `0.1.0-rc.7`, and no rc.8 build is published. Treat a manual install as a controlled compatibility experiment, not as a generally safe repair.

## Preserve the first failure

Capture the exact DSH executable, distribution channel, profile, and first missing import before changing the dependency graph:

```bash
command -v dsh
dsh --version
node --version
npm --version
npm root -g
npm ls -g @deepseek-ai/dsh --depth=0
```

Then inspect the selected installation without printing credentials:

```bash
dsh_root="$(npm root -g)/@deepseek-ai/dsh"
test -f "$dsh_root/package.json" || exit 1
node -e 'const p=require(process.argv[1]); console.log({name:p.name,version:p.version,hasSchemaForm:Boolean(p.dependencies?.["@deepseek-ai/dsh-client-schema-form"])})' \
  "$dsh_root/package.json"
find "$dsh_root/node_modules/@deepseek-ai" -maxdepth 1 -type d \
  -name 'dsh-client-schema-form' -print
```

Expected rc.8 npm evidence is `hasSchemaForm: false` and no matching directory.

## Identify who owns the import

Do not infer ownership from the final stack line alone. Search the failing plugin and its manifest:

```bash
profile="$HOME/.dsh/profiles/<profile>"
plugin="$profile/node_modules/<plugin-package>"

node -e 'const p=require(process.argv[1]); console.log({name:p.name,version:p.version,dependencies:p.dependencies,peerDependencies:p.peerDependencies})' \
  "$plugin/package.json"
rg -n "dsh-client-schema-form" "$plugin" \
  --glob 'package.json' --glob '*.js' --glob '*.mjs' --glob '*.cjs'
```

Classify the result:

| Evidence | Boundary | Owner |
|---|---|---|
| Plugin imports the package but declares neither dependency nor peer | plugin package contract | plugin publisher |
| Plugin declares a peer that the chosen DSH closure does not provide | Host/plugin compatibility contract | plugin and DSH release owners |
| DSH manifest declares it but bytes are absent | corrupted or incomplete installation | installation/distribution channel |
| Package exists, but another copy resolves first | duplicate runtime closure | profile dependency topology |
| Same exact versions differ by distribution channel | release artifact composition | DSH release pipeline |

## Prove the channel difference

If another machine or Homebrew installation works, compare coordinates rather than copying its directory:

```bash
command -v dsh
dsh --version
node -p 'require(process.argv[1]).version' /absolute/path/to/dsh/package.json
find /absolute/path/to/dsh/node_modules/@deepseek-ai -maxdepth 1 \
  -type d -name 'dsh-client-schema-form' -print
```

Require the same DSH version, Node major, plugin version, profile composition, and missing package path. “Homebrew works” is useful evidence only after those coordinates match.

## Safe recovery routes

### 1. Prefer a compatible plugin release

The safest route is a plugin version whose published dependency contract matches the selected DSH release. Test it in a disposable profile before changing the working profile:

```bash
dsh plugin --profile schema-form-probe add <plugin-package>@<reviewed-version>
dsh --profile schema-form-probe
```

Success requires more than boot: open the plugin surface, submit one valid settings change, reload, and verify that core settings still work.

### 2. Use a distribution that carries the required closure

If an approved DSH distribution contains the missing package, install that distribution through its supported installer. Do not copy one package directory between global installations. Record the exact DSH version and package inventory so the result is reproducible.

### 3. Run a disposable compatibility experiment

Only when you accept an rc.7 package inside an rc.8 profile, use a new profile and pin the exact package version:

```bash
probe_profile="$HOME/.dsh/profiles/schema-form-probe"
cd "$probe_profile"
pnpm add --save-exact @deepseek-ai/dsh-client-schema-form@0.1.0-rc.7
```

This is not a production fix. The package has no rc.8 publication, and adding a second copy can violate the Harness expectation that internal runtime packages resolve from one coherent closure. Remove the probe if any resolved `@deepseek-ai/*` package splits across roots.

### 4. Roll back to known-good

If the plugin is not essential, remove it through the DSH plugin command and require the profile to boot with its previous resolved configuration. Preserve the failed profile manifest and lockfile for the report.

## Do not use these shortcuts

- Do not run an unversioned `pnpm add ...@next` in the working profile; `next` is mutable.
- Do not install npm `latest` assuming it follows DSH rc.8; it currently resolves to an older package line.
- Do not copy package directories from Homebrew into an npm global tree.
- Do not add the missing package to a shared profile before recording the first import stack and dependency graph.
- Do not use `--force` or broad peer-dependency suppression as proof of compatibility.
- Do not report “npm is broken” when the package is absent from the rc.8 CLI dependency manifest.

## Acceptance gates

- [ ] The exact DSH executable, version, and distribution channel are recorded.
- [ ] The first missing-package stack identifies the importing plugin file.
- [ ] The plugin's dependency and peer-dependency declarations are captured.
- [ ] The selected DSH closure is checked for the package and manifest declaration.
- [ ] npm dist-tags and the exact candidate version are recorded.
- [ ] A disposable profile reproduces the failure before any workaround.
- [ ] Any manual experiment pins an exact version and stays isolated.
- [ ] All `@deepseek-ai/*` runtime packages resolve from the intended closure.
- [ ] Profile boot, plugin settings, core settings, reload, and restart pass.
- [ ] Removing the plugin returns the profile to known-good state.

## Incident bundle

Attach the sanitized first stack, OS, Node/npm/pnpm versions, DSH install channel and exact version, plugin name and version, relevant manifest sections, global and profile package roots, package inventory, `npm view ... dist-tags versions --json`, disposable-profile result, and the before/after resolved configuration.

## Primary sources

- [Official discussion #3471](https://github.com/deepseek-ai/deepseek-harness/discussions/3471)
- [rc.8 CLI dependency manifest](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/apps/cli/package.json)
- [Official rc.8 release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.0-rc.8)
- [npm package: `@deepseek-ai/dsh-client-schema-form`](https://www.npmjs.com/package/@deepseek-ai/dsh-client-schema-form)

## Related guides

- [Diagnose plugin peer-dependency and ignored-build warnings](plugin-peer-dependency-warnings.md)
- [Recover a partial plugin add after pnpm exits nonzero](plugin-add-nonzero-reconcile.md)
- [Recover a Git plugin missing its built export](git-plugin-missing-dist.md)
- [Audit community plugins before installation](../security/community-plugin-audit.md)
