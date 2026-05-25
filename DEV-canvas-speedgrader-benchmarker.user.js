// ==UserScript==
// @name         DEV Assessment Helpers - Benchmarker
// @version      1.0.1
// @namespace    AssessmentHelpers
// @description  Assessment Helpers panel for sorting Canvas SpeedGrader students into benchmark buckets
// @match        *://*/courses/*/gradebook/speed_grader*
// @match        *://*/courses/*/gradebook/speed_grader?*
// @match        *://*/gradebook/speed_grader*
// @require      File:///Users/jbs939/Desktop/AssessmentHelpers/DEV-canvas-speedgrader-benchmarker.user.js
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Tracks local SpeedGrader benchmarking buckets and filtered navigation state.

  // constants/config
  const HELPER_ID = 'benchmarker';
  const HELPER_NAME = 'Benchmarker';
  const PANEL_ID = 'sg-benchmarker-panel';
  const STYLE_ID = 'sg-benchmarker-style';
  const Z_INDEX_BASE = 100000;
  const STORAGE_PREFIX = 'canvas_speedgrader_benchmarker_v1';
  const LEGACY_STORAGE_PREFIX = 'sgBenchmarker_v06';
  const TUTORIAL_GROUPS_KEY = 'chatster_tutorial_sorter_groups_v11';
  const TUTORIAL_ACTIVE_GROUP_KEY = 'chatster_tutorial_sorter_active_group_v11';

  const BUCKETS = [
    { id: 'hd', label: 'HD', color: '#2e7d32' },
    { id: 'distinction', label: 'D', color: '#1b5ee4' },
    { id: 'credit', label: 'C', color: '#fdbf5b' },
    { id: 'pass', label: 'P', color: '#ef6c00' },
    { id: 'fail', label: 'Fail', color: '#c62828' },
    { id: 'no_submission', label: 'No Submission', color: '#8a8a8a' }
  ];

  // selectors
  const selectors = {
    panel: `#${PANEL_ID}`,
    selectedStudent: '[data-testid="selected-student"]',
    studentSelectTrigger: [
      '[data-testid="student-select-trigger"]',
      'button[aria-haspopup="listbox"]',
      'button[aria-haspopup="menu"]',
      '[role="button"][aria-haspopup="listbox"]',
      '[role="button"][aria-haspopup="menu"]',
      '[role="combobox"]'
    ].join(','),
    studentMenuItem: [
      'span[data-testid^="student-option-"][role="menuitem"]',
      '[data-testid^="student-option-"]',
      '[id^="student-option-"]',
      '[role="menuitem"][aria-labelledby]',
      '[role="option"][aria-labelledby]',
      '[role="menuitem"]',
      '[role="option"]',
      '[role="listbox"] [role="option"]',
      '[role="menu"] [role="menuitem"]'
    ].join(',')
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
    const bodyClone = document.body?.cloneNode(true);
    bodyClone?.querySelectorAll([
      '#sg-benchmarker-panel',
      '#assessment-helper-dock',
      '#chatster-lmg-panel',
      '#vc-gradebridge-panel',
      '#sg-copypaster-panel',
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
  return getElements(selectors.studentMenuItem)
    .map(el => {
      const labelId = el.getAttribute('aria-labelledby');
      const labelEl = labelId ? document.getElementById(labelId) : null;
      const labelText = cleanText(
        labelEl?.textContent ||
        el.getAttribute('aria-label') ||
        el.getAttribute('title') ||
        el.textContent ||
        ''
      );

      const idAttr = el.getAttribute('id') || '';
      const testId = el.getAttribute('data-testid') || '';
      const anonymousId = idAttr.startsWith('student-option-')
        ? idAttr.replace(/^student-option-/, '')
        : testId.startsWith('student-option-')
          ? testId.replace(/^student-option-/, '')
          : '';

      return {
        el,
        idAttr,
        testId,
        anonymous_id: anonymousId,
        name: labelText,
        normalized_name: normalizeName(labelText)
      };
    })
    .filter(item => {
      if (!item.name) return false;
      const lower = item.name.toLowerCase();
      if (lower === 'select student') return false;
      if (lower === 'student') return false;
      return true;
    });
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

function clickStudentInOpenMenu(targetStudent) {
  const targetIds = [
    targetStudent?.id,
    targetStudent?.studentId,
    targetStudent?.student_id,
    targetStudent?.anonymous_id
  ].map(value => String(value || '').trim()).filter(Boolean);

  const targetNames = [
    targetStudent?.name || '',
    targetStudent?.canvas_name || '',
    targetStudent?.displayName || ''
  ].map(normalizeName).filter(Boolean);

  if (!targetIds.length && !targetNames.length) return false;

  const items = getStudentMenuItems();
  let match = targetIds.length
    ? items.find(item => targetIds.includes(String(item.anonymous_id || '').trim()))
    : null;

  if (!match) {
    match = items.find(item => targetNames.includes(item.normalized_name));
  }

  if (!match) {
    match = items.find(item => {
      const n = item.normalized_name;
      return targetNames.some(targetName => (
        n.includes(targetName) ||
        targetName.includes(n)
      ));
    });
  }

  if (!match) {
    log('No matching student found in open menu', {
      targetStudent,
      available: items.map(i => ({ name: i.name, anonymous_id: i.anonymous_id }))
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
    return bucketById(bucketId)?.color || '#3F3F46';
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
          bucketsOpen: false,
        studentListOpen: false,
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

  function canonicalStudentId(value) {
    return String(value || '').trim();
  }

  function getCurrentCourseCode() {
    const textCandidates = [
      document.title,
      getElement('h1')?.textContent || '',
      getElement('[aria-label*="breadcrumb"]')?.textContent || '',
      getElement('#breadcrumbs')?.textContent || '',
      getElement('[data-testid*="course"]')?.textContent || '',
      document.body?.innerText?.slice(0, 12000) || ''
    ];

    for (const text of textCandidates) {
      const match = String(text || '').match(/\b([A-Z]{4}\d{4})\b/);
      if (match) return match[1];
    }

    return 'unknown_course';
  }

  function normalizeCourseCode(value) {
    const match = String(value || '').toUpperCase().match(/\b([A-Z]{4}\d{4})\b/);
    return match ? match[1] : getCurrentCourseCode();
  }

  function loadTutorialSorterData() {
    try {
      const raw = JSON.parse(localStorage.getItem(TUTORIAL_GROUPS_KEY));
      return raw && typeof raw === 'object' ? raw : null;
    } catch {
      return null;
    }
  }

  function getActiveTutorialGroup() {
    const data = loadTutorialSorterData();
    if (!data?.courses) return null;

    const courseCode = normalizeCourseCode('');
    const bucket = data.courses[courseCode] || Object.values(data.courses)[0];
    if (!bucket?.classes) return null;

    const activeClassKey = bucket.activeClassKey || localStorage.getItem(TUTORIAL_ACTIVE_GROUP_KEY);
    return bucket.classes[activeClassKey] || Object.values(bucket.classes)[0] || null;
  }

  function getTutorialRosterStudents() {
    const group = getActiveTutorialGroup();
    if (!group?.students?.length) return [];

    return group.students.map((student, index) => {
      const rawId = canonicalStudentId(
        student.user_id ||
        student.student_number ||
        student.login_id ||
        student.id ||
        ''
      );
      const name = student.name || student.canvas_name || `Student ${index + 1}`;
      const id = rawId || `tutorial:${group.id || group.classKey || 'class'}:${normalizeName(name) || index}`;

      return {
        id,
        name,
        source: 'tutorial-sorter',
        classLabel: group.label || group.name || 'Selected tutorial',
        tutorialIndex: index
      };
    });
  }

  function formatClassAssignmentInfo(group = getActiveTutorialGroup()) {
    const metadata = group?.metadata || {};
    const classInfo = [
      [metadata.day || group?.day, metadata.time || group?.time].filter(Boolean).join(' '),
      metadata.location || group?.location
    ].filter(Boolean).join(' · ');
    const assignmentName = getAssignmentName();

    return [classInfo, assignmentName].filter(Boolean).join(' | ');
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

  function getSectionOpen(sectionName) {
  const ui = loadStore().ui || {};
  if (sectionName === 'buckets') return !!ui.bucketsOpen;
  if (sectionName === 'studentList') return !!ui.studentListOpen;
  return false;
}

function updateSectionOpen(sectionName, open) {
  const store = loadStore();

  if (!store.ui) store.ui = {};

  if (sectionName === 'buckets') {
    store.ui.bucketsOpen = open;
  }

  if (sectionName === 'studentList') {
    store.ui.studentListOpen = open;
  }

  saveStore(store);
  renderPanel();
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
    const tutorialRoster = getTutorialRosterStudents();

    for (const rosterStudent of tutorialRoster) {
      const stored = store.students?.[rosterStudent.id] || {};
      seen.add(rosterStudent.id);
      out.push({
        ...rosterStudent,
        ...stored,
        id: rosterStudent.id,
        name: stored.name || rosterStudent.name,
        source: rosterStudent.source,
        classLabel: rosterStudent.classLabel
      });
    }

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
      getStudentsArray().length;

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

  function navigateToStudentByUrl(studentId) {
    const url = buildStudentUrlFallback(studentId);
    log('Falling back to SpeedGrader URL navigation', { studentId, url });
    window.location.assign(url);
  }

async function navigateToStudent(studentId) {
  const store = loadStore();
  const record = store.students?.[studentId] || getStudentsArray().find(s => String(s.id) === String(studentId));
  const targetName = record?.name || '';

  if (String(getStudentId() || '') === String(studentId || '')) {
    log('Already on target student', { studentId, targetName });
    return;
  }

  if (!targetName) {
    navigateToStudentByUrl(studentId);
    return;
  }

  const currentName = normalizeName(getStudentName());
  const targetNorm = normalizeName(targetName);

  if (currentName && currentName === targetNorm) {
    log('Already on target student', { studentId, targetName });
    return;
  }

  if (!openStudentDrilldown()) {
    navigateToStudentByUrl(studentId);
    return;
  }

  const items = await waitForStudentMenu();
  if (!items.length) {
    navigateToStudentByUrl(studentId);
    return;
  }

  const clicked = clickStudentInOpenMenu({
    ...record,
    id: studentId,
    studentId,
    name: targetName,
    displayName: targetName
  });
  if (!clicked) {
    closeStudentDrilldown();
    navigateToStudentByUrl(studentId);
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

function getTutorialSorterNavigationAction(direction) {
  const registry = window.AssessmentHelpers || window.VisCommHelpers;
  const helper = registry?.helpers?.['tutorial-sorter'];
  const actionId = direction < 0 ? 'prev' : 'next';
  const actions = helper?.dockActions?.() || [];
  return actions.find(action => action.id === actionId) || null;
}

async function navigateInSelectedTutorial(direction) {
  const roster = getTutorialRosterStudents();
  if (roster.length) {
    const currentId = getStudentId();
    const currentName = normalizeName(getStudentName());
    let idx = roster.findIndex(student => String(student.id) === String(currentId));

    if (idx === -1 && currentName) {
      idx = roster.findIndex(student => normalizeName(student.name) === currentName);
    }

    if (idx === -1) {
      idx = direction < 0 ? roster.length - 1 : 0;
    } else {
      idx += direction < 0 ? -1 : 1;
      if (idx < 0) idx = roster.length - 1;
      if (idx >= roster.length) idx = 0;
    }

    await navigateToStudent(roster[idx].id);
    return;
  }

  const action = getTutorialSorterNavigationAction(direction);
  if (!action || action.disabled) {
    alert('Select a tutorial in Tutorial Sorter first.');
    return;
  }

  await action.run?.();
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

  function panelToggleIcon(expanded) {
    const path = '<path d="M6 12h12"></path>';
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${path}</svg>`;
  }

  function actionIcon(name) {
    const paths = {
      upload: '<path d="M12 16v-12"></path><path d="M7 9l5 -5l5 5"></path><path d="M20 16v4a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1v-4"></path>',
      download: '<path d="M12 4v12"></path><path d="M7 11l5 5l5 -5"></path><path d="M20 16v4a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1v-4"></path>',
      prev: '<path d="M15 6l-6 6l6 6"></path>',
      next: '<path d="M9 6l6 6l-6 6"></path>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name] || ''}</svg>`;
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
      background: #18181B;
      color: #FAFAFA;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.28);
      overflow: hidden;
      font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      border: 1px solid rgba(255,255,255,0.08);
    }

    #${PANEL_ID}.dragging {
      opacity: 0.9;
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
      background: #27272A;
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
  background: #D6A21D;
  border-radius: 0 2px 2px 0;
}

    #${PANEL_ID} .sg-head-buttons {
      display: flex;
      gap: 6px;
    }

    #${PANEL_ID} .sg-panel-toggle {
      width: 28px;
      height: 26px;
      padding: 0;
      display: grid;
      place-items: center;
    }

    #${PANEL_ID} .sg-panel-toggle svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
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
      background: #27272A;
      border: 1px solid rgba(255,255,255,0.05);
    }

    #${PANEL_ID} .sg-section-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 0 8px 0;
  margin: 0 0 8px 0;
  border: 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  border-radius: 0;
  background: transparent;
  color: #FAFAFA;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

#${PANEL_ID} .sg-section-toggle:hover {
  background: transparent;
  color: #E4E4E7;
}

#${PANEL_ID} .sg-section-toggle-label {
  color: #A1A1AA;
}

#${PANEL_ID} .sg-section-toggle-icon {
  color: #E4E4E7;
  font-size: 12px;
}
      #${PANEL_ID} .sg-details {
      margin-top: 12px;
      background: #27272A;
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 10px;
      padding: 8px 10px;
    }

    #${PANEL_ID} .sg-details summary {
      cursor: pointer;
      color: #A1A1AA;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    #${PANEL_ID} .sg-details[open] summary {
      margin-bottom: 10px;
    }

    #${PANEL_ID} .sg-section-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #A1A1AA;
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
      border: 1px solid rgba(255,255,255,0.12);
    }

    #${PANEL_ID} .sg-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    #${PANEL_ID} .sg-grid-3 {
      grid-template-columns: 1fr 1fr 1fr;
    }

    #${PANEL_ID} .sg-grade-primary-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    #${PANEL_ID} .sg-grade-secondary-grid {
      grid-template-columns: 1fr 1fr;
    }

    #${PANEL_ID} .sg-tutorial-nav {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    #${PANEL_ID} .sg-tutorial-nav button {
      min-height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-weight: 650;
      background: #D6A21D;
      color: #18181B;
      border-color: #D6A21D;
    }

    #${PANEL_ID} .sg-tutorial-nav button:hover {
      background: #E0B13A;
      color: #18181B;
    }

    #${PANEL_ID} button {
      appearance: none;
      -webkit-appearance: none;
      border-radius: 8px;
      padding: 4px 8px;
      cursor: pointer;
      background: #18181B;
      color: #FAFAFA;
      font-size: 12px;
      font-weight: 400;
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

    #${PANEL_ID} .sg-icon-btn {
      min-height: 30px;
      display: inline-grid;
      place-items: center;
    }

    #${PANEL_ID} .sg-action-btn {
      min-height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-weight: 650;
    }

    #${PANEL_ID} .sg-tutorial-nav svg,
    #${PANEL_ID} .sg-icon-btn svg,
    #${PANEL_ID} .sg-action-btn svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    #${PANEL_ID} .sg-small {
      font-size: 11px;
      color: #A1A1AA;
    }

    #${PANEL_ID} .sg-counts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 8px;
    }

    #${PANEL_ID} .sg-count-chip {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 8px;
      background: #3F3F46;
      border: 1px solid rgba(255,255,255,0.05);
      border-left: 9px solid transparent;
      cursor: pointer;
    }

    #${PANEL_ID} .sg-count-chip:hover {
      background: #3F3F46;
    }

    #${PANEL_ID} .sg-count-chip.active {
      outline: 2px solid rgba(255,255,255,0.22);
      outline-offset: 0;
    }

    #${PANEL_ID} .sg-count-chip-full {
      grid-column: 1 / -1;
    }

    #${PANEL_ID} .sg-list {
      max-height: 220px;
      overflow: auto;
      border-radius: 10px;
      background: #27272A;
      border: 1px solid rgba(255,255,255,0.05);
      padding: 6px;
      margin-top: 8px;
    }

    #${PANEL_ID} .sg-item {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      padding: 7px 8px;
      border-radius: 6px;
      cursor: pointer;
      border-left: 9px solid transparent;
      color: #A1A1AA;
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
      color: #A1A1AA;
    }

    #${PANEL_ID} input[type="file"] {
      display: none;
    }

