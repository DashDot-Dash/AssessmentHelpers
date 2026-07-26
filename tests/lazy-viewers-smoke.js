const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CANVAS_URL =
  'https://canvas.test/courses/42/gradebook/speed_grader?assignment_id=100';

function readScript(filename) {
  return fs.readFileSync(path.join(ROOT, filename), 'utf8');
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 800 }
  });
  const errors = [];

  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.route('**/*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><html><head></head><body></body></html>'
    })
  );

  await page.goto(CANVAS_URL, { waitUntil: 'domcontentloaded' });
  await page.setContent(`<!doctype html>
    <html>
      <head><title>Lazy viewer smoke test</title></head>
      <body>
        <main id="content">
          <p>
            <a id="p5" href="https://editor.p5js.org/student/sketches/ABC_123?mode=present">
              Student p5 sketch
            </a>
          </p>
          <p id="plain-p5">
            Plain https://editor.p5js.org/student/sketches/TEXT456, preserved.
          </p>
          <p>
            <a id="padlet-board" href="https://padlet.com/teacher/assessment-abcdefghijklmnop">
              Shared Padlet
            </a>
          </p>
          <p>
            <a id="padlet-post" href="https://padlet.com/teacher/assessment-abcdefghijklmnop/wish/POST12345678">
              Individual Padlet post
            </a>
          </p>
          <p id="plain-padlet">
            Plain https://padlet.com/teacher/assessment-abcdefghijklmnop/wish/876543210, preserved.
          </p>
          <p>
            <a id="invalid" href="https://example.com/not-a-padlet">Invalid</a>
          </p>
        </main>
      </body>
    </html>`);

  await page.addScriptTag({ content: readScript('lazy-p5.user.js') });
  await page.addScriptTag({ content: readScript('lazy-padlet.user.js') });

  await page.waitForFunction(
    () =>
      document.querySelectorAll('.lazyP5-card').length === 2 &&
      document.querySelectorAll('.lazypadlet-card').length === 3
  );

  const initial = await page.evaluate(() => {
    const p5Card = document.getElementById(
      document.querySelector('#p5').dataset.lazyP5CardId
    );
    const padletCard = document.getElementById(
      document.querySelector('#padlet-post').dataset.lazypadletCardId
    );

    function styles(card, button) {
      const cardStyle = getComputedStyle(card);
      const buttonStyle = getComputedStyle(button);
      return {
        background: cardStyle.backgroundColor,
        accent: cardStyle.borderLeftColor,
        buttonBackground: buttonStyle.backgroundColor,
        buttonHeight: button.getBoundingClientRect().height
      };
    }

    return {
      iframes: document.querySelectorAll(
        '.lazyP5-iframe, .lazypadlet-iframe'
      ).length,
      plainP5: document.querySelector('#plain-p5').textContent.trim(),
      plainPadlet: document
        .querySelector('#plain-padlet')
        .textContent.trim(),
      invalidEnhanced:
        document.querySelector('#invalid').hasAttribute(
          'data-lazypadlet-enhanced'
        ) ||
        document.querySelector('#invalid').hasAttribute(
          'data-lazyP5-enhanced'
        ),
      p5Styles: styles(
        p5Card,
        p5Card.querySelector('.lazyP5-button-primary')
      ),
      padletStyles: styles(
        padletCard,
        padletCard.querySelector('.lazypadlet-button-primary')
      )
    };
  });

  if (initial.iframes !== 0) {
    throw new Error('A lazy viewer created an iframe before user interaction.');
  }
  if (
    initial.plainP5 !==
      'Plain https://editor.p5js.org/student/sketches/TEXT456, preserved.' ||
    initial.plainPadlet !==
      'Plain https://padlet.com/teacher/assessment-abcdefghijklmnop/wish/876543210, preserved.'
  ) {
    throw new Error('Plain-text link enhancement changed the visible text.');
  }
  if (initial.invalidEnhanced) {
    throw new Error('An invalid URL was enhanced.');
  }

  for (const [name, styles] of Object.entries({
    lazyP5: initial.p5Styles,
    LazyPadlet: initial.padletStyles
  })) {
    if (
      styles.background !== 'rgb(24, 24, 27)' ||
      styles.accent !== 'rgb(214, 162, 29)' ||
      styles.buttonBackground !== 'rgb(214, 162, 29)' ||
      styles.buttonHeight > 28
    ) {
      throw new Error(`${name} does not match the suite theme.`);
    }
  }

  const p5CardId = await page
    .locator('#p5')
    .getAttribute('data-lazy-p5-card-id');
  const p5Card = page.locator(`#${p5CardId}`);
  await p5Card.getByRole('button', { name: 'Run this p5 sketch' }).click();
  if (
    (await p5Card.locator('iframe').getAttribute('src')) !==
    'https://editor.p5js.org/student/full/ABC_123'
  ) {
    throw new Error('lazyP5 constructed the wrong full-sketch URL.');
  }
  await p5Card.getByRole('button', { name: 'Stop this p5 sketch' }).click();
  if ((await p5Card.locator('iframe').count()) !== 0) {
    throw new Error('lazyP5 Stop retained its iframe.');
  }

  const boardCardId = await page
    .locator('#padlet-board')
    .getAttribute('data-lazypadlet-card-id');
  const boardCard = page.locator(`#${boardCardId}`);
  await boardCard
    .getByRole('button', { name: 'View this Padlet inside Canvas' })
    .click();
  if (
    (await boardCard.locator('iframe').getAttribute('src')) !==
    'https://padlet.com/embed/abcdefghijklmnop'
  ) {
    throw new Error('LazyPadlet constructed the wrong board embed URL.');
  }

  const postCardId = await page
    .locator('#padlet-post')
    .getAttribute('data-lazypadlet-card-id');
  const postCard = page.locator(`#${postCardId}`);
  await postCard
    .getByRole('button', {
      name: 'View this Padlet post inside Canvas'
    })
    .click();
  if (
    (await postCard.locator('iframe').getAttribute('src')) !==
    'https://padlet.com/teacher/assessment-abcdefghijklmnop/wish/POST12345678'
  ) {
    throw new Error('LazyPadlet did not retain the individual-post URL.');
  }
  await postCard
    .getByRole('button', { name: 'Stop viewing this Padlet post' })
    .click();

  await page.evaluate(() => {
    const row = document.createElement('p');
    row.innerHTML =
      '<a id="dynamic" href="https://editor.p5js.org/student/sketches/DYNAMIC789">Dynamic sketch</a>';
    document.querySelector('#content').append(row);
  });
  await page.waitForFunction(
    () => document.querySelectorAll('.lazyP5-card').length === 3
  );
  await page.waitForTimeout(350);
  if ((await page.locator('.lazyP5-card').count()) !== 3) {
    throw new Error('Dynamic rescanning duplicated a lazyP5 card.');
  }

  if (errors.length) throw new Error(errors.join('\n'));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
