# Changelog

All notable handbook and publishing changes are recorded here. DeepSeek Harness itself has a separate upstream release history.

## 0.5.393 - 2026-08-30

### Added

- Added the write-side prevention model from upstream #4942: durable append watermarks, per-session writer exclusion, and executor leases before recovery closers.

## 0.5.392 - 2026-08-30

### Added

- Expanded session-corruption triage with upstream #3896: stale recovery cursors can replay committed events, create duplicate sequences, and leave a missing durable range after restart.

## 0.5.391 - 2026-08-30

### Added

- Added the Braintrust DeepSeek Harness tracing integration to the ecosystem guide, with Agent-turn, tool-call, child-Session, API-key, and data-residency boundaries from upstream #4960.

## 0.5.390 - 2026-08-30

### Added

- Expanded the pi-ai retry runbook with upstream #4361: punctuated `network_error` finish reasons can miss a word-boundary classifier and bypass bounded transport retry.

## 0.5.389 - 2026-08-30

### Added

- Added root-navigation guidance from upstream #4963: keep URL visits idempotent and prevent unstarted ghost Sessions from polluting history, search, and metrics.

## 0.5.388 - 2026-08-30

### Added

- Expanded the context-window runbook with upstream #4956: self-hosted vLLM may return flat error JSON, preventing automatic overflow classification and compaction retry.

## 0.5.387 - 2026-08-30

### Changed

- Corrected the Windows subprocess guidance from upstream #4713: `os.kill(pid, 0)` can broadcast Ctrl+C through a shared console and terminate the Host; the guide now separates child, Host, desktop, and renderer evidence.

## 0.5.386 - 2026-08-30

### Changed

- Aligned the LLM index and Atom feed with the latest published release pointer (`v0.5.385`).

## 0.5.382 - 2026-08-30

### Added

- Expanded the Python SDK quickstart with the restart-resume boundary from upstream discussion #4954, including `id collision` evidence, a lossy history-replay workaround, and acceptance checks that preserve the original session log.

## 0.5.380 - 2026-08-30

### Added

- Expanded the pinned Awesome DeepSeek Harness map to 52 curated resources, adding bilingual plugin discovery, profile backup/recovery, and plugin workshop workflows.
- Added a release-loop note explaining how to diff snapshots, re-audit changed entries, and preserve historical references without turning a catalog into a trust list.

## 0.5.379 - 2026-08-30

### Changed

- Aligned the homepage ecosystem card with the 49-resource JSON map.

## 0.5.374 - 2026-08-30

### Added

- Added a source-backed Agent-first guide for evaluating the dsh-codex-ui Web client plugin, including extension-point ownership, Session preservation, acceptance probes, and rollback.

## 0.5.373 - 2026-08-30

### Changed

- Aligned README, LLM index, and Atom feed discovery copy with the verified 49-resource Awesome map.

## 0.5.372 - 2026-08-30

### Added

- Added the bilingual `fendouai/awesome-deepseek-harness` community catalog mirror to the Agent-first resource map.

## 0.5.371 - 2026-08-30

### Changed

- Refreshed public release entry points after pinning Awesome catalog links to snapshot `c2cc7c97`.

## 0.5.370 - 2026-08-30

### Changed

- Replaced stale Awesome catalog links in the English, Chinese, and JSON resource maps with the pinned `c2cc7c97` snapshot.

## 0.5.365 - 2026-08-30

### Added

- Added a request-extension boundary runbook for plugin inventory preparation failures from upstream discussion #4950.

## 0.5.364 - 2026-08-30

### Added

- Added a Web renderer runbook for the dollar-as-math display bug from upstream discussion #4951, separating projection damage from intact stored content.

## 0.5.363 - 2026-08-30

### Changed

- Corrected public multilingual-document counts to match the content verifier's current 196-document result.

## 0.5.362 - 2026-08-30

### Changed

- Corrected public resource-page canonical-guide count and Atom feed update timestamp to match the latest published content.

## 0.5.361 - 2026-08-30

### Changed

- Expanded Session framing performance guidance with the measured zstd level tradeoff and corpus-gated writer acceptance from upstream discussion #4948.

## 0.5.360 - 2026-08-30

### Added

- Added a Session framing performance guide based on upstream measurement #4949, separating decompression, parsing, physical frame merging, and UI projection costs.

## 0.5.359 - 2026-08-30

### Added

- Added an Agent-first evaluation guide for nested follow-up Sessions, based on upstream discussion #4938 and the dsh-nested-followups project.

## 0.5.357 - 2026-08-30

### Changed

- Promoted the two newest UI and Session resources in the README ecosystem discovery sentence for better search and first-visit routing.

## 0.5.356 - 2026-08-30

### Added

- Added the public `dsh-nested-followups` project to the Agent-first resource map, with ancestry, isolation, and tool-scope review guidance.

## 0.5.355 - 2026-08-30

### Added

- Added the public `dsh-codex-ui` project to the Agent-first resource map, covering its DSH Web extension-point and session-navigation boundaries.

## 0.5.353 - 2026-08-30

### Changed

- Refreshed the visual homepage's latest field-signal date after the v0.5.352 upstream runbook update.

## 0.5.352 - 2026-08-30

### Changed

- Expanded plugin-install recovery with a source-backed pnpm 11 `allowBuilds` approval runbook for registry packages from upstream discussion #3699.

## 0.5.350 - 2026-08-30

### Changed

- Refreshed the resource-page metadata and repository description to expose the current 38-resource Agent-first map.

## 0.5.348 - 2026-08-30

### Added

- Added the public `dsh-corrupt-session-repair` project to the Agent-first Awesome resource map, with privacy and repair-boundary guidance.

## 0.5.347 - 2026-08-29

### Added

- Added a Session write-integrity architecture note based on upstream discussion #4942, covering durable watermarks, per-Session writer exclusion, recovery leases, and torn-tail verification.

## 0.5.346 - 2026-08-29

### Added

- Added a resumed-Agent tool-view runbook based on upstream discussion #4946, separating bridge disposal lifecycle from core scope binding.

## 0.5.345 - 2026-08-29

### Added

- Added an ACP inline-image and Python SDK contract runbook based on upstream discussion #4943, including the file-mode false-positive boundary.

## 0.5.344 - 2026-08-29

### Added

- Added a source-backed Windows post-install Web startup runbook for the `dsh web` CPU busy-loop and missing listener report in upstream discussion #4944.

## 0.5.343 - 2026-08-29

### Added

