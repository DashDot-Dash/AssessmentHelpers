const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
let now = 100000;
const storage = new Map();
const source = fs.readFileSync('canvas-speedgrader-eta.user.js', 'utf8')
  .replace(/\/\/ BEGIN GENERATED AH THEME[^\n]*\n[\s\S]*?\/\/ END GENERATED AH THEME/, '')
  .replace(
   /  window.addEventListener\('assessment-eta-status-request'[\s\S]*?  scheduleInit\(\);/,
  `renderPanel = () => {}; detectStudentChange = () => {}; publishLoggingStatus = () => {}; getCurrentStudentDisplayName = () => 'Student';
  globalThis.eta = { state, getProgressInfo, getLogSummary, getSummaryEta, loadData, handleBreakToggle, addEntry, currentElapsedSeconds: getCurrentElapsedSeconds, handleExportCsv };
  downloadFile = (csv) => { globalThis.csv = csv; };`
);
function load() {
  const context = vm.createContext({ Date: class extends Date { static now() { return now; } },
    location: { href: 'https://canvas.test/courses/1/gradebook/speed_grader?assignment_id=2' },
    URL, window: { location: { href: 'https://canvas.test/courses/1/gradebook/speed_grader?assignment_id=2' } },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key),
      get length() { return storage.size; }, key: index => [...storage.keys()][index] } });
  vm.runInContext(fs.readFileSync('shared/legacy-storage.js', 'utf8'), context);
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

const visit = (student, started, ended, extra = {}) => ({ student_key: student,
  student_label: student, started_at: `2026-10-06T${started}:00Z`, logged_at: `2026-10-06T${ended}:00Z`,
  elapsed_seconds: (Date.parse(`2026-10-06T${ended}:00Z`) - Date.parse(`2026-10-06T${started}:00Z`)) / 1000, ...extra });
const summaryData = { entries: [
  visit('A', '01:00', '01:10'), visit('A', '01:02', '01:04'), visit('B', '01:10', '01:15'), visit('C', '01:40', '01:45'),
  { ...visit('D', '01:00', '01:10'), started_at: '2026-10-07T01:00:00Z', logged_at: '2026-10-07T01:10:00Z' },
  visit('flip', '01:11', '01:12', { elapsed_seconds: 2 }),
  visit('forgotten', '01:00', '01:01', { logged_at: '2026-10-07T08:00:00Z', elapsed_seconds: 60 })
], breaks: [] };
let summary = ctx.eta.getLogSummary(summaryData, { timeZone: 'Australia/Sydney' });
assert.equal(summary.studentCount, 4);
assert.equal(summary.activeSeconds, 1800);
assert.equal(summary.averageStudentSeconds, 450);
assert.equal(summary.blocks.length, 3);
assert.equal(summary.averageBlockSeconds, 600);
assert.equal(summary.typicalBreak, 1500);
assert.equal(summary.sameDayGaps.length, 1);
assert.equal(ctx.eta.getSummaryEta(summary, 1), 450); // No break charged after the last student.
summaryData.entries[2].summary_included = false;
summary = ctx.eta.getLogSummary(summaryData);
assert.equal(summary.studentCount, 3);
assert.equal(summary.activeSeconds, 1500);
assert.equal(summaryData.entries.length, 7); // Review never deletes raw rows.
const pausedEntry = visit('paused', '01:00', '01:22', { elapsed_seconds: 120,
  active_segments: [{ started_at: '2026-10-06T01:00:00Z', ended_at: '2026-10-06T01:01:00Z' },
    { started_at: '2026-10-06T01:21:00Z', ended_at: '2026-10-06T01:22:00Z' }] });
summary = ctx.eta.getLogSummary({ entries: [pausedEntry], breaks: [{ started_at: '2026-10-06T01:01:00Z', logged_at: '2026-10-06T01:21:00Z' }] });
assert.equal(summary.activeSeconds, 120);
assert.equal(summary.studentCount, 1);
assert.equal(summary.blocks.length, 2);
assert.equal(summary.typicalBreak, 1200);
summary = ctx.eta.getLogSummary({ entries: [visit('other-class', '01:00', '01:10', { tutorial_group_id: 'other' })], breaks: [] }, { groupId: 'current' });
assert.equal(summary.studentCount, 0);
console.log('Class summary: unique students, overlap merging, blocks, overnight exclusion, review overrides, pause segments and class filtering passed.');
const longMark = visit('long', '01:00', '01:50');
summary = ctx.eta.getLogSummary({ entries: [longMark], breaks: [], expectedMarkingBand: 'under10' });
assert.equal(summary.studentCount, 0);
summary = ctx.eta.getLogSummary({ entries: [longMark], breaks: [], expectedMarkingBand: 'over30' });
assert.equal(summary.studentCount, 1);
assert.equal(summary.activeSeconds, 3000);
summary = ctx.eta.getLogSummary({ entries: [visit('slower', '01:00', '01:15')], breaks: [], expectedMarkingBand: 'under10' });
assert.equal(summary.studentCount, 1); // Aiming for <10m must not discard a genuine 15m visit.
assert.ok(summary.reviews[0].reasons.includes('Over expected time'));
console.log('Expected time bands accept longer marking and flag overruns without dropping ordinary visits.');
