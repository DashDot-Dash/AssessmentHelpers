# Dock — component spec

**Status:** as shipped
**Recorded from:** `canvas-assessment-helper-dock.user.js` @ `1.0.0`, branch `main`, 2026-07-27
**Live reference:** `../reference/dock.html`

The floating launcher for the helper panels. Fixed position, draggable, persists
its position and minimised state. Renders on SpeedGrader and rubrics pages.

If this document and the script disagree, **the script is right**. Fix this file.

---

## Anatomy

```
┌─────────────────────────────┐
│▌ Assessment Helpers    [—]  │  header — stripe, title, minimise
├─────────────────────────────┤
│  ▣ Copy/Paster              │  helper button
│  ▣ Benchmarker              │
│  ┌───────────────────────┐  │
│  │ ▣ GradeBridge         │  │  helper card (has actions)
│  │ [ ⇄ Switch          ] │  │  quick action
│  └───────────────────────┘  │
├─────────────────────────────┤
│  Other helpers  2        ▸  │  disclosure
└─────────────────────────────┘
```

Minimised, the whole dock collapses to a single tab: stripe, chevron, `AH`.

## Container

| Property | Value |
| --- | --- |
| Position | `fixed`, default `right: 18px` / `top: 132px` |
| Width | `152px` (auto when minimised) |
| Background | `--ah-shell` |
| Border | `1px solid --ah-border` |
| Radius | `--ah-radius-lg` (minimised: `10px 0 0 10px`) |
| Shadow | `--ah-shadow` |
| Font | `--ah-font` |
| z-index | `2147483000` |
| Overflow | `hidden` — the stripe is clipped by the radius |

`user-select: none` throughout; the whole dock is a drag handle surface.

## The stripe

A `::before` pseudo-element on the header and on the minimised tab. Full height,
`--ah-stripe-width` (12px), `--ah-accent`, flush to the left edge.

On the header it carries `border-radius: 0 2px 2px 0`; on the tab it does not.
The header's left padding (`23px`) is the stripe plus 11px of clearance — it is
not a spacing value, it's stripe avoidance.

This is the single most recognisable element of the suite. Every helper panel
repeats it. Do not shrink it, round it further, or replace it with a border.

## Elements

### Header
`display: flex`, `align-items: center`, `justify-content: space-between`,
`gap: 6px`, padding `9px 8px 9px 23px`. Background `--ah-header`, bottom border
`1px solid --ah-border-soft`. `cursor: grab`, `touch-action: none`.

Title: `11px / 750`, `white-space: nowrap`.

### Minimise button
`26 × 24`, `display: grid; place-items: center`, no border, radius
`--ah-radius-xs`. Fill `--ah-toggle` → hover `--ah-toggle-hover`. Icon `16px`,
stroke `currentColor` at `2`, round caps and joins, `fill: none`.

### Helper list
`display: grid; gap: 9px; padding: 8px`.

### Helper button
`display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: 6px`,
padding `7px 8px`, radius `--ah-radius-sm`, no border. Fill `--ah-header`,
text `--ah-text`, weight `700`, label `11px / 1.15` with ellipsis truncation.

| State | Treatment |
| --- | --- |
| Hover | Fill `--ah-control-hover` |
| Active (panel open) | Fill `--ah-control-active` — `.is-active` |
| Disabled (not available) | `opacity: --ah-disabled-opacity`, `cursor: default` |

Hover and active are the same value in the shipped dock, so an open helper is
indistinguishable from a hovered one. Known gap — see `proposals/0002`.

### Helper card
Wraps every helper button. Radius `--ah-radius-md`, padding `4px`, gap `7px`,
`border: 1px solid transparent` — invisible by default, so the card only shows
when it has actions.

With actions (`.has-actions`): border `--ah-border-card`, fill `--ah-surface`,
gap `8px`. The card is what groups a helper with its quick actions.

### Quick action
`display: flex`, centred, `gap: 4px`, padding `6px 5px`, radius
`--ah-radius-xs`, no border. Fill `--ah-accent`, text `--ah-accent-ink`,
`10.5px / 750`, `line-height: 1`. Hover fill `--ah-accent-hover`.
Icon `13px`, `flex: 0 0 auto`.

Laid out in `grid-template-columns: repeat(auto-fit, minmax(0, 1fr))` so one
action fills the row and two split it.

**This is the only accent fill in the dock.** Quick actions are the one thing
that acts without opening a panel, and the gold marks that. Adding a second
accent fill elsewhere devalues it.

### Empty state
"Choose a helper." Padding `9px 10px`, radius `--ah-radius-sm`, fill
`--ah-surface`, text `--ah-muted` at `12px / 1.3`.

### Other helpers
A `<details>`. Summary is flex, spread, padding `8px 10px`, `--ah-muted`,
`11px / 750`. Native marker removed; `::after` renders `▸` closed, `▾` open.
The count sits in a `<span>` after the label. List below: `grid; gap: 7px;
padding: 0 10px 10px`. A `1px solid --ah-border` top divider separates it from
the main list. Open/closed state persists.

### Minimised tab
Flex, `gap: 6px`, padding `10px 12px 10px 18px`, fill `--ah-header`, text
`13px / 800`, stripe via `::before`. Icon `15px`.

## Icons

Tabler, 24×24 viewBox, `fill: none`, `stroke: currentColor`, `stroke-width: 2`,
round caps and joins. Inlined as strings in the script — a userscript cannot
rely on an external sprite.

