# CLAUDE.md

Instructions for Claude Code working in this repository. Read this before
changing anything. `AI-COLLABORATION.md` is the human-readable summary of the
same rules — this file is the operative one.

---

## What this repository is

Ten standalone Tampermonkey userscripts: eight Canvas assessment helpers and two
lazy embedded-content viewers. They are used by colleagues, not developers.
**Set and forget** is the product requirement: a script that needs attention
after install has failed.

Every root-level `*.user.js` is a canonical, installable script whose
Tampermonkey update URLs point at `main`. **Merging to `main` is a release.**

## The constraint that shapes everything

**Each script must work entirely on its own.** A colleague may install only
Copy/Paster and never touch the rest of the suite.

That means:

- no shared CSS file, no shared JS module, no `@require` of a repo file;
- no build step, no bundler, no preprocessing;
- no script may assume the dock, or any other helper, is installed;
- cross-script integration is opportunistic only — via `window.AssessmentHelpers`
  registration and `CustomEvent`, always with a working fallback.

Anything that looks like good practice but breaks standalone installation is
wrong here. Duplication between scripts is the accepted cost.

## Roles

| | Claude (design system) | Claude Code | Codex | Human owner |
| --- | --- | --- | --- | --- |
| Repo access | **Read-only** | Local files, git | Local files, git | Full |
| Owns | Visual language, `/design` | Applying design to scripts | Logic, integration, tests, release preparation | Product decisions, Canvas acceptance, release approval |
| Can run tests | No | Yes | Yes | Optional |
| Can open authenticated Canvas | No | No | No | Yes |
| Can approve merge/release | No | No | No | Yes |

Claude cannot commit, branch, push, run `npm test`, or open Canvas. It produces
folders of files to be copied in. Treat its output as a **proposal that has
never been executed**, however confident it sounds.

Neither Claude Code nor Codex may claim live-Canvas verification. Record the
human owner's result in the handoff. Neither may merge to `main` without the
human owner's explicit approval for that release.

## `/design`

Documentation, not a dependency. No script loads from it. Every script must keep
working if it is deleted.

- `design/tokens/` — canonical values + the standalone token-block pattern
- `design/specs/` — components documented **as shipped**
- `design/reference/` — the component rendered in a browser, to diff against
- `design/proposals/` — numbered, **not shipped**
- `design/HANDOFF.md`, `design/CHANGELOG.md`

**The shipped script is the source of truth.** If a spec and a script disagree,
the script is right and the spec is stale. Fix the spec, in the same PR.

Never implement from a proposal without checking it's been agreed. A proposal
is a design opinion that has not been tested over real Canvas.

## Tokens

Tokens are duplicated into each script, not shared. See
`design/tokens/README.md` for the full pattern. The rules:

1. The block goes inside the script's own injected `<style>`, fenced by
   `/* AH-TOKENS v1 … */` and `/* /AH-TOKENS */`.
2. Scope it to the script's **own root element id**. Never `:root`.
3. Below the fence, use `var(--ah-*)`. A raw hex in component CSS is a bug.
4. Never hand-edit the block in a script. Edit `design/tokens/tokens.json`,
   regenerate, paste into every script in its own commit.
5. A value only one script needs is a local property (`--dock-*`) below the
   fence — not an `--ah-*` token.

## Flag, don't change

Stop and ask before touching any of these, even when a design change seems to
require it:

- URL detection and parsing;
- userscript metadata — `@match`, `@include`, `@grant`, `@connect`, `@version`,
  `@updateURL`, `@downloadURL`;
- `localStorage` keys or the shape of stored data (`assessmentHelpers:dockUi:v1`,
  `vcGradeBridge:pairs:v1`, `chatster_tutorial_sorter_groups_v11`, and the
  legacy `vc*` keys they fall back to);
- the registry API and event names (`assessment-helper-registered`,
  `assessment-helper-status-changed`, `assessment-helper-action`, and their
  `viscomm-*` aliases);
- panel ids and their alias lists — the dock finds panels by id;
- `data-vc-helper-id`, `data-vc-action-id`, and other action lookup hooks;
- iframe, network, cross-origin, or permission behaviour;
- MutationObserver scope and the render debounce.

Breaking a storage key silently discards a colleague's saved groups and pairings.
Breaking an alias silently orphans a panel from the dock. Neither throws.

## Workflow

```bash
git switch main
git pull --ff-only
git switch -c feature/short-description
```

1. Edit the canonical root-level script directly. No `DEV-*` copies.
2. Keep design commits and logic commits separate. A palette change and a
   behaviour fix in one diff cannot be reviewed or reverted independently.
3. Update `design/specs/` and `design/CHANGELOG.md` **in the same PR** as any
   visual change. A spec updated later is a spec that never gets updated.
4. Before handing over or opening a PR:

```bash
npm test
git diff --check
```

5. Fill in `design/HANDOFF.md` in the PR body.
6. Codex increments `@version` and confirms release readiness.
7. The human owner performs the relevant Canvas checks and explicitly approves
   the release.
8. Only after that approval may the PR be squash-merged into `main`.

For a suite-wide change, do the dock first and let it sit. Confirm the pattern
before applying it seven more times.

## Verification

`npm test` is necessary, not sufficient. It cannot see the UI.

Any visual change also needs the human owner to check:

- the dock open in real SpeedGrader;
- **the same script installed on its own, with nothing else** — this is the one
  that catches accidental cross-script dependencies;
- position and minimised state surviving a refresh;
- a comparison against `design/reference/<component>.html`.

Record the human result in the handoff. If the human owner cannot do one of
these checks, say which; do not describe a change as verified because the code
looks right.

## Known contradiction

`DEMO-CHECKLIST.md` tells you to enable eight `DEV-*.user.js` files.
`CONTRIBUTING.md` forbids root-level DEV copies, and `check:userscripts`
enforces that. The checklist predates the loader workflow and is stale — use
`npm run dev:loaders` and the generated `.local/*-loader.user.js` files instead.
Don't create DEV copies to satisfy the checklist; fix the checklist.