#${PANEL_ID} .sg-grade-btn {
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 0;
  overflow: hidden;
  color: #fff;
  border: 1px solid rgba(255,255,255,0.08);
  border-bottom: 5px solid transparent;
  background: #27272A;
  min-height: 34px;
}


    #${PANEL_ID} .sg-grade-btn:hover {
      filter: brightness(1.05);
    }

    #${PANEL_ID} .sg-grade-label {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px 7px;
      flex: 1 1 auto;
      font-weight: 750;
      min-width: 0;
      white-space: nowrap;
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
  if (e.target.closest('button, input, select, textarea, summary, details, label, a')) return;

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
    const activeTutorialGroup = getActiveTutorialGroup();

    panel.innerHTML = '';

const head = createElement('div', {
  class: 'sg-head',
  style: collapsed ? 'border-bottom:0;' : ''
}, [
  createElement('div', { class: 'sg-head-title', text: 'Benchmarker' }),
      createElement('div', { class: 'sg-head-buttons' }, [
        createElement('button', {
          class: 'sg-panel-toggle',
          type: 'button',
          title: collapsed ? 'Expand' : 'Minimise',
          'aria-label': collapsed ? 'Expand Benchmarker' : 'Minimise Benchmarker',
          html: panelToggleIcon(collapsed),
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
      : '#27272A';
    studentTop.lastChild.style.borderColor = currentBucket
      ? bucketColor(currentBucket)
      : '#3F3F46';

    studentSection.appendChild(createElement('div', { class: 'sg-section-title', text: 'Current Student' }));
    studentSection.appendChild(studentTop);
    studentSection.appendChild(
      createElement('div', {
        class: 'sg-small',
        text: formatClassAssignmentInfo(activeTutorialGroup)
      })
    );
    body.appendChild(studentSection);

    // Bucket assignment buttons
    const primaryBuckets = BUCKETS.filter(b => ['hd', 'distinction', 'credit', 'pass'].includes(b.id));
    const secondaryBuckets = BUCKETS.filter(b => ['fail', 'no_submission'].includes(b.id));
    const createBucketButton = (bucket) => {
      const gradeButton = createElement('button', {
        class: `sg-grade-btn ${currentBucket === bucket.id ? 'active' : ''}`,
        onclick: () => updateStudentBucket(bucket.id)
      }, [
        createElement('span', { class: 'sg-grade-label', text: bucket.label })
      ]);

      gradeButton.style.borderBottomColor = bucket.color;
      return gradeButton;
    };

    const primaryBucketButtons = createElement('div', { class: 'sg-row sg-grid sg-grade-primary-grid' });
    primaryBuckets.forEach(bucket => primaryBucketButtons.appendChild(createBucketButton(bucket)));
    body.appendChild(primaryBucketButtons);

    const secondaryBucketButtons = createElement('div', { class: 'sg-row sg-grid sg-grade-secondary-grid' });
    secondaryBuckets.forEach(bucket => secondaryBucketButtons.appendChild(createBucketButton(bucket)));
    body.appendChild(secondaryBucketButtons);

    const createTutorialNavButton = (direction, label, iconName, iconAfter = false) => {
      return createElement('button', {
        html: iconAfter
          ? `<span>${label}</span>${actionIcon(iconName)}`
          : `${actionIcon(iconName)}<span>${label}</span>`,
        onclick: () => navigateInSelectedTutorial(direction)
      });
    };

    const tutorialNavSection = createElement('div', { class: 'sg-section' }, [
      createElement('div', { class: 'sg-section-title', text: 'Selected Tutorial' }),
      createElement('div', { class: 'sg-tutorial-nav' }, [
        createTutorialNavButton(-1, 'Prev', 'prev'),
        createTutorialNavButton(1, 'Next', 'next', true)
      ])
    ]);
    body.appendChild(tutorialNavSection);


    const bucketsOpen = getSectionOpen('buckets');
const studentListOpen = getSectionOpen('studentList');

// Clickable bucket list
const countsSection = createElement('div', { class: 'sg-section' });

countsSection.appendChild(
  createElement('button', {
    class: 'sg-section-toggle',
    onclick: () => updateSectionOpen('buckets', !bucketsOpen)
  }, [
    createElement('span', { class: 'sg-section-toggle-label', text: 'Buckets' }),
    createElement('span', {
      class: 'sg-section-toggle-icon',
      text: bucketsOpen ? '▾' : '▸'
    })
  ])
);

if (bucketsOpen) {
  const countsGrid = createElement('div', { class: 'sg-counts' });

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
      class: `sg-count-chip ${item.id === 'all' ? 'sg-count-chip-full' : ''} ${activeFilter === item.id ? 'active' : ''}`,
      onclick: () => updateActiveFilter(item.id)
    }, [
      createElement('div', { text: item.label }),
      createElement('div', { text: String(item.value) })
    ]);

    chip.style.borderLeftColor = item.bucket ? bucketColor(item.bucket) : bucketColor(null);
    countsGrid.appendChild(chip);
  });

  countsSection.appendChild(countsGrid);
}

body.appendChild(countsSection);

// Student list
const filteredList = getFilteredStudents(activeFilter).slice(0, 80);

const listSection = createElement('div', { class: 'sg-section' });

listSection.appendChild(
  createElement('button', {
    class: 'sg-section-toggle',
    onclick: () => updateSectionOpen('studentList', !studentListOpen)
  }, [
    createElement('span', { class: 'sg-section-toggle-label', text: 'Student List' }),
    createElement('span', {
      class: 'sg-section-toggle-icon',
      text: studentListOpen ? '▾' : '▸'
    })
  ])
);

if (studentListOpen) {
  listSection.appendChild(
    createElement('div', {
      class: 'sg-small',
      text: activeTutorialGroup
        ? `Students in ${activeTutorialGroup.label || activeTutorialGroup.name || 'selected tutorial'}`
        : `Students in "${activeFilter}" queue`
    })
  );

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
}

body.appendChild(listSection);

const fileInput = createElement('input', {
  type: 'file',
  accept: 'application/json'
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) handleImportData(file);
  e.target.value = '';
});

body.appendChild(fileInput);

const importExportDetails = createElement('details', { class: 'sg-details' }, [
  createElement('summary', { text: 'Save / Import' })
]);

importExportDetails.appendChild(
  createElement('div', {
    class: 'sg-small',
    text: 'Save your class results or import previous class data'
  })
);

importExportDetails.appendChild(
  createElement('div', { class: 'sg-row sg-grid sg-grid-3', style: 'margin-top:10px; margin-bottom:0;' }, [
    createElement('button', {
      class: 'sg-action-btn',
      title: 'Save Benchmarker data',
      'aria-label': 'Save Benchmarker data',
      html: `${actionIcon('download')}<span>Save</span>`,
      onclick: handleExportData
    }),
    createElement('button', {
      class: 'sg-action-btn',
      title: 'Import previous Benchmarker data',
      'aria-label': 'Import Benchmarker data',
      html: `${actionIcon('upload')}<span>Import</span>`,
      onclick: () => fileInput.click()
    }),
    createElement('button', {
      class: 'sg-btn-danger',
      text: 'Reset',
      onclick: resetCurrentAssignmentData
    })
  ])
);

body.appendChild(importExportDetails);

   
    panel.appendChild(body);
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
