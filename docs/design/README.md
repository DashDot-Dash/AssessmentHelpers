# Assessment Helpers refresh

The ZIP handoff is saved in [refresh-handoff.md](refresh-handoff.md) as a design
reference. Its implementation instructions are superseded by the decisions here.

## Shared theme and panel refresh

The dock and six helper panels use the refreshed design. The dock contains
Theme (Soft/Dark) and Density (Compact/Roomy) settings. Defaults are Soft and
Roomy. Tutorial Sorter, ETA, Benchmarker, and GradeBridge respond to density;
Copy/Paster remains 420px wide, and Rubric Builder remains a larger modal.
The Rubric Slider keeps its simple UI.

Compact means a smaller, fully usable layout. Minimise collapses a panel or the
dock. These are independent states; changing density never minimises anything.
Dock width remains 168px in both densities. Normal panel widths are 340px
(Roomy) and 248px (Compact), with separate layouts where necessary.

The refresh retains the recent workflow additions:

- Tutorial Sorter and dock Prev/Next followed by a full-width Pause/Resume button.
- ETA break persistence, class summary, visit review, timeline, complete CSV log, and
  Prince progression matching the displayed completion percentage. Its disclosure
  remembers whether the animation is folded away, and its dark stage keeps the
  white sprite visible in either theme.
- Fixed-width minimise buttons and readable, consistent 10px disclosure triangles.

## Editing and building

Edit `shared/ah-theme.css` for colours, spacing, and shared components.
`shared/ah-panels.css` maps the helpers’ existing DOM classes onto the common
visual rules; retaining those classes preserves navigation and action hooks. Edit
`shared/ah-theme-runtime.js` for settings behaviour. Then run:

```sh
npm run build:theme
npm test
```

The build script copies the theme into a marked block in every installable
userscript. It also creates `shared/ah-theme.js` for the component preview. It
bumps the patch version of any userscript whose embedded theme changes, so
Tampermonkey can discover an update. It also advances the shared theme version
when needed, so a newly updated helper can replace an older theme on the page.
Running the build again without changing
the sources makes no changes.

Commit the source files and generated userscripts together. Do not edit the
generated blocks or preview bundle directly. CI runs `check:theme` to catch
out-of-date bundles. Local development loaders continue to use the complete
local userscripts and need no extra theme URL.

Each installed script contains the theme. There is no runtime download for the
theme and no dependency on having the dock installed. One style element is
shared on the page. Tokens are prefixed `--ah-` and defined on `.ah-scope`, so
Canvas does not inherit helper typography or colours. Figtree is preferred when
available; otherwise the theme uses the system font without downloading fonts.

Settings are stored at `localStorage['ah:settings']` on the Canvas origin.
`window.AssessmentHelpersTheme` exposes `get`, `set`, `onChange`, and `isCompact`.
JSON DOM events synchronise separately executing userscripts; storage events
synchronise browser tabs. The theme never creates or replaces the helper
registry. Settings do not alter saved rosters, snippets, grades, connections,
timing logs, or panel visibility. Density-dependent re-renders keep disclosures
open and do not open hidden panels. Theme changes apply through CSS without
rebuilding forms.

## Preview and validation

Open [theme-preview.html](../../theme-preview.html) to adjust and export colour
tokens using the production theme. Open
[primitives-preview.html](../../shared/primitives-preview.html) to compare
the shared controls in both themes and densities. This page uses the generated
theme bundle, so it reflects the production sources.

The browser checks cover the four display modes, malformed saved settings,
token scope, repeated injection, theme loading before the registry, settings
persistence and cross-tab synchronisation, numeric version precedence, dock
minimise/restore, five standalone panels in all four display modes, snippet
editing, rubric selection and CSV export, and the existing helper navigation
and break workflow.

## Review and rollout

The work is on `feature/shared-theme-dock`. Review the shared foundation and
settings first, then Tutorial Sorter/ETA, and finally the other panels. Install
the rebuilt local userscripts in Tampermonkey for a Canvas check before release.
The automated tests use Canvas fixtures, not a live course.

Future theme changes require editing the source, building once, and committing
the source and generated files together. The installed userscripts remain
self-contained, and each helper can still be installed on its own.

## ETA summary rules

Logging counts unique student IDs (labels for older anonymous records), merging
overlapping intervals so activity is not counted twice. Revisited students
accumulate time. Blocks split at explicit pauses or an idle gap over the
selected threshold (10 minutes initially). Average block length includes
small gaps within a block. Active marking time excludes those gaps and
recorded pauses. Typical break is the median gap between blocks on the same
local calendar day; overnight gaps are omitted.

Visits under 15 seconds, unusually long for the expected time band, or with
inconsistent timer spans start excluded from summaries. The review thresholds
are 30 minutes for Under 10, 90 minutes for 10–30, and 3 hours for 30+; a valid
longer visit can always be included explicitly. Merely going over the target
is flagged and does not exclude an ordinary visit. Other short visits remain included but are
flagged. Review visits can override those defaults for valid records; it never
deletes a row. The raw assignment CSV includes all visits and breaks, the
resolved inclusion flag, review reasons, tutorial group identity, and active
segments recorded around pauses.

New visits are tagged with the class at the start of the visit. The selected
class summary excludes other tagged classes, but includes older untagged
records with a visible note. Historical records cannot be assigned to a class
retroactively without evidence.

The ETA tiles retain their layout. The finish estimate uses the median
accumulated time for the five most recently visited included students. It
adds an allowance for same-day breaks using the median students per block,
without charging a break after the final student. This is an estimate, not an
automatic claim that navigation confirms marking completion.

Expected marking time is saved per assignment: Under 10 minutes, 10–30 minutes,
or 30+ minutes. With no included timings the ETA starts from an explicitly
labelled guide of 10, 20, or 45 minutes per student respectively. Once there
are included student timings, their recent median replaces that guide. The
chosen band is recorded on new raw visits.

## Internal naming and legacy data

ETA uses `ah-eta-*` IDs/classes; Tutorial Sorter uses
`ah-tutorial-sorter-*`. Their storage keys use the namespaces
`assessmentHelpers:eta:v1:*` and `assessmentHelpers:tutorialSorter:v1:*`.

The retired names are isolated in `shared/legacy-storage.js` and migration
tests. That file is bundled alongside the theme into every userscript. It
copies a legacy value to its canonical key, verifies the copy, and then removes
the redundant old value. Existing canonical data takes precedence. Differing
historical values are preserved; Reset clears the associated aliases as well
so they cannot reappear. Failed writes leave the original available through
the migration-aware read function. Unrelated Canvas storage is untouched.

Update all the helpers together and reload Canvas for the naming transition.
This migration changes identifiers and preserves the existing data format;
the proposed passphrase vault remains separate work.
