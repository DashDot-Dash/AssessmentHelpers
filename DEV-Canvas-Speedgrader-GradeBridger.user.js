// ==UserScript==
// @name         DEV Canvas Speedgrader GradeBridger
// @namespace    https://github.com/GitJane/VisComm-Helpers
// @version      0.0.2
// @description  Jump between paired Canvas SpeedGrader assignments while keeping the current student.
// @author       Jane + Chatster
// @match        *://*/courses/*/gradebook/speed_grader*
// @require      File:///Users/jbs939/Desktop/AssessmentHelpers/DEV-canvas-speedgrader-gradebridger.user.js
// @grant        GM_getResourceURL
// ==/UserScript==



(function () {
  'use strict';

  const STORAGE_KEYS = {
    pairs: 'vcGradeBridge:pairs:v1',
    anchor: 'vcGradeBridge:anchor:v1',
    assignmentNames: 'vcGradeBridge:assignmentNames:v1',
    panelPosition: 'vcGradeBridge:panelPosition:v1',
    targetStudentName: 'vcGradeBridge:targetStudentName:v1',
  };

  const PANEL_ID = 'vc-gradebridge-panel';
  const QUIET_OVERLAY_ID = 'vc-gradebridge-quiet-overlay';
  const STUDENT_OPTION_SELECTOR = [
    '[data-testid^="student-option-"]',
    '[data-test^="student-option-"]',
    '[role="option"]',
    '.ui-menu-item'
  ].join(', ');
  const assignmentNameRefresh = {
    attempts: 0,
    href: '',
    timer: null,
  };

  function getUrl() {
    return new URL(window.location.href);
  }

  function getCurrentInfo() {
    const url = getUrl();

    return {
      url,
      assignmentId: getAssignmentId(),
      studentId: url.searchParams.get('student_id'),
      anonymousId: url.searchParams.get('anonymous_id'),
    };
  }

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function getCourseId() {
  const match = window.location.pathname.match(/\/courses\/(\d+)/);
  return match?.[1] || 'unknown-course';
}

function getAssignmentId() {
  const url = getUrl();
  return (
    url.searchParams.get('assignment_id') ||
    url.searchParams.get('assignment') ||
    'unknown-assignment'
  );
}

function getAssignmentTextFromElement(el) {
  if (!el) return '';
  if (el.selectedOptions?.length) return cleanText(el.selectedOptions[0].textContent || '');
  return cleanText(el.textContent || el.value || el.getAttribute?.('aria-label') || '');
}

function cleanAssignmentName(value) {
  return cleanText(value)
    .replace(/^Assignment:\s*/i, '')
    .replace(/^Assessment\s+/i, '')
    .replace(/\s+[A-Z]{4}\d{4}\b.*$/, '')
    .replace(/,?\s*SpeedGrader,?\s*$/i, '')
    .replace(/[,\s]+$/, '')
    .trim();
}

function isUsefulAssignmentName(value) {
  const name = cleanAssignmentName(value);
  const assignmentId = getAssignmentId();

  if (!name || /^SpeedGrader$/i.test(name)) return false;
  if (name === assignmentId || name === `Assignment ${assignmentId}`) return false;
  if (/^\d+$/.test(name)) return false;
  if (/^Assignment\s+\d+$/i.test(name)) return false;
  if (/\/assignments\/\d+/i.test(name)) return false;
  if (/assignment_id=\d+/i.test(name)) return false;

  return true;
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

function getAssignmentNameFromAssignmentOptions() {
  const assignmentId = getAssignmentId();
  if (!assignmentId || assignmentId === 'unknown-assignment') return '';

  const options = Array.from(document.querySelectorAll('option'));
  const option = options.find(opt => {
    const value = cleanText(opt.value || opt.getAttribute('value') || '');
    return value === assignmentId || value.includes(`assignment_id=${assignmentId}`) || value.includes(`/assignments/${assignmentId}`);
  });

  if (option && isUsefulAssignmentName(option.textContent)) {
    return cleanAssignmentName(option.textContent);
  }

  const links = Array.from(document.querySelectorAll(`a[href*="/assignments/${assignmentId}"], a[href*="assignment_id=${assignmentId}"]`));
  const link = links.find(el => isUsefulAssignmentName(el.textContent || el.getAttribute('aria-label')));

  if (link) {
    return cleanAssignmentName(link.textContent || link.getAttribute('aria-label'));
  }

  return '';
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
    const text = getAssignmentTextFromElement(document.querySelector(selector));
    if (isUsefulAssignmentName(text)) return cleanAssignmentName(text);
  }

  const optionName = getAssignmentNameFromAssignmentOptions();
  if (isUsefulAssignmentName(optionName)) return optionName;

  const pageTextName = getAssignmentNameFromPageText();
  if (isUsefulAssignmentName(pageTextName)) return pageTextName;

  const title = cleanText(document.title || '').replace(/\s*\|\s*SpeedGrader.*$/i, '');
  if (isUsefulAssignmentName(title)) return cleanAssignmentName(title);

  return `Assignment ${getAssignmentId()}`;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function cleanStudentName(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/^\s*Student\s+\d+\s+of\s+\d+\s*/i, '')
    .trim();
}

function getCurrentStudentName() {
  const selectedStudent = document.querySelector('[data-testid="selected-student"]');
  const selectedName = cleanStudentName(selectedStudent?.textContent);

  if (selectedName) return selectedName;

  const selectors = [
    '[data-testid="student-select-trigger"]',
    '[data-test="student-select-trigger"]',
    '#students_selectmenu-button',
    '.ui-selectmenu-text',
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    const name = cleanStudentName(el?.textContent);
    if (name) return name;
  }

  return '';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForElement(selector, timeoutMs = 8000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const el = document.querySelector(selector);
    if (el) return el;
    await sleep(150);
  }

  return null;
}

async function waitForStudentOptions(timeoutMs = 2500) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const options = Array.from(document.querySelectorAll(STUDENT_OPTION_SELECTOR));
    if (options.length) return options;
    await sleep(50);
  }

  return [];
}

