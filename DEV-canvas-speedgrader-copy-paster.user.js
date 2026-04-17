// ==UserScript==
// @name         DEV Canvas SpeedGrader Copy Paster
// @namespace    VisComm@UON
// @version      1.0.0
// @description  Floating assignment-specific comment snippet panel for Canvas SpeedGrader
// @match        *://*/courses/*/gradebook/speed_grader*
// @match        *://*/courses/*/gradebook/speed_grader?*
// @match        *://*/gradebook/speed_grader*
// @require      File:///Users/jbs939/Desktop/AssessmentHelpers/DEV-canvas-speedgrader-copy-paster.user.js
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Manages reusable SpeedGrader comment snippets for the current assignment.

  // constants/config
  const PANEL_ID = 'sg-copypaster-panel';
  const STYLE_ID = 'sg-copypaster-style';
  const Z_INDEX_BASE = 100000;
  const STORAGE_PREFIX = 'canvas_speedgrader_copy_paster_v1';
  const LEGACY_STORAGE_PREFIX = 'sgCopyPaster_v01';

  const DEFAULT_SNIPPETS = [
    {
      id: crypto.randomUUID(),
      label: 'Strong concept',
      text: 'This is a strong concept with a clear direction and a well-developed visual language.'
    },
    {
      id: crypto.randomUUID(),
      label: 'Needs development',
      text: 'There is a clear starting point here, but the work would benefit from further development and refinement.'
    },
    {
      id: crypto.randomUUID(),
      label: 'Technical refinement',
      text: 'The project would benefit from greater technical refinement, particularly in the consistency and finish of the outcome.'
    }
  ];

  // selectors
  const selectors = {
    panel: `#${PANEL_ID}`,
    editorIframeSuffix: 'iframe[id$="_ifr"]'
  };

  // state
  const state = {
    lastHref: location.href
  };

  // elements
  const elements = {};

  // utilities
  function getElement(sel, root = document) {
    return root.querySelector(sel);
  }

  function bringPanelToFront(panel) {
    if (!panel) return;
    const current = Number(window.__canvasAssessmentPanelZIndex || Z_INDEX_BASE);
    const next = current + 1;
    window.__canvasAssessmentPanelZIndex = next;
    panel.style.zIndex = String(next);
  }

  function getElements(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function cleanText(s) {
    return (s || '').replace(/\s+/g, ' ').trim();
  }

  function getUrl() {
    return new URL(window.location.href);
  }

  function getCourseId() {
    const m = location.pathname.match(/\/courses\/(\d+)\//);
    return m ? m[1] : 'unknown-course';
  }

  function getAssignmentId() {
    const url = getUrl();
    return (
      url.searchParams.get('assignment_id') ||
      url.searchParams.get('assignment') ||
      'unknown-assignment'
    );
  }

  function getAssignmentName() {
    const selectorList = [
      '[data-testid="assignment-name"]',
      '[data-testid="assignment-select-trigger"]',
      '[data-testid="assignment_select"]',
      '#assignment_url',
      '#assignment_select',
      '#assignment_select option:checked',
      'select[name="assignment_id"]',
      'select[name="assignment_id"] option:checked',
      'a[href*="/assignments/"][aria-current="page"]',
      'a[href*="assignment_id="][aria-current="page"]'
    ];

    for (const selector of selectorList) {
      const text = getAssignmentTextFromElement(getElement(selector));
      if (text) return cleanAssignmentName(text);
    }

    const pageTextName = getAssignmentNameFromPageText();
    if (pageTextName) return pageTextName;

    const title = cleanText(document.title || '').replace(/\s*\|\s*SpeedGrader.*$/i, '');
    if (title && !/^SpeedGrader$/i.test(title)) return cleanAssignmentName(title);

    return `Assignment ${getAssignmentId()}`;
  }

  function getAssignmentTextFromElement(el) {
    if (!el) return '';
    if (el.selectedOptions?.length) return cleanText(el.selectedOptions[0].textContent || '');
    return cleanText(el.textContent || el.value || el.getAttribute?.('aria-label') || '');
  }

  function cleanAssignmentName(value) {
    return cleanText(value)
      .replace(/^Assignment:\s*/i, '')
      .replace(/\s+[A-Z]{4}\d{4}\b.*$/, '')
      .replace(/,?\s*SpeedGrader,?\s*$/i, '')
      .replace(/[,\s]+$/, '')
      .trim();
  }

  function getAssignmentNameFromPageText() {
    const lines = String(document.body?.innerText || '').split(/\r?\n/);
    for (const line of lines) {
      const match = cleanText(line).match(/^(.{3,140}?)\s+[A-Z]{4}\d{4}\b/);
      if (match) {
        const cleaned = cleanAssignmentName(match[1]);
        if (cleaned && !/^SpeedGrader$/i.test(cleaned)) return cleaned;
      }
    }
    return '';
  }

  function getStorageKey(prefix = STORAGE_PREFIX) {
    return `${prefix}:${getCourseId()}:${getAssignmentId()}`;
  }

  function getLegacyStorageKey() {
    return getStorageKey(LEGACY_STORAGE_PREFIX);
  }

  function getStoredJson() {
    return localStorage.getItem(getStorageKey()) || localStorage.getItem(getLegacyStorageKey());
  }

  // storage helpers
  function defaultStore() {
    return {
      snippets: DEFAULT_SNIPPETS,
      ui: {
        collapsed: false,
        posX: null,
        posY: null,
        mode: 'append' // append | replace
      }
    };
  }

  function loadStore() {
    try {
      const parsed = JSON.parse(getStoredJson());
      if (!parsed) return defaultStore();
      parsed.snippets = Array.isArray(parsed.snippets) ? parsed.snippets : DEFAULT_SNIPPETS;
      parsed.ui = parsed.ui || { collapsed: false, posX: null, posY: null, mode: 'append' };
      if (!parsed.ui.mode) parsed.ui.mode = 'append';
      return parsed;
    } catch {
      return defaultStore();
    }
  }

  function saveStore(store) {
    localStorage.setItem(getStorageKey(), JSON.stringify(store));
  }

  function updateCollapsed(collapsed) {
    const store = loadStore();
    store.ui.collapsed = collapsed;
    saveStore(store);
    renderPanel();
  }

  function getCollapsed() {
    return !!loadStore().ui?.collapsed;
  }

  function updateMode(mode) {
    const store = loadStore();
    store.ui.mode = mode;
    saveStore(store);
    renderPanel();
  }

  function getMode() {
    return loadStore().ui?.mode || 'append';
  }

  function updatePanelPosition(x, y) {
    const store = loadStore();
    store.ui.posX = x;
    store.ui.posY = y;
    saveStore(store);

    const panel = document.getElementById(PANEL_ID);
    if (panel) {
      panel.style.left = `${x}px`;
      panel.style.top = `${y}px`;
      panel.style.right = 'auto';
    }
  }

  function getPanelPosition() {
    const ui = loadStore().ui || {};
    return { x: ui.posX, y: ui.posY };
  }

  function clampPanelToViewport(panel, persist = false) {
    if (!panel) return;
    const margin = 8;
    const rect = panel.getBoundingClientRect();
    const width = rect.width || 340;
    const height = rect.height || 80;
    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - height - margin);
    const left = Math.min(Math.max(margin, rect.left), maxLeft);
    const top = Math.min(Math.max(margin, rect.top), maxTop);

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.right = 'auto';

    if (persist) updatePanelPosition(left, top);
  }

  function getSnippets() {
    return loadStore().snippets || [];
  }

  function addSnippet(label, text) {
    const store = loadStore();
    store.snippets.push({
      id: crypto.randomUUID(),
      label: cleanText(label) || 'Untitled',
      text: text || ''
    });
    saveStore(store);
    renderPanel();
  }

  function updateSnippet(id, label, text) {
    const store = loadStore();
    const item = store.snippets.find(s => s.id === id);
    if (!item) return;
    item.label = cleanText(label) || 'Untitled';
    item.text = text || '';
    saveStore(store);
    renderPanel();
  }

  function deleteSnippet(id) {
    const ok = window.confirm('Delete this snippet?');
    if (!ok) return;

    const store = loadStore();
    store.snippets = store.snippets.filter(s => s.id !== id);
    saveStore(store);
    renderPanel();
  }

  function resetAssignmentSnippets() {
    const ok = window.confirm(
      'Reset Copy/Paster for this assignment? This will remove all saved snippets for the current course + assignment.'
    );
    if (!ok) return;

    localStorage.removeItem(getStorageKey());
    localStorage.removeItem(getLegacyStorageKey());
    renderPanel();
  }

  function handleExportData() {
    const payload = {
      context: {
        courseId: getCourseId(),
        assignmentId: getAssignmentId(),
        exportedAt: new Date().toISOString()
      },
      data: loadStore()
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `copypaster-course-${getCourseId()}-assignment-${getAssignmentId()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

function handleImportData(file) {
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed.data || !Array.isArray(parsed.data.snippets)) {
        throw new Error('Bad format');
      }

      const importedSnippets = parsed.data.snippets || [];
      const currentStore = loadStore();

      const mode = window.prompt(
        'Import mode: type "merge" to add imported snippets to the current assignment, or "replace" to overwrite current snippets.',
        'merge'
      );

      if (mode === null) return;

      const normalizedMode = mode.trim().toLowerCase();

      if (normalizedMode !== 'merge' && normalizedMode !== 'replace') {
        alert('Import cancelled. Please type either "merge" or "replace".');
        return;
      }

      if (normalizedMode === 'replace') {
        const newStore = {
          ...currentStore,
          snippets: importedSnippets.map(snippet => ({
            id: crypto.randomUUID(),
            label: cleanText(snippet.label) || 'Untitled',
            text: snippet.text || ''
          }))
        };

        saveStore(newStore);
        renderPanel();
        alert(`Imported ${newStore.snippets.length} snippets using replace mode.`);
        return;
      }

      // merge mode
      const existingSnippets = currentStore.snippets || [];
      const merged = [...existingSnippets];

      let addedCount = 0;
      let skippedCount = 0;

      for (const snippet of importedSnippets) {
        const label = cleanText(snippet.label) || 'Untitled';
        const text = snippet.text || '';

        const duplicate = existingSnippets.some(existing =>
          cleanText(existing.label) === label && (existing.text || '') === text
        ) || merged.some(existing =>
          cleanText(existing.label) === label && (existing.text || '') === text
        );

        if (duplicate) {
          skippedCount++;
          continue;
        }

        merged.push({
          id: crypto.randomUUID(),
          label,
          text
        });
        addedCount++;
      }

      const newStore = {
        ...currentStore,
        snippets: merged
      };

      saveStore(newStore);
      renderPanel();
      alert(`Merge complete. Added ${addedCount} snippets, skipped ${skippedCount} duplicates.`);
    } catch (err) {
      console.error(err);
      alert('That file does not look like a valid Copy/Paster export.');
    }
  };

  reader.readAsText(file);
}

  // ----------------------------
  // Editor access
  // ----------------------------

  function getEditorIframe() {
    // Prefer TinyMCE/Canvas RCE iframe IDs ending in _ifr
    const iframe =
      getElement('iframe.tox-edit-area__iframe') ||
      getElement(selectors.editorIframeSuffix) ||
      getElements('iframe').find(el => /rce|tox|_ifr/i.test(el.id || ''));

    return iframe || null;
  }

  function getEditorDocument() {
    const iframe = getEditorIframe();
    if (!iframe) return null;

    try {
      return iframe.contentDocument || iframe.contentWindow?.document || null;
    } catch {
      return null;
    }
  }

  function getEditorBody() {
    const doc = getEditorDocument();
    if (!doc) return null;
    return doc.body || null;
  }

  function getEditorHtml() {
    const body = getEditorBody();
    return body ? body.innerHTML : '';
  }

  function getEditorText() {
    const body = getEditorBody();
    return body ? cleanText(body.innerText || body.textContent || '') : '';
  }

  function focusEditor() {
    const body = getEditorBody();
    if (!body) return false;
    body.focus();
    return true;
  }

  function setEditorHtml(html) {
    const body = getEditorBody();
    if (!body) return false;

    body.innerHTML = html;
    dispatchEditorChange();
    focusEditor();
    return true;
  }

  function appendPlainTextToEditor(text) {
    const body = getEditorBody();
    if (!body) return false;

    const existingText = getEditorText();
    let newHtml = '';

    if (!existingText) {
      newHtml = `<p>${escapeHtml(text)}</p>`;
    } else {
      const currentHtml = getEditorHtml().trim();
      const spacer = currentHtml ? '<p><br></p>' : '';
      newHtml = `${currentHtml}${spacer}<p>${escapeHtml(text)}</p>`;
    }

    body.innerHTML = newHtml;
    dispatchEditorChange();
    focusEditor();
    return true;
  }

  function replaceEditorWithPlainText(text) {
    return setEditorHtml(`<p>${escapeHtml(text)}</p>`);
  }

  function insertSnippet(text) {
    const mode = getMode();
    const ok =
      mode === 'replace'
        ? replaceEditorWithPlainText(text)
        : appendPlainTextToEditor(text);

    if (!ok) {
      alert('Could not find the SpeedGrader comment editor.');
    }
  }

  function copySnippetToClipboard(text) {
    navigator.clipboard.writeText(text).then(
      () => alert('Snippet copied to clipboard.'),
      () => alert('Could not copy to clipboard.')
    );
  }

  function dispatchEditorChange() {
    const body = getEditorBody();
    const iframe = getEditorIframe();
    if (!body || !iframe) return;

    // Trigger common events Canvas/TinyMCE listens for
    body.dispatchEvent(new Event('input', { bubbles: true }));
    body.dispatchEvent(new Event('change', { bubbles: true }));
    body.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: ' ' }));

    iframe.dispatchEvent(new Event('input', { bubbles: true }));
    iframe.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
    function focusEditorAtEndWithNewLine() {
  const body = getEditorBody();
  const doc = getEditorDocument();
  if (!body || !doc) return false;

  body.focus();

  const hasText = cleanText(body.innerText || body.textContent || '');

  if (!hasText) {
    // Empty editor: just place cursor in first paragraph
    if (!body.innerHTML.trim()) {
      body.innerHTML = '<p><br></p>';
      dispatchEditorChange();
    }
  } else {
    // If there is existing content, ensure there is a blank paragraph at the end
    const lastEl = body.lastElementChild;
    const lastText = cleanText(lastEl?.textContent || '');

    const lastIsBlankParagraph =
      lastEl &&
      lastEl.tagName === 'P' &&
      (lastEl.innerHTML === '<br>' || lastEl.innerHTML === '&nbsp;' || lastText === '');

    if (!lastIsBlankParagraph) {
      const p = doc.createElement('p');
      p.innerHTML = '<br>';
      body.appendChild(p);
      dispatchEditorChange();
    }
  }

  // Place cursor at the end of the editor
  const selection = doc.getSelection();
  const range = doc.createRange();

  let targetNode = body.lastChild;
  if (!targetNode) {
    targetNode = doc.createElement('p');
    targetNode.innerHTML = '<br>';
    body.appendChild(targetNode);
  }

  range.selectNodeContents(targetNode);
  range.collapse(false);

  selection.removeAllRanges();
  selection.addRange(range);

  return true;
}

  // ----------------------------
  // UI
  // ----------------------------

  function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') {
        el.addEventListener(k.slice(2), v);
      } else {
        el.setAttribute(k, v);
      }
    }
    for (const child of children) {
      if (child == null) continue;
      el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return el;
  }

 function addStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${PANEL_ID} {
      position: fixed;
      top: 80px;
      left: 20px;
      width: 340px;
      z-index: ${Z_INDEX_BASE};
      background: #1f2329;
      color: #f3f4f6;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.28);
      overflow: hidden;
      font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    #${PANEL_ID}.dragging {
      opacity: 0.92;
      user-select: none;
    }

    #${PANEL_ID} * {
      box-sizing: border-box;
    }

    #${PANEL_ID} .cp-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      cursor: grab;
      background: #252b33;
      border-bottom: 1px solid rgba(255,255,255,0.06);
        position: relative;
  padding-left: 25px;
    }
        #${PANEL_ID} .cp-head::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0px;
  bottom: 0px;
  width: 12px;
  background: #d6a21d;
  border-radius: 0 2px 2px 0;
}

    #${PANEL_ID} .cp-head-buttons {
      display: flex;
      gap: 6px;
    }

    #${PANEL_ID} .cp-body {
      padding: 12px;
    }

    #${PANEL_ID} .cp-row {
      margin-bottom: 12px;
    }

    #${PANEL_ID} .cp-small {
     
      font-size:11px;
      color: #9aa3af;
    }

    #${PANEL_ID} .cp-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    #${PANEL_ID} .cp-grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }

    #${PANEL_ID} button,
    #${PANEL_ID} input,
    #${PANEL_ID} textarea,
    #${PANEL_ID} select {
      font: inherit;
    }

    #${PANEL_ID} button {
  appearance: none;
  -webkit-appearance: none;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 11px;
  
  background: #11151a;
  color: #f3f4f6;
  border: 1px solid rgba(255,255,255,0.08);
}
}

    #${PANEL_ID} button:hover {
      background: #171c22;
      filter: none;
    }

    #${PANEL_ID} button.active {
      outline: 2px solid rgba(255,255,255,0.22);
      outline-offset: 0;
    }

    #${PANEL_ID} input[type="text"],
    #${PANEL_ID} textarea {
      width: 100%;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.08);
      background: #11151a;
      color: #f3f4f6;
      padding: 8px 10px;
    }

    #${PANEL_ID} textarea {
      min-height: 90px;
      resize: vertical;
    }

    #${PANEL_ID} .cp-list {
      max-height: 260px;
      overflow: auto;
      border-radius: 10px;
      background: #161a20;
      border: 1px solid rgba(255,255,255,0.05);
      padding: 6px;
    }

    #${PANEL_ID} .cp-item {
      padding: 10px;
      border-radius: 10px;
      background: #1b2027;
      border: 1px solid rgba(255,255,255,0.05);
      margin-bottom: 8px;
    }

    #${PANEL_ID} .cp-item:last-child {
      margin-bottom: 0;
    }

    #${PANEL_ID} .cp-item-head {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
    }

    #${PANEL_ID} .cp-item-title {
      font-size:11px;
      color: #fff;
    }

    #${PANEL_ID} .cp-item-text {
      font-size: 11px;
      color: #c7ced8;
      white-space: pre-wrap;
      margin-bottom: 8px;
    }

    #${PANEL_ID} .cp-item-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: nowrap;
    }

    #${PANEL_ID} .cp-item-actions-left,
    #${PANEL_ID} .cp-item-actions-right {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    #${PANEL_ID} .cp-item-actions-left {
      flex: 0 0 auto;
    }

    #${PANEL_ID} .cp-item-actions-right {
      flex: 1 1 auto;
      justify-content: flex-end;
    }

#${PANEL_ID} .cp-btn-primary {
padding: 4px 8px;
  background: #2f7d32;
  color: #ffffff;
  font-size: 11pt;
 
  border: 1px solid rgba(255,255,255,0.08);
}

#${PANEL_ID} .cp-btn-primary:hover {
  background: #38943c;
}

    #${PANEL_ID} .cp-btn-wide {
      width: 100%;
      justify-content: center;
    }

    #${PANEL_ID} .cp-btn-small {
      padding: 4px 8px;
      font-size: 11px;
      background: #161a20;
      color: #d5d9df;
      border: 1px solid rgba(255,255,255,0.06);
    }

    #${PANEL_ID} .cp-btn-small:hover {
      background: #1b2027;
    }

    #${PANEL_ID} .cp-btn-danger {
      background: #8b1e2d;
      color: #fff2f4;
      border: 1px solid rgba(255,255,255,0.08);
    }

    #${PANEL_ID} .cp-btn-danger:hover {
      background: #a32437;
    }

    #${PANEL_ID} input[type="file"] {
      display: none;
    }
  `;
  document.head.appendChild(style);
}

  function bindDragging(panel, handle) {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let origX = 0;
    let origY = 0;

    handle.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, input, textarea, select')) return;

      bringPanelToFront(panel);
      dragging = true;
      panel.classList.add('dragging');

      const rect = panel.getBoundingClientRect();
      origX = rect.left;
      origY = rect.top;
      startX = e.clientX;
      startY = e.clientY;

      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;

      const nextX = origX + (e.clientX - startX);
      const nextY = origY + (e.clientY - startY);

      panel.style.left = `${Math.max(0, nextX)}px`;
      panel.style.top = `${Math.max(0, nextY)}px`;
      panel.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      panel.classList.remove('dragging');

      const rect = panel.getBoundingClientRect();
      updatePanelPosition(rect.left, rect.top);
    });

    if (panel.dataset.resizeClampBound !== '1') {
      window.addEventListener('resize', () => clampPanelToViewport(panel, true));
      panel.dataset.resizeClampBound = '1';
    }
  }

  function openSnippetEditor(existing = null) {
    const label = window.prompt('Snippet label:', existing?.label || '');
    if (label === null) return;

    const text = window.prompt('Snippet text:', existing?.text || '');
    if (text === null) return;

    if (existing) {
      updateSnippet(existing.id, label, text);
    } else {
      addSnippet(label, text);
    }
  }

  function renderPanel() {
    if (!document.body) return;

    addStyles();

    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement('div');
      panel.id = PANEL_ID;
      document.body.appendChild(panel);
    }
    elements.panel = panel;
    if (panel.dataset.frontBound !== '1') {
      panel.addEventListener('mousedown', () => bringPanelToFront(panel), true);
      panel.dataset.frontBound = '1';
    }

    const collapsed = getCollapsed();
    const mode = getMode();
    const snippets = getSnippets();

    panel.innerHTML = '';

    const head = createElement('div', {
  class: 'cp-head',
  style: collapsed ? 'border-bottom:0;' : ''
}, [
      createElement('div', { text: 'Copy + Paster' }),
      createElement('div', { class: 'cp-head-buttons' }, [
        createElement('button', {
          text: collapsed ? 'Expand' : 'Minimise',
          onclick: () => updateCollapsed(!collapsed)
        })
      ])
    ]);

    panel.appendChild(head);

    const pos = getPanelPosition();
    if (pos.x != null && pos.y != null) {
      panel.style.left = `${pos.x}px`;
      panel.style.top = `${pos.y}px`;
      panel.style.right = 'auto';
      clampPanelToViewport(panel, true);
    }

    bindDragging(panel, head);

    if (collapsed) return;

    const body = createElement('div', { class: 'cp-body' });

