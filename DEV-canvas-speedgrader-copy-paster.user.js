// ==UserScript==
// @name         DEV Assessment Helpers - Copy/Paster
// @namespace    AssessmentHelpers
// @version      1.0.0
// @description  Assessment Helpers panel for reusable Canvas SpeedGrader comment snippets
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
  const HELPER_ID = 'copy-paster';
  const HELPER_NAME = 'Copy/Paster';
  const PANEL_ID = 'sg-copypaster-panel';
  const STYLE_ID = 'sg-copypaster-style';
  const Z_INDEX_BASE = 100000;
  const STORAGE_PREFIX = 'canvas_speedgrader_copy_paster_v1';
  const LEGACY_STORAGE_PREFIX = 'sgCopyPaster_v01';
  const GRADE_BANDS = ['HD', 'D', 'C', 'P', 'F', 'No submission', 'Uncategorised'];
  const DEFAULT_GRADE_BAND = 'Uncategorised';
  const DEFAULT_CATEGORY = 'General';
  const DEFAULT_COMMENT_LIST_HEIGHT = 260;
  const MIN_COMMENT_LIST_HEIGHT = 160;

  const DEFAULT_SNIPPETS = [
    {
      id: crypto.randomUUID(),
      title: 'Strong concept',
      body: 'This is a strong concept with a clear direction and a well-developed visual language.',
      gradeBand: DEFAULT_GRADE_BAND,
      category: DEFAULT_CATEGORY,
      isStarter: false
    },
    {
      id: crypto.randomUUID(),
      title: 'Needs development',
      body: 'There is a clear starting point here, but the work would benefit from further development and refinement.',
      gradeBand: DEFAULT_GRADE_BAND,
      category: DEFAULT_CATEGORY,
      isStarter: false
    },
    {
      id: crypto.randomUUID(),
      title: 'Technical refinement',
      body: 'The project would benefit from greater technical refinement, particularly in the consistency and finish of the outcome.',
      gradeBand: DEFAULT_GRADE_BAND,
      category: DEFAULT_CATEGORY,
      isStarter: false
    }
  ];

  // selectors
  const selectors = {
    panel: `#${PANEL_ID}`,
    editorIframeSuffix: 'iframe[id$="_ifr"]'
  };

  // state
  const state = {
    lastHref: location.href,
    editingSnippet: null,
    importMessage: ''
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

  function cleanField(value) {
    return String(value ?? '').trim();
  }

  function normalizeGradeBand(value) {
    const cleaned = cleanText(value);
    if (!cleaned) return DEFAULT_GRADE_BAND;
    const aliases = {
      'high distinction': 'HD',
      distinction: 'D',
      credit: 'C',
      pass: 'P',
      fail: 'F',
      'no submission': 'No submission'
    };
    if (aliases[cleaned.toLowerCase()]) return aliases[cleaned.toLowerCase()];
    const match = GRADE_BANDS.find(band => band.toLowerCase() === cleaned.toLowerCase());
    return match || cleaned;
  }

  function normalizeCategory(value) {
    return cleanText(value) || DEFAULT_CATEGORY;
  }

  function normalizeStarter(value) {
    if (typeof value === 'boolean') return value;
    return ['yes', 'true', '1', 'starter'].includes(cleanText(value).toLowerCase());
  }

  function makeSnippetTitle(body) {
    const cleaned = cleanText(body);
    if (!cleaned) return 'Untitled';
    if (cleaned.length <= 60) return cleaned;
    const slice = cleaned.slice(0, 57).replace(/\s+\S*$/, '').trim();
    return `${slice || cleaned.slice(0, 57)}...`;
  }

  function normalizeSnippet(snippet = {}) {
    const body = cleanField(snippet.body ?? snippet.text ?? snippet.comment);
    const title = cleanText(snippet.title ?? snippet.label) || makeSnippetTitle(body);

    return {
      ...snippet,
      id: snippet.id || crypto.randomUUID(),
      title,
      body,
      gradeBand: normalizeGradeBand(snippet.gradeBand ?? snippet.grade_band),
      category: normalizeCategory(snippet.category),
      isStarter: normalizeStarter(snippet.isStarter ?? snippet.starter),
      label: title,
      text: body
    };
  }

  function normalizeSnippets(snippets) {
    return (Array.isArray(snippets) ? snippets : DEFAULT_SNIPPETS).map(normalizeSnippet);
  }

  function getSnippetTitle(snippet) {
    return cleanText(snippet?.title ?? snippet?.label) || 'Untitled';
  }

  function getSnippetBody(snippet) {
    return cleanField(snippet?.body ?? snippet?.text);
  }

  function getCategoryOptions(snippets) {
    const categories = snippets.map(snippet => normalizeCategory(snippet.category));
    return Array.from(new Set(categories)).sort((a, b) => a.localeCompare(b));
  }

  function createSelectOptions(values, selectedValue) {
    return values.map(value => createElement('option', {
      value,
      text: value,
      selected: value === selectedValue ? 'selected' : null
    }));
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
    const bodyClone = document.body?.cloneNode(true);
    bodyClone?.querySelectorAll([
      '#sg-copypaster-panel',
      '#assessment-helper-dock',
      '#sg-benchmarker-panel',
      '#chatster-lmg-panel',
      '#vc-gradebridge-panel',
      '#wwie-prince-panel'
    ].join(',')).forEach(el => el.remove());

    const lines = String(bodyClone?.innerText || '').split(/\r?\n/);
    for (const line of lines) {
      const match = cleanText(line).match(/^(.{3,140}?)\s+[A-Z]{4}\d{4}\b/);
      if (match) {
        const cleaned = cleanAssignmentName(match[1]);
        if (
          cleaned &&
          !/^SpeedGrader$/i.test(cleaned) &&
          !/^Students in\b/i.test(cleaned)
        ) {
          return cleaned;
        }
      }
    }
    return '';
  }

  function getLocalGroupContext() {
    try {
      const raw = localStorage.getItem('chatster_tutorial_sorter_context_v11');
      if (!raw) return null;

      const context = JSON.parse(raw);
      if (!context) return null;

      const currentCourseKey = getCourseId();
      if (context.course_key && context.course_key !== currentCourseKey) return null;

      return context;
    } catch {
      return null;
    }
  }

  function formatClassAssignmentInfo() {
    const context = getLocalGroupContext();
    const metadata = context?.metadata || {};
    const classInfo = context?.active_group_id
      ? [
          [metadata.day, metadata.time].filter(Boolean).join(' '),
          metadata.location
        ].filter(Boolean).join(' · ')
      : '';
    const assignmentName = getAssignmentName();

    return [classInfo, assignmentName].filter(Boolean).join(' | ');
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
        mode: 'append', // append | replace
        gradeBandFilter: 'All',
        categoryFilter: 'All categories',
        importExportOpen: false,
        commentListHeight: DEFAULT_COMMENT_LIST_HEIGHT
      }
    };
  }

  function loadStore() {
    try {
      const parsed = JSON.parse(getStoredJson());
      if (!parsed) return defaultStore();
      parsed.snippets = normalizeSnippets(parsed.snippets);
      parsed.ui = parsed.ui || {};
      if (parsed.ui.collapsed == null) parsed.ui.collapsed = false;
      if (parsed.ui.posX == null) parsed.ui.posX = null;
      if (parsed.ui.posY == null) parsed.ui.posY = null;
      if (!parsed.ui.mode) parsed.ui.mode = 'append';
      if (!parsed.ui.gradeBandFilter) parsed.ui.gradeBandFilter = 'All';
      if (!parsed.ui.categoryFilter) parsed.ui.categoryFilter = 'All categories';
      if (parsed.ui.importExportOpen == null) parsed.ui.importExportOpen = false;
      if (!parsed.ui.commentListHeight) parsed.ui.commentListHeight = DEFAULT_COMMENT_LIST_HEIGHT;
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

  function updateGradeBandFilter(gradeBand) {
    const store = loadStore();
    store.ui.gradeBandFilter = gradeBand || 'All';
    saveStore(store);
    renderPanel();
  }

  function getGradeBandFilter() {
    return loadStore().ui?.gradeBandFilter || 'All';
  }

  function updateCategoryFilter(category) {
    const store = loadStore();
    store.ui.categoryFilter = category || 'All categories';
    saveStore(store);
    renderPanel();
  }

  function getCategoryFilter() {
    return loadStore().ui?.categoryFilter || 'All categories';
  }

  function updateImportExportOpen(open) {
    const store = loadStore();
    store.ui.importExportOpen = open;
    saveStore(store);
  }

  function getImportExportOpen() {
    return !!loadStore().ui?.importExportOpen;
  }

  function updateCommentListHeight(height) {
    const store = loadStore();
    store.ui.commentListHeight = height;
    saveStore(store);
  }

  function getCommentListHeight() {
    const storedHeight = Number(loadStore().ui?.commentListHeight);
    return storedHeight > 0 ? storedHeight : DEFAULT_COMMENT_LIST_HEIGHT;
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
    const width = rect.width || 510;
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

  function addSnippet(snippet) {
    const store = loadStore();
    store.snippets.push(normalizeSnippet({
      ...snippet,
      id: crypto.randomUUID()
    }));
    saveStore(store);
    renderPanel();
  }

  function updateSnippet(id, snippet) {
    const store = loadStore();
    const item = store.snippets.find(s => s.id === id);
    if (!item) return;
    Object.assign(item, normalizeSnippet({
      ...item,
      ...snippet,
      id
    }));
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

  function csvEscape(value) {
    const text = String(value ?? '');
    if (/[",\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
    return text;
  }

  function snippetsToCsv(snippets) {
    const header = ['grade_band', 'category', 'title', 'comment', 'starter'];
    const rows = snippets.map(snippet => [
      normalizeGradeBand(snippet.gradeBand),
      normalizeCategory(snippet.category),
      getSnippetTitle(snippet),
      getSnippetBody(snippet),
      snippet.isStarter ? 'yes' : ''
    ]);

    return [header, ...rows]
      .map(row => row.map(csvEscape).join(','))
      .join('\r\n');
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];

      if (inQuotes) {
        if (char === '"' && next === '"') {
          field += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          field += char;
        }
        continue;
      }

      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field);
        field = '';
      } else if (char === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else if (char !== '\r') {
        field += char;
      }
    }

    row.push(field);
    rows.push(row);
    return rows;
  }

  function rowIsBlank(row) {
    return row.every(value => cleanText(value) === '');
  }

  function csvRowsToSnippets(rows) {
    const nonBlankRows = rows.filter(row => !rowIsBlank(row));
    if (!nonBlankRows.length) return [];

    const headers = nonBlankRows[0].map(header =>
      cleanText(header).replace(/^\uFEFF/, '').toLowerCase()
    );
    const indexOf = name => headers.indexOf(name);
    const indexes = {
      gradeBand: indexOf('grade_band'),
      category: indexOf('category'),
      title: indexOf('title'),
      body: indexOf('comment'),
      starter: indexOf('starter')
    };

    if (indexes.body === -1) throw new Error('Missing comment column');

    return nonBlankRows.slice(1)
      .map(row => {
        const valueAt = index => (index >= 0 ? cleanField(row[index]) : '');
        const body = valueAt(indexes.body);
        if (!body) return null;

        return normalizeSnippet({
          id: crypto.randomUUID(),
          title: valueAt(indexes.title) || makeSnippetTitle(body),
          body,
          gradeBand: valueAt(indexes.gradeBand) || DEFAULT_GRADE_BAND,
          category: valueAt(indexes.category) || DEFAULT_CATEGORY,
          isStarter: normalizeStarter(valueAt(indexes.starter))
        });
      })
      .filter(Boolean);
  }

  function handleExportData() {
    const csv = snippetsToCsv(getSnippets());
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `copypaster-course-${getCourseId()}-assignment-${getAssignmentId()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

function handleImportData(file) {
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const raw = String(reader.result || '');
      let importedSnippets = [];

      if (/\.json$/i.test(file.name)) {
        const parsed = JSON.parse(raw);
        if (!parsed.data || !Array.isArray(parsed.data.snippets)) {
          throw new Error('Bad format');
        }
        importedSnippets = normalizeSnippets(parsed.data.snippets)
          .filter(snippet => getSnippetBody(snippet));
      } else {
        importedSnippets = csvRowsToSnippets(parseCsv(raw));
      }

      const currentStore = loadStore();
      const importedWithFreshIds = importedSnippets.map(snippet => normalizeSnippet({
        ...snippet,
        id: crypto.randomUUID()
      }));

      saveStore({
        ...currentStore,
        snippets: [...(currentStore.snippets || []), ...importedWithFreshIds]
      });
      state.importMessage = `Imported ${importedWithFreshIds.length} snippets.`;
      renderPanel();
    } catch (err) {
      console.error(err);
      alert('That file does not look like a valid Copy/Paster CSV export.');
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
      if (v == null) continue;
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

  function iconSvg(name) {
    const paths = {
      insert: '<path d="M5 12h14"></path><path d="M13 6l6 6l-6 6"></path>',
      plus: '<path d="M12 5v14"></path><path d="M5 12h14"></path>',
      write: '<path d="M4 7h16"></path><path d="M4 12h10"></path><path d="M4 17h7"></path><path d="M16 16l2 2l4 -4"></path>',
      copy: '<path d="M8 8m0 2a2 2 0 0 1 2 -2h7a2 2 0 0 1 2 2v7a2 2 0 0 1 -2 2h-7a2 2 0 0 1 -2 -2z"></path><path d="M16 8v-1a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v7a2 2 0 0 0 2 2h1"></path>',
      edit: '<path d="M4 20h4l10.5 -10.5a2.8 2.8 0 1 0 -4 -4l-10.5 10.5v4"></path><path d="M13.5 6.5l4 4"></path>',
      delete: '<path d="M4 7h16"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3h6v3"></path>',
      upload: '<path d="M12 16v-12"></path><path d="M7 9l5 -5l5 5"></path><path d="M20 16v4a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1v-4"></path>',
      download: '<path d="M12 4v12"></path><path d="M7 11l5 5l5 -5"></path><path d="M20 16v4a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1v-4"></path>',
      minimize: '<path d="M6 12h12"></path>',
      maximize: '<path d="M6 12h12"></path>'
    };

    return `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        ${paths[name] || ''}
      </svg>
    `;
  }

  function createIconButton({ icon, label, className = '', onclick }) {
    return createElement('button', {
      class: `cp-icon-btn ${className}`.trim(),
      type: 'button',
      title: label,
      'aria-label': label,
      html: iconSvg(icon),
      onclick
    });
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
      width: 510px;
      z-index: ${Z_INDEX_BASE};
      background: #18181B;
      color: #FAFAFA;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.28);
      overflow: hidden;
      font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    #${PANEL_ID}.dragging {
      opacity: 0.9;
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
      background: #27272A;
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
  background: #D6A21D;
  border-radius: 0 2px 2px 0;
}

    #${PANEL_ID} .cp-head-buttons {
      display: flex;
      gap: 6px;
    }

    #${PANEL_ID} .cp-panel-toggle {
      width: 28px;
      height: 26px;
      padding: 0;
      display: grid;
      place-items: center;
    }

    #${PANEL_ID} .cp-panel-toggle svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    #${PANEL_ID} .cp-body {
      padding: 12px;
    }

    #${PANEL_ID} .cp-row {
      margin-bottom: 12px;
    }

    #${PANEL_ID} .cp-small {
     
      font-size:11px;
      color: #A1A1AA;
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
  
  background: #18181B;
  color: #FAFAFA;
  border: 1px solid rgba(255,255,255,0.08);
}

    #${PANEL_ID} button:hover {
      background: #3F3F46;
      filter: none;
    }

    #${PANEL_ID} button.active {
      outline: 2px solid rgba(255,255,255,0.22);
      outline-offset: 0;
    }

    #${PANEL_ID} input[type="text"],
    #${PANEL_ID} textarea,
    #${PANEL_ID} select {
      width: 100%;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.08);
      background: #18181B;
      color: #FAFAFA;
      padding: 8px 10px;
    }

    #${PANEL_ID} textarea {
      min-height: 90px;
      resize: vertical;
    }

    #${PANEL_ID} label {
      display: block;
      margin-bottom: 4px;
      font-size: 11px;
      color: #A1A1AA;
    }

    #${PANEL_ID} .cp-check {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: #A1A1AA;
    }

    #${PANEL_ID} .cp-check input {
      margin: 0;
    }

    #${PANEL_ID} .cp-list {
      overflow: auto;
      border-radius: 10px;
      background: #18181B;
      border: 1px solid rgba(255,255,255,0.05);
      padding: 6px;
    }

    #${PANEL_ID} .cp-resize-handle {
      height: 14px;
      margin: -6px 0 10px;
      border-radius: 7px;
      cursor: ns-resize;
      position: relative;
    }

    #${PANEL_ID} .cp-resize-handle::before {
      content: "";
      position: absolute;
      left: 50%;
      top: 5px;
      width: 56px;
      height: 4px;
      transform: translateX(-50%);
      border-radius: 999px;
      background: rgba(143,145,148,0.75);
    }

    #${PANEL_ID} .cp-resize-handle:hover::before {
      background: #E4E4E7;
    }

    #${PANEL_ID} .cp-section {
      margin-bottom: 10px;
    }

    #${PANEL_ID} .cp-section:last-child {
      margin-bottom: 0;
    }

    #${PANEL_ID} .cp-section-title {
      margin: 2px 0 8px;
      padding: 5px 8px;
      border-left: 4px solid #D6A21D;
      border-radius: 6px;
      background: #3F3F46;
      font-size: 11px;
      font-weight: 700;
      color: #FAFAFA;
    }

    #${PANEL_ID} .cp-band-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: -2px 0 8px;
    }

    #${PANEL_ID} .cp-band-button {
      padding: 3px 7px;
      border-radius: 999px;
      font-size: 10px;
      color: #A1A1AA;
      background: #27272A;
      border: 1px solid rgba(143,145,148,0.25);
    }

    #${PANEL_ID} .cp-band-button:hover {
      border-color: rgba(143,145,148,0.65);
    }

    #${PANEL_ID} .cp-band-button.active {
      color: #18181B;
      background: #D6A21D;
      border-color: #D6A21D;
      outline: none;
    }

    #${PANEL_ID} .cp-item {
      padding: 10px;
      border-radius: 10px;
      background: #27272A;
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

    #${PANEL_ID} .cp-item-meta {
      margin-top: 2px;
      font-size: 10px;
      color: #A1A1AA;
    }

    #${PANEL_ID} .cp-item-text {
      font-size: 11px;
      color: #A1A1AA;
      white-space: pre-wrap;
      margin-bottom: 8px;
    }

    #${PANEL_ID} .cp-item-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
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

    #${PANEL_ID} .cp-icon-btn {
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border-radius: 7px;
      color: #A1A1AA;
    }

    #${PANEL_ID} .cp-icon-btn svg {
      width: 17px;
      height: 17px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.9;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    #${PANEL_ID} .cp-icon-btn-primary {
      width: 34px;
      background: #D6A21D;
      color: #18181B;
      border-color: #D6A21D;
    }

    #${PANEL_ID} .cp-icon-btn-primary:hover {
      background: #E0B13A;
      color: #18181B;
    }

    #${PANEL_ID} .cp-icon-btn-danger {
      color: #ffccd4;
      background: #4c1720;
    }

    #${PANEL_ID} .cp-icon-btn-danger:hover {
      background: #8b1e2d;
    }

    #${PANEL_ID} .cp-action-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    #${PANEL_ID} .cp-action-btn {
      min-height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      font-size: 12px;
      font-weight: 600;
    }

    #${PANEL_ID} .cp-action-btn svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    #${PANEL_ID} .cp-action-secondary {
      color: #E4E4E7;
      background: #27272A;
      border-color: rgba(143,145,148,0.32);
    }

    #${PANEL_ID} .cp-action-secondary:hover {
      background: rgba(255,255,255,0.05);
      border-color: rgba(143,145,148,0.65);
    }

    #${PANEL_ID} .cp-action-primary {
      color: #18181B;
      background: #D6A21D;
      border-color: #D6A21D;
    }

    #${PANEL_ID} .cp-action-primary:hover {
      background: #E0B13A;
      border-color: #E0B13A;
      color: #18181B;
    }

#${PANEL_ID} .cp-btn-primary {
padding: 4px 8px;
  background: #D6A21D;
  color: #18181B;
  font-size: 11pt;
 
  border: 1px solid #D6A21D;
}

#${PANEL_ID} .cp-btn-primary:hover {
  background: #E0B13A;
  color: #18181B;
}

    #${PANEL_ID} .cp-btn-wide {
      width: 100%;
      justify-content: center;
    }

    #${PANEL_ID} .cp-btn-small {
      padding: 4px 8px;
      font-size: 11px;
      background: #18181B;
      color: #A1A1AA;
      border: 1px solid rgba(255,255,255,0.06);
    }

    #${PANEL_ID} .cp-btn-small:hover {
      background: #3F3F46;
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

    #${PANEL_ID} details.cp-import-export,
    #${PANEL_ID} details.cp-mode-details {
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 10px;
    }

    #${PANEL_ID} details.cp-import-export summary,
    #${PANEL_ID} details.cp-mode-details summary {
      cursor: pointer;
      color: #A1A1AA;
      font-size: 12px;
      list-style-position: inside;
    }

    #${PANEL_ID} .cp-message {
      margin-top: 8px;
      color: #95d59b;
      font-size: 11px;
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

  function getMaxCommentListHeight(panel, list) {
    const margin = 24;
    const panelRect = panel.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const belowList = Math.max(0, panelRect.bottom - listRect.bottom);
    const available = window.innerHeight - listRect.top - belowList - margin;
    return Math.max(MIN_COMMENT_LIST_HEIGHT, available);
  }

  function bindCommentListResize(panel, list, handle) {
    handle.addEventListener('mousedown', (event) => {
      bringPanelToFront(panel);

      const startY = event.clientY;
      const startHeight = list.getBoundingClientRect().height;

      const onMove = (moveEvent) => {
        const maxHeight = getMaxCommentListHeight(panel, list);
        const nextHeight = Math.min(
          Math.max(MIN_COMMENT_LIST_HEIGHT, startHeight + moveEvent.clientY - startY),
          maxHeight
        );
        list.style.maxHeight = `${nextHeight}px`;
      };

      const onUp = () => {
        const currentHeight = Math.round(list.getBoundingClientRect().height);
        updateCommentListHeight(currentHeight);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      event.preventDefault();
    });
  }

  function openSnippetEditor(existing = null) {
    state.editingSnippet = existing ? normalizeSnippet(existing) : {
      id: '',
      title: '',
      body: '',
      gradeBand: getGradeBandFilter() === 'All' ? DEFAULT_GRADE_BAND : getGradeBandFilter(),
      category: getCategoryFilter() === 'All categories' ? DEFAULT_CATEGORY : getCategoryFilter(),
      isStarter: false
    };
    renderPanel();
  }

  function closeSnippetEditor() {
    state.editingSnippet = null;
    renderPanel();
  }

  function getSnippetFormValues(form) {
    const body = cleanField(form.querySelector('[name="body"]')?.value);
    return {
      title: cleanText(form.querySelector('[name="title"]')?.value) || makeSnippetTitle(body),
      body,
      gradeBand: normalizeGradeBand(form.querySelector('[name="gradeBand"]')?.value),
      category: normalizeCategory(form.querySelector('[name="category"]')?.value),
      isStarter: !!form.querySelector('[name="isStarter"]')?.checked
    };
  }

  function renderSnippetEditor() {
    if (!state.editingSnippet) return null;

    const editing = state.editingSnippet;
    const isExisting = !!editing.id;
    const form = createElement('form', { class: 'cp-row' }, [
      createElement('div', { class: 'cp-row' }, [
        createElement('label', { for: 'cp-snippet-title', text: 'Title' }),
        createElement('input', {
          id: 'cp-snippet-title',
          name: 'title',
          type: 'text',
          value: isExisting ? getSnippetTitle(editing) : cleanText(editing.title)
        })
      ]),
      createElement('div', { class: 'cp-row' }, [
        createElement('label', { for: 'cp-snippet-body', text: 'Comment' }),
        createElement('textarea', {
          id: 'cp-snippet-body',
          name: 'body',
          text: getSnippetBody(editing)
        })
      ]),
      createElement('div', { class: 'cp-row cp-grid' }, [
        createElement('div', {}, [
          createElement('label', { for: 'cp-snippet-grade', text: 'Grade band' }),
          createElement('select', {
            id: 'cp-snippet-grade',
            name: 'gradeBand'
          }, createSelectOptions(GRADE_BANDS, normalizeGradeBand(editing.gradeBand)))
        ]),
        createElement('div', {}, [
          createElement('label', { for: 'cp-snippet-category', text: 'Category' }),
          createElement('input', {
            id: 'cp-snippet-category',
            name: 'category',
            type: 'text',
            value: normalizeCategory(editing.category)
          })
        ])
      ]),
      createElement('div', { class: 'cp-row' }, [
        createElement('label', { class: 'cp-check' }, [
          createElement('input', {
            name: 'isStarter',
            type: 'checkbox',
            checked: editing.isStarter ? 'checked' : null
          }),
          'Starter comment'
        ])
      ]),
      createElement('div', { class: 'cp-grid' }, [
        createElement('button', {
          class: 'cp-btn-primary',
          type: 'submit',
          text: isExisting ? 'Save snippet' : 'Add snippet'
        }),
        createElement('button', {
          type: 'button',
          text: 'Cancel',
          onclick: closeSnippetEditor
        })
      ])
    ]);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const values = getSnippetFormValues(form);
      if (!values.body) {
        alert('Add comment text before saving this snippet.');
        return;
      }

      state.editingSnippet = null;
      if (isExisting) updateSnippet(editing.id, values);
      else addSnippet(values);
    });

    return form;
  }

  function renderSnippetItem(snippet) {
    const title = getSnippetTitle(snippet);
    const body = getSnippetBody(snippet);

    return createElement('div', { class: 'cp-item' }, [
      createElement('div', { class: 'cp-item-head' }, [
        createElement('div', {}, [
          createElement('div', { class: 'cp-item-title', text: title }),
          createElement('div', {
            class: 'cp-item-meta',
            text: `${normalizeGradeBand(snippet.gradeBand)} · ${normalizeCategory(snippet.category)}`
          })
        ])
      ]),
      createElement('div', { class: 'cp-item-text', text: body }),
      createElement('div', { class: 'cp-item-actions' }, [
        createElement('div', { class: 'cp-item-actions-left' }, [
          createIconButton({
            icon: 'insert',
            label: 'Insert snippet',
            className: 'cp-icon-btn-primary',
            onclick: () => insertSnippet(body)
          })
        ]),
        createElement('div', { class: 'cp-item-actions-right' }, [
          createIconButton({
            icon: 'copy',
            label: 'Copy snippet',
            onclick: () => copySnippetToClipboard(body)
          }),
          createIconButton({
            icon: 'edit',
            label: 'Edit snippet',
            onclick: () => openSnippetEditor(snippet)
          }),
          createIconButton({
            icon: 'delete',
            label: 'Delete snippet',
            className: 'cp-icon-btn-danger',
            onclick: () => deleteSnippet(snippet.id)
          })
        ])
      ])
    ]);
  }

  function getBandOptionsForSnippets(snippets) {
    return GRADE_BANDS.filter(band =>
      snippets.some(snippet => normalizeGradeBand(snippet.gradeBand) === band)
    );
  }

  function renderSupportingBandButtons(snippets, activeBand) {
    const bandOptions = getBandOptionsForSnippets(snippets);
    if (!bandOptions.length) return null;

    return createElement('div', { class: 'cp-band-buttons' }, [
      createElement('button', {
        class: `cp-band-button ${activeBand === 'All' ? 'active' : ''}`,
        type: 'button',
        text: 'All',
        title: 'Show all supporting comments',
        onclick: () => updateGradeBandFilter('All')
      }),
      ...bandOptions.map(band =>
        createElement('button', {
          class: `cp-band-button ${activeBand === band ? 'active' : ''}`,
          type: 'button',
          text: band,
          title: `Show ${band} supporting comments`,
          onclick: () => updateGradeBandFilter(band)
        })
      )
    ]);
  }

  function renderSnippetSection(title, snippets, extraChildren = []) {
    if (!snippets.length) return null;
    return createElement('div', { class: 'cp-section' }, [
      createElement('div', { class: 'cp-section-title', text: title }),
      ...extraChildren.filter(Boolean),
      ...snippets.map(renderSnippetItem)
    ]);
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
    const gradeBandFilter = getGradeBandFilter();
    const categoryOptions = getCategoryOptions(snippets);
    const categoryFilter = categoryOptions.includes(getCategoryFilter())
      ? getCategoryFilter()
      : 'All categories';
    const filteredSnippets = snippets.filter(snippet => {
      const gradeMatches =
        gradeBandFilter === 'All' || normalizeGradeBand(snippet.gradeBand) === gradeBandFilter;
      const categoryMatches =
        categoryFilter === 'All categories' || normalizeCategory(snippet.category) === categoryFilter;
      return gradeMatches && categoryMatches;
    });
    const categoryFilteredSupportingSnippets = snippets.filter(snippet => {
      const categoryMatches =
        categoryFilter === 'All categories' || normalizeCategory(snippet.category) === categoryFilter;
      return !snippet.isStarter && categoryMatches;
    });
    const starterSnippets = filteredSnippets.filter(snippet => snippet.isStarter);
    const supportingSnippets = filteredSnippets.filter(snippet => !snippet.isStarter);
    const commentListHeight = getCommentListHeight();

    panel.innerHTML = '';

    const head = createElement('div', {
  class: 'cp-head',
  style: collapsed ? 'border-bottom:0;' : ''
}, [
      createElement('div', { text: 'Copy/Paster' }),
      createElement('div', { class: 'cp-head-buttons' }, [
        createElement('button', {
          class: 'cp-panel-toggle',
          type: 'button',
          title: collapsed ? 'Expand' : 'Minimise',
          'aria-label': collapsed ? 'Expand Copy/Paster' : 'Minimise Copy/Paster',
          html: iconSvg(collapsed ? 'maximize' : 'minimize'),
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
    style: 'background:#18181B;border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:10px;'
  }, [
    formatClassAssignmentInfo()
  ])
);

    body.appendChild(
      createElement('div', { class: 'cp-row cp-grid' }, [
        createElement('div', {}, [
          createElement('label', { for: 'cp-grade-filter', text: 'Grade band' }),
          createElement('select', {
            id: 'cp-grade-filter',
            onchange: (event) => updateGradeBandFilter(event.target.value)
          }, createSelectOptions(['All', ...GRADE_BANDS], gradeBandFilter))
        ]),
        createElement('div', {}, [
          createElement('label', { for: 'cp-category-filter', text: 'Category' }),
          createElement('select', {
            id: 'cp-category-filter',
            onchange: (event) => updateCategoryFilter(event.target.value)
          }, createSelectOptions(['All categories', ...categoryOptions], categoryFilter))
        ])
      ])
    );

    const editor = renderSnippetEditor();
    if (editor) body.appendChild(editor);

const list = createElement('div', {
  class: 'cp-row cp-list',
  style: `max-height:${commentListHeight}px;`
});

if (!snippets.length) {
  list.appendChild(
    createElement('div', { class: 'cp-item' }, [
      createElement('div', { class: 'cp-item-text', text: 'No snippets yet.' })
    ])
  );
} else if (!filteredSnippets.length) {
  list.appendChild(
    createElement('div', { class: 'cp-item' }, [
      createElement('div', { class: 'cp-item-text', text: 'No snippets match these filters.' })
    ])
  );
} else {
  const starterSection = renderSnippetSection('Starter comments', starterSnippets);
  const supportingSection = renderSnippetSection('Supporting comments', supportingSnippets, [
    renderSupportingBandButtons(categoryFilteredSupportingSnippets, gradeBandFilter)
  ]);
  if (starterSection) list.appendChild(starterSection);
  if (supportingSection) list.appendChild(supportingSection);
}

    body.appendChild(list);

    const resizeHandle = createElement('div', {
      class: 'cp-resize-handle',
      title: 'Drag to resize comment list',
      'aria-label': 'Drag to resize comment list'
    });
    bindCommentListResize(panel, list, resizeHandle);
    body.appendChild(resizeHandle);

body.appendChild(
  createElement('div', { class: 'cp-row cp-action-row' }, [
    createElement('button', {
      class: 'cp-action-btn cp-action-primary',
      html: `${iconSvg('plus')}<span>Add snippet</span>`,
      onclick: () => openSnippetEditor()
    }),
    createElement('button', {
      class: 'cp-action-btn cp-action-secondary',
      html: `${iconSvg('write')}<span>Continue writing</span>`,
      onclick: () => {
        const ok = focusEditorAtEndWithNewLine();
        if (!ok) alert('Could not find the comment editor.');
      }
    })
  ])
);

    body.appendChild(
      createElement('details', { class: 'cp-row cp-mode-details' }, [
        createElement('summary', { text: 'Mode' }),
        createElement('div', { class: 'cp-row cp-small', style: 'margin-top:10px;' }, [
          'Append adds below existing text. Replace overwrites it.'
        ]),
        createElement('div', { class: 'cp-row cp-grid', style: 'margin-bottom:0;' }, [
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
      ])
    );

    const fileInput = createElement('input', {
      type: 'file',
      accept: '.csv,text/csv,application/json'
    });
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) handleImportData(file);
      e.target.value = '';
    });

    const importExport = createElement('details', {
      class: 'cp-row cp-import-export',
      open: getImportExportOpen() ? 'open' : null
    }, [
      createElement('summary', { text: 'Import / Export' }),
      fileInput,
      createElement('div', {
        class: 'cp-grid-3',
        style: 'margin-top:10px;'
      }, [
        createElement('button', {
          type: 'button',
          class: 'cp-icon-btn',
          title: 'Export CSV',
          'aria-label': 'Export CSV',
          html: iconSvg('download'),
          onclick: handleExportData
        }),
        createElement('button', {
          type: 'button',
          class: 'cp-icon-btn',
          title: 'Import CSV',
          'aria-label': 'Import CSV',
          html: iconSvg('upload'),
          onclick: () => fileInput.click()
        }),
        createElement('button', {
          type: 'button',
          class: 'cp-btn-danger',
          text: 'Reset',
          onclick: resetAssignmentSnippets
        })
      ]),
      state.importMessage
        ? createElement('div', { class: 'cp-message', text: state.importMessage })
        : null
    ]);
    importExport.addEventListener('toggle', () => updateImportExportOpen(importExport.open));
    body.appendChild(importExport);

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

  function ensureAssessmentHelpersRegistry() {
    window.AssessmentHelpers = window.AssessmentHelpers || window.VisCommHelpers || { helpers: {} };
    window.AssessmentHelpers.helpers = window.AssessmentHelpers.helpers || {};
    window.AssessmentHelpers.register = function register(helper) {
      if (!helper?.id) return;
      this.helpers[helper.id] = helper;
      (helper.aliases || []).forEach(alias => {
        this.helpers[alias] = helper;
      });
      window.dispatchEvent(new CustomEvent('assessment-helper-registered', { detail: helper }));
      window.dispatchEvent(new CustomEvent('viscomm-helper-registered', { detail: helper }));
    };
    window.VisCommHelpers = window.AssessmentHelpers;
    return window.AssessmentHelpers;
  }

  function getRegisteredPanel() {
    return document.getElementById(PANEL_ID);
  }

  function showRegisteredPanel(render = renderPanel) {
    render?.();
    const panel = getRegisteredPanel();
    if (!panel) return;
    panel.dataset.vcHelperDockHidden = '0';
    delete panel.dataset.vcHelperDockPreviousDisplay;
    panel.style.removeProperty('display');
    if (typeof bringPanelToFront === 'function') bringPanelToFront(panel);
  }

  function hideRegisteredPanel() {
    const panel = getRegisteredPanel();
    if (!panel) return;
    panel.dataset.vcHelperDockHidden = '1';
    panel.style.display = 'none';
  }

  function isRegisteredPanelOpen() {
    const panel = getRegisteredPanel();
    if (!panel) return false;
    const style = window.getComputedStyle(panel);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  function toggleRegisteredPanel(render = renderPanel) {
    if (isRegisteredPanelOpen()) hideRegisteredPanel();
    else showRegisteredPanel(render);
  }

  function registerAssessmentHelper() {
    const registry = ensureAssessmentHelpersRegistry();

    registry.register({
      id: HELPER_ID,
      name: HELPER_NAME,
      panelId: PANEL_ID,
      panelIds: [PANEL_ID],
      show() {
        showRegisteredPanel(renderPanel);
      },
      hide: hideRegisteredPanel,
      toggle() {
        toggleRegisteredPanel(renderPanel);
      },
      isOpen: isRegisteredPanelOpen
    });
  }

  registerAssessmentHelper();
  init();
})();
