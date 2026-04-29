// ==UserScript==
// @name         Canvas SpeedGrader Benchmarker
// @version      1.0.0
// @namespace    VisComm@UON
// @description  Local benchmarking overlay for Canvas SpeedGrader
// @match        *://*/courses/*/gradebook/speed_grader*
// @match        *://*/courses/*/gradebook/speed_grader?*
// @match        *://*/gradebook/speed_grader*
// @updateURL    https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-benchmarker.user.js
// @downloadURL  https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-benchmarker.user.js
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Tracks local SpeedGrader benchmarking buckets and filtered navigation state.

  // constants/config
  const PANEL_ID = 'sg-benchmarker-panel';
  const STYLE_ID = 'sg-benchmarker-style';
  const Z_INDEX_BASE = 100000;
  const STORAGE_PREFIX = 'canvas_speedgrader_benchmarker_v1';
  const LEGACY_STORAGE_PREFIX = 'sgBenchmarker_v06';

  const BUCKETS = [
    { id: 'hd', label: 'HD', key: '1', color: '#2e7d32' },
    { id: 'distinction', label: 'Distinction', key: '2', color: '#558b2f' },
    { id: 'credit', label: 'Credit', key: '3', color: '#f9a825' },
    { id: 'pass', label: 'Pass', key: '4', color: '#ef6c00' },
    { id: 'fail', label: 'Fail', key: '5', color: '#c62828' },
    { id: 'no_submission', label: 'No Submission', key: '6', color: '#616161' }
  ];

  // selectors
  const selectors = {
    panel: `#${PANEL_ID}`,
    selectedStudent: '[data-testid="selected-student"]',
    studentSelectTrigger: '[data-testid="student-select-trigger"]',
    studentMenuItem: 'span[data-testid^="student-option-"][role="menuitem"]'
  };

  // state
  const state = {
    lastHref: location.href
  };

  // elements
  const elements = {};

  // utilities
  function log(...args) {
    console.log('[Benchmarker]', ...args);
  }

  function bringPanelToFront(panel) {
    if (!panel) return;
    const current = Number(window.__canvasAssessmentPanelZIndex || Z_INDEX_BASE);
    const next = current + 1;
    window.__canvasAssessmentPanelZIndex = next;
    panel.style.zIndex = String(next);
  }

  function getElement(sel, root = document) {
    return root.querySelector(sel);
  }

  function getElements(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
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

  function getStudentId() {
    const url = getUrl();
    return (
      url.searchParams.get('student_id') ||
      url.searchParams.get('student') ||
      url.searchParams.get('user_id') ||
      findStudentIdFromPage() ||
      null
    );
  }

  function findStudentIdFromPage() {
    const selectorList = [
      '[data-student-id]',
      '[data-user-id]',
      'a[href*="student_id="]',
      'a[href*="user_id="]'
    ];

    for (const sel of selectorList) {
      const nodes = getElements(sel);
      for (const el of nodes) {
        const dsid = el.getAttribute('data-student-id') || el.dataset?.studentId;
        if (dsid) return dsid;

        const duid = el.getAttribute('data-user-id') || el.dataset?.userId;
        if (duid) return duid;

        const href = el.getAttribute('href');
        if (href) {
          try {
            const u = new URL(href, location.origin);
            const id = u.searchParams.get('student_id') || u.searchParams.get('user_id');
            if (id) return id;
          } catch {}
        }
      }
    }

    return null;
  }

  function cleanText(s) {
    return (s || '').replace(/\s+/g, ' ').trim();
  }

  function getStudentName() {
    const store = loadStore();
    const studentId = getStudentId();

    const selectedStudentEl = getElement(selectors.selectedStudent);
    const selectedStudentText = cleanText(selectedStudentEl?.textContent || '');

    if (selectedStudentText) {
      return selectedStudentText;
    }

    const triggerEl = getElement(selectors.studentSelectTrigger);
    const triggerText = cleanText(triggerEl?.textContent || '');

    if (triggerText) {
      const cleanedTrigger = triggerText.replace(/^●\s*/, '').trim();
      if (cleanedTrigger) return cleanedTrigger;
    }

    const saved = store.students?.[studentId]?.name;
    if (saved) return saved;

    return `Student ${studentId || '?'}`;
  }
    function normalizeName(str) {
  let s = String(str || '').trim();

  if (s.includes(',')) {
    const parts = s.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      s = parts.slice(1).join(' ') + ' ' + parts[0];
    }
  }

  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getStudentMenuItems() {
  return getElements(selectors.studentMenuItem).map(el => {
    const labelId = el.getAttribute('aria-labelledby');
    const labelEl = labelId ? document.getElementById(labelId) : null;
    const labelText = (labelEl?.textContent || el.textContent || '').trim();

    const idAttr = el.getAttribute('id') || '';
    const anonymousId = idAttr.startsWith('student-option-')
      ? idAttr.replace(/^student-option-/, '')
      : '';

    return {
      el,
      idAttr,
      anonymous_id: anonymousId,
      name: labelText,
      normalized_name: normalizeName(labelText)
    };
  }).filter(item => item.name);
}

function isStudentMenuOpen() {
  return getStudentMenuItems().length > 0;
}

function openStudentDrilldown() {
  if (isStudentMenuOpen()) return true;
  const trigger = getElement(selectors.studentSelectTrigger);
  if (!trigger) return false;
  trigger.click();
  return true;
}

function closeStudentDrilldown() {
  if (!isStudentMenuOpen()) return;
  const trigger = getElement(selectors.studentSelectTrigger);
  if (trigger) trigger.click();
}

function waitForStudentMenu(timeoutMs = 2500) {
  return new Promise(resolve => {
    const started = Date.now();

    function check() {
      const items = getStudentMenuItems();
      if (items.length) {
        resolve(items);
        return;
      }

      if (Date.now() - started > timeoutMs) {
        resolve([]);
        return;
      }

      setTimeout(check, 100);
    }

    check();
  });
}

function clickStudentInOpenMenuByName(targetName) {
  const targetNorm = normalizeName(targetName);
  if (!targetNorm) return false;

  const items = getStudentMenuItems();

  let match = items.find(item => item.normalized_name === targetNorm);

  if (!match) {
    match = items.find(item =>
      item.normalized_name.includes(targetNorm) ||
      targetNorm.includes(item.normalized_name)
    );
  }

  if (!match) {
    log('No matching student found in open menu', {
      targetName,
      available: items.map(i => i.name)
    });
    return false;
  }

  match.el.click();
  return true;
}

  function bucketById(id) {
    return BUCKETS.find(b => b.id === id) || null;
  }

  function bucketLabel(bucketId) {
    return bucketById(bucketId)?.label || 'Unbucketed';
  }

  function bucketColor(bucketId) {
    return bucketById(bucketId)?.color || '#455a64';
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

  function defaultStore() {
    return {
      students: {},
      order: [],
      ui: {
        activeFilter: 'all',
        collapsed: false,
        posX: null,
        posY: null
      }
    };
  }

  function loadStore() {
    try {
      return JSON.parse(getStoredJson()) || defaultStore();
    } catch {
      return defaultStore();
    }
  }

  function saveStore(store) {
    localStorage.setItem(getStorageKey(), JSON.stringify(store));
  }

  function ensureCurrentStudentTracked() {
    const studentId = getStudentId();
    if (!studentId) return;

    const store = loadStore();
    const existing = store.students[studentId] || {};
    const currentName = getStudentName();

    store.students[studentId] = {
      ...existing,
      name: currentName || existing.name || `Student ${studentId}`,
      lastSeenAt: Date.now()
    };

    if (!store.order.includes(studentId)) {
      store.order.push(studentId);
    }

    saveStore(store);
  }

  function updateStudentBucket(bucketId) {
    const studentId = getStudentId();
    if (!studentId) {
      alert('No student ID found on this page.');
      return;
    }

    const store = loadStore();
    const existing = store.students[studentId] || {};
    const currentName = getStudentName();

    store.students[studentId] = {
      ...existing,
      name: currentName || existing.name || `Student ${studentId}`,
      bucket: bucketId,
      updatedAt: Date.now(),
      lastSeenAt: Date.now()
    };

    if (!store.order.includes(studentId)) {
      store.order.push(studentId);
    }

    saveStore(store);
    renderPanel();
  }

  function getCurrentBucket() {
    const studentId = getStudentId();
    if (!studentId) return null;
    const store = loadStore();
    return store.students[studentId]?.bucket || null;
  }

  function updateActiveFilter(filter) {
    const store = loadStore();
    store.ui.activeFilter = filter;
    saveStore(store);
    renderPanel();
  }

  function getActiveFilter() {
    return loadStore().ui?.activeFilter || 'all';
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

  function getStudentsArray() {
    const store = loadStore();
    const seen = new Set();
    const out = [];

    for (const id of store.order || []) {
      if (store.students[id] && !seen.has(id)) {
        seen.add(id);
        out.push({ id, ...store.students[id] });
      }
    }

    for (const [id, record] of Object.entries(store.students || {})) {
      if (!seen.has(id)) out.push({ id, ...record });
    }

    return out;
  }

  function getFilteredStudents(filter) {
    const students = getStudentsArray();
    if (filter === 'all') return students;
    return students.filter(s => s.bucket === filter);
  }

  function countByBucket() {
    const counts = {
      hd: 0,
      distinction: 0,
      credit: 0,
      pass: 0,
      fail: 0,
      no_submission: 0,
      all: 0
    };

    for (const s of getStudentsArray()) {
      if (s.bucket && counts.hasOwnProperty(s.bucket)) {
        counts[s.bucket]++;
      }
    }

    counts.all =
      counts.hd +
      counts.distinction +
      counts.credit +
      counts.pass +
      counts.fail +
      counts.no_submission;

    return counts;
  }


  function buildStudentUrlFallback(studentId) {
    const url = getUrl();
    if (url.searchParams.has('student_id')) {
      url.searchParams.set('student_id', studentId);
    } else if (url.searchParams.has('user_id')) {
      url.searchParams.set('user_id', studentId);
    } else {
      url.searchParams.set('student_id', studentId);
    }
    return url.toString();
  }

async function navigateToStudent(studentId) {
  const store = loadStore();
  const record = store.students?.[studentId];
  const targetName = record?.name || '';

  if (!targetName) {
    alert(`No saved name found for student ${studentId}`);
    return;
  }

  const currentName = normalizeName(getStudentName());
  const targetNorm = normalizeName(targetName);

  if (currentName && currentName === targetNorm) {
    log('Already on target student', { studentId, targetName });
    return;
  }

  if (!openStudentDrilldown()) {
    alert('Could not open the Canvas student menu.');
    return;
  }

  const items = await waitForStudentMenu();
  if (!items.length) {
    alert('The Canvas student menu did not appear.');
    return;
  }

  const clicked = clickStudentInOpenMenuByName(targetName);
  if (!clicked) {
    closeStudentDrilldown();
    alert(`Could not find "${targetName}" in the Canvas student menu.`);
  }
}

async function navigateInFilter(direction) {
  const currentId = getStudentId();
  const filter = getActiveFilter();
  const list = getFilteredStudents(filter);

  if (!list.length) {
    alert(`No students in "${filter}" yet.`);
    return;
  }

  let idx = list.findIndex(s => s.id === currentId);

  if (idx === -1) {
    await navigateToStudent(list[0].id);
    return;
  }

  idx += direction;
  if (idx < 0) idx = list.length - 1;
  if (idx >= list.length) idx = 0;

  await navigateToStudent(list[idx].id);
}

  function resetCurrentAssignmentData() {
    const ok = window.confirm(
      'Reset all Benchmarker data for this assignment? This will clear all saved categories, names, navigation links, and queue state for the current course + assignment.'
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
    a.download = `benchmarker-course-${getCourseId()}-assignment-${getAssignmentId()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function handleImportData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed.data) throw new Error('Bad format');
        saveStore(parsed.data);
        renderPanel();
        alert('Benchmarker data imported.');
      } catch (err) {
        console.error(err);
        alert('That file does not look like a valid Benchmarker export.');
      }
    };
    reader.readAsText(file);
  }

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
      top: 20px;
      right: 20px;
      width: 340px;
      z-index: ${Z_INDEX_BASE};
      background: #1f2329;
      color: #f3f4f6;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.28);
      overflow: hidden;
      font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      border: 1px solid rgba(255,255,255,0.08);
    }

    #${PANEL_ID}.dragging {
      opacity: 0.92;
      user-select: none;
    }

    #${PANEL_ID} * {
      box-sizing: border-box;
    }

    #${PANEL_ID} .sg-head {
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

    #${PANEL_ID} .sg-head::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0px;
  bottom: 0px;
  width: 12px;
  background: #d6a21d;
  border-radius: 0 2px 2px 0;
}

    #${PANEL_ID} .sg-head-buttons {
      display: flex;
      gap: 6px;
    }

    #${PANEL_ID} .sg-head-title {
      font-weight: 700;
    }

    #${PANEL_ID} .sg-body {
      padding: 12px;
    }

    #${PANEL_ID} .sg-row {
      margin-bottom: 12px;
    }

    #${PANEL_ID} .sg-section {
      margin-bottom: 12px;
      padding: 10px;
      border-radius: 10px;
      background: #161a20;
      border: 1px solid rgba(255,255,255,0.05);
    }

    #${PANEL_ID} .sg-section-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #9aa3af;
      margin-bottom: 8px;
    }

    #${PANEL_ID} .sg-student {
      font-size: 12px;
    }

    #${PANEL_ID} .sg-student-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 4px;
    }

    #${PANEL_ID} .sg-student-name {
      font-size: 14px;
      font-weight: 700;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #fff;
    }

    #${PANEL_ID} .sg-bucket-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 9px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
      flex: 0 0 auto;
    }

    #${PANEL_ID} .sg-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    #${PANEL_ID} .sg-grid-3 {
      grid-template-columns: 1fr 1fr 1fr;
    }

    #${PANEL_ID} button {
      appearance: none;
      -webkit-appearance: none;
      border-radius: 8px;
      padding: 4px 8px;
      cursor: pointer;
      background: #11151a;
      color: #f3f4f6;
      font-size: 12px;
      font-weight: 400;
      border: 1px solid rgba(255,255,255,0.08);
    }

    #${PANEL_ID} button:hover {
      background: #171c22;
      filter: none;
    }

    #${PANEL_ID} button.active {
      outline: 2px solid rgba(255,255,255,0.22);
      outline-offset: 0;
    }

    #${PANEL_ID} .sg-small {
      font-size: 11px;
      color: #9aa3af;
    }

    #${PANEL_ID} .sg-counts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 10px;
    }

    #${PANEL_ID} .sg-count-chip {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 8px;
      background: #1b2027;
      border: 1px solid rgba(255,255,255,0.05);
      border-left: 6px solid transparent;
      cursor: pointer;
    }

    #${PANEL_ID} .sg-count-chip:hover {
      background: #222833;
    }

    #${PANEL_ID} .sg-count-chip.active {
      outline: 2px solid rgba(255,255,255,0.22);
      outline-offset: 0;
    }

    #${PANEL_ID} .sg-list {
      max-height: 220px;
      overflow: auto;
      border-radius: 10px;
      background: #161a20;
      border: 1px solid rgba(255,255,255,0.05);
      padding: 6px;
      margin-top: 8px;
    }

    #${PANEL_ID} .sg-item {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      padding: 1px 8px;
      border-radius: 6px;
      cursor: pointer;
      border-left: 6px solid transparent;
      color: #c7ced8;
    }

    #${PANEL_ID} .sg-item:hover {
      background: rgba(255,255,255,0.08);
    }

    #${PANEL_ID} .sg-item.current {
      background: rgba(255,255,255,0.12);
      color: #fff;
    }

    #${PANEL_ID} .sg-item-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1 1 auto;
    }

    #${PANEL_ID} .sg-item-bucket {
      font-size: 11px;
      white-space: nowrap;
      color: #9aa3af;
    }

    #${PANEL_ID} input[type="file"] {
      display: none;
    }

    #${PANEL_ID} .sg-grade-btn {
      display: flex;
      align-items: stretch;
      padding: 0;
      overflow: hidden;
      color: #fff;
      border: 1px solid rgba(255,255,255,0.08);
    }

    #${PANEL_ID} .sg-grade-btn:hover {
      filter: brightness(1.05);
    }

    #${PANEL_ID} .sg-grade-key {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      padding: 8px 6px;
      font-size: 11px;
      font-weight: 700;
      background: rgba(255,255,255,0.14);
      border-right: 1px solid rgba(255,255,255,0.12);
      flex: 0 0 auto;
    }

    #${PANEL_ID} .sg-grade-label {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px 10px;
      flex: 1 1 auto;
      font-weight: 600;
    }

    #${PANEL_ID} .sg-btn-danger {
      background: #8b1e2d;
      color: #fff2f4;
      border: 1px solid rgba(255,255,255,0.08);
    }

    #${PANEL_ID} .sg-btn-danger:hover {
      background: #a32437;
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
      if (e.target.closest('button')) return;

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

  function renderPanel() {
    if (!document.body) return;

    addStyles();
    ensureCurrentStudentTracked();


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

    const studentId = getStudentId();
    const studentName = getStudentName();
    const currentBucket = getCurrentBucket();
    const activeFilter = getActiveFilter();
    const counts = countByBucket();
    const collapsed = getCollapsed();

    panel.innerHTML = '';

const head = createElement('div', {
  class: 'sg-head',
  style: collapsed ? 'border-bottom:0;' : ''
}, [
  createElement('div', { class: 'sg-head-title', text: 'Benchmarker' }),
      createElement('div', { class: 'sg-head-buttons' }, [
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

    const body = createElement('div', { class: 'sg-body' });

    // Student info
    const studentSection = createElement('div', { class: 'sg-section sg-student' });
    const studentTop = createElement('div', { class: 'sg-student-top' }, [
      createElement('div', { class: 'sg-student-name', text: studentName }),
      createElement('div', {
        class: 'sg-bucket-pill',
        text: currentBucket ? bucketLabel(currentBucket) : 'Unbucketed'
      })
    ]);

    studentTop.lastChild.style.background = currentBucket
      ? bucketColor(currentBucket)
      : '#455a64';

    studentSection.appendChild(createElement('div', { class: 'sg-section-title', text: 'Current Student' }));
    studentSection.appendChild(studentTop);
    studentSection.appendChild(
      createElement('div', {
        class: 'sg-small',
        text: `Assignment: ${getAssignmentName()} | Student ID: ${studentId || 'unknown'}`
      })
    );
    body.appendChild(studentSection);

    // Bucket assignment buttons
const bucketButtons = createElement('div', { class: 'sg-row sg-grid' });
for (const b of BUCKETS) {
  bucketButtons.appendChild(
    createElement('button', {
      class: `sg-grade-btn ${currentBucket === b.id ? 'active' : ''}`,
      onclick: () => updateStudentBucket(b.id)
    }, [
      createElement('span', { class: 'sg-grade-key', text: b.key }),
      createElement('span', { class: 'sg-grade-label', text: b.label })
    ])
  );
}
body.appendChild(bucketButtons);

    // Student list
    const filteredList = getFilteredStudents(activeFilter).slice(0, 80);
    const listSection = createElement('div', { class: 'sg-section' }, [
      createElement('div', { class: 'sg-section-title', text: 'Student List' }),
      createElement('div', {
        class: 'sg-small',
        text: `Students in "${activeFilter}" queue`
      })
    ]);

    const list = createElement('div', { class: 'sg-list' });

    if (!filteredList.length) {
      list.appendChild(createElement('div', { class: 'sg-item' }, [
        createElement('div', { class: 'sg-item-name', text: 'No students in this queue yet.' })
      ]));
    } else {
      filteredList.forEach(s => {
        const item = createElement('div', {
          class: `sg-item ${s.id === studentId ? 'current' : ''}`,
          onclick: async () => { await navigateToStudent(s.id); }
        }, [
          createElement('div', { class: 'sg-item-name', text: s.name || `Student ${s.id}` }),
          createElement('div', { class: 'sg-item-bucket', text: bucketLabel(s.bucket) })
        ]);

        item.style.borderLeftColor = bucketColor(s.bucket);
        list.appendChild(item);
      });
    }

    listSection.appendChild(list);
    body.appendChild(listSection);

    // Clickable bucket list
    const countsSection = createElement('div', { class: 'sg-section' }, [
      createElement('div', { class: 'sg-section-title', text: 'Buckets' })
    ]);

    [
      { id: 'all', label: 'All', value: counts.all, bucket: null },
      { id: 'hd', label: 'HD', value: counts.hd, bucket: 'hd' },
      { id: 'distinction', label: 'Distinction', value: counts.distinction, bucket: 'distinction' },
      { id: 'credit', label: 'Credit', value: counts.credit, bucket: 'credit' },
      { id: 'pass', label: 'Pass', value: counts.pass, bucket: 'pass' },
      { id: 'fail', label: 'Fail', value: counts.fail, bucket: 'fail' },
      { id: 'no_submission', label: 'No Submission', value: counts.no_submission, bucket: 'no_submission' }
    ].forEach(item => {
      const chip = createElement('div', {
        class: `sg-count-chip ${activeFilter === item.id ? 'active' : ''}`,
        onclick: () => updateActiveFilter(item.id)
      }, [
        createElement('div', { text: item.label }),
        createElement('div', { text: String(item.value) })
      ]);

      chip.style.borderLeftColor = item.bucket ? bucketColor(item.bucket) : '#455a64';
      countsSection.appendChild(chip);
    });

    countsSection.appendChild(
   createElement('div', { class: 'sg-row sg-grid sg-grid-2', style: 'margin-top:10px;' }, [

        createElement('button', {
          text: '◀ Prev',
          onclick: () => navigateInFilter(-1)
        }),
        createElement('button', {
          text: 'Next  ▶',
          onclick: () => navigateInFilter(1)
        })
      ])
    );

    body.appendChild(countsSection);

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
      createElement('div', { class: 'sg-row sg-grid sg-grid-3' }, [
        createElement('button', {
          text: 'Export',
          onclick: handleExportData
        }),
        createElement('button', {
          text: 'Import',
          onclick: () => body.querySelector('input[type="file"]')?.click()
        }),
        createElement('button', {
          class: 'sg-btn-danger',
          text: 'Reset',
          onclick: resetCurrentAssignmentData
        })
      ])
    );

    body.appendChild(
      createElement('div', { class: 'sg-small' }, [
        'Hotkeys: 1–6 assign categories, [ and ] move through the selected queue. Queue items are clickable.'
      ])
    );

    panel.appendChild(body);
  }

  function shouldIgnoreKeys(target) {
    if (!target) return false;
    const tag = target.tagName?.toLowerCase();
    return (
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      target.isContentEditable
    );
  }

  function handleKeydown(e) {
    if (shouldIgnoreKeys(e.target)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === '1') { e.preventDefault(); updateStudentBucket('hd'); return; }
    if (e.key === '2') { e.preventDefault(); updateStudentBucket('distinction'); return; }
    if (e.key === '3') { e.preventDefault(); updateStudentBucket('credit'); return; }
    if (e.key === '4') { e.preventDefault(); updateStudentBucket('pass'); return; }
    if (e.key === '5') { e.preventDefault(); updateStudentBucket('fail'); return; }
    if (e.key === '6') { e.preventDefault(); updateStudentBucket('no_submission'); return; }
    if (e.key === '[') { e.preventDefault(); navigateInFilter(-1); return; }
    if (e.key === ']') { e.preventDefault(); navigateInFilter(1); return; }
  }

  function init() {
    log('Booting');

    const tryRender = () => {
      if (!document.body) {
        setTimeout(tryRender, 250);
        return;
      }
      renderPanel();
    };

    tryRender();
    document.addEventListener('keydown', handleKeydown, true);
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