body.appendChild(
  createElement('div', {
    class: 'cp-row cp-small',
    style: 'background:#161a20;border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:10px;'
  }, [
    `Assignment: ${getAssignmentName()}`
  ])
);

    body.appendChild(
      createElement('div', { class: 'cp-row cp-grid' }, [
        createElement('button', {
          class: mode === 'append' ? 'active' : '',
          text: 'Append mode',
          onclick: () => updateMode('append')
        }),
        createElement('button', {
          class: mode === 'replace' ? 'active' : '',
          text: 'Replace mode',
          onclick: () => updateMode('replace')
        })
      ])
    );

const list = createElement('div', { class: 'cp-row cp-list' });

if (!snippets.length) {
  list.appendChild(
    createElement('div', { class: 'cp-item' }, [
      createElement('div', { class: 'cp-item-text', text: 'No snippets yet.' })
    ])
  );
} else {
  snippets.forEach(snippet => {
    list.appendChild(
      createElement('div', { class: 'cp-item' }, [
        createElement('div', { class: 'cp-item-head' }, [
          createElement('div', { class: 'cp-item-title', text: snippet.label }),
        ]),
        createElement('div', { class: 'cp-item-text', text: snippet.text }),
        createElement('div', { class: 'cp-item-actions' }, [
          createElement('div', { class: 'cp-item-actions-left' }, [
            createElement('button', {
              class: 'cp-btn-primary',
              text: 'Insert',
              onclick: () => insertSnippet(snippet.text)
            })
          ]),
          createElement('div', { class: 'cp-item-actions-right' }, [
            createElement('button', {
              class: 'cp-btn-small',
              text: 'Copy',
              onclick: () => copySnippetToClipboard(snippet.text)
            }),
            createElement('button', {
              class: 'cp-btn-small',
              text: 'Edit',
              onclick: () => openSnippetEditor(snippet)
            }),
            createElement('button', {
              class: 'cp-btn-small cp-btn-danger',
              text: 'Delete',
              onclick: () => deleteSnippet(snippet.id)
            })
          ])
        ])
      ])
    );
  });
}

  body.appendChild(
  createElement('div', { class: 'cp-row' }, [
    createElement('button', {
      class: 'cp-btn-primary cp-btn-wide',
      text: 'Add new snippet',
      onclick: () => openSnippetEditor()
    })
  ])
);

    body.appendChild(list);

