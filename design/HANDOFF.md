# Handoff template

Copy this into the PR description, or into a comment when passing work between
agents mid-branch. Delete what doesn't apply — an empty heading is worse than no
heading.

The point of the format is the **contract** section. Everything else is context.
Reference the canonical contract and record deviations; do not paste a partial
list of selectors and call it complete.

---

```markdown
## Handoff — <role> → <role>

**Branch:** feature/short-description
**Commit:** <sha, or "uncommitted, working tree">
**Scripts touched:** canvas-assessment-helper-dock.user.js
**Design reference:** design/proposals/0002 §A  ← or "none — logic only"

### What changed
One or two sentences. What a marker would notice.

### Contract — do not change without saying so
**Baseline:** `design/specs/dock.md#integration-contract`  ← or the relevant spec
**Contract changes:** none

If not "none", list every changed selector, attribute, registry method, event,
state name, panel id/alias, or storage field. Include compatibility, migration,
and test impact. Contract changes require human agreement.

### Checked
- [ ] `npm test`
- [ ] `git diff --check`
- [ ] Static reference/proposal comparison completed
- [ ] Human opened every affected Canvas page with relevant helpers installed
- [ ] Human opened every affected Canvas page with ONLY the changed script
- [ ] Human confirmed affected persisted state survives a refresh
- [ ] Changed userscript `@version` incremented

### Not checked / assumed
Be specific. "Not tested in Firefox" is useful; "some things untested" is not.

### Open questions
Anything needing a human decision. If there are none, say "none".
```

---

## Notes on filling it in

**Claude (design system)** cannot supply a branch or commit — it has read-only
access to the repo and no shell. Its handoffs are keyed to a proposal number and
a folder of files to copy in, and its "Checked" list can only ever say *visual
review of a static reference page*. It has never seen the change over Canvas.
Say so plainly rather than leaving the section blank.

**Claude Code** owns the design-implementation branch and commits. It runs
automated checks and prepares the candidate for the human's Canvas check.

**Codex** owns integration review, tests, metadata, versions, and release
preparation. If it overrides a design decision, that goes in `CHANGELOG.md`
with the functional reason — not just in the PR thread.

**The human owner** is the only role that can claim authenticated Canvas
verification and the only role that can approve the final merge/release.

## The standalone check is not optional

The standalone Canvas check catches the failure mode that actually matters here:
a helper that quietly depends on the dock or another helper's styles and breaks
for the colleague who installed only one script. Every userscript change that
can affect Canvas needs the relevant standalone check. For the dock, test both
SpeedGrader and Rubrics when the change can affect both contexts.
