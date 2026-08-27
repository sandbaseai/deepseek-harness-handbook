---
title: Design a Multi-Session Presentation Contract for DeepSeek Harness Web
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-27
upstream_ref: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Design a multi-Session presentation contract for Web

This design guide evaluates how DeepSeek Harness Web could display two or more real Sessions without breaking the existing single-Session Client plugin contract.

It is not a description of a shipped rc.2 feature. At rc.2, one current Session owns the staged event window, current provide bundle, SessionProvider, conversation surface, and sidebar selection. Official discussion #4718 proposes an additive presentation protocol; this guide separates the verified current boundary from the proposed contract and its missing decisions.

## Distinguish a second panel from a second mounted Session

A Client plugin can already render a floating panel in the root-scoped `shell.overlay` list slot. It can fetch and display conversation-shaped data of its own.

That panel is not automatically a mounted DSH Session. Without a runtime presentation seam it does not receive, as one coherent unit:

- the Session's scoped provide bundle and hooks;
- the official conversation renderer and view ring;
- per-Session slots contributed by other plugins;
- Host input, question, approval, cancellation, and model-selection routing;
- Session lineage, trajectory, attachments, drafts, projections, and lifecycle;
- event-window staging and deferred teardown semantics.

The missing capability is therefore not “draw two columns.” It is “bind two independently scoped Session subtrees to the official renderer at the same time.”

## Prove the rc.2 single-Session boundary

The current contract is single at several joined layers:

1. `SessionListState.current` is the persisted selection used by session-scoped surfaces.
2. `SessionRuntime` stages the event window by following that current id.
3. `currentProvideInfo` publishes one atomic current-Session bundle to the renderer.
4. `SessionProvider` reads that one observable rather than accepting an arbitrary Session id.
5. The top-level `conversation` slot is `single` and `session-maybe` scoped.
6. `conversation.session` is a single, Session-scoped body.
7. `conversation.view` is a list of views **inside that body**, rendered one at a time with `only: <active id>`.

The source comment says staged state can widen to a multi-pane list later. That is a direction marker, not a public protocol or compatibility promise.

## Keep membership separate from focus

A multi-Session state should keep at least three independent facts:

```ts
interface SessionPresentationState {
  visible: readonly SessionId[]
  focused: SessionId | undefined
  capacity: number
}
```

- `visible` owns membership and stable presentation order.
- `focused` owns keyboard, composer, command, and other singular interaction routing.
- `capacity` limits membership; it does not infer which Session to evict.

Focus must not reorder, mount, or unmount panes. Membership changes must not be smuggled through focus changes. A Session may be visible but unfocused, focused only if visible, and neither visible nor focused while still existing durably.

## Define every state transition

Names such as `open`, `focus`, and `close` are insufficient without edge semantics.

### `open(id)`

- Reject or no-op for an unknown, removed, or unauthorized Session according to a typed result.
- If already visible, preserve order and decide explicitly whether it also gains focus.
- If capacity is available, append at a specified position and create one render binding.
- If full, do not silently evict. Return `capacity-exceeded`, or require an explicit replacement operation naming the victim.

### `focus(id)`

- Require `id` to be visible.
- Change only interaction routing and focus styling.
- Preserve every pane's React identity, draft, scroll state, active view, and subscriptions.

### `close(id)`

- Remove only presentation membership; never archive, delete, cancel, or mutate the durable Session.
- Dispose that pane's render binding and page-local resources.
- If it was focused, choose the next focus deterministically: previous neighbor, next neighbor, or none. Pin one rule.
- Keep the underlying Session runtime alive only when another owner still requires it.

### External Session removal

If a visible Session is removed by the Host, reconcile it as a distinct external event. The presentation service must remove the pane, settle focus, stop pending interactions from targeting it, and release its scope without treating removal as a user `close`.

## Make capacity arbitration safe

An effect-scoped capacity request is preferable to a global setter because plugin lifetime should own the grant:

