const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { seedStorage } = require('./canvas-fixture.cjs');
const root = path.resolve(__dirname, '..');
const helpers = [
  ['eta', 'ah-eta-panel'],
  ['tutorial-sorter', 'ah-tutorial-sorter-panel'],
  ['benchmarker', 'sg-benchmarker-panel'],
  ['copy-paster', 'sg-copypaster-panel'],
  ['gradebridge', 'vc-gradebridge-panel']
];
const url = 'https://canvas.test/courses/42/gradebook/speed_grader?assignment_id=100&student_id=1';
const script = slug => fs.readFileSync(path.join(root, `canvas-speedgrader-${slug}.user.js`), 'utf8');

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1000, height: 900 } });
    await context.route('**/*', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html>
      <title>VCDE1000 | SpeedGrader</title><h1>VCDE1000 SpeedGrader</h1>
      <div data-testid="assignment-name">Project 01</div>
      <button data-testid="student-select-trigger">Jane Citizen</button>
      <span data-testid="selected-student">Jane Citizen</span>
      <span data-testid="graded-students-count">1 / 2</span>
      <textarea id="speed_grader_comment_textarea"></textarea>` }));
    const errors = [];
    // Every helper is tested without the dock or any other helper installed.
    for (const [slug, id] of helpers) {
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(`${slug}: ${error.message}`));
      await page.goto(url);
      await seedStorage(page);
      if (slug === 'eta') {
        await page.evaluate(() => localStorage.setItem('assessmentHelpers:eta:v1:42_100', JSON.stringify({
          entries: [
            { student_key: 'A', student_label: 'Student A', started_at: '2026-10-06T01:00:00Z', logged_at: '2026-10-06T01:10:00Z', elapsed_seconds: 600 },
            { student_key: 'B', student_label: 'Student B', started_at: '2026-10-06T01:30:00Z', logged_at: '2026-10-06T01:35:00Z', elapsed_seconds: 300 },
            { student_key: 'forgotten', student_label: 'Forgotten timer', started_at: '2026-10-06T02:00:00Z', logged_at: '2026-10-07T08:00:00Z', elapsed_seconds: 60 }
          ], breaks: [], timings: [600, 300], completedStudentKeys: ['A', 'B']
        })));
      }
      await page.addScriptTag({ content: script(slug) });
      await page.evaluate(slug => window.AssessmentHelpers.helpers[slug].show(), slug);
      await page.waitForSelector(`#${id}`);
      if (slug === 'eta') await page.locator('.ah-eta-details > summary').click();
      for (const theme of ['soft', 'dark']) {
        for (const density of ['roomy', 'compact']) {
          await page.evaluate(settings => window.AssessmentHelpersTheme.set(settings), { theme, density });
          await page.waitForTimeout(150);
          const metrics = await page.evaluate(id => {
            const panel = document.getElementById(id);
            const style = getComputedStyle(panel);
            const toggle = panel.querySelector('button[aria-label^="Minimise"]');
            return { width: panel.getBoundingClientRect().width, background: style.backgroundColor,
              overflow: panel.scrollWidth > panel.clientWidth + 1,
              toggleWidth: toggle?.getBoundingClientRect().width,
              loggingOpen: panel.querySelector('.ah-eta-details')?.open };
          }, id);
          assert.equal(metrics.width, slug === 'copy-paster' ? 420 : density === 'compact' ? 248 : 340, `${slug} width`);
          assert.equal(metrics.background, theme === 'soft' ? 'rgb(244, 246, 248)' : 'rgb(17, 18, 20)', `${slug} background`);
          assert.equal(metrics.overflow, false, `${slug} content overflows in ${density}`);
          assert.equal(metrics.toggleWidth, 28, `${slug} minimise control`);
          if (slug === 'eta') {
            assert.equal(metrics.loggingOpen, true, 'Changing appearance must retain the logging disclosure');
            assert.equal(await page.locator('.ah-eta-prince-stage').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(41, 43, 46)', 'Prince needs a dark stage in either theme');
          }
          if (slug === 'benchmarker') {
            assert.equal(await page.locator('.sg-grade-primary-grid button').count(), density === 'compact' ? 6 : 4);
          }
          if (slug === 'gradebridge') {
            assert.equal(await page.locator('.vc-gradebridge-assignment-name').first().evaluate(el => getComputedStyle(el).overflow), 'visible', 'Assignment names must wrap instead of truncating');
          }
        }
      }
      if (slug === 'eta') {
        assert.equal(await page.locator('.ah-eta-summary .ah-eta-stat-value').first().innerText(), '2');
        await page.locator('#ah-eta-expected-band').selectOption('over30');
        await page.waitForFunction(() => document.querySelector('#ah-eta-expected-band').value === 'over30');
        await page.locator('.ah-eta-review > summary').click();
        await page.locator('[data-summary-index="0"]').uncheck();
        await page.waitForFunction(() => document.querySelector('.ah-eta-summary .ah-eta-stat-value').textContent === '1');
        const rawDownloading = page.waitForEvent('download');
        await page.locator('#ah-eta-export-csv').click();
        const rawDownload = await rawDownloading;
        const rawCsv = fs.readFileSync(await rawDownload.path(), 'utf8');
        assert.match(rawCsv, /Student A/);
        assert.match(rawCsv, /Forgotten timer/);
        assert.match(rawCsv, /summary_included/);
        assert.match(rawCsv, /active_segments/);
        await page.locator('.ah-eta-review > summary').click();
        const expandedHeight = await page.locator(`#${id} .ah-eta-body`).evaluate(el => el.scrollHeight);
        await page.locator('.ah-eta-prince-disclosure summary').click();
        await page.waitForFunction(() => !document.querySelector('.ah-eta-prince-disclosure').open);
        await page.waitForFunction(() => JSON.parse(localStorage.getItem('assessmentHelpers:eta:v1:42_100')).princeOpen === false);
        assert.equal(await page.locator('.ah-eta-prince-stage').isVisible(), false);
        assert.ok(await page.locator(`#${id} .ah-eta-body`).evaluate(el => el.scrollHeight) < expandedHeight);
        await page.reload();
        await page.addScriptTag({ content: script(slug) });
        await page.evaluate(() => window.AssessmentHelpers.helpers.eta.show());
        assert.equal(await page.locator('.ah-eta-prince-disclosure').evaluate(el => el.open), false, 'Prince collapse survives reload');
        assert.equal(await page.locator('#ah-eta-expected-band').inputValue(), 'over30', 'Expected time band survives reload');
        await page.locator('.ah-eta-details > summary').click();
        assert.equal(await page.locator('.ah-eta-summary .ah-eta-stat-value').first().innerText(), '1', 'Review exclusions survive reload');
        await page.locator('.ah-eta-prince-disclosure summary').click();
        await page.waitForFunction(() => document.querySelector('.ah-eta-prince-disclosure').open);
        await page.waitForSelector('.ah-eta-prince-stage > div', { state: 'visible' });
        assert.equal(await page.locator('.ah-eta-prince-stage').isVisible(), true);
      }
      if (slug !== 'copy-paster') {
        await page.evaluate(id => {
          const panel = document.getElementById(id);
          panel.style.left = '740px';
          panel.style.right = 'auto';
          window.AssessmentHelpersTheme.set({ density: 'roomy' });
        }, id);
        await page.waitForFunction(id => document.getElementById(id).getBoundingClientRect().right <= innerWidth - 9, id);
      }
      if (slug === 'copy-paster') {
        await page.locator('.cp-action-primary').click();
        await page.locator('#cp-snippet-title').fill('Theme test snippet');
        await page.locator('#cp-snippet-body').fill('Useful feedback');
        await page.locator('form .cp-btn-primary').click();
        assert.ok((await page.locator('.cp-item-title').allTextContents()).includes('Theme test snippet'));
      }
      await page.close();
    }
    const rubric = await context.newPage();
    rubric.on('pageerror', error => errors.push(`rubric: ${error.message}`));
    await rubric.goto('https://canvas.test/courses/42/rubrics');
    await rubric.addScriptTag({ content: fs.readFileSync(path.join(root, 'canvas-rubric-builder.user.js'), 'utf8') });
    await rubric.evaluate(() => window.AssessmentHelpers.helpers['rubric-builder'].show());
    await rubric.locator('#jj-rubric-title').fill('Theme test rubric');
    const checks = rubric.locator('#jj-library-panel input[type="checkbox"]');
    await checks.nth(0).check();
    await checks.nth(1).check();
    assert.equal(await rubric.locator('#jj-selected-panel input[data-weight]').count(), 2);
    await rubric.locator('#jj-selected-panel input[data-weight]').first().fill('90');
    await rubric.locator('#jj-selected-panel input[data-weight]').first().dispatchEvent('change');
    assert.match(await rubric.locator('#jj-status').innerText(), /Total weight: 110/);
    for (const theme of ['soft', 'dark']) {
      await rubric.evaluate(theme => window.AssessmentHelpersTheme.set({ theme, density: 'compact' }), theme);
      assert.equal(await rubric.locator('#jj-rubric-title').inputValue(), 'Theme test rubric');
      assert.equal(await rubric.locator('.ah-rubric-modal').evaluate(el => getComputedStyle(el).backgroundColor), theme === 'dark' ? 'rgb(17, 18, 20)' : 'rgb(244, 246, 248)');
    }
    assert.equal(await rubric.locator('#jj-selected-panel .ah-chip').count(), 10);
    const downloading = rubric.waitForEvent('download');
    await rubric.locator('#jj-download-csv').click();
    const download = await downloading;
    assert.equal(download.suggestedFilename(), 'Theme_test_rubric.csv');
    const csv = fs.readFileSync(await download.path(), 'utf8');
    assert.match(csv, /Theme test rubric/);
    await rubric.locator('#jj-close-modal').click();
    assert.equal(await rubric.locator('.ah-rubric-modal').count(), 0);
    assert.deepEqual(errors, []);
    console.log('Five standalone panels in four display modes, snippet editing and rubric selection/export checks passed.');
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
