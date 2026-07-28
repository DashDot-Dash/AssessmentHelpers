# Design changelog

Visual changes only. Add the candidate entry in the implementation PR; it
becomes the record of what shipped when the human-approved PR merges. Plans
remain in `proposals/`.

Add an entry when a release candidate alters what a marker sees. Include the
script version, because that is the durable link between a look and a release.

Format:

```
## <date> — <script> @ <version>
<what changed, one line>
Proposal: <number, or "none">
Overrides: <any design decision changed for a functional reason, and why>
```

---

## 2026-07-27 — baseline

No changes. This is the starting record: the dock as it shipped at `1.0.0`,
documented in `specs/dock.md` and rendered in `reference/dock.html`.

Everything in `proposals/` is unshipped as of this date.

---

<!-- New entries go directly below this line, newest first. -->

## 2026-07-27 — lazy-p5.user.js @ 1.5.0, lazy-padlet.user.js @ 1.6.0
Gave both cards a real header band (`var(--ah-header)`) behind the title/identity row,
matching the panel-based helpers, instead of the title text just floating directly on the
card's `--ah-shell` background — that flat expanse of shell color was what read as
"different from the rest of the suite."
Implementation: `.lazyP5-header`/`.lazypadlet-header` now bleed to the card's top/left/right
edges via negative margins equal to the card's own padding, carry their own
`var(--ah-header)` background and a `border-bottom: 1px solid var(--ah-border-soft)` divider
— the same construction as `.cp-head` etc. Added `overflow: hidden` to the card so the
header's square corners get clipped to the card's 10px radius without needing separate
corner-radius math on the header itself.
Moved the accent stripe from the whole card (`.lazyP5-card::before`, spanning full height,
added two change requests ago) onto the header specifically (`.lazyP5-header::before`,
12px, header-height only) — this is what the "real" panels actually do (the stripe was only
ever a header decoration there, e.g. `.cp-head::before`); spanning the full card was a
compromise made when there was no header band to attach it to. The stripe still fades out
via the existing `is-open` class when a sketch/Padlet is opened (same behavior as before,
just now scoped to the header rather than the whole card) — the header band itself stays
visible always, since real headers elsewhere in the suite don't disappear.
Test impact: `tests/lazy-viewers-smoke.js` read the stripe via `getComputedStyle(card,
'::before')`; updated to read it from the header element instead
(`getComputedStyle(header, '::before')`), passing the header as a new argument to the
shared `styles()` helper.
Proposal: none — a direct instruction, not a design-system decision.
Overrides: none.

## 2026-07-27 — canvas-rubric-builder.user.js @ 1.2.0
Restyled just the floating launcher button (the draggable "Rubric Builder" pill) to match the
rest of the suite: v2 palette (yellow accent, cool grey ramp, `#1d272d` shell), the same
12px `::before` accent stripe used elsewhere, and the header-title convention of regular
(400) font-weight instead of the browser-default button weight. Left the modal it opens
untouched — it's a deliberately different light-theme surface (rubric library/selection UI
with far more information density than a helper panel), and restyling it is explicitly a
later, separate decision, not part of this pass.
Structural note: this script had no injected `<style>` element at all before now — the
launcher was built entirely from inline `style.cssText`, which can't express a `::before`
pseudo-element. Added a small dedicated stylesheet (`addLauncherStyles()`, guarded by a new
`LAUNCHER_STYLE_ID` constant) scoped to the launcher's own id, carrying the full standard v2
token block (same shape as every other script's, even though only a few of those tokens are
actually consumed here — kept it consistent in shape with the rest of the suite rather
than hand-trimming a bespoke subset). The launcher's own inline styles still set
background/color/border via `var(--ah-*)`, which resolve correctly since the custom
properties are declared on the same element via the stylesheet rule and inline declarations
don't need to re-declare them to use them.
Proposal: 0001, 0002 (partial — launcher only, by explicit instruction; interior modal is
out of scope for now).
Overrides: none.
This completes the visual pass across all eight production userscripts.