function loadPairs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.pairs) || '{}');
  } catch {
    return {};
  }
}

function savePairs(pairs) {
  localStorage.setItem(STORAGE_KEYS.pairs, JSON.stringify(pairs));
}

function loadAssignmentNameCache() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.assignmentNames) || '{}');
  } catch {
    return {};
  }
}

function saveAssignmentNameCache(cache) {
  localStorage.setItem(STORAGE_KEYS.assignmentNames, JSON.stringify(cache));
}

function loadPanelPosition() {
  try {
    const position = JSON.parse(localStorage.getItem(STORAGE_KEYS.panelPosition) || 'null');
    if (!position || !Number.isFinite(position.left) || !Number.isFinite(position.top)) return null;
    return position;
  } catch {
    return null;
  }
}

function savePanelPosition(left, top) {
  localStorage.setItem(STORAGE_KEYS.panelPosition, JSON.stringify({ left, top }));
}

function getClampedPanelPosition(panel, left, top) {
  const margin = 8;
  const rect = panel.getBoundingClientRect();
  const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
  const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);

  return {
    left: Math.min(Math.max(margin, left), maxLeft),
    top: Math.min(Math.max(margin, top), maxTop),
  };
}

function setPanelPosition(panel, left, top) {
  const position = getClampedPanelPosition(panel, left, top);

  panel.style.left = `${position.left}px`;
  panel.style.top = `${position.top}px`;
  panel.style.right = 'auto';
  panel.style.bottom = 'auto';

  return position;
}

function applySavedPanelPosition(panel) {
  const position = loadPanelPosition();
  if (!position) return;

  requestAnimationFrame(() => {
    const clamped = setPanelPosition(panel, position.left, position.top);
    savePanelPosition(clamped.left, clamped.top);
  });
}

function makePanelFloating(panel) {
  const handle = panel.querySelector('.vc-gradebridge-title');
  if (!handle) return;

  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;

    const rect = panel.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    panel.classList.add('vc-gradebridge-dragging');
    handle.setPointerCapture?.(event.pointerId);
    event.preventDefault();

    function onPointerMove(moveEvent) {
      const position = setPanelPosition(panel, moveEvent.clientX - offsetX, moveEvent.clientY - offsetY);
      savePanelPosition(position.left, position.top);
    }

    function onPointerUp(upEvent) {
      panel.classList.remove('vc-gradebridge-dragging');
      handle.releasePointerCapture?.(upEvent.pointerId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  });
}

