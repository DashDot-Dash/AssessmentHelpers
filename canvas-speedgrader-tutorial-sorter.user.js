// ==UserScript==
// @name         Assessment Helpers - Tutorial Sorter
// @namespace    AssessmentHelpers
// @version      1.2.18
// @description  Assessment Helpers panel for importing class rosters and navigating Canvas SpeedGrader by tutorial group
// @match        https://*/courses/*/gradebook/speed_grader*
// @grant        none
// @updateURL    https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-tutorial-sorter.user.js
// @downloadURL  https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-tutorial-sorter.user.js
// @require      https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js
// ==/UserScript==

// BEGIN GENERATED AH THEME (737f047ab5f1475e)
// Edit the shared CSS/runtime/legacy-storage sources, then run npm run build:theme.
// Compatibility only: retired identifiers are kept here to preserve saved data.
(function () {
  'use strict';
  const tutorial = 'assessmentHelpers:tutorialSorter:v1:';
  const eta = 'assessmentHelpers:eta:v1:';
  const fixed = new Map([
    [tutorial + 'groups', ['chatster_tutorial_sorter_groups_v11']],
    [tutorial + 'activeGroup', ['chatster_tutorial_sorter_active_group_v11']],
    [tutorial + 'panelPosition', ['chatster_tutorial_sorter_panel_pos_v11']],
    [tutorial + 'panelUi', ['chatster_tutorial_sorter_ui_v11']],
    [tutorial + 'context', ['chatster_tutorial_sorter_context_v11', 'chatster_tutorial_sorter_context_v10',
      ...Array.from({ length: 9 }, (_, index) => `chatster_local_marking_group_context_v${9 - index}`)]],
    [tutorial + 'exportNameMode', ['chatster_tutorial_sorter_export_name_mode_v1']],
    [eta + 'panelPosition', ['canvas_speedgrader_when_will_it_end_v1:panel_position', 'wwie_panel_position']]
  ]);

  function aliases(key) {
    if (fixed.has(key)) return fixed.get(key);
    if (key.startsWith(tutorial + 'canvasMenuCache:')) {
      return ['chatster_canvas_menu_cache_v1:' + key.slice((tutorial + 'canvasMenuCache:').length)];
    }
    if (key.startsWith(eta)) {
      const assignment = key.slice(eta.length);
      return ['canvas_speedgrader_when_will_it_end_v1:' + assignment, 'wwie_' + assignment];
    }
    return [];
  }

  function read(key) {
    const current = localStorage.getItem(key);
    if (current !== null) return current;
    for (const oldKey of aliases(key)) {
      const value = localStorage.getItem(oldKey);
      if (value === null) continue;
      try {
        localStorage.setItem(key, value);
        if (localStorage.getItem(key) === value) localStorage.removeItem(oldKey);
      } catch {
        // A quota/storage failure must leave the original readable and intact.
      }
      return value;
    }
    return null;
  }

  function migrate() {
    const keys = new Set(fixed.keys());
    // Snapshot keys because successful migration removes old entries.
    const existing = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index));
    for (const key of existing) {
      if (!key) continue;
      if (key.startsWith('chatster_canvas_menu_cache_v1:')) {
        keys.add(tutorial + 'canvasMenuCache:' + key.slice('chatster_canvas_menu_cache_v1:'.length));
      } else if (key.startsWith('canvas_speedgrader_when_will_it_end_v1:') && !key.endsWith(':panel_position')) {
        keys.add(eta + key.slice('canvas_speedgrader_when_will_it_end_v1:'.length));
      } else if (key.startsWith('wwie_') && key !== 'wwie_panel_position') {
        keys.add(eta + key.slice('wwie_'.length));
      }
    }
    for (const key of keys) {
      const value = read(key);
      if (value === null) continue;
      // Remove redundant copies only; differing historical values are retained.
      for (const oldKey of aliases(key)) {
        if (localStorage.getItem(oldKey) === value && localStorage.getItem(key) === value) localStorage.removeItem(oldKey);
      }
    }
  }

  function remove(key) {
    localStorage.removeItem(key);
    for (const oldKey of aliases(key)) localStorage.removeItem(oldKey);
  }

  window.AssessmentHelpersCompatibility = { read, remove, migrate };
  try { migrate(); } catch { /* Other helpers retain their normal storage fallback. */ }
})();

