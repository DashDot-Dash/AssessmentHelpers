// ==UserScript==
// @name         Assessment Helpers - Copy/Paster
// @namespace    AssessmentHelpers
// @version      1.1.18
// @description  Assessment Helpers panel for reusable Canvas SpeedGrader comment snippets
// @match        *://*/courses/*/gradebook/speed_grader*
// @match        *://*/courses/*/gradebook/speed_grader?*
// @match        *://*/gradebook/speed_grader*
// @updateURL    https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-copy-paster.user.js
// @downloadURL  https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-copy-paster.user.js
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

  // Manages reusable SpeedGrader comment snippets for the current assignment.

  // constants/config
  const HELPER_ID = 'copy-paster';
  const HELPER_NAME = 'Copy/Paster';
  const PANEL_ID = 'sg-copypaster-panel';
  const STYLE_ID = 'sg-copypaster-style';
  const Z_INDEX_BASE = 100000;
  const STORAGE_PREFIX = 'canvas_speedgrader_copy_paster_v1';
  const LEGACY_STORAGE_PREFIX = 'sgCopyPaster_v01';
  const GRADE_BANDS = ['HD', 'D', 'C', 'P', 'F', 'No submission', 'Uncategorised'];
  const DEFAULT_GRADE_BAND = 'Uncategorised';
  const DEFAULT_CATEGORY = 'General';
  const DEFAULT_COMMENT_LIST_HEIGHT = 260;
  const MIN_COMMENT_LIST_HEIGHT = 160;

  const DEFAULT_SNIPPETS = [
    {
      id: crypto.randomUUID(),
      title: 'Strong concept',
      body: 'This is a strong concept with a clear direction and a well-developed visual language.',
      gradeBand: DEFAULT_GRADE_BAND,
      category: DEFAULT_CATEGORY,
      isStarter: false
    },
    {
      id: crypto.randomUUID(),
      title: 'Needs development',
      body: 'There is a clear starting point here, but the work would benefit from further development and refinement.',
      gradeBand: DEFAULT_GRADE_BAND,
      category: DEFAULT_CATEGORY,
      isStarter: false
    },
    {
      id: crypto.randomUUID(),
      title: 'Technical refinement',
      body: 'The project would benefit from greater technical refinement, particularly in the consistency and finish of the outcome.',
      gradeBand: DEFAULT_GRADE_BAND,
      category: DEFAULT_CATEGORY,
      isStarter: false
    }
  ];

  // selectors
  const selectors = {
    panel: `#${PANEL_ID}`,
    editorIframeSuffix: 'iframe[id$="_ifr"]'
  };

  // state
  const state = {
    lastHref: location.href,
    editingSnippet: null,
    importMessage: ''
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

  function cleanText(s) {
    return (s || '').replace(/\s+/g, ' ').trim();
  }

  function cleanField(value) {
    return String(value ?? '').trim();
  }

  function normalizeGradeBand(value) {
    const cleaned = cleanText(value);
    if (!cleaned) return DEFAULT_GRADE_BAND;
    const aliases = {
      'high distinction': 'HD',
      distinction: 'D',
      credit: 'C',
      pass: 'P',
      fail: 'F',
      'no submission': 'No submission'
    };
    if (aliases[cleaned.toLowerCase()]) return aliases[cleaned.toLowerCase()];
    const match = GRADE_BANDS.find(band => band.toLowerCase() === cleaned.toLowerCase());
    return match || cleaned;
  }

  function normalizeCategory(value) {
    return cleanText(value) || DEFAULT_CATEGORY;
  }

  function normalizeStarter(value) {
    if (typeof value === 'boolean') return value;
    return ['yes', 'true', '1', 'starter'].includes(cleanText(value).toLowerCase());
  }

  function makeSnippetTitle(body) {
    const cleaned = cleanText(body);
    if (!cleaned) return 'Untitled';
    if (cleaned.length <= 60) return cleaned;
    const slice = cleaned.slice(0, 57).replace(/\s+\S*$/, '').trim();
    return `${slice || cleaned.slice(0, 57)}...`;
  }

  function normalizeSnippet(snippet = {}) {
    const body = cleanField(snippet.body ?? snippet.text ?? snippet.comment);
    const title = cleanText(snippet.title ?? snippet.label) || makeSnippetTitle(body);

    return {
      ...snippet,
      id: snippet.id || crypto.randomUUID(),
      title,
      body,
      gradeBand: normalizeGradeBand(snippet.gradeBand ?? snippet.grade_band),
      category: normalizeCategory(snippet.category),
      isStarter: normalizeStarter(snippet.isStarter ?? snippet.starter),
      label: title,
      text: body
    };
  }

  function normalizeSnippets(snippets) {
    return (Array.isArray(snippets) ? snippets : DEFAULT_SNIPPETS).map(normalizeSnippet);
  }

  function getSnippetTitle(snippet) {
    return cleanText(snippet?.title ?? snippet?.label) || 'Untitled';
  }

  function getSnippetBody(snippet) {
    return cleanField(snippet?.body ?? snippet?.text);
  }

  function getCategoryOptions(snippets) {
    const categories = snippets.map(snippet => normalizeCategory(snippet.category));
    return Array.from(new Set(categories)).sort((a, b) => a.localeCompare(b));
  }

  function createSelectOptions(values, selectedValue) {
    return values.map(value => createElement('option', {
      value,
      text: value,
      selected: value === selectedValue ? 'selected' : null
    }));
  }

  function getUrl() {
    return new URL(window.location.href);
  }

  function getCourseId() {
    const m = location.pathname.match(/\/courses\/(\d+)\//);
    return m ? m[1] : 'unknown-course';
  }

  function getAssignmentId() {
    const url = getUrl();
    return (
      url.searchParams.get('assignment_id') ||
      url.searchParams.get('assignment') ||
      'unknown-assignment'
    );
  }

  function getAssignmentName() {
    const selectorList = [
      '[data-testid="assignment-name"]',
      '[data-testid="assignment-select-trigger"]',
      '[data-testid="assignment_select"]',
      '#assignment_url',
      '#assignment_select',
      '#assignment_select option:checked',
      'select[name="assignment_id"]',
      'select[name="assignment_id"] option:checked',
      'a[href*="/assignments/"][aria-current="page"]',
      'a[href*="assignment_id="][aria-current="page"]'
    ];

    for (const selector of selectorList) {
      const text = getAssignmentTextFromElement(getElement(selector));
      if (text) return cleanAssignmentName(text);
    }

    const pageTextName = getAssignmentNameFromPageText();
    if (pageTextName) return pageTextName;

    const title = cleanText(document.title || '').replace(/\s*\|\s*SpeedGrader.*$/i, '');
    if (title && !/^SpeedGrader$/i.test(title)) return cleanAssignmentName(title);

    return `Assignment ${getAssignmentId()}`;
  }

  function getAssignmentTextFromElement(el) {
    if (!el) return '';
    if (el.selectedOptions?.length) return cleanText(el.selectedOptions[0].textContent || '');
    return cleanText(el.textContent || el.value || el.getAttribute?.('aria-label') || '');
  }

  function cleanAssignmentName(value) {
    return cleanText(value)
      .replace(/^Assignment:\s*/i, '')
      .replace(/\s+[A-Z]{4}\d{4}\b.*$/, '')
      .replace(/,?\s*SpeedGrader,?\s*$/i, '')
      .replace(/[,\s]+$/, '')
      .trim();
  }

  function getAssignmentNameFromPageText() {
    const bodyClone = document.body?.cloneNode(true);
    bodyClone?.querySelectorAll([
      '#sg-copypaster-panel',
      '#assessment-helper-dock',
      '#sg-benchmarker-panel',
      '#ah-tutorial-sorter-panel',
      '#vc-gradebridge-panel',
      '#ah-eta-panel'
    ].join(',')).forEach(el => el.remove());

    const lines = String(bodyClone?.innerText || '').split(/\r?\n/);
    for (const line of lines) {
      const match = cleanText(line).match(/^(.{3,140}?)\s+[A-Z]{4}\d{4}\b/);
      if (match) {
        const cleaned = cleanAssignmentName(match[1]);
        if (
          cleaned &&
          !/^SpeedGrader$/i.test(cleaned) &&
          !/^Students in\b/i.test(cleaned)
        ) {
          return cleaned;
        }
      }
    }
    return '';
  }

  function getLocalGroupContext() {
    try {
      const raw = window.AssessmentHelpersCompatibility.read('assessmentHelpers:tutorialSorter:v1:context');
      if (!raw) return null;

      const context = JSON.parse(raw);
      if (!context) return null;

      const currentCourseKey = getCourseId();
      if (context.course_key && context.course_key !== currentCourseKey) return null;

      return context;
    } catch {
      return null;
    }
  }

  function formatClassAssignmentInfo() {
    const context = getLocalGroupContext();
    const metadata = context?.metadata || {};
    const classInfo = context?.active_group_id
      ? [
          [metadata.day, metadata.time].filter(Boolean).join(' '),
          metadata.location
        ].filter(Boolean).join(' · ')
      : '';
    const assignmentName = getAssignmentName();

    return [classInfo, assignmentName].filter(Boolean).join(' | ');
  }

  function getStorageKey(prefix = STORAGE_PREFIX) {
    return `${prefix}:${getCourseId()}:${getAssignmentId()}`;
  }

  function getLegacyStorageKey() {
    return getStorageKey(LEGACY_STORAGE_PREFIX);
  }

  function getStoredJson() {
    return window.AssessmentHelpersCompatibility.read(getStorageKey()) || window.AssessmentHelpersCompatibility.read(getLegacyStorageKey());
  }

  // storage helpers
  function defaultStore() {
    return {
      snippets: DEFAULT_SNIPPETS,
      ui: {
        collapsed: false,
        posX: null,
        posY: null,
        mode: 'append', // append | replace
        gradeBandFilter: 'All',
        categoryFilter: 'All categories',
        importExportOpen: false,
        commentListHeight: DEFAULT_COMMENT_LIST_HEIGHT
      }
    };
  }

  function loadStore() {
    try {
      const parsed = JSON.parse(getStoredJson());
      if (!parsed) return defaultStore();
      parsed.snippets = normalizeSnippets(parsed.snippets);
      parsed.ui = parsed.ui || {};
      if (parsed.ui.collapsed == null) parsed.ui.collapsed = false;
      if (parsed.ui.posX == null) parsed.ui.posX = null;
      if (parsed.ui.posY == null) parsed.ui.posY = null;
      if (!parsed.ui.mode) parsed.ui.mode = 'append';
      if (!parsed.ui.gradeBandFilter) parsed.ui.gradeBandFilter = 'All';
      if (!parsed.ui.categoryFilter) parsed.ui.categoryFilter = 'All categories';
      if (parsed.ui.importExportOpen == null) parsed.ui.importExportOpen = false;
      if (!parsed.ui.commentListHeight) parsed.ui.commentListHeight = DEFAULT_COMMENT_LIST_HEIGHT;
      return parsed;
    } catch {
      return defaultStore();
    }
  }

  function saveStore(store) {
    localStorage.setItem(getStorageKey(), JSON.stringify(store));
  }

  function updateCollapsed(collapsed) {
    const store = loadStore();
    store.ui.collapsed = collapsed;
    saveStore(store);
    renderPanel();
  }

  function getCollapsed() {
    return !!loadStore().ui?.collapsed;
  }

  function updateMode(mode) {
    const store = loadStore();
    store.ui.mode = mode;
    saveStore(store);
    renderPanel();
  }

  function getMode() {
    return loadStore().ui?.mode || 'append';
  }

  function updateGradeBandFilter(gradeBand) {
    const store = loadStore();
    store.ui.gradeBandFilter = gradeBand || 'All';
    saveStore(store);
    renderPanel();
  }

  function getGradeBandFilter() {
    return loadStore().ui?.gradeBandFilter || 'All';
  }

  function updateCategoryFilter(category) {
    const store = loadStore();
    store.ui.categoryFilter = category || 'All categories';
    saveStore(store);
    renderPanel();
  }

  function getCategoryFilter() {
    return loadStore().ui?.categoryFilter || 'All categories';
  }

  function updateImportExportOpen(open) {
    const store = loadStore();
    store.ui.importExportOpen = open;
    saveStore(store);
  }

  function getImportExportOpen() {
    return !!loadStore().ui?.importExportOpen;
  }

  function updateCommentListHeight(height) {
    const store = loadStore();
    store.ui.commentListHeight = height;
    saveStore(store);
  }

  function getCommentListHeight() {
    const storedHeight = Number(loadStore().ui?.commentListHeight);
    return storedHeight > 0 ? storedHeight : DEFAULT_COMMENT_LIST_HEIGHT;
  }

  function updatePanelPosition(x, y) {
    const store = loadStore();
    store.ui.posX = x;
    store.ui.posY = y;
    saveStore(store);

    const panel = document.getElementById(PANEL_ID);
    if (panel) {
      panel.style.left = `${x}px`;
      panel.style.top = `${y}px`;
      panel.style.right = 'auto';
    }
  }

  function getPanelPosition() {
    const ui = loadStore().ui || {};
    return { x: ui.posX, y: ui.posY };
  }

  function clampPanelToViewport(panel, persist = false) {
    if (!panel) return;
    const margin = 8;
    const rect = panel.getBoundingClientRect();
    const width = rect.width || 510;
    const height = rect.height || 80;
    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - height - margin);
    const left = Math.min(Math.max(margin, rect.left), maxLeft);
    const top = Math.min(Math.max(margin, rect.top), maxTop);

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.right = 'auto';

    if (persist) updatePanelPosition(left, top);
  }

  function getSnippets() {
    return loadStore().snippets || [];
  }

  function addSnippet(snippet) {
    const store = loadStore();
    store.snippets.push(normalizeSnippet({
      ...snippet,
      id: crypto.randomUUID()
    }));
    saveStore(store);
    renderPanel();
  }

  function updateSnippet(id, snippet) {
    const store = loadStore();
    const item = store.snippets.find(s => s.id === id);
    if (!item) return;
    Object.assign(item, normalizeSnippet({
      ...item,
      ...snippet,
      id
    }));
    saveStore(store);
    renderPanel();
  }

  function deleteSnippet(id) {
    const ok = window.confirm('Delete this snippet?');
    if (!ok) return;

    const store = loadStore();
    store.snippets = store.snippets.filter(s => s.id !== id);
    saveStore(store);
    renderPanel();
  }

  function resetAssignmentSnippets() {
    const ok = window.confirm(
      'Reset Copy/Paster for this assignment? This will remove all saved snippets for the current course + assignment.'
    );
    if (!ok) return;

    window.AssessmentHelpersCompatibility.remove(getStorageKey());
    window.AssessmentHelpersCompatibility.remove(getLegacyStorageKey());
    renderPanel();
  }

  function csvEscape(value) {
    const text = String(value ?? '');
    if (/[",\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
    return text;
  }

  function snippetsToCsv(snippets) {
    const header = ['grade_band', 'category', 'title', 'comment', 'starter'];
    const rows = snippets.map(snippet => [
      normalizeGradeBand(snippet.gradeBand),
      normalizeCategory(snippet.category),
      getSnippetTitle(snippet),
      getSnippetBody(snippet),
      snippet.isStarter ? 'yes' : ''
    ]);

    return [header, ...rows]
      .map(row => row.map(csvEscape).join(','))
      .join('\r\n');
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];

      if (inQuotes) {
        if (char === '"' && next === '"') {
          field += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          field += char;
        }
        continue;
      }

      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field);
        field = '';
      } else if (char === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else if (char !== '\r') {
        field += char;
      }
    }

    row.push(field);
    rows.push(row);
    return rows;
  }

  function rowIsBlank(row) {
    return row.every(value => cleanText(value) === '');
  }

  function csvRowsToSnippets(rows) {
    const nonBlankRows = rows.filter(row => !rowIsBlank(row));
    if (!nonBlankRows.length) return [];

    const headers = nonBlankRows[0].map(header =>
      cleanText(header).replace(/^\uFEFF/, '').toLowerCase()
    );
    const indexOf = name => headers.indexOf(name);
    const indexes = {
      gradeBand: indexOf('grade_band'),
      category: indexOf('category'),
      title: indexOf('title'),
      body: indexOf('comment'),
      starter: indexOf('starter')
    };

    if (indexes.body === -1) throw new Error('Missing comment column');

    return nonBlankRows.slice(1)
      .map(row => {
        const valueAt = index => (index >= 0 ? cleanField(row[index]) : '');
        const body = valueAt(indexes.body);
        if (!body) return null;

        return normalizeSnippet({
          id: crypto.randomUUID(),
          title: valueAt(indexes.title) || makeSnippetTitle(body),
          body,
          gradeBand: valueAt(indexes.gradeBand) || DEFAULT_GRADE_BAND,
          category: valueAt(indexes.category) || DEFAULT_CATEGORY,
          isStarter: normalizeStarter(valueAt(indexes.starter))
        });
      })
      .filter(Boolean);
  }

  function handleExportData() {
    const csv = snippetsToCsv(getSnippets());
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `copypaster-course-${getCourseId()}-assignment-${getAssignmentId()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

function handleImportData(file) {
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const raw = String(reader.result || '');
      let importedSnippets = [];

      if (/\.json$/i.test(file.name)) {
        const parsed = JSON.parse(raw);
        if (!parsed.data || !Array.isArray(parsed.data.snippets)) {
          throw new Error('Bad format');
        }
        importedSnippets = normalizeSnippets(parsed.data.snippets)
          .filter(snippet => getSnippetBody(snippet));
      } else {
        importedSnippets = csvRowsToSnippets(parseCsv(raw));
      }

      const currentStore = loadStore();
      const importedWithFreshIds = importedSnippets.map(snippet => normalizeSnippet({
        ...snippet,
        id: crypto.randomUUID()
      }));

      saveStore({
        ...currentStore,
        snippets: [...(currentStore.snippets || []), ...importedWithFreshIds]
      });
      state.importMessage = `Imported ${importedWithFreshIds.length} snippets.`;
      renderPanel();
    } catch (err) {
      console.error(err);
      alert('That file does not look like a valid Copy/Paster CSV export.');
    }
  };

  reader.readAsText(file);
}

  // ----------------------------
  // Editor access
  // ----------------------------

  function getEditorIframe() {
    // Prefer TinyMCE/Canvas RCE iframe IDs ending in _ifr
    const iframe =
      getElement('iframe.tox-edit-area__iframe') ||
      getElement(selectors.editorIframeSuffix) ||
      getElements('iframe').find(el => /rce|tox|_ifr/i.test(el.id || ''));

    return iframe || null;
  }

  function getEditorDocument() {
    const iframe = getEditorIframe();
    if (!iframe) return null;

    try {
      return iframe.contentDocument || iframe.contentWindow?.document || null;
    } catch {
      return null;
    }
  }

  function getEditorBody() {
    const doc = getEditorDocument();
    if (!doc) return null;
    return doc.body || null;
  }

  function getEditorHtml() {
    const body = getEditorBody();
    return body ? body.innerHTML : '';
  }

  function getEditorText() {
    const body = getEditorBody();
    return body ? cleanText(body.innerText || body.textContent || '') : '';
  }

  function focusEditor() {
    const body = getEditorBody();
    if (!body) return false;
    body.focus();
    return true;
  }

  function setEditorHtml(html) {
    const body = getEditorBody();
    if (!body) return false;

    body.innerHTML = html;
    dispatchEditorChange();
    focusEditor();
    return true;
  }

  function appendPlainTextToEditor(text) {
    const body = getEditorBody();
    if (!body) return false;

    const existingText = getEditorText();
    let newHtml = '';

    if (!existingText) {
      newHtml = `<p>${escapeHtml(text)}</p>`;
    } else {
      const currentHtml = getEditorHtml().trim();
      const spacer = currentHtml ? '<p><br></p>' : '';
      newHtml = `${currentHtml}${spacer}<p>${escapeHtml(text)}</p>`;
    }

    body.innerHTML = newHtml;
    dispatchEditorChange();
    focusEditor();
    return true;
  }

  function replaceEditorWithPlainText(text) {
    return setEditorHtml(`<p>${escapeHtml(text)}</p>`);
  }

  function insertSnippet(text) {
    const mode = getMode();
    const ok =
      mode === 'replace'
        ? replaceEditorWithPlainText(text)
        : appendPlainTextToEditor(text);

    if (!ok) {
      alert('Could not find the SpeedGrader comment editor.');
    }
  }

  function copySnippetToClipboard(text) {
    navigator.clipboard.writeText(text).then(
      () => alert('Snippet copied to clipboard.'),
      () => alert('Could not copy to clipboard.')
    );
  }

  function dispatchEditorChange() {
    const body = getEditorBody();
    const iframe = getEditorIframe();
    if (!body || !iframe) return;

    // Trigger common events Canvas/TinyMCE listens for
    body.dispatchEvent(new Event('input', { bubbles: true }));
    body.dispatchEvent(new Event('change', { bubbles: true }));
    body.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: ' ' }));

    iframe.dispatchEvent(new Event('input', { bubbles: true }));
    iframe.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
    function focusEditorAtEndWithNewLine() {
  const body = getEditorBody();
  const doc = getEditorDocument();
  if (!body || !doc) return false;

  body.focus();

  const hasText = cleanText(body.innerText || body.textContent || '');

  if (!hasText) {
    // Empty editor: just place cursor in first paragraph
    if (!body.innerHTML.trim()) {
      body.innerHTML = '<p><br></p>';
      dispatchEditorChange();
    }
  } else {
    // If there is existing content, ensure there is a blank paragraph at the end
    const lastEl = body.lastElementChild;
    const lastText = cleanText(lastEl?.textContent || '');

    const lastIsBlankParagraph =
      lastEl &&
      lastEl.tagName === 'P' &&
      (lastEl.innerHTML === '<br>' || lastEl.innerHTML === '&nbsp;' || lastText === '');

    if (!lastIsBlankParagraph) {
      const p = doc.createElement('p');
      p.innerHTML = '<br>';
      body.appendChild(p);
      dispatchEditorChange();
    }
  }

  // Place cursor at the end of the editor
  const selection = doc.getSelection();
  const range = doc.createRange();

  let targetNode = body.lastChild;
  if (!targetNode) {
    targetNode = doc.createElement('p');
    targetNode.innerHTML = '<br>';
    body.appendChild(targetNode);
  }

  range.selectNodeContents(targetNode);
  range.collapse(false);

  selection.removeAllRanges();
  selection.addRange(range);

  return true;
}

  // ----------------------------
  // UI
  // ----------------------------

  function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') {
        el.addEventListener(k.slice(2), v);
      } else {
        el.setAttribute(k, v);
      }
    }
    for (const child of children) {
      if (child == null) continue;
      el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return el;
  }

  function iconSvg(name) {
    const paths = {
      insert: '<path d="M5 12h14"></path><path d="M13 6l6 6l-6 6"></path>',
      plus: '<path d="M12 5v14"></path><path d="M5 12h14"></path>',
      write: '<path d="M4 7h16"></path><path d="M4 12h10"></path><path d="M4 17h7"></path><path d="M16 16l2 2l4 -4"></path>',
      copy: '<path d="M8 8m0 2a2 2 0 0 1 2 -2h7a2 2 0 0 1 2 2v7a2 2 0 0 1 -2 2h-7a2 2 0 0 1 -2 -2z"></path><path d="M16 8v-1a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v7a2 2 0 0 0 2 2h1"></path>',
      edit: '<path d="M4 20h4l10.5 -10.5a2.8 2.8 0 1 0 -4 -4l-10.5 10.5v4"></path><path d="M13.5 6.5l4 4"></path>',
      delete: '<path d="M4 7h16"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3h6v3"></path>',
      upload: '<path d="M12 16v-12"></path><path d="M7 9l5 -5l5 5"></path><path d="M20 16v4a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1v-4"></path>',
      download: '<path d="M12 4v12"></path><path d="M7 11l5 5l5 -5"></path><path d="M20 16v4a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1v-4"></path>',
      minimize: '<path d="M6 12h12"></path>',
      maximize: '<path d="M6 12h12"></path>'
    };

    return `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        ${paths[name] || ''}
      </svg>
    `;
  }

  function createIconButton({ icon, label, className = '', onclick }) {
    return createElement('button', {
      class: `cp-icon-btn ${className}`.trim(),
      type: 'button',
      title: label,
      'aria-label': label,
      html: iconSvg(icon),
      onclick
    });
  }

 function addStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${PANEL_ID} {
      position: fixed;
      top: 80px;
      left: 20px;
      z-index: ${Z_INDEX_BASE};
      color: var(--ah-text);
      border-radius: 12px;
      overflow: hidden;
    }

    #${PANEL_ID}.dragging {
      opacity: 0.9;
      user-select: none;
    }

    #${PANEL_ID} * {
      box-sizing: border-box;
    }

    #${PANEL_ID} .cp-head-buttons {
      display: flex;
      gap: 6px;
    }

    #${PANEL_ID} .cp-row {
      margin-bottom: 12px;
    }

    #${PANEL_ID} .cp-small {

      font-size:11px;
      color: var(--ah-muted);
    }

    #${PANEL_ID} .cp-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    #${PANEL_ID} .cp-grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }

    #${PANEL_ID} button,
    #${PANEL_ID} input,
    #${PANEL_ID} textarea,
    #${PANEL_ID} select {
      font: inherit;
    }

    #${PANEL_ID} input[type="text"],
    #${PANEL_ID} textarea,
    #${PANEL_ID} select {
      width: 100%;
      border-radius: 8px;
      border: 1px solid var(--ah-line);
      background: var(--ah-bg);
      color: var(--ah-text);
      padding: 8px 10px;
    }

    #${PANEL_ID} textarea {
      min-height: 90px;
      resize: vertical;
    }

    #${PANEL_ID} label {
      display: block;
      margin-bottom: 4px;
      font-size: 11px;
      color: var(--ah-muted);
    }

    #${PANEL_ID} .cp-check {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: var(--ah-muted);
    }

    #${PANEL_ID} .cp-check input {
      margin: 0;
    }

    #${PANEL_ID} .cp-list {
      overflow: auto;
      border-radius: 10px;
      background: var(--ah-bg);
      border: 1px solid var(--ah-line);
      padding: 6px;
    }

    #${PANEL_ID} .cp-resize-handle {
      height: 14px;
      margin: -6px 0 10px;
      border-radius: 7px;
      cursor: ns-resize;
      position: relative;
    }

    #${PANEL_ID} .cp-resize-handle::before {
      content: "";
      position: absolute;
      left: 50%;
      top: 5px;
      width: 56px;
      height: 4px;
      transform: translateX(-50%);
      border-radius: 999px;
      background: rgba(143,145,148,0.75);
    }

    #${PANEL_ID} .cp-resize-handle:hover::before {
      background: var(--ah-text-soft);
    }

    #${PANEL_ID} .cp-section {
      margin-bottom: 10px;
    }

    #${PANEL_ID} .cp-section:last-child {
      margin-bottom: 0;
    }

    #${PANEL_ID} .cp-section-title {
      margin: 2px 0 8px;
      padding: 5px 8px;
      border-left: 4px solid var(--ah-stripe);
      border-radius: 6px;
      background: var(--ah-fill-hover);
      font-size: 11px;
      font-weight: 700;
      color: var(--ah-text);
    }

    #${PANEL_ID} .cp-band-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: -2px 0 8px;
    }

    #${PANEL_ID} .cp-band-button {
      padding: 3px 7px;
      border-radius: 999px;
      font-size: 10px;
      color: var(--ah-muted);
      background: var(--ah-fill);
      border: 1px solid rgba(143,145,148,0.25);
    }

    #${PANEL_ID} .cp-band-button:hover {
      border-color: rgba(143,145,148,0.65);
    }

    #${PANEL_ID} .cp-band-button.active {
      color:var(--ah-on-stripe);
      background: var(--ah-stripe);
      border-color: var(--ah-stripe);
      outline: none;
    }

    #${PANEL_ID} .cp-item {
      padding: 10px;
      border-radius: 10px;
      background: var(--ah-fill);
      border: 1px solid var(--ah-line);
      margin-bottom: 8px;
    }

    #${PANEL_ID} .cp-item:last-child {
      margin-bottom: 0;
    }

    #${PANEL_ID} .cp-item-head {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
    }

    #${PANEL_ID} .cp-item-title {
      font-size:11px;
      color: var(--ah-text);
    }

    #${PANEL_ID} .cp-item-meta {
      margin-top: 2px;
      font-size: 10px;
      color: var(--ah-muted);
    }

    #${PANEL_ID} .cp-item-text {
      font-size: 11px;
      color: var(--ah-muted);
      white-space: pre-wrap;
      margin-bottom: 8px;
    }

    #${PANEL_ID} .cp-item-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: nowrap;
    }

    #${PANEL_ID} .cp-item-actions-left,
    #${PANEL_ID} .cp-item-actions-right {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    #${PANEL_ID} .cp-item-actions-left {
      flex: 0 0 auto;
    }

    #${PANEL_ID} .cp-item-actions-right {
      flex: 1 1 auto;
      justify-content: flex-end;
    }

    #${PANEL_ID} .cp-icon-btn {
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border-radius: 7px;
      color: var(--ah-muted);
    }

    #${PANEL_ID} .cp-icon-btn svg {
      width: 17px;
      height: 17px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.9;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    #${PANEL_ID} .cp-icon-btn-primary {
      width: 34px;
      background: var(--ah-stripe);
      color:var(--ah-on-stripe);
      border-color: var(--ah-stripe);
    }

    #${PANEL_ID} .cp-icon-btn-primary:hover {
      background: var(--ah-stripe-hover);
      color:var(--ah-on-stripe);
    }

    #${PANEL_ID} .cp-icon-btn-danger {
      color: #ffccd4;
      background: #4c1720;
    }

    #${PANEL_ID} .cp-icon-btn-danger:hover {
      background: #8b1e2d;
    }

    #${PANEL_ID} .cp-action-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    #${PANEL_ID} .cp-action-btn {
      min-height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      font-size: 12px;
      font-weight: 600;
    }

    #${PANEL_ID} .cp-action-btn svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    #${PANEL_ID} .cp-action-secondary {
      color: var(--ah-text-soft);
      background: var(--ah-fill);
      border-color: rgba(143,145,148,0.32);
    }

    #${PANEL_ID} .cp-action-secondary:hover {
      background: var(--ah-line);
      border-color: rgba(143,145,148,0.65);
    }

    #${PANEL_ID} .cp-action-primary {
      color:var(--ah-on-stripe);
      background: var(--ah-stripe);
      border-color: var(--ah-stripe);
    }

    #${PANEL_ID} .cp-action-primary:hover {
      background: var(--ah-stripe-hover);
      border-color: var(--ah-stripe-hover);
      color:var(--ah-on-stripe);
    }

    #${PANEL_ID} .cp-btn-primary {
padding: 4px 8px;
  background: var(--ah-stripe);
  color:var(--ah-on-stripe);
  font-size: 11pt;

  border: 1px solid var(--ah-stripe);
}

    #${PANEL_ID} .cp-btn-primary:hover {
  background: var(--ah-stripe-hover);
  color:var(--ah-on-stripe);
}

    #${PANEL_ID} .cp-btn-wide {
      width: 100%;
      justify-content: center;
    }

    #${PANEL_ID} .cp-btn-small {
      padding: 4px 8px;
      font-size: 11px;
      background: var(--ah-bg);
      color: var(--ah-muted);
      border: 1px solid var(--ah-line);
    }

    #${PANEL_ID} .cp-btn-small:hover {
      background: var(--ah-fill-hover);
    }

    #${PANEL_ID} .cp-btn-danger {
      background: #8b1e2d;
      color: #fff2f4;
      border: 1px solid var(--ah-line);
    }

    #${PANEL_ID} .cp-btn-danger:hover {
      background: #a32437;
    }

    #${PANEL_ID} input[type="file"] {
      display: none;
    }

    #${PANEL_ID} details.cp-import-export,
    #${PANEL_ID} details.cp-mode-details {
      border-top: 1px solid var(--ah-line);
      padding-top: 10px;
    }

    #${PANEL_ID} .cp-message {
      margin-top: 8px;
      color: var(--ah-success-700);
      font-size: 11px;
    }

  `;

  document.head.appendChild(style);
}

  function bindDragging(panel, handle) {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let origX = 0;
    let origY = 0;

    handle.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, input, textarea, select')) return;

      bringPanelToFront(panel);
      dragging = true;
      panel.classList.add('dragging');

      const rect = panel.getBoundingClientRect();
      origX = rect.left;
      origY = rect.top;
      startX = e.clientX;
      startY = e.clientY;

      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;

      const nextX = origX + (e.clientX - startX);
      const nextY = origY + (e.clientY - startY);

      panel.style.left = `${Math.max(0, nextX)}px`;
      panel.style.top = `${Math.max(0, nextY)}px`;
      panel.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      panel.classList.remove('dragging');

      const rect = panel.getBoundingClientRect();
      updatePanelPosition(rect.left, rect.top);
    });

    if (panel.dataset.resizeClampBound !== '1') {
      window.addEventListener('resize', () => clampPanelToViewport(panel, true));
      panel.dataset.resizeClampBound = '1';
    }
  }

  function getMaxCommentListHeight(panel, list) {
    const margin = 24;
    const panelRect = panel.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const belowList = Math.max(0, panelRect.bottom - listRect.bottom);
    const available = window.innerHeight - listRect.top - belowList - margin;
    return Math.max(MIN_COMMENT_LIST_HEIGHT, available);
  }

  function bindCommentListResize(panel, list, handle) {
    handle.addEventListener('mousedown', (event) => {
      bringPanelToFront(panel);

      const startY = event.clientY;
      const startHeight = list.getBoundingClientRect().height;

      const onMove = (moveEvent) => {
        const maxHeight = getMaxCommentListHeight(panel, list);
        const nextHeight = Math.min(
          Math.max(MIN_COMMENT_LIST_HEIGHT, startHeight + moveEvent.clientY - startY),
          maxHeight
        );
        list.style.maxHeight = `${nextHeight}px`;
      };

      const onUp = () => {
        const currentHeight = Math.round(list.getBoundingClientRect().height);
        updateCommentListHeight(currentHeight);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      event.preventDefault();
    });
  }

  function openSnippetEditor(existing = null) {
    state.editingSnippet = existing ? normalizeSnippet(existing) : {
      id: '',
      title: '',
      body: '',
      gradeBand: getGradeBandFilter() === 'All' ? DEFAULT_GRADE_BAND : getGradeBandFilter(),
      category: getCategoryFilter() === 'All categories' ? DEFAULT_CATEGORY : getCategoryFilter(),
      isStarter: false
    };
    renderPanel();
  }

  function closeSnippetEditor() {
    state.editingSnippet = null;
    renderPanel();
  }

  function getSnippetFormValues(form) {
    const body = cleanField(form.querySelector('[name="body"]')?.value);
    return {
      title: cleanText(form.querySelector('[name="title"]')?.value) || makeSnippetTitle(body),
      body,
      gradeBand: normalizeGradeBand(form.querySelector('[name="gradeBand"]')?.value),
      category: normalizeCategory(form.querySelector('[name="category"]')?.value),
      isStarter: !!form.querySelector('[name="isStarter"]')?.checked
    };
  }

  function renderSnippetEditor() {
    if (!state.editingSnippet) return null;

    const editing = state.editingSnippet;
    const isExisting = !!editing.id;
    const form = createElement('form', { class: 'cp-row' }, [
      createElement('div', { class: 'cp-row' }, [
        createElement('label', { for: 'cp-snippet-title', text: 'Title' }),
        createElement('input', {
          id: 'cp-snippet-title',
          name: 'title',
          type: 'text',
          value: isExisting ? getSnippetTitle(editing) : cleanText(editing.title)
        })
      ]),
      createElement('div', { class: 'cp-row' }, [
        createElement('label', { for: 'cp-snippet-body', text: 'Comment' }),
        createElement('textarea', {
          id: 'cp-snippet-body',
          name: 'body',
          text: getSnippetBody(editing)
        })
      ]),
      createElement('div', { class: 'cp-row cp-grid' }, [
        createElement('div', {}, [
          createElement('label', { for: 'cp-snippet-grade', text: 'Grade band' }),
          createElement('select', {
            id: 'cp-snippet-grade',
            name: 'gradeBand'
          }, createSelectOptions(GRADE_BANDS, normalizeGradeBand(editing.gradeBand)))
        ]),
        createElement('div', {}, [
          createElement('label', { for: 'cp-snippet-category', text: 'Category' }),
          createElement('input', {
            id: 'cp-snippet-category',
            name: 'category',
            type: 'text',
            value: normalizeCategory(editing.category)
          })
        ])
      ]),
      createElement('div', { class: 'cp-row' }, [
        createElement('label', { class: 'cp-check' }, [
          createElement('input', {
            name: 'isStarter',
            type: 'checkbox',
            checked: editing.isStarter ? 'checked' : null
          }),
          'Starter comment'
        ])
      ]),
      createElement('div', { class: 'cp-grid' }, [
        createElement('button', {
          class: 'cp-btn-primary',
          type: 'submit',
          text: isExisting ? 'Save snippet' : 'Add snippet'
        }),
        createElement('button', {
          type: 'button',
          text: 'Cancel',
          onclick: closeSnippetEditor
        })
      ])
    ]);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const values = getSnippetFormValues(form);
      if (!values.body) {
        alert('Add comment text before saving this snippet.');
        return;
      }

      state.editingSnippet = null;
      if (isExisting) updateSnippet(editing.id, values);
      else addSnippet(values);
    });

    return form;
  }

  function renderSnippetItem(snippet) {
    const title = getSnippetTitle(snippet);
    const body = getSnippetBody(snippet);

    return createElement('div', { class: 'cp-item' }, [
      createElement('div', { class: 'cp-item-head' }, [
        createElement('div', {}, [
          createElement('div', { class: 'cp-item-title', text: title }),
          createElement('div', {
            class: 'cp-item-meta',
            text: `${normalizeGradeBand(snippet.gradeBand)} · ${normalizeCategory(snippet.category)}`
          })
        ])
      ]),
      createElement('div', { class: 'cp-item-text', text: body }),
      createElement('div', { class: 'cp-item-actions' }, [
        createElement('div', { class: 'cp-item-actions-left' }, [
          createIconButton({
            icon: 'insert',
            label: 'Insert snippet',
            className: 'cp-icon-btn-primary',
            onclick: () => insertSnippet(body)
          })
        ]),
        createElement('div', { class: 'cp-item-actions-right' }, [
          createIconButton({
            icon: 'copy',
            label: 'Copy snippet',
            onclick: () => copySnippetToClipboard(body)
          }),
          createIconButton({
            icon: 'edit',
            label: 'Edit snippet',
            onclick: () => openSnippetEditor(snippet)
          }),
          createIconButton({
            icon: 'delete',
            label: 'Delete snippet',
            className: 'cp-icon-btn-danger',
            onclick: () => deleteSnippet(snippet.id)
          })
        ])
      ])
    ]);
  }

  function getBandOptionsForSnippets(snippets) {
    return GRADE_BANDS.filter(band =>
      snippets.some(snippet => normalizeGradeBand(snippet.gradeBand) === band)
    );
  }

  function renderSupportingBandButtons(snippets, activeBand) {
    const bandOptions = getBandOptionsForSnippets(snippets);
    if (!bandOptions.length) return null;

    return createElement('div', { class: 'cp-band-buttons' }, [
      createElement('button', {
        class: `cp-band-button ${activeBand === 'All' ? 'active' : ''}`,
        type: 'button',
        text: 'All',
        title: 'Show all supporting comments',
        onclick: () => updateGradeBandFilter('All')
      }),
      ...bandOptions.map(band =>
        createElement('button', {
          class: `cp-band-button ${activeBand === band ? 'active' : ''}`,
          type: 'button',
          text: band,
          title: `Show ${band} supporting comments`,
          onclick: () => updateGradeBandFilter(band)
        })
      )
    ]);
  }

  function renderSnippetSection(title, snippets, extraChildren = []) {
    if (!snippets.length) return null;
    return createElement('div', { class: 'cp-section' }, [
      createElement('div', { class: 'cp-section-title', text: title }),
      ...extraChildren.filter(Boolean),
      ...snippets.map(renderSnippetItem)
    ]);
  }

  function renderPanel() {
    if (!document.body) return;

    addStyles();

    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement('div');
      panel.id = PANEL_ID;
      panel.classList.add('ah-panel', 'ah-scope');
      document.body.appendChild(panel);
    }
    elements.panel = panel;
    if (panel.dataset.frontBound !== '1') {
      panel.addEventListener('mousedown', () => bringPanelToFront(panel), true);
      panel.dataset.frontBound = '1';
    }

    const collapsed = getCollapsed();
    const mode = getMode();
    const snippets = getSnippets();
    const gradeBandFilter = getGradeBandFilter();
    const categoryOptions = getCategoryOptions(snippets);
    const categoryFilter = categoryOptions.includes(getCategoryFilter())
      ? getCategoryFilter()
      : 'All categories';
    const filteredSnippets = snippets.filter(snippet => {
      const gradeMatches =
        gradeBandFilter === 'All' || normalizeGradeBand(snippet.gradeBand) === gradeBandFilter;
      const categoryMatches =
        categoryFilter === 'All categories' || normalizeCategory(snippet.category) === categoryFilter;
      return gradeMatches && categoryMatches;
    });
    const categoryFilteredSupportingSnippets = snippets.filter(snippet => {
      const categoryMatches =
        categoryFilter === 'All categories' || normalizeCategory(snippet.category) === categoryFilter;
      return !snippet.isStarter && categoryMatches;
    });
    const starterSnippets = filteredSnippets.filter(snippet => snippet.isStarter);
    const supportingSnippets = filteredSnippets.filter(snippet => !snippet.isStarter);
    const commentListHeight = getCommentListHeight();

    panel.innerHTML = '';

    const head = createElement('div', {
  class: 'cp-head',
  style: collapsed ? 'border-bottom:0;' : ''
}, [
      createElement('div', { class: 'cp-head-title', text: 'Copy/Paster' }),
      createElement('div', { class: 'cp-head-buttons' }, [
        createElement('button', {
          class: 'cp-panel-toggle',
          type: 'button',
          title: collapsed ? 'Expand' : 'Minimise',
          'aria-label': collapsed ? 'Expand Copy/Paster' : 'Minimise Copy/Paster',
          html: iconSvg(collapsed ? 'maximize' : 'minimize'),
          onclick: () => updateCollapsed(!collapsed)
        })
      ])
    ]);

    panel.appendChild(head);

    const pos = getPanelPosition();
    if (pos.x != null && pos.y != null) {
      panel.style.left = `${pos.x}px`;
      panel.style.top = `${pos.y}px`;
      panel.style.right = 'auto';
      clampPanelToViewport(panel, true);
    }

    bindDragging(panel, head);

    if (collapsed) return;

    const body = createElement('div', { class: 'cp-body' });

