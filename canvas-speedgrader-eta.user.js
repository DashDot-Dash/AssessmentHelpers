// ==UserScript==
// @name         Assessment Helpers - ETA
// @namespace    AssessmentHelpers
// @version      1.2.21
// @description  Assessment Helpers panel for estimating Canvas SpeedGrader marking time and logging sessions
// @match        https://*/courses/*/gradebook/speed_grader*
// @updateURL    https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-eta.user.js
// @downloadURL  https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-eta.user.js
// @resource     princeFacingRight https://raw.githubusercontent.com/DashDot-Dash/AssessmentHelpers/main/Assets/PrinceFacingRight.png
// @resource     princeFacingLeft https://raw.githubusercontent.com/DashDot-Dash/AssessmentHelpers/main/Assets/PrinceFacingLeft.png
// @resource     princeDieLeft https://raw.githubusercontent.com/DashDot-Dash/AssessmentHelpers/main/Assets/PrinceDieLeft.png
// @resource     princeDieRight https://raw.githubusercontent.com/DashDot-Dash/AssessmentHelpers/main/Assets/PrinceDieRight.png

// @grant        GM_getResourceURL
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

  // Estimates SpeedGrader marking time and logs local session timing data.

  // constants/config
  const HELPER_ID = 'eta';
  const HELPER_NAME = 'ETA';
  const PANEL_ID = 'ah-eta-panel';
  const Z_INDEX_BASE = 100000;
  const STORAGE_PREFIX = 'assessmentHelpers:eta:v1';
  const POSITION_KEY = `${STORAGE_PREFIX}:panelPosition`;
  const MAX_VALID_SECONDS = 20 * 60;
  const MIN_VALID_SECONDS = 15;
  const ROLLING_COUNT = 5;
  const STYLE_ID = 'ah-eta-style';
  const PANEL_WIDTH = 340;

  // selectors
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
    ].join(',')
  };

  // state
  const state = {
    currentStudentKey: null,
    currentStartTime: null,
    currentAccumulatedSeconds: 0,
    currentActiveSegments: [],
    currentStudentLabel: '',
    currentGroupId: '',
    currentGroupName: '',
    currentVisitStartedAt: null,
    lastSeenUrl: location.href,
    lastRenderedSignature: '',
    tickInterval: null,
    navInterval: null,
    contextInterval: null,
    lastContextSignature: '',
    drag: null,
    princeWidget: null,
    lastProgressRatio: 0,
  };

  // elements
  const elements = {};

  function getAssignmentKey() {
    const url = new URL(window.location.href);
    const courseMatch = url.pathname.match(/\/courses\/(\d+)\//);
    const assignmentId = url.searchParams.get('assignment_id') || 'unknown_assignment';
    const courseId = courseMatch ? courseMatch[1] : 'unknown_course';
    return `${courseId}_${assignmentId}`;
  }

  function getAssignmentId() {
    const url = new URL(window.location.href);
    return url.searchParams.get('assignment_id') || url.searchParams.get('assignment') || 'unknown_assignment';
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
      const text = getAssignmentTextFromElement(document.querySelector(selector));
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
      '#ah-eta-panel',
      '#assessment-helper-dock',
      '#sg-benchmarker-panel',
      '#ah-tutorial-sorter-panel',
      '#vc-gradebridge-panel',
      '#sg-copypaster-panel'
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

function formatClassAssignmentInfo(info = null) {
  const metadata = info?.metadata || {};
  const classInfo = info?.source === 'local_group'
    ? [
        [metadata.day, metadata.time].filter(Boolean).join(' '),
        metadata.location
      ].filter(Boolean).join(' · ')
    : '';
  const assignmentName = getAssignmentName();

  return [classInfo, assignmentName].filter(Boolean).join(' | ');
}

  function getStorageKey(prefix = STORAGE_PREFIX) {
    return `${prefix}:${getAssignmentKey()}`;
  }

  function getStoredJson() {
    return window.AssessmentHelpersCompatibility.read(getStorageKey());
  }

  function defaultData() {
    return {
      timings: [],
      completedStudentKeys: [],
      entries: [],
      breaks: [],
      activeBreak: null,
      minimized: false,
      princeOpen: true,
      blockGapMinutes: 10,
      expectedMarkingBand: 'under10',
      sessionStartedAt: Date.now()
    };
  }

  function loadData() {
    try {
      return { ...defaultData(), ...(JSON.parse(getStoredJson()) || {}) };
    } catch {
      return defaultData();
    }
  }

  function publishLoggingStatus() {
    window.dispatchEvent(new CustomEvent('assessment-eta-status', {
      detail: JSON.stringify({ paused: !!loadData().activeBreak })
    }));
  }

  function getCurrentElapsedSeconds() {
    return state.currentAccumulatedSeconds + (state.currentStartTime ? (Date.now() - state.currentStartTime) / 1000 : 0);
  }

  function handleBreakToggle() {
    detectStudentChange();
    const data = loadData();
    const now = Date.now();
    if (data.activeBreak) {
      const paused = data.activeBreak;
      data.breaks.push({ started_at: formatISO(paused.startedAt), logged_at: formatISO(now),
        elapsed_seconds: Math.round((now - paused.startedAt) / 1000), type: 'break',
        tutorial_group_id: paused.tutorial_group_id || '', tutorial_group_name: paused.tutorial_group_name || '' });
      const sameVisit = paused.studentKey === state.currentStudentKey && (paused.tutorial_group_id || '') === state.currentGroupId;
      state.currentAccumulatedSeconds = sameVisit ? paused.accumulatedSeconds : 0;
      state.currentActiveSegments = sameVisit ? (paused.activeSegments || []) : [];
      if (!sameVisit) state.currentVisitStartedAt = now;
      state.currentStartTime = state.currentStudentKey ? now : null;
      data.activeBreak = null;
    } else {
      data.activeBreak = { startedAt: now, studentKey: state.currentStudentKey,
        accumulatedSeconds: getCurrentElapsedSeconds(), activeSegments: getCurrentActiveSegments(now),
        tutorial_group_id: state.currentGroupId, tutorial_group_name: state.currentGroupName, studentStartedAt: state.currentVisitStartedAt || state.currentStartTime };
      state.currentAccumulatedSeconds = data.activeBreak.accumulatedSeconds;
      state.currentActiveSegments = data.activeBreak.activeSegments;
      state.currentStartTime = null;
    }
    saveData(data);
    renderPanel(true);
  }

  // Summary intervals use milliseconds; exported durations remain seconds.
  function mergeLogIntervals(intervals) {
    const merged = [];
    for (const [start, end] of intervals.filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a).sort((a, b) => a[0] - b[0])) {
      const last = merged[merged.length - 1];
      if (last && start <= last[1]) last[1] = Math.max(last[1], end);
      else merged.push([start, end]);
    }
    return merged;
  }

  function subtractLogBreaks(intervals, breaks) {
    let remaining = intervals;
    for (const [pauseStart, pauseEnd] of breaks) {
      remaining = remaining.flatMap(([start, end]) => {
        if (pauseEnd <= start || pauseStart >= end) return [[start, end]];
        const pieces = [];
        if (pauseStart > start) pieces.push([start, pauseStart]);
        if (pauseEnd < end) pieces.push([pauseEnd, end]);
        return pieces;
      });
    }
    return remaining;
  }

  function getExpectedMarkingBand(data) {
    const bands = {
      under10: { label: 'Under 10 minutes', upper: 600, reviewLimit: 1800, initialPace: 600 },
      tenToThirty: { label: '10–30 minutes', upper: 1800, reviewLimit: 5400, initialPace: 1200 },
      over30: { label: '30+ minutes', upper: Infinity, reviewLimit: 10800, initialPace: 2700 }
    };
    return { ...(bands[data.expectedMarkingBand] || bands.under10), key: bands[data.expectedMarkingBand] ? data.expectedMarkingBand : 'under10' };
  }

  function getLogSummary(data, options = {}) {
    const groupId = options.groupId || '';
    const timeBand = getExpectedMarkingBand(data);
    const inGroup = entry => !groupId || !entry.tutorial_group_id || entry.tutorial_group_id === groupId;
    const gapMs = Math.max(1, Number(data.blockGapMinutes) || 10) * 60000;
    const breaks = mergeLogIntervals((data.breaks || []).filter(inGroup).map(entry => [Date.parse(entry.started_at), Date.parse(entry.logged_at)]));
    if (data.activeBreak && inGroup(data.activeBreak)) breaks.push([data.activeBreak.startedAt, options.now ?? Date.now()]);
    const reviews = [], included = [], students = new Map();
    let unassigned = 0;
    (data.entries || []).forEach((entry, index) => {
      if (!inGroup(entry)) return;
      if (groupId && !entry.tutorial_group_id) unassigned++;
      const start = Date.parse(entry.started_at), end = Date.parse(entry.logged_at);
      const elapsed = Number(entry.elapsed_seconds);
      const recordedSegments = Array.isArray(entry.active_segments) && entry.active_segments.length;
      let segments = recordedSegments
        ? entry.active_segments.map(segment => [Date.parse(segment.started_at), Date.parse(segment.ended_at)])
        : [[start, end]];
      segments = mergeLogIntervals(subtractLogBreaks(mergeLogIntervals(segments), breaks));
      const activeMs = segments.reduce((sum, [a, b]) => sum + b - a, 0);
      const valid = Number.isFinite(elapsed) && elapsed > 0 && Number.isFinite(start) && Number.isFinite(end) && end > start && activeMs > 0;
      const abandoned = valid && !recordedSegments && Math.abs(activeMs / 1000 - elapsed) > 60;
      const reasons = [];
      if (!valid) reasons.push('Invalid timing');
      else {
        if (elapsed < 60) reasons.push('Short visit');
        if (elapsed > timeBand.upper) reasons.push('Over expected time');
        if (elapsed > timeBand.reviewLimit) reasons.push('Very long timer: review');
        if (abandoned) reasons.push('Timer span needs review');
      }
      const selected = valid && (typeof entry.summary_included === 'boolean' ? entry.summary_included : elapsed >= MIN_VALID_SECONDS && elapsed <= timeBand.reviewLimit && !abandoned);
      const key = entry.student_key || entry.student_label || '';
      reviews.push({ entry, index, valid, included: selected, reasons, segments });
      if (!selected) return;
      included.push(...segments);
      if (key) {
        const student = students.get(key) || { key, intervals: [], lastSeen: 0 };
        student.intervals.push(...segments);
        student.lastSeen = Math.max(student.lastSeen, end);
        students.set(key, student);
      }
    });
    const intervals = mergeLogIntervals(included);
    const blocks = [];
    for (const interval of intervals) {
      const previous = blocks[blocks.length - 1];
      const explicitPause = previous && breaks.some(([a, b]) => a >= previous.end && b <= interval[0] && b > a);
      if (!previous || interval[0] - previous.end > gapMs || explicitPause) {
        blocks.push({ start: interval[0], end: interval[1], intervals: [interval] });
      } else {
        previous.end = Math.max(previous.end, interval[1]);
        previous.intervals.push(interval);
      }
    }
    const day = value => new Intl.DateTimeFormat('en-CA', { timeZone: options.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
    const sameDayGaps = [];
    for (let i = 1; i < blocks.length; i++) {
      if (day(blocks[i - 1].end) === day(blocks[i].start)) sameDayGaps.push((blocks[i].start - blocks[i - 1].end) / 1000);
    }
    const studentTimes = [...students.values()].map(student => ({ ...student,
      seconds: mergeLogIntervals(student.intervals).reduce((sum, [a, b]) => sum + (b - a) / 1000, 0) }));
    for (const block of blocks) {
      block.students = studentTimes.filter(student => student.intervals.some(([a, b]) => a < block.end && b > block.start)).length;
    }
    const activeSeconds = intervals.reduce((sum, [a, b]) => sum + (b - a) / 1000, 0);
    const recentTimes = studentTimes.sort((a, b) => a.lastSeen - b.lastSeen).slice(-ROLLING_COUNT).map(student => student.seconds);
    const typicalBreak = median(sameDayGaps);
    const studentsPerBlock = median(blocks.map(block => block.students).filter(Boolean));
    return {
      reviews, blocks, studentTimes, unassigned, timeBand, gapMinutes: gapMs / 60000,
      studentCount: students.size,
      visitCount: reviews.filter(review => review.included).length,
      reviewCount: reviews.filter(review => review.reasons.length).length,
      activeSeconds,
      startedAt: blocks[0]?.start ?? null,
      endedAt: blocks[blocks.length - 1]?.end ?? null,
      averageStudentSeconds: students.size ? activeSeconds / students.size : null,
      averageBlockSeconds: average(blocks.map(block => (block.end - block.start) / 1000)),
      typicalBreak,
      sameDayGaps,
      recentPace: median(recentTimes),
      studentsPerBlock
    };
  }

  function getSummaryEta(summary, remaining, fallback = null) {
    const pace = summary.recentPace || fallback;
    if (remaining == null || pace == null) return null;
    const breaksAhead = summary.typicalBreak && summary.studentsPerBlock
      ? Math.floor(Math.max(0, remaining - 1) / Math.max(1, summary.studentsPerBlock)) : 0;
    return remaining * pace + breaksAhead * (summary.typicalBreak || 0);
  }

  function summaryDate(value) {
    return value == null ? '—' : new Date(value).toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  function summaryHtml(summary, info) {
    const period = summary.startedAt != null ? `${summaryDate(summary.startedAt)} – ${summaryDate(summary.endedAt)}` : 'No marking visits included yet.';
    return `<div class="ah-eta-summary">
      <div class="ah-eta-muted">${escapeHtml(period)}</div>
      <div class="ah-eta-stats-grid ah-eta-stats-secondary">
        ${stat('Students visited', summary.studentCount, 'secondary')}
        ${stat('Marking blocks', summary.blocks.length, 'secondary')}
        ${stat('Active marking', formatDuration(summary.activeSeconds), 'secondary')}
        ${stat('Per student', formatDuration(summary.averageStudentSeconds), 'secondary')}
        ${stat('Average block', formatDuration(summary.averageBlockSeconds), 'secondary')}
        ${stat('Typical break', formatDuration(summary.typicalBreak), 'secondary')}
      </div>
      <div class="ah-eta-muted">Blocks split at explicit pauses or gaps over ${summary.gapMinutes} minutes. Typical break is the median same-day gap; overnight gaps are excluded. Revisited students count once. ${info.source === 'local_group' && summary.unassigned ? 'Earlier visits without class tags are included.' : ''}</div>
      <details class="ah-eta-block-list"><summary>Marking blocks</summary>
        ${summary.blocks.map(block => `<div class="ah-eta-summary-row">${escapeHtml(summaryDate(block.start))} · ${escapeHtml(formatDuration((block.end - block.start) / 1000))} · ${block.students} students visited</div>`).join('') || '<div class="ah-eta-muted">No blocks yet.</div>'}
      </details>
    </div>`;
  }

  function getCurrentVisitMetadata() {
    const context = getLocalGroupContext();
    return { label: getCurrentStudentDisplayName(), groupId: context?.active_group_id || '', groupName: context?.active_group_name || '' };
  }

  function captureVisitMetadata() {
    const metadata = getCurrentVisitMetadata();
    state.currentStudentLabel = metadata.label;
    state.currentGroupId = metadata.groupId;
    state.currentGroupName = metadata.groupName;
  }

  function getCurrentActiveSegments(now = Date.now()) {
    const segments = [...state.currentActiveSegments];
    if (state.currentStartTime && now > state.currentStartTime) segments.push({ started_at: formatISO(state.currentStartTime), ended_at: formatISO(now) });
    return segments;
  }

  function timelineHtml(data) {
    const events = [...data.entries.map(entry => ({ ...entry, type: 'marking' })), ...data.breaks];
    if (data.activeBreak) events.push({ type: 'break', started_at: formatISO(data.activeBreak.startedAt),
      elapsed_seconds: (Date.now() - data.activeBreak.startedAt) / 1000, ongoing: true });
    events.sort((a, b) => Date.parse(a.started_at) - Date.parse(b.started_at));
    return events.map(entry => `<div style="padding:5px 0;border-bottom:1px solid var(--ah-fill-hover);">${escapeHtml(formatClock(Date.parse(entry.started_at)))} · ${escapeHtml(entry.type === 'break' ? 'Break' : entry.student_label || entry.student_key)} · ${escapeHtml(formatDuration(entry.elapsed_seconds))}${entry.ongoing ? ' (ongoing)' : ''}</div>`).join('') || 'No activity logged yet.';
  }

  function saveData(data) {
    localStorage.setItem(getStorageKey(), JSON.stringify(data));
    publishLoggingStatus();
  }

  function getPanelPosition() {
    try {
      const pos = JSON.parse(window.AssessmentHelpersCompatibility.read(POSITION_KEY));
      if (pos && Number.isFinite(pos.left) && Number.isFinite(pos.top)) return pos;
    } catch {}
    return { top: 80, right: 18 };
  }

  function savePanelPosition(left, top) {
    localStorage.setItem(POSITION_KEY, JSON.stringify({ left, top }));
  }

  function clampPanelToViewport(panel, persist = false) {
    if (!panel) return;
    const margin = 8;
    const rect = panel.getBoundingClientRect();
    const width = rect.width || PANEL_WIDTH;
    const height = rect.height || 80;
    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - height - margin);
    const left = Math.min(Math.max(margin, rect.left), maxLeft);
    const top = Math.min(Math.max(margin, rect.top), maxTop);

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.right = 'auto';

    if (persist) savePanelPosition(left, top);
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
    function cleanText(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
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

function bringPanelToFront(panel) {
  if (!panel) return;
  const current = Number(window.__canvasAssessmentPanelZIndex || Z_INDEX_BASE);
  const next = current + 1;
  window.__canvasAssessmentPanelZIndex = next;
  panel.style.zIndex = String(next);
}

function getCurrentStudentDisplayName() {
  const selectedStudentEl = document.querySelector(selectors.selectedStudent);
  const selectedStudentText = cleanText(selectedStudentEl?.textContent || '');
  if (selectedStudentText) return selectedStudentText;

  const triggerEl = document.querySelector(selectors.studentSelectTrigger);
  const triggerText = cleanText(triggerEl?.textContent || '');
  if (triggerText) {
    const cleanedTrigger = triggerText.replace(/^●\s*/, '').trim();
    if (cleanedTrigger) return cleanedTrigger;
  }

  return '';
}

function getCurrentStudentKey() {
  const url = new URL(window.location.href);
  const byParam =
    url.searchParams.get('student_id') ||
    url.searchParams.get('student_ids') ||
    url.searchParams.get('user_id') ||
    url.searchParams.get('anonymous_id');

  if (byParam) return `id:${byParam}`;

  const displayName = getCurrentStudentDisplayName();
  if (displayName) return `name:${normalizeName(displayName)}`;

  return 'unknown_student';
}

function isUsableStudentKey(key) {
  return !!key && key !== 'unknown_student';
}

function getLocalGroupContext() {
  try {
    const raw = window.AssessmentHelpersCompatibility.read('assessmentHelpers:tutorialSorter:v1:context');

    if (!raw) return null;

    const context = JSON.parse(raw);
    if (!context) return null;

    const courseMatch = location.pathname.match(/\/courses\/(\d+)\//);
    const currentCourseKey = courseMatch ? courseMatch[1] : 'unknown_course';

    if (context.course_key && context.course_key !== currentCourseKey) {
      return null;
    }

    return context;
  } catch {
    return null;
  }
}

function getLocalGroupContextSignature() {
  const context = getLocalGroupContext();
  if (!context) return '';
  return JSON.stringify({
    course_key: context.course_key || '',
    active_group_id: context.active_group_id || '',
    current_index_in_group: context.current_index_in_group,
    matched_count: context.matched_count,
    remaining_in_group: context.remaining_in_group,
    updated_at: context.updated_at || ''
  });
}

  function getStudentListInfo() {
    const context = getLocalGroupContext();

    if (
      context &&
      context.active_group_id &&
      Number.isFinite(context.matched_count)
    ) {
      const total = context.matched_count;
      const currentIndex =
        Number.isFinite(context.current_index_in_group) ? context.current_index_in_group : null;
      const remaining =
        Number.isFinite(context.remaining_in_group) ? context.remaining_in_group : null;

      return {
        source: 'local_group',
        groupName: context.active_group_name || '',
        metadata: context.metadata || {},
        total,
        done: currentIndex != null && currentIndex >= 0 ? currentIndex : null,
        currentIndex,
        remaining
      };
    }

    const gradedEl = document.querySelector('[data-testid="graded-students-count"]');
    if (gradedEl) {
      const text = gradedEl.textContent.trim();
      const match = text.match(/^(\d+)\s*\/\s*(\d+)$/);

      if (match) {
        const done = parseInt(match[1], 10);
        const total = parseInt(match[2], 10);

        return {
          source: 'canvas',
          groupName: '',
          metadata: {},
          total,
          done,
          currentIndex: done,
          remaining: Math.max(0, total - done)
        };
      }
    }

    return {
      source: 'unknown',
      groupName: '',
      metadata: {},
      total: null,
      done: null,
      currentIndex: null,
      remaining: null
    };
  }

  function getProgressInfo(info, data) {
    const total = Number.isFinite(info.total) ? info.total : null;
    const contextualDone =
      info.source === 'local_group' && info.currentIndex != null
        ? info.currentIndex + 1
        : info.done;
    const loggedDone = new Set(data.completedStudentKeys.filter(isUsableStudentKey)).size;
    const completed = Math.max(0, contextualDone ?? loggedDone);
    const done = total != null ? Math.min(total, completed) : completed;

    return {
      total,
      done,
      visibleDone: done,
      ratio: total > 0 ? done / total : 0
    };
  }

  function average(arr) {
    if (!arr.length) return null;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function median(arr) {
    if (!arr.length) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function rollingAverage(arr, count = ROLLING_COUNT) {
    if (!arr.length) return null;
    return average(arr.slice(-count));
  }

  function formatDuration(seconds) {
    if (seconds == null || !isFinite(seconds)) return '—';
    seconds = Math.max(0, Math.round(seconds));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function formatClock(timestamp) {
    if (!timestamp || !isFinite(timestamp)) return '—';
    return new Date(timestamp).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).replace(/\s+/g, '').toLowerCase();
  }

  function formatISO(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toISOString();
  }

  function csvEscape(value) {
    const str = String(value ?? '');
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  }

function getButtonCss() {
  return 'ah-eta-btn';
}

function getQuietButtonCss() {
  return 'ah-eta-btn-quiet';
}

function getDangerButtonCss() {
  return 'ah-eta-btn-danger';
}

function stat(label, value, variant = '') {
  return `
    <div class="ah-eta-stat ${variant ? `ah-eta-stat-${variant}` : ''}">
      <div class="ah-eta-stat-label">${escapeHtml(label)}</div>
      <div class="ah-eta-stat-value">${escapeHtml(String(value))}</div>
    </div>
  `;
}

function updateCurrentElapsedDisplay() {
  const elapsedEl = document.querySelector(`#${PANEL_ID} #ah-eta-current-elapsed`);
  if (!elapsedEl) return;
  elapsedEl.textContent = loadData().activeBreak ? 'On break' : formatDuration(getCurrentElapsedSeconds());
  const timeline = document.querySelector(`#${PANEL_ID} #ah-eta-timeline`);
  if (timeline && loadData().activeBreak) timeline.innerHTML = timelineHtml(loadData());
}

const PRINCE_RIGHT_FALLBACK_URL = 'https://raw.githubusercontent.com/DashDot-Dash/AssessmentHelpers/main/Assets/PrinceFacingRight.png';
const PRINCE_LEFT_FALLBACK_URL = 'https://raw.githubusercontent.com/DashDot-Dash/AssessmentHelpers/main/Assets/PrinceFacingLeft.png';
const PRINCE_DIE_RIGHT_FALLBACK_URL = 'https://raw.githubusercontent.com/DashDot-Dash/AssessmentHelpers/main/Assets/PrinceDieRight.png';
const PRINCE_DIE_LEFT_FALLBACK_URL = 'https://raw.githubusercontent.com/DashDot-Dash/AssessmentHelpers/main/Assets/PrinceDieLeft.png';

function getResourceUrl(name, fallbackUrl) {
  try {
    if (typeof GM_getResourceURL === 'function') {
      return GM_getResourceURL(name) || fallbackUrl;
    }
  } catch {}
  return fallbackUrl;
}

const PRINCE_RIGHT_URL = getResourceUrl('princeFacingRight', PRINCE_RIGHT_FALLBACK_URL);
const PRINCE_LEFT_URL = getResourceUrl('princeFacingLeft', PRINCE_LEFT_FALLBACK_URL);
const PRINCE_DIE_RIGHT_URL = getResourceUrl('princeDieRight', PRINCE_DIE_RIGHT_FALLBACK_URL);
const PRINCE_DIE_LEFT_URL = getResourceUrl('princeDieLeft', PRINCE_DIE_LEFT_FALLBACK_URL);

function createPrinceProgressWidget() {
  const FRAME_W = 40;
  const FRAME_H = 47;
  const DIE_FRAME_W = 29;
  const DIE_FRAME_H = 43;

  const SHEETS = {
    right: { url: PRINCE_RIGHT_URL, frameW: FRAME_W, frameH: FRAME_H, cols: 7, rows: 7 },
    left: { url: PRINCE_LEFT_URL, frameW: FRAME_W, frameH: FRAME_H, cols: 7, rows: 7 },
    dieRight: { url: PRINCE_DIE_RIGHT_URL, frameW: DIE_FRAME_W, frameH: DIE_FRAME_H, cols: 6, rows: 1 },
    dieLeft: { url: PRINCE_DIE_LEFT_URL, frameW: DIE_FRAME_W, frameH: DIE_FRAME_H, cols: 6, rows: 1 }
  };

  function hasSpriteSheets() {
    return Boolean(SHEETS.right.url && SHEETS.left.url);
  }

  const clips = {
    idle: [
      "right:r1c1"
    ],

    drink: [
      "right:r5c7",
      "right:r6c1", "right:r6c2", "right:r6c3", "right:r6c4", "right:r6c5", "right:r6c6", "right:r6c7",
      "right:r7c1", "right:r7c2", "right:r7c3", "right:r7c4", "right:r7c5"
    ],

    runRight: [
      "right:r1c5", "right:r1c6", "right:r1c7",
      "right:r2c1", "right:r2c2", "right:r2c3", "right:r2c4"
    ],

    turnLeftAtEnd: [
      "right:r2c5", "right:r2c6", "right:r2c7",
      "right:r3c1", "right:r3c2", "right:r3c3", "right:r3c4", "right:r3c5", "right:r3c6", "right:r3c7",
      "right:r4c1", "right:r4c2", "right:r4c3"
    ],

    runLeft: [
      "left:r1c5", "left:r1c6", "left:r1c7",
      "left:r2c1", "left:r2c2", "left:r2c3", "left:r2c4"
    ],

    jumpMarker: [
      "left:r4c6", "left:r4c7",
      "left:r5c1", "left:r5c2", "left:r5c3", "left:r5c4", "left:r5c5"
    ],

    turnRightAtStart: [
      "left:r2c5", "left:r2c6", "left:r2c7",
      "left:r3c1", "left:r3c2", "left:r3c3", "left:r3c4", "left:r3c5", "left:r3c6", "left:r3c7",
      "left:r4c1", "left:r4c2", "left:r4c3"
    ],

    runRightShort: [
      "right:r1c6", "right:r1c7",
      "right:r2c1", "right:r2c2", "right:r2c3", "right:r2c4", "right:r1c5"
    ],

    slideToStop: [
      "right:r2c6", "right:r2c7",
      "right:r3c1", "right:r3c2", "right:r3c3", "right:r3c4"
    ],

    settleIdle: [
      "right:r1c1"
    ],
    collapse: [
      "dieRight:r1c1",
      "dieRight:r1c2",
      "dieRight:r1c3",
      "dieRight:r1c4",
      "dieRight:r1c5",
      "dieRight:r1c6"
    ]
  };

  const config = {
    scale: 1,
    width: Math.max(140, elements.panel?.querySelector('#ah-eta-prince-slot')?.clientWidth || (elements.panel?.clientWidth || PANEL_WIDTH) - 24),
    barHeight: 8,
    markerSize: 0,
    paddingX: 12,
    paddingTop: 10,
    paddingBottom: 10,
    anchorRatio: 0.5,
    turnTravel: 34,
    jumpOffset: 60,
    restOffset: 18,
    preRestOffset: 56,
    collapseOffsetX: -29
  };

  const DISPLAY_W = FRAME_W * config.scale;
  const DISPLAY_H = FRAME_H * config.scale;

  const widget = document.createElement('div');
  widget.style.cssText = `
    position: relative;
    width: ${config.width}px;
    height: ${Math.ceil(DISPLAY_H + config.paddingTop + config.paddingBottom + 8)}px;
    overflow: visible;
    user-select: none;
    margin: 0;
  `;

  const bar = document.createElement('div');
  bar.style.cssText = `
    position: absolute;
    left: ${config.paddingX}px;
    right: ${config.paddingX}px;
    bottom: ${config.paddingBottom}px;
    height: ${config.barHeight}px;
    background: var(--ah-prince-track, var(--ah-fill));
    border-radius: 999px;
    box-shadow: inset 0 0 0 1px var(--ah-line);
  `;

  const fill = document.createElement('div');
  fill.style.cssText = `
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0%;
    background: linear-gradient(to right, var(--ah-success-fill-a), var(--ah-success-fill-b));
    border-radius: 999px;
    transition: width 0.18s linear;
  `;

  const marker = document.createElement('div');
  marker.style.cssText = `
    position: absolute;
    top: 50%;
    width: ${config.markerSize}px;
    height: ${config.markerSize}px;
    margin-top: -${config.markerSize / 2}px;
    border-radius: 50%;
    background: #f3d36c;
    transform: translateX(-50%);
    box-shadow: 0 0 0 2px rgba(0,0,0,0.15);
  `;

  const sprite = document.createElement('div');
  sprite.style.cssText = `
    position: absolute;
    width: ${DISPLAY_W}px;
    height: ${DISPLAY_H}px;
    left: 0;
    top: 0;
    background-repeat: no-repeat;
    background-position: 0 0;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    pointer-events: none;
  `;

  //fill.appendChild(marker);
  bar.appendChild(fill);
  widget.appendChild(bar);
  widget.appendChild(sprite);

  const barLeft = config.paddingX;
  const barWidth = config.width - (config.paddingX * 2);
  const barStartX = barLeft;
  const barEndX = barLeft + barWidth;
  const spriteBaseY = Math.ceil(DISPLAY_H * 0.15);
  let activeDisplayW = DISPLAY_W;

let currentProgress = 0;
let busy = false;
let isCollapsed = false;

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function progressToX(progress) {
    return barLeft + (barWidth * progress);
  }

  function parseFrameLabel(label) {
    const match = label.match(/^(right|left|dieRight|dieLeft):r(\d+)c(\d+)$/);
    if (!match) throw new Error(`Bad frame label: ${label}`);
    return {
      sheet: match[1],
      row: Number(match[2]),
      col: Number(match[3])
    };
  }

  function setFrame(label) {
    const { sheet, row, col } = parseFrameLabel(label);
    const sheetConfig = SHEETS[sheet];
    const displayW = sheetConfig.frameW * config.scale;
    const displayH = sheetConfig.frameH * config.scale;
    const bgX = -((col - 1) * displayW);
    const bgY = -((row - 1) * displayH);
    activeDisplayW = displayW;
    sprite.style.width = `${displayW}px`;
    sprite.style.height = `${displayH}px`;
    sprite.style.backgroundImage = `url("${sheetConfig.url}")`;
    sprite.style.backgroundSize = `${displayW * sheetConfig.cols}px ${displayH * sheetConfig.rows}px`;
    sprite.style.backgroundPosition = `${bgX}px ${bgY}px`;
  }

  function setSpriteX(x) {
    sprite.style.left = `${Math.round(x - (activeDisplayW * config.anchorRatio))}px`;
  }

  function setSpriteY(y) {
    sprite.style.top = `${Math.round(y)}px`;
  }

  function setBarProgress(progress) {
    const p = Math.max(0, Math.min(1, progress));
    fill.style.width = `${p * 100}%`;
    marker.style.left = `${p * 100}%`;
  }

  async function playClip(frames, frameMs = 100, loop = 1) {
    for (let l = 0; l < loop; l++) {
      for (const frame of frames) {
        setFrame(frame);
        await sleep(frameMs);
      }
    }
  }

  async function moveLinear(fromX, toX, durationMs, onUpdate) {
    return new Promise(resolve => {
      const startTime = performance.now();

      function tick(now) {
        const t = Math.min(1, (now - startTime) / durationMs);
        const x = fromX + ((toX - fromX) * t);
        onUpdate(t, x);

        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          resolve();
        }
      }

      requestAnimationFrame(tick);
    });
  }

  async function runClip(frames, fromX, toX, durationMs, frameMs = 80) {
    let i = 0;
    setFrame(frames[0]);

    const frameTimer = setInterval(() => {
      i = (i + 1) % frames.length;
      setFrame(frames[i]);
    }, frameMs);

    await moveLinear(fromX, toX, durationMs, (_t, x) => {
      setSpriteX(x);
      setSpriteY(spriteBaseY);
    });

    clearInterval(frameTimer);
    setFrame(frames[i]);
  }

  async function jumpClip(frames, fromX, toX, durationMs, jumpHeight = 20, frameMs = 60) {
    let i = 0;
    setFrame(frames[0]);

    const frameTimer = setInterval(() => {
      i = (i + 1) % frames.length;
      setFrame(frames[i]);
    }, frameMs);

    await moveLinear(fromX, toX, durationMs, (t, x) => {
      const arc = 4 * jumpHeight * t * (1 - t);
      setSpriteX(x);
      setSpriteY(spriteBaseY - arc);
    });

    clearInterval(frameTimer);
    setSpriteY(spriteBaseY);
    setFrame(frames[i]);
  }

  async function collapseAtCurrentPosition() {
    if (busy || isCollapsed) return;

    isCollapsed = true;
    const collapseX = progressToX(currentProgress) + config.restOffset + config.collapseOffsetX;

    setFrame(clips.collapse[0]);
    setSpriteX(collapseX);
    setSpriteY(spriteBaseY);

    await playClip(clips.collapse, 120, 1);

    setFrame(clips.collapse[clips.collapse.length - 1]);
  }

  async function playMovingThenStaticClip(frames, fromX, toX, frameMs = 100, moveFraction = 0.25) {
    const moveFrameCount = Math.max(1, Math.round(frames.length * moveFraction));

    await new Promise(resolve => {
      const startTime = performance.now();
      const durationMs = moveFrameCount * frameMs;
      let frameIndex = 0;

      setFrame(frames[0]);

      const timer = setInterval(() => {
        if (frameIndex < moveFrameCount) {
          setFrame(frames[frameIndex]);
          frameIndex++;
        }
      }, frameMs);

      function tick(now) {
        const t = Math.min(1, (now - startTime) / durationMs);
        const x = fromX + ((toX - fromX) * t);
        setSpriteX(x);
        setSpriteY(spriteBaseY);

        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          clearInterval(timer);
          resolve();
        }
      }

      requestAnimationFrame(tick);
    });

    for (let i = moveFrameCount; i < frames.length; i++) {
      setFrame(frames[i]);
      await sleep(frameMs);
    }

    setSpriteX(toX);
    setSpriteY(spriteBaseY);
  }

  function placeAtProgress(progress) {
  currentProgress = Math.max(0, Math.min(1, progress));
  setBarProgress(currentProgress);

  if (isCollapsed) {
    return;
  }

  setSpriteX(progressToX(currentProgress));
  setSpriteY(spriteBaseY);

  if (SHEETS.right.url) {
    setFrame(clips.idle[0]);
  }
}

  function reviveIfCollapsed() {
  if (!isCollapsed) return;

  isCollapsed = false;
  setSpriteY(spriteBaseY);
  setFrame(clips.idle[0]);
}

async function celebrateTo(newProgress) {
  newProgress = Math.max(0, Math.min(1, newProgress));

  if (busy) return;

  if (!hasSpriteSheets()) {
    setBarProgress(newProgress);
    currentProgress = newProgress;
    return;
  }

  busy = true;
  reviveIfCollapsed();

  const oldX = progressToX(currentProgress);
  const markerX = progressToX(newProgress);

  // rightward run stops a bit before the end so the turn clip can slide into place
  const runRightEndX = barEndX - config.turnTravel;

  // final resting position near the marker
 const finalStopX = markerX;

  // stop the leftward run short so the final turn can slide into the stop
  const runLeftEndX = finalStopX + config.turnTravel;

  setSpriteX(oldX);
  setSpriteY(spriteBaseY);

  await playClip(clips.drink, 120, 1);

  await runClip(clips.runRight, oldX, runRightEndX, 1200, 120);
  await playMovingThenStaticClip(clips.turnLeftAtEnd, runRightEndX, barEndX, 95, 1);

  setBarProgress(newProgress);

  await runClip(clips.runLeft, barEndX, runLeftEndX, 950, 85);
  await playMovingThenStaticClip(clips.turnRightAtStart, runLeftEndX, finalStopX, 95, 1);

  await playClip(clips.settleIdle, 150, 1);

  currentProgress = newProgress;
  setSpriteX(finalStopX);
  setSpriteY(spriteBaseY);
  setFrame(clips.idle[0]);

  busy = false;
}

  placeAtProgress(0);

 return {
  el: widget,
  setProgress(progress) {
    if (busy) return;
    placeAtProgress(progress);
  },
  celebrateTo,
  isBusy() {
    return busy;
  },
  maybeCollapse(elapsedSeconds, medianSeconds) {
    if (
      busy ||
      isCollapsed ||
      elapsedSeconds == null ||
      !medianSeconds ||
      !isFinite(medianSeconds) ||
      medianSeconds <= 0
    ) {
      return;
    }

    if (elapsedSeconds >= medianSeconds) {
      collapseAtCurrentPosition();
    }
  }
};
}

    function addStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${PANEL_ID}.ah-eta-dragging {
      opacity: 0.9;
      user-select: none;
    }

    #${PANEL_ID} .ah-eta-header--border {
      border-bottom:1px solid var(--ah-line);
    }

    #${PANEL_ID} .ah-eta-muted {
      font-size:11px;
      color:var(--ah-muted);
    }

    #${PANEL_ID} .ah-eta-stats-grid {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:8px 12px;
    }

    #${PANEL_ID} .ah-eta-stats-primary {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 5px;
      margin-bottom: 6px;
    }

    #${PANEL_ID} .ah-eta-stats-secondary {
      gap: 8px;
      margin-bottom: 8px;
    }

    #${PANEL_ID} .ah-eta-stat {
      background:var(--ah-bg);
      border:1px solid var(--ah-line);
      border-radius:10px;
      padding:8px 10px;
    }

    #${PANEL_ID} .ah-eta-stat-label {
      font-size:11px;
      color:var(--ah-muted);
      margin-bottom:3px;
    }

    #${PANEL_ID} .ah-eta-stat-value {
      font-weight:700;
      font-size:14px;
      color:var(--ah-text);
    }

    #${PANEL_ID} .ah-eta-stat-primary {
      background:var(--ah-fill);
      border-color:rgba(255,255,255,0.10);
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:4px;
      padding:6px;
      border-radius:7px;
      min-width:0;
      white-space:nowrap;
    }

    #${PANEL_ID} .ah-eta-stat-primary .ah-eta-stat-label {
      margin-bottom:0;
      font-size:10px;
    }

    #${PANEL_ID} .ah-eta-stat-primary .ah-eta-stat-value {
      font-size:12px;
    }

    #${PANEL_ID} .ah-eta-stat-primary .ah-eta-stat-label,
    #${PANEL_ID} .ah-eta-stat-primary .ah-eta-stat-value {
      color:var(--ah-text);
    }

    #${PANEL_ID} .ah-eta-stat-secondary {
      background:var(--ah-bg);
      border-color:rgba(255,255,255,0.04);
    }

    #${PANEL_ID} .ah-eta-stat-secondary .ah-eta-stat-value {
      color:var(--ah-text-soft);
      font-size:13px;
    }

    #${PANEL_ID} .ah-eta-details {
      margin-top: 5px;
      background:var(--ah-fill);
      border:1px solid var(--ah-line);
      border-radius:7px;
      padding:4px 8px;
    }

    #${PANEL_ID} .ah-eta-button-row {
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      margin-top:12px;
    }

    #${PANEL_ID} .ah-eta-btn-quiet:hover {
      background:var(--ah-fill-hover);
    }

    #${PANEL_ID} .ah-eta-icon-btn {
      min-width: 36px;
      display: inline-grid;
      place-items: center;
    }

    #${PANEL_ID} .ah-eta-icon-btn svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    #${PANEL_ID} .ah-eta-btn-danger {
  appearance:none;
  -webkit-appearance:none;
  border-radius:8px;
  padding:4px 8px;
  cursor:pointer;
  font-size:11px;
  font-weight:400;
  background:#8b1e2d;
  color:#fff2f4;
  border:1px solid var(--ah-line);
}

    #${PANEL_ID} .ah-eta-btn-danger:hover {
  background:#a32437;
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
  panel.id = PANEL_ID;
      panel.classList.add('ah-panel', 'ah-scope');

  const pos = getPanelPosition();
  panel.style.cssText = `
    position: fixed;
    top: ${pos.top != null ? `${pos.top}px` : '80px'};
    ${pos.left != null ? `left:${pos.left}px;` : 'right:18px;'}

    z-index: ${Z_INDEX_BASE};

    overflow: hidden;
    user-select: none;
  `;

  document.body.appendChild(panel);
  addStyles();
  elements.panel = panel;
  bringPanelToFront(panel);
  clampPanelToViewport(panel, true);
  if (panel.dataset.frontBound !== '1') {
    panel.addEventListener('mousedown', () => bringPanelToFront(panel), true);
    panel.dataset.frontBound = '1';
  }
  return panel;
}

  function attachDragging(panel) {
    if (panel.dataset.dragBound === '1') return;
    panel.dataset.dragBound = '1';

    panel.addEventListener('mousedown', (e) => {
      const handle = e.target.closest('.ah-eta-drag-handle');
      const clickable = e.target.closest('button');
      if (!handle || clickable) return;

      bringPanelToFront(panel);
      const rect = panel.getBoundingClientRect();
      state.drag = {
        startX: e.clientX,
        startY: e.clientY,
        panelLeft: rect.left,
        panelTop: rect.top
      };

      panel.classList.add('ah-eta-dragging');
      document.body.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!state.drag) return;

      const dx = e.clientX - state.drag.startX;
      const dy = e.clientY - state.drag.startY;
      const left = Math.max(8, state.drag.panelLeft + dx);
      const top = Math.max(8, state.drag.panelTop + dy);

      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      panel.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (!state.drag) return;
      const rect = panel.getBoundingClientRect();
      savePanelPosition(rect.left, rect.top);
      state.drag = null;
      panel.classList.remove('ah-eta-dragging');
      document.body.style.cursor = '';
    });

    if (panel.dataset.resizeClampBound !== '1') {
      window.addEventListener('resize', () => clampPanelToViewport(panel, true));
      panel.dataset.resizeClampBound = '1';
    }
  }