function rememberAssignmentName(info) {
  if (!info?.courseId || !info?.assignmentId || !isUsefulAssignmentName(info.assignmentName)) return;

  const cache = loadAssignmentNameCache();

  if (!cache[info.courseId]) {
    cache[info.courseId] = {};
  }

  if (cache[info.courseId][info.assignmentId] === info.assignmentName) return;

  cache[info.courseId][info.assignmentId] = info.assignmentName;
  saveAssignmentNameCache(cache);
}

function getCachedAssignmentName(courseId, assignmentId) {
  const cache = loadAssignmentNameCache();
  const name = cache[courseId]?.[assignmentId] || '';
  return isUsefulAssignmentName(name) ? cleanAssignmentName(name) : '';
}

function getAssignmentDisplayName(courseId, assignmentId, preferredName, fallbackLabel) {
  if (isUsefulAssignmentName(preferredName)) {
    return cleanAssignmentName(preferredName);
  }

  const cachedName = getCachedAssignmentName(courseId, assignmentId);
  if (cachedName) return cachedName;

  return fallbackLabel;
}

function scheduleAssignmentNameRefresh() {
  const href = window.location.href;

  if (assignmentNameRefresh.href !== href) {
    assignmentNameRefresh.href = href;
    assignmentNameRefresh.attempts = 0;
  }

  if (assignmentNameRefresh.timer || assignmentNameRefresh.attempts >= 8) return;

  assignmentNameRefresh.timer = window.setTimeout(() => {
    assignmentNameRefresh.timer = null;
    assignmentNameRefresh.attempts += 1;

    const assignmentName = getAssignmentName();

    if (isUsefulAssignmentName(assignmentName)) {
      rememberAssignmentName({
        courseId: getCourseId(),
        assignmentId: getAssignmentId(),
        assignmentName,
      });
      renderPanel();
      return;
    }

    scheduleAssignmentNameRefresh();
  }, 500);
}

function getCoursePairs() {
  const pairs = loadPairs();
  const courseId = getCourseId();
  return pairs[courseId] || {};
}

function getCurrentAssignmentInfo() {
  const courseId = getCourseId();
  const assignmentId = getAssignmentId();
  const assignmentName = getAssignmentName();
  const info = {
    courseId,
    assignmentId,
    assignmentName: getAssignmentDisplayName(courseId, assignmentId, assignmentName, 'Current assignment'),
  };

  rememberAssignmentName({
    courseId: getCourseId(),
    assignmentId: getAssignmentId(),
    assignmentName,
  });

  return info;
}

function getSavedAnchor() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.anchor) || 'null');
  } catch {
    return null;
  }
}

function saveCurrentAssignmentAsAnchor() {
  const info = getCurrentAssignmentInfo();

  localStorage.setItem(STORAGE_KEYS.anchor, JSON.stringify(info));
  renderPanel();
}

function clearSavedAssignmentAnchor() {
  localStorage.removeItem(STORAGE_KEYS.anchor);
  renderPanel();
}

function getFirstAssignmentStatusText(firstAssignment) {
  if (!firstAssignment?.assignmentId) {
    return 'No connection yet.';
  }

  const assignmentName = getAssignmentDisplayName(
    firstAssignment.courseId,
    firstAssignment.assignmentId,
    firstAssignment.assignmentName,
    'First assignment'
  );

  return `First connection: ${assignmentName}`;
}

function getConnectionSetupState(anchor, currentAssignmentInfo) {
  if (!anchor?.assignmentId) {
    return 'no-anchor';
  }

  if (anchor.assignmentId === currentAssignmentInfo.assignmentId) {
    return 'anchor-is-current';
  }

  return 'ready-to-connect';
}

function getPrimarySetupButtonLabel(setupState, anchor) {
  if (setupState === 'no-anchor') {
    return 'Connect this assignment';
  }

  if (setupState === 'anchor-is-current') {
    return 'Connected!';
  }

  const anchorName = getAssignmentDisplayName(
    anchor.courseId,
    anchor.assignmentId,
    anchor.assignmentName,
    'the first assignment'
  );

  return `Connect this assignment to ${anchorName}`;
}