## 2026-07-27 — lazy-p5.user.js @ 1.4.0, lazy-padlet.user.js @ 1.5.0
Added the suite's accent stripe. Previously each card had a plain `border-left: 4px solid
var(--ah-accent)` running its full height — not the same visual as the rest of the suite,
which uses a bolder 12px stripe via a `::before` pseudo-element (see Copy/Paster's `.cp-head`,
Dock's `.vc-dock-header`, etc). Replaced the border with the same `::before` pattern, sized to
match (`width: 12px`, rounded to follow the card's own 10px corner radius on the left side
only). Per instruction, the stripe fades out and the card's left padding collapses back to
match the other sides once a sketch/Padlet is actually open (a new `is-open` class toggled in
`createIframe()`/`stopSketch()` and `createIframe()`/`stopViewing()`), so the accent only
occupies space while the card is idle.
Structural note: because these cards use uniform padding (no separate header band flush with
the card edge, unlike the panel-based helpers), a straight copy of the panel pattern would
have made the stripe visually float, detached from the card's top-left corner. Scoped the
stripe to the card itself rather than the header row, with the card's own `padding-left`
widened by 12px to keep content clear of it, and both sides transition together
(`transition: padding-left/opacity 120ms ease`) so the stripe's disappearance and the content
reflow read as one motion, not two.
Test impact: `tests/lazy-viewers-smoke.js` asserted the accent via
`getComputedStyle(card).borderLeftColor`, which no longer carries the accent color now that
it's a `::before` background. Updated to read
`getComputedStyle(card, '::before').backgroundColor` instead.
Proposal: none — a direct instruction, not a design-system decision.
Overrides: none.

## 2026-07-27 — lazy-p5.user.js @ 1.3.0, lazy-padlet.user.js @ 1.4.0
Removed the idle "Preview is stopped."/"Viewer is stopped." status message shown on load and
after clicking Stop — it was permanent, static text that added no information (the Run/View
button itself already shows the same state) but always reserved a line of vertical space in
every card. The status element itself is kept for genuinely useful transient messages
(loading, loaded, error, collapse/expand), and `:empty` styling zeroes out its
`min-height`/`margin-top` so idle cards no longer reserve that space at all.
Proposal: none — a direct instruction, not a design-system decision.
Overrides: none.

## 2026-07-27 — lazy-p5.user.js @ 1.2.0, lazy-padlet.user.js @ 1.3.0
Adopted proposal 0002 §A (yellow accent) and §B (cool grey ramp), plus the 0001 token block,
bringing these two into line with the rest of the suite. Also lightened the card label
(`.lazyP5-label`/`.lazypadlet-label`) from font-weight 750 to 400, matching the header-title
convention just established across the panel-based helpers.
Proposal: 0001, 0002
Overrides: none. Fixed the same `var(--ah-shell)`-for-text-on-accent mislabel found in most of
the other scripts (`.lazyP5-button-primary`/`.lazypadlet-button-primary` + hover), now
`var(--ah-accent-ink)`.
Structural difference: neither script has a persistent panel (no dock, no minimise button,
nothing scoped to a unique id) — they inject inline "card" widgets directly into Canvas page
content, one per detected sketch/Padlet link, and several can exist on a page at once. So the
token block is scoped to the shared card class (`.lazyP5-card` / `.lazypadlet-card`) rather
than an id, per the token README's guidance that the scope only needs to avoid `:root` — every
card instance carries its own copy of the same custom properties, which is harmless
duplication, not a conflict.
Also updated `tests/lazy-viewers-smoke.js`, which asserted the old v1 computed colors
(`rgb(24, 24, 27)` shell, `rgb(214, 162, 29)` accent) directly — now asserts the v2 values
(`rgb(29, 39, 45)`, `rgb(245, 197, 24)`). This was the only suite test with baked-in color
literals; the dock/other-script tests don't assert colors so they needed no change.

## 2026-07-27 — header title weight + minimise button, five scripts
Standardized on Copy/Paster's existing (unintentional) baseline: header titles at 13px/400
regular weight (was 700/750/800 and, in two cases, a different font-size — Dock at 11px,
GradeBridge at 14px — depending on the script), and minimise/toggle buttons using the plain
button treatment (`--ah-shell` background, `--ah-text` icon, `--ah-border` border, hover to
`--ah-control-hover`) instead of whichever ad hoc variant each script had grown: Dock and
GradeBridge used a borderless translucent-overlay button (`--ah-toggle`/`--ah-toggle-hover`);
ETA and Tutorial Sorter reused their "quiet" button class (header-colored background, muted
icon) for the minimise button specifically. Benchmarker's minimise button already matched
Copy/Paster's plain-button look and needed no change there — only its title weight.
Scripts touched: canvas-assessment-helper-dock.user.js @ 1.2.0,
canvas-speedgrader-benchmarker.user.js @ 1.3.0, canvas-speedgrader-gradebridge.user.js @ 1.2.0,
canvas-speedgrader-eta.user.js @ 1.3.0, canvas-speedgrader-tutorial-sorter.user.js @ 1.3.0.
Proposal: none — a direct instruction to converge on Copy/Paster's look, not a proposal doc.
Overrides: none.
Side effect: Dock's title had no `overflow`/`text-overflow` handling and relied on its old
11px size plus the dock's 152px width to avoid overflowing into the minimise button. Bumping
it to 13px made that a real risk, so I added `overflow: hidden; text-overflow: ellipsis;` to
`.vc-dock-title` as a companion fix — not requested directly, but necessary to ship the
requested change safely. Left `.vc-dock-tab` (the separate collapsed/minimized full-width
tab button, not the expanded header title) at its existing bold weight — it's a different
component serving a different purpose (a clickable re-expand affordance, not a label) and
wasn't part of what was asked.

## 2026-07-27 — canvas-speedgrader-tutorial-sorter.user.js @ 1.2.0
Adopted proposal 0002 §A (yellow accent) and §B (cool grey ramp), plus the 0001 token block —
same v2 values as Benchmarker @ 1.2.0, Dock @ 1.1.0, GradeBridge @ 1.1.0, Copy/Paster @ 1.2.0,
and ETA @ 1.2.0.
Proposal: 0001, 0002
Overrides: none. Fixed the same `var(--ah-shell)`-for-text-on-accent mislabel found in most
of the other scripts (`.chatster-ui-nav-block .chatster-ui-btn` + hover), now
`var(--ah-accent-ink)`. §C not applicable — no `.active`/toggle-state button class exists here.
Notable structural difference: this script scopes styles to a bare `.chatster-ui-panel` class
rather than `#${PANEL_ID}`-prefixed selectors, so the token block itself was declared on
`#chatster-lmg-panel` (the actual root id) as a sibling rule, ahead of `.chatster-ui-panel` —
custom properties still cascade to every class-selector rule below since they're all
descendants (or the element itself).
Also converted the drag-and-drop zone's active/inactive state colors, both in the
`panel.innerHTML` template (two near-duplicate blocks) and in `setZoneActive()`'s direct
`zone.style.*` assignments — all are genuine descendants of the panel (`panel.querySelector`
confirmed), so `var(--ah-*)` resolves correctly. Left the drop-active `rgba(255,255,255,0.45)`
border color and the two `#fff` "active" text colors as literals — no match in the shared
palette and not part of this pass's scope.

