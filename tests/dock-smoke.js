const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SPEEDGRADER_URL = 'https://canvas.test/courses/42/gradebook/speed_grader?assignment_id=100&student_id=1';
const SCRIPT_FILES = [
  'DEV-canvas-viscomm-helper-dock.user.js',
  'DEV-canvas-speedgrader-copy-paster.user.js',
  'DEV-canvas-speedgrader-benchmarker.user.js',
  'DEV-canvas-speedgrader-tutorial-sorter.user.js',
  'DEV-canvas-speedgrader-gradebridger.user.js',
  'DEV-canvas-speedgrader-when-will-it-end.user.js'
];

function readScript(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

async function seedStorage(page) {
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('chatster_tutorial_sorter_groups_v11', JSON.stringify({
      courses: {
        VCDE1000: {
          activeClassKey: 'studio-a',
          classes: {
            'studio-a': {
              id: 'studio-a',
              classKey: 'studio-a',
              label: 'Studio A',
              name: 'Studio A',
              courseCode: 'VCDE1000',
              students: [
                { name: 'Jane Citizen', canvas_name: 'Jane Citizen', user_id: '1' },
                { name: 'Max Example', canvas_name: 'Max Example', user_id: '2' }
              ]
            }
          }
        }
      }
    }));
    localStorage.setItem('chatster_tutorial_sorter_active_group_v11', 'studio-a');
    localStorage.setItem('vcGradeBridge:pairs:v1', JSON.stringify({
      42: {
        100: {
          targetAssignmentId: '200',
          targetAssignmentName: 'Project 02',
          sourceAssignmentName: 'Project 01'
        },
        200: {
          targetAssignmentId: '100',
          targetAssignmentName: 'Project 01',
          sourceAssignmentName: 'Project 02'
        }
      }
    }));
  });
}

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
      entryStudentKey: document.querySelector('#wwie-prince-panel') ? 'panel-present' : 'missing'
    };
  });
  if (etaStudentKey.entryStudentKey !== 'panel-present') {
    throw new Error('ETA did not render on demand from the dock registry');
  }

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

  await clickDock('#assessment-helper-dock .vc-dock-action[data-vc-helper-id="tutorial-sorter"][data-vc-action-id="next"]');
  await page.waitForTimeout(80);

  await page.evaluate(() => {
    localStorage.removeItem('chatster_tutorial_sorter_groups_v11');
    localStorage.removeItem('chatster_tutorial_sorter_active_group_v11');
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