Sizes: `16px` in helper rows and the header toggle, `15px` in the tab, `13px` in
quick actions.

## Behaviour that affects appearance

- **Drag** — `.is-dragging` sets `opacity: 0.9` and kills transitions. Drag from
  the header or the tab, not the minimise button. Position clamps to an 8px
  viewport margin.
- **Sorting** — helpers that are open, configured, or have an enabled action
  render in the main list; everything else falls into Other helpers. So the
  dock's height changes as the marker works. Do not design for a fixed height.
- **Panel nudge** — opening a helper whose panel would overlap the dock moves
  the panel, not the dock. The dock never yields position.

## Integration contract

**Contract version:** dock integration v1, as shipped with the dock at `1.0.0`.

This is the canonical boundary between the dock, helper scripts, visual work,
and integration logic. Handoffs reference this section and list deviations;
they do not replace it with a shorter copied list.

Changing this contract requires human agreement, an integration and
compatibility plan, automated coverage where practical, and human Canvas
verification. A stored-data change also requires an explicit migration plan.

### DOM and visual state

- `#assessment-helper-dock` is the root and the scope for dock tokens.
- `.is-minimized` and `.is-dragging` are root state classes.
- `.vc-dock-helper.is-active` represents a helper whose panel is open.
- `data-vc-helper-id` identifies helper controls.
- `data-vc-action-id` identifies quick-action controls. The dock uses both
  attributes to bind controls to registered helpers and actions.

Other `.vc-dock-*` classes are presentation hooks documented by this component
spec. A visual implementation may change them only when the spec, reference,
and handoff are updated together.

### Known helpers and panel fallbacks

The dock renders its known helper list rather than discovering arbitrary
registrations. A registered helper's `id` or alias must match this table.
Panel ids are compatibility fallbacks for older or partially integrated helper
versions.

| Helper id | Registry aliases | Page | Accepted panel ids |
| --- | --- | --- | --- |
| `copy-paster` | none | SpeedGrader | `vc-copy-paster-panel`, `sg-copypaster-panel` |
| `benchmarker` | none | SpeedGrader | `vc-benchmarker-panel`, `sg-benchmarker-panel` |
| `eta` | `wwie` | SpeedGrader | `eta-panel`, `vc-wwie-panel`, `wwie-prince-panel` |
| `tutorial-sorter` | none | SpeedGrader | `vc-tutorial-sorter-panel`, `chatster-lmg-panel` |
| `gradebridge` | none | SpeedGrader | `vc-gradebridge-panel` |
| `rubric-builder` | `rubric-library`, `rubric-smoother` | Rubrics | `rubric-builder-panel`, `rubric-library-panel`, `vc-rubric-smoother-panel`, `jj-rubric-overlay` |

### Registry

`window.AssessmentHelpers` is canonical. `window.VisCommHelpers` aliases the
same object for compatibility.

```text
AssessmentHelpers = {
  helpers: Record<string, Helper>,
  register(helper: Helper): void
}

Helper = {
  id: string,                         // required; canonical known-helper id
  aliases?: string[],
  name?: string,
  panelId?: string,
  panelIds?: string[],
  show?: () => void,
  hide?: () => void,
  toggle?: () => void,                // compatibility method; not required by dock
  isOpen?: () => boolean,
  dockStatus?: () => { configured?: boolean, ... },
  dockActions?: () => DockAction[]
}

DockAction = {
  id: string,
  label: string,
  icon?: string,
  disabled?: boolean,
  run?: () => void | Promise<void>
}
```

`register()` stores the helper under its canonical id and every alias. Helpers
must remain usable without the dock; registration is opportunistic integration,
not a runtime dependency.

### Events

Canonical events use the `assessment-helper-*` names. Equivalent
`viscomm-helper-*` events remain compatibility aliases.

| Event | Target | Detail | Meaning |
| --- | --- | --- | --- |
| `assessment-helper-registered` | `window` | the registered `Helper` | Registry contents changed; rerender the dock. |
| `assessment-helper-status-changed` | `window` | `{ helperId }` | Configuration or action availability changed; schedule a rerender. |
| `assessment-helper-action` | `document` and `window` | `{ helperId, actionId, requestId }` | Compatibility bridge for an action not invoked through a registered `run()` method. |

Action-bridge consumers must tolerate receiving the same `requestId` on both
targets and avoid performing it twice. New integrations should prefer a
registered `dockActions()[].run()` callback.

### Persisted dock UI

The canonical key is `assessmentHelpers:dockUi:v1`.

```text
{
  minimized?: boolean,
  unavailableOpen?: boolean,
  position?: {
    left: number,
    top: number
  },
  hidden?: Record<string, boolean>
}
```

All fields are optional. Updates preserve unknown top-level fields so compatible
additions can roll out safely. The dock reads `vcHelperDock:ui:v1` only when the
canonical key is absent, then writes future updates to the canonical key.
Neither key nor field semantics may change without a versioned migration.

## Accessibility notes

- Focus is browser default — there is no focus ring in the shipped CSS. On a
  dark fill the default ring is weak. Gap, not a decision.
- Every control has a `title`; icon-only controls also carry `aria-label`.
- Disabled helpers use `disabled`, so they're correctly skipped by tab order.
- Contrast on shipped values: `--ah-text` on `--ah-shell` ≈ 15.8:1;
  `--ah-muted` on `--ah-shell` ≈ 7.4:1; `--ah-accent-ink` on `--ah-accent`
  ≈ 8.9:1. All pass AA comfortably.