```ts
const release = presentation.requestCapacity(2)
// plugin disposal calls release()
```

For max-wins arbitration:

- validate a finite positive integer within a Host-defined upper bound;
- give each requester an opaque holder token;
- make its disposer idempotent;
- recompute the maximum from live holders plus default `1`;
- do not let one plugin release another plugin's grant;
- expose the effective capacity and, if needed, request provenance for diagnostics.

When capacity shrinks below `visible.length`, never silently destroy panes. Keep current membership while refusing new opens, or require a deterministic, user-visible reconciliation action. Capacity is an admission limit, not disposal authority.

## Bind render state by explicit Session identity

The rc.2 renderer Host exposes one `sessions.provideInfo` observable. A multi-pane contract needs a render-safe way to obtain a stable provide bundle for a named visible Session.

Possible shapes include:

```ts
presentation.provideInfo(id): HostObservable<SessionProvideInfo>
```

or a provider component whose identity is explicit:

```tsx
<SessionProvider sessionId={id}>...</SessionProvider>
```

Whichever shape is chosen must guarantee:

- one stable binding per `(page, Session id)` while visible;
- the same standard-kit hooks and props as the current Session provider;
- independent subscription, replay, draft, scroll, image, and view state;
- complete disposal after the last render owner releases it;
- no use of global focus as the implicit data source for a pane already rendering another id.

If a pane reads `currentProvideInfo`, changing focus will retarget its data without changing its component identity. That is precisely the class of cross-Session bleed the new protocol must eliminate.

## Define Session-scoped slot multiplicity

Today a Client plugin can reasonably assume that each Session-scoped registration appears for one visible Session at a time. With two panes, the same registration may render twice concurrently with different Session ids.

The protocol must state:

- whether every visible pane instantiates every Session-scoped slot;
- whether interaction-only slots render for the focused pane only;
- how root and `session-maybe` slots receive focus and membership;
- whether a Session-scoped store instance is keyed only by Session id or also by pane occurrence;
- how `SessionProvider` and inject factories bind the exact id;
- whether two panes may ever show the same Session and, if so, whether their drafts and scroll state are shared.

A safe first contract forbids duplicate Session ids in `visible`, renders data/view slots per visible Session, and centralizes singular input routing in the focused pane. If composer UI is rendered in every pane, unfocused composers must be explicitly inert rather than merely visually dimmed.

## Preserve interaction authority

Multi-pane presentation multiplies race surfaces:

- keyboard shortcuts need one focused Session target;
- commands opened from a pane need that pane's explicit id;
- questions and approvals must remain correlated to their owning Session and call;
- model selection must not change another visible Session;
- drag, paste, file upload, and send actions need the pane identity captured at initiation and revalidated at settlement;
- focus moving while an async action is pending must not retarget the completion.

Never resolve the target from global focus after an async boundary. Capture the authorized Session id at the event boundary, then fail if it is removed or the operation is cancelled.

## Keep navigation and presentation distinct

Sidebar selection currently means current Session. In a multi-pane UI, a click needs explicit product semantics:

- ordinary click replaces the focused pane;
- modified click opens beside it when capacity allows;
- focus styling and membership badges are distinct;
- URL/history state serializes membership, order, focus, and layout only if the privacy and size policy permits;
- browser Back/Forward restores a validated presentation snapshot without reopening deleted or unauthorized Sessions.

Do not overload a single `selected` bit with visible, focused, recently active, running, or attention-required states.

## Treat compatibility as opt-in

Default capacity `1` preserves the existing shape only when no requester is active. Once a plugin requests more panes, previously installed Client plugins enter a concurrency state they could not construct on rc.2.

Adopt capability negotiation rather than assuming compatibility:

```ts
interface SessionsPresentation {
  protocol: 1
  capabilities: {
    multipleVisible: true
    focusedInteraction: true
    perVisibleSessionSlots: true
  }
}
```

