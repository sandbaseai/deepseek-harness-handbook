# Support and question routing

Choose the destination that owns the problem. This keeps runtime bugs visible to DeepSeek AI while letting the handbook correct its own claims.

| You need to… | Use this route |
|---|---|
| Correct a handbook command, claim, diagram, link, or translation | [Handbook bug report](https://github.com/sandbaseai/deepseek-harness-handbook/issues/new?template=bug-report.yml) |
| Request a source-backed guide or reproduction | [Documentation request](https://github.com/sandbaseai/deepseek-harness-handbook/issues/new?template=documentation-request.yml) |
| Suggest or validate a community plugin, skill, or Agent tool | [Resource validation request](https://github.com/sandbaseai/deepseek-harness-handbook/issues/new?template=resource-validation.yml) |
| Ask which layer owns an Agent failure | [Handbook Q&A](https://github.com/sandbaseai/deepseek-harness-handbook/discussions/categories/q-a) |
| Report a DeepSeek Harness runtime bug or request a runtime feature | [Official DeepSeek Harness discussions](https://github.com/deepseek-ai/deepseek-harness/discussions) |
| Report a private security or conduct concern | Follow [SECURITY.md](SECURITY.md) |

Before opening a report, preserve the exact DSH artifact or source revision, operating system, interface, first failing boundary, and the smallest sanitized evidence that distinguishes the failure. Do not attach API keys, tokens, signed URLs, credential values, private paths, unrelated prompts, or complete Session and settings files.

This repository is maintained by SandBase as an independent community handbook. It cannot provide official DeepSeek AI support, account recovery, billing intervention, private debugging, or production guarantees.

For resource submissions, include a pinned commit and a harmless observed probe. The [Agent-first catalog audit](docs/en/ecosystem/awesome-resources.md#copyable-evidence-template) explains the minimum evidence and rollback fields.
