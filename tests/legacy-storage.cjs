const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('shared/legacy-storage.js', 'utf8');

function storage(seed, failWrites = false) {
  const values = new Map(Object.entries(seed));
  return {
    values,
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { if (failWrites) throw new Error('Quota exceeded'); values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}
function load(store) {
  const context = vm.createContext({ window: {}, localStorage: store });
  vm.runInContext(source, context);
  return context.window.AssessmentHelpersCompatibility;
}

const roster = JSON.stringify({ courses: { COURSE: { classes: { group: { students: [{ name: 'Example student' }] } } } } });
const log = JSON.stringify({ entries: [{ student_key: '1', elapsed_seconds: 60 }], activeBreak: { startedAt: 123 }, expectedMarkingBand: 'over30' });
const store = storage({
  chatster_tutorial_sorter_groups_v11: roster,
  chatster_tutorial_sorter_active_group_v11: 'group',
  chatster_tutorial_sorter_context_v11: '{"version":11}',
  chatster_local_marking_group_context_v1: '{"version":1}',
  'chatster_canvas_menu_cache_v1:42': '{"student":"Example student"}',
  'canvas_speedgrader_when_will_it_end_v1:42_100': log,
  wwie_42_101: '{"entries":[]}',
  wwie_panel_position: '{"left":10,"top":20}',
  'Canvas:unrelated': 'leave intact'
});
const api = load(store);
assert.equal(store.getItem('assessmentHelpers:tutorialSorter:v1:groups'), roster);
assert.equal(store.getItem('assessmentHelpers:tutorialSorter:v1:activeGroup'), 'group');
assert.equal(store.getItem('assessmentHelpers:tutorialSorter:v1:context'), '{"version":11}');
assert.equal(store.getItem('assessmentHelpers:tutorialSorter:v1:canvasMenuCache:42'), '{"student":"Example student"}');
assert.equal(store.getItem('assessmentHelpers:eta:v1:42_100'), log);
assert.equal(store.getItem('assessmentHelpers:eta:v1:42_101'), '{"entries":[]}');
assert.equal(store.getItem('assessmentHelpers:eta:v1:panelPosition'), '{"left":10,"top":20}');
assert.equal(store.getItem('chatster_tutorial_sorter_groups_v11'), null);
assert.equal(store.getItem('canvas_speedgrader_when_will_it_end_v1:42_100'), null);
assert.equal(store.getItem('chatster_local_marking_group_context_v1'), '{"version":1}', 'Differing historical data must not be erased');
assert.equal(store.getItem('Canvas:unrelated'), 'leave intact');
const snapshot = JSON.stringify([...store.values]);
api.migrate();
assert.equal(JSON.stringify([...store.values]), snapshot, 'Migration must be idempotent');

const current = storage({ 'assessmentHelpers:eta:v1:42_100': 'current', 'canvas_speedgrader_when_will_it_end_v1:42_100': 'older' });
assert.equal(load(current).read('assessmentHelpers:eta:v1:42_100'), 'current');
assert.equal(current.getItem('canvas_speedgrader_when_will_it_end_v1:42_100'), 'older');
const blocked = storage({ chatster_tutorial_sorter_groups_v11: roster }, true);
assert.equal(load(blocked).read('assessmentHelpers:tutorialSorter:v1:groups'), roster);
assert.equal(blocked.getItem('chatster_tutorial_sorter_groups_v11'), roster, 'Failed writes must preserve the original');
assert.equal(blocked.getItem('assessmentHelpers:tutorialSorter:v1:groups'), null);
api.remove('assessmentHelpers:tutorialSorter:v1:context');
assert.equal(store.getItem('chatster_local_marking_group_context_v1'), null);
assert.equal(api.read('assessmentHelpers:tutorialSorter:v1:context'), null, 'Reset must not resurrect a historical value');
console.log('Legacy naming migration: rosters, logs, paused sessions, positions, conflicts, quotas and repeated runs passed.');
