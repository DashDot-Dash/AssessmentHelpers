const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SPEEDGRADER_URL = 'https://canvas.test/courses/42/gradebook/speed_grader?assignment_id=100&student_id=1';
const SCRIPT_FILES = [
  'canvas-assessment-helper-dock.user.js',
  'canvas-speedgrader-copy-paster.user.js',
  'canvas-speedgrader-benchmarker.user.js',
  'canvas-speedgrader-tutorial-sorter.user.js',
  'canvas-speedgrader-gradebridge.user.js',
  'canvas-speedgrader-eta.user.js'
];

function readScript(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

const { seedStorage } = require('./canvas-fixture.cjs');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];

  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('dialog', async dialog => {
    errors.push(`Unexpected dialog: ${dialog.message()}`);
    await dialog.dismiss();
  });

  await page.route('**/*', route => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: `<!doctype html>
      <html>
        <head><title>VCDE1000 | SpeedGrader</title></head>
        <body>
          <h1>VCDE1000 SpeedGrader</h1>
          <div data-testid="assignment-name">Project 01</div>
          <button data-testid="student-select-trigger">Jane Citizen</button>
          <span data-testid="selected-student">Jane Citizen</span>
          <span data-testid="student-option-1" role="menuitem">Jane Citizen</span>
          <span data-testid="student-option-2" role="menuitem">Max Example</span>
          <textarea id="speedgrader_comment_textarea"></textarea>
        </body>
      </html>`
  }));

  await page.goto(SPEEDGRADER_URL, { waitUntil: 'domcontentloaded' });
  await seedStorage(page);

  for (const file of SCRIPT_FILES) {
    await page.addScriptTag({ content: readScript(file) });
  }

  await page.waitForSelector('#assessment-helper-dock');
  await page.waitForFunction(() => {
    const dock = document.querySelector('#assessment-helper-dock');
    return dock && dock.textContent.includes('Tutorial Sorter') && dock.textContent.includes('GradeBridge');
  });
  const headerLayout = await page.evaluate(() => {
    const dock = document.querySelector('#assessment-helper-dock').getBoundingClientRect();
    const title = document.querySelector('.vc-dock-title').getBoundingClientRect();
    const toggle = document.querySelector('.vc-dock-toggle').getBoundingClientRect();
    return { width: toggle.width, inside: toggle.right <= dock.right, overlaps: title.right > toggle.left };
  });
  if (headerLayout.width < 26 || !headerLayout.inside || headerLayout.overlaps) {
    throw new Error(`Minimise button squeezed or obscured: ${JSON.stringify(headerLayout)}`);
  }
  await page.locator('.vc-dock-toggle').click();
  await page.waitForSelector('#assessment-helper-dock.is-minimized .vc-dock-tab');
  await page.locator('.vc-dock-tab').click();
  await page.waitForSelector('#assessment-helper-dock .vc-dock-toggle');

  const etaStudentKey = await page.evaluate(() => {
    const before = window.AssessmentHelpers?.helpers?.eta?.isOpen?.();
    document.querySelector('[data-testid="selected-student"]')?.remove();
    const el = document.createElement('span');
    el.setAttribute('data-testid', 'selected-student');
    el.textContent = 'Jane Citizen';
    document.body.appendChild(el);
    window.AssessmentHelpers?.helpers?.eta?.show?.();
    return {
      before,
      entryStudentKey: document.querySelector('#ah-eta-panel') ? 'panel-present' : 'missing'
    };
  });
  if (etaStudentKey.entryStudentKey !== 'panel-present') {
    throw new Error('ETA did not render on demand from the dock registry');
  }

  await page.evaluate(() => window.AssessmentHelpers.helpers['tutorial-sorter'].show());
  await page.locator('#ah-tutorial-sorter-break').evaluate(el => el.click());
  await page.waitForFunction(() => document.querySelector('#ah-tutorial-sorter-break')?.textContent === 'Resume');
  await page.evaluate(() => window.AssessmentHelpersTheme.set({ density: 'compact' }));
  if (await page.locator('#ah-tutorial-sorter-next').count() !== 1) throw new Error('Compact navigation missing');
  await page.locator('#ah-tutorial-sorter-break').evaluate(el => el.click());
  await page.waitForFunction(() => document.querySelector('#ah-tutorial-sorter-break')?.textContent === 'Pause');
  const recordedBreaks = await page.evaluate(() => JSON.parse(localStorage.getItem(
    Object.keys(localStorage).find(key => key.startsWith('assessmentHelpers:eta:v1:') && !key.endsWith('panelPosition'))
  )).breaks);
  if (recordedBreaks.length !== 1) throw new Error('Sorter did not record break in ETA');
  await page.locator('#ah-tutorial-sorter-minimize').evaluate(el => el.click());
  if (await page.locator('#ah-tutorial-sorter-next').count()) throw new Error('Minimise did not collapse Tutorial Sorter');
  await page.locator('#ah-tutorial-sorter-minimize').evaluate(el => el.click());
  await page.evaluate(() => window.AssessmentHelpersTheme.set({ density: 'roomy' }));
  await page.evaluate(() => window.AssessmentHelpers.helpers['tutorial-sorter'].hide());

  const mainDockText = await page.locator('#assessment-helper-dock .vc-dock-list').innerText();
  if (!mainDockText.includes('Tutorial Sorter')) throw new Error('Tutorial Sorter did not appear in the main dock area');
  if (!mainDockText.includes('GradeBridge')) throw new Error('GradeBridge did not appear in the main dock area');

  async function clickDock(selector) {
    await page.locator(selector).first().evaluate(el => el.click());
  }

  for (const helperId of ['tutorial-sorter', 'gradebridge', 'eta', 'benchmarker', 'copy-paster']) {
    const selector = `#assessment-helper-dock .vc-dock-helper[data-vc-helper-id="${helperId}"]`;
    await clickDock(selector);
    await page.waitForTimeout(80);
    await clickDock(selector);
    await page.waitForTimeout(80);
  }

  const navLayout = await page.evaluate(() => {
    const row = document.querySelector('.vc-dock-action-row[data-vc-helper-id="tutorial-sorter"]');
    const rect = id => row.querySelector(`[data-vc-action-id="${id}"]`).getBoundingClientRect();
    const prev = rect('prev'), next = rect('next'), pause = rect('break');
    return { rowWidth: row.getBoundingClientRect().width, prevWidth: prev.width, nextWidth: next.width,
      pauseWidth: pause.width, sameRow: Math.abs(prev.top - next.top) < 1, pauseBelow: pause.top >= prev.bottom };
  });
  if (!navLayout.sameRow || !navLayout.pauseBelow || navLayout.prevWidth < navLayout.rowWidth * 0.4 ||
      navLayout.nextWidth < navLayout.rowWidth * 0.4 || navLayout.pauseWidth < navLayout.rowWidth * 0.9) {
    throw new Error(`Dock navigation layout collapsed: ${JSON.stringify(navLayout)}`);
  }

  await clickDock('#assessment-helper-dock .vc-dock-action[data-vc-helper-id="tutorial-sorter"][data-vc-action-id="next"]');
  await page.waitForTimeout(80);

  await page.evaluate(() => {
    localStorage.removeItem('assessmentHelpers:tutorialSorter:v1:groups');
    localStorage.removeItem('assessmentHelpers:tutorialSorter:v1:activeGroup');
    localStorage.removeItem('vcGradeBridge:pairs:v1');
    window.AssessmentHelpers?.helpers?.['tutorial-sorter']?.hide?.();
    window.AssessmentHelpers?.helpers?.gradebridge?.hide?.();
    window.dispatchEvent(new CustomEvent('assessment-helper-status-changed'));
  });
  await page.waitForTimeout(150);

  for (const helperId of ['tutorial-sorter', 'gradebridge']) {
    const closedMainText = await page.locator('#assessment-helper-dock .vc-dock-list').innerText();
    if (closedMainText.includes(helperId === 'tutorial-sorter' ? 'Tutorial Sorter' : 'GradeBridge')) {
      throw new Error(`${helperId} appeared in the main dock area before opening`);
    }

    await clickDock(`#assessment-helper-dock .vc-dock-helper[data-vc-helper-id="${helperId}"]`);
    await page.waitForTimeout(150);
    const openMainText = await page.locator('#assessment-helper-dock .vc-dock-list').innerText();
    if (!openMainText.includes(helperId === 'tutorial-sorter' ? 'Tutorial Sorter' : 'GradeBridge')) {
      throw new Error(`${helperId} did not move to the main dock area while open`);
    }
    await page.evaluate(id => window.AssessmentHelpers?.helpers?.[id]?.hide?.(), helperId);
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('assessment-helper-status-changed')));
    await page.waitForTimeout(150);
  }

  await seedStorage(page);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('assessment-helper-status-changed')));
  await page.waitForTimeout(150);

  const beforeSwitchUrl = page.url();
  await clickDock('#assessment-helper-dock .vc-dock-action[data-vc-helper-id="gradebridge"][data-vc-action-id="switch"]');
  await page.waitForTimeout(80);
  const afterSwitchUrl = page.url();

  if (!afterSwitchUrl.includes('assignment_id=200')) {
    throw new Error(`GradeBridge dock switch did not update assignment_id: ${beforeSwitchUrl} -> ${afterSwitchUrl}`);
  }

  if (errors.length) {
    throw new Error(errors.join('\n'));
  }

  await browser.close();
}

main().catch(async err => {
  console.error(err);
  process.exit(1);
});
