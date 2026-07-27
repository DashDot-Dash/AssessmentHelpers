# Claude and Codex Collaboration Guide

This document defines how Claude and Codex collaborate on AssessmentHelpers.
Both assistants should read this file and `CONTRIBUTING.md` before changing the
repository.

## Shared objective

Claude leads UI and visual design. Codex leads application logic, integration,
testing, and release readiness. The final userscripts should combine Claude's
approved interface with behavior reviewed and validated by Codex.

Neither role is a hard barrier to discussing the other. If a UI decision
requires a behavioral change, or existing logic limits the design, document it
in the handoff instead of silently making assumptions.

## Repository rules

- `main` is production and should remain releasable.
- Do not develop directly on `main`.
- Start each change on a short-lived `feature/*`, `fix/*`, or `chore/*` branch.
- Edit the canonical root-level `*.user.js` files. Do not create full DEV copies.
- Preserve unrelated changes already present in the working tree.
- Do not have both assistants edit the same uncommitted files at the same time.
- Commit or stash work before handing control to the other assistant.
- A merge to `main` is a release because Tampermonkey update URLs target `main`.

## Claude: UI and UX lead

Claude is responsible for:

- layout, hierarchy, spacing, typography, colour, and responsive behavior;
- HTML structure and CSS;
- controls, labels, microcopy, visual states, and interaction affordances;
- accessibility of the interface, including focus, contrast, and readable states;
- keeping the suite visually consistent;
- describing intended interactions when a mockup cannot express them fully.

Claude may create visual prototypes or adjust view code, but should preserve
existing behavior unless a logic change has been explicitly agreed.

Claude should flag, rather than silently change:

- URL detection or parsing;
- userscript metadata such as `@match`, `@include`, `@grant`, and `@connect`;
- Tampermonkey storage keys or stored-data formats;
- iframe, network, cross-origin, or permission behavior;
- event and state-management behavior;
- security or error-handling behavior;
- update/download URLs, release versions, and build or test configuration.

When UI code needs new behavior, Claude should describe the required state,
event, and expected outcome in the handoff. A clearly labelled TODO is
acceptable when the implementation belongs to Codex.

## Codex: logic and integration lead

Codex is responsible for:

- reviewing the UI diff before integration;
- URL detection, parsing, and page-specific behavior;
- loading, iframe, permission, and cross-origin behavior;
- state, storage, events, and interaction logic;
- error handling, fallbacks, security, and compatibility;
- connecting the approved UI to working behavior;
- keeping presentation and behavior separated where practical;
- userscript metadata and version changes;
- automated checks, regression testing, and release readiness.

Codex should preserve Claude's approved visual decisions unless they cause a
functional, accessibility, security, or platform problem. When a design must be
adjusted, Codex should explain the constraint and make the smallest practical
change.

## UI-to-logic boundary

Where practical, use the following separation:

- Logic functions derive state and perform actions.
- Render functions display the current state.
- Event handlers translate user actions into logic calls.
- CSS classes or `data-*` attributes represent visual states.
- UI code should not duplicate URL parsing, storage, or permission logic.
- Logic should not depend on incidental styling details such as colour or size.

Stable element IDs, class names, `data-*` attributes, custom events, and state
names form an interface between the two roles. Any change to that interface
must be identified in the handoff.

## Recommended workflow

1. Update local `main`, then create a focused branch:

   ```bash
   git switch main
   git pull --ff-only
   git switch -c feature/short-description
   ```

2. Claude implements or commits the UI work on that branch.
3. Claude records the handoff information listed below.
4. Codex reviews the committed diff and identifies the UI-to-logic contract.
5. Codex integrates the behavior, resolves regressions, and adds or updates tests.
6. Codex increments affected userscript versions once the change is release-ready.
7. Run:

   ```bash
   npm test
   git diff --check
   ```

8. Push the branch and open a pull request into `main`.
9. Review the final UI and behavior, wait for CI, then squash-merge the pull
   request.

For broad suite changes, complete one representative userscript first. Confirm
the visual system and integration pattern before applying it to the rest.

## Handoff checklist

Every handoff should include:

- branch name and latest commit;
- files changed;
- what the user should see;
- how each control or state should behave;
- selectors, attributes, events, or state names that the other role must keep;
- screenshots or mockups, when useful;
- unfinished items, assumptions, and known limitations;
- checks already run and their results.

Example:

```text
Branch: feature/lazy-ui-refresh
Commit: <commit hash>
Files: lazy-p5.user.js, lazy-padlet.user.js

Visual intent:
- Use the suite's dark panel and yellow accent.
- Reduce button height and padding.

Behavior expected:
- Open loads the detected resource.
- Close removes the portal without changing the original link.

Integration contract:
- Keep data-action="open" and data-action="close".
- The loading, loaded, denied, and error states need logic.

Checks run:
- Visual review at desktop and narrow widths.
```

## Resolving uncertainty

- Do not guess when a decision would change user-visible behavior or stored data.
- Record the uncertainty and ask for a decision, or hand it to the responsible
  role with enough context to resolve it.
- Prefer small, reviewable commits so UI and logic changes can be inspected
  independently.
- The pull request diff, tests, and approved behavior are the final source of
  truth.
