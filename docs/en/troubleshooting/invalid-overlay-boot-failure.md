---
title: Unbrick DeepSeek Harness After an Invalid Overlay
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
---

# Unbrick DeepSeek Harness after an invalid overlay

A row inserted into `cordis.patch.yml` can name a package that the selected profile cannot resolve:

```yaml
- insert:
    - id: probe
      name: '@example/not-installed'
```

On a cold start, the Loader tries to import every enabled entry. An unresolved module makes boot fail loud, the partial tree is disposed, and a Web surface disappears with it. This is not a degraded plugin row.

The recovery control plane is therefore outside Web: stop the process, preserve the user layers, reduce them to a known-good composition, and only then restore the intended change.

## First classify the layer

A profile boot applies configuration in this order:

1. bundle patches listed in `profiles/<name>/package.json`;
2. `profiles/<name>/cordis.patch.yml`;
3. the home-level `$DSH_HOME/cordis.patch.yml`;
4. command-line `--patch` files; and
5. launcher-derived patches.

The profile and home patch files are live-reloaded on a running surface. A rejected live candidate leaves the last good tree running. The same invalid bytes still fail on the next cold boot because there is then no previous tree to retain.

| Evidence | Likely owner |
|---|---|
| failure began after editing one profile | profile `cordis.patch.yml` |
| every profile now fails | home-level `cordis.patch.yml` |
| failure requires one command invocation | its `--patch` file |
| error names a package in `dsh.profile.bundles` | profile manifest or plugin lifecycle |
| YAML parse error before any Loader entry | the named patch file's syntax |
| `ERR_MODULE_NOT_FOUND` names an inserted row | package resolution from the profile root |

## Preserve evidence before editing

Stop every DSH process that can watch or write the affected profile. Copy, do not move, these files to a timestamped recovery directory:

- the profile's `package.json`;
- the profile's `cordis.patch.yml`;
- the home-level `cordis.patch.yml`, when present;
- `pnpm-lock.yaml` and `pnpm-workspace.yaml`;
- the complete first boot error and command line; and
- the output of `node --version`, `pnpm --version`, and the installed DSH version.

Record hashes of the copies. Do not delete `node_modules`, the lockfile, Sessions, or the whole Harness home: none of those actions identifies the bad row.

## Prove the shipped composition still parses

The rc.8 CLI has a recovery-specific command:

```bash
dsh --profile web --dump-default-config > web.default.yml
```

`--dump-default-config` deliberately omits the profile user layer, the home user layer, and command-line overlays. If it fails, the problem is below those layers: a profile manifest, bundle, installed package, or shipped artifact.

If it succeeds, it proves that the bundle-only composition parses. It does not prove that a user-inserted module can import.

## Return the active user layers to a known-good state

With the evidence copies preserved, edit the active profile and home `cordis.patch.yml` files. A valid empty layer is exactly:

```yaml
[]
```

An empty or comment-only file is not equivalent; it parses to no value and is rejected because every patch file must contain a top-level array.

Start with the layer implicated by the evidence. If ownership is uncertain, reduce both user layers to `[]` temporarily, then test:

```bash
dsh --profile web --dump-config > web.recovered.yml
dsh --profile web
```

The first command verifies parsing and composition. The second is the import-and-activation proof. A successful dump alone is insufficient because offline composition does not import inserted modules or evaluate their runtime lifecycle.

## Decide whether the row or the package was wrong

Do not immediately install whatever string appears in `ERR_MODULE_NOT_FOUND`.

### The row was accidental

Leave it out. Compare the preserved layer with the empty baseline and reintroduce reviewed patches one bounded group at a time. After each group, require both `--dump-config` and an isolated boot.

### The package was intended

Install it through the profile lifecycle, not by manually editing `node_modules`:

```bash
dsh plugin --profile web add <reviewed-package-spec>
```

Then verify:

1. the command exits zero;
2. the exact dependency and integrity are present in the profile manifest and lockfile;
3. the package's declared runtime exports exist;
4. a bundle package declares a readable `dsh.bundle.patch`;
5. the resolved bundle list changed only as intended; and
6. the profile boots before any raw insert is restored.

A raw plugin row and a bundle package are different mechanisms. The plugin command reconciles bundle declarations; it does not make an arbitrary inserted module safe.

## Test bare-module resolution from the profile root

For a raw inserted package, test the same profile-root resolution boundary before writing the row:

```bash
cd "$DSH_HOME/profiles/web"
node -e "console.log(require('node:module').createRequire(process.cwd() + '/package.json').resolve(process.argv[1]))" '@example/package'
```

A printed absolute path proves only that Node can resolve the specifier from that profile. It does not prove the export can load, its peer graph is singular, or its Cordis lifecycle will activate.

For a local module, prefer an explicit path anchored to the patch file and test the built export—not the source directory name.

## Never use these shortcuts

- Do not weaken fail-loud boot into “ignore every missing plugin.” A missing policy, sandbox, or persistence provider is not a safe degraded runtime.
- Do not install an unreviewed package merely because an error names it.
- Do not hand-add a dependency into `package.json` without the lockfile and profile plugin lifecycle.
- Do not overwrite the only copy of either user layer.
- Do not test recovery against the production Session root or credential set.
- Do not assume Web can repair a configuration that prevents Web from starting.

## Transactional writer contract

Any UI, plugin store, or automation that edits a user layer should implement this transaction:

```text
resolve package and exports
  → parse candidate patch
  → compose against exact profile
  → snapshot manifest + lock + layers
  → boot and health-probe an isolated candidate
  → atomically promote on success
  → restore snapshot on failure
```

A future offline `dsh --profile <name> --check` could unify these gates. In rc.8, `--dump-config` is a valuable parse/composition check but not a complete pre-boot resolver or activation check.

## Recovery acceptance gates

Recovery is complete only when:

- the original failing bytes and first error are preserved;
- `--dump-default-config` proves the bundle-only baseline;
- the active user layers are valid top-level arrays;
- `--dump-config` shows the intended composition and no unexpected rows;
- every inserted bare package resolves from the profile root;
- the selected profile boots and reaches its surface readiness signal;
- a fresh Session completes a bounded read-only task;
- restart succeeds from the same persisted files;
- no Session, credential, or unrelated profile was deleted; and
- the rejected candidate can no longer become active through a second user layer.

## Primary sources

- [rc.8 profile composition and resolution](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/boot/app-boot/src/profile.ts)
- [rc.8 profile boot and user-layer ordering](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/apps/cli/src/profile-boot.ts)
- [rc.8 dump-config recovery boundary](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/apps/cli/src/dump-config.ts)
- [rc.8 app-boot profile documentation](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/boot/app-boot/README.md#profiles)
- [Official invalid-overlay discussion](https://github.com/deepseek-ai/deepseek-harness/discussions/3473)

## Related handbook guides

- [Recover a plugin installation](plugin-install-recovery.md)
- [Recover a Git plugin missing its built export](git-plugin-missing-dist.md)
- [Recover a partial plugin add](plugin-add-nonzero-reconcile.md)
- [Audit a community plugin](../security/community-plugin-audit.md)
