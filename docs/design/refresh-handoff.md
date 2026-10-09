# Handoff: Assessment Helpers — visual refresh + shared theme

## Overview
This handoff covers a full visual refresh of the **Assessment Helpers** Tampermonkey userscripts. Repo: `DashDot-Dash/AssessmentHelpers`.

The scripts are Dock, Tutorial Sorter, Benchmarker, ETA, Copy/Paster, GradeBridge and Rubric Builder, all running inside Canvas SpeedGrader / Rubrics. The refresh changes four things:

1. **A new default "Soft" light theme.** It uses cool soft greys, white cards and fewer borders, so the panels read lighter and less blocky.
2. **A "Dark" theme** made of neutral graphite greys. It replaces the old zinc greys, which sat too close to Canvas's own chrome.
3. **One button family.** Every button is a pill with one of four fills: primary / secondary / ghost / danger. This replaces the seven ad-hoc variants.
4. **Suite-wide settings** in the Dock: **Theme** (Soft/Dark) and **Density** (Compact/Roomy). All helpers share them.

It also introduces **one shared stylesheet**, `shared/ah-theme.js`, loaded with `@require`. It replaces the CSS that is currently copy-pasted into every script.

## About the design files
Everything under `design_reference/` is a **design reference built in HTML/React**: prototypes that show the intended look and behaviour. **It is not code to ship.** The task is to apply this design to the existing vanilla-JS userscripts, keeping their current DOM-building approach (template strings plus `innerHTML`), their storage keys and their behaviour.

`shared/ah-theme.js` is the exception: it is written to be committed as-is and used in production. Review it, but it is meant to drop in.

## Fidelity
**High-fidelity.** Colours, type, radii, spacing and states are final. Match them exactly. Exact values are in **Design tokens** below and in `shared/ah-theme.js`.

## Implementation plan (do in this order; test each helper alone)
1. **Add `shared/ah-theme.js`** to the repo (copy from this bundle).
   - Add to every script header: `// @require https://raw.githubusercontent.com/DashDot-Dash/AssessmentHelpers/main/shared/ah-theme.js?v=1.0.0`
   - Bump each script's `@version` whenever the shared file changes. Tampermonkey only refetches `@require` when the script's version changes.
   - Optional: add a CI step in `.github/workflows` that fails if `shared/ah-theme.js` changed but `?v=` / `@version` didn't.