The number should identify a published contract, not the iteration count of one fork. Additive optional fields can evolve within a protocol; semantic breaks require negotiation or a new version. Unknown versions must fail closed to single-pane behavior.

Plugins that render Session-scoped UI should declare whether they support concurrent visible Sessions. The Host can refuse capacity greater than one when an active critical plugin is unverified, or expose an explicit compatibility warning instead of discovering corruption through user state.

## Persistence and recovery

Persist presentation state separately from durable Sessions. Validate on restore:

- schema and protocol version;
- unique Session ids;
- existence and authorization;
- capacity bounds;
- focused id membership;
- layout ratio bounds;
- maximum serialized panes and data size.

If validation fails, fall back to one safe Session or the empty state. Never delete, archive, or edit Session history because a presentation snapshot is invalid.

## Failure router

| Symptom | First invariant |
|---|---|
| both panes suddenly show the focused Session | pane provider resolved through global current/focus |
| switching focus remounts both conversations | focus and membership transitions are coupled |
| typing in the left pane sends to the right | async action resolved target from late global focus |
| plugin state leaks between panes | store/inject cache lacks Session identity |
| closing one pane deletes history | presentation close crossed into Session lifecycle |
| capacity grant disappears too early | holder disposal or arbitration is not effect-owned |
| capacity shrinks and a pane vanishes | admission limit was used as eviction authority |
| old plugin crashes only in split view | Session-scoped multiplicity was not negotiated or tested |
| view tabs from one pane change the other | active-view store is global instead of per Session |
| refresh opens removed Sessions | persisted presentation snapshot was not revalidated |

## Acceptance matrix

- Capacity defaults to one with byte-for-byte equivalent single-pane state transitions.
- `visible` contains unique, authorized, existing Session ids in stable order.
- `focused` is absent or a member of `visible`.
- Focus never changes membership, order, or pane component identity.
- Opening an existing Session has one documented idempotent result.
- Opening at capacity never evicts implicitly.
- Closing presentation never archives, deletes, cancels, or rewrites a Session.
- Closing the focused pane chooses the documented neighbor deterministically.
- Capacity holders are opaque and double disposal is harmless.
- Capacity reduction below membership does not destroy panes.
- Every pane receives the provide bundle for its explicit Session id.
- Session-scoped hooks, stores, projections, drafts, images, and views cannot cross ids.
- Singular user interactions route through one focused authority.
- Async actions retain their originating Session identity across focus changes.
- Questions and approvals remain bound to exact Session and call identity.
- External removal reconciles membership and focus without corrupting survivors.
- Existing Client plugins are classified as multi-visible compatible or unverified.
- Unknown presentation protocols fall back safely to capacity one.
- Persisted state is bounded, versioned, and revalidated on restore.
- Browser Back/Forward cannot reopen unauthorized or deleted Sessions.
- Two-pane disposal leaves no subscriptions, object URLs, timers, or scopes behind.
- Repeated open/focus/close cycles preserve Session logs and official single-pane behavior.

## Source boundary

Verified against DeepSeek Harness `0.1.1-rc.2` commit `b150a551b8d465e31e418e1b2eaf5e79bbb7d28e` and proposal discussion #4718. Multi-Session presentation is not shipped in that revision; API sketches and acceptance rules in this guide are design recommendations.

- [Session Presentation proposal #4718](https://github.com/deepseek-ai/deepseek-harness/discussions/4718)
- [rc.2 Session runtime and single staged selection](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/runtime/src/client/sessions/service.ts)
- [rc.2 renderer Host contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-slots/src/renderer.ts)
- [rc.2 SessionProvider implementation](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/web-react/src/session-provider.tsx)
- [Conversation SlotMap declaration](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-conversation/src/client/contract/slots.ts)
- [Single active conversation view rendering](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-conversation/src/client/skeleton/ConversationSession.tsx)