body.appendChild(
  createElement('div', { class: 'cp-row' }, [
    createElement('button', {
      class: 'cp-btn-primary cp-btn-wide',
      text: 'Keep typing',
      onclick: () => {
        const ok = focusEditorAtEndWithNewLine();
        if (!ok) alert('Could not find the comment editor.');
      }
    })
  ])
);

    const fileInput = createElement('input', {
      type: 'file',
      accept: 'application/json'
    });
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) handleImportData(file);
    });
    body.appendChild(fileInput);

    body.appendChild(
      createElement('div', { class: 'cp-row cp-grid-3' }, [
        createElement('button', {
          text: 'Export',
          onclick: handleExportData
        }),
        createElement('button', {
          text: 'Import',
          onclick: () => body.querySelector('input[type="file"]')?.click()
        }),
        createElement('button', {
          class: 'cp-btn-danger',
          text: 'Reset',
          onclick: resetAssignmentSnippets
        })
      ])
    );

    body.appendChild(
      createElement('div', { class: 'cp-small' }, [
        'Append mode adds below existing text. Replace mode overwrites it. Use keep typing to add individual comments'
      ])
    );

    panel.appendChild(body);
  }

  function init() {
    const tryRender = () => {
      if (!document.body) {
        setTimeout(tryRender, 250);
        return;
      }
      renderPanel();
    };

    tryRender();
    setTimeout(renderPanel, 1500);
    setTimeout(renderPanel, 3500);

    setInterval(() => {
      if (location.href !== state.lastHref) {
        state.lastHref = location.href;
        setTimeout(renderPanel, 250);
      }
    }, 400);

    const observer = new MutationObserver(() => {
      if (!document.getElementById(PANEL_ID)) {
        renderPanel();
      }
    });

    const startObserver = () => {
      if (!document.body) {
        setTimeout(startObserver, 300);
        return;
      }
      observer.observe(document.body, { childList: true, subtree: true });
    };

    startObserver();
  }

  init();
})();
