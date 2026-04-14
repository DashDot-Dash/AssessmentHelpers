# AssessmentHelpers

Local Canvas assessment helper userscripts.

## Naming convention

Userscript filenames use lowercase kebab-case and end with `.user.js`.

- Canvas-wide tools: `canvas-<tool-name>.user.js`
- SpeedGrader tools: `canvas-speedgrader-<tool-name>.user.js`

## Maintenance convention

- Keep scripts as standalone Tampermonkey files with local `@require` paths.
- Prefer `state`, `elements`, and `selectors` objects for globals.
- Use `get`, `parse`, `render`, `update`, `create`, `handle`, `load`, and `save` prefixes consistently.
- Preserve legacy storage keys with fallback reads when changing storage prefixes.

## Scripts

- `canvas-rubric-library-chooser.user.js` - choose rubric criteria from a local library and download a Canvas import CSV.
- `canvas-speedgrader-benchmarker.user.js` - local benchmarking overlay for Canvas SpeedGrader.
- `canvas-speedgrader-copy-paster.user.js` - assignment-specific comment snippet panel for Canvas SpeedGrader.
- `canvas-speedgrader-slider.user.js` - score sliders for Canvas SpeedGrader rubric criteria.
- `canvas-speedgrader-tutorial-sorter.user.js` - tutorial grouping helper for Canvas SpeedGrader.
- `canvas-speedgrader-when-will-it-end.user.js` - marking time estimator and session logger for Canvas SpeedGrader.
