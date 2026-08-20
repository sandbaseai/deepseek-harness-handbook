---
title: Find a Corrupt package.json Blocking DeepSeek Harness Profile Boot
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
---

# Find a corrupt `package.json` blocking DeepSeek Harness profile boot

DeepSeek Harness rc.8 walks the installed package graph before composing a profile. If the installation anchor or any resolved dependency contains truncated or malformed `package.json`, `healProfilesModuleFallback()` can stop boot with only a parser message:

```text
SyntaxError: Unexpected end of JSON input
    at JSON.parse
    at healProfilesModuleFallback
```

The stack identifies the phase, not the file. This is different from an invalid profile overlay, a missing package export, or a plugin that throws while loading.

## Preserve the incident boundary

Stop the failing DSH process and record the executable selected by the same shell:

```powershell
Get-Command dsh,node,npm,pnpm -All | Select-Object Name,Source
dsh --version
node --version
npm config get registry
npm root --global
```

For an `npx` invocation, preserve the complete stack path and command because the controlling closure may be inside the npm execution cache rather than the global root. Do not run a cache cleaner or reinstall yet; both destroy the file that explains the failure.

Copy the suspected installation or cache directory if incident policy permits, then hash the failing files before repair:

```powershell
Get-FileHash -Algorithm SHA256 C:\path\to\suspect\package.json
Get-Item C:\path\to\suspect\package.json | Select-Object FullName,Length,LastWriteTimeUtc
```

## Scan read-only and print every bad path

Create `scan-package-json.mjs` outside the installation:

```js
import { readdir, readFile, realpath, stat } from 'node:fs/promises'
import { join } from 'node:path'

const root = process.argv[2]
if (!root) throw new Error('usage: node scan-package-json.mjs <installation-root>')

let checked = 0
let failed = 0
const visited = new Set()

async function walk(dir) {
  const identity = await realpath(dir)
  if (visited.has(identity)) return
  visited.add(identity)
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    const target = entry.isSymbolicLink() ? await stat(path).catch(() => undefined) : undefined
    if (entry.isDirectory() || target?.isDirectory()) {
      await walk(path)
      continue
    }
    if (!(entry.isFile() || target?.isFile()) || entry.name !== 'package.json') continue
    checked += 1
    try {
      const raw = await readFile(path, 'utf8')
      JSON.parse(raw)
    } catch (error) {
      failed += 1
      const size = await stat(path).then((value) => value.size, () => -1)
      console.error(JSON.stringify({ path, size, error: String(error) }))
    }
  }
}

await walk(root)
console.log(JSON.stringify({ root, checked, failed }))
process.exitCode = failed === 0 ? 0 : 1
```

Run it against one exact boundary at a time:

```powershell
node .\scan-package-json.mjs "$(npm root --global)\@deepseek-ai\dsh"
node .\scan-package-json.mjs "$HOME\.dsh\profiles"
```

If the stack points into an `_npx` directory, scan that exact cache closure instead of assuming the global installation owns the failure. The scanner follows directory symlinks, deduplicates their real targets, then reads and parses each reachable manifest. It does not rewrite, delete, normalize, or install anything.

## Map each bad manifest to its owner

| Bad path is under | Repair owner | Correct recovery unit |
|---|---|---|
| the selected `@deepseek-ai/dsh` installation | npm, Homebrew, source checkout, or other distributor | the exact DSH artifact and its resolved closure |
| an `_npx` execution directory | npm execution cache | a new isolated cache using the exact package version |
| `~/.dsh/profiles/<profile>/node_modules/<plugin>` | profile package manager and plugin publisher | that exact profile dependency and lock state |
| a source checkout | Git worktree plus package manager | tracked manifest or exact frozen install, depending on ownership |
| multiple unrelated package trees | endpoint protection, DLP, disk, sync, or backup layer | the external mutation boundary before reinstalling |

Zero-byte or identically truncated manifests across unrelated packages are strong evidence of an external writer. A successful reinstall that becomes corrupt again is not a package-manager fix; capture the timestamps and hashes and involve the endpoint or storage owner.

## Recover without inventing package metadata

### npm or npx distribution

Record the exact version and registry metadata from outside the broken closure. Prove a clean artifact in a new prefix or cache first:

```powershell
$probe = Join-Path $env:TEMP "dsh-manifest-probe"
New-Item -ItemType Directory -Force $probe | Out-Null
npx -y --cache "$probe\cache" @deepseek-ai/dsh@<exact-version> --version
```

If the clean probe passes, replace the broken installation through its original package manager. Do not copy one manifest out of the probe: a truncated file may be only one damaged member of the closure.

### Profile plugin closure

Back up the profile manifest, lockfile, bundle patch, and suspect package metadata. Remove and reinstall the exact plugin through the DSH profile workflow, then verify that no duplicate `@deepseek-ai/*` runtime family was introduced. A profile-local copy of a Host-owned package can split service identity even when JSON parsing succeeds.

### Source checkout

Use Git to distinguish tracked corruption from generated dependency corruption:

```powershell
git status --short
git diff -- package.json
pnpm install --frozen-lockfile
```

Do not discard unrelated work. Restore a tracked manifest only after identifying it as the damaged artifact; regenerate dependencies only from the repository's exact lockfile and package-manager contract.

## Do not use these shortcuts

- Do not append a missing brace or replace an empty manifest with `{}`. Package name, version, exports, dependencies, type, and native-install contracts matter.
- Do not delete every `node_modules` tree before preserving the failing path, size, timestamp, hash, stack, and install identity.
- Do not treat the first malformed file as proof it is the only one; complete the read-only scan.
- Do not copy a manifest from another DSH release or distribution channel.
- Do not disable DLP, endpoint protection, or integrity controls without the system owner's authorization.
- Do not boot production from the diagnostic copy or mixed-version probe closure.

## Acceptance gates

- [ ] The exact failing executable, version, registry, and installation path are recorded.
- [ ] Every malformed manifest path in the selected closure is listed.
- [ ] The original bad files have size, timestamp, and SHA-256 evidence.
- [ ] The repair unit matches the owning installation channel.
- [ ] A clean isolated exact-version probe passes before production replacement.
- [ ] The repaired closure scans with `failed: 0`.
- [ ] Profile boot reaches composition without a JSON parser error.
- [ ] `--dump-config` succeeds for the intended profile.
- [ ] One real provider turn and one authorized tool call pass.
- [ ] Plugin settings and restart remain healthy.
- [ ] No duplicate Host-owned runtime packages appear in the profile.
- [ ] A second scan after cold restart remains clean, catching repeat external mutation.

## Upstream diagnostic contract

The source fix should route both inline parse sites through one private manifest reader. Filesystem errors should retain Node's native path and error code. Only `JSON.parse()` failures should be wrapped with the absolute manifest path and parser detail, while preserving the original `SyntaxError` as `cause`. Tests should cover the installation anchor and a nested dependency independently through the public fallback-healing entry point.

Improved diagnostics identify the damaged artifact; they must not auto-repair or delete it.

## Primary sources

- [Official corrupt-manifest report #3324](https://github.com/deepseek-ai/deepseek-harness/discussions/3324)
- [rc.8 profile fallback walker](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/boot/app-boot/src/profile.ts)
- [Official profile documentation](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/docs/profile.md)
- [Node.js package metadata contract](https://nodejs.org/api/packages.html)
- [npm cache integrity behavior](https://docs.npmjs.com/cli/commands/npm-cache)