body.appendChild(
  createElement('div', {
    class: 'cp-row cp-small',
    style: 'background:var(--ah-bg);border:1px solid var(--ah-line);border-radius:10px;padding:10px;'
  }, [
    formatClassAssignmentInfo()
  ])
);

    body.appendChild(
      createElement('div', { class: 'cp-row cp-grid' }, [
        createElement('div', {}, [
          createElement('label', { for: 'cp-grade-filter', text: 'Grade band' }),
          createElement('select', {
            id: 'cp-grade-filter',
            onchange: (event) => updateGradeBandFilter(event.target.value)
          }, createSelectOptions(['All', ...GRADE_BANDS], gradeBandFilter))
        ]),
        createElement('div', {}, [
          createElement('label', { for: 'cp-category-filter', text: 'Category' }),
          createElement('select', {
            id: 'cp-category-filter',
            onchange: (event) => updateCategoryFilter(event.target.value)
          }, createSelectOptions(['All categories', ...categoryOptions], categoryFilter))
        ])
      ])
    );

    const editor = renderSnippetEditor();
    if (editor) body.appendChild(editor);

const list = createElement('div', {
  class: 'cp-row cp-list',
  style: `max-height:${commentListHeight}px;`
});

if (!snippets.length) {
  list.appendChild(
    createElement('div', { class: 'cp-item' }, [
      createElement('div', { class: 'cp-item-text', text: 'No snippets yet.' })
    ])
  );
} else if (!filteredSnippets.length) {
  list.appendChild(
    createElement('div', { class: 'cp-item' }, [
      createElement('div', { class: 'cp-item-text', text: 'No snippets match these filters.' })
    ])
  );
} else {
  const starterSection = renderSnippetSection('Starter comments', starterSnippets);
  const supportingSection = renderSnippetSection('Supporting comments', supportingSnippets, [
    renderSupportingBandButtons(categoryFilteredSupportingSnippets, gradeBandFilter)
  ]);
  if (starterSection) list.appendChild(starterSection);
  if (supportingSection) list.appendChild(supportingSection);
}

    body.appendChild(list);

    const resizeHandle = createElement('div', {
      class: 'cp-resize-handle',
      title: 'Drag to resize comment list',
      'aria-label': 'Drag to resize comment list'
    });
    bindCommentListResize(panel, list, resizeHandle);
    body.appendChild(resizeHandle);

