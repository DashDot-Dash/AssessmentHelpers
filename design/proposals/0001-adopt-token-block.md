# 0001 — Adopt the token block in the dock

**Status:** proposed
**Visual change:** none — this is a pure refactor
**Affects:** `canvas-assessment-helper-dock.user.js`
**Blocks:** `0002`

## Problem

Every colour in the dock is a hardcoded hex inside a template string. The same
is true of the other seven scripts. There is no way to change a colour once, and
no way to detect that two scripts have drifted apart — which they have.

`theme-preview.html` already exports an `--ah-*` token block, but nothing
consumes it. It's a colour picker whose output has to be pasted in by hand.

## Change

Insert the token block from `design/tokens/dock.tokens.css` at the top of the
dock's injected `<style>`, scoped to `#${DOCK_ID}`, fenced by the `AH-TOKENS`
markers. Then replace every hex below the fence with its `var(--ah-*)`.

Every value is exactly what renders today. `design/reference/dock.html` is the
refactor already done — the CSS in that file can be lifted almost verbatim.

## Why scoped to the dock's id, not `:root`

Two reasons, both practical rather than stylistic:

1. `:root` leaks the tokens onto the whole Canvas page. Canvas is not ours to
   style, and a `--ah-*` name collision with Instructure's own CSS is a bug we
   would never find.
2. Each script is installed independently, so two scripts on different token
   versions will coexist during any rollout. Scoped to their own ids they
   simply disagree in isolation. On `:root` the last one to inject wins and
   silently restyles the other.

## Verification

The rendered dock must be pixel-identical before and after. Screenshot the dock
in SpeedGrader, apply, screenshot again, compare. Any visible difference means a
hex was mistranscribed.

`npm test` must pass unchanged — this touches no behaviour.

## Follow-on

Once this lands for the dock and holds for a week of real marking, repeat for
the other seven, one commit each. Then `check:userscripts` can start enforcing
that the blocks match (see `design/tokens/README.md`).

Do not batch all eight into one commit. If something is wrong with the pattern,
it should be wrong in one place.