function getSetupHelpLabel(setupState) {
  if (setupState === 'no-anchor') {
    return 'Choose this first, then go to the assignment you want to connect';
  }

  if (setupState === 'anchor-is-current') {
    return 'Go to the SpeedGrader Assignment you would like to connect';
  }

  return '';
}

function pairCurrentAssignmentWithAnchor() {
  const current = getCurrentAssignmentInfo();
  const anchor = getSavedAnchor();

  if (!anchor) {
    alert('No connection saved yet. Open the first assignment in SpeedGrader and click "Connect this assignment".');
    return;
  }

  if (anchor.courseId !== current.courseId) {
    alert('Oh no! that is a different course. You can only connect assignments from the same course.');
    return;
  }

  if (anchor.assignmentId === current.assignmentId) {
    alert('Oh no! that is the same assignment. Open the assignment you want to connect, then click "Connect this assignment".');
    return;
  }

  const pairs = loadPairs();

  if (!pairs[current.courseId]) {
    pairs[current.courseId] = {};
  }

  const currentAssignmentName = getAssignmentDisplayName(
    current.courseId,
    current.assignmentId,
    current.assignmentName,
    'Current assignment'
  );
  const anchorAssignmentName = getAssignmentDisplayName(
    anchor.courseId,
    anchor.assignmentId,
    anchor.assignmentName,
    'Connected assignment'
  );

  pairs[current.courseId][anchor.assignmentId] = {
    targetAssignmentId: current.assignmentId,
    targetAssignmentName: currentAssignmentName,
    sourceAssignmentName: anchorAssignmentName,
  };

  pairs[current.courseId][current.assignmentId] = {
    targetAssignmentId: anchor.assignmentId,
    targetAssignmentName: anchorAssignmentName,
    sourceAssignmentName: currentAssignmentName,
  };

  savePairs(pairs);
  localStorage.removeItem(STORAGE_KEYS.anchor);

  renderPanel();
}

function getCurrentPair() {
  const coursePairs = getCoursePairs();
  const assignmentId = getAssignmentId();
  return coursePairs[assignmentId] || null;
}

function repairStoredCurrentAssignmentName(pair, currentAssignmentInfo) {
  if (!pair) return pair;

  const pairs = loadPairs();
  const coursePairs = pairs[currentAssignmentInfo.courseId];
  if (!coursePairs) return pair;

  const currentPair = coursePairs[currentAssignmentInfo.assignmentId];
  if (!currentPair) return pair;

  let changed = false;

  if (
    isUsefulAssignmentName(currentAssignmentInfo.assignmentName) &&
    currentPair.sourceAssignmentName !== currentAssignmentInfo.assignmentName
  ) {
    currentPair.sourceAssignmentName = currentAssignmentInfo.assignmentName;
    changed = true;
  }

  const reciprocalPair = coursePairs[currentPair.targetAssignmentId];
  if (
    reciprocalPair?.targetAssignmentId === currentAssignmentInfo.assignmentId &&
    isUsefulAssignmentName(currentAssignmentInfo.assignmentName) &&
    reciprocalPair.targetAssignmentName !== currentAssignmentInfo.assignmentName
  ) {
    reciprocalPair.targetAssignmentName = currentAssignmentInfo.assignmentName;
    changed = true;
  }

  const cachedTargetName = getCachedAssignmentName(currentAssignmentInfo.courseId, currentPair.targetAssignmentId);
  if (cachedTargetName && currentPair.targetAssignmentName !== cachedTargetName) {
    currentPair.targetAssignmentName = cachedTargetName;
    changed = true;
  }

  if (
    reciprocalPair &&
    cachedTargetName &&
    reciprocalPair.sourceAssignmentName !== cachedTargetName
  ) {
    reciprocalPair.sourceAssignmentName = cachedTargetName;
    changed = true;
  }

  if (changed) {
    savePairs(pairs);
  }

  return currentPair;
}

