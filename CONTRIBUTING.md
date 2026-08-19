# Contributing

Thank you for helping developers understand and use DeepSeek Harness.

## Useful contributions

- Correct a claim against current official source.
- Add a reproducible Agent recipe with success and failure evidence.
- Improve an architecture diagram or troubleshooting path.
- Review a translation as a fluent speaker.
- Summarize an upstream change with its commit or documentation link.

Start with the [public roadmap](ROADMAP.md), propose an evidence-backed topic in [What should we verify next?](https://github.com/sandbaseai/deepseek-harness-handbook/discussions/99), or open a structured [documentation request](https://github.com/sandbaseai/deepseek-harness-handbook/issues/new?template=documentation-request.yml). Small, reviewable changes are encouraged.

## Source policy

Use sources in this order:

1. DeepSeek Harness official documentation and source.
2. Cordis source and paper.
3. Reproducible experiments pinned to a commit.
4. Secondary material for interpretation or discovery.

State when a claim is an inference. Do not convert an observed implementation detail into a compatibility promise.

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

## Translation workflow

English is canonical. Simplified Chinese is the first full translation. Japanese, Korean, and Spanish start as reviewed navigation and high-demand pages, then expand by traffic and contributor demand.

Do not translate code identifiers, commands, package names, event names, or configuration keys. Update `content-manifest.json` with the source revision and translation status.

Run:

```bash
npm run check
```

before opening a pull request.
