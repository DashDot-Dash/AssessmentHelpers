# 0002 — Yellow palette, cool greys, and two state fixes

**Status:** proposed — **not shipped, do not treat as current**
**Visual change:** substantial, suite-wide
**Depends on:** `0001` — do not attempt before the token block lands
**Affects:** all eight userscripts, eventually. Dock first.

## What this is

The design system has moved on from what ships. This proposal records that
divergence honestly rather than pretending it's already true.

Three changes, separable. They can land independently and probably should.

---

## A. Gold → yellow

| Token | Shipped | Proposed |
| --- | --- | --- |
| `--ah-accent` | `#D6A21D` | `#F5C518` |
| `--ah-accent-hover` | `#E0B13A` | `#FFD53E` |
| `--ah-accent-ink` | `#18181B` | `#0F1416` |

**Why:** `#D6A21D` is a muted ochre. Over Canvas's own light chrome it reads as
brown-grey, not as a deliberate brand mark. `#F5C518` holds its identity against
a white page, which is the only place these helpers are ever seen.

**Risk:** low. Contrast on the quick-action fill goes from ≈8.9:1 to ≈12.4:1
with `--ah-accent-ink`. Both pass; the yellow is better.

**Note:** this is the most visible change in the whole proposal and the cheapest
to revert. Good candidate to ship alone, first.

---

## B. Neutral zinc → cool grey ramp

| Token | Shipped | Proposed |
| --- | --- | --- |
| `--ah-shell` | `#18181B` | `#1d272d` |
| `--ah-header` | `#27272A` | `#37424A` |
| `--ah-control-hover` | `#3F3F46` | `#49555E` |
| `--ah-text` | `#FAFAFA` | `#E7ECEF` |
| `--ah-muted` | `#A1A1AA` | `#949DA5` |

**Update (2026-07-27):** `--ah-shell` revised from `#303A41` to `#1d272d` after a contrast
review on the shipped Benchmarker adoption — see contrast note below.

**Why:** the shipped zinc is a true neutral and sits very dark. Against Canvas's
white content area a near-black panel reads as a hole punched in the page. The
cool ramp is lighter and slightly blue, so the panels read as a surface *above*
Canvas rather than a void behind it. It also sits more comfortably beside
Canvas's own blue-grey chrome.

**Risk:** moderate, and worth being honest about. This is a wholesale change to
how the suite looks. Contrast stays comfortable — `#E7ECEF` on `#1d272d` ≈ 12.8:1
— but every screenshot, every doc image, and colleagues' muscle memory all
change at once.

**Contrast note (2026-07-27):** `--ah-muted` (`#949DA5`) on `--ah-header`
(`#37424A`) is ≈3.74:1 — below the 4.5:1 AA floor for normal text. This is a
pre-existing gap in this proposal, not something the shell revision introduced;
it shows up anywhere muted text sits directly on the header surface (e.g.
`.sg-section-title`, `.sg-details summary`). Worth a decision before this
lands on more scripts: darken `--ah-header` slightly, or use `--ah-text` instead
of `--ah-muted` on that surface, or give header-hosted secondary text its own
lighter tone.

**Recommendation:** ship A alone first. Live with it. Then decide whether B is
actually wanted, because it is much harder to walk back.

---

## C. Two state fixes

Independent of the palette. Both are gaps, not preferences — worth fixing
whatever happens to A and B.

### Hover and active are the same colour

`--ah-control-hover` and `--ah-control-active` both resolve to `#3F3F46`, so an
open helper is indistinguishable from a hovered one. With five helpers open at
once — normal during marking — the dock gives no read of what's actually on
screen.

**Proposed:** active becomes a 2px `--ah-accent` outline on a transparent fill,
leaving hover as the only fill change. Open state then survives the palette
question entirely, because it stops depending on a grey.

```css
.vc-dock-helper.is-active {
  background: transparent;
  box-shadow: inset 0 0 0 2px var(--ah-accent);
}
```

`box-shadow` rather than `border` so the button's size doesn't shift.

### No focus ring

No control in the dock has a focus style, so keyboard users get the browser
default over a dark fill — weak, and invisible on the accent buttons.

**Proposed:**

```css
.vc-dock-helper:focus-visible,
.vc-dock-action:focus-visible,
.vc-dock-toggle:focus-visible {
  outline: 2px solid var(--ah-accent);
  outline-offset: 2px;
}
```

`:focus-visible`, so mouse users see nothing change.

**Note:** with the active-state outline above, an open *and* focused helper
shows both an inset and an offset ring. Check that it reads as intentional
rather than as a doubled border; if not, offset the focus ring further.

---

## Sequencing

1. `0001` — token block, no visual change.
2. **C** — state fixes. Small, defensible, no palette dependency.
3. **A** — yellow. One value, high impact, trivially revertible.
4. **B** — grey ramp. Only if A has settled and the lighter surface is genuinely
   wanted.

Each step is its own commit against its own script version.

## What Claude cannot verify

None of this has been seen over real Canvas. The contrast figures are computed
against the panel's own surfaces, not against whatever page shows through around
it. Anyone applying this should look at it in SpeedGrader before merging.