function removeCurrentConnection() {
  const current = getCurrentAssignmentInfo();
  const pair = getCurrentPair();
  if (!pair) return;

  const pairs = loadPairs();
  const coursePairs = pairs[current.courseId] || {};

  delete coursePairs[current.assignmentId];

  if (coursePairs[pair.targetAssignmentId]?.targetAssignmentId === current.assignmentId) {
    delete coursePairs[pair.targetAssignmentId];
  }

  pairs[current.courseId] = coursePairs;
  savePairs(pairs);
  renderPanel();
}

function setGradeBridgeQuietMode(isQuiet) {
  document.documentElement.classList.toggle('vc-gradebridge-quiet', isQuiet);

  let overlay = document.getElementById(QUIET_OVERLAY_ID);

  if (isQuiet && !overlay) {
    overlay = document.createElement('div');
    overlay.id = QUIET_OVERLAY_ID;
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="vc-gradebridge-quiet-card">
        <div class="vc-gradebridge-quiet-spinner"></div>
        <div>Finding the same student...</div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('vc-gradebridge-quiet-overlay-visible'));
  }

  if (!isQuiet && overlay) {
    overlay.classList.remove('vc-gradebridge-quiet-overlay-visible');
    window.setTimeout(() => overlay.remove(), 180);
  }
}

function closeStudentMenu() {
  const trigger = document.querySelector('[data-testid="student-select-trigger"]');

  if (trigger && trigger.getAttribute('aria-expanded') === 'true') {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      which: 27,
      bubbles: true,
    }));

    trigger.blur();
  }
}

async function restoreTargetStudent() {
  const targetName = localStorage.getItem(STORAGE_KEYS.targetStudentName);
  if (!targetName) return;

  localStorage.removeItem(STORAGE_KEYS.targetStudentName);

  const currentName = getCurrentStudentName();

  if (
    currentName &&
    currentName.toLowerCase() === targetName.toLowerCase()
  ) {
    return;
  }

  const trigger = await waitForElement(
    '[data-testid="student-select-trigger"], [data-test="student-select-trigger"], #students_selectmenu-button'
  );

  if (!trigger) {
    console.warn('[GradeBridge] Could not find student dropdown trigger.');
    return;
  }

  setGradeBridgeQuietMode(true);

  try {
    trigger.click();

    const options = await waitForStudentOptions();

    const targetLower = cleanStudentName(targetName).toLowerCase();

    const match = options.find(option => {
      const text = cleanStudentName(option.textContent).toLowerCase();
      return text.includes(targetLower) || targetLower.includes(text);
    });

    if (!match) {
      console.warn('[GradeBridge] Could not find matching student:', targetName);
      closeStudentMenu();
      return;
    }

    match.click();

    await sleep(150);
    closeStudentMenu();
  } finally {
    await sleep(250);
    setGradeBridgeQuietMode(false);
  }
}

function goToPair(pair, currentInfo) {
  const studentName = getCurrentStudentName();

  if (studentName) {
    localStorage.setItem(STORAGE_KEYS.targetStudentName, studentName);
  }

  const nextUrl = new URL(currentInfo.url.toString());

  nextUrl.searchParams.set('assignment_id', pair.targetAssignmentId);

  // Important: remove these, because Canvas student tokens may not work across assignments.
  nextUrl.searchParams.delete('anonymous_id');
  nextUrl.searchParams.delete('student_id');

  setGradeBridgeQuietMode(true);
  window.location.href = nextUrl.toString();
}