## 2026-07-27 — canvas-speedgrader-eta.user.js @ 1.2.0
Adopted proposal 0002 §A (yellow accent) and §B (cool grey ramp), plus the 0001 token block —
same v2 values as Benchmarker @ 1.2.0, Dock @ 1.1.0, GradeBridge @ 1.1.0, and Copy/Paster
@ 1.2.0.
Proposal: 0001, 0002
Overrides: none. The accent-ink mislabel present in every other script wasn't found here —
ETA only uses `--ah-accent` as a decorative header stripe (no text sits directly on an accent
fill), so there was nothing to fix. §C likewise doesn't apply: this script has no
`.active`/toggle-state button class at all.
Notable structural difference: the token block is declared on the panel's inline
`style.cssText` in `ensurePanel()` rather than inside the `addStyles()` `<style>` block, because
this script builds the panel element itself (`panel.id = PANEL_ID`) before `addStyles()` runs.
Custom properties declared there still resolve for every descendant rule, including the
Prince-of-Persia progress-bar widget, which is queried via `panel.querySelector` and is a true
descendant. Left the widget's green progress-fill gradient (`#a8d07d`/`#d7f08e`) and marker
(`#f3d36c`) untouched — those are ETA-specific, not part of the shared palette.

## 2026-07-27 — canvas-speedgrader-copy-paster.user.js @ 1.2.0
Adopted proposal 0002 in full (§A yellow accent, §B cool grey ramp, §C active/focus fixes),
plus the 0001 token block — same v2 values as Benchmarker @ 1.2.0, Dock @ 1.1.0, and
GradeBridge @ 1.1.0.
Proposal: 0001, 0002
Overrides: none. Fixed the same `var(--ah-shell)`-for-text-on-accent mislabel found in the
other three scripts — seven spots this time (`.cp-band-button.active`, `.cp-icon-btn-primary`
+ hover, `.cp-action-primary` + hover, `.cp-btn-primary` + hover), all switched to
`var(--ah-accent-ink)`. §C: `button.active`'s outline moved from the unlabeled
`rgba(255,255,255,0.22)` to `var(--ah-accent)`, and added a `button:focus-visible` ring
(there was none). `.cp-band-button.active` was left alone — it already indicates its active
state with a solid accent fill/border rather than an outline, so there's no collision to fix.
Not touched: the danger-state colors (`#ffccd4`/`#4c1720`/`#8b1e2d`/`#fff2f4`/`#a32437`), the
success message color (`#95d59b`), the grade-band border greys (`rgba(143,145,148,*)`), and
`#E4E4E7` — none of these are in the shared `--ah-*` palette, same reasoning as the other
scripts' local one-offs.

