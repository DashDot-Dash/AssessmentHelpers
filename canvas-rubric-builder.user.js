// ==UserScript==
// @name         Assessment Helpers - Rubric Builder
// @namespace    AssessmentHelpers
// @version      1.1.17
// @description  Assessment Helpers panel for building Canvas rubric CSVs from reusable criteria
// @match        https://*/courses/*/rubrics*
// @updateURL    https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-rubric-builder.user.js
// @downloadURL  https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-rubric-builder.user.js
// @grant        none
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

  // Builds Canvas rubric CSVs from an embedded criteria library.

  // constants/config
  const HELPER_ID = 'rubric-builder';
  const HELPER_NAME = 'Rubric Builder';
  const PANEL_ID = 'jj-rubric-overlay';
  const LAUNCHER_ID = 'jj-rubric-library-btn';
  const Z_INDEX_BASE = 100000;
  const STORAGE_PREFIX = 'canvas_rubric_library_chooser_v1';
  const LEGACY_POSITION_KEYS = {
    left: 'jjRubricBtnLeft',
    top: 'jjRubricBtnTop'
  };

  const selectors = {
    launcher: `#${LAUNCHER_ID}`,
    overlay: `#${PANEL_ID}`,
    status: '#jj-status'
  };

  // =========================================================
  // 1. PASTE YOUR TSV LIBRARY HERE
  // =========================================================
  const LIBRARY_TSV = `
  category	criterion_code	display_order	criterion_name	criterion_summary	framing	max_points	label_1	anchor_1	desc_1	label_2	anchor_2	desc_2	label_3	anchor_3	desc_3	label_4	anchor_4	desc_4	label_5	anchor_5	desc_5	tags	notes	active
Practical/studio work	STUD_01	1	Visual Research	Researching the work of other designers and styles.	This looks at how well you’ve explored and engaged with visual references — including artists, designers, or styles that relate to your work. It's about learning from others and using that knowledge meaningfully.	100	Fail	50	No visual research is evident. Lacks reference to existing works or creative context.	Pass	65	Visual research is present but limited in scope or connection to the work.	Credit	75	Relevant visual references are used. Shows awareness of existing work.	Distinction	85	Well-chosen and diverse visual research supports and informs the project.	High Distinction	100	Visual research is integrated deeply. Demonstrates critical engagement and influences the direction of the work.			TRUE
Practical/studio work	STUD_02	2	Idea Generation	Exploring possibilities and creative direction	This category looks at how you develop the core idea behind your work. We’re interested in your ability to explore options, take creative risks, and define a concept or direction that feels intentional and relevant.	100	Fail	50	No clear concept is articulated. Engagement with the task appears minimal or unclear.	Pass	65	An idea is identified but remains underdeveloped or tentative.	Credit	75	A clear concept with some development of alternative ideas or approaches.	Distinction	85	A well-developed concept supported by creative thinking and intentional direction.	High Distinction	100	Inventive ideas with strong conceptual clarity, creative risk-taking, or original thinking.			TRUE
Practical/studio work	STUD_03	3	Process & Development	Working through, testing, and refining your ideas	This is about how you worked through your ideas - what you tested, rejected, revised, or built upon. Good development usually shows that you’ve been reflective and open to changing your approach as needed.	100	Fail	50	No evidence of process. Work appears incomplete or lacking consideration.	Pass	65	Some process steps are evident, but development is inconsistent or partial.	Credit	75	A sound process is evident, with signs of iteration and improvement.	Distinction	85	Thoughtful development process supporting skill growth and exploration.	High Distinction	100	Highly engaged, reflective process driving complex or evolving outcomes.			TRUE
Practical/studio work	STUD_04	4	Visual Creativity	Visual decision-making and stylistic intent	This category looks at how you’ve handled the visual side of things - layout, composition, style, colour, material, etc. We’re looking for visual intent, originality, and coherence.	100	Fail	50	Visual coherence or intent is not apparent.	Pass	65	Visual decisions are functional but lack distinctiveness or refinement.	Credit	75	Visual approach is considered and consistent. Shows some originality or style.	Distinction	85	Strong, distinctive visual execution with aesthetic awareness.	High Distinction	100	Visually compelling and imaginative. Shows confident control of visual language.			TRUE
Practical/studio work	STUD_05	5	Applied Understanding	Using what you've learned; ideas, techniques, context, to make creative decisions	This refers to how you’ve used relevant techniques, theory, context or prior learning to make informed choices. It’s about applying knowledge in a creative, integrated way and not just ticking off requirements.	100	Fail	50	No clear application of relevant knowledge, technique, or context.	Pass	65	Shows some understanding of relevant ideas or techniques, but application is uneven.	Credit	75	Applies relevant ideas, methods, or influences in appropriate ways.	Distinction	85	Applies knowledge with clarity and control. Work reflects critical or contextual awareness.	High Distinction	100	Sophisticated integration of concepts, influences, or techniques into a cohesive creative approach.			TRUE
Practical/studio work	STUD_06	6	Execution & Presentation	How well the work is made and shared	This category focuses on how well the final outcome is constructed and presented. It includes technical skill, finish, and the choices you’ve made in order  to display, format, or communicate your work.	100	Fail	50	Execution is incomplete or significantly impacts the outcome. Presentation may hinder understanding.	Pass	65	Work is complete and functional, but lacks polish or clarity in finish.	Credit	75	Competently executed with care. Presentation supports the work.	Distinction	85	Well-crafted and consistently executed. Presentation is thoughtful and appropriate.	High Distinction	100	Highly accomplished. Execution and presentation work together to elevate the impact of the work.			TRUE
Generic	GEN_01	1	Communication	Visual, verbal, or written	This looks at how clearly and effectively you express your ideas- whether visually, verbally, or in writing. It’s about making your thinking understandable and engaging.	100	Fail	50	Communication lacks clarity and may impact how the work is understood.	Pass	65	Communicates ideas simply but with occasional gaps in clarity or structure.	Credit	75	Communicates ideas clearly and appropriately for the medium.	Distinction	85	Communicates effectively and fluently. Shows awareness of audience and intent.	High Distinction	100	Highly articulate, expressive, or impactful communication that strengthens the work.			TRUE
Generic	GEN_02	2	Collaboration & Engagement	Includes participation in class, group work, studio or discussion	This refers to how you work with others- in groups or in the classroom. We’re looking for respectful, constructive, and meaningful participation.	100	Fail	50	Minimal contribution to shared work or class activity.	Pass	65	Participates when required, though contributions may be limited or inconsistent.	Credit	75	Reliable contributor to group or class activities. Works respectfully with others.	Distinction	85	Actively supports group processes and contributes positively to shared outcomes.	High Distinction	100	Takes initiative, demonstrates leadership or insight in group settings. Highly engaged.			TRUE
Generic	GEN_03	3	Project & Time Management	Organisation, planning, responsibility	This is about being organised, reliable and able to manage your time and workload across a project. 	100	Fail	50	Planning is absent or unclear. Missed deadlines or commitments affect the outcome.	Pass	65	Meets minimum expectations for planning and deadlines. Some lapses may occur.	Credit	75	Manages time and workload effectively. Fulfils commitments.	Distinction	85	Well-organised and self-directed. Project scope is realistic and well managed.	High Distinction	100	Exceptionally well organised. Project ambition is enabled by strong planning and follow-through.			TRUE
Generic	GEN_04	4	Reflection & Evaluation	Includes self-assessment, critical thinking, and problem-solving	This focuses on your ability to look back at what you did and articulate why you arrived at a particular point. 	100	Fail	50	Reflection is missing. Decisions appear unexamined or arbitrary.	Pass	65	Reflection is present but surface-level, with limited evidence of critical thinking.	Credit	75	Demonstrates considered reflection. Able to evaluate work and adjust approach.	Distinction	85	Thoughtful and consistent reflection leading to improved outcomes or insight.	High Distinction	100	Deep, critical reflection. Uses evaluation to take risks or drive meaningful progress.			TRUE
Generic	GEN_05	5	Presentation Delivery	Verbal, visual and overall delivery of live or recorded presentation	This assesses how you present your work to an audience- whether live or recorded. It includes how well your visuals support your message and how clearly you communicate your ideas.	100	Fail	50	Presentation lacks clarity or structure. Visual materials may distract from core content.	Pass	65	Presentation communicates the main points. Visuals are present but may not fully support the message.	Credit	75	Presentation is clear and structured. Visuals support key ideas.	Distinction	85	Confident delivery with clear structure and engaging visuals. Time and audience well managed.	High Distinction	100	Highly effective, polished and compelling presentation. Strong synergy between visuals, timing, and delivery.			TRUE
Written work	WRIT_01	1	Research & Context	Use of sources, theory, and contextual understanding	This category looks at how well you've researched your topic and how effectively you've used sources or context to shape your work.	100	Fail	50	Little or no relevant research. Sources are missing or unclear.	Pass	65	Research is evident, but the range or relevance of sources may be narrow.	Credit	75	Appropriate sources used. Demonstrates developing contextual understanding.	Distinction	85	Well-researched and contextualised. Sources support ideas and extend thinking.	High Distinction	100	Wide-ranging, well-chosen research. Sophisticated synthesis of context and ideas.			TRUE
Written work	WRIT_02	2	Critical Thinking	Analysis, interpretation, and originality of thought	This focuses on your ability to question, interpret, and reflect- not just describe. We're looking for thoughtful engagement with ideas, not just summary or repetition.	100	Fail	50	No clear analysis. Work is descriptive or superficial.	Pass	65	Some analysis or interpretation is present but lacks depth or development.	Credit	75	Logical and relevant analysis. Shows some independent thought.	Distinction	85	Insightful and consistent critical thinking. Ideas are well-reasoned.	High Distinction	100	Exceptional analysis and originality. Challenges assumptions or reframes ideas.			TRUE
Written work	WRIT_03	3	Argument & Structure	Organisation, clarity, logical flow	We’re assessing how clearly your ideas are organised and how well your argument builds across the work. A good structure helps the reader follow your thinking.	100	Fail	50	Argument is unclear or absent. Poor structure.	Pass	65	Argument is identifiable but may be unclear, uneven, or loosely structured.	Credit	75	Argument is clear and mostly logical. Structure supports the ideas.	Distinction	85	Well-developed argument. Structured clearly and fluently.	High Distinction	100	Strong, coherent argument with excellent structure and flow. Ideas build powerfully.			TRUE
Written work	WRIT_04	4	Communication & Referencing	Writing style, referencing, visual support if relevant	This is about clarity, tone, and proper referencing. Can you express your ideas well in writing, and support them with credible sources?	100	Fail	50	Poorly written or difficult to follow. Referencing missing or incorrect.	Pass	65	Writing is readable, though it may include unclear phrasing or referencing issues.	Credit	75	Clear writing. Referencing is appropriate and mostly correct.	Distinction	85	Confident academic voice. Referencing is accurate and well integrated.	High Distinction	100	Elegant and precise communication. Referencing is meticulous. Visuals if used enhance meaning.			TRUE
Practice Based Research	PRAX_01	1	Research Question & Intent	Clarity of enquiry, relevance of practice-based approach	This is about how clearly you’ve framed your research question and how well your practice is aligned with that enquiry. A strong project shows what you're trying to find out and why it matters.	100	Fail	50	No clear research intent. Relationship between making and enquiry is absent or confused.	Pass	65	A research question is present, though loosely defined or only partially explored.	Credit	75	A clear research intent guides the work. Practice is relevant to the enquiry.	Distinction	85	Well-articulated research intent. Creative practice is deliberately positioned as a method of investigation.	High Distinction	100	Sophisticated and original research framing. Practice and theory are deeply intertwined from the outset.			TRUE
Practice Based Research	PRAX_02	2	Integration of Theory and Practice	How theory/context informs making, and vice versa	This looks at how well you’ve connected theory, context, and your creative practice. We’re looking for interaction- not just theory stuck on top.	100	Fail	50	No visible connection between theory/context and practice.	Pass	65	Theory or context is referenced, but connections to practice are limited or unclear.	Credit	75	Theory and context are used to inform aspects of the work. Making and thinking interact.	Distinction	85	Strong integration. Theory enriches practice and vice versa. Making decisions show critical awareness.	High Distinction	100	Exceptional synthesis. Theory, context, and practice operate as a single, reflexive system of knowledge-making.			TRUE
Practice Based Research	PRAX_03	3	Process as Method	Creative development treated as research process	Here, the focus is on your creative process as a form of research. We want to see how your choices, changes, and experiments helped you explore your question.	100	Fail	50	No development shown. Process appears accidental or unexplored.	Pass	65	Process is documented but may lack rationale or continuity.	Credit	75	Process is purposeful and documented. Decisions are linked to enquiry.	Distinction	85	Development is rigorous and reflective. Process is framed as methodological.	High Distinction	100	Process is used as a primary method of research. Each stage contributes to new insight or understanding.			TRUE
Practice Based Research	PRAX_04	4	Contribution to Knowledge	What is learned, revealed, or opened through the work	What have you added to the conversation? This assesses the insight or understanding your work has generated- creatively, critically, or both.	100	Fail	50	No identifiable contribution. Outcomes are disconnected from the enquiry.	Pass	65	Some insight is present, but the overall contribution remains brief or unclear.	Credit	75	Project shows a contribution to knowledge in either form or reflection.	Distinction	85	Research outcome creative and/or written makes a clear and supported claim.	High Distinction	100	Original and compelling contribution to knowledge. Creative and critical elements work together to reveal new understanding.			TRUE
Practice Based Research	PRAX_05	5	Reflective Communication	Critical reflection, exegesis, or verbal framing	This is about how well you explain your thinking- through writing, speaking, or documentation. Good reflection helps others understand what you’ve done and why.	100	Fail	50	No reflection or awareness of project’s implications.	Pass	65	Reflection is included, though it may be brief or lack depth.	Credit	75	Reflective writing or discussion clarifies intent and contextualises choices.	Distinction	85	Reflection is articulate, critical, and enhances understanding of the work.	High Distinction	100	Insightful, reflexive, and compelling. Communication elevates the research as a whole.			TRUE
Self initiated projects	SIP_01	1	Initiative & Direction	Clarity of intent, goals, and scope-setting	This looks at how you’ve defined and scoped your own project. A good project has a clear direction and shows initiative in how it was shaped.	100	Fail	50	No clear direction. Goals absent or unrelated to task.	Pass	65	A project direction is proposed, though goals may be vague or modest.	Credit	75	Clear direction and achievable goals. Scope is realistic.	Distinction	85	Strong project vision. Direction is purposeful and self-directed.	High Distinction	100	Ambitious and well-defined project. Shows autonomy, curiosity, and original framing.			TRUE
Self initiated projects	SIP_02	2	Research & Contextual Awareness	Relevant theory, references, or influences	This category assesses how well you understand the context around your project- influences, ideas, theory or creative work that shape your decisions.	100	Fail	50	Research is missing or irrelevant. No evidence of context.	Pass	65	Some context is considered, but research may be limited in scope or depth.	Credit	75	Research is appropriate. Context is acknowledged and applied.	Distinction	85	Well-researched and integrated. Context enhances the project’s purpose.	High Distinction	100	Outstanding use of research. Contextual understanding deepens the work.			TRUE
Self initiated projects	SIP_03	3	Development & Critical Thinking	Process, analysis, synthesis, decision-making	This is about how your thinking shaped the project- what you explored, how you responded to challenges, and how your ideas developed over time.	100	Fail	50	No visible development. Project lacks rationale or critical engagement.	Pass	65	Development evident, though decisions may be unexamined or unsupported.	Credit	75	Clear development and justification of ideas. Shows analytical thinking.	Distinction	85	Thoughtful development and decision-making. Ideas evolve through critique or reflection.	High Distinction	100	Sophisticated thinking and synthesis. Complex or subtle ideas explored with clarity.			TRUE
Self initiated projects	SIP_04	4	Realisation & Creativity	Execution of the work and creative resolution	This looks at how effectively and creatively the project was brought to completion. It’s about both execution and creative strength.	100	Fail	50	Unfinished or poorly resolved. Lacks creative direction.	Pass	65	Work is complete and meets the brief, but creative resolution is minimal.	Credit	75	Competent realisation. Creative intent is visible.	Distinction	85	Well-executed and imaginative. Resolution reflects the project’s aims.	High Distinction	100	Highly resolved, creative and impactful outcome. Demonstrates originality and skill.			TRUE
`.trim();

  // =========================================================
  // 2. PARSE LIBRARY
  // =========================================================
  function parseTsv(tsv) {
    const lines = tsv.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return [];

    const headers = lines[0].split('\t');

    return lines.slice(1).map(line => {
      const cols = line.split('\t');
      const row = {};
      headers.forEach((h, i) => {
        row[h] = (cols[i] || '').trim();
      });

      row.display_order = Number(row.display_order || 0);
      row.max_points = Number(row.max_points || 100);
      row.active = String(row.active || '').toUpperCase() !== 'FALSE';

      for (let i = 1; i <= 5; i++) {
        row[`anchor_${i}`] = Number(row[`anchor_${i}`] || 0);
      }

      return row;
    }).filter(r => r.active);
  }

  function getRowsByCategory(rows) {
    const grouped = {};
    for (const row of rows) {
      const cat = row.category || 'Uncategorised';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(row);
    }

    Object.values(grouped).forEach(arr => {
      arr.sort((a, b) => a.display_order - b.display_order);
    });

    return grouped;
  }

  // =========================================================
  // 3. SCORE CALCULATION
  // Canvas seems happy when the highest score is the criterion total.
  // You confirmed working examples like:
  // 20, 17, 15, 13, 10
  // 30, 25.5, 22.5, 19.5, 15
  // =========================================================
  function roundScore(n) {
    return Math.round(n * 10) / 10;
  }

  function calculateBandScores(weight) {
    const w = Number(weight || 0);
    return {
      hd: roundScore(w),
      d: roundScore(w * 0.85),
      c: roundScore(w * 0.75),
      p: roundScore(w * 0.65),
      f: roundScore(w * 0.50),
    };
  }

  // =========================================================
  // 4. CANVAS CSV EXPORT
  // Adjust header names here if your Canvas template needs slightly
  // different repeated column labels.
  // =========================================================
  const CSV_HEADERS = [
    'Rubric Name',
    'Criteria Name',
    'Criteria Description',
    'Criteria Enable Range',
    'Rating Name',
    'Rating Description',
    'Rating Points',
    'Rating Name 2',
    'Rating Description 2',
    'Rating Points 2',
    'Rating Name 3',
    'Rating Description 3',
    'Rating Points 3',
    'Rating Name 4',
    'Rating Description 4',
    'Rating Points 4',
    'Rating Name 5',
    'Rating Description 5',
    'Rating Points 5',
  ];

  function chooseDescription(row) {
    return (row.framing || row.criterion_summary || '').trim();
  }

  function createCanvasCsvRow(row, rubricName, weight) {
    const scores = calculateBandScores(weight);

    return {
      'Rubric Name': rubricName,
      'Criteria Name': row.criterion_name || '',
      'Criteria Description': chooseDescription(row),
      'Criteria Enable Range': 'TRUE',

      'Rating Name': row.label_5 || 'High Distinction',
      'Rating Description': row.desc_5 || '',
      'Rating Points': scores.hd,

      'Rating Name 2': row.label_4 || 'Distinction',
      'Rating Description 2': row.desc_4 || '',
      'Rating Points 2': scores.d,

      'Rating Name 3': row.label_3 || 'Credit',
      'Rating Description 3': row.desc_3 || '',
      'Rating Points 3': scores.c,

      'Rating Name 4': row.label_2 || 'Pass',
      'Rating Description 4': row.desc_2 || '',
      'Rating Points 4': scores.p,

      'Rating Name 5': row.label_1 || 'Fail',
      'Rating Description 5': row.desc_1 || '',
      'Rating Points 5': scores.f,
    };
  }

  function csvEscape(value) {
    const s = String(value ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function createCsvText(rows) {
    const lines = [
      CSV_HEADERS.map(csvEscape).join(','),
      ...rows.map(row => CSV_HEADERS.map(h => csvEscape(row[h])).join(',')),
    ];
    return lines.join('\n');
  }

  function downloadTextFile(filename, text) {
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // =========================================================
  // 5. UI
  // =========================================================
  // state
  const state = {
    rows: parseTsv(LIBRARY_TSV),
    selected: new Map(), // criterion_code -> { row, weight }
  };

  // elements
  const elements = {};

  function getStorageKey(name) {
    return `${STORAGE_PREFIX}:${name}`;
  }

  function loadStoredValue(name, legacyKey = '') {
    return window.AssessmentHelpersCompatibility.read(getStorageKey(name)) || (legacyKey ? window.AssessmentHelpersCompatibility.read(legacyKey) : null);
  }

  function saveStoredValue(name, value) {
    localStorage.setItem(getStorageKey(name), value);
  }

  function bringPanelToFront(panel) {
    if (!panel) return;
    const current = Number(window.__canvasAssessmentPanelZIndex || Z_INDEX_BASE);
    const next = current + 1;
    window.__canvasAssessmentPanelZIndex = next;
    panel.style.zIndex = String(next);
  }

  function clampLauncherToViewport(el, persist = false) {
    if (!el) return;
    const margin = 8;
    const rect = el.getBoundingClientRect();
    const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
    const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);
    const left = Math.min(Math.max(margin, rect.left), maxLeft);
    const top = Math.min(Math.max(margin, rect.top), maxTop);

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;

    if (persist) {
      saveStoredValue('launcher_left', el.style.left);
      saveStoredValue('launcher_top', el.style.top);
    }
  }

function createLauncherButton() {
  if (window.AssessmentHelpers?.helpers?.[HELPER_ID]) {
    removeLauncherButton();
    return;
  }

  if (document.querySelector(selectors.launcher)) return;

  const btn = document.createElement('button');
  btn.id = LAUNCHER_ID;
  btn.textContent = 'Rubric Builder';
  btn.type = 'button';

  const savedX = loadStoredValue('launcher_left', LEGACY_POSITION_KEYS.left);
  const savedY = loadStoredValue('launcher_top', LEGACY_POSITION_KEYS.top);

  btn.style.cssText = `
    position: fixed;
    top: ${savedY || '20px'};
    left: ${savedX || '20px'};
    z-index: ${Z_INDEX_BASE};
    padding: 10px 12px;
    background: #27272A;
    color: white;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    cursor: grab;
    font-size: 13px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    user-select: none;
  `;

  btn.addEventListener('click', function (e) {
    bringPanelToFront(btn);
    if (btn.dataset.dragged === 'true') {
      btn.dataset.dragged = 'false';
      return;
    }
    renderModal();
  });

  bindDragging(btn);
  document.body.appendChild(btn);
  elements.launcher = btn;
  bringPanelToFront(btn);
  clampLauncherToViewport(btn, true);
}

  function removeLauncherButton() {
    const launcher = document.querySelector(selectors.launcher);
    if (launcher) launcher.remove();
    elements.launcher = null;
  }
    function bindDragging(el) {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  let moved = false;

  el.addEventListener('mousedown', (e) => {
    bringPanelToFront(el);
    isDragging = true;
    moved = false;

    startX = e.clientX;
    startY = e.clientY;
    startLeft = el.offsetLeft;
    startTop = el.offsetTop;

    el.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      moved = true;
    }

    const newLeft = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, startLeft + dx));
    const newTop = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, startTop + dy));

    el.style.left = `${newLeft}px`;
    el.style.top = `${newTop}px`;
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;

    isDragging = false;
    el.style.cursor = 'grab';

    saveStoredValue('launcher_left', el.style.left);
    saveStoredValue('launcher_top', el.style.top);

    if (moved) {
      el.dataset.dragged = 'true';
    }
  });

  if (el.dataset.resizeClampBound !== '1') {
    window.addEventListener('resize', () => clampLauncherToViewport(el, true));
    el.dataset.resizeClampBound = '1';
  }
}
  function renderModal() {
    handleCloseModal();

    const overlay = document.createElement('div');
    overlay.id = PANEL_ID;
    overlay.classList.add('ah-scope');
    overlay.style.cssText = `
      position:fixed;
      inset:0;
      background:rgba(17,18,20,.38);
      z-index:${Z_INDEX_BASE};
      display:flex;
      align-items:center;
      justify-content:center;
      padding:24px;
    `;
    bringPanelToFront(overlay);

    const modal = document.createElement('div');
    modal.className = 'ah-panel ah-rubric-modal';
 modal.style.cssText = `
  background:var(--ah-bg);
  width:min(1100px, 95vw);
  height:min(85vh, 900px);
  border-radius:18px;
  overflow:hidden;
  display:grid;
  grid-template-rows:auto 1fr auto;
  box-shadow:0 10px 30px rgba(0,0,0,.25);
  font-family:var(--ah-font-ui);
  border:1px solid var(--ah-line);
`;

    modal.innerHTML = `
      <div style="padding:16px 20px; border-bottom:1px solid var(--ah-line); display:flex; justify-content:space-between; gap:16px; align-items:center;">
        <div style="display:flex; flex-direction:column; gap:8px; flex:1;">
<strong class="ah-panel__title" style="font-size:16px;">Rubric Builder</strong>
<input class="ah-field" id="jj-rubric-title" type="text" placeholder="New rubric name" style="padding:8px 10px; font-size:14px; width:100%; max-width:420px; border:1px solid var(--ah-line-strong); border-radius:8px; background:var(--ah-fill); color:var(--ah-text);">
</div>
<button id="jj-close-modal" type="button" class="ah-icon-btn ah-icon-btn--ghost ah-icon-btn--sm" aria-label="Close Rubric Builder">×</button>
</div>

      <div style="display:grid; grid-template-columns: 1.15fr 1fr; gap:12px; padding:12px; min-height:0; background:var(--ah-bg);">
  <div id="jj-library-panel" style="overflow:auto; padding:18px 20px; border-right:1px solid var(--ah-line); background:var(--ah-bg);"></div>
  <div id="jj-selected-panel" style="overflow:auto; padding:18px 20px; background:var(--ah-bg);"></div>
</div>

<div style="padding:12px 20px; border-top:1px solid var(--ah-line); display:flex; justify-content:space-between; align-items:center; background:var(--ah-bg);">
  <div id="jj-status" style="font-size:13px; color:var(--ah-muted);">Select criteria and enter weights.</div>
  <button id="jj-download-csv" type="button" class="ah-btn ah-btn--primary">${actionIcon('download')}<span>Download Canvas CSV</span></button>
</div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) handleCloseModal();
    });
    modal.querySelector('#jj-close-modal').addEventListener('click', handleCloseModal);
    modal.querySelector('#jj-download-csv').addEventListener('click', handleExportCsv);

    renderLibrary();
    renderSelected();
  }

  function handleCloseModal() {
    document.getElementById(PANEL_ID)?.remove();
  }

  function actionIcon(name) {
    const paths = {
      delete: '<path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6"></path>',
      download: '<path d="M12 4v12"></path><path d="M7 11l5 5l5 -5"></path><path d="M20 16v4a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1v-4"></path>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;">${paths[name] || ''}</svg>`;
  }

  function renderLibrary() {
    const container = document.getElementById('jj-library-panel');
    if (!container) return;

    const grouped = getRowsByCategory(state.rows);
    container.innerHTML = '';

    Object.keys(grouped).sort().forEach(category => {
const section = document.createElement('div');
section.style.cssText = `
  margin-bottom:20px;
  padding:14px;
  border:1px solid var(--ah-line);
  border-radius:12px;
  background:var(--ah-surface);
`;

      const heading = document.createElement('h3');
      heading.textContent = category;
heading.style.cssText = `
  margin:0 0 12px 0;
  font-size:14px;
  font-weight:700;
  color:var(--ah-text);
  letter-spacing:0.01em;
`;
        section.appendChild(heading);

      grouped[category].forEach(row => {
        const checked = state.selected.has(row.criterion_code);

        const item = document.createElement('label');
        item.style.cssText = `
  display:block;
  padding:10px 12px;
  margin:0 0 8px 0;
  border:1px solid ${checked ? 'var(--ah-line-strong)' : 'var(--ah-line)'};
  border-radius:10px;
  cursor:pointer;
background:${checked ? 'var(--ah-fill-hover)' : 'var(--ah-surface)'};
  box-shadow:${checked ? 'inset 0 0 0 1.5px var(--ah-stripe)' : 'none'};
`;

        item.innerHTML = `
          <div style="display:flex; gap:10px; align-items:flex-start;">
<input type="checkbox" data-code="${row.criterion_code}" ${checked ? 'checked' : ''} style="margin-top:3px; accent-color:var(--ah-stripe);width:18px;height:18px;flex:0 0 18px;">
<div>
              <div style="font-weight:600;">${escapeHtml(row.criterion_name)}</div>
<div style="font-size:13px; color:var(--ah-muted); margin-top:3px; line-height:1.4;">${escapeHtml(row.criterion_summary || '')}</div>            </div>
          </div>
        `;

        const checkbox = item.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            state.selected.set(row.criterion_code, { row, weight: 20 });
          } else {
            state.selected.delete(row.criterion_code);
          }
          renderLibrary();
          renderSelected();
        });

        section.appendChild(item);
      });

      container.appendChild(section);
    });
  }

  function renderSelected() {
    const container = document.getElementById('jj-selected-panel');
    if (!container) return;

    const selectedItems = Array.from(state.selected.values())
      .sort((a, b) => {
        const catCompare = (a.row.category || '').localeCompare(b.row.category || '');
        if (catCompare !== 0) return catCompare;
        return a.row.display_order - b.row.display_order;
      });

    if (!selectedItems.length) {
      container.innerHTML = `<p style="margin:0; color:var(--ah-muted);">No criteria selected yet.</p>`;
      updateStatus();
      return;
    }

    container.innerHTML = '';
    selectedItems.forEach(item => {
      const { row, weight } = item;
      const scores = calculateBandScores(weight);

      const card = document.createElement('div');
card.style.cssText = `
  border:1px solid var(--ah-line);
  border-radius:10px;
  padding:12px;
  margin-bottom:12px;
  background:var(--ah-surface);
  box-shadow:0 1px 0 rgba(0,0,0,0.02);
`;

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; gap:12px; align-items:start;">
          <div>
            <div style="font-weight:700;">${escapeHtml(row.criterion_name)}</div>
            <div style="font-size:13px; color:var(--ah-muted); margin-top:4px;">${escapeHtml(row.category || '')}</div>
          </div>
<button type="button" data-remove="${row.criterion_code}" class="ah-icon-btn ah-icon-btn--ghost ah-icon-btn--sm" aria-label="Remove ${escapeHtml(row.criterion_name)}">${actionIcon('delete')}</button>
</div>

        <div style="font-size:13px; color:var(--ah-text-soft); margin-top:8px;">${escapeHtml(chooseDescription(row))}</div>

        <div style="margin-top:10px;">
          <label style="font-size:13px;">Weight:
<input type="number" step="0.5" min="0" value="${weight}" data-weight="${row.criterion_code}" class="ah-field" style="width:72px; margin-left:6px; padding:6px 8px; border:1px solid var(--ah-line); border-radius:8px; background:var(--ah-bg);">
</label>
        </div>

        <div style="margin-top:10px; font-size:13px; color:var(--ah-text);">
          ${[['HD', 'hd'], ['D', 'd'], ['C', 'c'], ['P', 'p'], ['F', 'f']].map(([label, band]) =>
            `<span class="ah-chip" style="display:inline-flex;gap:6px;margin:3px 2px;"><span class="ah-dot" style="--ah-band:var(--ah-band-${band});"></span>${label} ${scores[band]}</span>`).join('')}
        </div>
      `;

      card.querySelector(`[data-remove="${row.criterion_code}"]`).addEventListener('click', () => {
        state.selected.delete(row.criterion_code);
        renderLibrary();
        renderSelected();
      });

const weightInput = card.querySelector(`[data-weight="${row.criterion_code}"]`);

weightInput.addEventListener('change', (e) => {
  const raw = e.target.value.trim();
  const n = Number(raw);

  state.selected.set(row.criterion_code, {
    row,
    weight: raw === '' ? '' : (Number.isFinite(n) ? n : 0),
  });

  renderSelected();
});

      container.appendChild(card);
    });

    updateStatus();
  }

function updateStatus() {
  const status = document.getElementById('jj-status');
  if (!status) return;

  const selectedItems = Array.from(state.selected.values());

  const totalWeight = selectedItems.reduce((sum, item) => {
    const n = Number(item.weight);
    return sum + (Number.isFinite(n) ? n : 20);
  }, 0);

  const roundedTotal = Math.round(totalWeight * 10) / 10;
  const countText = `${selectedItems.length} ${selectedItems.length === 1 ? 'criterion' : 'criteria'} selected.`;
  const totalText = ` Total weight: ${roundedTotal}`;

  status.textContent = countText + totalText;
  status.style.color = roundedTotal > 100 ? 'var(--ah-danger)' : 'var(--ah-muted)';
  status.style.fontWeight = roundedTotal > 100 ? '700' : '400';
}

  function handleExportCsv() {
    const rubricTitleInput = document.getElementById('jj-rubric-title');
    const rubricName = (rubricTitleInput?.value || '').trim() || 'Rubric Builder Export';

    const selectedItems = Array.from(state.selected.values());
    if (!selectedItems.length) {
      alert('Select at least one criterion first.');
      return;
    }

    const rows = selectedItems.map(item =>
      createCanvasCsvRow(item.row, rubricName, item.weight)
    );

    const csv = createCsvText(rows);
    const safeName = rubricName.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'rubric_export';
    downloadTextFile(`${safeName}.csv`, csv);
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // =========================================================
  // 6. START
  // =========================================================
  function init() {
    removeLauncherButton();
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

  function showRegisteredPanel() {
    removeLauncherButton();
    renderModal();
    const panel = getRegisteredPanel();
    if (!panel) return;
    panel.dataset.vcHelperDockHidden = '0';
    delete panel.dataset.vcHelperDockPreviousDisplay;
    if (typeof bringPanelToFront === 'function') bringPanelToFront(panel);
  }

  function hideRegisteredPanel() {
    const panel = getRegisteredPanel();
    if (panel) panel.dataset.vcHelperDockHidden = '1';
    handleCloseModal();
  }

  function isRegisteredPanelOpen() {
    return !!getRegisteredPanel();
  }

  function toggleRegisteredPanel() {
    if (isRegisteredPanelOpen()) hideRegisteredPanel();
    else showRegisteredPanel();
  }

  function registerAssessmentHelper() {
    const registry = ensureAssessmentHelpersRegistry();

    registry.register({
      id: HELPER_ID,
      aliases: ['rubric-library', 'rubric-smoother'],
      name: HELPER_NAME,
      panelId: PANEL_ID,
      panelIds: [PANEL_ID],
      show: showRegisteredPanel,
      hide: hideRegisteredPanel,
      toggle: toggleRegisteredPanel,
      isOpen: isRegisteredPanelOpen
    });
  }

  const observer = new MutationObserver(() => removeLauncherButton());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  registerAssessmentHelper();
  init();
})();
