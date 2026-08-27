---
title: Restore a Clipped DeepSeek Harness Settings Navigation
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-27
upstream_ref: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# Restore a clipped DeepSeek Harness Settings navigation

When enough Client plugins register `settings.section`, rc.2 can render navigation rows below the Settings panel's clipped boundary with no scroll route to them. Repair the flex chain so the list—not the title or whole dialog—owns vertical overflow.

> [!NOTE]
> This guide verifies the source condition reported in upstream discussion [#4729](https://github.com/deepseek-ai/deepseek-harness/discussions/4729). The report's runtime reproduction is community evidence; this handbook did not install its exact plugin set.

## Confirm the three-node failure chain

At commit `b150a55`:

1. `.panel` has a viewport-bounded fixed height and `overflow: hidden`.
2. `.nav` is a fixed-width vertical flex column.
3. `.navList` is a vertical flex container, but has no flex growth, shrink allowance, or overflow rule.
4. Every `settings.section` ledger entry becomes one `.navCell` button.

The content column already uses the correct pattern: `.options` has `flex: 1`, `min-height: 0`, and `overflow-y: auto`. The navigation column does not. Once its rows exceed available height, the panel clips them.

Use DevTools to prove the boundary before editing:

```js
const panel = document.querySelector('[role="dialog"]')
const nav = panel?.querySelector('nav')
const list = nav?.querySelector('div:nth-child(2)')

({
  panelHeight: panel?.clientHeight,
  navHeight: nav?.clientHeight,
  listClientHeight: list?.clientHeight,
  listScrollHeight: list?.scrollHeight,
  listOverflowY: list && getComputedStyle(list).overflowY,
})
```

Use the generated CSS-module classes only for diagnosis. Patch the source class in `SettingsRoot.module.css`; hashed build names are not a stable interface.

## Apply the narrow source repair

```css
.navList {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
```

The three added declarations work together:

- `flex: 1` assigns the remaining navigation-column height to the list;
- `min-height: 0` lets a flex child shrink below its min-content height;
- `overflow-y: auto` turns excess rows into scrollable overflow only when needed.

Keep the Settings title outside the scroller. Moving overflow to `.nav` would scroll the title away and change its accessible labeling context. Moving it to `.panel` would make the content page, close control, and navigation share one scroll position.

An optional bottom inset belongs either on the list or in the nav padding, but include it in geometry tests. Do not add both and silently reduce the visible row count.

## Contain the problem on an installed build

If you cannot rebuild the affected source:

- browser zoom-out may expose a blocked row temporarily, but it is an accessibility-hostile diagnostic rather than a fix;
- remove or disable only a known optional plugin if you already have a supported route to do so outside the inaccessible Settings row;
- do not edit a hashed CSS bundle or files inside an npx cache as a durable repair;
- do not delete profile state merely to reduce the number of registrations.

Record the exact DSH version and wait for or apply a pinned upstream source fix. A later package reinstall can replace ad-hoc installed-file edits without warning.

## Test reachability, not scrollbar decoration

A visible scrollbar is not the primary contract. Every registered navigation button must be reachable and activatable by pointer and keyboard.

Create enough deterministic `settings.section` fixtures to overflow the smallest supported dialog height, then assert:

```ts
const navList = page.getByTestId('settings-nav-list')
const last = page.getByRole('button', { name: 'Fixture section 24' })

await expect.poll(async () => navList.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true)
await last.scrollIntoViewIfNeeded()
await expect(last).toBeVisible()
await last.click()
await expect(page.getByTestId('section-fixture-24')).toBeVisible()
```

Prefer a stable test identifier or owned locator over `nth-child(2)`. The DevTools probe above is intentionally disposable; a regression test should target the source component contract.

### Keyboard path

The current dialog initially focuses the close button. Test the complete supported navigation behavior rather than assuming arrow-key semantics that the component does not implement:

1. open Settings;
2. tab until a navigation button receives focus;
3. continue through off-screen buttons;
4. assert the focused button is scrolled into view;
5. activate the last button with Enter and Space;
6. press Escape and confirm the dialog closes.

If the product later adopts a tablist or roving-tabindex pattern, that is a separate accessibility contract and needs matching roles, selection, focus, and arrow-key behavior. CSS overflow alone must not pretend to provide it.

## Cover responsive and dynamic cases

The panel height is `min(800px, calc(100vh - 48px))`, so a test that passes only on a tall desktop misses the actual boundary. Exercise at least:

| Case | Evidence |
|---|---|
| few sections, tall viewport | no overflow; rows remain top-aligned |
| many sections, tall viewport | list scrolls; title and close control stay fixed |
| many sections, short viewport | first and last rows both become reachable |
| section added while open | scroll geometry updates without closing the dialog |
| active section removed | render falls back to the first remaining row, as rc.2 already specifies |
| locale expands labels | ellipsis remains horizontal; vertical reachability is unchanged |
| 200% zoom | usable viewport still exposes a scroll path |
| mouse wheel, trackpad, touch | the list consumes vertical motion while hovered or touched |
| keyboard focus below fold | browser scrolls the focused button into view |
| dark and light themes | inherited scrollbar tokens remain legible |

## Avoid common partial fixes

| Attempt | Why it is incomplete |
|---|---|
| add only `overflow-y: auto` | the list can remain at its min-content height instead of receiving a bounded scroll box |
| add only `max-height` | duplicates panel geometry and can drift across viewport and design changes |
| remove `panel` clipping | leaks content beyond rounded corners and does not choose the correct scroll owner |
| scroll `.nav` | moves the Settings title and changes the intended fixed chrome |
| scroll `.panel` | couples two columns and the close action to one position |
| reduce row height | delays the failure but preserves the unbounded term |
| hide plugin rows | makes registrations undiscoverable rather than reachable |
| patch the hashed class | breaks on the next CSS-module build |

## Regression gates

- The list has a finite `clientHeight` below its `scrollHeight` in the overflow fixture.
- Every registered `settings.section` row exists in the accessibility tree.
- The first and last buttons can both be scrolled fully into view.
- Clicking the last row renders only its corresponding section.
- Enter and Space activate an off-screen row after focus reaches it.
- Focus traversal scrolls the active element into view.
- Escape still closes the dialog from a focused navigation row.
- The Settings title remains visible at maximum list scroll.
- The content-column close button remains visible at maximum list scroll.
- Scrolling the navigation does not change the content-column scroll position.
- Scrolling the content does not change the navigation position.
- Few-section layouts have no unnecessary scrollbar.
- Adding and removing section registrations recomputes overflow without stale rows.
- Removing the active section preserves the existing first-row fallback.
- Long localized labels remain ellipsized and retain an accessible full name.
- Short viewports and 200% zoom preserve reachability.
- Pointer wheel, trackpad, touch, and keyboard paths are covered where supported.
- Light and dark themes keep the inherited scrollbar thumb visible.
- Rounded panel clipping remains intact.
- No test depends on a generated CSS-module class name.

## Primary sources

- [rc.2 Settings panel, navigation, and content overflow CSS](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-settings-general/src/client/SettingsRoot.module.css)
- [rc.2 Settings navigation projection and dialog focus behavior](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-settings-general/src/client/SettingsRoot.tsx)
- [rc.2 `settings.section` slot contract](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/client/ui-settings/src/client/contract/slots.ts)
- [Upstream clipped Settings navigation report #4729](https://github.com/deepseek-ai/deepseek-harness/discussions/4729)

## Related handbook guides

- [Extend the Web UI with a persistent Client plugin](../plugin-development/persistent-web-ui-client-plugin.md)
- [Recover Web from a Client plugin boot failure](web-client-plugin-boot-failure.md)
- [Keep plugin installation and removal recoverable](plugin-install-recovery.md)