2. **Dock (`canvas-assessment-helper-dock.user.js`):** restyle it (see Screens below) and add the **Settings** disclosure. It calls `AssessmentHelpers.theme.set({ theme | density })`.
3. **Per helper:** add the `@require`, delete its duplicated shell/header/button/stat CSS, switch markup to the `.ah-*` classes, and replace every raw hex with `var(--ah-*)`. Keep panel-specific CSS scoped under the panel ID. Suggested order: Benchmarker → GradeBridge → ETA → Tutorial Sorter → Copy/Paster → Rubric Builder.
4. **Fallback:** if `#ah-theme` is missing at init (failed `@require`), log a warning. Optionally inject a minimal token block so the panel stays legible.
5. **Update `theme-preview.html`** to edit the same `--ah-*` token names, so its "Copy CSS" output maps to `ah-theme.js`.
6. **Leave alone:** Rubric Slider stays as-is (it's a plain slider). It can still pick up the tokens through `@require`.

See `SHARING-CSS.md` for the rationale (`@require` vs `@resource`/`GM_addStyle` vs Dock-injected CSS).

## Shared theme API (`window.AssessmentHelpers.theme`)
- `get()` returns `{ theme: 'soft'|'dark', density: 'compact'|'roomy' }`. The defaults are `soft` and `roomy`.
- `set(patch)` persists to `localStorage['ah:settings']` and applies `data-ah-theme` and `data-ah-density` on `<html>`.
- `onChange(fn)` fires when settings change, in this tab or another tab (via the `storage` event). It returns an unsubscribe function.
- `isCompact()` is a shortcut for `get().density === 'compact'`.
- Styling responds automatically through CSS. Scripts only need `onChange` and a re-render where the **layout** differs by density (listed per screen below).
- The installer is idempotent: N scripts mean one `<style id="ah-theme">` and one Figtree `<link>`.

## Primitives (classes in `ah-theme.js`)
Preview them: `shared/primitives-preview.html` (open it in a browser; the theme and density switches work).

| Purpose | Classes |
|---|---|
| Panel shell | `.ah-panel` (`.is-min`, `.is-dragging`, `.ah-panel--wide`), `.ah-panel__header`, `.ah-panel__title` (draws the stripe via `::before`), `.ah-panel__body` |
| Buttons | `.ah-btn` + `--primary` / `--ghost` / `--danger` (default = secondary), `--sm`, `--block`, `.is-active` / `aria-pressed="true"` |
| Icon buttons | `.ah-icon-btn` + `--primary` / `--ghost` / `--danger`, `--sm` |
| Grade buttons | `.ah-grade-btn` with `style="--band:var(--band-hd)"`, `.is-active` |
| Chips | `.ah-chip` (`.is-active` = yellow), `.ah-count-chip` (+ `<b>` count, `.is-active`), `.ah-dot` (`--band`) |
| Surfaces | `.ah-section` (`--inset`), `.ah-label`, `.ah-muted`, `.ah-empty`, `.ah-dropzone` (`.is-over`) |
| Stats | `.ah-stat` (`--primary`, `--secondary`, `--inline`, `--auto` = goes single-line in compact), `.ah-stat__label`, `.ah-stat__value` |
| Rows | `.ah-row` (`.is-current`), `.ah-row__meta` |
| Fields | `.ah-field` on input/select/textarea, `.ah-field-label` |
| Disclosure | `<details class="ah-details">` (`--divider` variant) with a `<summary>` |
| Settings | `.ah-seg` with `<button aria-checked>` children |
| Toast | `.ah-toast`, `.ah-spinner` |

## Visual rules (apply everywhere)
- **Panel:**
  - Background `--ah-bg`, 1px `--ah-line` border, 18px radius, `--ah-shadow`.
  - Font `400 13px/1.45 Figtree`.
  - No header bar or rule: the header is part of the body.
  - Header padding `10px 8px 8px 12px`; body padding `4px 12px 12px`; 10px grid gap.
- **The stripe:** an 8×22px, fully rounded `#D6A21D` pill, 9px left of the title. The title is 15px/700, −0.01em. The minimise button is a ghost icon button, 28px circle, `M6 12h12` icon.
- **Buttons:**
  - Always pills, 34px tall (md) or 28px (sm). Figtree 600, 13px (md) or 12px (sm). No border.
  - **Primary** (yellow) is used once per area for the main action: Prev/Next, Keep typing, Switch, Log now, Insert, Download CSV.
  - **Secondary** (grey fill) is everything else.
  - **Ghost** is for low-emphasis actions: Remove this connection, row actions.
  - **Danger** (soft red) is for Reset / Delete.
- **Selected state:**
  - Soft theme: grey fill (`--ah-fill-hover`) plus a 1.5px yellow inset ring. There is **no yellow wash**.
  - Grade buttons instead get a 2px inset ring in their band colour on a white fill.
- **Labels** are sentence case, 12px/600, muted. **No uppercase and no letter-spacing** (the old 0.04em uppercase labels are gone).
- **Grade bands** appear only as dots: 11px on grade buttons, 10px elsewhere.
- **Hover:** fills step one grey darker; yellow → `#E0B13A`; transparent → 4% ink tint. No transforms. Disabled = opacity .45.
- **Copy changes:**
  - Sentence-case headings: "Current student", "Selected tutorial", "Student list", "Manage connections", "Import / export".
  - "Not Connected yet." → "Not connected yet."

## Screens

### Dock
- **Size:** 168px wide, 18px radius, same shell as panels.
- **Header:** yellow "AH" pill (24px tall, 0 9px padding, 10px/800, +0.02em) · "Helpers" (12px/600 muted) · ghost minimise. Padding `8px 6px 6px 8px`.
- **Helper rows:**
  - Full-width transparent buttons: 18px icon column, 8px gap, padding `8px 10px`, 12px radius, label 12px/600. Hover gives a 4% tint.
  - **Open/active** = a 6px yellow dot at the right, and the icon goes from muted to full text colour.
  - **Rows with quick actions** sit on a white card (12px radius, 1px whisper shadow). The actions are **primary sm pills** in an auto-fit grid with a 4px gap.
- **"Other helpers · N"** and **"Settings"**: disclosures below 1px top rules. Header row padding `9px 12px`, 12px/600 muted, chevron rotates 90° when open.
- **Settings** contains two labelled `.ah-seg` controls: **Theme** (Soft | Dark) and **Density** (Compact | Roomy). Labels are 11px/500 muted; 10px gap; padding `0 10px 12px`.
- **Minimised tab:** a pill tab flush to the right edge (radius `999px 0 0 999px`), padding `6px 14px 6px 6px`. It shows the yellow "AH" pill (26px tall) and a muted ‹ chevron.
- Reference: `Dock` in `COMPONENTS-SOURCE.jsx.txt`, `DockHelper`, `design_reference/ui_kits/speedgrader/index.html`.

### Tutorial Sorter
- **Width:** 340 roomy, 248 compact.
- **Order:**
  - Drop zone (shown only when no classes are imported): "Drop class file here" / "Use Allocate+ roster export file" + upload icon button.
  - **Active class** select.
  - Stats: **Students in class** / **Position** (`n/N`). In compact these are labelled "In class" / "Position" and are single-line (`.ah-stat--auto`).
  - **Current student** section: name 14px/700, then "Tue 10:00 | ATC205" muted. Fallbacks: "Not in active class" / "No active class selected".
  - Prev/Next as primary pills in a 2-column grid. Disabled when the student isn't in the class.
  - **Student list** disclosure: rows show name + index; current row = selected state.
  - **Import / export** divider disclosure:
    - Drop zone "Drop another class file here".
    - The import summary line in `--success-700`.
    - "Create a file to import groups into Canvas" / "Choose a name for your Canvas groups" + the group-name select + a download icon button.
    - Reset (danger sm), right-aligned.
- Reference: `design_reference/ui_kits/speedgrader/tutorial-sorter-panel.jsx`.

### Benchmarker
- **Width:** 340 / 248.
- **Current student** section: name + bucket pill (dot + label on a grey pill), then a meta line.
- **Grade buttons:**
  - **Roomy:** row of 4 (HD, D, C, P) + row of 2 (Fail, No Submission), 8px gaps.
  - **Compact:** one 3×2 grid with short labels HD, D, C, P, F, NS, 6px gap. *(Layout differs by density — re-render on `onChange`.)*
- **Selected tutorial:** Prev/Next primary pills.
- **Buckets** disclosure: `.ah-count-chip`s in 2 columns; "All" spans both columns. Compact uses short labels.
- **Student list** disclosure: `.ah-row` with a band dot + bucket meta.
- Reference: `design_reference/ui_kits/speedgrader/benchmarker-panel.jsx`.

### ETA
- **Width:** 340 / 248.
- **Meta line:** "Tue 10:00 · ATC205 | Design Journal".
- **Stats:**
  - **Roomy:** 3 columns: **ETA** (primary; finish time formatted like `9:28pm` — lowercase am/pm, no space), **Completed**, **Remaining**.
  - **Compact:** ETA spans the full width, then Done / Left; all single-line. **The ETA time must never truncate.** Stat values use `white-space:nowrap` with no ellipsis.
- **Prince runner:**
  - Bar: 8px tall, `--ah-fill` track, fill gradient `--success-fill-a → --success-fill-b` (`#26794C → #4E9A6C`). Inset 14px each side, 10px from the bottom of a 66px stage. The old `#18181B` track and lime gradient are replaced.
  - Sprite logic is unchanged.
- **Logging** disclosure:
  - Secondary stats Recent avg / Median / Time to complete: 3 columns in roomy; in compact one column of single-line rows labelled "To finish".
  - Then the muted info lines.
  - Then a row: **Log now** (primary sm) · download icon button (secondary sm) · spacer · **Reset** (danger sm).
- Reference: `design_reference/ui_kits/speedgrader/eta-panel.jsx`.

### Copy/Paster
- **Width:** stays wide (420; the original was 510, either is fine). Not affected by density.
- **Layout:**
  - Meta line, then Grade band / Category selects in a 2-column grid.
  - Snippet list: inset grey area, 14px radius, 8px padding. Headings are a 6×14 yellow pill + 12px/600 text.
  - **Snippet card:** white, 12px radius, 12px padding. Title 13px/600 + meta at the right. Body 12px soft text. Actions: insert (primary sm icon), then copy / edit / delete (ghost sm icons).
  - Band filter `.ah-chip`s (active = yellow).
  - **Add snippet** (secondary) + **Keep typing** (primary), 2 columns.
  - **Save / import** divider: Export / Import (secondary sm), Reset (danger sm).
- Reference: `design_reference/ui_kits/speedgrader/copypaster-panel.jsx`, `SnippetCard` in `COMPONENTS-SOURCE.jsx.txt`.

### GradeBridge
- **Width:** 340 / 248.
- **Connected:** "Connected assignments" label, then two cards in 2 columns, 8px gap.
  - **Here** card: white, 12px radius, padding `9px 12px`. Tag 11px/500 muted, name 13px/600.
  - **Target** card: a yellow button. "Switch to →" tag at 0.8 opacity, name in ink.
- **Not connected:** the dashed empty state "Not connected yet."
- **Manage connections** divider: "Remove this connection" (ghost sm, block) or the helper text + **Connect this assignment** (secondary, block).
- **Quiet toast** while switching: a white pill with a spinner (yellow top arc). The page veil is `rgba(247,248,250,.55)`.
- Reference: `design_reference/ui_kits/speedgrader/gradebridge-panel.jsx`, `QuietToast` in `COMPONENTS-SOURCE.jsx.txt`.

### Rubric Builder (modal)
- **Overlay:** `rgba(17,18,20,.38)`.
- **Modal:** `min(1100px, 95vw)`, 18px radius, panel shell, rows `auto 1fr auto`.
- **Header:** stripe + "Rubric Builder" 16px/700; rubric-name `.ah-field` (max 420px); ghost close icon button at top right.
- **Body:** 2 columns (`1.15fr / 1fr`, 12px gap).
  - **Left:** one white section per category, with a 12px/600 muted heading. Criterion rows contain:
    - A custom 18px checkbox, 6px radius. Checked = yellow fill + ink tick; unchecked = white with a 1.5px line ring.
    - The name 13px/600 and the summary 12px muted.
    - Checked rows get the selected state.
  - **Right:** an inset grey area, "Selected criteria" label, then cards (white, 14px padding):
    - Name 14px/700, category muted, ghost delete icon.
    - Framing text 12px.
    - "Weight" + a pill number input (72px wide, 30px tall).
    - Band chips, one per band (HD / D / C / P / F): a grey pill with a 9px dot and the label + points. Points = weight × 1, .85, .75, .65, .5, rounded to 0.1.
  - **Empty:** "No criteria selected yet."
- **Footer:** 1px top rule. Status text: "N criteria selected. Total weight: X" — it turns `--ah-danger` and 700 weight when the total is over 100. **Download Canvas CSV** (primary) on the right. The old "Remove" red buttons become ghost delete icons.
- Reference: `design_reference/ui_kits/rubric-builder/`.

## Design tokens (authoritative copy is in `shared/ah-theme.js`)

### Soft (default)

| Token | Value |
|---|---|
| `--ah-bg` | `#F4F6F8` |
| `--ah-surface` | `#FFFFFF` |
| `--ah-fill` | `#ECF0F3` |
| `--ah-fill-hover` | `#E2E7EC` |
| `--ah-line` | `#E1E6EB` |
| `--ah-line-strong` | `#D5DCE3` |
| `--ah-text` | `#1E2229` |
| `--ah-text-soft` | `#3A404A` |
| `--ah-muted` | `#66707C` |
| `--ah-tint` | `rgba(30,34,41,.04)` |
| `--ah-stripe-wash` | `= --ah-fill-hover` (no yellow wash) |
| `--ah-focus` | `rgba(214,162,29,.45)` |
| `--ah-shadow` | `0 1px 2px rgba(30,34,41,.06), 0 12px 32px rgba(30,34,41,.10)` |

### Dark (`data-ah-theme="dark"`)

| Token | Value |
|---|---|
| `--ah-bg` | `#111214` |
| `--ah-surface` | `#292B2E` |
| `--ah-fill` | `#36383C` |
| `--ah-fill-hover` | `#43464A` |
| `--ah-line` | `rgba(255,255,255,.08)` |
| `--ah-text` | `#F9FAFB` |
| `--ah-text-soft` | `#E4E6E9` |
| `--ah-muted` | `#A4A7AC` |
| `--ah-tint` | `rgba(255,255,255,.05)` |
| `--ah-stripe-wash` | `= --ah-fill-hover` |
| `--ah-danger` | `#F2C9CF` on `#4c1720` |
| `--ah-shadow` | `0 10px 30px rgba(0,0,0,.30)` |

### Accent, danger, success and grade bands
- **Accent:**
  - Stripe `#D6A21D`, hover `#E0B13A`.
  - Text on yellow: `#18181B`.
- **Danger family** (anchor `#8b1e2d`):
  - Soft fill `#F6E7E9`, fill hover `#EDD3D7`, text `#8b1e2d`.
  - Hover `#a32437`, deep `#4c1720`.
- **Success family** (same depth as danger):
  - Fill `#E6F0E9`, fill hover `#D3E5D9`.
  - Base `#1F6640`, hover `#26794C`, deep `#183D2A`, text on dark `#B5D6C1`.
  - Progress `#26794C → #4E9A6C`. The old lime / fluorescent greens are removed.
- **Grade bands** (unchanged; dots only):

  | Band | Colour |
  |---|---|
  | HD | `#2e7d32` |
  | D | `#1b5ee4` |
  | C | `#fdbf5b` |
  | P | `#ef6c00` |
  | F | `#c62828` |
  | NS | `#8a8a8a` |

### Type, radii, controls, panel widths and motion
- **Type:**
  - **Figtree** 400/500/600/700/800 (Google Fonts), falling back to the system UI stack.
  - Sizes: 10 tag · 11 meta · 12 labels · 13 body/buttons · 15 panel title · 16 modal title.
  - Stats use tabular numbers.
- **Radii:** 8 rows · 10 inputs · 12 cards · 18 panels · 999 every control.
- **Controls:** 28px (sm) / 34px (md).
- **Panel widths:**

  | Panel | Roomy | Compact |
  |---|---|---|
  | Dock | 168 | 168 |
  | Standard panel | 340 | 248 |
  | Copy/Paster | 420 | 420 |

- **Motion:** 120ms ease on background changes; disclosure chevron rotate 120ms; spinner 680ms linear. Nothing else.

## Assets
- Prince sprite sheets (`Assets/Prince*.png`) are already in the repo; their usage is unchanged.
- Icons are the Tabler outline paths already inlined in the scripts. Add a `check` path (`M5 12l5 5l9 -10`) for the Rubric Builder checkbox.
- Font: Figtree via Google Fonts. `ah-theme.js` injects the `<link>`.
- There is no logo. The brand mark is the yellow **"AH"** pill: ink text, 800 weight, +0.02em.

## Files in this bundle
- `shared/ah-theme.js` — **production file to commit**: tokens + primitives + settings API.
- `shared/primitives-preview.html` — a vanilla-HTML demo of every primitive, with working Theme/Density switches.
- `SHARING-CSS.md` — the rationale and caveats for the shared-CSS approach.
- `design_reference/ui_kits/speedgrader/index.html` — the interactive reference for Dock + all SpeedGrader helpers. Settings live in the Dock.
- `design_reference/ui_kits/rubric-builder/index.html` — the Rubric Builder modal reference.
- `design_reference/COMPONENTS-SOURCE.jsx.txt` + `PROP-TYPES.ts.txt` — all reference React components (exact inline values) and their props in two text files. Read them for measurements; don't port the React.
- `design_reference/tokens/*.css`, `styles.css`, `_ds_bundle.js`, `Assets/` — support files the references need to run. Open the HTML files from this folder over a local server.
