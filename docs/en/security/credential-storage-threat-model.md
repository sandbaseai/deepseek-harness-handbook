---
title: Protect API Keys in DeepSeek Harness with an Explicit Threat Model
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
upstream_revision: 141eb6fef83422698aef7a981029e843e8161534
---

# Protect API keys in DeepSeek Harness with an explicit threat model

DeepSeek Harness rc.8 stores credentials written by the Models page as plaintext values in:

    $DSH_HOME/.credentials.yaml

On POSIX, the local provider creates the home directory owner-only (<code>0700</code>) and the document <code>0600</code>. It rejects a document with group/other permission bits before parsing it. The browser receives only configured/source/writable descriptors after a write, never the secret value.

Those controls are useful, but they do not protect a credential from code running as the same OS user. The official provider documentation is explicit: Bash and filesystem tools can read the file because workspace-write constrains mutation, not general reads.

## Start with the attacker, not the cipher

| Threat | Plaintext <code>0600</code> | Ciphertext + adjacent file key | OS keychain / broker | Separate OS/VM identity |
|---|---|---|---|---|
| another unprivileged OS user | protected | protected | protected | protected |
| stolen backup containing only credentials file | exposed | protected | protected | protected |
| disk copied without machine-bound key | exposed | protected | protected | protected |
| same-UID process reading files | exposed | exposed if it can read both files | potentially protected by access policy | protected by identity boundary |
| Agent tool with arbitrary same-UID command execution | exposed | usually exposed | depends on whether tool can invoke broker/keychain | protected when outside boundary |
| compromised Harness process after secret resolution | exposed | exposed in memory | exposed in memory for request duration | blast radius limited to that identity |
| provider/account compromise | unaffected | unaffected | unaffected | unaffected |

Encryption at rest is not one property. State which artifact separation and which active process boundary it is meant to defend.

## What rc.8 already gets right

The credential seam separates references from values:

- settings and compositions contain a reference such as <code>DEEPSEEK_API_KEY</code>;
- the provider owns the actual value;
- consumers resolve once per operation, so rotation reaches the next model request;
- <code>describe()</code> returns no value;
- Models-page writes are write-only from the browser's perspective;
- YAML parse diagnostics never quote the secret-bearing source line;
- the managed document is not materialized into <code>process.env</code>;
- local writes use a cross-process writer lock and atomic replacement.

The local provider also has four explicit precedence layers:

    inherited process environment
      > managed .credentials.yaml
      > invocation-directory .env
      > DSH_HOME .env

An inherited environment value is read-only and wins. A Models-page write cannot silently shadow it.

## What file permissions do not solve

An Agent running tools under your login may be able to read:

- <code>$DSH_HOME/.credentials.yaml</code>;
- user and project <code>.env</code> files;
- shell history;
- cloud CLI credentials;
- SSH agents or sockets;
- browser or package-manager stores;
- adjacent encryption key files.

Hiding a path from the model prompt reduces accidental discovery; it is discretion, not access control. Renaming the file, using a dotfile, or excluding it from the selected workspace does not establish a same-UID read boundary.

## Evaluate an adjacent-key encryption design honestly

A cross-platform AES-GCM envelope with a random key in <code>$DSH_HOME/.key</code> can protect:

- backups that contain the encrypted store but not the key;
- cloud-sync mistakes that include only one artifact;
- offline disk copies where the key is machine-bound or separately excluded;
- accidental plaintext scanning.

It does not protect against a process that can read both files. It can also create new failure modes:

- backup restores one file but not the other;
- key rotation or reinstall makes the store undecryptable;
- a partial migration destroys the last readable copy;
- auth-tag failure is misdiagnosed as an empty store;
- hot reload retains a last-good in-memory secret after disk corruption;
- the encryption key is copied into logs, crash reports, or sync.

Do not “reset the store” automatically on authentication failure. Preserve the ciphertext, fail closed, and tell the operator which non-secret recovery artifact is needed.

## Prefer a replaceable credential provider

The existing seam is the right architecture for stronger storage: add a sibling provider rather than teaching every LLM adapter about encryption.

A keychain/broker provider should define:

