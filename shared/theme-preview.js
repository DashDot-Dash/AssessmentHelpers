(function () {
  'use strict';
  const theme = window.AssessmentHelpersTheme;
  const tokens = [['--ah-bg', 'Panel background'], ['--ah-surface', 'Card surface'], ['--ah-fill', 'Control fill'], ['--ah-text', 'Text'], ['--ah-muted', 'Muted text'], ['--ah-stripe', 'Yellow accent']];
  const overrides = { soft: {}, dark: {} };
  const style = document.createElement('style');
  document.head.appendChild(style);
  function css() {
    return Object.entries(overrides).filter(([, values]) => Object.keys(values).length).map(([name, values]) =>
      `html[data-ah-theme="${name}"] .ah-scope {\n${Object.entries(values).map(([key, value]) => `  ${key}: ${value};`).join('\n')}\n}`).join('\n\n');
  }
  function refresh() {
    const settings = theme.get();
    for (const key of ['theme', 'density']) {
      document.querySelectorAll(`#preview-${key} button`).forEach(button => button.setAttribute('aria-pressed', String(settings[key] === button.dataset.value)));
    }
    document.querySelector('#token-controls').replaceChildren();
    for (const [key, label] of tokens) {
      const row = document.createElement('label');
      row.className = 'preview-token';
      const input = document.createElement('input');
      input.type = 'color';
      const value = getComputedStyle(document.body).getPropertyValue(key).trim();
      input.value = /^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff';
      input.addEventListener('input', () => {
        overrides[theme.get().theme][key] = input.value;
        style.textContent = css();
        document.querySelector('#css-output').textContent = css();
      });
      row.append(label, input);
      document.querySelector('#token-controls').appendChild(row);
    }
    document.querySelector('#css-output').textContent = css() || '/* Adjust a colour to generate CSS overrides. */';
  }
  for (const key of ['theme', 'density']) {
    document.querySelectorAll(`#preview-${key} button`).forEach(button => button.addEventListener('click', () => theme.set({ [key]: button.dataset.value })));
  }
  document.querySelector('#reset-colours').addEventListener('click', () => {
    overrides[theme.get().theme] = {};
    style.textContent = css();
    refresh();
  });
  document.querySelector('#copy-css').addEventListener('click', async event => {
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText(css());
      button.textContent = 'Copied';
    } catch { document.querySelector('#css-output').focus(); }
  });
  document.querySelectorAll('[data-collapse]').forEach(button => button.addEventListener('click', () => {
    const body = button.closest('section').querySelector('.ah-panel__body');
    body.hidden = !body.hidden;
    body.style.display = body.hidden ? 'none' : '';
    button.setAttribute('aria-expanded', String(!body.hidden));
    button.setAttribute('aria-label', body.hidden ? 'Expand sample panel' : 'Minimise sample panel');
  }));
  document.querySelector('#sample-pause').addEventListener('click', event => {
    const paused = event.currentTarget.textContent === 'Pause';
    event.currentTarget.textContent = paused ? 'Resume' : 'Pause';
  });
  theme.onChange(refresh);
  refresh();
})();