body.appendChild(
  createElement('div', { class: 'cp-row cp-action-row' }, [
    createElement('button', {
      class: 'cp-action-btn cp-action-primary',
      html: `${iconSvg('plus')}<span>Add snippet</span>`,
      onclick: () => openSnippetEditor()
    }),
    createElement('button', {
      class: 'cp-action-btn cp-action-secondary',
      html: `${iconSvg('write')}<span>Keep typing</span>`,
      onclick: () => {
        const ok = focusEditorAtEndWithNewLine();
        if (!ok) alert('Could not find the comment editor.');
      }
    })
  ])
);

    body.appendChild(
      createElement('details', { class: 'cp-row cp-mode-details' }, [
        createElement('summary', { text: 'Mode' }),
        createElement('div', { class: 'cp-row cp-small', style: 'margin-top:10px;' }, [
          'Append adds below existing text. Replace overwrites it.'
        ]),
        createElement('div', { class: 'cp-row cp-grid', style: 'margin-bottom:0;' }, [
        createElement('button', {
          class: mode === 'append' ? 'active' : '',
          text: 'Append mode',
          onclick: () => updateMode('append')
        }),
        createElement('button', {
          class: mode === 'replace' ? 'active' : '',
          text: 'Replace mode',
          onclick: () => updateMode('replace')
        })
      ])
      ])
    );

    const fileInput = createElement('input', {
      type: 'file',
      accept: '.csv,text/csv,application/json'
    });
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) handleImportData(file);
      e.target.value = '';
    });

    const importExport = createElement('details', {
      class: 'cp-row cp-import-export',
      open: getImportExportOpen() ? 'open' : null
    }, [
      createElement('summary', { text: 'Import / export' }),
      fileInput,
      createElement('div', {
        class: 'cp-grid-3',
        style: 'margin-top:10px;'
      }, [
        createElement('button', {
          type: 'button',
          class: 'cp-icon-btn',
          title: 'Export CSV',
          'aria-label': 'Export CSV',
          html: iconSvg('download'),
          onclick: handleExportData
        }),
        createElement('button', {
          type: 'button',
          class: 'cp-icon-btn',
          title: 'Import CSV',
          'aria-label': 'Import CSV',
          html: iconSvg('upload'),
          onclick: () => fileInput.click()
        }),
        createElement('button', {
          type: 'button',
          class: 'cp-btn-danger',
          text: 'Reset',
          onclick: resetAssignmentSnippets
        })
      ]),
      state.importMessage
        ? createElement('div', { class: 'cp-message', text: state.importMessage })
        : null
    ]);
    importExport.addEventListener('toggle', () => updateImportExportOpen(importExport.open));
    body.appendChild(importExport);

    panel.appendChild(body);
  }

  function init() {
    const tryRender = () => {
      if (!document.body) {
        setTimeout(tryRender, 250);
        return;
      }
      renderPanel();
    };

    tryRender();
    setTimeout(renderPanel, 1500);
    setTimeout(renderPanel, 3500);

    setInterval(() => {
      if (location.href !== state.lastHref) {
        state.lastHref = location.href;
        setTimeout(renderPanel, 250);
      }
    }, 400);

    const observer = new MutationObserver(() => {
      if (!document.getElementById(PANEL_ID)) {
        renderPanel();
      }
    });

    const startObserver = () => {
      if (!document.body) {
        setTimeout(startObserver, 300);
        return;
      }
      observer.observe(document.body, { childList: true, subtree: true });
    };

    startObserver();
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

  function showRegisteredPanel(render = renderPanel) {
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

  function toggleRegisteredPanel(render = renderPanel) {
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
        showRegisteredPanel(renderPanel);
      },
      hide: hideRegisteredPanel,
      toggle() {
        toggleRegisteredPanel(renderPanel);
      },
      isOpen: isRegisteredPanelOpen
    });
  }


  registerAssessmentHelper();
  init();
})();
