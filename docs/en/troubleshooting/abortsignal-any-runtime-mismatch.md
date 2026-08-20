---
title: Fix AbortSignal.any Is Not a Function in DeepSeek Harness
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-20
---

# Fix `AbortSignal.any is not a function`

Use this runbook when DeepSeek Harness Web starts, accepts a workspace, but sending a message fails with:

```text
AbortSignal.any is not a function (internal)
```

Treat this as a runtime-identity failure before treating it as a network failure. The exception is raised while the Harness composes cancellation signals; an offline network, provider endpoint, or API key cannot remove a JavaScript static method.

## Establish the compatibility invariant

Both DeepSeek Harness rc.7 and rc.8 declare:

```json
"engines": {
  "node": "^22.19.0 || >=24.0.0"
}
```

Node added `AbortSignal.any()` in 20.3.0 and 18.17.0. Every supported DSH Node line therefore includes it. rc.8 uses the method directly across the Agent loop, provider adapters, retry logic, terminal lifecycle, compaction, LSP, API gateway, Session title generation, and timeout utilities.

Consequently, a prompt that reports Node 24 or 25 while the running DSH process says `typeof AbortSignal.any !== 'function'` is contradictory evidence. Prove which executable and global the failing process actually owns.

## Capture the shell-visible runtime

In the same PowerShell window that launches DSH, run:

```powershell
Get-Command node | Format-List Source,Version
where.exe node
node -p "JSON.stringify({execPath:process.execPath,version:process.version,arch:process.arch,platform:process.platform,any:typeof AbortSignal.any,timeout:typeof AbortSignal.timeout,execArgv:process.execArgv})"
Get-Command dsh | Format-List Source,Definition
Get-Command npx | Format-List Source,Definition
npm prefix -g
npm root -g
"NODE_OPTIONS=$env:NODE_OPTIONS"
```

Expected proof includes one absolute `process.execPath`, a supported `process.version`, and both `any` and `timeout` reported as `function`.

Do not stop at `node --version`. `where.exe node` can reveal multiple installations, and the `dsh` or `npx` shim can resolve a different runtime after PATH changes, package-manager activation, service launch, or endpoint-security injection.

## Join the evidence to the running DSH process

While the failing Web Host is still running, inspect its process image:

```powershell
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
  Select-Object ProcessId,ParentProcessId,ExecutablePath,CommandLine |
  Format-List
```

Match the command line containing `@deepseek-ai/dsh` to its `ExecutablePath`. If CIM access is restricted, capture the executable path and command line from the approved endpoint-management or process-inspection tool instead; do not disable security software to obtain it.

Now classify the evidence:

| Evidence | Owner | Next action |
|---|---|---|
| shell probe reports old Node and `any: undefined` | PATH/runtime selection | install or select a supported runtime, then reinstall the CLI under that runtime |
| shell probe is healthy, DSH process uses another executable | launcher, shim, service, or PATH scope | repair that launch boundary and verify the child image |
| same executable reports `function` in a clean probe but DSH reports missing method | preload, wrapper, embedding layer, or injected code | inspect `NODE_OPTIONS`, command line, approved security logs, and loaded launch policy |
| same supported executable reports `undefined` even in a clean probe | damaged or nonstandard runtime distribution | replace it from a trusted offline artifact or approved internal mirror |
| `any` is a function and the error persists | wrong stack classification | preserve the full stack and identify the exact realm or bundled caller |

## Recover in an isolated network

An air-gapped host changes how you obtain artifacts, not the compatibility contract.

1. On a connected staging system, obtain an approved Node build that satisfies `^22.19.0 || >=24.0.0`, plus the exact DSH package and dependency closure.
2. Record checksums, signatures, filenames, architecture, Node version, DSH version, and package-manager version.
3. Transfer them through the organization's controlled media or artifact channel.
4. Install or activate the runtime in one explicit location.
5. Open a fresh PowerShell process so it receives the intended PATH.
6. Run the runtime probe again before reinstalling DSH.
7. Reinstall the exact DSH release with the verified runtime, then launch a fresh Session and send one harmless prompt.

Use the same artifact set for rollback. Clearing the npm cache repeatedly does not change the Node global owned by a running process and discards useful provenance.

## Do not polyfill the invariant blindly

Avoid patching compiled DSH files or assigning a quick replacement to `AbortSignal.any`. The Harness relies on first-abort reason propagation across retry, timeout, cancellation, and cleanup boundaries. A superficially compatible helper can lose the controlling reason, leak listeners, or make a cancelled tool continue running.

Do not disable endpoint security, remove enterprise launch policy, or grant broader execution privileges merely to make the method appear. If injection is suspected, reproduce with the security team in an approved test policy and compare the exact executable plus global descriptor.

For a controlled diagnostic only, capture the descriptor without secrets:

```powershell
node -p "JSON.stringify(Object.getOwnPropertyDescriptor(AbortSignal,'any'))"
```

## Acceptance gates

- The running DSH process uses the same absolute Node executable that was probed.
- The Node version satisfies the DSH `engines` declaration.
- `typeof AbortSignal.any` and `typeof AbortSignal.timeout` are both `function` before DSH starts.
- No unexplained `NODE_OPTIONS` preload or alternate launcher remains.
- A new Session sends one harmless prompt without the internal exception.
- Cancellation still stops a bounded model request and one bounded tool call.
- The offline artifact checksum and provenance are retained.
- The old runtime and exact DSH package remain available for rollback.
- Existing Session data is preserved; runtime repair does not rewrite it.
- Security controls remain enabled unless the responsible team authorizes a bounded A/B test.

## Source boundary

Verified against DeepSeek Harness rc.8 commit `141eb6fef83422698aef7a981029e843e8161534` and the rc.7 report in upstream Discussion #3520. The report names Node 25.6.0, which should expose the method; that mismatch is evidence to investigate, not proof that Node 25 lacks the API.

- [Upstream isolated-network Windows report #3520](https://github.com/deepseek-ai/deepseek-harness/discussions/3520)
- [rc.8 Node engine declaration](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/package.json)
- [rc.8 DeepSeek adapter signal composition](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/llm/llm-deepseek/src/adapter.ts)
- [rc.8 timeout signal semantics](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/util/timeout/src/index.ts)
- [Node.js `AbortSignal.any()` documentation](https://nodejs.org/api/globals.html#static-method-abortsignalanysignals)
- [Air-gapped rc.8 source-build guide](../getting-started/air-gapped-source-build.md)
