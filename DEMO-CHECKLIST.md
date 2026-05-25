# Assessment Helpers Demo Checklist

## Enable These DEV Scripts

- `DEV-canvas-viscomm-helper-dock.user.js`
- `DEV-canvas-speedgrader-copy-paster.user.js`
- `DEV-canvas-speedgrader-benchmarker.user.js`
- `DEV-canvas-speedgrader-when-will-it-end.user.js`
- `DEV-canvas-speedgrader-tutorial-sorter.user.js`
- `DEV-canvas-speedgrader-gradebridger.user.js`
- `DEV-canvas-speedgrader-slider.user.js`
- `DEV-canvas-rubric-library-chooser.user.js`

The DEV scripts intentionally keep local `File:///` `@require` lines so they stay easy to work on locally.

## SpeedGrader Demo

1. Open Canvas SpeedGrader for an assignment with a rubric.
2. Confirm the floating `Assessment Helpers` dock appears and minimises to the `AH` tab.
3. Open and hide Copy/Paster, Benchmarker, ETA, Tutorial Sorter, and GradeBridge from the dock.
4. Drag the dock and panels, then refresh to confirm positions remain sensible.
5. Reset Tutorial Sorter or start with no class file: it should sit under `Other helpers`.
6. Import an Allocate/class file into Tutorial Sorter: groups should appear and dock `Prev`/`Next` should work with the panel hidden.
7. Disconnect GradeBridge or start with no pair: it should sit under `Other helpers`.
8. Pair two assignments in GradeBridge, hide the panel, then use dock `Switch`.
9. Confirm the rubric slider appears beside rubric score fields after selecting a rating band.

## Rubrics Page Demo

1. Open a Canvas rubrics page.
2. Confirm Rubric Builder appears in the dock/page context.
3. Open the Rubric Builder, select criteria, set the rubric title, and export the Canvas CSV.

## Expected Dock Behaviour

- Main dock: helpers that are open or have usable quick actions.
- `Other helpers`: inactive, unconfigured, or unavailable helpers.
- Hidden panels can still expose dock quick actions when configured.
