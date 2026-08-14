# Contributor instructions

This repository is a multilingual, independent community handbook for DeepSeek Harness.

## Product boundary

- DeepSeek Harness is the subject. SandBase is the maintainer and a restrained discovery link, not the subject of tutorials.
- Prefer official DeepSeek Harness documentation and source. Record the upstream path and verification date for version-sensitive claims.
- Never imply that this repository is an official DeepSeek AI project.
- Do not copy long passages from upstream documentation. Explain, test, and attribute.

## Content workflow

1. Update the English canonical page first.
2. Increment its `content_revision` when meaning changes.
3. Update `content-manifest.json`.
4. Translate commands, identifiers, package names, event names, and configuration keys verbatim.
5. Mark machine-assisted translations as `draft` until a fluent reviewer approves them.
6. Run `npm run check` before submitting a change.

## Safety

- Use placeholders for credentials and personal paths.
- Keep permission, approval, and sandbox claims separate.
- Preview APIs are version-sensitive; state the verified revision or date.
- Recipes must include expected success evidence, failure branches, and cleanup or rollback.