// Source for the embedded theme runtime. npm run build:theme inserts the CSS.
(function () {
  'use strict';
  const VERSION = '1.0.14';
  const STYLE_ID = 'ah-theme';
  const KEY = 'ah:settings';
  const CHANGE_EVENT = 'assessment-helper-theme-changed';
  const CSS = "\n.ah-scope{\n  --ah-soft-0:#FFFFFF;\n  --ah-soft-50:#F4F6F8;\n  --ah-soft-100:#ECF0F3;\n  --ah-soft-150:#E2E7EC;\n  --ah-soft-200:#D5DCE3;\n  --ah-soft-line:#E1E6EB;\n  --ah-soft-ink:#1E2229;\n  --ah-soft-ink-2:#3A404A;\n  --ah-soft-muted:#66707C;\n  --ah-zinc-950:#18181B;\n  --ah-zinc-800:#27272A;\n  --ah-zinc-700:#3F3F46;\n  --ah-zinc-400:#A1A1AA;\n  --ah-zinc-200:#E4E4E7;\n  --ah-zinc-50:#FAFAFA;\n  --ah-graphite-950:#111214;\n  --ah-graphite-800:#292B2E;\n  --ah-graphite-750:#36383C;\n  --ah-graphite-700:#43464A;\n  --ah-graphite-400:#A4A7AC;\n  --ah-graphite-200:#E4E6E9;\n  --ah-graphite-50:#F9FAFB;\n  --ah-stripe-500:#D6A21D;\n  --ah-stripe-400:#E0B13A;\n  --ah-stripe-300:#f3d36c;\n  --ah-stripe-100:#FFF5C7;\n  --ah-mist-50:#f8f9fb;\n  --ah-mist-100:#f3f5f8;\n  --ah-mist-150:#eef1f4;\n  --ah-mist-200:#e6eaee;\n  --ah-mist-line:#d9dde3;\n  --ah-mist-line-strong:#cfd5dd;\n  --ah-slate-ink:#25303b;\n  --ah-slate-ink-2:#2f3a45;\n  --ah-slate-muted:#5f6b76;\n  --ah-danger-900:#4c1720;\n  --ah-danger-700:#8b1e2d;\n  --ah-danger-600:#a32437;\n  --ah-danger-500:#8b1e2d;\n  --ah-danger-150:#EDD3D7;\n  --ah-danger-100:#F6E7E9;\n  --ah-danger-text:#fff2f4;\n  --ah-danger-text-soft:#F2C9CF;\n  --ah-success-900:#183D2A;\n  --ah-success-700:#1F6640;\n  --ah-success-600:#26794C;\n  --ah-success-500:#1F6640;\n  --ah-success-150:#D3E5D9;\n  --ah-success-100:#E6F0E9;\n  --ah-success-text:#B5D6C1;\n  --ah-success-fill-a:#26794C;\n  --ah-success-fill-b:#4E9A6C;\n  --ah-band-hd:#2e7d32;\n  --ah-band-d:#1b5ee4;\n  --ah-band-c:#fdbf5b;\n  --ah-band-p:#ef6c00;\n  --ah-band-f:#c62828;\n  --ah-band-ns:#8a8a8a;\n  --ah-white-a04:rgba(255,255,255,0.04);\n  --ah-white-a05:rgba(255,255,255,0.05);\n  --ah-white-a06:rgba(255,255,255,0.06);\n  --ah-white-a08:rgba(255,255,255,0.08);\n  --ah-white-a12:rgba(255,255,255,0.12);\n  --ah-white-a14:rgba(255,255,255,0.14);\n  --ah-white-a20:rgba(255,255,255,0.2);\n  --ah-white-a22:rgba(255,255,255,0.22);\n  --ah-ink-a04:rgba(30,34,41,0.04);\n  --ah-ink-a06:rgba(30,34,41,0.06);\n  --ah-ink-a10:rgba(30,34,41,0.10);\n  --ah-bg:var(--ah-soft-50);\n  --ah-surface:var(--ah-soft-0);\n  --ah-fill:var(--ah-soft-100);\n  --ah-fill-hover:var(--ah-soft-150);\n  --ah-tint:var(--ah-ink-a04);\n  --ah-tint-strong:var(--ah-ink-a06);\n  --ah-line:var(--ah-soft-line);\n  --ah-line-strong:var(--ah-soft-200);\n  --ah-text:var(--ah-soft-ink);\n  --ah-text-soft:var(--ah-soft-ink-2);\n  --ah-muted:var(--ah-soft-muted);\n  --ah-stripe:var(--ah-stripe-500);\n  --ah-stripe-hover:var(--ah-stripe-400);\n  --ah-stripe-wash:var(--ah-fill-hover);\n  --ah-on-stripe:var(--ah-zinc-950);\n  --ah-danger:var(--ah-danger-500);\n  --ah-danger-fill:var(--ah-danger-100);\n  --ah-danger-fill-hover:var(--ah-danger-150);\n  --ah-focus:rgba(214,162,29,0.45);\n  --ah-shadow:0 1px 2px rgba(30,34,41,0.06),0 12px 32px rgba(30,34,41,0.10);\n  --ah-shell:var(--ah-bg);\n  --ah-header:var(--ah-bg);\n  --ah-section:var(--ah-surface);\n  --ah-control:var(--ah-fill);\n  --ah-control-hover:var(--ah-fill-hover);\n  --ah-border:var(--ah-line);\n  --ah-surface-panel:var(--ah-bg);\n  --ah-surface-header:var(--ah-bg);\n  --ah-surface-section:var(--ah-surface);\n  --ah-border-panel:var(--ah-line);\n  --ah-border-header:var(--ah-line);\n  --ah-border-section:var(--ah-line);\n  --ah-text-body:var(--ah-text);\n  --ah-text-muted:var(--ah-muted);\n  --ah-focus-ring:var(--ah-focus);\n  --ah-surface-page:var(--ah-mist-150);\n  --ah-surface-page-2:var(--ah-mist-200);\n  --ah-surface-card-light:#ffffff;\n  --ah-surface-card-soft:var(--ah-mist-50);\n  --ah-text-ink:var(--ah-slate-ink);\n  --ah-text-ink-muted:var(--ah-slate-muted);\n}\nhtml[data-ah-theme=\"dark\"] .ah-scope{\n  --ah-bg:var(--ah-graphite-950);\n  --ah-surface:var(--ah-graphite-800);\n  --ah-fill:var(--ah-graphite-750);\n  --ah-fill-hover:var(--ah-graphite-700);\n  --ah-tint:var(--ah-white-a05);\n  --ah-tint-strong:var(--ah-white-a12);\n  --ah-line:var(--ah-white-a08);\n  --ah-line-strong:var(--ah-white-a14);\n  --ah-text:var(--ah-graphite-50);\n  --ah-text-soft:var(--ah-graphite-200);\n  --ah-muted:var(--ah-graphite-400);\n  --ah-stripe-wash:var(--ah-fill-hover);\n  --ah-danger:var(--ah-danger-text-soft);\n  --ah-danger-fill:var(--ah-danger-900);\n  --ah-danger-fill-hover:var(--ah-danger-700);\n  --ah-focus:var(--ah-white-a22);\n  --ah-shadow:0 10px 30px rgba(0,0,0,0.30);\n}\n\n.ah-scope{\n  --ah-font-ui:\"Figtree\",-apple-system,BlinkMacSystemFont,\"Segoe UI\",system-ui,sans-serif;\n  --ah-font-mono:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,\"Liberation Mono\",monospace;\n  --ah-fs-tag:10px;\n  --ah-fs-micro:11px;\n  --ah-fs-action:11px;\n  --ah-fs-xs:12px;\n  --ah-fs-sm:13px;\n  --ah-fs-base:13px;\n  --ah-fs-md:15px;\n  --ah-fw-regular:400;\n  --ah-fw-medium:500;\n  --ah-fw-semibold:600;\n  --ah-fw-bold:700;\n  --ah-fw-heavy:700;\n  --ah-fw-black:800;\n  --ah-lh-tight:1.15;\n  --ah-lh-snug:1.3;\n  --ah-lh-body:1.45;\n  --ah-tracking-label:0.01em;\n  --ah-tracking-label-sm:0.01em;\n}\n\n.ah-scope{\n  --ah-space-2:2px;--ah-space-4:4px;--ah-space-6:6px;--ah-space-7:7px;--ah-space-8:8px;--ah-space-9:9px;--ah-space-10:10px;--ah-space-12:12px;--ah-space-14:14px;--ah-space-18:18px;\n  --ah-stripe-width:8px;\n  --ah-stripe-inset:24px;\n  --ah-stripe-inset-dock:22px;\n  --ah-radius-xs:8px;\n  --ah-radius-sm:10px;\n  --ah-radius-md:12px;\n  --ah-radius-lg:18px;\n  --ah-radius-xl:18px;\n  --ah-radius-pill:999px;\n  --ah-control-h-sm:28px;\n  --ah-control-h-md:34px;\n  --ah-shadow-panel:0 1px 2px rgba(30,34,41,0.06),0 12px 32px rgba(30,34,41,0.10);\n  --ah-shadow-panel-strong:0 1px 2px rgba(30,34,41,0.08),0 16px 40px rgba(30,34,41,0.14);\n  --ah-shadow-chip:0 1px 2px rgba(30,34,41,0.06);\n  --ah-shadow-toast:0 10px 28px rgba(17,24,39,0.12);\n  --ah-shadow-card-light:0 1px 2px rgba(30,34,41,0.04);\n  --ah-panel-w-dock:168px;\n  --ah-panel-w:340px;\n  --ah-panel-w-wide:510px;\n  --ah-dur-fast:120ms;\n  --ah-dur-base:160ms;\n  --ah-dur-slow:180ms;\n  --ah-ease:ease;\n  --ah-z-dock:2147483000;\n  --ah-z-panel:100000;\n  --ah-z-overlay:2147483646;\n}\n\n/* ---- density ---- */\n.ah-scope{--ah-panel-w:340px;--ah-gap:10px}\nhtml[data-ah-density=\"compact\"] .ah-scope{--ah-panel-w:248px;--ah-gap:8px}\n/* ---- panel shell ---- */\n.ah-panel{box-sizing:border-box;width:var(--ah-panel-w);border-radius:var(--ah-radius-lg);background:var(--ah-bg);color:var(--ah-text);border:1px solid var(--ah-line);box-shadow:var(--ah-shadow);overflow:hidden;font:400 13px/1.45 var(--ah-font-ui)}\n.ah-panel--wide{width:420px}\n.ah-panel__header{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 8px 8px 12px;cursor:grab;user-select:none}\n.ah-panel.is-min .ah-panel__header{padding:8px 8px 8px 12px}\n.ah-panel__title{display:flex;align-items:center;gap:9px;min-width:0;font-size:var(--ah-fs-md);font-weight:700;letter-spacing:-.01em;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.ah-panel__title::before{content:\"\";flex:0 0 auto;width:var(--ah-stripe-width);height:22px;border-radius:999px;background:var(--ah-stripe)}\n.ah-panel__body{display:grid;gap:var(--ah-gap);padding:4px 12px 12px}\n.ah-panel.is-dragging{opacity:.9}\n/* ---- buttons: ONE family ---- */\n.ah-btn{appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box;min-height:var(--ah-control-h-md);padding:0 14px;border:0;border-radius:999px;font:600 var(--ah-fs-sm)/1.2 var(--ah-font-ui);white-space:nowrap;cursor:pointer;background:var(--ah-fill);color:var(--ah-text);transition:background var(--ah-dur-fast) var(--ah-ease)}\n.ah-btn:hover{background:var(--ah-fill-hover)}\n.ah-btn--sm{min-height:var(--ah-control-h-sm);padding:0 12px;font-size:var(--ah-fs-xs)}\n.ah-btn--block{width:100%}\n.ah-btn--primary{background:var(--ah-stripe);color:var(--ah-on-stripe)}.ah-btn--primary:hover{background:var(--ah-stripe-hover)}\n.ah-btn--ghost{background:transparent;color:var(--ah-text-soft)}.ah-btn--ghost:hover{background:var(--ah-tint)}\n.ah-btn--danger{background:var(--ah-danger-fill);color:var(--ah-danger)}.ah-btn--danger:hover{background:var(--ah-danger-fill-hover)}\n.ah-btn[aria-pressed=\"true\"],.ah-btn.is-active{background:var(--ah-fill-hover);box-shadow:inset 0 0 0 1.5px var(--ah-stripe)}\n.ah-btn:disabled{opacity:.45;cursor:not-allowed}\n.ah-btn svg{width:16px;height:16px}.ah-btn--sm svg{width:14px;height:14px}\n.ah-icon-btn{appearance:none;display:inline-grid;place-items:center;flex:0 0 auto;width:var(--ah-control-h-md);height:var(--ah-control-h-md);padding:0;border:0;border-radius:999px;cursor:pointer;background:var(--ah-fill);color:var(--ah-text-soft);transition:background var(--ah-dur-fast) var(--ah-ease)}\n.ah-icon-btn:hover{background:var(--ah-fill-hover)}\n.ah-icon-btn--sm{width:var(--ah-control-h-sm);height:var(--ah-control-h-sm)}\n.ah-icon-btn--primary{background:var(--ah-stripe);color:var(--ah-on-stripe)}.ah-icon-btn--primary:hover{background:var(--ah-stripe-hover)}\n.ah-icon-btn--ghost{background:transparent;color:var(--ah-muted)}.ah-icon-btn--ghost:hover{background:var(--ah-tint)}\n.ah-icon-btn--danger{background:var(--ah-danger-fill);color:var(--ah-danger)}.ah-icon-btn--danger:hover{background:var(--ah-danger-fill-hover)}\n.ah-icon-btn:disabled{opacity:.45;cursor:default}\n.ah-icon-btn svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}\n/* grade button: secondary pill + band dot; active = ring in band colour (set --ah-band on the element) */\n.ah-grade-btn{appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:0;min-height:var(--ah-control-h-md);padding:0 8px;border:0;border-radius:999px;background:var(--ah-fill);color:var(--ah-text);font:600 var(--ah-fs-sm) var(--ah-font-ui);cursor:pointer}\n.ah-grade-btn:hover{background:var(--ah-fill-hover)}\n.ah-grade-btn::before{content:\"\";width:11px;height:11px;border-radius:999px;background:var(--ah-band,var(--ah-band-ns));flex:0 0 auto}\n.ah-grade-btn.is-active{background:var(--ah-surface);box-shadow:inset 0 0 0 2px var(--ah-band,var(--ah-band-ns))}\n/* ---- pills / chips ---- */\n.ah-chip{appearance:none;border:0;display:inline-flex;align-items:center;gap:6px;padding:4px 11px;border-radius:999px;background:var(--ah-fill);color:var(--ah-text-soft);font:600 var(--ah-fs-xs) var(--ah-font-ui);white-space:nowrap;cursor:pointer}\n.ah-chip:hover{background:var(--ah-fill-hover)}\n.ah-chip.is-active{background:var(--ah-stripe);color:var(--ah-on-stripe)}\n.ah-dot{display:inline-block;width:10px;height:10px;border-radius:999px;background:var(--ah-band,var(--ah-band-ns));flex:0 0 auto}\n.ah-count-chip{display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;background:var(--ah-fill);color:var(--ah-text);font-size:var(--ah-fs-sm);cursor:pointer}\n.ah-count-chip:hover{background:var(--ah-fill-hover)}\n.ah-count-chip.is-active{background:var(--ah-stripe-wash);box-shadow:inset 0 0 0 1.5px var(--ah-stripe)}\n.ah-count-chip b{margin-left:auto;font-weight:700;font-variant-numeric:tabular-nums}\n/* ---- surfaces ---- */\n.ah-section{padding:12px;border-radius:var(--ah-radius-md);background:var(--ah-surface);box-shadow:var(--ah-shadow-card-light)}\n.ah-section--inset{background:var(--ah-fill);box-shadow:none}\n.ah-label{font-size:var(--ah-fs-xs);font-weight:600;color:var(--ah-muted)}\n.ah-muted{font-size:var(--ah-fs-xs);color:var(--ah-muted)}\n.ah-empty{padding:12px 14px;border-radius:var(--ah-radius-md);border:1px dashed var(--ah-line-strong);color:var(--ah-muted);font-size:var(--ah-fs-sm)}\n.ah-dropzone{display:grid;justify-items:center;gap:4px;padding:16px 12px 12px;border-radius:var(--ah-radius-md);border:1.5px dashed var(--ah-line-strong);text-align:center}\n.ah-dropzone.is-over{border-color:var(--ah-stripe);background:var(--ah-stripe-wash)}\n/* stat tile; .ah-stat--inline = one line (auto in compact for .ah-stat--auto) */\n.ah-stat{padding:9px 12px;border-radius:var(--ah-radius-md);background:var(--ah-surface)}\n.ah-stat__label{font-size:var(--ah-fs-micro);font-weight:500;color:var(--ah-muted);white-space:nowrap}\n.ah-stat__value{margin-top:2px;font-size:15px;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}\n.ah-stat--primary{background:var(--ah-stripe-wash);box-shadow:inset 0 0 0 1.5px var(--ah-stripe)}.ah-stat--primary .ah-stat__value{font-size:18px}\n.ah-stat--secondary{background:var(--ah-fill)}.ah-stat--secondary .ah-stat__value{color:var(--ah-text-soft)}\n.ah-stat--inline,html[data-ah-density=\"compact\"] .ah-scope .ah-stat--auto{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:6px 12px}\n.ah-stat--inline .ah-stat__value,html[data-ah-density=\"compact\"] .ah-scope .ah-stat--auto .ah-stat__value{margin-top:0;font-size:14px}\n/* list row */\n.ah-row{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:var(--ah-radius-xs);color:var(--ah-text-soft);font-size:var(--ah-fs-base);cursor:pointer}\n.ah-row:hover{background:var(--ah-tint)}\n.ah-row.is-current{background:var(--ah-stripe-wash);box-shadow:inset 0 0 0 1.5px var(--ah-stripe);color:var(--ah-text);font-weight:600}\n.ah-row__meta{margin-left:auto;font-size:var(--ah-fs-xs);font-weight:400;color:var(--ah-muted);white-space:nowrap}\n/* fields */\n.ah-field{width:100%;box-sizing:border-box;min-height:var(--ah-control-h-md);padding:8px 12px;border:1px solid transparent;border-radius:var(--ah-radius-sm);background:var(--ah-fill);color:var(--ah-text);font:400 var(--ah-fs-base) var(--ah-font-ui);outline:none}\n.ah-field:focus{border-color:var(--ah-stripe)}\n.ah-field-label{display:block;margin-bottom:5px;font-size:var(--ah-fs-xs);font-weight:500;color:var(--ah-muted)}\n/* disclosure (use <details class=\"ah-details\">) */\n.ah-details{padding:12px;border-radius:var(--ah-radius-md);background:var(--ah-surface);box-shadow:var(--ah-shadow-card-light)}\n.ah-details--divider{padding:12px 0 0;margin-top:2px;border-radius:0;background:none;box-shadow:none;border-top:1px solid var(--ah-line)}\n.ah-details>summary{list-style:none;display:flex;justify-content:space-between;align-items:center;cursor:pointer;font-size:var(--ah-fs-xs);font-weight:600;color:var(--ah-text-soft)}\n.ah-details>summary::-webkit-details-marker{display:none}\n.ah-details>summary::marker{content:\"\"}\n.ah-details>summary::after{content:\"\";display:block;width:10px;height:10px;flex:0 0 10px;margin-left:auto;background:var(--ah-muted);clip-path:polygon(20% 0,100% 50%,20% 100%);transition:transform var(--ah-dur-fast) var(--ah-ease)}\n.ah-details[open]>summary{margin-bottom:10px}.ah-details[open]>summary::after{transform:rotate(90deg)}\n/* segmented (settings) */\n.ah-seg{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:2px;padding:3px;border-radius:999px;background:var(--ah-fill)}\n.ah-seg button{appearance:none;border:0;border-radius:999px;min-height:24px;padding:0 10px;background:transparent;color:var(--ah-text-soft);font:600 var(--ah-fs-xs) var(--ah-font-ui);cursor:pointer;white-space:nowrap}\n.ah-seg button[aria-pressed=\"true\"]{background:var(--ah-stripe);color:var(--ah-on-stripe)}\n/* quiet toast */\n.ah-toast{display:inline-flex;align-items:center;gap:10px;min-height:40px;padding:8px 16px 8px 12px;border-radius:999px;background:var(--ah-surface);color:var(--ah-text);box-shadow:var(--ah-shadow);font:600 13px/1.2 var(--ah-font-ui)}\n.ah-spinner{width:15px;height:15px;box-sizing:border-box;border:2px solid var(--ah-fill-hover);border-top-color:var(--ah-stripe);border-radius:999px;animation:ah-spin 680ms linear infinite}\n@keyframes ah-spin{to{transform:rotate(360deg)}}\n\n/* Visible keyboard focus across the shared controls. */\n.ah-scope :is(button, input, select, textarea, summary):focus-visible {\n  outline:2px solid var(--ah-stripe);\n  outline-offset:2px;\n}\n.ah-seg button:disabled { opacity:.45; cursor:default; }\n.ah-scope svg { fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }\n.ah-scope *, .ah-scope *::before, .ah-scope *::after { box-sizing:border-box; }\n@media (prefers-reduced-motion:reduce) {\n  .ah-scope *, .ah-scope *::before, .ah-scope *::after { transition:none; animation:none; }\n}\n\n/* Migration adapters preserve helper event hooks and saved data while sharing\n   the visual components. Panel-specific layout remains in each userscript. */\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-panel.ah-scope {\n  width:var(--ah-panel-w); max-width:calc(100vw - 20px); border-radius:18px;\n  background:var(--ah-bg); color:var(--ah-text); border:1px solid var(--ah-line);\n  box-shadow:var(--ah-shadow); font:400 13px/1.45 var(--ah-font-ui); overflow:hidden;\n}\n#sg-copypaster-panel.ah-panel.ah-scope { width:420px; }\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope :is(.ah-eta-header, .ah-tutorial-sorter-header, .sg-head, .cp-head, .vc-gradebridge-header) {\n  display:flex; align-items:center; justify-content:space-between; gap:10px;\n  padding:10px 8px 8px 12px; background:transparent; border:0; cursor:grab;\n}\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope :is(.ah-eta-header, .ah-tutorial-sorter-header, .sg-head, .cp-head, .vc-gradebridge-header)::before { content:none; }\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope :is(.ah-eta-title, .ah-tutorial-sorter-title, .sg-head-title, .cp-head-title, .vc-gradebridge-title) {\n  display:flex; align-items:center; gap:9px; min-width:0;\n  font-size:15px; font-weight:700; line-height:1.2; letter-spacing:-.01em;\n}\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope :is(.ah-eta-title, .ah-tutorial-sorter-title, .sg-head-title, .cp-head-title, .vc-gradebridge-title)::before {\n  content:\"\"; width:8px; height:22px; flex:0 0 8px; border-radius:999px; background:var(--ah-stripe);\n}\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope :is(.ah-eta-body, .ah-tutorial-sorter-body, .sg-body, .cp-body, .vc-gradebridge-body) {\n  padding:4px 12px 12px;\n}\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope button {\n  appearance:none; display:inline-flex; align-items:center; justify-content:center; gap:6px;\n  min-height:34px; padding:0 14px; border:0; border-radius:999px;\n  background:var(--ah-fill); color:var(--ah-text); font:600 13px/1.2 var(--ah-font-ui); cursor:pointer;\n}\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope button:hover:not(:disabled) { background:var(--ah-fill-hover); }\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope button:disabled { opacity:.45; cursor:default; }\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope button:is(.active, .is-active, [aria-pressed=\"true\"]) {\n  background:var(--ah-fill-hover); box-shadow:inset 0 0 0 1.5px var(--ah-stripe); outline:0;\n}\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope :is(.ah-eta-panel-toggle, .ah-tutorial-sorter-panel-toggle, .sg-panel-toggle, .cp-panel-toggle, .vc-gradebridge-header-button) {\n  flex:0 0 28px; width:28px; height:28px; min-height:28px; padding:0;\n  background:transparent; color:var(--ah-text-soft);\n}\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope :is(.ah-eta-panel-toggle, .ah-tutorial-sorter-panel-toggle, .sg-panel-toggle, .cp-panel-toggle, .vc-gradebridge-header-button):hover { background:var(--ah-tint); }\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope button svg { width:16px; height:16px; flex:0 0 auto; }\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope :is(input, select, textarea) {\n  background:var(--ah-fill); color:var(--ah-text); border:1px solid var(--ah-line); border-radius:10px;\n  padding:8px 10px; font:400 13px/1.45 var(--ah-font-ui); max-width:100%;\n}\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope :is(.ah-eta-muted, .ah-tutorial-sorter-muted, .sg-small, .cp-small, .vc-gradebridge-context) { color:var(--ah-muted); }\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope :is(label, .ah-tutorial-sorter-label, .sg-section-title) {\n  font-size:12px; font-weight:600; color:var(--ah-muted); text-transform:none; letter-spacing:0;\n}\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope details {\n  background:var(--ah-surface); border:0; border-radius:12px; padding:8px 10px;\n}\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope details > summary {\n  display:flex; align-items:center; gap:8px; color:var(--ah-text-soft); font-size:12px;\n  font-weight:600; text-transform:none; letter-spacing:0; list-style:none; cursor:pointer;\n}\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope details > summary::marker { content:\"\"; }\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope details > summary::-webkit-details-marker { display:none; }\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope details > summary::after {\n  content:\"\"; width:10px; height:10px; flex:0 0 10px; margin-left:auto;\n  background:var(--ah-muted); color:var(--ah-muted); clip-path:polygon(20% 0,100% 50%,20% 100%); transform:rotate(0deg);\n}\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope details[open] > summary::after { transform:rotate(90deg); }\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope :is(.ah-tutorial-sorter-btn-danger, .ah-eta-btn-danger, .cp-btn-danger, #sg-reset) {\n  background:var(--ah-danger-fill); color:var(--ah-danger); min-height:28px; font-size:12px;\n}\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope :is(.ah-tutorial-sorter-btn-danger, .ah-eta-btn-danger, .cp-btn-danger, #sg-reset):hover { background:var(--ah-danger-fill-hover); }\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope :is(#ah-eta-log, #ah-tutorial-sorter-prev, #ah-tutorial-sorter-next, .sg-tutorial-nav button, .cp-action-secondary, .cp-icon-btn-primary, .vc-gradebridge-assignment-card-target) {\n  background:var(--ah-stripe); color:var(--ah-on-stripe);\n}\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope :is(#ah-eta-log, #ah-tutorial-sorter-prev, #ah-tutorial-sorter-next, .sg-tutorial-nav button, .cp-action-secondary, .cp-icon-btn-primary, .vc-gradebridge-assignment-card-target):hover { background:var(--ah-stripe-hover); }\n/* Tutorial Sorter */\n#ah-tutorial-sorter-panel.ah-scope :is(.ah-tutorial-sorter-card, .ah-tutorial-sorter-stat) { background:var(--ah-surface); border:0; border-radius:12px; }\n#ah-tutorial-sorter-panel.ah-scope .ah-tutorial-sorter-stat { padding:8px 10px; }\n#ah-tutorial-sorter-panel.ah-scope .ah-tutorial-sorter-student-item { border-radius:10px; background:transparent; justify-content:flex-start; }\n#ah-tutorial-sorter-panel.ah-scope .ah-tutorial-sorter-student-item.is-current { background:var(--ah-fill-hover); box-shadow:inset 0 0 0 1.5px var(--ah-stripe); }\nhtml[data-ah-density=\"compact\"] #ah-tutorial-sorter-panel.ah-scope .ah-tutorial-sorter-stat { display:flex; align-items:center; justify-content:space-between; gap:6px; }\nhtml[data-ah-density=\"compact\"] #ah-tutorial-sorter-panel.ah-scope .ah-tutorial-sorter-stat-label { margin:0; }\n/* ETA */\n#ah-eta-panel.ah-scope .ah-eta-stat { background:var(--ah-surface); border:0; border-radius:12px; padding:8px 10px; }\n#ah-eta-panel.ah-scope .ah-eta-stat-primary { display:flex; align-items:center; justify-content:space-between; gap:4px; }\n#ah-eta-panel.ah-scope .ah-eta-stat-label { color:var(--ah-muted); font-size:11px; margin-bottom:0; }\n#ah-eta-panel.ah-scope .ah-eta-stat-value { color:var(--ah-text); font-size:14px; white-space:nowrap; }\n#ah-eta-panel.ah-scope .ah-eta-stats-primary { gap:5px; }\n#ah-eta-panel.ah-scope .ah-eta-details { padding:4px 8px; background:var(--ah-surface); }\n#ah-eta-panel.ah-scope .ah-eta-stats-secondary { grid-template-columns:repeat(2,minmax(0,1fr)); }\n#ah-eta-panel.ah-scope .ah-eta-button-row { align-items:center; margin-top:8px; }\nhtml[data-ah-density=\"compact\"] #ah-eta-panel.ah-scope .ah-eta-stats-primary { grid-template-columns:repeat(2,minmax(0,1fr)); }\nhtml[data-ah-density=\"compact\"] #ah-eta-panel.ah-scope .ah-eta-stats-primary > :first-child { grid-column:1 / -1; }\nhtml[data-ah-density=\"compact\"] #ah-eta-panel.ah-scope .ah-eta-stats-secondary { grid-template-columns:1fr; }\nhtml[data-ah-density=\"compact\"] #ah-eta-panel.ah-scope .ah-eta-stat-secondary { display:flex; align-items:center; justify-content:space-between; gap:6px; }\n/* Benchmarker */\n#sg-benchmarker-panel.ah-scope .sg-section { background:var(--ah-surface); border:0; border-radius:12px; }\n#sg-benchmarker-panel.ah-scope .sg-section-toggle { min-height:24px; padding:0; margin:0 0 8px; border-radius:0; border:0; background:transparent; color:var(--ah-text-soft); font-size:12px; text-transform:none; letter-spacing:0; justify-content:space-between; }\n#sg-benchmarker-panel.ah-scope .sg-section-toggle:hover { background:transparent; }\n#sg-benchmarker-panel.ah-scope .sg-section-toggle-icon { color:var(--ah-muted); }\n#sg-benchmarker-panel.ah-scope .sg-grade-btn { background:var(--ah-fill); border:0; box-shadow:none; padding:0 10px; }\n#sg-benchmarker-panel.ah-scope .sg-grade-btn::before { content:\"\"; width:11px; height:11px; border-radius:50%; background:var(--ah-band); flex:0 0 11px; }\n#sg-benchmarker-panel.ah-scope .sg-grade-btn.active { background:var(--ah-surface); box-shadow:inset 0 0 0 2px var(--ah-band); }\n#sg-benchmarker-panel.ah-scope .sg-grade-primary-grid { grid-template-columns:repeat(4,minmax(0,1fr)); }\n#sg-benchmarker-panel.ah-scope .sg-grade-secondary-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }\n#sg-benchmarker-panel.ah-scope .sg-count-chip { background:var(--ah-fill); border:0; border-radius:999px; color:var(--ah-text); }\n#sg-benchmarker-panel.ah-scope .sg-count-chip.active { background:var(--ah-fill-hover); box-shadow:inset 0 0 0 1.5px var(--ah-stripe); }\nhtml[data-ah-density=\"compact\"] #sg-benchmarker-panel.ah-scope .sg-grade-primary-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }\n/* Copy/Paster */\n#sg-copypaster-panel.ah-scope .cp-item { background:var(--ah-surface); border:0; border-radius:12px; padding:12px; }\n#sg-copypaster-panel.ah-scope .cp-item-title { color:var(--ah-text); font-weight:600; }\n#sg-copypaster-panel.ah-scope .cp-list { background:var(--ah-fill); border-radius:14px; padding:8px; }\n#sg-copypaster-panel.ah-scope .cp-mode-details { background:transparent; border-top:1px solid var(--ah-line); border-radius:0; }\n/* GradeBridge */\n#vc-gradebridge-panel.ah-scope .vc-gradebridge-assignment-card-current { background:var(--ah-surface); border:0; border-radius:12px; }\n#vc-gradebridge-panel.ah-scope .vc-gradebridge-assignment-card-target { padding:9px 12px; border-radius:12px; }\n#vc-gradebridge-panel.ah-scope .vc-gradebridge-manage { background:none; padding:9px 0 0; border-top:1px solid var(--ah-line); border-radius:0; }\n\n#sg-copypaster-panel.ah-scope .cp-icon-btn { width:28px; height:28px; min-height:28px; padding:0; background:transparent; }\n#sg-copypaster-panel.ah-scope .cp-icon-btn-primary { background:var(--ah-stripe); color:var(--ah-on-stripe); }\n#sg-copypaster-panel.ah-scope .cp-section-title { font-size:12px; font-weight:600; letter-spacing:0; text-transform:none; color:var(--ah-text-soft); }\n#sg-copypaster-panel.ah-scope .cp-list { border:0; }\n#vc-gradebridge-panel.ah-scope .vc-gradebridge-link { background:transparent; font-size:12px; min-height:28px; }\n#vc-gradebridge-panel.ah-scope .vc-gradebridge-section-label { font-size:12px; text-transform:none; letter-spacing:0; color:var(--ah-muted); }\n#vc-gradebridge-panel.ah-scope .vc-gradebridge-assignment-card-target :is(.vc-gradebridge-assignment-tag, .vc-gradebridge-assignment-name) { color:var(--ah-on-stripe); }\n#sg-benchmarker-panel.ah-scope .sg-bucket-pill { background:var(--ah-fill); border:0; color:var(--ah-text-soft); }\n#sg-benchmarker-panel.ah-scope .sg-count-chip { border-left:0; }\n#sg-benchmarker-panel.ah-scope .sg-section-toggle-icon {\n  display:block; width:10px; height:10px; flex:0 0 10px; margin-left:auto;\n  background:var(--ah-muted); clip-path:polygon(20% 0,100% 50%,20% 100%); transform:rotate(0deg);\n}\n#sg-benchmarker-panel.ah-scope .sg-section-toggle[aria-expanded=\"true\"] .sg-section-toggle-icon { transform:rotate(90deg); }\n#ah-tutorial-sorter-panel.ah-scope .ah-tutorial-sorter-nav-block { padding:0; background:none; border:0; }\n#ah-tutorial-sorter-panel.ah-scope details.ah-details--divider,\n#sg-copypaster-panel.ah-scope .cp-import-export,\n#sg-benchmarker-panel.ah-scope .sg-details { background:none; border-radius:0; border-top:1px solid var(--ah-line); padding:9px 0 0; }\n#vc-gradebridge-panel.ah-scope .vc-gradebridge-assignment-card { display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-start; gap:4px; padding:9px 12px; text-align:left; }\n#vc-gradebridge-panel.ah-scope .vc-gradebridge-assignment-tag { background:none; padding:0; font-size:11px; font-weight:500; white-space:normal; overflow:visible; }\n#vc-gradebridge-panel.ah-scope .vc-gradebridge-assignment-name { font-size:13px; font-weight:600; white-space:normal; overflow:visible; overflow-wrap:anywhere; }\n:is(#ah-eta-panel, #ah-tutorial-sorter-panel, #sg-benchmarker-panel, #sg-copypaster-panel, #vc-gradebridge-panel).ah-scope button:focus-visible { outline:2px solid var(--ah-stripe); outline-offset:2px; }\n\n/* A dark stage keeps the white Prince sprite visible in either theme. */\n#ah-eta-panel.ah-scope .ah-eta-prince-disclosure { padding:4px 8px; margin:6px 0; }\n#ah-eta-panel.ah-scope .ah-eta-prince-stage {\n  --ah-prince-track:var(--ah-graphite-750);\n  background:var(--ah-graphite-800); border-radius:10px; margin-top:6px; overflow:hidden;\n}\n#ah-eta-panel.ah-scope .ah-eta-summary { margin-top:8px; }\n#ah-eta-panel.ah-scope .ah-eta-summary > .ah-eta-muted:first-child { margin-bottom:6px; }\n#ah-eta-panel.ah-scope .ah-eta-summary-row { padding:6px 0; font-size:11px; border-bottom:1px solid var(--ah-line); }\n#ah-eta-panel.ah-scope .ah-eta-review-list { max-height:220px; overflow:auto; }\n#ah-eta-panel.ah-scope .ah-eta-review-row { display:flex; gap:8px; align-items:flex-start; padding:6px 0; }\n#ah-eta-panel.ah-scope .ah-eta-review-row input { width:16px; height:16px; margin:2px 0; accent-color:var(--ah-stripe); flex:0 0 16px; }\n#ah-eta-panel.ah-scope .ah-eta-review-row small { display:block; color:var(--ah-muted); font-size:10px; }\n#ah-eta-panel.ah-scope .ah-eta-gap-setting { display:flex; gap:6px; align-items:center; margin:8px 0; font-size:11px; }\n#ah-eta-panel.ah-scope .ah-eta-gap-setting select { padding:4px; font-size:11px; width:auto; }\n#ah-eta-panel.ah-scope :is(.ah-eta-block-list, .ah-eta-review, .ah-eta-raw-timeline) { margin-top:8px; padding:6px 0; background:none; border-radius:0; border-top:1px solid var(--ah-line); }\n#ah-eta-panel.ah-scope .ah-eta-review-row input { padding:0; border:0; }\n#ah-eta-panel.ah-scope .ah-eta-review-row span { min-width:0; overflow-wrap:anywhere; }\n#ah-eta-panel.ah-scope .ah-eta-gap-setting { flex-wrap:wrap; }\n/* Expanded logs remain accessible without pushing controls below the screen. */\n#ah-eta-panel.ah-scope .ah-eta-body { max-height:calc(100vh - 70px); overflow-y:auto; scrollbar-width:thin; }\n#ah-eta-panel.ah-scope .ah-eta-expected-setting { display:grid; gap:4px; margin:8px 0; }\n#ah-eta-panel.ah-scope .ah-eta-expected-setting select { width:100%; }\n";
  const DEFAULTS = { theme: 'soft', density: 'roomy' };
  const listeners = window.AssessmentHelpersTheme?._subscribers || new Set();
  let current = { ...DEFAULTS };

  function normalise(value) {
    return {
      theme: value?.theme === 'dark' ? 'dark' : 'soft',
      density: value?.density === 'compact' ? 'compact' : 'roomy'
    };
  }

  function read() {
    try {
      return normalise(JSON.parse(localStorage.getItem(KEY)) || DEFAULTS);
    } catch {
      return { ...current };
    }
  }

  function apply(value) {
    current = normalise(value);
    document.documentElement.dataset.ahTheme = current.theme;
    document.documentElement.dataset.ahDensity = current.density;
    for (const listener of listeners) {
      try { listener({ ...current }); } catch (error) { console.error(error); }
    }
    // A wider density must not leave a previously dragged header off-screen.
    requestAnimationFrame(() => {
      for (const panel of document.querySelectorAll('.ah-panel')) {
        if (getComputedStyle(panel).position !== 'fixed' || !panel.getClientRects().length) continue;
        const rect = panel.getBoundingClientRect();
        const left = Math.min(Math.max(10, rect.left), Math.max(10, innerWidth - rect.width - 10));
        const top = Math.min(Math.max(10, rect.top), Math.max(10, innerHeight - rect.height - 10));
        if (left !== rect.left) { panel.style.left = `${left}px`; panel.style.right = 'auto'; }
        if (top !== rect.top) { panel.style.top = `${top}px`; panel.style.bottom = 'auto'; }
      }
    });
  }

  function compareVersions(a, b) {
    const left = a.split('.').map(Number), right = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      const difference = (left[i] || 0) - (right[i] || 0);
      if (difference) return difference;
    }
    return 0;
  }

  function inject() {
    const existing = document.getElementById(STYLE_ID);
    if (existing && compareVersions(existing.dataset.version || '0.0.0', VERSION) >= 0) return;
    const style = existing || document.createElement('style');
    style.id = STYLE_ID;
    style.dataset.version = VERSION;
    style.textContent = CSS;
    if (!existing) (document.head || document.documentElement).appendChild(style);
  }

  // Separate from the helper registry: loading the theme must not create or replace it.
  // DOM events and origin-local storage also work across userscript execution contexts.
  inject();
  const installed = window.AssessmentHelpersTheme;
  if (installed && compareVersions(installed.version, VERSION) >= 0) return;
  installed?.dispose?.(true);
  function onStorage(event) {
    if (event.key === KEY || event.key === null) apply(read());
  }
  function onChangeEvent(event) {
    try { apply(JSON.parse(event.detail)); } catch {}
  }
  window.addEventListener('storage', onStorage);
  window.addEventListener(CHANGE_EVENT, onChangeEvent);
  window.AssessmentHelpersTheme = {
    version: VERSION,
    _subscribers: listeners,
    get() { return { ...current }; },
    set(patch) {
      const value = normalise({ ...current, ...patch });
      try { localStorage.setItem(KEY, JSON.stringify(value)); } catch {}
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: JSON.stringify(value) }));
      return { ...value };
    },
    onChange(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    isCompact() { return current.density === 'compact'; },
    dispose(preserveSubscribers = false) {
      if (!preserveSubscribers) listeners.clear();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(CHANGE_EVENT, onChangeEvent);
    }
  };
  apply(read());
})();
// END GENERATED AH THEME