function renderPanel() {
  const existing = document.getElementById(PANEL_ID);
  if (existing) existing.remove();

  const currentInfo = getCurrentInfo();
  const assignmentInfo = getCurrentAssignmentInfo();
  if (assignmentInfo.assignmentName === 'Current assignment') {
    scheduleAssignmentNameRefresh();
  }

  let pair = getCurrentPair();
  pair = repairStoredCurrentAssignmentName(pair, assignmentInfo);
  const anchor = getSavedAnchor();
  const setupState = getConnectionSetupState(anchor, assignmentInfo);
  const firstAssignmentStatusText = getFirstAssignmentStatusText(anchor);
  const primarySetupButtonLabel = getPrimarySetupButtonLabel(setupState, anchor);
  const setupHelpLabel = getSetupHelpLabel(setupState);
  const connectedAssignmentName = pair
    ? getAssignmentDisplayName(
      assignmentInfo.courseId,
      pair.targetAssignmentId,
      pair.targetAssignmentName,
      'Connected assignment'
    )
    : '';
  let connectionControls = '';

  if (pair) {
    connectionControls = `
      ${anchor ? `
        <button type="button" class="vc-gradebridge-link" data-vc-gradebridge-action="clear-anchor">
          Clear this connection
        </button>
      ` : ''}
      <button type="button" class="vc-gradebridge-link" data-vc-gradebridge-action="remove-connection">
        Remove this connection
      </button>
    `;
  } else if (setupState === 'no-anchor') {
    connectionControls = `
      <button type="button" class="vc-gradebridge-secondary" data-vc-gradebridge-action="save-anchor">
        ${escapeHtml(primarySetupButtonLabel)}
      </button>
      <button type="button" class="vc-gradebridge-secondary vc-gradebridge-helper" disabled>
        ${escapeHtml(setupHelpLabel)}
      </button>
    `;
  } else if (setupState === 'anchor-is-current') {
    connectionControls = `
      <button type="button" class="vc-gradebridge-secondary vc-gradebridge-confirmed" disabled>
        ${escapeHtml(primarySetupButtonLabel)}
      </button>
      <button type="button" class="vc-gradebridge-secondary vc-gradebridge-helper" disabled>
        ${escapeHtml(setupHelpLabel)}
      </button>
      <button type="button" class="vc-gradebridge-link" data-vc-gradebridge-action="clear-anchor">
        Clear this connection
      </button>
    `;
  } else {
    connectionControls = `
      <button type="button" class="vc-gradebridge-secondary" data-vc-gradebridge-action="pair-anchor">
        ${escapeHtml(primarySetupButtonLabel)}
      </button>
      <button type="button" class="vc-gradebridge-link" data-vc-gradebridge-action="clear-anchor">
        Clear this connection
      </button>
    `;
  }

  const panel = document.createElement('div');
  panel.id = PANEL_ID;

  panel.innerHTML = `
    <div class="vc-gradebridge-title">GradeBridge</div>
    <div class="vc-gradebridge-subtitle">${escapeHtml(assignmentInfo.assignmentName)}</div>
    ${pair ? `
      <div class="vc-gradebridge-pair-block">
        <div class="vc-gradebridge-section-label">Connected assignments</div>
        <button
          type="button"
          class="vc-gradebridge-assignment-card vc-gradebridge-assignment-card-current"
          disabled
        >
          <span class="vc-gradebridge-assignment-tag">Current</span>
          <span class="vc-gradebridge-assignment-name">
            ${escapeHtml(assignmentInfo.assignmentName)}
          </span>
        </button>
        <button
          type="button"
          class="vc-gradebridge-assignment-card vc-gradebridge-assignment-card-target"
          data-vc-gradebridge-action="jump"
        >
          <span class="vc-gradebridge-assignment-tag vc-gradebridge-assignment-tag-go">Go to</span>
          <span class="vc-gradebridge-assignment-name">
            ${escapeHtml(connectedAssignmentName)}
          </span>
        </button>
      </div>
    ` : `
      <div class="vc-gradebridge-empty">No connection yet.</div>
    `}
    <details class="vc-gradebridge-manage" ${pair ? '' : 'open'}>
      <summary>Manage Connections</summary>
      ${(!pair || anchor) ? `<div class="vc-gradebridge-anchor">${escapeHtml(firstAssignmentStatusText)}</div>` : ''}
      ${connectionControls}
    </details>
  `;

  document.body.appendChild(panel);
  applySavedPanelPosition(panel);
  makePanelFloating(panel);

  panel.querySelector('[data-vc-gradebridge-action="jump"]')?.addEventListener('click', () => {
    goToPair(pair, currentInfo);
  });

  panel.querySelector('[data-vc-gradebridge-action="save-anchor"]')?.addEventListener('click', () => {
    saveCurrentAssignmentAsAnchor();
  });

  panel.querySelector('[data-vc-gradebridge-action="pair-anchor"]')?.addEventListener('click', () => {
    pairCurrentAssignmentWithAnchor();
  });

  panel.querySelector('[data-vc-gradebridge-action="clear-anchor"]')?.addEventListener('click', () => {
    clearSavedAssignmentAnchor();
  });

  panel.querySelector('[data-vc-gradebridge-action="remove-connection"]')?.addEventListener('click', () => {
    removeCurrentConnection();
  });
}

  function addStyles() {
    if (document.getElementById('vc-gradebridge-styles')) return;

    const style = document.createElement('style');
    style.id = 'vc-gradebridge-styles';
    style.textContent = `
      #vc-gradebridge-panel {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 999999;
        width: 240px;
        padding: 12px;
        border-radius: 14px;
        background: #11151a;
        color: #f4f4f4;
        box-shadow: 0 10px 30px rgba(0,0,0,0.35);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        border: 1px solid rgba(255,255,255,0.12);
      }

      #vc-gradebridge-panel::before {
        content: "";
        position: absolute;
        left: 0;
        top: 12px;
        bottom: 12px;
        width: 5px;
        border-radius: 0 4px 4px 0;
        background: #f2c94c;
      }

      .vc-gradebridge-title {
        font-size: 14px;
        font-weight: 700;
        margin-left: 8px;
        margin-bottom: 2px;
        cursor: grab;
        user-select: none;
        touch-action: none;
      }

      #vc-gradebridge-panel.vc-gradebridge-dragging {
        transition: none;
        opacity: 0.94;
      }

      #vc-gradebridge-panel.vc-gradebridge-dragging .vc-gradebridge-title {
        cursor: grabbing;
      }

      .vc-gradebridge-subtitle {
        font-size: 11px;
        color: #aab2bd;
        margin-left: 8px;
        margin-bottom: 10px;
      }

      .vc-gradebridge-button {
        width: 100%;
        border: 0;
        border-radius: 10px;
        padding: 9px 10px;
        background: #2563eb;
        color: white;
        font-size: 13px;
        font-weight: 650;
        cursor: pointer;
      }

      .vc-gradebridge-button:hover {
        background: #1d4ed8;
      }

      .vc-gradebridge-empty {
        padding: 9px 10px;
        border-radius: 10px;
        background: rgba(255,255,255,0.08);
        color: #c9d1dc;
        font-size: 12px;
        line-height: 1.3;
      }

      .vc-gradebridge-status {
        margin-top: 8px;
        color: #aab2bd;
        font-size: 11px;
        line-height: 1.3;
      }

      .vc-gradebridge-pair-block {
        display: grid;
        gap: 7px;
      }

      .vc-gradebridge-section-label {
        margin: 2px 0 1px;
        color: #aab2bd;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }

      .vc-gradebridge-assignment-card {
        width: 100%;
        appearance: none;
        -webkit-appearance: none;
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 8px;
        border: 0;
        border-radius: 10px;
        padding: 9px 10px;
        text-align: left;
        font-size: 12px;
        font-weight: 650;
      }

      .vc-gradebridge-assignment-card-current,
      .vc-gradebridge-assignment-card-current:disabled {
        cursor: default;
        background: rgba(255,255,255,0.08) !important;
        color: #aab2bd !important;
        -webkit-text-fill-color: #aab2bd !important;
        opacity: 0.78;
      }

      .vc-gradebridge-assignment-card-target {
        cursor: pointer;
        background: #2563eb !important;
        color: #ffffff !important;
      }

      .vc-gradebridge-assignment-card-target:hover {
        background: #1d4ed8 !important;
      }

      .vc-gradebridge-assignment-tag {
        padding: 2px 6px;
        border-radius: 999px;
        background: rgba(255,255,255,0.12);
        color: inherit;
        font-size: 10px;
        font-weight: 750;
        line-height: 1;
        white-space: nowrap;
      }

      .vc-gradebridge-assignment-tag-go {
        background: rgba(255,255,255,0.2);
      }

      .vc-gradebridge-assignment-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .vc-gradebridge-manage {
        margin-top: 10px;
        border-top: 1px solid rgba(255,255,255,0.12);
        padding-top: 9px;
      }

      .vc-gradebridge-manage summary {
        color: #d6dde7;
        cursor: pointer;
        font-size: 12px;
        font-weight: 700;
        list-style: none;
      }

      .vc-gradebridge-manage summary::-webkit-details-marker {
        display: none;
      }

      .vc-gradebridge-manage summary::after {
        content: " ▾";
        color: #8f9bab;
      }

      .vc-gradebridge-manage[open] summary {
        margin-bottom: 8px;
      }

      .vc-gradebridge-anchor {
        margin-bottom: 8px;
        color: #aab2bd;
        font-size: 11px;
        line-height: 1.3;
      }

      .vc-gradebridge-secondary,
      .vc-gradebridge-link {
        width: 100%;
        border: 0;
        border-radius: 8px;
        padding: 7px 8px;
        font-size: 12px;
        font-weight: 650;
        cursor: pointer;
      }

      .vc-gradebridge-secondary {
        margin-top: 6px;
        background: rgba(255,255,255,0.12);
        color: #f4f4f4;
      }

      .vc-gradebridge-secondary:hover {
        background: rgba(255,255,255,0.18);
      }

      .vc-gradebridge-secondary:disabled {
        cursor: not-allowed;
        opacity: 0.48;
      }

      .vc-gradebridge-secondary:disabled:hover {
        background: rgba(255,255,255,0.12);
      }

      .vc-gradebridge-confirmed:disabled {
        opacity: 0.85;
        color: #fefefe;
        background: rgba(26, 216, 87, 0.88);
      }

      .vc-gradebridge-helper:disabled {
        opacity: 0.5;
        font-weight: 600;
      }

      .vc-gradebridge-link {
        margin-top: 6px;
        background: transparent;
        color: #aab2bd;
        text-align: left;
      }

      .vc-gradebridge-link:hover {
        color: #f4f4f4;
        background: rgba(255,255,255,0.08);
      }

      #vc-gradebridge-quiet-overlay {
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding: 0 18px 28px;
        background: rgba(247, 248, 250, 0);
        opacity: 0;
        pointer-events: none;
        transition: opacity 160ms ease, background 160ms ease;
      }

      #vc-gradebridge-quiet-overlay.vc-gradebridge-quiet-overlay-visible {
        background: rgba(247, 248, 250, 0.62);
        opacity: 1;
      }

      .vc-gradebridge-quiet-card {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 38px;
        padding: 8px 12px;
        border: 1px solid rgba(17, 24, 39, 0.12);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.94);
        color: #111827;
        box-shadow: 0 10px 28px rgba(17, 24, 39, 0.16);
        font: 600 13px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .vc-gradebridge-quiet-spinner {
        width: 15px;
        height: 15px;
        border: 2px solid rgba(37, 99, 235, 0.24);
        border-top-color: #2563eb;
        border-radius: 999px;
        animation: vc-gradebridge-spin 680ms linear infinite;
      }

      @keyframes vc-gradebridge-spin {
        to { transform: rotate(360deg); }
      }

      html.vc-gradebridge-quiet {
        cursor: progress;
      }

      html.vc-gradebridge-quiet [data-testid="student-select-trigger"],
      html.vc-gradebridge-quiet [data-test="student-select-trigger"],
      html.vc-gradebridge-quiet #students_selectmenu-button {
        transition: opacity 120ms ease !important;
        opacity: 0.08 !important;
      }

      html.vc-gradebridge-quiet [data-position-target="student-select-drilldown"],
      html.vc-gradebridge-quiet [data-position-content],
      html.vc-gradebridge-quiet [data-position-target],
      html.vc-gradebridge-quiet [data-testid="student-select-drilldown"],
      html.vc-gradebridge-quiet [role="menu"],
      html.vc-gradebridge-quiet [role="listbox"],
      html.vc-gradebridge-quiet [data-testid^="student-option-"],
      html.vc-gradebridge-quiet [data-test^="student-option-"],
      html.vc-gradebridge-quiet .ui-menu,
      html.vc-gradebridge-quiet .ui-selectmenu-menu {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        transform: translateY(-6px) scale(0.98) !important;
      }
    `;

    document.head.appendChild(style);
  }

function init() {
  addStyles();
  restoreTargetStudent();
  renderPanel();
}

  init();
})();
