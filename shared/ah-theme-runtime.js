// Source for the embedded theme runtime. npm run build:theme inserts the CSS.
(function () {
  'use strict';
  const VERSION = '1.0.14';
  const STYLE_ID = 'ah-theme';
  const KEY = 'ah:settings';
  const CHANGE_EVENT = 'assessment-helper-theme-changed';
  const CSS = /* BUILD_THEME_CSS */ '';
  const DEFAULTS = { theme: 'soft', density: 'roomy' };
  const listeners = window.AssessmentHelpersTheme?._subscribers || new Set();
  let current = { ...DEFAULTS };

  function normalise(value) {
    return {
      theme: value?.theme === 'dark' ? 'dark' : 'soft',
      density: value?.density === 'compact' ? 'compact' : 'roomy'
    };
  }

  function read() {
    try {
      return normalise(JSON.parse(localStorage.getItem(KEY)) || DEFAULTS);
    } catch {
      return { ...current };
    }
  }

  function apply(value) {
    current = normalise(value);
    document.documentElement.dataset.ahTheme = current.theme;
    document.documentElement.dataset.ahDensity = current.density;
    for (const listener of listeners) {
      try { listener({ ...current }); } catch (error) { console.error(error); }
    }
    // A wider density must not leave a previously dragged header off-screen.
    requestAnimationFrame(() => {
      for (const panel of document.querySelectorAll('.ah-panel')) {
        if (getComputedStyle(panel).position !== 'fixed' || !panel.getClientRects().length) continue;
        const rect = panel.getBoundingClientRect();
        const left = Math.min(Math.max(10, rect.left), Math.max(10, innerWidth - rect.width - 10));
        const top = Math.min(Math.max(10, rect.top), Math.max(10, innerHeight - rect.height - 10));
        if (left !== rect.left) { panel.style.left = `${left}px`; panel.style.right = 'auto'; }
        if (top !== rect.top) { panel.style.top = `${top}px`; panel.style.bottom = 'auto'; }
      }
    });
  }

  function compareVersions(a, b) {
    const left = a.split('.').map(Number), right = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      const difference = (left[i] || 0) - (right[i] || 0);
      if (difference) return difference;
    }
    return 0;
  }

  function inject() {
    const existing = document.getElementById(STYLE_ID);
    if (existing && compareVersions(existing.dataset.version || '0.0.0', VERSION) >= 0) return;
    const style = existing || document.createElement('style');
    style.id = STYLE_ID;
    style.dataset.version = VERSION;
    style.textContent = CSS;
    if (!existing) (document.head || document.documentElement).appendChild(style);
  }

  // Separate from the helper registry: loading the theme must not create or replace it.
  // DOM events and origin-local storage also work across userscript execution contexts.
  inject();
  const installed = window.AssessmentHelpersTheme;
  if (installed && compareVersions(installed.version, VERSION) >= 0) return;
  installed?.dispose?.(true);
  function onStorage(event) {
    if (event.key === KEY || event.key === null) apply(read());
  }
  function onChangeEvent(event) {
    try { apply(JSON.parse(event.detail)); } catch {}
  }
  window.addEventListener('storage', onStorage);
  window.addEventListener(CHANGE_EVENT, onChangeEvent);
  window.AssessmentHelpersTheme = {
    version: VERSION,
    _subscribers: listeners,
    get() { return { ...current }; },
    set(patch) {
      const value = normalise({ ...current, ...patch });
      try { localStorage.setItem(KEY, JSON.stringify(value)); } catch {}
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: JSON.stringify(value) }));
      return { ...value };
    },
    onChange(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    isCompact() { return current.density === 'compact'; },
    dispose(preserveSubscribers = false) {
      if (!preserveSubscribers) listeners.clear();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(CHANGE_EVENT, onChangeEvent);
    }
  };
  apply(read());
})();
