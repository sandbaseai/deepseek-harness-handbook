---
title: Fix npm ETARGET When Installing DeepSeek Harness rc.8
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
---

# Fix npm `ETARGET` for `dsh-agent-loop@^0.1.0-rc.8`

An rc.8 install can stall in npm's `idealTree` phase and then report:

```text
npm error code ETARGET
npm error notarget No matching version found for
npm error notarget @deepseek-ai/dsh-agent-loop@^0.1.0-rc.8.
```

At the verification time, `@deepseek-ai/dsh-agent-loop@0.1.0-rc.8` **does exist** on the official npm registry. This error therefore does not, by itself, prove that the package was never published. It can mean the resolving client, registry mirror, proxy, or cache is serving a packument that predates the rc.8 publication.

The recovery goal is not “clear everything.” It is to identify which metadata authority cannot see the requested version, prove a fresh resolution, and preserve enough evidence to distinguish publication lag from a genuinely broken release graph.

## Capture the resolver identity first

Run these before changing the cache:

```bash
node --version
npm --version
npm config get registry
npm config get cache
npm view @deepseek-ai/dsh@0.1.0-rc.8 version --json
npm view @deepseek-ai/dsh-agent-loop versions --json
```

Then ask the official registry explicitly:

```bash
npm view @deepseek-ai/dsh-agent-loop@0.1.0-rc.8 \
  version dist.tarball dist.integrity \
  --json --registry=https://registry.npmjs.org/
```

On 2026-08-20, the official result includes version `0.1.0-rc.8` and an integrity beginning with:

```text
sha512-6Vg5oLy3UZ6lJKMPxldqqBylKSMOpbV/...
```

Do not hardcode that digest as a future trust root. Record the complete value returned by the authoritative registry for the exact version you are installing.

## Route the evidence

| Default registry | Official npm registry | Meaning |
|---|---|---|
| rc.8 visible | rc.8 visible | local cache or install-state issue is most likely |
| rc.8 absent | rc.8 visible | mirror/proxy replication or caching gap |
| rc.8 absent | rc.8 absent | publication is unavailable; stop and report the release graph |
| different integrity | authoritative metadata conflict; do not install until resolved |
| request times out | network, proxy, DNS, TLS, or registry availability—not `ETARGET` yet |

The configured registry matters. A command that succeeds against `registry.npmjs.org` does not prove a corporate Artifactory, Verdaccio, or regional mirror is current.

## Why `--prefer-offline` exposes stale metadata

npm resolves dependency ranges from package metadata often called a packument. During a multi-package prerelease, package versions become visible across caches and mirrors over time. If the resolver cached `dsh-agent-loop` metadata before rc.8 appeared, `--prefer-offline` can reuse the older version list and conclude that `^0.1.0-rc.8` has no target.

The rc.8 CLI manifest contains many internal dependencies constrained to `^0.1.0-rc.8`. The first package named by `ETARGET` is the first missing answer encountered; it is not proof that every other package is available through the same metadata path.

Dist-tags are a separate coordinate. At verification time:

```text
@deepseek-ai/dsh-agent-loop latest = 0.1.0-rc.6
@deepseek-ai/dsh-agent-loop next   = 0.1.0-rc.8
```

An explicit dependency range can still resolve rc.8 even when `latest` points to rc.6. A stale dist-tag may confuse humans and bare installs, but it is not itself the reason a fresh semver query cannot match `^0.1.0-rc.8`.

## Prove with an isolated cache

Avoid deleting the shared npm cache as the first move. Use a temporary, empty cache for one controlled probe.

### PowerShell

```powershell
$probeCache = Join-Path $env:TEMP "dsh-npm-rc8-probe"
New-Item -ItemType Directory -Force $probeCache | Out-Null

npx -y --cache $probeCache \
  --registry=https://registry.npmjs.org/ \
  @deepseek-ai/dsh@0.1.0-rc.8 --version
```

### POSIX shell

```bash
probe_cache="$(mktemp -d)"
npx -y --cache "$probe_cache" \
  --registry=https://registry.npmjs.org/ \
  @deepseek-ai/dsh@0.1.0-rc.8 --version
```