(function () {
  'use strict';

  // Imports class lists and provides tutorial-group navigation in SpeedGrader.

  // constants/config
  const HELPER_ID = 'tutorial-sorter';
  const HELPER_NAME = 'Tutorial Sorter';
  const PANEL_ID = 'ah-tutorial-sorter-panel';
  const STYLE_ID = 'ah-tutorial-sorter-style';
  const Z_INDEX_BASE = 100000;

  const GROUPS_KEY = 'assessmentHelpers:tutorialSorter:v1:groups';
  const ACTIVE_GROUP_KEY = 'assessmentHelpers:tutorialSorter:v1:activeGroup';
  const PANEL_POS_KEY = 'assessmentHelpers:tutorialSorter:v1:panelPosition';
  const PANEL_UI_KEY = 'assessmentHelpers:tutorialSorter:v1:panelUi';
  const CONTEXT_KEY = 'assessmentHelpers:tutorialSorter:v1:context';
  const CANVAS_MENU_KEY = 'assessmentHelpers:tutorialSorter:v1:canvasMenuCache';
  const EXPORT_NAME_MODE_KEY = 'assessmentHelpers:tutorialSorter:v1:exportNameMode';

  const DEFAULT_PANEL_POS = { top: 80, right: 18 };
  const PANEL_MARGIN = 8;

const selectors = {
  panel: `#${PANEL_ID}`,
  selectedStudent: '[data-testid="selected-student"]',

  studentSelectTrigger: [
    '[data-testid="student-select-trigger"]',
    'button[aria-haspopup="listbox"]',
    'button[aria-haspopup="menu"]',
    '[role="button"][aria-haspopup="listbox"]',
    '[role="button"][aria-haspopup="menu"]',
    '[role="combobox"]'
  ].join(','),

  studentMenuItem: [
    'span[data-testid^="student-option-"][role="menuitem"]',
    '[data-testid^="student-option-"]',
    '[id^="student-option-"]',
    '[role="menuitem"][aria-labelledby]',
    '[role="option"][aria-labelledby]',
    '[role="menuitem"]',
    '[role="option"]',
    '[role="listbox"] [role="option"]',
    '[role="menu"] [role="menuitem"]'
  ].join(',')
};

  // state
  const state = {
    lastRenderSig: '',
    etaAvailable: false,
    etaPaused: false,
    tick: null,
    drag: null,
    isDropActive: false,
    lastImportSummary: ''
  };

  // elements
  const elements = {};

  // utilities
  function getElement(sel, root = document) {
    return root.querySelector(sel);
  }

  function bringPanelToFront(panel) {
    if (!panel) return;
    const current = Number(window.__canvasAssessmentPanelZIndex || Z_INDEX_BASE);
    const next = current + 1;
    window.__canvasAssessmentPanelZIndex = next;
    panel.style.zIndex = String(next);
  }

  function getElements(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function getCurrentCourseCode() {
    const textCandidates = [
      document.title,
      getElement('h1')?.textContent || '',
      getElement('[aria-label*="breadcrumb"]')?.textContent || '',
      getElement('#breadcrumbs')?.textContent || '',
      getElement('[data-testid*="course"]')?.textContent || '',
      document.body?.innerText?.slice(0, 12000) || ''
    ];

    for (const text of textCandidates) {
      const match = String(text || '').match(/\b([A-Z]{4}\d{4})\b/);
      if (match) return match[1];
    }

    return 'unknown_course';
  }

  function normalizeCourseCode(value) {
    const match = String(value || '').toUpperCase().match(/\b([A-Z]{4}\d{4})\b/);
    return match ? match[1] : getCurrentCourseCode();
  }

  function loadStoredTutorialSorterData() {
    try {
      const raw = JSON.parse(window.AssessmentHelpersCompatibility.read(GROUPS_KEY));
      if (raw?.courses && typeof raw.courses === 'object') return raw;
      if (Array.isArray(raw)) return migrateLegacyGroups(raw);
    } catch {
      return { courses: {} };
    }
    return { courses: {} };
  }

  function saveStoredTutorialSorterData(data) {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(data && data.courses ? data : { courses: {} }));
    notifyDockStatusChanged();
  }

  function notifyDockStatusChanged() {
    const detail = { helperId: HELPER_ID };
    window.dispatchEvent(new CustomEvent('assessment-helper-status-changed', { detail }));
    window.dispatchEvent(new CustomEvent('viscomm-helper-status-changed', { detail }));
  }

  function migrateLegacyGroups(groups) {
    const data = { courses: {} };
    groups.forEach(group => {
      const metadata = group.metadata || {};
      const courseCode = normalizeCourseCode(metadata.courseCode || metadata.course_code || metadata.course_code_blob || '');
      const bucket = ensureCourseBucket(data, courseCode);
      const parsedHeader = normalizeClassMetadata(metadata);
      const classKey = group.classKey || buildClassKey(parsedHeader) || group.id;
      bucket.classes[classKey] = {
        ...group,
        id: classKey,
        classKey,
        label: group.label || buildClassLabel(parsedHeader) || group.name,
        name: group.name || group.label || buildClassLabel(parsedHeader),
        courseCode,
        day: parsedHeader.day || '',
        time: parsedHeader.time || '',
        location: parsedHeader.location || '',
        importedAt: group.importedAt || group.created_at || currentTimestamp(),
        rawHeader: group.rawHeader || metadata.rawHeader || '',
        modeCode: parsedHeader.modeCode || metadata.tutorial_code || '',
        metadata: {
          ...metadata,
          courseCode,
          classKey,
          label: group.label || buildClassLabel(parsedHeader) || group.name,
          modeCode: parsedHeader.modeCode || metadata.tutorial_code || ''
        }
      };
      if (!bucket.activeClassKey) bucket.activeClassKey = classKey;
    });
    return data;
  }

  function ensureCourseBucket(data, courseCode) {
    const key = normalizeCourseCode(courseCode);
    if (!data.courses) data.courses = {};
    if (!data.courses[key]) data.courses[key] = { activeClassKey: '', classes: {} };
    if (!data.courses[key].classes) data.courses[key].classes = {};
    return data.courses[key];
  }

  function getCourseClasses(courseCode = getCurrentCourseCode()) {
    const data = loadStoredTutorialSorterData();
    const bucket = data.courses?.[normalizeCourseCode(courseCode)];
    return Object.values(bucket?.classes || {}).sort((a, b) => {
      return String(a.label || a.name || '').localeCompare(String(b.label || b.name || ''));
    });
  }

  function getAllCourseClasses() {
    const data = loadStoredTutorialSorterData();
    return Object.values(data.courses || {})
      .flatMap(bucket => Object.values(bucket?.classes || {}))
      .sort((a, b) => String(a.label || a.name || '').localeCompare(String(b.label || b.name || '')));
  }

  function loadGroups(courseCode = getCurrentCourseCode()) {
    const groups = getCourseClasses(courseCode);
    return groups.length ? groups : getAllCourseClasses();
  }

  function saveGroups(groups, courseCode = getCurrentCourseCode()) {
    const data = loadStoredTutorialSorterData();
    const bucket = ensureCourseBucket(data, courseCode);
    bucket.classes = {};
    groups.forEach(group => {
      const classKey = group.classKey || group.id;
      bucket.classes[classKey] = { ...group, id: classKey, classKey };
    });
    saveStoredTutorialSorterData(data);
  }

  function getActiveGroupId(courseCode = getCurrentCourseCode()) {
    const data = loadStoredTutorialSorterData();
    const bucket = data.courses?.[normalizeCourseCode(courseCode)];
    return bucket?.activeClassKey || window.AssessmentHelpersCompatibility.read(ACTIVE_GROUP_KEY) || '';
  }

  function updateActiveGroupId(id, courseCode = getCurrentCourseCode()) {
    const data = loadStoredTutorialSorterData();
    const bucket = ensureCourseBucket(data, courseCode);
    bucket.activeClassKey = id || '';
    saveStoredTutorialSorterData(data);
    if (id) localStorage.setItem(ACTIVE_GROUP_KEY, id);
    else window.AssessmentHelpersCompatibility.remove(ACTIVE_GROUP_KEY);
  }

  function clearSavedData() {
    window.AssessmentHelpersCompatibility.remove(GROUPS_KEY);
    window.AssessmentHelpersCompatibility.remove(ACTIVE_GROUP_KEY);
    window.AssessmentHelpersCompatibility.remove(PANEL_POS_KEY);
    window.AssessmentHelpersCompatibility.remove(PANEL_UI_KEY);
    window.AssessmentHelpersCompatibility.remove(CONTEXT_KEY);
    notifyDockStatusChanged();
  }

  function getPanelPosition() {
    try {
      const pos = JSON.parse(window.AssessmentHelpersCompatibility.read(PANEL_POS_KEY));
      if (pos && Number.isFinite(pos.left) && Number.isFinite(pos.top)) return pos;
    } catch {}
    return { ...DEFAULT_PANEL_POS };
  }

  function savePanelPosition(left, top) {
    localStorage.setItem(PANEL_POS_KEY, JSON.stringify({ left, top }));
  }

  function loadPanelUi() {
    try {
      return JSON.parse(window.AssessmentHelpersCompatibility.read(PANEL_UI_KEY)) || { minimized: false };
    } catch {
      return { minimized: false };
    }
  }

  function savePanelUi(ui) {
    localStorage.setItem(PANEL_UI_KEY, JSON.stringify(ui));
  }

  function getMinimized() {
    return !!loadPanelUi().minimized;
  }

  function updateMinimized(minimized) {
    const ui = loadPanelUi();
    ui.minimized = !!minimized;
    savePanelUi(ui);
  }

  function getCourseKey() {
    const m = location.pathname.match(/\/courses\/(\d+)\//);
    return m ? m[1] : 'unknown_course';
  }

  function getCanvasMenuStorageKey() {
    return `${CANVAS_MENU_KEY}:${getCourseKey()}`;
  }

  function loadCanvasMenuCache() {
    try {
      return JSON.parse(window.AssessmentHelpersCompatibility.read(getCanvasMenuStorageKey())) || {};
    } catch {
      return {};
    }
  }

  function saveCanvasMenuCache(map) {
    localStorage.setItem(getCanvasMenuStorageKey(), JSON.stringify(map));
  }

  function clearCanvasMenuCache() {
    window.AssessmentHelpersCompatibility.remove(getCanvasMenuStorageKey());
  }

  function getExportNameMode() {
    return window.AssessmentHelpersCompatibility.read(EXPORT_NAME_MODE_KEY) || 'class_label';
  }

  function saveExportNameMode(mode) {
    localStorage.setItem(EXPORT_NAME_MODE_KEY, mode || 'class_label');
  }

function stat(label, value) {
  return `
    <div class="ah-tutorial-sorter-stat">
      <div class="ah-tutorial-sorter-muted" style="margin-bottom:3px;">${escapeHtml(label)}</div>
      <div class="ah-tutorial-sorter-stat-value">${escapeHtml(String(value))}</div>
    </div>
  `;
}

function fieldLabel(text) {
  return `<label class="ah-tutorial-sorter-field-label">${escapeHtml(text)}</label>`;
}

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizeName(str) {
    let s = String(str || '').trim();

    if (s.includes(',')) {
      const parts = s.split(',').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        s = parts.slice(1).join(' ') + ' ' + parts[0];
      }
    }

    return s
      .toLowerCase()
      .replace(/\([^)]*\)/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function toCanvasName(displayName) {
    const name = String(displayName || '').trim();
    if (!name) return '';

    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length < 2) return name;

    const last = parts[parts.length - 1];
    const firsts = parts.slice(0, -1).join(' ');
    return `${last}, ${firsts}`;
  }

  function normalizeStudentId(value) {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return '';
    return raw.replace(/^c/, '').replace(/\s+/g, '');
  }

  function canonicalStudentId(value) {
    const core = normalizeStudentId(value);
    return core ? `c${core}` : '';
  }

  function currentTimestamp() {
    return new Date().toISOString();
  }

  function uniqueBy(arr, keyFn) {
    const seen = new Set();
    return arr.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function stopFileDragDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function clampPanelToViewport(panel) {
    const rect = panel.getBoundingClientRect();
    const maxLeft = Math.max(PANEL_MARGIN, window.innerWidth - rect.width - PANEL_MARGIN);
    const maxTop = Math.max(PANEL_MARGIN, window.innerHeight - rect.height - PANEL_MARGIN);

    const left = clamp(rect.left, PANEL_MARGIN, maxLeft);
    const top = clamp(rect.top, PANEL_MARGIN, maxTop);

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.right = 'auto';

    savePanelPosition(left, top);
  }

  function csvEscape(value) {
    const s = String(value ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function downloadTextFile(filename, text, mime = 'text/plain;charset=utf-8') {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function parseDelimited(text, delimiter = ',') {
    const rows = [];
    let row = [];
    let cell = '';
    let i = 0;
    let inQuotes = false;

    while (i < text.length) {
      const ch = text[i];
      const next = text[i + 1];

      if (ch === '"') {
        if (inQuotes && next === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = !inQuotes;
        i++;
        continue;
      }

      if (ch === delimiter && !inQuotes) {
        row.push(cell);
        cell = '';
        i++;
        continue;
      }

      if ((ch === '\n' || ch === '\r') && !inQuotes) {
        if (ch === '\r' && next === '\n') i++;
        row.push(cell);
        if (row.some(v => String(v).trim() !== '')) rows.push(row);
        row = [];
        cell = '';
        i++;
        continue;
      }

      cell += ch;
      i++;
    }

    row.push(cell);
    if (row.some(v => String(v).trim() !== '')) rows.push(row);

    if (!rows.length) return { headers: [], records: [] };

    const headers = rows[0].map(h => String(h).trim());
    const records = rows.slice(1).map(r => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = String(r[idx] ?? '').trim();
      });
      return obj;
    });

    return { headers, records };
  }

  function findHeaderRow(lines) {
    return lines.findIndex(line => {
      const lower = line.toLowerCase().trim();
      return (
        lower.includes('student_code') ||
        lower.includes('student code') ||
        lower.includes('student_number') ||
        lower.includes('student number') ||
        lower.includes('user_id') ||
        lower.includes('user id') ||
        lower.includes('last_name') ||
        lower.includes('last name') ||
        lower.includes('preferred_name') ||
        lower.includes('preferred name')
      );
    });
  }

  function parseTimetablingText(text) {
    const lines = String(text || '')
      .replace(/\uFEFF/g, '')
      .split(/\r?\n/);

    const headerIndex = findHeaderRow(lines);
    if (headerIndex < 0) return { headers: [], records: [] };

    const dataLines = lines
      .slice(headerIndex)
      .map(line => line.trim())
      .filter(line => line !== '');

    if (!dataLines.length) return { headers: [], records: [] };

    const headerLine = dataLines[0];
    let delimiter = '\t';
    if (headerLine.includes(',') && !headerLine.includes('\t')) delimiter = ',';

    const parsed = parseDelimited(dataLines.join('\n'), delimiter);

    const normalizedHeaders = parsed.headers.map(h =>
      String(h).trim().toLowerCase().replace(/\s+/g, '_')
    );

    const records = parsed.records.map(row => {
      const normalizedRow = {};
      parsed.headers.forEach((originalHeader, idx) => {
        const key = normalizedHeaders[idx];
        normalizedRow[key] = String(row[originalHeader] ?? '').trim();
      });
      return normalizedRow;
    });

    return { headers: normalizedHeaders, records };
  }

  function splitFlexibleLine(line) {
    const trimmed = String(line || '').trim();
    if (!trimmed) return [];

    if (trimmed.includes('\t')) {
      return trimmed.split('\t').map(s => s.trim()).filter(Boolean);
    }

    const parsed = parseDelimited(trimmed, ',');
    if (parsed.headers.length) {
      return parsed.headers.map(s => String(s).trim()).filter(Boolean);
    }

    return [trimmed];
  }

  function parseTimetableMetadata(text) {
    const lines = String(text || '')
      .replace(/\uFEFF/g, '')
      .split(/\r?\n/)
      .map(line => line.trimEnd());

    const meta = {
      course_code_blob: '',
      course_name: '',
      tutorial_code: '',
      courseCode: '',
      courseTitle: '',
      modeCode: '',
      day: '',
      time: '',
      duration: '',
      durationMinutes: '',
      location: '',
      staff: '',
      term: '',
      year: '',
      campus: '',
      delivery: '',
      rawHeader: '',
      suggested_name: ''
    };

    const nonEmpty = lines.filter(line => line.trim());
    meta.rawHeader = nonEmpty.slice(0, Math.max(0, findHeaderRow(lines))).join('\n');

    if (nonEmpty[0]) {
      const parts = splitFlexibleLine(nonEmpty[0]);
      meta.course_code_blob = parts[0] || '';
      meta.course_name = parts[1] || '';
      meta.courseTitle = meta.course_name;

      const courseMatch = nonEmpty[0].match(/\b([A-Z]{4}\d{4})\b/);
      if (courseMatch) meta.courseCode = courseMatch[1];

      const blobParts = String(meta.course_code_blob || '').split('_').filter(Boolean);
      meta.term = blobParts.find(p => /^SEM\d+$/i.test(p)) || '';
      meta.year = blobParts.find(p => /^\d{4}$/.test(p)) || '';
      meta.delivery = blobParts[blobParts.length - 1] || '';
      meta.campus = blobParts.slice(3, -1).filter(p => p !== '-').join('_');
    }

    if (nonEmpty[1]) {
      const parts = splitFlexibleLine(nonEmpty[1]);
      meta.tutorial_code = parts[0] || '';
      meta.modeCode = meta.tutorial_code;

      const schedule = parts[1] || '';
      const schedParts = schedule.split(',').map(s => s.trim());
      meta.day = schedParts[0] || '';
      meta.time = schedParts[1] || '';
      meta.duration = schedParts[2] || '';
      const durationMatch = meta.duration.match(/(\d+)/);
      meta.durationMinutes = durationMatch ? durationMatch[1] : '';
    }

    lines.forEach(line => {
      const trimmed = line.trim();

      const courseMatch = trimmed.match(/\b([A-Z]{4}\d{4})\b/);
      if (courseMatch && !meta.courseCode) meta.courseCode = courseMatch[1];

      const classMatch = trimmed.match(/^([A-Z]{3}\d{2}-\d{2})\s+([A-Za-z]{3}),\s*([0-9]{1,2}:[0-9]{2}),\s*(\d+)\s*minutes/i);
      if (classMatch) {
        meta.tutorial_code = meta.tutorial_code || classMatch[1];
        meta.modeCode = meta.modeCode || classMatch[1];
        meta.day = meta.day || classMatch[2];
        meta.time = meta.time || classMatch[3];
        meta.durationMinutes = meta.durationMinutes || classMatch[4];
        meta.duration = meta.duration || `${classMatch[4]} minutes`;
      }

      const locMatch = trimmed.match(/^Location:\s*(.+)$/i);
      if (locMatch) meta.location = locMatch[1].trim();

      const staffMatch = trimmed.match(/^Staff:\s*(.+)$/i);
      if (staffMatch) meta.staff = staffMatch[1].trim();
    });

    meta.courseCode = normalizeCourseCode(meta.courseCode || meta.course_code_blob);

    meta.suggested_name = buildClassLabel(meta) || meta.tutorial_code || meta.course_name || 'Imported group';
    return meta;
  }

  function normalizeClassMetadata(metadata = {}) {
    const courseCode = normalizeCourseCode(metadata.courseCode || metadata.course_code || metadata.course_code_blob || '');
    return {
      ...metadata,
      courseCode,
      day: metadata.day || '',
      time: metadata.time || '',
      location: metadata.location || '',
      modeCode: metadata.modeCode || metadata.tutorial_code || '',
      rawHeader: metadata.rawHeader || ''
    };
  }

  function buildClassKey(parsedHeader = {}) {
    const courseCode = normalizeCourseCode(parsedHeader.courseCode || parsedHeader.course_code_blob || '');
    const day = String(parsedHeader.day || 'unknown_day').trim().replace(/\s+/g, '_');
    const time = String(parsedHeader.time || 'unknown_time').trim().replace(/\s+/g, '');
    const location = String(parsedHeader.location || 'unknown_location').trim().replace(/\s+/g, '_');
    return `${courseCode}__${day}__${time}__${location}`;
  }

  function buildClassLabel(parsedHeader = {}) {
    const courseCode = normalizeCourseCode(parsedHeader.courseCode || parsedHeader.course_code_blob || '');
    const dayTime = [parsedHeader.day, parsedHeader.time].filter(Boolean).join(' ');
    const location = parsedHeader.location || 'Unknown location';
    return `${courseCode} · ${dayTime || 'Unknown time'} · ${location}`;
  }

  function buildStudentsFromTimetabling(records, metadata = {}) {
    return uniqueBy(
      records
        .map((row, idx) => {
          const studentNumber =
            row.student_code ||
            row.student_number ||
            row.user_id ||
            row.userid ||
            '';

          const lastName = row.last_name || '';
          const preferredName =
            row.preferred_name ||
            row.first_name ||
            row.firstname ||
            '';

          const fullName = `${preferredName} ${lastName}`.trim();
          const userId = canonicalStudentId(
            row.user_id ||
            row.userid ||
            row.student_code ||
            row.student_number ||
            ''
          );

          return {
            index: idx,
            name: fullName,
            canvas_name: toCanvasName(fullName),
            student_number: canonicalStudentId(studentNumber),
            login_id: canonicalStudentId(studentNumber),
            user_id: userId,
            email: '',
            tutorial: metadata.tutorial_code || '',
            day: metadata.day || '',
            time: metadata.time || '',
            staff: metadata.staff || '',
            location: metadata.location || '',
            raw: row
          };
        })
        .filter(s => s.name || s.student_number || s.user_id),
      s => `${s.user_id || s.student_number}|${normalizeName(s.name)}`
    );
  }

  function makeGroup(name, students, sourceFile, metadata = {}) {
    const classMetadata = normalizeClassMetadata(metadata);
    const classKey = buildClassKey(classMetadata);
    const label = buildClassLabel(classMetadata);

    return {
      id: classKey,
      classKey,
      label,
      name: label || name,
      courseCode: classMetadata.courseCode,
      day: classMetadata.day || '',
      time: classMetadata.time || '',
      location: classMetadata.location || '',
      importedAt: currentTimestamp(),
      rawHeader: classMetadata.rawHeader || '',
      modeCode: classMetadata.modeCode || '',
      source_file: sourceFile || '',
      created_at: currentTimestamp(),
      course_key: getCourseKey(),
      metadata: {
        ...metadata,
        courseCode: classMetadata.courseCode,
        classKey,
        label,
        course_code_blob: metadata.course_code_blob || '',
        course_name: metadata.course_name || '',
        tutorial_code: metadata.tutorial_code || classMetadata.modeCode || '',
        modeCode: classMetadata.modeCode || '',
        day: classMetadata.day || '',
        time: classMetadata.time || '',
        duration: metadata.duration || '',
        durationMinutes: metadata.durationMinutes || '',
        location: classMetadata.location || '',
        staff: metadata.staff || '',
        sheet_name: metadata.sheet_name || '',
        rawHeader: classMetadata.rawHeader || ''
      },
      students
    };
  }

  function importAnyText(text, sourceName = 'Imported class list', overrideSheetName = '') {
    const cleaned = String(text || '').trim();
    if (!cleaned) return null;

    const metadata = parseTimetableMetadata(cleaned);
    if (overrideSheetName && !metadata.suggested_name) metadata.suggested_name = overrideSheetName;
    if (overrideSheetName) metadata.sheet_name = overrideSheetName;

    const parsed = parseTimetablingText(cleaned);
    let students = [];

    if (parsed.headers.length && parsed.records.length) {
      students = buildStudentsFromTimetabling(parsed.records, metadata);
    }

    if (!students.length) return null;

    const suggestedName =
      metadata.suggested_name ||
      overrideSheetName ||
      sourceName.replace(/\.[^.]+$/, '') ||
      'Imported group';

    return { suggestedName, metadata, students };
  }

  function sheetToText(worksheet) {
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      blankrows: false,
      raw: false,
      defval: ''
    });

    return rows
      .map(row => row.map(cell => String(cell ?? '')).join('\t'))
      .join('\n');
  }

  async function importWorkbookFile(file) {
    if (typeof XLSX === 'undefined') {
      throw new Error('SheetJS/XLSX library did not load.');
    }

    const ab = await file.arrayBuffer();
    const workbook = XLSX.read(ab, { type: 'array' });

    const data = loadStoredTutorialSorterData();
    const imported = [];

    workbook.SheetNames.forEach(sheetName => {
      const ws = workbook.Sheets[sheetName];
      if (!ws) return;

      const text = sheetToText(ws);
      const parsed = importAnyText(text, file.name, sheetName);

      if (!parsed || !parsed.students.length) return;

      const group = makeGroup(
        parsed.suggestedName || sheetName,
        parsed.students,
        file.name,
        { ...parsed.metadata, sheet_name: sheetName }
      );

      const bucket = ensureCourseBucket(data, group.courseCode);
      bucket.classes[group.classKey] = group;
      bucket.activeClassKey = group.classKey;
      imported.push(group);
    });

    if (!imported.length) {
      alert('No valid class tabs were found in that workbook.');
      return;
    }

    saveStoredTutorialSorterData(data);
    const currentCourseCode = getCurrentCourseCode();
    const activeImport = imported.find(group => group.courseCode === currentCourseCode) || imported[0];
    updateActiveGroupId(activeImport.id, activeImport.courseCode);

    state.lastImportSummary = `Imported ${imported.length} group${imported.length === 1 ? '' : 's'} from ${file.name}`;
    renderPanel(true);
  }

  async function importDroppedOrPickedClassFile(file) {
    if (!file) return;

    const lower = file.name.toLowerCase();

    if (lower.endsWith('.xlsx') || lower.endsWith('.xlsm') || lower.endsWith('.xls')) {
      await importWorkbookFile(file);
      return;
    }

    const text = await file.text();
    const parsed = importAnyText(text, file.name);

    if (!parsed) {
      alert('Could not find any student rows in that file.');
      return;
    }

    const group = makeGroup(parsed.suggestedName, parsed.students, file.name, parsed.metadata);
    const data = loadStoredTutorialSorterData();
    const bucket = ensureCourseBucket(data, group.courseCode);
    bucket.classes[group.classKey] = group;
    bucket.activeClassKey = group.classKey;
    saveStoredTutorialSorterData(data);
    updateActiveGroupId(group.id, group.courseCode);

    state.lastImportSummary = `Imported 1 group from ${file.name}`;
    renderPanel(true);
  }

  function getGroupExportName(group, mode = 'class_label') {
    const metadata = group.metadata || {};
    const courseCode = group.courseCode || metadata.courseCode || '';
    const day = group.day || metadata.day || '';
    const time = group.time || metadata.time || '';
    const location = group.location || metadata.location || '';
    const staff = metadata.staff || '';
    const dayTime = [day, time].filter(Boolean).join(' ');
    const separator = ' - ';

    const partsByMode = {
      class_label: [courseCode, dayTime, location],
      day_time: [dayTime],
      room: [location],
      staff: [staff],
      day_time_room: [dayTime, location],
      day_time_staff: [dayTime, staff],
      room_staff: [location, staff]
    };

    return (partsByMode[mode] || partsByMode.class_label)
      .filter(Boolean)
      .join(separator) || String(group.label || group.name || 'Imported class').replace(/\s*·\s*/g, separator);
  }

  function buildAllCanvasGroupsCsv(groups, nameMode = 'class_label') {
    const rows = [['user_id', 'group_name']];

    groups.forEach(group => {
      const groupName = getGroupExportName(group, nameMode);
      group.students.forEach(student => {
        const userId = canonicalStudentId(student.user_id || student.student_number || student.login_id || '');
        if (!userId) return;
        rows.push([userId, groupName]);
      });
    });

    return rows.map(row => row.map(csvEscape).join(',')).join('\n');
  }

  function exportAllGroupsCsv() {
    const groups = loadGroups();
    if (!groups.length) {
      alert('No groups loaded.');
      return;
    }

    const csv = buildAllCanvasGroupsCsv(groups, getExportNameMode());
    const filename = `canvas_group_list_course_${getCourseKey()}.csv`;
    downloadTextFile(filename, csv, 'text/csv;charset=utf-8');
  }

  function cleanText(s) {
    return (s || '').replace(/\s+/g, ' ').trim();
  }

  function getCurrentStudentDisplayName() {
    const selectedStudentEl = getElement(selectors.selectedStudent);
    const selectedStudentText = cleanText(selectedStudentEl?.textContent || '');
    if (selectedStudentText) return selectedStudentText;

    const triggerEl = getElement(selectors.studentSelectTrigger);
    const triggerText = cleanText(triggerEl?.textContent || '');
    if (triggerText) {
      const cleanedTrigger = triggerText.replace(/^●\s*/, '').trim();
      if (cleanedTrigger) return cleanedTrigger;
    }

    return '';
  }

function getStudentMenuItems() {
  return getElements(selectors.studentMenuItem)
    .map(el => {
      const labelId = el.getAttribute('aria-labelledby');
      const labelEl = labelId ? document.getElementById(labelId) : null;

      const labelText = cleanText(
        labelEl?.textContent ||
        el.getAttribute('aria-label') ||
        el.getAttribute('title') ||
        el.textContent ||
        ''
      );

      const idAttr = el.getAttribute('id') || '';
      const testId = el.getAttribute('data-testid') || '';

      const anonymousId = idAttr.startsWith('student-option-')
        ? idAttr.replace(/^student-option-/, '')
        : testId.startsWith('student-option-')
          ? testId.replace(/^student-option-/, '')
          : '';

      return {
        el,
        idAttr,
        testId,
        anonymous_id: anonymousId,
        name: labelText,
        normalized_name: normalizeName(labelText)
      };
    })
    .filter(item => {
      if (!item.name) return false;

      // Avoid accidentally treating the trigger/button itself as a student.
      const lower = item.name.toLowerCase();
      if (lower === 'select student') return false;
      if (lower === 'student') return false;

      return true;
    });
}

  function isStudentMenuOpen() {
    return getStudentMenuItems().length > 0;
  }

 function openStudentDrilldown() {
  if (isStudentMenuOpen()) return true;

  const trigger = getElement(selectors.studentSelectTrigger);
  if (!trigger) {
    console.warn('Tutorial Sorter: student dropdown trigger not found');
    return false;
  }

  trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  trigger.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
  trigger.click();

  return true;
}

  function closeStudentDrilldown() {
    if (!isStudentMenuOpen()) return;
    const trigger = getElement(selectors.studentSelectTrigger);
    if (trigger) trigger.click();
  }

  function waitForStudentMenu(timeoutMs = 2500) {
    return new Promise(resolve => {
      const started = Date.now();

      function check() {
        const items = getStudentMenuItems();
        if (items.length) {
          resolve(items);
          return;
        }

        if (Date.now() - started > timeoutMs) {
          resolve([]);
          return;
        }

        setTimeout(check, 100);
      }

      check();
    });
  }

  function harvestMenuCache() {
    const cache = loadCanvasMenuCache();
    const items = getStudentMenuItems();

    items.forEach(item => {
      if (!item.normalized_name) return;
      cache[item.normalized_name] = {
        name: item.name,
        anonymous_id: item.anonymous_id,
        updated_at: currentTimestamp()
      };
    });

    saveCanvasMenuCache(cache);
  }

  function clickStudentInOpenMenu(targetStudent) {
    const targetNames = [
      targetStudent?.name || '',
      targetStudent?.canvas_name || ''
    ].map(normalizeName).filter(Boolean);

    const targetCanvasName = normalizeName(targetStudent?.canvas_name || '');
    const targetPlainName = normalizeName(targetStudent?.name || '');

    const items = getStudentMenuItems();

    let match = items.find(item => targetNames.includes(item.normalized_name));

    if (!match) {
      match = items.find(item => {
        const n = item.normalized_name;
        return (
          (targetCanvasName && (n.includes(targetCanvasName) || targetCanvasName.includes(n))) ||
          (targetPlainName && (n.includes(targetPlainName) || targetPlainName.includes(n)))
        );
      });
    }

    if (!match) {
      console.warn('Tutorial Sorter: no matching student found in open menu', {
        targetStudent,
        available: items.map(i => ({ name: i.name, anonymous_id: i.anonymous_id }))
      });
      return false;
    }

    match.el.click();
    return true;
  }

  async function openAndSelectStudentFromMenu(targetStudent) {
    if (!openStudentDrilldown()) return false;

    const items = await waitForStudentMenu();
    if (!items.length) {
      console.warn('Tutorial Sorter: student menu never appeared');
      return false;
    }

    harvestMenuCache();

    const clicked = clickStudentInOpenMenu(targetStudent);
    if (clicked) return true;

    closeStudentDrilldown();
    return false;
  }

  async function goToStudentByGroupMatch(match) {
    if (!match?.student) return false;

    const student = match.student;

    const currentName = normalizeName(getCurrentStudentDisplayName());
    const targetNames = [
      normalizeName(student.name || ''),
      normalizeName(student.canvas_name || '')
    ].filter(Boolean);

    if (currentName && targetNames.includes(currentName)) {
      return true;
    }

    const clicked = await openAndSelectStudentFromMenu(student);
    if (!clicked) {
      console.warn('Tutorial Sorter: skipping student not found in Canvas menu', {
        name: student.name,
        canvas_name: student.canvas_name
      });
      return false;
    }

    return true;
  }

  async function goToGroupStudentAtIndex(activeGroup, index, direction = 1) {
    if (!activeGroup) return false;
    if (!Number.isInteger(index)) return false;
    if (!activeGroup.students.length) return false;

    const step = direction < 0 ? -1 : 1;
    const startIndex = Math.min(activeGroup.students.length - 1, Math.max(0, index));

    for (
      let candidateIndex = startIndex;
      candidateIndex >= 0 && candidateIndex < activeGroup.students.length;
      candidateIndex += step
    ) {
      const student = activeGroup.students[candidateIndex];
      if (!student) continue;

      const found = await goToStudentByGroupMatch({ student });
      if (found) return true;
    }

    console.warn('Tutorial Sorter: no available Canvas students found in navigation direction', {
      group: activeGroup.label || activeGroup.name,
      startIndex,
      direction: step
    });
    return false;
  }

  function getActiveGroupNavigationContext() {
    const currentCourseCode = getCurrentCourseCode();
    const groups = loadGroups(currentCourseCode);
    const activeGroupId = getActiveGroupId(currentCourseCode);
    const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0] || null;
    const matchInfo = matchGroupToCurrentCanvas(activeGroup);
    const currentStudentName = getCurrentStudentDisplayName();
    const normalizedCurrent = normalizeName(currentStudentName);
    const currentIndexInGroup = activeGroup && currentStudentName
      ? matchInfo.matches.findIndex(m => (
        normalizeName(m.student.name) === normalizedCurrent ||
        normalizeName(m.student.canvas_name || '') === normalizedCurrent
      ))
      : -1;

    return { activeGroup, currentIndexInGroup };
  }

  function getTutorialSorterDockStatus() {
    const { activeGroup } = getActiveGroupNavigationContext();
    return {
      configured: !!activeGroup?.students?.length,
      label: activeGroup?.label || activeGroup?.name || ''
    };
  }

  async function goToRelativeGroupStudent(delta) {
    const { activeGroup, currentIndexInGroup } = getActiveGroupNavigationContext();
    if (!activeGroup || !activeGroup.students.length) return false;
    const direction = delta < 0 ? -1 : 1;

    if (currentIndexInGroup < 0) {
      return await goToGroupStudentAtIndex(activeGroup, 0, 1);
    }

    const nextIndex = Math.min(
      activeGroup.students.length - 1,
      Math.max(0, currentIndexInGroup + delta)
    );
    return await goToGroupStudentAtIndex(activeGroup, nextIndex, direction);
  }

  function matchGroupToCurrentCanvas(group) {
    if (!group) return { matches: [], unmatched: [] };

    const currentStudentName = getCurrentStudentDisplayName();

    const matches = group.students.map(student => ({
      student,
      roster: {
        value: student.canvas_name || student.name,
        text: student.canvas_name || student.name
      },
      score: 100
    }));

    return {
      matches,
      unmatched: [],
      currentStudentName
    };
  }

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .ah-tutorial-sorter-panel {
      z-index: ${Z_INDEX_BASE};
      color: var(--ah-text);
      border-radius: 12px;
      font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .ah-tutorial-sorter-panel.ah-tutorial-sorter-dragging {
      opacity: 0.9;
      user-select: none;
    }

    .ah-tutorial-sorter-header--border {
      border-bottom: 1px solid var(--ah-line);
    }

    .ah-tutorial-sorter-details {
      background: var(--ah-fill);
      border: 1px solid var(--ah-line);
      border-radius: 10px;
      padding: 8px 10px;
    }

    .ah-tutorial-sorter-btn-quiet {
      background: var(--ah-fill);
      color: var(--ah-muted);
      border: 1px solid var(--ah-line);
    }

    .ah-tutorial-sorter-btn-quiet:hover {
      background: var(--ah-fill-hover);
    }

    .ah-tutorial-sorter-panel-toggle {
      width: 28px;
      height: 26px;
      padding: 0;
      display: grid;
      place-items: center;
    }

    .ah-tutorial-sorter-panel-toggle svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .ah-tutorial-sorter-btn-danger {
      background: #8b1e2d;
      color: #fff2f4;
      border: 1px solid var(--ah-line);
    }

    .ah-tutorial-sorter-btn-danger:hover {
      background: #a32437;
    }

    .ah-tutorial-sorter-muted {
      font-size: 11px;
      color: var(--ah-muted);
    }

    .ah-tutorial-sorter-field-label {
      display: block;
      font-size: 11px;
      color: var(--ah-muted);
      margin-bottom: 4px;
    }

    .ah-tutorial-sorter-select,
    .ah-tutorial-sorter-input {
      width: 100%;
      background: var(--ah-bg);
      color: var(--ah-text);
      border: 1px solid var(--ah-line);
      border-radius: 8px;
      padding: 8px;
      box-sizing: border-box;
    }

    .ah-tutorial-sorter-card {
      background: var(--ah-fill);
      border: 1px solid var(--ah-line);
      border-radius: 10px;
      padding: 10px;
    }

    .ah-tutorial-sorter-stat {
      background: var(--ah-fill);
      border: 1px solid var(--ah-line);
      border-radius: 10px;
      padding: 8px 10px;
    }

    .ah-tutorial-sorter-stat-value {
      font-weight: 700;
      font-size: 14px;
      color: var(--ah-text);
    }

    .ah-tutorial-sorter-dropzone {
      margin-bottom: 10px;
      padding: 12px;
      border-radius: 10px;
      text-align: center;
      transition: all 120ms ease;
    }

    .ah-tutorial-sorter-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .ah-tutorial-sorter-row {
      display: flex;
      gap: 8px;
    }

    .ah-tutorial-sorter-row--left {
      justify-content: flex-start;
    }

    .ah-tutorial-sorter-row--right {
      justify-content: flex-end;
    }

    .ah-tutorial-sorter-row--center {
  justify-content: center;
}

    .ah-tutorial-sorter-nav-block {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      padding: 8px;
      border-radius: 10px;
      background: var(--ah-bg);
      border: 1px solid var(--ah-line);
      margin-bottom: 10px;
    }

    .ah-tutorial-sorter-nav-block svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .ah-tutorial-sorter-stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 12px;
      margin-bottom: 12px;
    }

    .ah-tutorial-sorter-section {
      margin-bottom: 10px;
    }

    .ah-tutorial-sorter-section-lg {
      margin-bottom: 12px;
    }

    .ah-tutorial-sorter-student-list {
      margin-top: 8px;
      padding: 6px;
      max-height: 220px;
      overflow: auto;
      font-size: 12px;
      color: var(--ah-muted);
      background: var(--ah-bg);
      border: 1px solid var(--ah-line);
      border-radius: 10px;
    }

    .ah-tutorial-sorter-student-item {
      display: block;
      width: 100%;
      text-align: left;
      padding: 7px 8px;
      margin: 0 0 4px 0;
      border: 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      cursor: pointer;
      border-radius: 6px;
      background: transparent;
      color: var(--ah-muted);
      font-weight: 400;
    }

    .ah-tutorial-sorter-student-item.is-current {
      background: var(--ah-line);
      color: var(--ah-text);
      font-weight: 700;
    }

    .ah-tutorial-sorter-student-sub {
      font-size: 11px;
      color: var(--ah-muted);
      margin-top: 2px;
    }

    .ah-tutorial-sorter-student-jump:hover {
      background: var(--ah-line) !important;
    }

  `;

  document.head.appendChild(style);
}

  function ensurePanel() {
  let panel = document.getElementById(PANEL_ID);
  if (panel) {
    elements.panel = panel;
    if (panel.dataset.frontBound !== '1') {
      panel.addEventListener('mousedown', () => bringPanelToFront(panel), true);
      panel.dataset.frontBound = '1';
    }
    return panel;
  }

  panel = document.createElement('div');

  const pos = getPanelPosition();

  panel.id = PANEL_ID;
      panel.classList.add('ah-panel', 'ah-scope');
  panel.className = 'ah-tutorial-sorter-panel ah-panel ah-scope';
  panel.style.position = 'fixed';
  panel.style.top = pos.top != null ? `${pos.top}px` : '80px';

  if (pos.left != null) {
    panel.style.left = `${pos.left}px`;
    panel.style.right = 'auto';
  } else {
    panel.style.right = '18px';
    panel.style.left = '';
  }

  document.body.appendChild(panel);
  addStyles();
  bindDragging(panel);
  bindDropHandlers(panel);
  elements.panel = panel;
  bringPanelToFront(panel);
  clampPanelToViewport(panel);
  if (panel.dataset.frontBound !== '1') {
    panel.addEventListener('mousedown', () => bringPanelToFront(panel), true);
    panel.dataset.frontBound = '1';
  }
  return panel;
}

  function bindDragging(panel) {
    if (panel.dataset.dragBound === '1') return;
    panel.dataset.dragBound = '1';

    panel.addEventListener('mousedown', (e) => {
      const handle = e.target.closest('.ah-tutorial-sorter-drag');
const clickable = e.target.closest('button, select, input, option, label, summary, details, textarea, a');

if (!handle || !panel.contains(handle) || clickable) return;

      bringPanelToFront(panel);
      const rect = panel.getBoundingClientRect();
      state.drag = {
        startX: e.clientX,
        startY: e.clientY,
        panelLeft: rect.left,
        panelTop: rect.top
      };

      panel.classList.add('ah-tutorial-sorter-dragging');
      document.body.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!state.drag) return;

      const dx = e.clientX - state.drag.startX;
      const dy = e.clientY - state.drag.startY;
      const left = state.drag.panelLeft + dx;
      const top = state.drag.panelTop + dy;

      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      panel.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (!state.drag) return;
      state.drag = null;
      panel.classList.remove('ah-tutorial-sorter-dragging');
      document.body.style.cursor = '';
      clampPanelToViewport(panel);
    });

    window.addEventListener('resize', () => {
      clampPanelToViewport(panel);
    });
  }

  function panelToggleIcon(expand) {
    const path = '<path d="M6 12h12"></path>';
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${path}</svg>`;
  }

  function actionIcon(name) {
    const paths = {
      upload: '<path d="M12 16v-12"></path><path d="M7 9l5 -5l5 5"></path><path d="M20 16v4a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1v-4"></path>',
      download: '<path d="M12 4v12"></path><path d="M7 11l5 5l5 -5"></path><path d="M20 16v4a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1v-4"></path>',
      prev: '<path d="M15 6l-6 6l6 6"></path>',
      next: '<path d="M9 6l6 6l-6 6"></path>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name] || ''}</svg>`;
  }

  function bindDropHandlers(panel) {
    if (panel.dataset.dropBound === '1') return;
    panel.dataset.dropBound = '1';

    function hasFiles(e) {
      return Array.from(e.dataTransfer?.types || []).includes('Files');
    }

    function setZoneActive(active) {
      state.isDropActive = !!active;
      const zone = panel.querySelector('#ah-tutorial-sorter-dropzone');
      if (!zone) return;

      zone.style.borderColor = active
        ? 'rgba(255,255,255,0.45)'
        : 'rgba(255,255,255,0.14)';
      zone.style.background = active ? 'var(--ah-fill-hover)' : 'var(--ah-bg)';
      zone.style.color = active ? 'var(--ah-text)' : 'var(--ah-muted)';
    }

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(type => {
      panel.addEventListener(type, (e) => {
        if (!hasFiles(e)) return;
        stopFileDragDefaults(e);
      });
    });

    panel.addEventListener('dragenter', (e) => {
      if (!hasFiles(e)) return;
      setZoneActive(true);
    });

    panel.addEventListener('dragover', (e) => {
      if (!hasFiles(e)) return;
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      setZoneActive(true);
    });

    panel.addEventListener('dragleave', (e) => {
      if (!hasFiles(e)) return;
      const related = e.relatedTarget;
      if (!related || !panel.contains(related)) {
        setZoneActive(false);
      }
    });

    panel.addEventListener('drop', async (e) => {
      if (!hasFiles(e)) return;

      stopFileDragDefaults(e);
      setZoneActive(false);

      const file = e.dataTransfer?.files?.[0];
      if (!file) return;

      try {
        await importDroppedOrPickedClassFile(file);
      } catch (err) {
        console.error(err);
        alert(`Import failed: ${err.message}`);
      }

      renderPanel(true);
    });
  }

  function saveSharedContext(payload) {
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(payload));
  }

  function toggleMarkingBreak() {
    window.dispatchEvent(new CustomEvent('assessment-eta-break-toggle'));
  }

  function breakControlsHtml() {
    return `<div class="ah-tutorial-sorter-row" style="margin-top:8px;">
      <button id="ah-tutorial-sorter-break" class="ah-tutorial-sorter-btn" style="width:100%;" ${state.etaAvailable ? '' : 'disabled'}
        title="${state.etaAvailable ? 'Pause or resume marking time' : 'Install or update ETA to record breaks'}">${state.etaPaused ? 'Resume' : 'Pause'}</button>
    </div>${state.etaPaused ? '<div class="ah-tutorial-sorter-muted" style="margin-top:6px;">On break · marking timer paused</div>' : ''}`;
  }

  function renderPanel(force = false) {
    const panel = ensurePanel();
    const disclosureState = new Map(Array.from(panel.querySelectorAll('details'), detail => [detail.className, detail.open]));
    const currentCourseCode = getCurrentCourseCode();
    const groups = loadGroups(currentCourseCode);
    let activeGroupId = getActiveGroupId(currentCourseCode);
    if ((!activeGroupId || !groups.some(g => g.id === activeGroupId)) && groups.length) {
      activeGroupId = groups[0].id;
      updateActiveGroupId(activeGroupId, currentCourseCode);
    }
    const activeGroup = groups.find(g => g.id === activeGroupId) || null;
    const matchInfo = matchGroupToCurrentCanvas(activeGroup);
    const currentStudentName = getCurrentStudentDisplayName();
    const menuCache = loadCanvasMenuCache();
    const minimized = getMinimized();
    const exportNameMode = getExportNameMode();

    let currentIndexInGroup = -1;
    if (activeGroup && currentStudentName) {
      const normalizedCurrent = normalizeName(currentStudentName);
      currentIndexInGroup = matchInfo.matches.findIndex(m => {
        return (
          normalizeName(m.student.name) === normalizedCurrent ||
          normalizeName(m.student.canvas_name || '') === normalizedCurrent
        );
      });
    }

    const remainingInGroup = currentIndexInGroup >= 0
      ? Math.max(0, matchInfo.matches.length - currentIndexInGroup - 1)
      : matchInfo.matches.length;

    const currentMatch = currentIndexInGroup >= 0 ? matchInfo.matches[currentIndexInGroup] : null;

    const sig = JSON.stringify({
      groupsCount: groups.length,
      currentCourseCode,
      activeGroupId,
      currentStudentName,
      matchedCount: matchInfo.matches.length,
      currentIndexInGroup,
      drop: state.isDropActive,
      summary: state.lastImportSummary,
      cacheCount: Object.keys(menuCache).length,
      minimized,
      density: window.AssessmentHelpersTheme.get().density,
      etaAvailable: state.etaAvailable,
      etaPaused: state.etaPaused
    });

    if (!force && sig === state.lastRenderSig) return;
    state.lastRenderSig = sig;

    saveSharedContext({
      version: 11,
      updated_at: currentTimestamp(),
      course_key: getCourseKey(),
      course_code: currentCourseCode,
      active_group_id: activeGroup ? activeGroup.id : '',
      active_group_name: activeGroup ? activeGroup.name : '',
      current_student_name: currentStudentName,
      current_index_in_group: currentIndexInGroup,
      matched_count: matchInfo.matches.length,
      remaining_in_group: remainingInGroup,
      cached_menu_students: Object.keys(menuCache).length,
      metadata: activeGroup?.metadata || {}
    });

 panel.innerHTML = `
  <div class="ah-tutorial-sorter-drag ah-tutorial-sorter-header ${minimized ? '' : 'ah-tutorial-sorter-header--border'}">
    <div class="ah-tutorial-sorter-title">Tutorial Sorter</div>
    <button id="ah-tutorial-sorter-minimize" class="ah-tutorial-sorter-btn-quiet ah-tutorial-sorter-panel-toggle" title="${minimized ? 'Expand' : 'Minimise'}" aria-label="${minimized ? 'Expand Tutorial Sorter' : 'Minimise Tutorial Sorter'}">${panelToggleIcon(minimized)}</button>
  </div>

  ${minimized ? '' : `
  <div class="ah-tutorial-sorter-body">

    ${groups.length ? '' : `
      <div
        id="ah-tutorial-sorter-dropzone"
        class="ah-tutorial-sorter-dropzone"
        style="
          border:1px dashed ${state.isDropActive ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'};
          background:${state.isDropActive ? 'var(--ah-fill-hover)' : 'var(--ah-bg)'};
          color:${state.isDropActive ? 'var(--ah-text)' : 'var(--ah-muted)'};
        "
      >
        <div style="font-weight:700;">Drop class file here</div>
        <div class="ah-tutorial-sorter-muted" style="margin-top:4px;">
          Use Allocate+ roster export file
        </div>
        <div class="ah-tutorial-sorter-wrap ah-tutorial-sorter-row--center" style="margin-top:10px;">
          <button id="ah-tutorial-sorter-import" class="ah-tutorial-sorter-btn ah-tutorial-sorter-icon-btn" title="Import class file" aria-label="Import class file">${actionIcon('upload')}</button>
        </div>
        <input
          id="ah-tutorial-sorter-file"
          type="file"
          accept=".xlsx,.xls,.xlsm,.csv,.txt,text/csv,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          style="display:none;"
        >
      </div>
    `}

    <div class="ah-tutorial-sorter-section">
      ${fieldLabel('Active class')}
      <select id="ah-tutorial-sorter-select" class="ah-tutorial-sorter-select">
        <option value="">— no local class selected —</option>
        ${groups.map(g => `
          <option value="${escapeHtml(g.id)}" ${g.id === activeGroupId ? 'selected' : ''}>
            ${escapeHtml(g.label || g.name)}
          </option>
        `).join('')}
      </select>
      ${groups.length ? '' : `
        <div class="ah-tutorial-sorter-muted" style="margin-top:6px;line-height:1.4;">
          Import a class file to enable dock Prev/Next.
        </div>
      `}
    </div>

    <div class="ah-tutorial-sorter-stats-grid">
      ${stat(window.AssessmentHelpersTheme.isCompact() ? 'In class' : 'Students in class', activeGroup ? activeGroup.students.length : '—')}
      ${stat('Position', activeGroup && currentIndexInGroup >= 0 ? `${currentIndexInGroup + 1}/${matchInfo.matches.length}` : '—')}
    </div>

    <div class="ah-tutorial-sorter-card ah-tutorial-sorter-section-lg">
      <div class="ah-tutorial-sorter-muted" style="margin-bottom:4px;">Current student</div>
      <div style="font-weight:700;color:var(--ah-text);margin-bottom:4px;">
        ${activeGroup
          ? currentMatch
            ? `${escapeHtml(currentMatch.student.name || currentStudentName)}`
            : 'Not in active class'
          : 'No active class selected'}
      </div>
      ${activeGroup?.metadata ? `
        <div class="ah-tutorial-sorter-muted" style="line-height:1.4;">
          ${escapeHtml([
            [activeGroup.metadata.day, activeGroup.metadata.time].filter(Boolean).join(' '),
            activeGroup.metadata.location
          ].filter(Boolean).join(' | ')) || '—'}
        </div>
      ` : ''}
    </div>

   <div class="ah-tutorial-sorter-nav-block">
  <button id="ah-tutorial-sorter-prev" class="ah-tutorial-sorter-btn">${actionIcon('prev')}<span>Prev</span></button>
  <button id="ah-tutorial-sorter-next" class="ah-tutorial-sorter-btn"><span>Next</span>${actionIcon('next')}</button>
</div>
    ${breakControlsHtml()}

    ${activeGroup ? `
      <details class="ah-tutorial-sorter-details ah-tutorial-sorter-section-lg">
        <summary>Student list</summary>
        <div class="ah-tutorial-sorter-student-list">
          ${activeGroup.students.map((s, idx) => {
            return `
              <button
                type="button"
                class="ah-tutorial-sorter-student-jump ah-tutorial-sorter-student-item ${idx === currentIndexInGroup ? 'is-current' : ''}"
                data-student-index="${idx}"
                title="Jump to this student in SpeedGrader"
              >
                <div>${escapeHtml(s.name)}</div>
              </button>
            `;
          }).join('')}
        </div>
      </details>
    ` : ''}

    <details class="ah-tutorial-sorter-details ah-details--divider" style="margin-top:14px;">
      <summary>Import / export</summary>

      ${groups.length ? `
        <div
          id="ah-tutorial-sorter-dropzone"
          class="ah-tutorial-sorter-dropzone"
          style="
            border:1px dashed ${state.isDropActive ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'};
            background:${state.isDropActive ? 'var(--ah-fill-hover)' : 'var(--ah-bg)'};
            color:${state.isDropActive ? 'var(--ah-text)' : 'var(--ah-muted)'};
          "
        >
          <div style="font-weight:700;">Drop another class file here</div>
          <div class="ah-tutorial-sorter-muted" style="margin-top:4px;">
            Use Allocate+ roster export file
          </div>
        </div>

        <div class="ah-tutorial-sorter-wrap ah-tutorial-sorter-section-lg">
          <button id="ah-tutorial-sorter-import" class="ah-tutorial-sorter-btn ah-tutorial-sorter-icon-btn" title="Import class file" aria-label="Import class file">${actionIcon('upload')}</button>
          <input
            id="ah-tutorial-sorter-file"
            type="file"
            accept=".xlsx,.xls,.xlsm,.csv,.txt,text/csv,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            style="display:none;"
          >
        </div>
      ` : ''}

      ${state.lastImportSummary ? `
        <div class="ah-tutorial-sorter-summary ah-tutorial-sorter-muted">
          ${escapeHtml(state.lastImportSummary)}
        </div>
      ` : ''}

      <div class="ah-tutorial-sorter-section-lg" style="margin-top:14px;">
        ${fieldLabel('Create a file to import groups into Canvas')}
        <div class="ah-tutorial-sorter-muted" style="margin-bottom:6px;">
          Choose a name for your Canvas groups
        </div>

        <div class="ah-tutorial-sorter-row ah-tutorial-sorter-row--left">
          <select id="ah-tutorial-sorter-export-name-mode" class="ah-tutorial-sorter-select">
            <option value="class_label" ${exportNameMode === 'class_label' ? 'selected' : ''}>Course - day/time - room</option>
            <option value="day_time" ${exportNameMode === 'day_time' ? 'selected' : ''}>Day/time only</option>
            <option value="room" ${exportNameMode === 'room' ? 'selected' : ''}>Room only</option>
            <option value="staff" ${exportNameMode === 'staff' ? 'selected' : ''}>Staff only</option>
            <option value="day_time_room" ${exportNameMode === 'day_time_room' ? 'selected' : ''}>Day/time - room</option>
            <option value="day_time_staff" ${exportNameMode === 'day_time_staff' ? 'selected' : ''}>Day/time - staff</option>
            <option value="room_staff" ${exportNameMode === 'room_staff' ? 'selected' : ''}>Room - staff</option>
          </select>
          <button id="ah-tutorial-sorter-export-csv" class="ah-tutorial-sorter-btn ah-tutorial-sorter-icon-btn" title="Export Canvas CSV" aria-label="Export Canvas CSV">${actionIcon('download')}</button>
        </div>
      </div>

      <div class="ah-tutorial-sorter-row ah-tutorial-sorter-row--right" style="margin-top:8px;">
        <button id="ah-tutorial-sorter-reset" class="ah-tutorial-sorter-btn-danger">Reset</button>
      </div>
    </details>

  </div>
  `}
`;

    panel.querySelectorAll('details').forEach(detail => {
      if (disclosureState.has(detail.className)) detail.open = disclosureState.get(detail.className);
    });

    panel.querySelector('#ah-tutorial-sorter-break')?.addEventListener('click', toggleMarkingBreak);

    panel.querySelector('#ah-tutorial-sorter-minimize')?.addEventListener('click', () => {
      updateMinimized(!minimized);
      renderPanel(true);
    });

if (minimized) {
  panel.querySelector('#ah-tutorial-sorter-prev')?.addEventListener('click', async () => {
    await goToRelativeGroupStudent(-1);
  });

  panel.querySelector('#ah-tutorial-sorter-next')?.addEventListener('click', async () => {
    await goToRelativeGroupStudent(1);
  });

  return;
}

    panel.querySelector('#ah-tutorial-sorter-select')?.addEventListener('change', (e) => {
      updateActiveGroupId(e.target.value, currentCourseCode);
      renderPanel(true);
    });

    panel.querySelector('#ah-tutorial-sorter-import')?.addEventListener('click', () => {
      panel.querySelector('#ah-tutorial-sorter-file')?.click();
    });

    panel.querySelector('#ah-tutorial-sorter-file')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          await importDroppedOrPickedClassFile(file);
        } catch (err) {
          console.error(err);
          alert(`Import failed: ${err.message}`);
        }
      }
      e.target.value = '';
      renderPanel(true);
    });

    panel.querySelector('#ah-tutorial-sorter-export-csv')?.addEventListener('click', () => {
      exportAllGroupsCsv();
    });

    panel.querySelector('#ah-tutorial-sorter-export-name-mode')?.addEventListener('change', (e) => {
      saveExportNameMode(e.target.value);
      renderPanel(true);
    });

    panel.querySelector('#ah-tutorial-sorter-reset')?.addEventListener('click', () => {
      const ok = confirm('Reset Tutorial Sorter? This will clear all saved groups, cache, and panel settings.');
      if (!ok) return;

      clearSavedData();
      clearCanvasMenuCache();
      state.lastImportSummary = 'Reset Tutorial Sorter';
      renderPanel(true);
    });

    panel.querySelector('#ah-tutorial-sorter-prev')?.addEventListener('click', async () => {
      await goToRelativeGroupStudent(-1);
    });

    panel.querySelector('#ah-tutorial-sorter-next')?.addEventListener('click', async () => {
      await goToRelativeGroupStudent(1);
    });

    panel.querySelectorAll('.ah-tutorial-sorter-student-jump').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!activeGroup) return;
        const index = Number(btn.dataset.studentIndex);
        await goToGroupStudentAtIndex(activeGroup, index);
      });
    });
  }

  function init() {
    renderPanel(true);

    if (state.tick) clearInterval(state.tick);
    state.tick = setInterval(() => renderPanel(false), 1000);
  }

  function ensureAssessmentHelpersRegistry() {
    window.AssessmentHelpers = window.AssessmentHelpers || window.VisCommHelpers || { helpers: {} };
    window.AssessmentHelpers.helpers = window.AssessmentHelpers.helpers || {};
    window.AssessmentHelpers.register = function register(helper) {
      if (!helper?.id) return;
      this.helpers[helper.id] = helper;
      (helper.aliases || []).forEach(alias => {
        this.helpers[alias] = helper;
      });
      window.dispatchEvent(new CustomEvent('assessment-helper-registered', { detail: helper }));
      window.dispatchEvent(new CustomEvent('viscomm-helper-registered', { detail: helper }));
    };
    window.VisCommHelpers = window.AssessmentHelpers;
    return window.AssessmentHelpers;
  }

  function getRegisteredPanel() {
    return document.getElementById(PANEL_ID);
  }

  function showRegisteredPanel(render = init) {
    render?.();
    const panel = getRegisteredPanel();
    if (!panel) return;
    panel.dataset.vcHelperDockHidden = '0';
    delete panel.dataset.vcHelperDockPreviousDisplay;
    panel.style.removeProperty('display');
    if (typeof bringPanelToFront === 'function') bringPanelToFront(panel);
  }

  function hideRegisteredPanel() {
    const panel = getRegisteredPanel();
    if (!panel) return;
    panel.dataset.vcHelperDockHidden = '1';
    panel.style.display = 'none';
  }

  function isRegisteredPanelOpen() {
    const panel = getRegisteredPanel();
    if (!panel) return false;
    const style = window.getComputedStyle(panel);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  function toggleRegisteredPanel(render = init) {
    if (isRegisteredPanelOpen()) hideRegisteredPanel();
    else showRegisteredPanel(render);
  }

  function registerAssessmentHelper() {
    const registry = ensureAssessmentHelpersRegistry();

    registry.register({
      id: HELPER_ID,
      name: HELPER_NAME,
      panelId: PANEL_ID,
      panelIds: [PANEL_ID],
      show() {
        showRegisteredPanel(init);
      },
      hide: hideRegisteredPanel,
      toggle() {
        toggleRegisteredPanel(init);
      },
      isOpen: isRegisteredPanelOpen,
      dockStatus: getTutorialSorterDockStatus,
      dockActions() {
        const { activeGroup } = getActiveGroupNavigationContext();
        const disabled = !activeGroup || !activeGroup.students.length;
        return [
          {
            id: 'prev',
            label: 'Prev',
            icon: 'prev',
            disabled,
            run: () => goToRelativeGroupStudent(-1)
          },
          {
            id: 'next',
            label: 'Next',
            icon: 'next',
            disabled,
            run: () => goToRelativeGroupStudent(1)
          },
          {
            id: 'break',
            label: state.etaPaused ? 'Resume' : 'Pause',
            disabled: disabled || !state.etaAvailable,
            run: toggleMarkingBreak
          }
        ];
      }
    });
  }

  window.addEventListener('assessment-eta-status', event => {
    try {
      const status = JSON.parse(event.detail);
      state.etaAvailable = true;
      state.etaPaused = !!status.paused;
      if (document.getElementById(PANEL_ID)) renderPanel(true);
      notifyDockStatusChanged();
    } catch {}
  });
  let lastThemeDensity = window.AssessmentHelpersTheme.get().density;
  window.AssessmentHelpersTheme.onChange(settings => {
    const changed = settings.density !== lastThemeDensity;
    lastThemeDensity = settings.density;
    const panel = document.getElementById(PANEL_ID);
    if (changed && panel && panel.style.display !== 'none') renderPanel(true);
  });
  registerAssessmentHelper();
  window.dispatchEvent(new CustomEvent('assessment-eta-status-request'));
  setTimeout(init, 1800);
})();