function panelToggleIcon(expand) {
  const path = '<path d="M6 12h12"></path>';
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${path}</svg>`;
}

function actionIcon(name) {
  const paths = {
    download: '<path d="M12 4v12"></path><path d="M7 11l5 5l5 -5"></path><path d="M20 16v4a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1v-4"></path>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name] || ''}</svg>`;
}

function renderPanel(force = false, options = {}) {
  const panel = ensurePanel();
  const loggingWasOpen = !!panel.querySelector('.ah-eta-details')?.open;
  const openSections = new Map(Array.from(panel.querySelectorAll('.ah-eta-details details'), detail => [detail.className, detail.open]));
  attachDragging(panel);

  const data = loadData();
  if (force && state.princeWidget?.isBusy?.() && !data.minimized && data.princeOpen) {
    updateCurrentElapsedDisplay();
    window.setTimeout(() => renderPanel(true, options), 300);
    return;
  }

  const info = getStudentListInfo();
  const progressInfo = getProgressInfo(info, data);

  const avg = average(data.timings);
  const med = median(data.timings);
  const rolling = rollingAverage(data.timings);
  const context = getLocalGroupContext();
  const summary = getLogSummary(data, { groupId: context?.active_group_id });
  const remaining = info.remaining;
  const total = progressInfo.total;
  const progressRatio = progressInfo.ratio;


  const etaSeconds = getSummaryEta(summary, remaining, (!data.entries.length && (rolling || med || avg)) || summary.timeBand.initialPace);
  const finishAt = etaSeconds != null && !data.activeBreak ? Date.now() + etaSeconds * 1000 : null;

  const visibleDone = progressInfo.visibleDone;

  const signature = JSON.stringify({
    minimized: data.minimized,
    princeOpen: data.princeOpen,
    count: data.timings.length,
    entries: data.entries.length,
    breaks: data.breaks.length,
    paused: !!data.activeBreak,
    rolling: Math.round(rolling || 0),
    med: Math.round(med || 0),
    remaining,
    eta: Math.round(etaSeconds || 0),
    source: info.source,
    groupName: info.groupName,
    displayContext: formatClassAssignmentInfo(info),
    total,
    done: visibleDone,
    density: window.AssessmentHelpersTheme.get().density
  });

  if (!force && signature === state.lastRenderedSignature) {
    updateCurrentElapsedDisplay();
    if (state.princeWidget) {
      state.princeWidget.setProgress(progressRatio);
      const currentElapsedSeconds = state.currentStartTime
        ? Math.round(getCurrentElapsedSeconds())
        : null;
      state.princeWidget.maybeCollapse(currentElapsedSeconds, med);
    }
    return;
  }

  state.lastRenderedSignature = signature;

  if (data.minimized) {
    panel.innerHTML = `
      <div class="ah-eta-drag-handle ah-eta-header" style="align-items:center;">
        <div class="ah-eta-title">ETA</div>
        <button id="ah-eta-toggle" class="${getQuietButtonCss()} ah-eta-panel-toggle" title="Expand" aria-label="Expand ETA">${panelToggleIcon(true)}</button>
      </div>
    `;
    panel.querySelector('#ah-eta-toggle')?.addEventListener('click', handleToggleMinimize);
    return;
  }

 panel.innerHTML = `
  <div class="ah-eta-drag-handle ah-eta-header ah-eta-header--border">
    <div>
      <div class="ah-eta-title">ETA</div>
    </div>
    <div style="display:flex;gap:6px;">
      <button id="ah-eta-toggle" class="${getQuietButtonCss()} ah-eta-panel-toggle" title="Minimise" aria-label="Minimise ETA">${panelToggleIcon(false)}</button>
    </div>
  </div>

  <div class="ah-eta-body">
  <div class="ah-eta-muted" style="margin-bottom:8px;">
    ${escapeHtml(formatClassAssignmentInfo(info))}
  </div>
  <div style="font-size:10px;color:var(--ah-muted);">
    <div class="ah-eta-stats-grid ah-eta-stats-primary">
      ${stat('ETA', formatClock(finishAt), 'primary')}
      ${stat(window.AssessmentHelpersTheme.isCompact() ? 'Done' : 'Completed', visibleDone, 'primary')}
      ${stat(window.AssessmentHelpersTheme.isCompact() ? 'Left' : 'Remaining', remaining ?? '—', 'primary')}
    </div>

    <details class="ah-eta-prince-disclosure" ${data.princeOpen ? 'open' : ''}>
      <summary>Prince</summary>
      <div id="ah-eta-prince-slot" class="ah-eta-prince-stage"></div>
    </details>

    <details class="ah-eta-details" ${loggingWasOpen ? 'open' : ''}>
      <summary>Logging</summary>
      <label class="ah-eta-expected-setting" for="ah-eta-expected-band">Expected marking time
        <select id="ah-eta-expected-band">${[['under10', 'Under 10 minutes'], ['tenToThirty', '10–30 minutes'], ['over30', '30+ minutes']].map(([key, label]) => `<option value="${key}" ${key === summary.timeBand.key ? 'selected' : ''}>${label}</option>`).join('')}</select>
      </label>
      ${summaryHtml(summary, info)}
      <div class="ah-eta-muted" style="margin-top:6px;">
        Current student: <span id="ah-eta-current-elapsed">${data.activeBreak ? 'On break' : formatDuration(getCurrentElapsedSeconds())}</span><br>
        ${summary.visitCount} included visits · ${summary.reviewCount} visits flagged for review.<br>
        ${summary.studentCount ? 'Finish estimate uses recent student timings and typical same-day breaks.' : `Initial ETA is a guide using ${formatDuration(summary.timeBand.initialPace)} per student until timings are available.`} Navigation records visits, not confirmed grades.
      </div>

      <div class="ah-eta-button-row">
        <button id="ah-eta-log" class="${getButtonCss()}" ${data.activeBreak ? 'disabled' : ''}>Log now</button>
        <button id="ah-eta-export-csv" class="${getButtonCss()} ah-eta-icon-btn" title="Download raw CSV log" aria-label="Download raw CSV log">${actionIcon('download')}</button>
      </div>

<details class="ah-eta-raw-timeline"><summary>Raw timeline</summary><div class="ah-eta-muted" style="max-height:180px;overflow:auto;" id="ah-eta-timeline">${timelineHtml(data)}</div></details>
      <details class="ah-eta-review"><summary>Review visits</summary>
        <div class="ah-eta-muted">Untick navigation or abandoned timers. Raw records remain in the download. Visits under 15 seconds, over ${formatDuration(summary.timeBand.reviewLimit)}, or with inconsistent timer spans start excluded. Other visits remain included; exceeding the expected band only flags them for review.</div>
        <label class="ah-eta-gap-setting">New block after <select id="ah-eta-block-gap">${[5, 10, 15, 20, 30, 60].map(minutes => `<option value="${minutes}" ${minutes === summary.gapMinutes ? 'selected' : ''}>${minutes} minutes</option>`).join('')}</select> away</label>
        <div class="ah-eta-review-list">${summary.reviews.map(review => `<label class="ah-eta-review-row"><input type="checkbox" data-summary-index="${review.index}" ${review.valid ? '' : 'disabled'} ${review.included ? 'checked' : ''}><span>${escapeHtml(review.entry.student_label || review.entry.student_key || 'Unknown student')} · ${escapeHtml(formatDuration(review.entry.elapsed_seconds))}<small>${escapeHtml(review.reasons.join(' · '))}</small></span></label>`).join('')}</div>
      </details>

      <div style="display:flex;justify-content:flex-end;margin-top:8px;">
        <button id="ah-eta-reset" class="${getDangerButtonCss()}">Reset</button>
      </div>
    </details>
  </div>
  </div>
`;

panel.querySelectorAll('.ah-eta-details details').forEach(detail => { if (openSections.has(detail.className)) detail.open = openSections.get(detail.className); });
const princeSlot = panel.querySelector('#ah-eta-prince-slot');
state.princeWidget = null;
state.lastProgressRatio = progressRatio;
if (princeSlot && data.princeOpen) {
  state.princeWidget = createPrinceProgressWidget();
  princeSlot.appendChild(state.princeWidget.el);
  const previousProgress = options.previousProgress ?? progressRatio;
  const widget = state.princeWidget;
  state.lastProgressRatio = progressRatio;
  if (options.animateToProgress != null && progressRatio > previousProgress) {
    widget.setProgress(previousProgress);
    widget.celebrateTo(progressRatio).then(() => {
      if (state.princeWidget !== widget) return;
      const latest = getProgressInfo(getStudentListInfo(), loadData()).ratio;
      widget.setProgress(latest);
      state.lastProgressRatio = latest;
    });
  } else {
    widget.setProgress(progressRatio);
  }
}
  panel.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', () => clampPanelToViewport(panel, true)));
  panel.querySelector('#ah-eta-expected-band')?.addEventListener('change', event => {
    const saved = loadData();
    saved.expectedMarkingBand = event.target.value;
    saveData(saved);
    renderPanel(true);
  });
  panel.querySelector('#ah-eta-block-gap')?.addEventListener('change', event => {
    const saved = loadData();
    saved.blockGapMinutes = Number(event.target.value);
    saveData(saved);
    renderPanel(true);
  });
  panel.querySelectorAll('[data-summary-index]').forEach(input => input.addEventListener('change', () => {
    const saved = loadData();
    const entry = saved.entries[Number(input.dataset.summaryIndex)];
    if (entry) entry.summary_included = input.checked;
    saveData(saved);
    renderPanel(true);
  }));
  panel.querySelector('.ah-eta-prince-disclosure')?.addEventListener('toggle', handlePrinceDisclosure);
  panel.querySelector('#ah-eta-reset')?.addEventListener('click', handleResetSession);
  panel.querySelector('#ah-eta-toggle')?.addEventListener('click', handleToggleMinimize);
  panel.querySelector('#ah-eta-log')?.addEventListener('click', handleLogNow);
  panel.querySelector('#ah-eta-export-csv')?.addEventListener('click', handleExportCsv);
}

  function handlePrinceDisclosure(event) {
    const data = loadData();
    const open = event.currentTarget.open;
    if (data.princeOpen === open) return;
    data.princeOpen = open;
    saveData(data);
    renderPanel(true);
  }

  function handleToggleMinimize() {
    const data = loadData();
    data.minimized = !data.minimized;
    saveData(data);
    renderPanel(true);
  }

  function handleResetSession() {
    window.AssessmentHelpersCompatibility.remove(getStorageKey());
    const data = defaultData();
    state.currentAccumulatedSeconds = 0;
    state.currentActiveSegments = [];
    captureVisitMetadata();
    data.minimized = false;
    saveData(data);
    const currentKey = getCurrentStudentKey();
    state.currentStudentKey = isUsableStudentKey(currentKey) ? currentKey : null;
    state.currentStartTime = state.currentStudentKey ? Date.now() : null;
    state.currentVisitStartedAt = state.currentStartTime;
    renderPanel(true);
  }

  function createEntry(elapsedSeconds, mode = 'auto') {
    const now = Date.now();
    return {
      course_assignment: getAssignmentKey(),
      student_key: state.currentStudentKey,
      student_label: state.currentStudentLabel || getCurrentStudentDisplayName() || state.currentStudentKey,
      tutorial_group_id: state.currentGroupId,
      tutorial_group_name: state.currentGroupName,
      active_segments: getCurrentActiveSegments(now),
      expected_marking_band: getExpectedMarkingBand(loadData()).key,
      started_at: formatISO(state.currentVisitStartedAt || state.currentStartTime),
      logged_at: formatISO(now),
      elapsed_seconds: elapsedSeconds,
      elapsed_readable: formatDuration(elapsedSeconds),
      mode,
      type: 'marking'
    };
  }

  function addEntry(elapsedSeconds, mode = 'auto', allowPaused = false) {
    if (!state.currentStudentKey || !(state.currentVisitStartedAt || state.currentStartTime)) return false;
    if (loadData().activeBreak && !allowPaused) return false;

    const data = loadData();
    if (elapsedSeconds <= 0) return false;

    if (elapsedSeconds >= MIN_VALID_SECONDS && elapsedSeconds <= MAX_VALID_SECONDS) data.timings.push(elapsedSeconds);
    data.completedStudentKeys.push(state.currentStudentKey);
    data.entries.push(createEntry(elapsedSeconds, mode));
    saveData(data);
    return true;
  }

  function logCurrentStudentIfValid() {
    if (!state.currentStartTime && !state.currentAccumulatedSeconds) return false;
    const elapsed = Math.round(getCurrentElapsedSeconds());
    return addEntry(elapsed, 'auto', true);
  }

  function handleLogNow() {
    if (!state.currentStartTime) return;
    const elapsed = Math.round(getCurrentElapsedSeconds());
    const previousProgress = state.lastProgressRatio;
    const ok = addEntry(elapsed, 'manual');
    if (ok) {
      state.currentStartTime = Date.now();
      state.currentVisitStartedAt = state.currentStartTime;
      state.currentAccumulatedSeconds = 0;
      state.currentActiveSegments = [];
      const progressInfo = getProgressInfo(getStudentListInfo(), loadData());
      renderPanel(true, {
        previousProgress,
        animateToProgress: progressInfo.ratio
      });
    }
  }

  function handleExportCsv() {
    const data = loadData();
    const exportReviews = new Map(getLogSummary(data).reviews.map(review => [review.index, review]));
    const rows = [
      [
        'course_assignment',
        'student_key',
        'student_label',
        'started_at',
        'logged_at',
        'elapsed_seconds',
        'elapsed_readable',
        'mode',
        'type',
        'tutorial_group_id',
        'tutorial_group_name',
        'summary_included',
        'summary_review',
        'active_segments',
        'expected_marking_band'
      ],
      ...[...data.entries.map((entry, index) => ({ ...entry, type: 'marking', summary_included: exportReviews.get(index)?.included, summary_review: exportReviews.get(index)?.reasons.join('; ') })), ...data.breaks,
        ...(data.activeBreak ? [{ type: 'break', started_at: formatISO(data.activeBreak.startedAt), logged_at: formatISO(Date.now()),
          elapsed_seconds: Math.round((Date.now() - data.activeBreak.startedAt) / 1000), mode: 'ongoing',
          tutorial_group_id: data.activeBreak.tutorial_group_id || '', tutorial_group_name: data.activeBreak.tutorial_group_name || '' }] : [])]
        .sort((a, b) => Date.parse(a.started_at) - Date.parse(b.started_at)).map(entry => [
        entry.course_assignment || getAssignmentKey(),
        entry.student_key,
        entry.student_label,
        entry.started_at,
        entry.logged_at,
        entry.elapsed_seconds,
        entry.elapsed_readable || formatDuration(entry.elapsed_seconds),
        entry.mode || 'manual',
        entry.type,
        entry.tutorial_group_id || '',
        entry.tutorial_group_name || '',
        entry.summary_included ?? '',
        entry.summary_review || '',
        entry.active_segments ? JSON.stringify(entry.active_segments) : '',
        entry.expected_marking_band || ''
      ])
    ];

    const csv = rows.map(row => row.map(csvEscape).join(',')).join('\n');
    downloadFile(csv, `marking-log-${getAssignmentKey()}.csv`, 'text/csv;charset=utf-8;');
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

 function detectStudentChange() {
  const previousInfo = getStudentListInfo();
  const previousProgressInfo = getProgressInfo(previousInfo, loadData());
  const previousProgress = state.lastProgressRatio ?? previousProgressInfo.ratio;

  const newKey = getCurrentStudentKey();
  if (!isUsableStudentKey(newKey)) return false;

  if (!state.currentStudentKey) {
    state.currentStudentKey = newKey;
    state.currentStartTime = loadData().activeBreak ? null : Date.now();
    state.currentVisitStartedAt = state.currentStartTime;
    captureVisitMetadata();
    return false;
  }

  const groupId = getLocalGroupContext()?.active_group_id || '';
  if (newKey !== state.currentStudentKey || groupId !== state.currentGroupId) {
    const logged = logCurrentStudentIfValid();
    state.currentStudentKey = newKey;
    state.currentStartTime = loadData().activeBreak ? null : Date.now();
    state.currentVisitStartedAt = state.currentStartTime;
    state.currentAccumulatedSeconds = 0;
    state.currentActiveSegments = [];
    captureVisitMetadata();

    const newInfo = getStudentListInfo();
    const newProgressInfo = getProgressInfo(newInfo, loadData());
    const newProgress = newProgressInfo.ratio;

    renderPanel(true, logged || newProgress > previousProgress
      ? { previousProgress, animateToProgress: newProgress }
      : {});
    return true;
  }

  return false;
}

  function startLoops() {
    if (state.navInterval) clearInterval(state.navInterval);
    if (state.tickInterval) clearInterval(state.tickInterval);
    if (state.contextInterval) clearInterval(state.contextInterval);

    state.navInterval = setInterval(() => {
      if (location.href !== state.lastSeenUrl) {
        state.lastSeenUrl = location.href;
        setTimeout(() => {
          const rendered = detectStudentChange();
          if (!rendered) renderPanel(true);
        }, 350);
      } else {
        detectStudentChange();
      }
    }, 800);

    state.tickInterval = setInterval(() => {
      renderPanel(false);
    }, 1000);

    state.lastContextSignature = getLocalGroupContextSignature();
    state.contextInterval = setInterval(() => {
      const signature = getLocalGroupContextSignature();
      if (signature !== state.lastContextSignature) {
        state.lastContextSignature = signature;
        renderPanel(true);
      }
    }, 1200);
  }

  function init() {
    if (!document.body) return false;
    if (document.getElementById(PANEL_ID)) {
      if (!state.navInterval || !state.tickInterval) startLoops();
      return true;
    }
    const currentKey = getCurrentStudentKey();
    state.currentStudentKey = isUsableStudentKey(currentKey) ? currentKey : null;
    const paused = loadData().activeBreak;
    state.currentStartTime = !paused && state.currentStudentKey ? Date.now() : null;
    state.currentAccumulatedSeconds = paused?.studentKey === state.currentStudentKey ? paused.accumulatedSeconds : 0;
    state.currentVisitStartedAt = paused?.studentKey === state.currentStudentKey ? paused.studentStartedAt : state.currentStartTime;
    state.currentActiveSegments = paused?.studentKey === state.currentStudentKey ? (paused.activeSegments || []) : [];
    captureVisitMetadata();
    renderPanel(true);
    startLoops();
    return true;
  }

  function scheduleInit() {
    let attempts = 0;
    const maxAttempts = 12;

    function tryInit() {
      attempts += 1;
      if (init()) return;
      if (attempts < maxAttempts) setTimeout(tryInit, 500);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryInit, { once: true });
    } else {
      setTimeout(tryInit, 0);
    }

    const observer = new MutationObserver(() => {
      if (document.getElementById(PANEL_ID)) {
        observer.disconnect();
        return;
      }
      if (document.querySelector(selectors.selectedStudent) || document.querySelector(selectors.studentSelectTrigger)) {
        init();
        observer.disconnect();
      }
    });

    if (document.documentElement) {
      observer.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 8000);
    }
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

  function showRegisteredPanel(render = () => renderPanel(true)) {
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

  function toggleRegisteredPanel(render = () => renderPanel(true)) {
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
      isOpen: isRegisteredPanelOpen
    });
  }

  window.addEventListener('assessment-eta-status-request', publishLoggingStatus);
  window.addEventListener('assessment-eta-break-toggle', handleBreakToggle);
  let lastThemeDensity = window.AssessmentHelpersTheme.get().density;
  window.AssessmentHelpersTheme.onChange(settings => {
    const changed = settings.density !== lastThemeDensity;
    lastThemeDensity = settings.density;
    const panel = document.getElementById(PANEL_ID);
    if (changed && panel && panel.style.display !== 'none') renderPanel(true);
  });
  registerAssessmentHelper();
  publishLoggingStatus();
  scheduleInit();
})();