## 2026-07-27 — canvas-speedgrader-gradebridge.user.js @ 1.1.0
Adopted proposal 0002 in full (§A yellow accent, §B cool grey ramp), plus the 0001 token
block — same v2 values as Benchmarker @ 1.2.0 and Dock @ 1.1.0, including the revised
`--ah-shell` (#1d272d).
Proposal: 0001, 0002
Overrides: none. Fixed the same `var(--ah-shell)`-for-text-on-accent mislabel found in
the other two scripts (`.vc-gradebridge-button` and `.vc-gradebridge-assignment-card-target`
now use `var(--ah-accent-ink)`). §C not applicable — this script has no active/hover
button-state collision to fix.
Not touched: `#vc-gradebridge-quiet-overlay` and its spinner. That element is appended to
`document.body` as a sibling of the panel, not a descendant, so it cannot see custom
properties scoped to `#vc-gradebridge-panel`. Its colors (including the accent-colored
spinner) are deliberately left as literal hex; tokenizing it would require either a second,
document-body-scoped block or accepting a `:root` leak, both of which are outside what this
pass was asked to do.

## 2026-07-27 — canvas-assessment-helper-dock.user.js @ 1.1.0
Adopted proposal 0002 in full (§A yellow accent, §B cool grey ramp, §C active/focus fixes),
plus the 0001 token block — same v2 values as Benchmarker @ 1.2.0, including the revised
`--ah-shell` (#1d272d).
Proposal: 0001, 0002
Overrides: none. Fixed two bugs the refactor surfaced: `.vc-dock-helper:hover` and
`.vc-dock-helper.is-active` resolved to the same fill (the exact collision 0002 §C
describes) — active is now a transparent fill with an inset `--ah-accent` ring, matching
the proposal's suggested pattern. Also fixed `.vc-dock-action` text-on-accent using
`var(--ah-shell)` instead of `var(--ah-accent-ink)` — harmless while both were `#18181B`,
but would have broken once §B decoupled them.

## 2026-07-27 — canvas-speedgrader-benchmarker.user.js @ 1.2.0
Adopted proposal 0002 in full (§A yellow accent, §B cool grey ramp, §C active/focus fixes),
plus the 0001 token block, ahead of the rest of the suite.
Proposal: 0001, 0002
Overrides: none — dock.tokens.css/tokens.json were left at v1 (still the dock's shipped
baseline) since only this script has adopted the new palette so far. Benchmarker's own
token block is marked "v2" and documented as an intentional, isolated divergence until the
dock and the other six scripts catch up.
