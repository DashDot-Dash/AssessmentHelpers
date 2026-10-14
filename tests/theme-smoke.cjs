const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const url = 'https://canvas.test/courses/42/gradebook/speed_grader?assignment_id=100&student_id=1';
const theme = read('shared/ah-theme.js');
const versionLine = theme.match(/const VERSION = '[^']+'/)[0];

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 900, height: 720 } });
    await context.route('**/*', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html>
      <style>:root { --font-ui:serif; --text-body:purple; }</style>
      <div data-testid="assignment-name">Project 01</div>
      <button data-testid="student-select-trigger">Jane Citizen</button>
      <span data-testid="selected-student">Jane Citizen</span>
      <div data-testid="graded-students-count">1 / 2</div>` }));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.evaluate(() => localStorage.setItem('ah:settings', '{broken'));
    await page.addScriptTag({ content: theme });
    assert.deepEqual(await page.evaluate(() => window.AssessmentHelpersTheme.get()), { theme: 'soft', density: 'roomy' });
    assert.equal(await page.evaluate(() => window.AssessmentHelpers), undefined, 'Theme must not create the registry');
    await page.addScriptTag({ content: theme });
    assert.equal(await page.locator('#ah-theme').count(), 1, 'Theme must inject one style');
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--font-ui')), 'serif');
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ah-bg')), '');
    await page.addScriptTag({ content: read('canvas-assessment-helper-dock.user.js') });
    await page.addScriptTag({ content: read('canvas-speedgrader-eta.user.js') });
    await page.waitForSelector('#assessment-helper-dock');
    await page.locator('.vc-dock-settings summary').click();
    await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.className = 'ah-panel ah-scope';
      probe.id = 'theme-probe';
      document.body.appendChild(probe);
    });
    for (const themeValue of ['dark', 'soft']) {
      for (const density of ['compact', 'roomy']) {
        await page.locator(`[data-ah-setting="theme"][data-ah-value="${themeValue}"]`).click();
        await page.locator(`[data-ah-setting="density"][data-ah-value="${density}"]`).click();
        assert.equal(await page.locator(`[data-ah-setting="density"][data-ah-value="${density}"]`).getAttribute('aria-pressed'), 'true');
        const metrics = await page.evaluate(() => {
          const dock = document.querySelector('#assessment-helper-dock');
          const title = dock.querySelector('.vc-dock-title').getBoundingClientRect();
          const minimise = dock.querySelector('.vc-dock-toggle').getBoundingClientRect();
          const arrow = getComputedStyle(dock.querySelector('.vc-dock-settings summary'), '::after');
          return {
            background: getComputedStyle(dock).backgroundColor,
            dockWidth: dock.getBoundingClientRect().width,
            probeWidth: document.querySelector('#theme-probe').getBoundingClientRect().width,
            buttonFits: minimise.width === 28 && title.right <= minimise.left,
            arrowWidth: arrow.width, arrowHeight: arrow.height,
            collapsed: dock.classList.contains('is-minimized')
          };
        });
        assert.equal(metrics.background, themeValue === 'dark' ? 'rgb(17, 18, 20)' : 'rgb(244, 246, 248)');
        assert.equal(metrics.dockWidth, 168);
        assert.equal(metrics.probeWidth, density === 'compact' ? 248 : 340);
        assert.equal(metrics.buttonFits, true);
        assert.equal(metrics.arrowWidth, '10px');
        assert.equal(metrics.arrowHeight, '10px');
        assert.equal(metrics.collapsed, false, 'Density must not minimise the dock');
      }
    }
    const other = await context.newPage();
    await other.goto(url);
    await other.addScriptTag({ content: theme });
    await page.locator('[data-ah-setting="theme"][data-ah-value="dark"]').click();
    await other.waitForFunction(() => window.AssessmentHelpersTheme.get().theme === 'dark');
    await other.evaluate(() => window.AssessmentHelpersTheme.set({ density: 'compact' }));
    await page.waitForFunction(() => document.querySelector('[data-ah-setting="density"][data-ah-value="compact"]').getAttribute('aria-pressed') === 'true');
    await page.reload();
    await page.addScriptTag({ content: read('canvas-assessment-helper-dock.user.js') });
    assert.deepEqual(await page.evaluate(() => window.AssessmentHelpersTheme.get()), { theme: 'dark', density: 'compact' });
    await page.locator('.vc-dock-toggle').click();
    await page.waitForSelector('#assessment-helper-dock.is-minimized');
    await page.locator('.vc-dock-tab').click();
    await page.waitForSelector('.vc-dock-toggle');
    // Numeric version comparison: 1.10 must win over 1.2 and 1.0.
    await other.evaluate(() => {
      window.themeNotifications = 0;
      window.AssessmentHelpersTheme.onChange(() => window.themeNotifications++);
    });
    await other.addScriptTag({ content: theme.replace(versionLine, "const VERSION = '1.10.0'") });
    await other.addScriptTag({ content: theme.replace(versionLine, "const VERSION = '1.2.0'") });
    assert.equal(await other.evaluate(() => window.AssessmentHelpersTheme.version), '1.10.0');
    assert.equal(await other.locator('#ah-theme').getAttribute('data-version'), '1.10.0');
    const before = await other.evaluate(() => window.themeNotifications);
    await other.evaluate(() => window.AssessmentHelpersTheme.set({ theme: 'soft' }));
    assert.equal(await other.evaluate(() => window.themeNotifications), before + 1, 'Theme upgrades retain helper subscriptions');
    assert.deepEqual(errors, []);
    console.log('Shared theme: scope, standalone loading, four display modes, persistence, tab sync, minimise and version checks passed.');
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
