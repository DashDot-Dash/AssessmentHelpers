# /design

Design reference for Assessment Helpers.

This folder is **documentation, not a dependency**. No userscript loads anything
from here. Every script in this repo must keep working if this folder is deleted.

## Why it exists

The userscripts are installed one at a time by colleagues who may never use the
whole suite. That forces every script to be standalone: no shared CSS file, no
shared JS module, no build step. The cost of that is drift — the eight Canvas
userscripts can each carry their own copy of the same colours and quietly
diverge.

This folder is the answer to "what is the correct value, and what shipped?"

## What's in here

| Path | What it is |
| --- | --- |
| `tokens/tokens.json` | The canonical value list, machine-readable. Start here. |
| `tokens/dock.tokens.css` | The same values as a paste-ready CSS block. |
| `tokens/README.md` | How the token block gets into a standalone script. |
| `specs/dock.md` | The dock, documented as shipped — anatomy, states, values. |
| `reference/dock.html` | The dock rendered in a browser. Open it, compare. |
| `proposals/` | Design changes that have **not** shipped. Numbered. |
| `HANDOFF.md` | Template for passing work between agents. |
| `CHANGELOG.md` | What changed visually, and in which script version. |

## The rule that matters

**The shipped userscript is the source of truth.** If `specs/dock.md` and
`canvas-assessment-helper-dock.user.js` disagree, the script is right and the
spec is stale — fix the spec.

Anything not yet in a shipped script is a **proposal** and lives in
`proposals/`. Proposals never describe themselves as current.

This is deliberate. It means this folder can never break a script, and it means
nobody has to trust it to ship. Specs and the candidate changelog are updated in
the implementation PR and become the shipped record when that PR merges.

## Who touches what

- **Claude (design system)** — read-only on this repo. Writes proposals and
  specs, ships them as a folder to be copied in. Cannot commit, cannot test.
- **Claude Code** — local file access. Applies design to scripts, updates specs
  in the implementation PR, keeps token blocks in sync.
- **Codex** — logic, integration, tests, and release preparation. Reviews and
  can override a design decision for a functional reason, documented in
  `CHANGELOG.md`.
- **Human owner** — the only role that can validate authenticated Canvas and
  approve the final merge/release.

Full Claude Code rules: [`../CLAUDE.md`](../CLAUDE.md). Shared workflow:
[`../AI-COLLABORATION.md`](../AI-COLLABORATION.md).

## Current status

| Script | Documented | Token block adopted |
| --- | --- | --- |
| `canvas-assessment-helper-dock.user.js` | Yes — `specs/dock.md` | Not yet — see `proposals/0001` |
| The other seven | No | No |

The dock is the pilot. Prove the pattern there before touching anything else.
