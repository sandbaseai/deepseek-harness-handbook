# Contributing

Thank you for helping developers understand and use DeepSeek Harness.

## Useful contributions

- Correct a claim against current official source.
- Add a reproducible Agent recipe with success and failure evidence.
- Improve an architecture diagram or troubleshooting path.
- Review a translation as a fluent speaker.
- Summarize an upstream change with its commit or documentation link.

Start with the [public roadmap](ROADMAP.md), propose an evidence-backed topic in [What should we verify next?](https://github.com/sandbaseai/deepseek-harness-handbook/discussions/99), or open a structured [documentation request](https://github.com/sandbaseai/deepseek-harness-handbook/issues/new?template=documentation-request.yml). Small, reviewable changes are encouraged.

### Add or validate an Awesome resource

If you are maintaining a public DeepSeek Harness plugin, Agent workflow, or companion tool, use the [resource validation template](https://github.com/sandbaseai/deepseek-harness-handbook/issues/new?template=resource-validation.yml). Include the exact repository or catalog URL, a pinned revision, one harmless probe with its observable result, and the permission/network boundaries. Remove credentials, private paths, and sensitive prompts before submitting. The handbook curates pointers; a submission is not an endorsement or a compatibility guarantee.

To refresh the curated map, compare the current Awesome `main` commit with the pinned revision before editing. Record the new full SHA, inspect only the changed catalog entries, and verify each selected repository is public and non-archived. Update the JSON index, its item count in the static page, the English/Chinese ecosystem rows, and `scripts/verify-resource-index.mjs` together. Run `npm run check:resources` and `npm run check:links`; do not silently move the pin when an entry is merely discovered through an unverified mirror.

## Choose the smallest useful evidence unit

You do not need to write a complete guide or spend money on a model request to contribute.

| Contribution | Minimum useful evidence |
|---|---|
| Correct a link, typo, or stale label | exact page and replacement |
| Correct a source claim | official file and pinned commit, with the smallest relevant symbol or line |
| Add one observed failure branch | exact DSH artifact, platform, command, first error, and whether the observation was reproduced |
| Verify one existing command | disposable environment, exit status, observable result, and cleanup outcome |
| Add a complete runbook | source interpretation plus a bounded reproduction, recovery path, and acceptance gates |
| Review a translation | locale, canonical revision, and the passages reviewed by a fluent speaker |

Partial evidence is welcome when its boundary is explicit. A Linux source verification does not prove a Windows runtime result; one successful model turn does not prove every provider; a browser refresh does not prove cold recovery. State exactly what you did and did not verify.

## Source policy

Use sources in this order:

1. DeepSeek Harness official documentation and source.
2. Cordis source and paper.
3. Reproducible experiments pinned to a commit.
4. Secondary material for interpretation or discovery.

State when a claim is an inference. Do not convert an observed implementation detail into a compatibility promise.

Pin source links to a full 40-character commit for version-sensitive behavior. Links to `master` or `main` are suitable only for project identity or deliberately rolling indexes. Record the published package version separately because npm artifacts and a source checkout are different evidence identities.

Useful read-only source commands include:

```sh
git rev-parse HEAD
git show <full-commit>:<path>
git grep -n '<symbol-or-error>' <full-commit> -- <path>
```

Do not paste a large upstream file into the handbook. Explain the contract in original language and link the primary source.

## Page contract

Every instructional page should include:

- audience and outcome;
- prerequisites;
- exact commands or configuration;
- field-level explanation where configuration is shown;
- observable success criteria;
- likely failure branches;
- safety, cleanup, or rollback notes;
- primary sources and verification date.

Version-sensitive canonical pages also declare `upstream_revision` in frontmatter. Increase `content_revision` when a reader-visible contract changes, then update the matching entry in `content-manifest.json`.

## Runtime evidence and privacy

Use a disposable Harness home, profile, workspace, Session, and limited credential whenever a reproduction needs execution. Prefer a model-free component test when it proves the same boundary. Never weaken approval or sandbox policy merely to make a test pass.

Before attaching output, remove or replace:

- API keys, cookies, tokens, credential values, and signed URLs;
- personal home names, private repository names, and internal hostnames;
- prompt or Session content unrelated to the failure;
- full environment dumps and complete settings or credential files;
- telemetry payloads containing tool arguments, results, or workspace paths.

Preserve structural evidence after redaction: event types and ordering, exit codes, error class, package versions, platform, file ownership boundary, and the first failing path. Say when redaction changed a value that matters to interpretation.

## Translation workflow

English is canonical. Simplified Chinese is the first full translation. Japanese, Korean, and Spanish start as reviewed navigation and high-demand pages, then expand by traffic and contributor demand.

Do not translate code identifiers, commands, package names, event names, or configuration keys. Update `content-manifest.json` with the source revision and translation status.

Run:

```bash
npm run check
npm run check:links
git diff --check
```

before opening a pull request. External hosts may rate-limit link probes; warnings are acceptable when the verifier completes successfully, while a nonzero exit is not.