- Added a source-backed installation runbook for whitespace-corrupted `DSH_HOME` values that silently resolve a new empty data root (upstream discussion #2153).

## 0.5.342 - 2026-08-29

### Added

- Added a source-backed custom-provider multi-protocol discovery runbook based on upstream discussion #4947, including explicit per-model API declarations and endpoint verification.

## 0.5.341 - 2026-08-29

### Changed

- Linked the v0.5.334 Show & Tell from the English and Simplified Chinese README discovery paths.

## 0.5.340 - 2026-08-29

### Changed

- Added a dedicated `resource-validation` label and attached it to the Awesome resource Issue template for focused community triage.

## 0.5.339 - 2026-08-29

### Changed

- Updated the visual homepage ecosystem card to expose the verified 37-resource count and pinned Awesome snapshot as the starting point.

## 0.5.338 - 2026-08-29

### Added

- Extended the resource-index verifier to enforce English and Simplified Chinese README counts alongside the JSON and static-page ItemList count.

## 0.5.337 - 2026-08-29

### Fixed

- Corrected the English README resource-map sentence to match the verified 37-item index.

## 0.5.336 - 2026-08-29

### Changed

- Added a repeatable procedure for refreshing the pinned Awesome catalog and keeping the JSON, static page count, multilingual rows, and verifier synchronized.

## 0.5.335 - 2026-08-29

### Changed

- Documented the resource-validation submission loop in `CONTRIBUTING.md`, linking the structured Issue template and its privacy/evidence requirements.

## 0.5.334 - 2026-08-29

### Added

- Updated the Awesome source pin to `c2cc7c97` and added the latest public desktop lifecycle resources: `dsh-tray` and `dsh-whale-musume`.

## 0.5.333 - 2026-08-29

### Changed

- Surfaced the 35-resource Awesome map and its newest Agent workflow entries in the high-traffic English and Simplified Chinese README entry points.

## 0.5.332 - 2026-08-29

### Added

- Added four public Awesome catalog resources for Agent workflow assembly, skill migration, Hacker News research intake, and session replay.

## 0.5.331 - 2026-08-29

### Added

- Added a structured Awesome resource validation Issue template that captures capability, pinned revision, harmless probe evidence, and permission/network boundaries.

## 0.5.330 - 2026-08-29

### Fixed

- Corrected the visible multilingual coverage count from 189 to 191 after adding the SandBase bridge translations.

## 0.5.329 - 2026-08-29

### Fixed

- Make Pages deployments cancel superseded runs and allow a longer deployment window, reducing queued installation-API requests during rapid content iteration.

## 0.5.328 - 2026-08-29

### Changed

- Surfaced the SandBase Harness MCP bridge guide in both the canonical English and high-traffic Chinese README navigation.

## 0.5.327 - 2026-08-29

### Fixed

- Added the missing consumer-guide anchor and explicit LLM index link for the SandBase Harness bridge page so machine-directed visitors land on the intended section.

## 0.5.326 - 2026-08-29

### Added

- Added a dedicated static SandBase Harness bridge page and surfaced it from the handbook homepage and sitemap for direct discovery by SandBase users.

## 0.5.325 - 2026-08-29

### Added

- Added English and Chinese runbooks for connecting SandBase Harness through its DeepSeek Harness stdio MCP bridge, including bounded setup, seam probes, permission checks, and rollback evidence.

## 0.5.324 - 2026-08-29

### Changed

- Synchronized the Awesome ecosystem map to revision 4 across English, Chinese, Japanese, Korean, and Spanish, adding the high-signal community projects to every reviewed language entry.

## 0.5.323 - 2026-08-29

### Added

- Added an automated resource-index verifier and CI step that keeps JSON entries, snapshot provenance, URL uniqueness, and ItemList counts aligned.

## 0.5.322 - 2026-08-29

### Changed

- Added search keywords and ItemList structured data to the 31-entry Awesome resource page so search engines and Agent indexers can identify its scope and count.

## 0.5.321 - 2026-08-29

### Added

- Added six high-signal public community projects to the Awesome resource map and JSON index, including plugin discovery, context observability, vision, Agent teams, and field-guide paths.

## 0.5.320 - 2026-08-29

### Fixed

- Replaced 11 withdrawn or private `dsh-external` direct links in the Awesome resource maps with a pinned catalog snapshot reference, preserving provenance while preventing dead-link failures.

## 0.5.319 - 2026-08-29

### Added

- Added `curl`/`jq` and Node.js examples for consuming the Awesome resource index without coupling discovery to installation.

## 0.5.317 - 2026-08-29

### Changed

- Added a community validation issue and linked it from the resource map and README so catalog corrections can be submitted with reproducible evidence.

## 0.5.316 - 2026-08-29

### Added

- Added a machine-readable JSON index of 25 Agent-first resources selected from the pinned Awesome DeepSeek Harness catalog, with capability labels, source links, and verification boundaries.
- Exposed the JSON index from the visual resource map, README, and sitemap for Agent workflows and search discovery.

## 0.5.304 - 2026-08-28

### Changed

- Extended the workspace recovery runbook with an evidence-first branch for same-name parent/child directories and workspace-scoped skill discovery, based on upstream Discussion #4927.

## 0.5.303 - 2026-08-28

### Added

- Added an English canonical and Chinese reviewed runbook for upstream Discussion #4926, separating client-page refusals from Host settlement and defining a bounded Cordis inspect timeout contract.
- Updated coverage to 162 canonical pages and 186 localized documents.

## 0.5.302 - 2026-08-28

### Changed

- Added a visible ecosystem entry to the static homepage so visitors can reach the capability map without first reading the repository README.

## 0.5.301 - 2026-08-28

### Added

- Expanded the Awesome DSH capability map with Cordis examples, manifest checks, cross-tool Session import, Agent budgets, read-only security audit, and schema-safe tools.

## 0.5.300 - 2026-08-28

### Added

- Added an English canonical and Chinese reviewed capability map derived from the CC0 Awesome DeepSeek Harness catalog, with safety-aware selection and installation boundaries.
- Updated coverage to 161 canonical pages and 184 localized documents.

## 0.5.299 - 2026-08-28

### Added

- Added a reviewed Chinese localization of the Tool Execution Pipeline guide, including Permission/Approval/Guard/Sandbox boundaries and the #4906 waterfall short-circuit contract.
- Updated coverage to 160 canonical pages and 182 localized documents.

## 0.5.298 - 2026-08-28

### Changed

- Refined the Tool Execution Pipeline guide with upstream #4906's waterfall short-circuit evidence and the fail-closed consumer contract for malformed pre-execute decisions.

## 0.5.297 - 2026-08-28

### Added

- Added an English canonical and Chinese reviewed runbook for long-session ChatView memory growth, based on upstream #4900's renderer RSS measurements and virtualization boundary.
- Updated coverage to 160 canonical pages and 181 localized documents.

## 0.5.296 - 2026-08-28

### Added

- Added a reviewed Spanish localization of the Agent lifecycle guide, including the parent-dispose/child-handoff contract from upstream #4909.
- Updated coverage to 159 canonical pages and 179 localized documents.

## 0.5.295 - 2026-08-28

### Added

- Added a reviewed Korean localization of the Agent lifecycle guide, including the parent-dispose/child-handoff contract from upstream #4909.
- Updated coverage to 159 canonical pages and 178 localized documents.

## 0.5.294 - 2026-08-28

### Fixed

- Synchronized the Chinese overview's localized-document count with the verifier result: 159 canonical pages and 177 localized documents.

## 0.5.293 - 2026-08-28

### Added

- Added a reviewed Japanese localization of the Agent lifecycle guide, including the parent-dispose/child-handoff contract from upstream #4909.
- Updated coverage to 159 canonical pages and 177 localized documents.

## 0.5.292 - 2026-08-28

### Added

- Added a reviewed Chinese localization of the Session storage-format guide, covering Zstandard framing, packed rows, sequence reconstruction, and evidence-preserving format migration.
- Updated coverage to 159 canonical pages and 176 localized documents.

## 0.5.291 - 2026-08-28

### Changed

- Extended the Session storage-format guide with upstream #4910's distinction between unsupported versions and corruption, plus migration, rollback, and evidence-preserving acceptance gates.

## 0.5.290 - 2026-08-28

### Added

- Added a reviewed Chinese localization of the Agent lifecycle guide, including the parent-dispose/child-handoff contract from upstream #4909.
- Updated coverage metadata to 159 canonical pages and 175 localized documents.

## 0.5.289 - 2026-08-28

### Changed

- Extended the Agent lifecycle architecture guide with upstream #4909's parent-dispose, child handoff, hung-child reclamation, and settlement-disposition contract.

## 0.5.288 - 2026-08-28

### Changed

- Refined the WebView performance runbook with upstream #4917's Safari ordered-list clipping evidence, the transcript scroll-container boundary, and the em-sized marker-gutter regression path.

## 0.5.287 - 2026-08-28

### Changed

- Expanded the tool-schema guide with the Code Mode `unknown` failure mode reported in upstream Discussion #4916, including the separate MCP, generated-SDK, and runtime-validation boundaries.

## 0.5.286 - 2026-08-28

### Changed

- Extended the Web client-modules boot runbook with the new upstream #4840 rebuild/startup report, while keeping its screenshot-only evidence explicitly non-diagnostic.

## 0.5.285 - 2026-08-28

### Changed

- Extended the attachment architecture guide with upstream #4922's corrupt-reference failure, generic `TRANSPORT` wrapping, and immutable-session recovery contract.

## 0.5.284 - 2026-08-28

### Changed

- Extended the duplicate-core runtime runbook with upstream #4529's headless first-tool-call failure branch and fresh-process evidence requirements.

## 0.5.283 - 2026-08-28

### Changed

- Extended the pnpm Web loading runbook with upstream #4923's isolated-tarball provider-table failure and the two-level realpath regression contract.

## 0.5.282 - 2026-08-28

### Added

- Added English and Chinese runbooks for Windows read-only PowerShell stderr noise caused by a ConstrainedLanguage-incompatible encoding preamble, based on upstream Discussion #4924.
- Corrected coverage metadata to the verifier result: 159 canonical and 174 localized documents.

## 0.5.280 - 2026-08-28

### Changed

- Corrected localized coverage metadata after adding the Windows read-only PowerShell guide pair: 159 canonical and 174 localized documents.

## 0.5.279 - 2026-08-28

### Added

- Added English and Chinese Windows runbooks for read-only PowerShell stderr noise caused by a ConstrainedLanguage-incompatible encoding preamble, based on upstream Discussion #4924.

## 0.5.278 - 2026-08-28

### Added

- Added English and Chinese Agent-pattern guides for diagnosing continuable subagents whose inherited tool registry is empty, based on upstream Discussion #4921.
- Added the new guide to both language navigation pages and refreshed coverage metadata to 158 canonical and 171 localized documents.

## 0.5.273 - 2026-08-28

### Added

- Added an English-canonical and Chinese-localized Firefox blank-client troubleshooting guide based on upstream Discussion #4919, with browser comparison, clean-profile, network, WebSocket, and minimal-reproduction checks.

## 0.5.274 - 2026-08-28

### Added

- Added an English-canonical and Chinese-localized auth-token troubleshooting guide based on upstream Discussion #4918, separating token acquisition, UI entry, storage, and outbound authorization without exposing credentials.

## 0.5.275 - 2026-08-28

### Changed

- Synchronized README coverage metadata with the current 157 canonical and 170 localized documents.

## 0.5.276 - 2026-08-28

### Changed

- Extended the WebView mutation-loop runbook with upstream #4920's `settings.section` `removeChild` recursion signature and a separate DOM ownership/generation diagnostic path.

## 0.5.277 - 2026-08-28

### Changed

- Promoted the Firefox, auth-token, and `removeChild` incident guides into the README's source-verified table for faster discovery from GitHub.

## 0.5.244 - 2026-08-29

### Changed

- Expanded the response/reasoning language guide with #4834's Think-row clipping boundary, distinguishing a renderer preview crop from durable reasoning leakage.

## 0.5.243 - 2026-08-29

### Changed

- Extended the npx install-boundary guide with #4872's npm OOM report and pnpm control result, while keeping package-manager behavior distinct from package-graph correctness.

## 0.5.242 - 2026-08-29

### Changed

- Added `dsh-durable-context` from upstream Show Your Plugins discussion #4812 to the discovery-only community audit, explicitly withholding artifact, compatibility, provenance, and retention claims until independently verified.

## 0.5.241 - 2026-08-29

### Changed

- Expanded the reasoning replay guide with #4709's provider-owned `tool_choice` rejection boundary and sanitized outbound-key evidence requirements.

## 0.5.240 - 2026-08-29

### Changed

- Expanded stuck-tool cancellation with #4551's plugin-origin bridge hang, direct-versus-composed probes, and timeout propagation requirements.

## 0.5.239 - 2026-08-29

### Changed

- Expanded the community-plugin audit with #4486's browser-side locale namespace collision, clean-restart evidence, and coexistence checks for multiple UI plugins.

## 0.5.238 - 2026-08-29

### Changed

- Expanded the first-plugin guide with the #4455 function-shaped `apply` lifecycle boundary: returned cleanup or pending promises may be lost by a constructible runner, so exact-loader tests and fail-closed activation are required.

## 0.5.237 - 2026-08-29

### Changed

- Expanded the npx install-boundary runbook with current npm peer-resolution CPU-loop and OOM reports (#3786, #3890, #4236), including a disposable `--legacy-peer-deps` diagnostic and its runtime-risk boundary.

## 0.5.236 - 2026-08-29

### Changed

- Expanded the manual compaction runbook with upstream Discussion #3711's silent summarization-hang signature, event-sequence liveness check, and bounded-watchdog guidance, keeping it distinct from caller cancellation.

## 0.5.235 - 2026-08-29

### Fixed

- Corrected the machine-readable `site/llms.txt` description so the Field Status page is identified as an rc.7 baseline with alpha.1 migration context rather than a current rc.7 release-health claim.

## 0.5.234 - 2026-08-29

### Changed

- Expanded the RTL mixed-text guide with the current #696 follow-up and a clear boundary between a community client prototype and an upstream rendering fix.

## 0.5.233 - 2026-08-29

### Changed

- Added a visible Latest Release badge to the README and a direct latest-release action on the public homepage, improving provenance and conversion for visitors arriving from search or upstream discussions.

## 0.5.232 - 2026-08-29

### Changed

- Added `H97y/dsh-devflow` to the discovery-only community plugin intake, with explicit review gates for background agents, worktree writes, merge-to-main authority, and model/cost controls.

## 0.5.231 - 2026-08-29

### Changed

- Refreshed the high-traffic Simplified Chinese README with direct links to the newest English identity, filesystem URL, and rc.7/alpha.1 status guides, keeping English canonical while improving discovery.

## 0.5.230 - 2026-08-29

### Fixed

- Reframed the public Field Status page as an rc.7 baseline with explicit alpha.1 context, updating homepage and README links so current visitors are not misled by the older snapshot.

## 0.5.229 - 2026-08-29

### Changed

- Expanded the invalid-overlay recovery runbook with Discussion #4263 evidence and a two-path triage for profile mount failures versus damaged Session history.

## 0.5.228 - 2026-08-29

### Changed

- Expanded the multi-Session presentation contract with Discussion #4879's sidebar view-switching seam analysis, including DOM-anchor failure modes and the proposed Host-owned `sidebar.views` boundary.

## 0.5.227 - 2026-08-29

### Changed

- Expanded the official-project identity guide with the upstream #4875 search-result/download-site warning, package provenance checks, and a clear distinction between unofficial clients and the official runtime.

## 0.5.226 - 2026-08-29

### Changed

- Expanded the duplicate-Session-sequence runbook with #4178 prevention evidence: isolate `DSH_HOME` for experiments, distinguish port changes from true storage isolation, and treat community guard/surgeon tools as discovery-only until audited.

## 0.5.225 - 2026-08-29

### Changed

- Expanded the response/reasoning language guide with the upstream #3021 reasoning-to-text leakage signature, durable evidence checks, and privacy/output-budget handling.

## 0.5.224 - 2026-08-29

### Changed

- Added Windows Node 22 field evidence from Discussion #4874 to the source-build `MISSING_EXPORT` runbook, recording clean-rebuild convergence without overclaiming compatibility.

## 0.5.223 - 2026-08-29

### Changed

- Updated the Windows folder-picker runbook with Discussion #4878 evidence that fix `51c24274` exists on upstream master but remains absent from checked npm artifacts; added exact tarball verification commands.

## 0.5.222 - 2026-08-29

### Changed

- Added a current discovery-only intake table for `dsh-graph` and `dsh-subagent-workspace-ui`, linking upstream announcements while keeping artifact, runtime, and security verdicts explicitly unproven.

## 0.5.221 - 2026-08-29

### Changed

- Extended the source-build `MISSING_EXPORT` runbook with current-master field evidence from upstream Discussion #4860, including the seven-error cluster and the distinction between completed package lines and a usable Web build.

## 0.5.220 - 2026-08-29

### Added

- Added an English runbook for upstream Discussion #4862: reject HTTP(S) URLs before filesystem path resolution, preserve the original input, and route remote retrieval to a web/fetch capability.

## 0.5.219 - 2026-08-29

### Fixed

- Declared the #1695 cold-restart evidence row in the insufficient-tool-messages runbook's Source boundary, explicitly distinguishing community evidence from handbook reproduction.

## 0.5.218 - 2026-08-29

### Changed

- Published the cold-restart failure evidence update in the Atom feed, linking subscribers to the existing insufficient-tool-messages article and its source-backed recovery boundary.

## 0.5.217 - 2026-08-29

### Added

- Added a source-linked Windows 11 / Node 24.15 / DSH rc.6 cold-restart row to the insufficient-tool-messages runbook, documenting failed recovery without implying a repair.

## 0.5.216 - 2026-08-29

### Changed

- Completed the fluent review requested in issue #226 for the five Simplified Chinese README topic summaries.
- Marked the Chinese landing page `reviewed` and synchronized its verified corpus totals to 151 canonical and 160 localized documents.

## 0.5.215 - 2026-08-28

### Changed

- Added the Ralph failure-successor guide to the public Atom feed with a direct canonical GitHub link, so subscribers can verify the source even when a generated article page is not part of the static site subset.

## 0.5.214 - 2026-08-28

### Fixed

- Added the missing direct source link for the malformed-argument retry example cited by the Ralph failure-successor guide.

## 0.5.213 - 2026-08-28

### Changed

- Extended the Ralph failure-successor guide with structured orchestrator-owned failure state, workspace fingerprint admission, and a no-change circuit breaker based on the latest Discussion #109 review.

## 0.5.212 - 2026-08-28

### Changed

- Added the Ralph failure-successor decision to the README's source-verified map, making the latest upstream orchestration discussion visible from the primary project entry point.

## 0.5.211 - 2026-08-28

### Changed

- Promoted the Ralph failure-successor guide into the English README and documentation landing page so the new upstream discussion is discoverable from the primary entry points.

## 0.5.210 - 2026-08-28

### Added

- A Ralph-specific design guide for an optional, bounded failure successor, grounded in upstream Discussion #109 and the alpha.1 fixed workflow contract.
- Failure-class, cancellation, budget, handoff, and regression boundaries that preserve Ralph's fail-closed default.

## 0.5.209 - 2026-08-28

### Fixed

- Corrected the README corpus total to match the verifier's 150 canonical and 159 localized-document result.

## 0.5.208 - 2026-08-28

### Changed

- Clarified the alpha.1 `code` → `ptc` migration boundary: current presentation terminology can change while durable Session identities and event vocabulary remain intentionally historical.
- Added the upstream PTC terminology-sync source and a review table so operators do not rewrite compressed Session history during an upgrade.

## 0.5.193 - 2026-08-28

### Changed

- Closed a reviewed-translation parity gap on the high-traffic Simplified Chinese Quickstart by adding the canonical source-build route, Host-versus-bare-frontend boundary, and next-step navigation.
- Refreshed the Simplified Chinese landing page with the same five current rc.2/alpha.1 problems as the English entry point, using direct canonical links while Pages is rate-limited.

## 0.5.192 - 2026-08-28

### Changed

- Refreshed the repository's highest-traffic English and Simplified Chinese entry points using GitHub Traffic evidence rather than adding another low-discovery page.
- Replaced the stale featured-guide set with five current rc.2/alpha.1 problems and direct canonical links that remain available while GitHub Pages deployment is rate-limited.
- Corrected the Simplified Chinese corpus totals from 143/152 to 148/157 and made the mixed rc.2 plus alpha.1 verification baseline explicit.

## 0.5.191 - 2026-08-28

### Changed

- Re-verified degenerate repeated-output handling against alpha.1 and corrected the default normal retry budget from the older rc.8 value to five retries.
- Added live repetition containment, reasoning/text/tool channel capture, billing uncertainty, `max-tokens` dual classification, and a separate finite cost budget for experimental degeneration retries.

## 0.5.190 - 2026-08-28

### Added

- Added a boot-protocol runbook for `HTML did not preload @deepseek-ai/dsh-client-modules/client.js`.
- Separated missing Host injection, failed `/plugins` responses, proxy rewrites, mixed revisions, script reordering, stale service workers, and unsupported bare frontend launches, with a ten-point regression contract.

## 0.5.189 - 2026-08-28

### Added

- Added a TUI slash-command failure runbook for `Cannot read properties of undefined (reading 'aborted')` caused by passing `AbortSignal` in the command image slot.
- Documented the two-call-site adapter fix, loaded-bundle diagnostics, safe fallback routing, behavioral verification, and an eight-point integration regression contract.

## 0.5.188 - 2026-08-28

### Changed

- Defined Regenerate reply as a previous-Turn fork plus ordered human-input replay, rather than mutation or blind resubmission in the source Session.
- Added exact fork-anchor semantics, steering reconstruction, Session-scoped image re-admission, side-effect gates, partial-child recovery, and twelve implementation and regression gates.

## 0.5.187 - 2026-08-28

### Changed

- Corrected Stop semantics: alpha.1 preserves pre-cancel queued and steering input with `keepInbox`, but parks it without arming a wake; only post-abort convergence input is latched automatically.
- Added pending-id evidence capture, safe parked-queue containment, and a ten-gate Stop-and-deliver product contract covering ownership, ordering, identity, races, attachments, and side effects.

## 0.5.186 - 2026-08-28

### Added

- Added a historical Session recovery runbook for the shipped `code` → `ptc` preset rename.
- Documented the durable preset projection failure, user-level compatibility alias, nonblank migration boundary, failed approaches, source-fix contract, and cold-replay regression gates.

## 0.5.185 - 2026-08-28

### Changed

- Added a split-release decision path for alpha.1: the official GitHub Release, tag, and source manifest exist while the official npm registry returns `E404` for the exact CLI version.
- Updated official project identity coordinates to rc.2 on npm and alpha.1 on GitHub, with source, registry artifact, dist-tag, and executable treated as separate evidence.

## 0.5.184 - 2026-08-28

### Changed

- Added a four-authority route for Web UI cutoffs where physical Session data and `session.history` are complete but client assembly or rendering stops earlier.
- Added exact tail-sequence reconciliation, bounded cold/live replay bisection, safe containment for unseen accepted prompts, and a non-silent client product contract derived from upstream report #4830.

## 0.5.183 - 2026-08-28

### Changed

- Added an rc.2→alpha.1 preflight matrix covering source outputs, third-party Bundle runtime APIs, provider Settings, custom Session events, and route/history transitions.
- Added seam-specific isolated proofs, rollback objects, a route-switch matrix, and a reusable alpha.1 promotion record derived from recent upstream incidents.

## 0.5.182 - 2026-08-28

### Added

- Added a stuck-Turn runbook that separates Session cancellation, internal model retry, revised follow-up, branch, and clean continuation.
- Documented durable abort proof, apparent-freeze routing, external side-effect reconciliation, unavailable-Stop containment, and a ten-gate explicit Retry product contract.

## 0.5.181 - 2026-08-28

### Changed

- Added a runtime-export compatibility route for third-party Bundles that still import rc.2 `CallId` after alpha.1 renamed the runtime brand to `ToolCallId`.
- Documented compatible-closure choices, profile-scoped removal, unsafe aliasing boundaries, peer-range evidence, and a seven-gate plugin compatibility contract.

## 0.5.180 - 2026-08-28

### Added

- Added a source-build runbook for clustered Rolldown `MISSING_EXPORT` failures caused by generated `lib/types` output from another revision.
- Documented the official cleaner boundary, work-preserving clean/install/build sequence, frozen-lockfile proof, result router, and alpha.1 export evidence behind report #4824.

## 0.5.179 - 2026-08-28

### Changed

- Added the 1M→200K model-switch capacity transition and explained why rc.2 can run pre-step pressure checks against the previous durable route before recording the smaller route.
- Added a pre-switch recovery procedure, safe post-failure containment, transition-aware source contract, and large→small regression gates.

## 0.5.178 - 2026-08-28

### Changed

- Split `reasoning_content` failures into missing passback on pi-ai cross-provider routes and stale passback after a direct DeepSeek thinking on→off switch.
- Verified the mode-blind direct-adapter assistant serializer in rc.2 and alpha.1, and added a safe isolation matrix, containment, source-fix contract, and regression gates.

## 0.5.177 - 2026-08-28

### Changed

- Added the rc.2 Models UI input-modality gap and a safe `models[].input` authoring, round-trip, and fresh-Session verification workflow.
- Documented modality resolution precedence, hidden-field preservation limits, narrow model declarations, and acceptance gates for a complete UI control.

## 0.5.176 - 2026-08-28

### Changed

- Added a Session history read-state router that separates genuine exhaustion, empty nonterminal pages, cursor discontinuity, Remote failure, and projection failure.
- Compared rc.2 fail-soft pagination with alpha.1 journal repair and interrupted-prefix rendering, while documenting the remaining invisible `loadOlder()` failure state.

## 0.5.175 - 2026-08-28

### Changed

- Added a cold-restore restart-loop router that separates synchronous Session reconstruction, Host failure, desktop supervisor termination, and profile/global runtime-copy drift.
- Documented the rc.2 prepare pipeline, one-process timeline, bounded isolation ladder, artifact-preserving recovery, and evidence limits for upstream macOS report #4807.

## 0.5.174 - 2026-08-28

### Changed

- Updated custom Session-event compatibility for alpha.1's complete removal of the historical `ignorable` envelope and SQLite column.
- Added optional-observation, required-state, and foreign-import contracts; a registration schema checklist; lifecycle rules; write/read authority separation; and a cross-backend compatibility matrix.

## 0.5.173 - 2026-08-28

### Changed

- Added the id-less plugin-notice failure to Session corruption triage and separated producer attribution, live acceptance, cold-load validation, and Zstandard framing.
- Documented the `createUserMessage()` ownership boundary, the fail-late validation gap, consistent inbox/message identity repair requirements, and cold-reload regression gates.

## 0.5.172 - 2026-08-28

### Changed

- Added an alpha.1 third-party-provider recovery route that distinguishes a silent Models UI, invalid draft, rejected settings write, missing catalog route, and inference failure.
- Documented the rc.2-to-alpha.1 Models Remote boundary, source-checkout stale-bundle risk, non-secret evidence capture, reversible recovery choices, and end-to-end proof gates.

## 0.5.171 - 2026-08-28

### Changed

- Added a Windows nested-subprocess decision table that separates a live-child stall, inherited-pipe close delay, and incomplete tree termination.
- Classified PowerShell success as a controlled executor-topology comparison, documented the direct/`cmd`/PowerShell/stdio evidence matrix, and added Windows grandchild regression gates.
- Verified that the relevant `spawn.ts` boundary is unchanged in `0.1.2-alpha.1` and avoided claiming the reported Python hang is fixed without a Windows regression test.

## 0.5.170 - 2026-08-28

### Changed

- Added the Windows first-plugin `ERR_UNSUPPORTED_ESM_URL_SCHEME` diagnosis and a canonical `pathToFileURL()` recovery that preserves escaping.
- Distinguished the cross-version file-URL route from alpha.1 overlay-relative plugin anchoring and added a load-success boundary before later TypeScript diagnosis.

## 0.5.169 - 2026-08-28

### Changed

- Added the Windows rc.2 `standard` → `cordis` `pwsh` collision and its least-invasive recovery to the preset-generation guide.
- Distinguished true Host-provider sharing from the `0.1.2-alpha.1` standing-scope tool registry, with whole-graph upgrade and cross-preset execution/disposal gates.

## 0.5.168 - 2026-08-28

### Changed

- Extended custom Session event compatibility from cold-resume refusal to the `0.1.2-alpha.1` SQLite reconciliation blast radius behind generic `session history storage is unavailable` failures.
- Added four-fact diagnosis, exact-artifact reversible quarantine, degraded-result disclosure, per-artifact runtime repair boundaries, and regression gates.

## 0.5.167 - 2026-08-28

### Changed

- Separated first-plugin runtime loading from editor and direct-TypeScript project discovery at the current `0.1.2-alpha.1` source revision.
- Added a scoped scratch `tsconfig.json`, a direct verification command, and guardrails against mutating the official root aggregate or shared base config.
- Pinned removed top-level examples to the rc.2 snapshot and marked the examples map and Python SDK quickstart as historical rather than current-master paths.

## 0.5.166 - 2026-08-27

### Changed

- Refreshed the second-highest-traffic Simplified Chinese Overview with concise draft summaries and direct canonical links for the five newest source-verified topics.
- Answered the unanswered close-to-tray question with a source-bounded distinction between official CLI/Web and an unidentified community desktop wrapper.

## 0.5.165 - 2026-08-27

### Changed

- Refreshed the high-traffic Overview with the five newest source-verified Session, search, attachment, Client-slot, and frontier-selection routes.
- Repaired two early official-discussion references that still targeted the deleted `agent/context-overflow` branch, replacing them with the permanent `main` URL.

## 0.5.164 - 2026-08-27

### Changed

- Added the rc.2 same-sequence, different-event, foreign-Session-content incident as a hard isolation conflict that cannot use exact-duplicate removal.
- Separated original sequence corruption from the secondary header-frame failure caused by generic single-frame Zstandard recompression.

## 0.5.163 - 2026-08-27

### Changed

- Located frontier selection outside the default linear Agent driver and intra-step tool scheduler.
- Added candidate, expander, scorer, selector, budget, effect-isolation, teardown, and deterministic-replay contracts for beam and search orchestration.

## 0.5.162 - 2026-08-27

### Changed

- Added a SlotMap cardinality decision table for `single`, `chain`, `keyed`, and `list` ownership.
- Mapped the per-Turn badge proposal to an additive ordered-list contract with durable evidence, absence, replay, accessibility, coexistence, and disposal gates.

## 0.5.161 - 2026-08-27

### Changed

- Corrected the cross-conversation-search boundary: rc.2 ships session-query, SQLite FTS, Host search, and model-tool packages, while base full-text indexing and Agent tools remain opt-in.
- Added human-versus-Agent authorization, bounded result, self-search, derived-index privacy, deletion, audit, and enablement contracts.

## 0.5.160 - 2026-08-27

### Changed

- Converted the non-image composer request into separate intake, durable-card, and Agent-usability contracts.
- Added an additive document-card state model and rejected model-visible Host paths in favor of authorized attachment resolution or explicit workspace materialization.

## 0.5.159 - 2026-08-27

### Changed

- Mapped the current ungrouped, cross-Workspace discovery, move, and delete UX gaps to distinct navigation, execution-root, global-index, and retention contracts.
- Rejected cwd-validation bypass and live Session-file deletion as UI shortcuts; added bounded All Sessions and Archive/Trash/Purge product boundaries.

## 0.5.158 - 2026-08-27

### Changed

- Added the Full Access reflexive escalation-field failure and bounded no-op compatibility proposal to the sandbox runbook.
- Defined call-order, audit, no-downgrade, approval, unknown-mode, cross-tool, and schema/cache regression gates before malformed authority input can become ordinary execution.

## 0.5.157 - 2026-08-27

### Added

- Added a clearly labeled Simplified Chinese draft of the custom-provider catalog-collision runbook while preserving English as canonical.
- Refreshed the high-traffic Chinese Overview with the newest provider, token-cost, and translation-extension routes and current 143/152 coverage.

## 0.5.156 - 2026-08-27

### Changed

- Added the independent rc.2 `报销` reproduction to the Windows native folder-picker UTF-16LE truncation branch.
- Linked the exact `销 U+9500 → 00 95` evidence to the existing two-byte NUL test, browse-backend recovery, and regression matrix.

## 0.5.155 - 2026-08-27

### Changed

- Refreshed the GitHub Overview's source-verified table around the three newest high-intent provider, token-cost, and Web composer failures.
- Added a dated latest-field-signals section near the site homepage hero so new visitors reach current evidence before the full 138-path index.

## 0.5.154 - 2026-08-27

### Added

- Added a custom-provider catalog-collision runbook for routes that silently use `/messages` when `api` is omitted.
- Documented provider id, endpoint, protocol, catalog stream ownership, fresh-Session proof, backward-compatible hardening, and safe rollback.

## 0.5.153 - 2026-08-27

### Changed

- Added a per-call evidence route for large cumulative token-usage jumps so billing totals are not confused with current context occupancy.
- Verified that the pinned shipped base explicitly enables 50 KB spill, model-free tool-result pruning, and repeat-call reminders, while documenting their distinct timing and bypasses.
- Added safe cost-reduction guidance for base64-heavy files, range reads, retry loops, manual compaction, provider cache buckets, and model-visible payload capture.

## 0.5.152 - 2026-08-27

### Changed

- Added Google translation-extension interference as a distinct Web composer failure alongside missing IME candidates and premature Enter.
- Separated controlled textarea value, stable DOM identity, aligned backdrop, injected wrappers, computed style, and actual remount evidence.
- Added site-scoped recovery, privacy-safe DevTools capture, and a compatibility contract that preserves translation elsewhere without patching generated code.

## 0.5.151 - 2026-08-27

### Changed

- Refreshed the GitHub Overview's source-verified table with the newest Windows Host hang and remote Web reconnect evidence paths.
- Updated the high-traffic Simplified Chinese entry from stale 138/146 coverage to the verified 142/150 counts.
- Replaced its older topic sampler with concise Chinese routing for the five newest practical guides while keeping English canonical.

## 0.5.150 - 2026-08-27

### Added

- Added a Windows Web Host hang runbook for a process that keeps listening while all HTTP probes time out after message submission.
- Added listener-to-process evidence, fixed-cadence probes, three private ProcDump samples, WinDbg comparison, bounded A/B tests, and evidence-preserving recovery.
- Source-checked and rejected unsupported causal shortcuts around `Atomics.wait`, synchronous zstd, package presence, low CPU, and standalone provider fetches.

## 0.5.149 - 2026-08-27

### Changed

- Traced insecure-origin typed RPC failure through `host.describe`, shared connection-generation cancellation, and the repeated `connection lost` warning.
- Added a four-part evidence gate that separates a pre-fetch UUID exception from WebSocket, Host/Origin trust, and server-lifecycle failures.
- Refreshed the visual runbook, field-status card, and machine-readable guide description with official rc.2 source and field report #4756.

## 0.5.148 - 2026-08-27

### Changed

- Corrected the README first-screen Run, Evaluate, and Debug or build paths.
- Replaced stale featured links with the newest source-verified runtime, interaction, Schema, and evaluation resources.
- Refined repository discovery metadata around coding-agent engineering without changing the independent project boundary.

## 0.5.147 - 2026-08-27

### Changed

- Added double-encoded structured tool arguments to the enforced Schema guide.
- Separated outer parsing, pure validation, Schema modeling, compatibility normalization, and later RPC shape loss.
- Added strict normalization gates and a regression matrix that preserves schema-legal strings.

## 0.5.146 - 2026-08-27

### Changed

- Added the rc.2 long-question header clipping failure to the missing interaction runbook.
- Separated absent-card transport failures from a present card whose fixed header consumes the capped height.
- Added operator recovery, scroll-ownership repair criteria, and accessibility regression gates.

## 0.5.145 - 2026-08-27

### Changed

- Added a source-verified lifecycle section explaining why provider prefix caching is a durable message-order contract.
- Separated message provenance, instruction recency, durable replay order, and cache stability instead of treating plugin context as one reorderable class.
- Added an eight-case regression matrix for any stable-baseline ordering optimization.

## 0.5.144 - 2026-08-27

### Added

- Added a browser-only Agent Harness Evaluation Scorecard covering eight runtime boundaries.
- Added shareable URL state, a copyable review, evidence definitions, and focused follow-up guides.
- Made the scorecard the primary homepage path for teams evaluating an agent runtime.

## 0.5.143 - 2026-08-27

### Changed

- Reverified live Session log recovery against rc.2 and added root-wide `.jsonl` versus `.jsonl.zstd` encoding-conflict diagnosis.
- Added producer attribution, offline validation, reversible isolation, blast-radius controls, and explicit rejection of suffix-preference auto-repair.
- Separated temporal correlation with `/compact` from proven physical-file causation: rc.2 context compaction appends events and does not convert the durable artifact encoding.

## 0.5.142 - 2026-08-27

### Changed

- Expanded sandbox diagnosis to separate backend denial, unavailable confinement, ordinary operation failure, and invalid same-or-narrower escalation.
- Documented the strict `read-only < workspace-write < danger-full-access` order, execution-time validation, ordinary Full Access call shape, and nine-case regression matrix.
- Corrected the tempting but unsafe conclusion that an executor should silently accept or strip a same-mode `sandbox_permissions` request.

## 0.5.141 - 2026-08-27

### Added

- Added a source-bounded runbook for cross-provider `reasoning_content` replay failures on DeepSeek-compatible `llm-pi-ai` routes.
- Documented the rc.2 route-level compatibility switch, adapter identification, controlled A/B procedure, provider-switch test matrix, and safe evidence report.
- Separated wire-shape admission from lossless provider-native replay so operators do not fabricate reasoning or signatures to clear an HTTP 400.

## 0.5.140 - 2026-08-27

### Changed

- Rebuilt the central Agent runtime guide as a seven-layer boundary map separating models, providers, framework primitives, Agent harnesses, evaluation harnesses, capabilities, and execution controls.
- Added an ownership-explicit turn sequence, extension decision matrix, and five-question architecture review so runtime, policy, provider, Session, and surface failures are not collapsed into “the Agent.”
- Synchronized the reviewed Chinese edition and pinned every upstream architecture reference to the verified rc.2 commit.

## 0.5.139 - 2026-08-27

### Changed

- Refreshed the README first-screen evidence paths around Windows native exits, context-overflow convergence, WebView mutation loops, RTL mixed text, and AGENTS.md enforcement.
- Tightened the evidence vocabulary to distinguish observed, source-verified, inferred, and proposed claims.
- Updated repository discovery metadata to state the independent multilingual positioning and emphasize quickstarts plus source-backed runbooks.

## 0.5.138 - 2026-08-27

### Added

- Added an RTL and mixed-script rendering contract covering first-strong limits, authored versus inferred direction, block overrides, inline isolation, code safety, and composer geometry.
- Added a cross-browser conformance matrix and sixteen acceptance gates for Arabic, Hebrew, Persian, Urdu, mixed technical prose, Markdown, tables, code, streaming, IME, copy/paste, and accessibility.
- Added a focused visual guide that distinguishes semantic direction, alignment, isolation, and structural LTR surfaces.

## 0.5.137 - 2026-08-27

### Added

- Added a source-bounded runbook for WebView `MutationObserver` CPU loops that separates Host, official Web, desktop wrapper, and client-injection ownership.
- Added immutable-profile isolation, observer-registration tracing, sanitized Session reduction, feedback-edge controls, privacy guidance, and sixteen performance gates.
- Added a focused visual incident router for renderer identity, loaded-script provenance, callback ownership, and non-destructive Session containment.

## 0.5.136 - 2026-08-27

### Changed

- Updated context-overflow diagnosis for rc.2 to distinguish missed llama.cpp and DeepSeek provider wording from canonical `CONTEXT_WINDOW_EXCEEDED` routing.
- Added separate conversation-versus-recovery envelope pricing, non-shrinking checkpoint handling, stable failure fingerprints, and adaptive convergence gates.
- Revised the visual overflow router to stop identical recovery loops and route related WebP failures to the dedicated media-capability guide.

## 0.5.135 - 2026-08-27

### Changed

- Expanded the Windows guide to decode decimal native exit `3221226505` as unsigned `0xC0000409` without treating the NTSTATUS label as a proven cause.
- Added process-lineage, WER correlation, private dump, last-durable-sequence, one-variable A/B, redaction, and twelve acceptance gates for native crash triage.
- Added a focused visual router that separates Node Host, PowerShell child, desktop wrapper, controlled exit, and Microsoft Fail Fast evidence boundaries.

## 0.5.134 - 2026-08-27

### Changed

- Reverified the community plugin audit against rc.2 and reviewed the runtime-tested marketplace proposal at an exact public commit.
- Separated discovery, installability, runtime compatibility, and scoped security review; defined an immutable verdict tuple binding catalog, commit, package integrity, runner, suite, and time.
- Added marketplace mutation-plane requirements for authentication, opaque identities, schema-aware atomic patch edits, package transaction preview, rollback, redaction, and sixteen acceptance gates.

## 0.5.133 - 2026-08-27

### Changed

- Updated the reviewed Simplified Chinese navigation to the current 138 canonical guides and 146 localized documents.
- Added reviewed Chinese task descriptions for five recent English-canonical, rc.2 source-verified guides without claiming translation parity.
- Added the pinned interpretation baseline and a direct, privacy-bounded evidence-report path for the repository's most visited language entry.

## 0.5.132 - 2026-08-27

### Changed

- Added a contribution ladder so corrections, source verification, bounded runtime observations, full runbooks, and fluent translation reviews each have an explicit minimum evidence unit.
- Documented pinned-source identity, verification-boundary language, disposable runtime practice, redaction requirements, and the complete local validation set.
- Expanded pull request and issue templates with artifact/platform boundaries, privacy checks, source-only contribution options, and cleanup evidence.

## 0.5.131 - 2026-08-27

### Changed

- Revised the repository landing path so new readers can reach a runnable, diagnostic, or extension outcome before entering the complete guide catalog.
- Added a compact source-verified section for profile repair, multi-channel approval, authenticated remote Settings, AGENTS.md enforcement, and provider-native file input.
- Made the verification boundary, genuine Star invitation, and evidence-report contribution path explicit without removing the full technical map.

## 0.5.130 - 2026-08-27

### Changed

- Reverified the plugin recovery guide against rc.2 and answered the automatic repair/reset request without treating the Harness home as disposable cache.
- Added default-versus-effective composition diagnosis, clean-profile controls, transactional repair requirements, hot-generation versus disk-candidate semantics, and exact rollback boundaries.
- Added sixteen repair acceptance gates and redesigned the visual runbook around one scoped profile repair with credentials, Sessions, presets, and unrelated profiles excluded by default.

## 0.5.129 - 2026-08-27

### Changed

- Expanded the human-interaction wire guide with a security review of multi-channel Web and Feishu approval routing.
- Defined one immutable decision owner, authenticated card authority, atomic click-versus-timeout settlement, service-owned audit, schema-stable projection, restart recovery, and supported out-of-tree packaging.
- Added sixteen multi-channel conformance gates and revised the visual map around the distinction between presentation observers and one decision owner.

## 0.5.128 - 2026-08-27

### Changed

- Expanded the remote Settings guide for deployments that already provide HTTPS and password authentication without treating either as a DSH capability grant.
- Defined separate gateway-carrier and browser-principal negotiations, narrow Settings/credential/model capabilities, Host-side enforcement, CSRF, revision, audit, revocation, and secret-handling requirements.
- Added an additive migration path, a revised visual trust map, and fourteen acceptance gates for authenticated non-loopback administration.

## 0.5.127 - 2026-08-27

### Changed

- Merged community PR #198 and refreshed the Windows compatibility companion to the published, MIT-licensed `dsh-win32` 0.17.1 release.
- Documented the model-free `verify` command and separated metadata/local diagnosis, component-chain acceptance, and a complete stock Minimal Host or model-Session claim.
- Updated the visual recovery guide with the supported rc.8+ PowerShell path, optional companion checks, exact verification boundary, and current rc.2 source provenance.

## 0.5.126 - 2026-08-27

### Changed

- Reverified the AGENTS.md scope guide against rc.2 and separated discovery, model visibility, instruction following, and deterministic enforcement.
- Added a visible-but-ignored diagnosis, concrete rule-writing criteria, adversarial route testing, and policy owners for filesystem, release, command, secret, and production boundaries.
- Revised the visual guide around the decisive distinction: workspace prose can guide a model, while hard invariants need non-model enforcement.

## 0.5.125 - 2026-08-27

### Changed

- Upgraded the general-file architecture guide with exact-route capability negotiation for provider-native PDF and video input.
- Kept provider uploads as revocable derivatives of one local immutable attachment, with scoped binding identity, processing, reuse, expiry, and deletion states.
- Added PDF and video truth boundaries, egress controls, safe fallback planning, a revised visual route map, and twenty-seven acceptance gates.

## 0.5.124 - 2026-08-27

### Added

- Added a source-backed diagnosis proving rc.2 `ask_user_question` has no built-in human-answer deadline and routes cancellation through the owning execution signal.
- Separated browser disconnect and replay, explicit UI cancellation, execution abort, provider disposal, reminders, and real decision deadlines.
- Added an abort timeline, current containment, typed `ASK_TIMEOUT` design, exactly-once races, a visual settlement map, and twenty-two regression gates.

## 0.5.123 - 2026-08-27

### Added

- Added a source-backed diagnosis for Agents alternating between unknown `edit` and `str_replace_editor` calls.
- Mapped Standard, Minimal, Code, Both, and custom Preset tool surfaces without confusing lookup failure with path, freshness, sandbox, or permission errors.
- Added assembly evidence, recovery routes, a disposable read-edit-read proof, retry containment, a visual dispatch boundary, and twenty regression gates.

## 0.5.122 - 2026-08-27

### Added

- Added a source-backed diagnosis for Settings navigation rows clipped when many Client plugins register sections.
- Defined the narrow flexbox repair that keeps the title fixed while making the section list a bounded scroll owner.
- Added installed-build containment, reachability-first keyboard and responsive tests, a visual scroll-owner map, and twenty regression gates.

## 0.5.121 - 2026-08-27

### Added

- Added a source-backed design response separating user-defined Session Collections from the shipped Workspace-backed grouping model.
- Defined conversation-only, ephemeral-sandbox, and attach-later no-Workspace profiles without falling back to the Host process directory or mutating immutable Session headers.
- Added revision-checked membership, archive and deletion semantics, a three-domain visual map, migration order, failure routing, and twenty-four acceptance gates.

## 0.5.120 - 2026-08-27

### Added

- Added a source-backed compatibility design for tool-owned code-card language instead of Web classification by the reserved `run_code` wire name.
- Defined an additive provider-neutral grammar hint, one validated runtime-language source, view-first classification with legacy fallback, and strict separation from execution authority.
- Added live/replay wire constraints, a third-party tool example, failure routing, a visual presentation pipeline, and twenty regression gates.

## 0.5.119 - 2026-08-27

### Changed

- Reverified the continuable-subagent guide against rc.2 and added scoped control for stale pending parent follow-ups.
- Separated the exact direct parent's eligible follow-up subsequence from initial input, steering, plugin messages, other senders, and runtime settlement notices in the shared Agent inbox.
- Added bounded list semantics, a linearizable single-message cancel race, atomic replace and safe reorder constraints, a visual authority map, and twenty regression gates.

## 0.5.118 - 2026-08-27

### Added

- Added a source-backed operator guide separating model context, the live Session log, durable history, and resident continuable subagents as four independent memory budgets.
- Documented emergency containment, four controlled heap reproductions, a diagnostic bundle, byte-aware hot-window design, and separate subagent reclamation.
- Added a visual retained-path map, two-stage Host heap guard, compatibility questions for closed-message chunk reclamation, and twenty regression gates.

## 0.5.117 - 2026-08-27

### Changed

- Reverified runaway-loop routing against rc.2 and expanded it to diagnose Agents that narrate tool use without issuing a finalized tool call.
- Separated one degenerate stream, repeated automatically sourced turns, repeated steps, provider retries, and duplicate UI projection by their durable event shapes.
- Added a source-scoped actionless-round circuit breaker, a controlled four-case reproduction matrix, fifteen regression gates, and a revised visual event map.

## 0.5.116 - 2026-08-27

### Added

- Added a source-backed design review for multi-Session Web presentation, clearly separated from the rc.2 shipped single-Session contract.
- Defined visible membership, focused interaction, capacity ownership, per-Session render binding, Session-scoped slot multiplicity, and compatibility negotiation.
- Added transition semantics, persistence validation, a cross-Session failure router, visual architecture page, and twenty-two acceptance cases.

## 0.5.115 - 2026-08-27

### Added

- Added a source-backed guide for durable Web UI customization through independently installed Client plugins instead of patches to npx-managed files.
- Documented SlotMap discovery, `single`-seat replacement risk, manifest discovery, dual-face artifacts, the lazy browser loader factory, and module purity.
- Added an install-to-removal proof chain, failure router, pinned upgrade contract, visual architecture page, and sixteen acceptance gates.

## 0.5.114 - 2026-08-27

### Added

- Added a source-backed guide for out-of-tree Typert generation, separating workspace root, aggregate reference, and real-path containment gates.
- Added a deterministic pinned-staging workflow, two-way manifest intent validation, provenance record, supported single-package API proposal, and sixteen release gates.
- Published a visual architecture page explaining why a successful empty selection is not a generated artifact.

## 0.5.113 - 2026-08-27

### Changed

- Reverified insufficient-tool-message recovery against rc.2 and community serializer patch discussion #4668, raising the guide to revision 2.
- Added missing-result, orphan-result, empty/duplicate-ID, and malformed-argument failure routing without treating an unproven plugin claim as root cause.
- Added honest wire-containment rules, a three-layer repair boundary, a linear transcript validator, and sixteen cross-adapter regression gates.

## 0.5.112 - 2026-08-27

### Added

- A source-pinned SDK wire design for out-of-process user questions and one-shot approvals, based on official proposal #4708.
- Explicit capability negotiation, single-provider ownership, separate question and approval vocabularies, and five-part authority correlation.
- Exactly-once settlement across answer, abort, deadline, EOF, shutdown, disposal, and stale responses, plus hardened current-workaround guidance and twenty conformance gates.

## 0.5.111 - 2026-08-27

### Added

- A source-pinned guide for valid WebP attachments rejected by strict OpenAI-compatible pi-ai backends, based on official report #4615.
- A capability model separating DSH storage formats, model image modality, provider wire MIME types, and decoder constraints.
- Immutable originals, policy-owned renditions, fail-closed conversion, animation and metadata semantics, a provider conformance matrix, and sixteen acceptance gates.

## 0.5.110 - 2026-08-27

### Changed

- Reverified scheduler `prepare` failures against rc.2 reports #4601 and #4667 and raised the duplicate-core guide to revision 2.
- Separated fresh-process static duplication, resumed-Session relaunch, and proven mid-process runtime-generation transitions.
- Corrected closure attribution: unrelated version-drifted core packages are risk evidence, not direct proof of a second scheduler symbol.
- Added PID/boot-generation evidence, plugin lifecycle tracing, restart-only containment, orphaned-tool-call protection, and sixteen regression gates.

## 0.5.109 - 2026-08-27

### Added

- A source-pinned diagnosis for native `read_image` calls failing with `cannot get property "fs" without inject`, based on official report #4612.
- A seven-way failure router separating service scope, attachment availability, model capability, format, size, and missing-file boundaries.
- The one-line source repair, a composition-level execution regression, attachment lifecycle proof, safe packaged-install containment, and sixteen acceptance gates.

## 0.5.108 - 2026-08-27

### Added

- A source-pinned operating guide for Session archive, offline trash, collision-free restore, and retention-gated purge, based on official discussion #4716.
- Clear authority boundaries between append-only Session logs, self-healing projection checkpoints, and coordinated workspace domain state.
- Single-writer quiescence, whole-root snapshots, no-overwrite trash generations, crash journaling, lossy-path protection, and eighteen manager acceptance gates.

## 0.5.107 - 2026-08-27

### Changed

- Reverified subprocess-tool guidance against rc.2 and the Windows community-desktop crash report #4713.
- Separated third-party child, official Host, desktop main process, and renderer identities before assigning a core Harness regression.
- Added abrupt-exit, EPIPE, stream ownership, global exception, safe reproduction, Host-survival, Session-replay, and nineteen acceptance gates.

## 0.5.106 - 2026-08-27

### Added

- A source-backed explanation of Goal rounds that repeat while an owned background subagent remains active, based on official report #4715.
- Current containment through foreground collection or explicit Goal pause/resume ownership, without presenting prompt instructions as an inference-cost fix.
- A parent-scoped lifecycle latch, generation and pre-step race fences, wake policy, observability, and sixteen regression cases for an event-driven upstream repair.

## 0.5.105 - 2026-08-27

### Added

- A source-backed OpenRouter provider-routing guide based on official request #4707 and the current rc.2 compatibility gates.
- A routing-only OpenRouter Preset workaround that preserves DSH strict schema validation and separates remote routing from the Agent control plane.
- Preference versus hard-pin semantics, serving-provider verification, typed gateway and source-change requirements, failure routing, and fifteen acceptance gates.

## 0.5.104 - 2026-08-27

### Added

- A source-pinned architecture guide for general-file attachments, based on official request #4700.
- Separate contracts for browser intake, immutable storage, Session authorization, bounded extraction, model context, file-card replay, and retention.
- A safe rc.2 workspace workaround, failure router, parser-security rules, fifteen acceptance gates, and a visual end-to-end brief.

## 0.5.103 - 2026-08-27

### Changed

- Reverified the streamed tool-call identity guide against rc.2 and the persistent resume-corruption report #4704.
- Extended the failure chain from empty continuation identity through policy refusal, durable replay, provider HTTP 400, and restore-time validation failure.
- Added writer/reader asymmetry analysis, correlated identity evidence, bounded operator recovery, and append/restore/listing regression gates.

## 0.5.102 - 2026-08-27

### Changed

- Reverified the Token Meter guide against rc.2 and two independent wide-compaction underflow reports.
- Added the shared signed-fold root cause, containment, copied-state recovery, and the need to repair both message and pressure projections.
- Added checkpoint migration and sequence-zero refold requirements, expanded regression gates, and a revised visual recovery brief.

## 0.5.101 - 2026-08-27

### Added

- A corrected integration guide for rendering tool-produced images to both the model and the DeepSeek Harness Web user.
- Separate contracts for canonical output, model rendering, durable tool results, keyed Web views, and Session-authorized attachment retrieval.
- Client lifecycle, security, failure routing, replay, accessibility, and fourteen acceptance gates plus a visual data-flow brief.

## 0.5.100 - 2026-08-27

### Added

- A source-backed guide for preserving embedded code across model, JSON, literal file-tool, filesystem, and target-parser boundaries.
- A bounded evidence procedure that distinguishes already-damaged tool arguments from provider writes and later parser behavior.
- Low-nesting source layout, native validation, literal-edit safeguards, failure routing, edge fixtures, and a visual representation ladder.

## 0.5.99 - 2026-08-27

### Added

- A source-pinned guide for hosting stdio-only ACP behind a multi-tenant service boundary, based on official request #4692.
- Topology choices, an unforgeable ownership ledger, supervision, affinity, reverse-request, replay, and teardown contracts.
- A remote resource model, failure router, security minimum, fourteen acceptance tests, and a visual architecture brief.

## 0.5.98 - 2026-08-27

### Changed

- Reverified the ACP editor boundary against rc.2 and official telemetry request #4691.
- Separated optional editor presentation from machine-readable tool lifecycle and usage facts required by automation controllers.
- Added a minimal telemetry mapping, redaction requirements, provider-accounting checks, and updated visual guidance.

## 0.5.97 - 2026-08-27

### Changed

- Expanded the remote Web guide with the intentional rc.2 non-loopback Settings scope from official report #4695.
- Added no-RPC versus 403 versus provider-write diagnosis and three explicit configuration-owner topologies.
- Added a visual warning that reachability, HTTPS, and trusted Host declarations do not make a remote browser a loopback configuration principal.

## 0.5.96 - 2026-08-27

### Added

- A parent-owned human clarification relay for continuable subagents, based on official request #4697 and the rc.2 delegated-caller guard.
- A versioned clarification envelope, durable relay state machine, idempotent answer delivery, reconnect recovery, and bounded interaction loops.
- Security rules separating clarification from permission plus twelve acceptance cases.

## 0.5.95 - 2026-08-27

### Changed

- Expanded the ACP permission guide with the unanswered reverse-request hang from official report #4693.
- Added wire-level diagnosis, client-owned deadlines, exactly-once terminal responses, shutdown handling, and fail-closed conformance gates.
- Added a visual guide distinguishing automation policy, bounded interactive UI, and independently enforced external execution.

## 0.5.94 - 2026-08-27

### Added

- A source-backed architecture guide for session-scoped MCP across the current DeepSeek Harness ACP boundary, based on official proposal #4694.
- Four multi-tenant deployment shapes: Host-per-tenant, deployment allowlist, authenticated MCP gateway, and direct client-supplied HTTP.
- SSRF, credential, namespace, quota, Agent-scoped registration, teardown, and twelve-case acceptance requirements.

## 0.5.93 - 2026-08-27

### Added

- A source-backed guide for `unknown job` after partial multi-agent work, based on official report #4696.
- A three-route identity map for foreground run IDs, one-shot background Job IDs, and continuable child conversation IDs.
- Artifact reconciliation, missing-unit recovery, final-assembly gates, orchestration instructions, and ten regression cases.

## 0.5.92 - 2026-08-27

### Changed

- Added an evidence-led diagnostic for apparent Windows `workspace-write` deletion outside the workspace, incorporating official report #4688 and its negative CI reproduction.
- Distinguished read-side visibility from write-boundary proof and documented `Everyone`, standing capability ACE, hard-link, and non-NTFS investigation paths.
- Added a non-destructive evidence checklist and an explicit rule to reject partial enforcement when the workload requires a complete boundary.

## 0.5.91 - 2026-08-27

### Changed

- Expanded the preset-generation guide with the supported copied-Cordis-preset reproduction from upstream #4675.
- Rejected replace-on-duplicate and bare-refcount repairs that can silently remove a live inspect provider after out-of-order or repeated disposal.
- Added a manifest-equivalence and holder-identity contract plus regression cases for coexistence, disposer idempotency, and genuine collisions.

## 0.5.90 - 2026-08-27

### Added

- A source-backed runbook for rc.2 spawn subagents that inherit provider and model but omit the parent's selected reasoning effort.
- Parent-versus-child request-header evidence, spawn-versus-fork control testing, reversible containment, diagnostic propagation requirements, and fourteen regression gates.
- Community-contributed Windows field validation, Windows Minimal rc.8 recovery, and a draft Japanese quickstart.

## 0.5.89 - 2026-08-20

### Changed

- Expanded the Code Mode prompt-variable guide from the `{{hexagon}}` unknown-name case to the malformed `{{dotted.state.path}}` grammar failure reported in upstream #3541.
- Evaluated contributor commit `c2af02e`, promoted an explicit raw-section contract over description-only sanitization, and added propagation gates for assembly replacement and complete sections.
- Reworked the visual guide and discovery copy around literal ownership across descriptions, property names, enums, const values, and generated SDK text.

## 0.5.88 - 2026-08-20

### Added

- A source-backed incident runbook for manual `/compact` failing with `DeepSeek request aborted by caller`.
- First-abort signal instrumentation, a controlled Web-versus-non-Web lifecycle matrix, safe Session continuity, and twelve runtime repair gates.
- A visual cancellation-chain guide and discovery entries for the 114th canonical English guide, grounded in upstream report #3542 and pinned rc.8 source.

## 0.5.87 - 2026-08-20

### Added

- A source-backed recovery runbook for `ERR_PNPM_UNEXPECTED_STORE` during DeepSeek Harness plugin updates.
- Linked-store, selected-store, and stable-store evidence capture; frozen relinking; repeat-stability gates; and a deterministic runtime repair boundary.
- A visual store-identity map and discovery entries for the 113th canonical English guide, grounded in upstream report #3545 and the rc.8 plugin forwarder.

## 0.5.86 - 2026-08-20

### Changed

- Expanded the standalone-pnpm runbook from Windows-only signatures to Linux ELF binaries, POSIX launchers, macOS native executables, and Windows EXE/CMD entrypoints.
- Added the pnpm 11 reproduction from upstream #3532, cross-platform probes, a safer runner classification, and explicit reasons not to adopt `shell: true` universally.
- Reworked the visual map and discovery copy around entrypoint bytes and direct-versus-Node execution while retaining the existing canonical URL.

## 0.5.85 - 2026-08-20

### Added

- A source-backed OpenCode Go runbook that separates model discovery, product endpoint, per-model protocol, entitlement, and regional availability.
- Three protocol-homogeneous route examples for Chat Completions, Responses, and Anthropic Messages, plus provider-response classification and data-residency gates.
- A visual routing map and discovery entries for the 112th canonical English guide, grounded in upstream report #3538, rc.8 discovery code, and OpenCode's official Go endpoint table.

## 0.5.84 - 2026-08-20

### Added

- A source-backed runbook for Web Client plugin failures that leave the rc.8 shell on `Failed to load plugins` while the Host remains healthy.
- A six-stage evidence matrix across manifest, arrival, registration, materialization, apply, and dependency settlement, plus transactional profile recovery and safe-mode design gates.
- A visual browser pipeline and discovery entries for the 111th canonical English guide, grounded in upstream report #3536 and the rc.8 boot kernel.

## 0.5.83 - 2026-08-20

### Added

- A source-backed capability design for sharing npm, pnpm, pip, Cargo, Go, and other dependency caches without granting arbitrary Host write roots.
- Trust-scope, namespace, path-admission, TOCTOU, concurrency, quota, and corruption-recovery requirements, with independent enforcement gates for bwrap, Landlock, Seatbelt, Windows ACL, and in-process filesystem tools.
- A visual architecture page and discovery entries for the 110th canonical English guide, grounded in upstream request #3527 and rc.8 policy code.

## 0.5.82 - 2026-08-20

### Changed

- Corrected the developer-role compatibility guide with the rc.7/rc.8 boundary: rc.8 natively exposes `supportsDeveloperRole` at route and model scope.
- Added exact YAML that preserves reasoning-effort selectors while keeping the system prompt on `system`, plus null-value, precedence, backport, and wire-verification guidance.
- Reworked the visual guide around the native rc.8 recovery and upstream reasoning-depth report #3531.

## 0.5.81 - 2026-08-20

### Changed

- Upgraded the Remote Web canonical guide with an rc.8 trace of `host.pickDirectory` HTTP 403 caused by a browser extension removing the serving port from the loopback `Origin` header.
- Added DevTools evidence capture, clean-profile and scoped-extension A/B tests, managed-extension handling, and the precise limit of the `localhost` workaround.
- Reworked the visual guide and discovery surfaces to separate pre-fetch UUID failures from Host/Origin authority rejection without weakening the Agent control-plane fence.

## 0.5.80 - 2026-08-20

### Added

- A source-backed Windows and offline-network runbook for `AbortSignal.any is not a function`, separating the shell-visible Node version from the executable and global owned by the running DSH process.
- PowerShell probes for PATH, shims, process images, `NODE_OPTIONS`, and runtime feature descriptors, plus controlled offline artifact recovery and ten acceptance gates.
- A visual runtime-identity map and homepage, sitemap, Atom, LLM, canonical, and troubleshooting discovery entries for the 109th English guide.

## 0.5.79 - 2026-08-20

### Changed

- Corrected the macOS persistent-Bash runbook to distinguish a C-locale readline Meta-binding trap from the earlier PTY transport-corruption hypothesis.
- Added an rc.8 source-backed diagnostic matrix, exact `--noediting` preset workaround, durable runtime repair boundary, and eight regression gates.
- Reworked the visual article and discovery surfaces around the 300-second CJK stall signature and upstream reproduction #3522.

## 0.5.48 - 2026-08-20

### Changed

- Replaced the count-bound social preview with a durable “Operator Guides” value signal so shared cards stay accurate as coverage grows.
- Preserved the existing SandBase architecture map, rc.8 evidence signal, Install Doctor, and Failure Router calls to action in a verified 1280 by 640 asset.

## 0.5.47 - 2026-08-20

### Added

- A pinned rc.8 runbook for recovering when an invalid `cordis.patch.yml` insert prevents a profile and its Web control plane from booting.
- The `--dump-default-config` recovery boundary, both user-layer owners, module-resolution probes, transactional writer requirements, and ten acceptance gates.
- A visual recovery map plus homepage, sitemap, Atom, and machine-readable discovery entries for the 83rd canonical English guide.

## 0.5.46 - 2026-08-20

### Added

- A pinned rc.8 map of the JSONL Session artifact, concatenated Zstandard frames, packed storage rows, and decoded logical events.
- Safe inspection steps and reader acceptance gates for `text-chunks`, `reasoning-chunks`, and `tool-call-chunks` without silent output loss.
- A visual format map plus homepage, sitemap, Atom, and machine-readable discovery entries for the 82nd canonical English guide.

## 0.5.45 - 2026-08-20

### Added

- A primary-source-backed comparison of DeepSeek Harness, Claude Code, and Codex focused on runtime ownership, extensions, policy, state, and migration contracts.
- A visual decision map, controlled evaluation gates, homepage discovery card, sitemap entry, Atom update, and machine-readable index entry.

## 0.5.44 - 2026-08-20

### Fixed

- Aligned the homepage evidence strip and social-card descriptions with the current 80 canonical guides.
- Corrected Open Graph image dimensions from 1200 by 400 to the asset's actual 1280 by 640 pixels and added explicit image type and X-card alternative text.
- Refreshed homepage asset version keys so deployed metadata and interaction code update together.

## 0.5.43 - 2026-08-20

### Added

- A source-backed runbook for plugin boot failures caused by a missing `@deepseek-ai/dsh-client-schema-form` import.
- Distribution-closure probes, plugin-versus-Host ownership routing, exact npm tag evidence, isolated compatibility testing, and ten acceptance gates.

### Changed

- The canonical, troubleshooting, homepage, sitemap, Atom, and machine-readable indexes now expose the new plugin-closure guide.

## 0.5.42 - 2026-08-20

### Changed

- Refreshed the repository social preview with the current 79-guide, rc.8, Install Doctor, and Failure Router value signals.
- Connected the same 1280 by 640 asset to the README and homepage Open Graph and Twitter metadata.
- Preserved the existing SandBase editorial identity and Agent runtime architecture diagram.

## 0.5.41 - 2026-08-20

### Changed

- Added the merged Awesome DeepSeek Harness listing as verifiable community adoption evidence.
- Connected English and Simplified Chinese entry points to the public source-backed runbook request Discussion.
- Added the same evidence-first topic route to the contribution guide.

## 0.5.40 - 2026-08-20

### Changed

- Upgraded the streamed tool-identity runbook to rc.8 with the Bailian/DashScope `deepseek-v4-flash` empty-string continuation incident.
- Added a control matrix, translator-to-BlockAssembler failure chain, safe route workaround, and regression fixtures for both empty-string and null continuation identities.
- Refreshed the visual guide, README, troubleshooting router, homepage search, sitemap, and Atom feed around the exact `UNKNOWN_TOOL` signature.

## 0.5.39 - 2026-08-20

### Changed

- Replaced the crowded English README action row with three task-oriented Run, Debug, and Build paths.
- Expanded the high-traffic Simplified Chinese navigation page with transparent coverage evidence, task-based entry points, local-tool privacy notes, and a direct contribution signal.
- Added direct Chinese navigation to Failure Router and the Session-title reasoning-budget runbook while preserving English as canonical.

## 0.5.38 - 2026-08-20

### Added

- A source-backed runbook for Session titles that remain on the deterministic fallback when reasoning consumes the auxiliary title request's output budget.
- A compact architecture page that distinguishes fallback creation, LLM refinement, title-event evidence, and UI projection.

### Changed

- The English, troubleshooting, homepage, sitemap, and Atom indexes now surface the Session-title reasoning guide.

## 0.5.37 - 2026-08-20

### Changed

- Promoted Install Doctor to the homepage primary action and added direct Install Doctor and Failure Router navigation.
- Replaced homepage article markup with WebSite and SoftwareApplication structured data for clearer search discovery.
- Added an Install Doctor entry to the high-traffic Simplified Chinese navigation page while keeping the tool English-canonical.

## 0.5.36 - 2026-08-20

### Added

- DeepSeek Harness Install Doctor, a local browser tool that generates OS-, install-path-, and symptom-specific evidence commands.
- Six failure routes across Windows, macOS/Linux, official npm, registry mirrors/proxies, and source checkouts, with matched success signals and guides.

## 0.5.35 - 2026-08-20

### Added

- A source-backed npm `ETARGET` runbook for rc.8 installs resolving stale package metadata through caches, mirrors, and proxies.
- Official-versus-configured registry routing, isolated-cache probes, dist-tag clarification, release-publisher gates, and an incident bundle.

## 0.5.34 - 2026-08-20

### Added

- A source-backed recovery guide for MCP tool descriptions that become unknown prompt variables inside the rc.8 Code Mode SDK section.
- Native/code/both routing, TypeScript and Python repair scope, strict-template preservation, fifteen regression gates, and an incident bundle.

## 0.5.33 - 2026-08-20

### Added

- A source-backed runbook for rc.8 root builds that exit zero without running under a Node 24 and `tsx` entrypoint path.
- Positive artifact-record checks, missing-output routing, bounded recovery, direct-execution repair requirements, twelve regression gates, and an incident bundle.

## 0.5.32 - 2026-08-20

### Changed

- Reworked the repository and Pages above-the-fold messaging around the complete Agent boundary, pinned source evidence, and direct task entry points.
- Added a responsive evidence strip for canonical coverage, rc.8 coverage, primary-source linking, and independent-project status.
- Expanded Open Graph and X card metadata and versioned the homepage CSS and JavaScript URLs to avoid stale Pages assets after releases.

## 0.5.31 - 2026-08-20

### Added

- A source-backed capability ledger for using the rc.8 automation-only ACP bridge with editor hosts such as Zed.
- A bounded source-demo probe, committed-versus-token streaming trace, Session-resume boundary, trust model, and twelve editor-facing acceptance gates.

## 0.5.30 - 2026-08-20

### Added

- A source-backed guide to the rc.8 unified tool-schema DSL and enforced raw JSON Schema subset.
- Representation-specific `additionalProperties` rules, type-array migration, exact-one `oneOf` behavior, unsupported-keyword routing, and twelve verification gates.

### Changed

- Linked the first-plugin tutorial directly to the detailed schema compatibility guide.

## 0.5.29 - 2026-08-20

### Added

- A source-backed runbook for plugin additions that materialize dependencies but exit nonzero before bundle reconciliation.
- A five-state installation model, bounded retry and rollback paths, existence-only activation warning, and twelve upstream regression gates.

## 0.5.28 - 2026-08-20

### Added

- A source-backed recovery guide for Sessions that fail to load with `received an update before its start Match`.
- Surface-replacement ordering diagnostics, evidence-preserving recovery, a three-path upstream repair contract, and twelve regression gates.

## 0.5.27 - 2026-08-20

### Added

- A source-backed rc.8 guide for Windows builds that pass native standalone `pnpm.exe` to Node through `npm_execpath`.
- Entry-point classification, Corepack recovery, four-runner impact mapping, neighboring-failure routing, and twelve upstream regression gates.

### Changed

- Updated official-project identity for the split release state: GitHub and npm `next` are rc.8 while npm `latest` remains rc.7.

## 0.5.26 - 2026-08-20

### Added

- A source-backed recovery guide for first Session flushes that fail because the POSIX filesystem rejects hard links.
- A capability probe, safe Session-root migration paths, fallback-semantics comparison, failure router, and twelve upstream acceptance gates.

## 0.5.25 - 2026-08-20

### Changed

- Corrected the rc.7 remote-Web guide: the generic Connection RPC uses an insecure-origin-safe UUID fallback, while typed `WebApiClient` calls and draft attachments still call `crypto.randomUUID()`.
- Added carrier-specific diagnosis, no-network-request evidence, safe recovery, updated visuals, and the official plain-HTTP field report.

## 0.5.24 - 2026-08-20

### Added

- A source-backed runbook separating DeepSeek model visibility, route registration, route selection, credential resolution, and network dispatch.
- An emergency stop, home-level hard-disable patch, effective-graph checks, egress verification, and twelve zero-surprise billing gates.

## 0.5.23 - 2026-08-20

### Changed

- Expanded the official-project identity guide to distinguish the DeepSeek AI Agent runtime from unrelated same-name API wrappers.
- Added behavior-based classification, common identity questions, search-oriented metadata, and a first-fold provenance route.

## 0.5.22 - 2026-08-20

### Added

- A source-backed recovery guide for prompts accepted into the Agent inbox but lost before a durable `user/message` event.
- A six-boundary submission trace, side-effect-safe replay router, two repair architectures, and twelve durability gates.

## 0.5.21 - 2026-08-20

### Added

- A source-backed guide separating answer language, exposed reasoning language, deployment persona, provider behavior, gateway injection, and Web locale.
- A fresh-Session A/B workflow, safe existing-row persona override, route-specific reasoning controls, and twelve language regression gates.

## 0.5.20 - 2026-08-20

### Added

- A source-backed router for pnpm peer-dependency and ignored-build warnings during plugin installation.
- A three-layer Host/profile resolution model, singleton-safety guidance, version-mismatch handling, and twelve acceptance gates.

## 0.5.19 - 2026-08-20

### Added

- A source-backed diagnosis for compaction summaries truncated at the 8,192-token default across llama.cpp and LM Studio routes.
- A context-shift versus durable-checkpoint model, three bounded recovery options, and twelve acceptance gates.

## 0.5.18 - 2026-08-20

### Added

- A source-backed recovery guide for Git-hosted plugins that install without their declared `dist/` or `lib/` runtime exports.
- A three-state build router, boot-safe removal path, publisher release gate, and twelve operator regression checks.

## 0.5.17 - 2026-08-20

### Added

- A source-backed diagnosis for `Output token limit reached` across DeepSeek, pi-ai, Ollama, and llama.cpp routes.
- A three-ceiling model, terminal-signal trace, bounded recovery, configuration precedence, and twelve regression gates.

## 0.5.16 - 2026-08-19

### Added

- A two-cause diagnosis for missing `ask_user_question` and approval cards after sleep, network loss, or reconnect.
- A three-owner state map, consent-safe recovery, heartbeat and resync repair boundaries, and twelve regression gates.

## 0.5.15 - 2026-08-19

### Added

- A source-backed Synology NAS deployment guide for Linux x64, pnpm workspaces, native addons, cwd-stable wrappers, and service operation.
- A secure remote-access topology that keeps the Agent Host loopback-only behind authenticated transport.

## 0.5.14 - 2026-08-19

### Added

- A source-backed diagnosis for native-Windows Hosts that freeze during the first large-workspace `workspace-write` grant.
- A synchronous control-plane trace, safe operator path, external-fix audit boundary, and ten repair invariants.

## 0.5.13 - 2026-08-19

### Added

- A source-backed diagnosis for Minimal preset Bash calls that fail before command execution on native Windows.
- A preset-to-platform trace, rc.7 recovery path, safe repair boundary, and eight regression gates.

## 0.5.12 - 2026-08-19

### Added

- A source-backed Code Mode diagnosis for nested Skill calls that succeed and render in Web UI but do not enter the next model context.
- A three-observer payload map, rc.7 workaround, instruction-channel repair shape, evidence bundle, and ten regression gates.

## 0.5.11 - 2026-08-19

### Added

- A source-backed diagnosis for todo lists that remain `in_progress` after an Agent's final answer.
- A four-owner state model, event-order router, safe recovery, bounded `agent/turn-stopping` reconciliation design, and ten regression gates.

## 0.5.10 - 2026-08-19

### Corrected

- Expanded the community-plugin audit around a verified rc.7 provider-swap incident: an installed bundle can disable existing filesystem, shell, PowerShell, and search rows while inserting replacements.
- Added pre-boot effective-composition diffing, core-row drift classification, platform-aware checks, and Agent probes that verify the actual filesystem and shell trust domain.

## 0.5.9 - 2026-08-19

### Corrected

- Distinguished the three-second Connection readiness guard from a stream-abort timeout: rc.7 proceeds after the guard while keeping both event pumps alive.
- Added a slow-link evidence timeline, safe remote diagnostics, and regression gates for readiness, unary RPC, stream lifecycle, and Session-history failures.

## 0.5.8 - 2026-08-19

### Corrected

- Expanded custom Session event compatibility with a real rc.7 incident showing that the same Harness version and an installed plugin still cannot register downstream reader vocabulary.
- Added a four-signal evidence matrix and clarified the difference between forensic confirmation and safe format-aware repair.

## 0.5.7 - 2026-08-19

### Added

- A source-backed recovery guide for Sessions poisoned by assistant tool calls with missing tool results after a scheduler failure.
- A lifecycle trace explaining why a closed error turn bypasses interrupted-tail repair, plus side-effect-safe recovery and regression gates.

## 0.5.6 - 2026-08-19

### Fixed

- Corrected stale English-canonical and homepage visual-index counts.
- Extended the content checker to keep the manifest, README coverage table, homepage hero, visual path index, and no-JavaScript result label consistent.

## 0.5.5 - 2026-08-19

### Added

- A source-backed recovery guide for `ERR_PNPM_ADDING_TO_ROOT` during profile plugin installation.
- Four post-install proof boundaries, nearby-error routing, and a durable CLI repair shape across affected and current pnpm releases.

## 0.5.4 - 2026-08-19

### Added

- A session-history recovery router that separates Zstandard frame damage, committed sequence gaps, and repeated provider tool-call ID collisions.
- A preserve-first workflow, four bounded recovery outcomes, and cross-layer regression gates grounded in three upstream reproductions.

## 0.5.3 - 2026-08-19

### Added

- A macOS persistent-Bash guide for non-ASCII command corruption that later surfaces as a missing-marker timeout.
- An evidence matrix, bounded recovery paths, a narrow serialization repair shape, and multilingual regression gates.

## 0.5.2 - 2026-08-19

### Added

- A source-backed OpenAI-compatible provider guide for gateways that reject the `developer` role.
- A role-decision map separating reasoning metadata, reasoning dialect, effort support, and message-role compatibility.
- Homepage guide counts advanced to 51 canonical guides and 45 visual paths.

## 0.5.1 - 2026-08-19

### Changed

- Replaced the stale 46-guide homepage label with the current 50-guide canonical count.
- Added an accessible, keyboard-friendly filter with live result counts and a real empty state for the 44 visual guide paths.

## 0.5.0 - 2026-08-19

### Added

- The fiftieth canonical guide: a source-backed correction and safe fix for dollar-sign corruption in plugin `tapIndex` replacement strings.
- `TechArticle` structured data on the new search-focused guide, while retaining the existing `robots.txt` sitemap discovery path.

## 0.4.9 - 2026-08-19

### Added

- A source-backed state map for the rc.7 coupling between Web session selection and the deployment-wide model default.
- Safe operating steps and verification gates for session, future-Agent, headless, and subagent routing boundaries.

## 0.4.8 - 2026-08-19

### Corrected

- Expanded the context-window runbook with the DeepSeek `quota_limit_reached` response that rc.7 can normalize as `INVALID_REQUEST`, bypassing automatic compaction.

### Changed

- Added a visual context-overflow classification, recovery, and regression guide with source-pinned evidence.

## 0.4.7 - 2026-08-19

### Added

- A source-backed `AGENTS.md` scope and precedence map covering user-global, project, local-overlay, nested, direct-user, and Skill instruction lifetimes.
- Baseline ordering, structured-fs nested discovery, touch-driven refresh, specificity-first budget behavior, and nine acceptance checks.
- An explicit rc.7 `$DSH_HOME/AGENTS.md` collision note with safe operating alternatives while upstream scope separation remains a proposal.

## 0.4.6 - 2026-08-19

### Added

- A source-backed incident runbook for OpenAI-compatible streams whose empty continuation fields erase a valid tool-call ID and name.
- A first-delta-to-policy visual trace, wire and Session evidence capture, safe route A/B isolation, and a seven-gate regression checklist.
- Explicit separation from tool registration failures, malformed arguments, and poisoned Session history.

## 0.4.5 - 2026-08-19

### Corrected

- Added the confirmed rc.7 UTF-16LE `U+XX00` low-byte truncation branch to the Windows native folder-picker runbook.
- Separated worker crashes from successful IPC carrying a silently shortened path, explained the downstream `ENOENT`, and added an exact two-byte terminator model.
- Tightened Unicode acceptance from generic CJK text to a regression path containing `开` (U+5F00), alongside the shipped browse-backend recovery.

## 0.4.4 - 2026-08-19

### Changed

- Expanded MCP troubleshooting into an Agent-preset ownership, generation, transport, discovery, registration, outage, and isolation runbook.
- Added source-backed stdio and Streamable HTTP examples, fresh-Session semantics, deterministic tool identity, reconnect lifecycle, security constraints, and a seven-gate acceptance test.
- Added a responsive MCP composition and missing-tools decision tree.

## 0.4.3 - 2026-08-19

### Corrected

- Expanded the HMR `--expose-internals` blast radius from a Web-only framing to every shared `runProfile()` path whose resolved composition lacks an HMR service, including headless and custom profiles.
- Documented why disabling the shared HMR row triggers the watch-only fallback, why removing only the constructor check would move rather than repair the crash, and why silent degradation breaks the patch-watching contract.

## 0.4.2 - 2026-08-19

### Added

- A provider-egress runbook for `DeepSeek API request ... failed` that separates DNS, TCP, environment-proxy, enterprise-CA, and HTTP response boundaries.
- Credential-free Node transport probes, version-gated proxy guidance, safe CA trust configuration, ingress-versus-egress routing, and restart acceptance checks.

## 0.4.1 - 2026-08-19

### Added

- A Windows folder-picker worker-crash runbook that separates Node/Koffi path decoding, incomplete native installation, and stale-process failure branches.
- A reversible switch to the shipped in-browser directory picker, clean Node-version A/B procedure, unsafe-workaround warnings, and cross-backend acceptance matrix.

## 0.4.0 - 2026-08-19

### Changed

- Expanded the headless quickstart into a current rc.7 CLI lifecycle guide that distinguishes the shipped profile launcher from a terminal chat UI.
- Added exact stdout, stderr, exit-status, configuration-dump, unattended approval, CI evidence, app-argument, and community-TUI audit contracts.

## 0.3.9 - 2026-08-19

### Changed

- Replaced the pre-rc.7 `crypto.randomUUID` incident note with a current remote Web access topology and acceptance guide.
- Documented the rc.7 insecure-origin UUID fix, intentional `0.0.0.0` refusal, Host and Origin trust fence, loopback-only methods, SSH forwarding path, and authenticated HTTPS gateway boundary.

## 0.3.8 - 2026-08-19

### Added

- A source-backed decision guide that separates DSH Sessions, compaction, Skills, application records, and cross-session memory.
- A migration acceptance record, community-plugin release gate, and visual architecture page for moving Codex or Claude Code memory without losing provenance.

## 0.3.7 - 2026-08-19

### Added

- A single-writer Session-root runbook for concurrent Web, headless, ACP, SDK, service, and test processes.
- A visual topology guide that separates concurrent roots from serialized shared-history handoffs and preserves evidence after suspected writer overlap.

## 0.3.6 - 2026-08-19

### Added

- A source-backed runbook for misleading `spawn bash ENOENT` failures after a Session workspace is moved, renamed, deleted, or unmounted.
- A visual failure route that separates executable discovery from child-process cwd validity and warns against treating an empty directory as recovery.

## 0.3.5 - 2026-08-19

### Added

- A reversible upgrade guide that separates CLI artifacts, source revisions, profile dependencies, configuration, and durable Session state.
- A visual upgrade page with stopped-writer capture, isolated-home testing, ten compatibility gates, promotion evidence, and full-state rollback.

## 0.3.4 - 2026-08-19

### Added

- A six-gate community-plugin audit from discovery through package identity, published-artifact inspection, Host-effect mapping, isolated installation, and reversible removal.
- A visual supply-chain page that separates ecosystem discovery signals from executable trust evidence.

## 0.3.3 - 2026-08-19

### Added

- An installation-topology guide for exact-version npm execution, project-local repeatability, official source checkouts, and global-command diagnosis.
- A visual installation chooser that separates executable identity, profile state, and workspace reach before the first run.

## 0.3.2 - 2026-08-19

### Added

- A practical Skills lab covering project-local authoring, routing descriptions, Agent-selected and user-explicit invocation, and observable compliance evidence.
- A visual Skills page with progressive-disclosure anatomy, discovery ranks, monorepo root behavior, invocation policy, hot refresh, and missing-Skill diagnosis.

## 0.3.1 - 2026-08-19

### Added

- A complete first-plugin lab that takes one capability from a local TypeScript module through a typed Agent tool to an installed DSH bundle.
- A visual tutorial page, HowTo structured data, install-safe provenance checks, bundle/profile separation, acceptance evidence, and a first-failure router.

## 0.3.0 - 2026-08-19

### Added

- An official-project identity guide that connects the DeepSeek AI repository, scoped npm package, rc.7 release tag, commit, executable, and independent handbook boundary.

### Changed

- Updated Field Status, Version Evidence, navigation, machine-readable indexes, and social preview metadata from rc.6 to the verified rc.7 release coordinates.

## 0.2.9 - 2026-08-19

### Added

- A macOS workspace-picker guide for firmlinked APFS paths where AppleScript leaks a terminal HFS colon before the POSIX slash.
- Exact picker-output evidence, a narrow normalization boundary, reversible recovery choices, and adapter-plus-registry acceptance tests.

## 0.2.8 - 2026-08-19

### Added

- A source-backed diagnosis for pnpm global installs where native platform-package resolution fails before an installed bare plugin is misleadingly reported as missing.
- Physical-layout evidence, an exact-version project-local A/B, reversible recovery paths, and a cold-restart acceptance test for future fixes.

## 0.2.7 - 2026-08-19

### Added

- A plugin-development guide for custom durable Session events, strict unknown-event refusal, and the currently incomplete downstream `ignorable` writer path.
- Storage-by-semantics guidance, cold-resume compatibility gates, immutable recovery steps, and a reusable plugin release record.

## 0.2.6 - 2026-08-19

### Added

- A source-startup guide for `--expose-internals is required for HMR service` that separates the visible flag from package-manager and native-helper discovery failures.
- Install-topology routing, pinned-pnpm validation, a clean-clone A/B, helper-resolution probe, and a direct-flag diagnostic that is explicitly not a durable workaround.

## 0.2.5 - 2026-08-19

### Added

- A defensive Code Mode trust-boundary guide that separates worker-thread reliability containment from enforceable OS isolation.
- A deployment decision matrix, non-invasive exposure checks, native-mode rollback, outer-isolation requirements, and incident-response checklist.

## 0.2.4 - 2026-08-19

### Added

- A Windows recovery runbook for `ReplaceFileW EACCES (Win32 5)` when an existing profile file is held by HMR.
- A reversible stop, evidence, backup, edit, dump-config, restart, and rollback workflow that preserves atomic publication semantics.

## 0.2.3 - 2026-08-19

### Added

- A TTFT measurement guide that separates Host outbound, provider, and Host inbound latency before attributing a slow first token.
- A source-backed A/B ladder for mature Sessions, concurrent subagents, Session snapshot rebuilds, token-meter observation, and fork seed validation.

## 0.2.2 - 2026-08-19

### Added

- A recovery runbook for Sessions that repeatedly fail with provider JSON errors after malformed streamed tool-call arguments enter durable history.
- A safe evidence workflow using the Web Session export, fresh-Session isolation, and read-only inspection instead of live compressed-log edits.

## 0.2.1 - 2026-08-19

### Added

- A source-backed emergency runbook for cancelling runaway Agent turns, distinguishing repeated tool calls from provider retries and background work, and containing spend with an independent provider-side boundary.
- A visual control matrix that separates concurrency, response output, compaction, tool timeouts, retries, and account quotas.

## 0.2.0 - 2026-08-17

### Added

- Operational runbooks for context-window overflow, plugin recovery, HTTP/2 session failures, remote Web secure-context failures, non-FHS PTY shells, live session durability, and Windows startup boundaries.
- Architecture guidance for Sessions versus long-term memory.
- Provider guidance for local Ollama and bounded subagent scaling.
- A versioned static site source under `site/`.

### Changed

- GitHub Pages now deploys automatically from the same `main` commit that owns the site source.
- Language coverage is reported explicitly instead of implying translation parity.
- CI checks both repository structure and external documentation links.

### Fixed

- Removed the manual `gh-pages` publishing gap that left the live site behind merged handbook content.

## 0.1.1 - 2026-08-15

- Added the first reviewed guide map and normalized the Apache-2.0 license.

## 0.1.0 - 2026-08-14

- Published the initial agent-first handbook, field guide, and contribution workflow.