1. stable credential references independent of backend record IDs;
2. value-free <code>describe()</code>;
3. per-operation resolution;
4. explicit access-control identity for the Harness process;
5. behavior in headless Linux and non-interactive services;
6. rotation and deletion semantics;
7. locked-session, denied-access, and prompt-required failures;
8. migration without exposing plaintext through argv, stdout, logs, or temporary files;
9. plugin disposal and secret-memory lifetime;
10. audit events that name the reference and source, never the value.

An OS keychain is not automatically an Agent boundary. If arbitrary tool commands can invoke the same keychain client under an authorized identity, the tool may still retrieve the secret. Test the complete call path and access policy.

## Strong operating patterns today

### Dedicated low-privilege runtime identity

Run the Harness under a separate OS account, container, or VM that has only:

- the selected disposable workspace;
- a short-lived provider credential with a low quota;
- no personal home, browser profile, SSH agent, cloud config, Docker socket, or package-publishing token;
- constrained network egress;
- an isolated <code>DSH_HOME</code>.

This is the strongest current defense against the Agent reading credentials owned by your normal user.

### Supervisor-injected environment

Inject a short-lived credential into the Harness process from CI, a service manager, or a secret broker. rc.8 treats inherited environment as the highest-priority read-only layer. Verify child-tool environment scrubbing, and remember that a compromised parent process can still inspect its own memory/environment.

### Limited managed file

If using the Models page:

1. use a dedicated project key, never a broad personal credential;
2. set provider-side spend, rate, model, and network restrictions;
3. keep <code>DSH_HOME</code> outside synced folders and repositories;
4. verify file/directory permissions and backup policy;
5. do not expose the normal user home to untrusted plugins or tools;
6. rotate after suspected disclosure.

Provider-side revocation remains authoritative even when local state is stale or another process copied the key.

## Migration contract for encrypted or keychain storage

A safe migration should:

1. stop every writer and watcher for the credential store;
2. inventory effective sources without printing values;
3. back up the original through a secret-approved channel;
4. create and verify the destination backend first;
5. transfer values in-process without command-line arguments or plaintext temp files;
6. resolve each reference through the new provider and perform one bounded request;
7. atomically switch provider ownership;
8. delete plaintext only after verification and rollback approval;
9. rotate keys if plaintext existed in untrusted backup/sync/history;
10. document how disaster recovery obtains both encrypted data and key authority.

Migration must preserve precedence. An inherited environment value may continue to shadow the migrated record until the process restarts without it.

## Incident response

If a same-UID Agent or plugin may have read a credential:

1. stop the affected runtime and detached children;
2. revoke or restrict the key at the provider;
3. preserve sanitized Session, process, and network evidence;
4. inventory every credential reachable by that identity, not only model keys;
5. rotate from a clean environment;
6. isolate the next run under a dedicated identity;
7. report no literal key, Authorization header, plaintext store, or secret-bearing screenshot.

Encrypting the old file after exposure does not revoke a copied bearer credential.

## Acceptance gates

- [ ] the protected threat and excluded threats are written down;
- [ ] browser and model surfaces never receive credential values;
- [ ] diagnostics never quote secret-bearing source lines;
- [ ] owner-only permission checks remain enforced where meaningful;
- [ ] an adjacent key is not described as a same-UID boundary;
- [ ] keychain retrieval is tested from both Harness and tool identities;
- [ ] headless/non-interactive failure behavior is defined;
- [ ] migration never uses argv or plaintext temporary files;
- [ ] auth failure preserves ciphertext and fails closed;
- [ ] rotation reaches the next operation;
- [ ] source precedence remains visible;
- [ ] backup and restore cover key authority separately;
- [ ] provider-side caps and revocation are tested;
- [ ] a compromised parent-process scenario is acknowledged;
- [ ] the production Agent runs under the narrowest practical identity.

## Primary sources

Verified against DeepSeek Harness rc.8 <code>141eb6fef83422698aef7a981029e843e8161534</code> on 2026-08-20.

- [Official API-key storage proposal #3503](https://github.com/deepseek-ai/deepseek-harness/discussions/3503)
- [rc.8 local credential provider security contract](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/credentials/credentials-local/README.md)
- [rc.8 local credential implementation](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/credentials/credentials-local/src/index.ts)
- [Credential seam and value-free descriptions](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/docs/subsystems/credentials.md)
- [Provider UI credential contract](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/docs/user/guide/providers.md)
- [Code Mode worker trust boundary](code-mode-worker-trust-boundary.md)
- [Community plugin security audit](community-plugin-audit.md)
