const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
let now = 100000;
const storage = new Map();
const source = fs.readFileSync('canvas-speedgrader-eta.user.js', 'utf8').replace(
   /  window.addEventListener\('assessment-eta-status-request'[\s\S]*?  scheduleInit\(\);/,
  `renderPanel = () => {}; detectStudentChange = () => {}; publishLoggingStatus = () => {}; getCurrentStudentDisplayName = () => 'Student';
  globalThis.eta = { state, getProgressInfo, loadData, handleBreakToggle, addEntry, currentElapsedSeconds: getCurrentElapsedSeconds, handleExportCsv };
  downloadFile = (csv) => { globalThis.csv = csv; };`
);
function load() {
  const context = vm.createContext({ Date: class extends Date { static now() { return now; } },
    location: { href: 'https://canvas.test/courses/1/gradebook/speed_grader?assignment_id=2' },
    URL, window: { location: { href: 'https://canvas.test/courses/1/gradebook/speed_grader?assignment_id=2' } },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) } });
  vm.runInContext(source, context);
  return context;
}
let ctx = load();
Object.assign(ctx.eta.state, { currentStudentKey: '1', currentStartTime: now, currentVisitStartedAt: now });
now += 60000;
ctx.eta.handleBreakToggle();
assert.equal(ctx.eta.currentElapsedSeconds(), 60);
assert.equal(ctx.eta.addEntry(60), false);
now += 1800000;
ctx = load(); // A fresh script instance sees the persisted break.
const paused = ctx.eta.loadData().activeBreak;
assert.equal(paused.accumulatedSeconds, 60);
Object.assign(ctx.eta.state, { currentStudentKey: '1', currentVisitStartedAt: paused.studentStartedAt });
ctx.eta.handleBreakToggle();
assert.equal(ctx.eta.loadData().breaks[0].elapsed_seconds, 1800);
now += 60000;
assert.equal(ctx.eta.currentElapsedSeconds(), 120);
assert.equal(ctx.eta.addEntry(120), true);
assert.equal(ctx.eta.loadData().entries[0].elapsed_seconds, 120);
assert.equal(ctx.eta.loadData().entries[0].started_at, new Date(100000).toISOString());
Object.assign(ctx.eta.state, { currentStudentKey: '2', currentStartTime: now });
assert.equal(ctx.eta.addEntry(1500), true);
Object.assign(ctx.eta.state, { currentStudentKey: '3' });
assert.equal(ctx.eta.addEntry(5), true);
assert.equal(ctx.eta.loadData().entries.length, 3);
assert.equal(ctx.eta.loadData().timings.length, 1);
ctx.eta.handleExportCsv();
assert.match(ctx.csv, /1800/);
assert.match(ctx.csv, /break/);
assert.match(ctx.csv, /marking/);
console.log('ETA break persistence, resumed timing, full logging and CSV checks passed.');

const revisits = { entries: Array(20).fill({}), completedStudentKeys: ['1', '2', '1', '2'] };
let progress = ctx.eta.getProgressInfo({ source: 'local_group', total: 10, currentIndex: 4 }, revisits);
assert.equal(progress.visibleDone, 5);
assert.equal(progress.ratio, 0.5);
progress = ctx.eta.getProgressInfo({ source: 'local_group', total: 10, currentIndex: 1 }, revisits);
assert.equal(progress.ratio, 0.2);
progress = ctx.eta.getProgressInfo({ source: 'canvas', total: 10, done: 5 }, revisits);
assert.equal(progress.ratio, 0.5);
progress = ctx.eta.getProgressInfo({ source: 'unknown', total: 10 }, revisits);
assert.equal(progress.done, 2);
assert.equal(ctx.eta.getProgressInfo({ source: 'canvas', total: 0, done: 0 }, revisits).ratio, 0);
console.log('Prince progress follows displayed completion, including backward navigation and repeated visits.');
