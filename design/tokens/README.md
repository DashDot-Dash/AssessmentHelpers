# Tokens in a standalone userscript

## The constraint

Each userscript is installed on its own and must work on its own. No shared
stylesheet, no `@require` of a common file, no build step. A colleague might
install only Copy/Paster and nothing else.

So tokens cannot be *shared*. They are **duplicated, and verified**.

## The pattern

Every script carries its own copy of the token block inside the `<style>` it
already injects. The copy is byte-identical across scripts, fenced by marker
comments, with one line different: the selector.

```js
style.textContent = `
  /* AH-TOKENS v1 — generated from design/tokens/tokens.json — do not edit by hand */
  #${DOCK_ID} {
    --ah-shell: #18181B;
    /* …the rest, exactly as in dock.tokens.css… */
  }
  /* /AH-TOKENS */

  #${DOCK_ID} {
    background: var(--ah-shell);
    color: var(--ah-text);
    /* …component CSS from here down… */
  }
`;
```

Duplication is the point. It costs ~25 lines per script and buys true
standalone installation.

## Scope on the script's own root, never `:root`

```css
/* Wrong — leaks into Canvas, and two helper scripts fight over the values */
:root { --ah-shell: #18181B; }

/* Right — scoped to this script's own container */
#assessment-helper-dock { --ah-shell: #18181B; }
```

Every helper renders inside one container with a known id, so scoping to that
id covers all its descendants and touches nothing else on the page. It also
means two scripts on different token versions can coexist during a rollout
instead of overwriting each other.

## Rules

1. **Use `var(--ah-*)` everywhere below the fence.** A raw hex in component CSS
   is a bug — it's the thing that caused the drift in the first place.
2. **Never edit the block by hand in a script.** Edit `tokens.json`, regenerate,
   paste. Hand-editing one script is how eight copies stop matching.
3. **Never add a token to one script only.** If a script needs a value nothing
   else needs, that's a local custom property declared below the fence with a
   different prefix (`--dock-*`), not an `--ah-*` token.
4. **Bump `v1` when a value changes.** The version is in the marker comment so a
   check can tell "stale copy" from "different version".

## Suggested check (Codex)

`check:userscripts` could verify the block mechanically:

- extract the text between `/* AH-TOKENS` and `/* /AH-TOKENS */` from each script;
- normalise the selector line;
- compare against `design/tokens/dock.tokens.css`;
- fail with the diff on mismatch.

That turns "keep eight copies in sync" from a discipline problem into a CI
failure. It's the single highest-value thing that could be built on this folder.

## Rollout

Adopting the block is a **refactor with no visual change** — every value below
is exactly what the dock renders today. Do it as its own commit, separate from
any design change, so the diff is reviewable as a no-op.

See `proposals/0002` for what to change *after* the refactor lands.
