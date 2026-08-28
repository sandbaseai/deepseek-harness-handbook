---
title: DeepSeek Harness filesystem tools and HTTP(S) URLs
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-28
upstream_revision: cd5ef8148158c3a752a658978873241fdf8e2bbc
---

# When a filesystem tool mistakes an HTTP(S) URL for a local path

An Agent can pass a URL to `read`, `write`, `edit`, or `read_image` when it means “fetch this resource.” In the alpha.1 filesystem provider, that value is resolved as a local path instead. On Windows, the error can make the mistake look like a missing file inside the workspace; on POSIX, it is still a local-path lookup, not a network request.

This is a capability-boundary issue, not a reason to grant the filesystem tool network access. Filesystem tools should remain local; a web or fetch tool should own HTTP(S) retrieval.

## The failure shape

Upstream report [#4862](https://github.com/deepseek-ai/deepseek-harness/discussions/4862) reproduces the problem with:

```json
{
  "file_path": "https://raw.githubusercontent.com/Tencent/WeMM-Embedding/main/README.md"
}
```

On Windows, the provider may report a path shaped like:

```text
C:\Users\Work_01\Documents\Workspace\https:\raw.githubusercontent.com\Tencent\WeMM-Embedding\main\README.md: not found
```

That message is evidence of path coercion. It does **not** prove that the URL was fetched, that the remote file is unavailable, or that the workspace is missing a local file with that name.

The relevant alpha.1 implementation resolves the caller string with the session working directory before the filesystem operation. The same provider path is shared by the main file operations, so changing the working directory, adding a slash, or retrying the call does not turn it into a network request.

## Route the input by capability

| Input | Correct owner | Safe next step |
|---|---|---|
| `/workspace/notes.md` or `./notes.md` | local filesystem tool | keep the path and inspect sandbox policy |
| `https://example.test/data.json` | web/fetch or an explicitly approved HTTP client | use a network-capable tool and record the source URL |
| `file:///workspace/notes.md` | depends on the host contract | normalize only if the host explicitly documents URI support |
| `C:\workspace\notes.md` | local filesystem tool on Windows | preserve the Windows path; do not convert it to a URL |

Do not “fix” this by allowing the filesystem provider to download remote content. That would merge two permission domains and make an apparently read-only file call perform network I/O. Keep the rejection fail-closed and make the error actionable.

## A diagnostic split that avoids false conclusions

1. Preserve the original argument exactly, including its scheme and casing.
2. Classify the value before path resolution. At minimum, treat `http://` and `https://` (case-insensitive) as URI-like input.
3. If the filesystem tool rejects it, report the original value and say that only local paths are accepted.
4. If the task requires the remote resource, route it to a web/fetch capability and record the response status, final URL, and content hash where policy permits.
5. If a local path is intended, retry once with an explicit workspace-relative or absolute path—not with a different URL spelling.

An Agent-facing message should look like:

```text
read accepts local filesystem paths only; use the web/fetch tool for HTTP(S) URLs.
Received: https://example.test/data.json
```

The original input belongs in the diagnostic record. The resolved display path belongs only in local-path diagnostics; otherwise it hides the boundary the operator needs to repair.

## Provider and tool-boundary responsibilities

The guard belongs in the local filesystem provider because that is the security-relevant choke point below individual tools. A shared `assertLocalPath` (or equivalent) should run before any `resolve(cwd, input)` call and before policy evaluation. It should cover:

- `read`, `write`, `edit`, and `read_image`, which share the normal local-target resolution path;
- `list`/directory operations, which consume the resolved target; and
- `lstat`, which has a separate direct resolution call and must not bypass the guard.

The model-facing tool layer can translate a typed provider error such as `FS_URL_NOT_LOCAL` into the concise remediation above. Keeping the typed error in the provider preserves the invariant for host APIs and plugins that do not use the standard tool wrapper.

`glob` and `grep` require a separate audit: their search/subprocess implementation may not use the same local-target resolver. Do not claim coverage for them until a test exercises URL-shaped inputs through their actual provider path.

## Acceptance gates for a fix or plugin wrapper

- [ ] `http://` and `https://` are rejected before local path resolution on Windows and POSIX.
- [ ] The error preserves the original input and names the correct web/fetch alternative.
- [ ] `read`, `write`, `edit`, `read_image`, `list`, and `lstat` share the intended guard.
- [ ] `glob` and `grep` are tested separately, with their subprocess boundary documented.
- [ ] A filesystem rejection cannot trigger a network request as a side effect.
- [ ] A local path containing a colon for a documented platform reason is tested separately from URI-like input.
- [ ] The test records the provider/package revision; do not infer behavior from a Desktop wrapper version alone.

## Source boundary

This guide records an upstream alpha.1 behavior report and source review; it is not a claim that a patched release has shipped. The source revision is pinned to [`cd5ef8148158`](https://github.com/deepseek-ai/deepseek-harness/tree/cd5ef8148158c3a752a658978873241fdf8e2bbc). Track the upstream discussion for maintainer decisions and re-run the gates after an official fix.