Expected evidence is exactly:

```text
0.1.0-rc.8
```

If this succeeds while the ordinary command fails, the release exists and the difference is local cache or configured-registry state. If it fails, preserve the verbose npm log and the exact registry URL.

## Recover the intended environment

After the isolated probe succeeds, choose the path that matches your environment:

### Direct npm users

Retry once without `--prefer-offline` and with an explicit version:

```bash
npx -y --registry=https://registry.npmjs.org/ \
  @deepseek-ai/dsh@0.1.0-rc.8 --version
```

Use the normal configured registry again only after it reports the same version and integrity.

### Mirror or enterprise-registry users

Do not silently bypass organizational policy for production installation. Give the registry operator:

- the exact scoped package and version;
- official npm's version, tarball URL, and integrity;
- the mirror's returned version list or `ETARGET` response;
- timestamps and cache headers where available; and
- every other rc.8 internal package that the mirror cannot resolve.

Wait for replication or invalidate only the affected metadata entry through the registry's supported administration path.

### Shared workstation or CI cache

Prefer a job-scoped cache key that includes registry identity, Node major, npm major, lockfile digest, and requested DSH version. A cache created before the prerelease must not be treated as proof that the prerelease does not exist.

## Do not use these shortcuts

- Do not install an unversioned `latest` and assume it is rc.8; the dist-tag can point to an older candidate.
- Do not add `--legacy-peer-deps` as the ETARGET fix. Peer-resolution behavior may change the path or timing, but it cannot create a missing package version in stale metadata.
- Do not keep `--prefer-offline` during the first post-publication proof.
- Do not globally delete a shared cache before capturing registry and packument evidence.
- Do not replace an internal rc.8 dependency with rc.7. The release family is designed and tested as a coordinated graph.
- Do not download a tarball from an unverified mirror when its integrity disagrees with the authoritative registry.
- Do not use a successful `npm view` from one registry to claim another registry is healthy.

## Release-publisher gates

A multi-package release needs registry-visible graph validation, not only successful `npm publish` commands.

- [ ] Every internal dependency version exists on the authoritative registry.
- [ ] Every declared semver range resolves to the intended release candidate.
- [ ] Tarball integrity is readable after publication.
- [ ] A clean-cache install succeeds from the official registry.
- [ ] `npx @deepseek-ai/dsh@<exact> --version` succeeds on supported Node/npm combinations.
- [ ] The install is repeated after a short propagation interval from a second network or registry edge.
- [ ] Release-family packages receive consistent `next` tags.
- [ ] The user-facing CLI tag policy is documented separately from internal-package tags.
- [ ] The release announcement begins only after the complete graph passes.
- [ ] A failed partial publication has a documented retry or deprecation procedure.

## Route neighboring install failures

| Symptom | First boundary |
|---|---|
| `ETARGET No matching version found` | registry/cache metadata and release graph |
| `EAI_AGAIN`, timeout, or TLS error | network, DNS, proxy, CA, or registry availability |
| `ERESOLVE unable to resolve dependency tree` | peer-dependency constraints |
| `EBADENGINE` | Node/npm engine contract |
| package installs but `lib/` export is missing | package contents or blocked build script |
| global plugin cannot resolve native binding | isolated global dependency topology |
| CLI starts but prints another version | dist-tag or executable resolution |

## Incident bundle

Attach:

- OS, Node, npm, and exact DSH version;
- configured registry and whether it is a mirror or proxy;
- `npm view` results from both configured and official registries;
- the exact missing package/range and all later missing rc.8 packages;
- whether `--prefer-offline` was active;
- isolated-cache probe result;
- complete npm debug-log path and relevant resolver lines; and
- timestamps relative to the release publication.

## Primary sources

- [Official discussion #3461](https://github.com/deepseek-ai/deepseek-harness/discussions/3461)
- [rc.8 CLI dependency manifest](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/apps/cli/package.json)
- [Official rc.8 release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.0-rc.8)
- [npm package: `@deepseek-ai/dsh-agent-loop`](https://www.npmjs.com/package/@deepseek-ai/dsh-agent-loop)
