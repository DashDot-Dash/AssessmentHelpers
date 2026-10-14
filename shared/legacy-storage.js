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
