// ==UserScript==
// @name         Canvas SpeedGraderPrince When Will It End
// @namespace    VisComm@UON
// @version      0.5
// @description  Estimate marking time remaining and log marking session data locally, with local group awareness
// @match        https://*/courses/*/gradebook/speed_grader*
// @require      File:///Users/jbs939/Desktop/AssessmentHelpers/canvas-speedgraderPrince-when-will-it-end.user.js
// @resource     princeFacingRight https://raw.githubusercontent.com/DashDot-Dash/AssessmentHelpers/main/Assets/PrinceFacingRight.png
// @resource     princeFacingLeft https://raw.githubusercontent.com/DashDot-Dash/AssessmentHelpers/main/Assets/PrinceFacingLeft.png
// @grant        GM_getResourceURL
// ==/UserScript==

(function () {
  'use strict';

  // Estimates SpeedGrader marking time and logs local session timing data.

  // constants/config
  const PANEL_ID = 'wwie-prince-panel';
  const Z_INDEX_BASE = 100000;
  const STORAGE_PREFIX = 'canvas_speedgrader_when_will_it_end_v1';
  const LEGACY_STORAGE_PREFIX = 'wwie_';
  const POSITION_KEY = `${STORAGE_PREFIX}:panel_position`;
  const LEGACY_POSITION_KEY = 'wwie_panel_position';
  const MAX_VALID_SECONDS = 20 * 60;
  const MIN_VALID_SECONDS = 15;
  const ROLLING_COUNT = 5;
  const STYLE_ID = 'wwie-prince-style';
  const PANEL_WIDTH = 340;

  // selectors
  const selectors = {
    panel: `#${PANEL_ID}`,
    selectedStudent: '[data-testid="selected-student"]',
    studentSelectTrigger: '[data-testid="student-select-trigger"]'
  };

  // state
  const state = {
    currentStudentKey: null,
    currentStartTime: null,
    lastSeenUrl: location.href,
    lastRenderedSignature: '',
    tickInterval: null,
    navInterval: null,
    drag: null,
    princeWidget: null,
    lastProgressRatio: 0,
  };

  // elements
  const elements = {};

  function getAssignmentKey() {
    const url = new URL(window.location.href);
    const courseMatch = url.pathname.match(/\/courses\/(\d+)\//);
    const assignmentId = url.searchParams.get('assignment_id') || 'unknown_assignment';
    const courseId = courseMatch ? courseMatch[1] : 'unknown_course';
    return `${courseId}_${assignmentId}`;
  }

  function getAssignmentId() {
    const url = new URL(window.location.href);
    return url.searchParams.get('assignment_id') || url.searchParams.get('assignment') || 'unknown_assignment';
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
    return `${prefix}:${getAssignmentKey()}`;
  }

  function getLegacyStorageKey() {
    return LEGACY_STORAGE_PREFIX + getAssignmentKey();
  }

  function getStoredJson() {
    return localStorage.getItem(getStorageKey()) || localStorage.getItem(getLegacyStorageKey());
  }

  function defaultData() {
    return {
      timings: [],
      completedStudentKeys: [],
      entries: [],
      minimized: false,
      sessionStartedAt: Date.now()
    };
  }

  function loadData() {
    try {
      return { ...defaultData(), ...(JSON.parse(getStoredJson()) || {}) };
    } catch {
      return defaultData();
    }
  }

  function saveData(data) {
    localStorage.setItem(getStorageKey(), JSON.stringify(data));
  }

  function getPanelPosition() {
    try {
      const pos = JSON.parse(localStorage.getItem(POSITION_KEY) || localStorage.getItem(LEGACY_POSITION_KEY));
      if (pos && Number.isFinite(pos.left) && Number.isFinite(pos.top)) return pos;
    } catch {}
    return { top: 80, right: 18 };
  }

  function savePanelPosition(left, top) {
    localStorage.setItem(POSITION_KEY, JSON.stringify({ left, top }));
  }

  function clampPanelToViewport(panel, persist = false) {
    if (!panel) return;
    const margin = 8;
    const rect = panel.getBoundingClientRect();
    const width = rect.width || PANEL_WIDTH;
    const height = rect.height || 80;
    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - height - margin);
    const left = Math.min(Math.max(margin, rect.left), maxLeft);
    const top = Math.min(Math.max(margin, rect.top), maxTop);

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.right = 'auto';

    if (persist) savePanelPosition(left, top);
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
    function cleanText(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
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

function bringPanelToFront(panel) {
  if (!panel) return;
  const current = Number(window.__canvasAssessmentPanelZIndex || Z_INDEX_BASE);
  const next = current + 1;
  window.__canvasAssessmentPanelZIndex = next;
  panel.style.zIndex = String(next);
}

function getCurrentStudentDisplayName() {
  const selectedStudentEl = document.querySelector(selectors.selectedStudent);
  const selectedStudentText = cleanText(selectedStudentEl?.textContent || '');
  if (selectedStudentText) return selectedStudentText;

  const triggerEl = document.querySelector(selectors.studentSelectTrigger);
  const triggerText = cleanText(triggerEl?.textContent || '');
  if (triggerText) {
    const cleanedTrigger = triggerText.replace(/^●\s*/, '').trim();
    if (cleanedTrigger) return cleanedTrigger;
  }

  return '';
}

function getCurrentStudentKey() {
  const displayName = getCurrentStudentDisplayName();
  if (displayName) return `name:${normalizeName(displayName)}`;

  const url = new URL(window.location.href);
  const byParam =
    url.searchParams.get('student_id') ||
    url.searchParams.get('student_ids') ||
    url.searchParams.get('user_id');

  if (byParam) return `id:${byParam}`;

  return 'unknown_student';
}

function getLocalGroupContext() {
  try {
    const possibleKeys = [
      'chatster_tutorial_sorter_context_v11',
      'chatster_tutorial_sorter_context_v10',
      'chatster_local_marking_group_context_v9',
      'chatster_local_marking_group_context_v8',
      'chatster_local_marking_group_context_v7',
      'chatster_local_marking_group_context_v6',
      'chatster_local_marking_group_context_v5',
      'chatster_local_marking_group_context_v4',
      'chatster_local_marking_group_context_v3',
      'chatster_local_marking_group_context_v2',
      'chatster_local_marking_group_context_v1'
    ];

    let raw = null;
    for (const key of possibleKeys) {
      raw = localStorage.getItem(key);
      if (raw) break;
    }

    if (!raw) return null;

    const context = JSON.parse(raw);
    if (!context) return null;

    const courseMatch = location.pathname.match(/\/courses\/(\d+)\//);
    const currentCourseKey = courseMatch ? courseMatch[1] : 'unknown_course';

    if (context.course_key && context.course_key !== currentCourseKey) {
      return null;
    }

    return context;
  } catch {
    return null;
  }
}

  function getStudentListInfo() {
    const context = getLocalGroupContext();

    if (
      context &&
      context.active_group_id &&
      Number.isFinite(context.matched_count)
    ) {
      const total = context.matched_count;
      const currentIndex =
        Number.isFinite(context.current_index_in_group) ? context.current_index_in_group : null;
      const remaining =
        Number.isFinite(context.remaining_in_group) ? context.remaining_in_group : null;

      return {
        source: 'local_group',
        groupName: context.active_group_name || '',
        metadata: context.metadata || {},
        total,
        done: currentIndex != null && currentIndex >= 0 ? currentIndex : null,
        currentIndex,
        remaining
      };
    }

    const gradedEl = document.querySelector('[data-testid="graded-students-count"]');
    if (gradedEl) {
      const text = gradedEl.textContent.trim();
      const match = text.match(/^(\d+)\s*\/\s*(\d+)$/);

      if (match) {
        const done = parseInt(match[1], 10);
        const total = parseInt(match[2], 10);

        return {
          source: 'canvas',
          groupName: '',
          metadata: {},
          total,
          done,
          currentIndex: done,
          remaining: Math.max(0, total - done)
        };
      }
    }

    return {
      source: 'unknown',
      groupName: '',
      metadata: {},
      total: null,
      done: null,
      currentIndex: null,
      remaining: null
    };
  }

  function getProgressInfo(info, data) {
    const total = Number.isFinite(info.total) ? info.total : null;
    const contextualDone =
      info.source === 'local_group' && info.currentIndex != null
        ? info.currentIndex + 1
        : info.done;
    const loggedDone = data.entries.length;
    const done =
      total != null
        ? Math.min(total, Math.max(contextualDone ?? 0, loggedDone))
        : loggedDone;

    return {
      total,
      done,
      visibleDone: contextualDone ?? loggedDone,
      ratio: total ? Math.min(1, done / total) : 0
    };
  }

  function average(arr) {
    if (!arr.length) return null;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function median(arr) {
    if (!arr.length) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function rollingAverage(arr, count = ROLLING_COUNT) {
    if (!arr.length) return null;
    return average(arr.slice(-count));
  }

  function formatDuration(seconds) {
    if (seconds == null || !isFinite(seconds)) return '—';
    seconds = Math.max(0, Math.round(seconds));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function formatClock(timestamp) {
    if (!timestamp || !isFinite(timestamp)) return '—';
    return new Date(timestamp).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function formatISO(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toISOString();
  }

  function csvEscape(value) {
    const str = String(value ?? '');
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  }

function getButtonCss() {
  return 'wwie-btn';
}

function getQuietButtonCss() {
  return 'wwie-btn-quiet';
}

function getDangerButtonCss() {
  return 'wwie-btn-danger';
}

function stat(label, value) {
  return `
    <div class="wwie-stat">
      <div class="wwie-stat-label">${escapeHtml(label)}</div>
      <div class="wwie-stat-value">${escapeHtml(String(value))}</div>
    </div>
  `;
}

function updateCurrentElapsedDisplay() {
  const elapsedEl = document.querySelector(`#${PANEL_ID} #wwie-current-elapsed`);
  if (!elapsedEl) return;
  elapsedEl.textContent = state.currentStartTime
    ? formatDuration((Date.now() - state.currentStartTime) / 1000)
    : '—';
}

const PRINCE_RIGHT_FALLBACK_URL = 'https://raw.githubusercontent.com/DashDot-Dash/AssessmentHelpers/main/Assets/PrinceFacingRight.png';
const PRINCE_LEFT_FALLBACK_URL = 'https://raw.githubusercontent.com/DashDot-Dash/AssessmentHelpers/main/Assets/PrinceFacingLeft.png';

function getResourceUrl(name, fallbackUrl) {
  try {
    if (typeof GM_getResourceURL === 'function') {
      return GM_getResourceURL(name) || fallbackUrl;
    }
  } catch {}
  return fallbackUrl;
}

const PRINCE_RIGHT_URL = getResourceUrl('princeFacingRight', PRINCE_RIGHT_FALLBACK_URL);
const PRINCE_LEFT_URL = getResourceUrl('princeFacingLeft', PRINCE_LEFT_FALLBACK_URL);

function createPrinceProgressWidget() {
  const FRAME_W = 40;
  const FRAME_H = 47;

  const SHEETS = {
    right: PRINCE_RIGHT_URL,
    left: PRINCE_LEFT_URL
  };

  function hasSpriteSheets() {
    return Boolean(SHEETS.right && SHEETS.left);
  }

  const clips = {
    idle: [
      "right:r1c1"
    ],

    drink: [
      "right:r5c7",
      "right:r6c1", "right:r6c2", "right:r6c3", "right:r6c4", "right:r6c5", "right:r6c6", "right:r6c7",
      "right:r7c1", "right:r7c2", "right:r7c3", "right:r7c4", "right:r7c5"
    ],

    runRight: [
      "right:r1c5", "right:r1c6", "right:r1c7",
      "right:r2c1", "right:r2c2", "right:r2c3", "right:r2c4"
    ],

    turnLeftAtEnd: [
      "right:r2c5", "right:r2c6", "right:r2c7",
      "right:r3c1", "right:r3c2", "right:r3c3", "right:r3c4", "right:r3c5", "right:r3c6", "right:r3c7",
      "right:r4c1", "right:r4c2", "right:r4c3"
    ],

    runLeft: [
      "left:r1c5", "left:r1c6", "left:r1c7",
      "left:r2c1", "left:r2c2", "left:r2c3", "left:r2c4"
    ],

    jumpMarker: [
      "left:r4c6", "left:r4c7",
      "left:r5c1", "left:r5c2", "left:r5c3", "left:r5c4", "left:r5c5"
    ],

    turnRightAtStart: [
      "left:r2c5", "left:r2c6", "left:r2c7",
      "left:r3c1", "left:r3c2", "left:r3c3", "left:r3c4", "left:r3c5", "left:r3c6", "left:r3c7",
      "left:r4c1", "left:r4c2", "left:r4c3"
    ],

    runRightShort: [
      "right:r1c6", "right:r1c7",
      "right:r2c1", "right:r2c2", "right:r2c3", "right:r2c4", "right:r1c5"
    ],

    slideToStop: [
      "right:r2c6", "right:r2c7",
      "right:r3c1", "right:r3c2", "right:r3c3", "right:r3c4"
    ],

    settleIdle: [
      "right:r1c1"
    ]
  };

  const config = {
    scale: 1,
    width: PANEL_WIDTH - 24,
    barHeight: 10,
    markerSize: 0,
    paddingX: 12,
    paddingTop: 10,
    paddingBottom: 10,
    anchorRatio: 0.5,
    turnTravel: 34,
    jumpOffset: 60,
    restOffset: 18,
    preRestOffset: 56
  };

  const DISPLAY_W = FRAME_W * config.scale;
  const DISPLAY_H = FRAME_H * config.scale;

  const widget = document.createElement('div');
  widget.style.cssText = `
    position: relative;
    width: ${config.width}px;
    height: ${Math.ceil(DISPLAY_H + config.paddingTop + config.paddingBottom + 8)}px;
    overflow: visible;
    user-select: none;
    margin: 10px 0 8px 0;
  `;

  const bar = document.createElement('div');
  bar.style.cssText = `
    position: absolute;
    left: ${config.paddingX}px;
    right: ${config.paddingX}px;
    bottom: ${config.paddingBottom}px;
    height: ${config.barHeight}px;
    background: #11151a;
    border-radius: 999px;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
  `;

  const fill = document.createElement('div');
  fill.style.cssText = `
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0%;
    background: linear-gradient(to right, #a8d07d, #d7f08e);
    border-radius: 999px;
    transition: width 0.18s linear;
  `;

  const marker = document.createElement('div');
  marker.style.cssText = `
    position: absolute;
    top: 50%;
    width: ${config.markerSize}px;
    height: ${config.markerSize}px;
    margin-top: -${config.markerSize / 2}px;
    border-radius: 50%;
    background: #f3d36c;
    transform: translateX(-50%);
    box-shadow: 0 0 0 2px rgba(0,0,0,0.15);
  `;

  const sprite = document.createElement('div');
  sprite.style.cssText = `
    position: absolute;
    width: ${DISPLAY_W}px;
    height: ${DISPLAY_H}px;
    left: 0;
    top: 0;
    background-repeat: no-repeat;
    background-position: 0 0;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    pointer-events: none;
  `;

  //fill.appendChild(marker);
  bar.appendChild(fill);
  widget.appendChild(bar);
  widget.appendChild(sprite);

  const barLeft = config.paddingX;
  const barWidth = config.width - (config.paddingX * 2);
  const barStartX = barLeft;
  const barEndX = barLeft + barWidth;
  const spriteBaseY = Math.ceil(DISPLAY_H * 0.15);
  const spriteAnchorX = DISPLAY_W * config.anchorRatio;

  let currentProgress = 0;
  let busy = false;

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function progressToX(progress) {
    return barLeft + (barWidth * progress);
  }

  function parseFrameLabel(label) {
    const match = label.match(/^(right|left):r(\d+)c(\d+)$/);
    if (!match) throw new Error(`Bad frame label: ${label}`);
    return {
      sheet: match[1],
      row: Number(match[2]),
      col: Number(match[3])
    };
  }

  function setFrame(label) {
    const { sheet, row, col } = parseFrameLabel(label);
    const bgX = -((col - 1) * DISPLAY_W);
    const bgY = -((row - 1) * DISPLAY_H);
    sprite.style.backgroundImage = `url("${SHEETS[sheet]}")`;
    sprite.style.backgroundSize = `${DISPLAY_W * 7}px ${DISPLAY_H * 7}px`;
    sprite.style.backgroundPosition = `${bgX}px ${bgY}px`;
  }

  function setSpriteX(x) {
    sprite.style.left = `${Math.round(x - spriteAnchorX)}px`;
  }

  function setSpriteY(y) {
    sprite.style.top = `${Math.round(y)}px`;
  }

  function setBarProgress(progress) {
    const p = Math.max(0, Math.min(1, progress));
    fill.style.width = `${p * 100}%`;
    marker.style.left = `${p * 100}%`;
  }

  async function playClip(frames, frameMs = 100, loop = 1) {
    for (let l = 0; l < loop; l++) {
      for (const frame of frames) {
        setFrame(frame);
        await sleep(frameMs);
      }
    }
  }

  async function moveLinear(fromX, toX, durationMs, onUpdate) {
    return new Promise(resolve => {
      const startTime = performance.now();

      function tick(now) {
        const t = Math.min(1, (now - startTime) / durationMs);
        const x = fromX + ((toX - fromX) * t);
        onUpdate(t, x);

        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          resolve();
        }
      }

      requestAnimationFrame(tick);
    });
  }

  async function runClip(frames, fromX, toX, durationMs, frameMs = 80) {
    let i = 0;
    setFrame(frames[0]);

    const frameTimer = setInterval(() => {
      i = (i + 1) % frames.length;
      setFrame(frames[i]);
    }, frameMs);

    await moveLinear(fromX, toX, durationMs, (_t, x) => {
      setSpriteX(x);
      setSpriteY(spriteBaseY);
    });

    clearInterval(frameTimer);
    setFrame(frames[i]);
  }

  async function jumpClip(frames, fromX, toX, durationMs, jumpHeight = 20, frameMs = 60) {
    let i = 0;
    setFrame(frames[0]);

    const frameTimer = setInterval(() => {
      i = (i + 1) % frames.length;
      setFrame(frames[i]);
    }, frameMs);

    await moveLinear(fromX, toX, durationMs, (t, x) => {
      const arc = 4 * jumpHeight * t * (1 - t);
      setSpriteX(x);
      setSpriteY(spriteBaseY - arc);
    });

    clearInterval(frameTimer);
    setSpriteY(spriteBaseY);
    setFrame(frames[i]);
  }

  async function playMovingThenStaticClip(frames, fromX, toX, frameMs = 100, moveFraction = 0.25) {
    const moveFrameCount = Math.max(1, Math.round(frames.length * moveFraction));

    await new Promise(resolve => {
      const startTime = performance.now();
      const durationMs = moveFrameCount * frameMs;
      let frameIndex = 0;

      setFrame(frames[0]);

      const timer = setInterval(() => {
        if (frameIndex < moveFrameCount) {
          setFrame(frames[frameIndex]);
          frameIndex++;
        }
      }, frameMs);

      function tick(now) {
        const t = Math.min(1, (now - startTime) / durationMs);
        const x = fromX + ((toX - fromX) * t);
        setSpriteX(x);
        setSpriteY(spriteBaseY);

        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          clearInterval(timer);
          resolve();
        }
      }

      requestAnimationFrame(tick);
    });

    for (let i = moveFrameCount; i < frames.length; i++) {
      setFrame(frames[i]);
      await sleep(frameMs);
    }

    setSpriteX(toX);
    setSpriteY(spriteBaseY);
  }

  function placeAtProgress(progress) {
    currentProgress = Math.max(0, Math.min(1, progress));
    setBarProgress(currentProgress);
    setSpriteX(progressToX(currentProgress));
    setSpriteY(spriteBaseY);
    if (hasSpriteSheets()) {
      setFrame(clips.idle[0]);
    }
  }

async function celebrateTo(newProgress) {
  newProgress = Math.max(0, Math.min(1, newProgress));

  if (busy) return;

  if (!hasSpriteSheets()) {
    setBarProgress(newProgress);
    currentProgress = newProgress;
    return;
  }

  busy = true;

  const oldX = progressToX(currentProgress);
  const markerX = progressToX(newProgress);

  // rightward run stops a bit before the end so the turn clip can slide into place
  const runRightEndX = barEndX - config.turnTravel;

  // final resting position near the marker
 const finalStopX = markerX;

  // stop the leftward run short so the final turn can slide into the stop
  const runLeftEndX = finalStopX + config.turnTravel;

  setSpriteX(oldX);
  setSpriteY(spriteBaseY);

  await playClip(clips.drink, 95, 1);

  await runClip(clips.runRight, oldX, runRightEndX, 900, 100);
  await playMovingThenStaticClip(clips.turnLeftAtEnd, runRightEndX, barEndX, 80, 1);

  setBarProgress(newProgress);

  await runClip(clips.runLeft, barEndX, runLeftEndX, 700, 65);
  await playMovingThenStaticClip(clips.turnRightAtStart, runLeftEndX, finalStopX, 80, 1);

  await playClip(clips.settleIdle, 120, 1);

  currentProgress = newProgress;
  setSpriteX(finalStopX);
  setSpriteY(spriteBaseY);
  setFrame(clips.idle[0]);

  busy = false;
}

  placeAtProgress(0);

  return {
    el: widget,
    setProgress(progress) {
      placeAtProgress(progress);
    },
    celebrateTo
  };
}

    function addStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${PANEL_ID} .wwie-header {
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
        #${PANEL_ID} .wwie-header::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0px;
  bottom: 0px;
  width: 12px;
  background: #d6a21d;
  border-radius: 0 2px 2px 0;
  }

    #${PANEL_ID} .wwie-header--border {
      border-bottom:1px solid rgba(255,255,255,0.06);
    }

    #${PANEL_ID} .wwie-title {
      font-weight:700;
    }

    #${PANEL_ID} .wwie-muted {
      font-size:11px;
      color:#9aa3af;
    }

    #${PANEL_ID} .wwie-body {
      padding:12px;
      user-select:text;
    }

    #${PANEL_ID} .wwie-stats-grid {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:8px 12px;
    }

    #${PANEL_ID} .wwie-stat {
      background:#161a20;
      border:1px solid rgba(255,255,255,0.05);
      border-radius:10px;
      padding:8px 10px;
    }

    #${PANEL_ID} .wwie-stat-label {
      font-size:11px;
      color:#9aa3af;
      margin-bottom:3px;
    }

    #${PANEL_ID} .wwie-stat-value {
      font-weight:700;
      font-size:14px;
      color:#fff;
    }

    #${PANEL_ID} .wwie-button-row {
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      margin-top:12px;
    }

    #${PANEL_ID} .wwie-btn,
    #${PANEL_ID} .wwie-btn-quiet {
      appearance:none;
      -webkit-appearance:none;
      border-radius:8px;
      padding:4px 8px;
      cursor:pointer;
      font-size:11px;
      font-weight:400;
    }

    #${PANEL_ID} .wwie-btn {
      background:#11151a;
      color:#f3f4f6;
      border:1px solid rgba(255,255,255,0.08);
    }

    #${PANEL_ID} .wwie-btn:hover {
      background:#171c22;
    }

    #${PANEL_ID} .wwie-btn-quiet {
      background:#161a20;
      color:#d5d9df;
      border:1px solid rgba(255,255,255,0.06);
    }

    #${PANEL_ID} .wwie-btn-quiet:hover {
      background:#1b2027;
    }
    #${PANEL_ID} .wwie-btn-danger {
  appearance:none;
  -webkit-appearance:none;
  border-radius:8px;
  padding:4px 8px;
  cursor:pointer;
  font-size:11px;
  font-weight:400;
  background:#8b1e2d;
  color:#fff2f4;
  border:1px solid rgba(255,255,255,0.08);
}

#${PANEL_ID} .wwie-btn-danger:hover {
  background:#a32437;
}
  `;
  document.head.appendChild(style);
}

function ensurePanel() {
  let panel = document.getElementById(PANEL_ID);
  if (panel) {
    elements.panel = panel;
    if (panel.dataset.frontBound !== '1') {
      panel.addEventListener('mousedown', () => bringPanelToFront(panel), true);
      panel.dataset.frontBound = '1';
    }
    return panel;
  }

  panel = document.createElement('div');
  panel.id = PANEL_ID;

  const pos = getPanelPosition();
  panel.style.cssText = `
    position: fixed;
    top: ${pos.top != null ? `${pos.top}px` : '80px'};
    ${pos.left != null ? `left:${pos.left}px;` : 'right:18px;'}
    width: ${PANEL_WIDTH}px;
    z-index: ${Z_INDEX_BASE};
    background: #1f2329;
    color: #f3f4f6;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.28);
    font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    overflow: hidden;
    user-select: none;
  `;

  document.body.appendChild(panel);
  addStyles();
  elements.panel = panel;
  bringPanelToFront(panel);
  clampPanelToViewport(panel, true);
  if (panel.dataset.frontBound !== '1') {
    panel.addEventListener('mousedown', () => bringPanelToFront(panel), true);
    panel.dataset.frontBound = '1';
  }
  return panel;
}

  function attachDragging(panel) {
    if (panel.dataset.dragBound === '1') return;
    panel.dataset.dragBound = '1';

    panel.addEventListener('mousedown', (e) => {
      const handle = e.target.closest('.wwie-drag-handle');
      const clickable = e.target.closest('button');
      if (!handle || clickable) return;

      bringPanelToFront(panel);
      const rect = panel.getBoundingClientRect();
      state.drag = {
        startX: e.clientX,
        startY: e.clientY,
        panelLeft: rect.left,
        panelTop: rect.top
      };

      document.body.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!state.drag) return;

      const dx = e.clientX - state.drag.startX;
      const dy = e.clientY - state.drag.startY;
      const left = Math.max(8, state.drag.panelLeft + dx);
      const top = Math.max(8, state.drag.panelTop + dy);

      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      panel.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (!state.drag) return;
      const rect = panel.getBoundingClientRect();
      savePanelPosition(rect.left, rect.top);
      state.drag = null;
      document.body.style.cursor = '';
    });

    if (panel.dataset.resizeClampBound !== '1') {
      window.addEventListener('resize', () => clampPanelToViewport(panel, true));
      panel.dataset.resizeClampBound = '1';
    }
  }

function renderPanel(force = false, options = {}) {
  const panel = ensurePanel();
  attachDragging(panel);

  const data = loadData();
  const info = getStudentListInfo();
  const progressInfo = getProgressInfo(info, data);

  const avg = average(data.timings);
  const med = median(data.timings);
  const rolling = rollingAverage(data.timings);
  const estimator = rolling || med || avg;

  const remaining = info.remaining;
  const total = progressInfo.total;
  const progressRatio = progressInfo.ratio;
 

  const etaSeconds = (remaining != null && estimator != null) ? remaining * estimator : null;
  const finishAt = etaSeconds != null ? Date.now() + etaSeconds * 1000 : null;

  const contextLabel =
    info.source === 'local_group'
      ? (info.groupName || 'Local group')
      : info.source === 'canvas'
        ? 'Whole cohort'
        : 'Unknown set';

const contextMeta =
  info.source === 'local_group' && info.metadata
    ? [
        [info.metadata.day, info.metadata.time].filter(Boolean).join(' '),
        info.metadata.location
      ].filter(Boolean).join(' | ')
    : '';

  const visibleDone = progressInfo.visibleDone;

  const signature = JSON.stringify({
    minimized: data.minimized,
    count: data.timings.length,
    entries: data.entries.length,
    rolling: Math.round(rolling || 0),
    med: Math.round(med || 0),
    remaining,
    eta: Math.round(etaSeconds || 0),
    source: info.source,
    groupName: info.groupName,
    total,
    done: visibleDone
  });

  if (!force && signature === state.lastRenderedSignature) {
    updateCurrentElapsedDisplay();
    return;
  }
  state.lastRenderedSignature = signature;

  if (data.minimized) {
    panel.innerHTML = `
      <div class="wwie-drag-handle wwie-header" style="align-items:center;">
        <div class="wwie-title">When will it end?</div>
        <button id="wwie-toggle" class="${getQuietButtonCss()}">Expand</button>
      </div>
    `;
    panel.querySelector('#wwie-toggle')?.addEventListener('click', handleToggleMinimize);
    return;
  }

 panel.innerHTML = `
  <div class="wwie-drag-handle wwie-header wwie-header--border">
    <div>
      <div class="wwie-title">When will it end?</div>
    </div>
    <div style="display:flex;gap:6px;">
      <button id="wwie-toggle" class="${getQuietButtonCss()}">Minimise</button>
    </div>
  </div>

  <div class="wwie-body">
  <div class="wwie-muted" style="margin-bottom:8px;">
    ${escapeHtml(getAssignmentName())}
  </div>
  <div style="margin-top:8px;font-size:10px;color:#aeb6c2;padding:6px;">
  ${contextMeta ? `<br>${escapeHtml(contextMeta)}` : ''}
    <div class="wwie-stats-grid">
      ${stat('Completed', visibleDone)}
      ${stat('Remaining to mark', remaining ?? '—')}
      ${stat('Recent avg', formatDuration(rolling))}
      ${stat('Median', formatDuration(med))}
      ${stat('Time to complete', formatDuration(etaSeconds))}
      ${stat('ETA', formatClock(finishAt))}
    </div>

    <div id="wwie-prince-slot"></div>

    <div class="wwie-muted" style="margin-top:6px;color:#8f98a3;">
      Current student: <span id="wwie-current-elapsed">${state.currentStartTime ? formatDuration((Date.now() - state.currentStartTime) / 1000) : '—'}</span><br>
      Logged entries: ${data.entries.length}<br>
      Ignores timings under ${MIN_VALID_SECONDS}s and over ${Math.floor(MAX_VALID_SECONDS / 60)}m.
    </div>

    <div class="wwie-button-row">
      <button id="wwie-log" class="${getButtonCss()}">Log now</button>
      <button id="wwie-export-csv" class="${getButtonCss()}">Export CSV</button>
    </div>

    <div style="display:flex;justify-content:flex-end;margin-top:8px;">
      <button id="wwie-reset" class="${getDangerButtonCss()}">Reset</button>
    </div>
  </div>
`;

const princeSlot = panel.querySelector('#wwie-prince-slot');
if (princeSlot) {
  state.princeWidget = createPrinceProgressWidget();
  princeSlot.appendChild(state.princeWidget.el);
  state.princeWidget.setProgress(options.previousProgress ?? progressRatio);
  if (options.animateToProgress != null && options.animateToProgress > (options.previousProgress ?? progressRatio)) {
    state.princeWidget.celebrateTo(options.animateToProgress);
  }
  state.lastProgressRatio = options.animateToProgress ?? progressRatio;
}
  panel.querySelector('#wwie-reset')?.addEventListener('click', handleResetSession);
  panel.querySelector('#wwie-toggle')?.addEventListener('click', handleToggleMinimize);
  panel.querySelector('#wwie-log')?.addEventListener('click', handleLogNow);
  panel.querySelector('#wwie-export-csv')?.addEventListener('click', handleExportCsv);
}

  function handleToggleMinimize() {
    const data = loadData();
    data.minimized = !data.minimized;
    saveData(data);
    renderPanel(true);
  }

  function handleResetSession() {
    const data = defaultData();
    data.minimized = false;
    saveData(data);
    state.currentStudentKey = getCurrentStudentKey();
    state.currentStartTime = Date.now();
    renderPanel(true);
  }

  function createEntry(elapsedSeconds, mode = 'auto') {
    const now = Date.now();
    return {
      course_assignment: getAssignmentKey(),
      student_key: state.currentStudentKey,
      student_label: getCurrentStudentDisplayName() || state.currentStudentKey,
      started_at: formatISO(state.currentStartTime),
      logged_at: formatISO(now),
      elapsed_seconds: elapsedSeconds,
      elapsed_readable: formatDuration(elapsedSeconds),
      mode
    };
  }

  function addEntry(elapsedSeconds, mode = 'auto') {
    if (!state.currentStudentKey || !state.currentStartTime) return false;
    if (elapsedSeconds < MIN_VALID_SECONDS || elapsedSeconds > MAX_VALID_SECONDS) return false;

    const data = loadData();
    const lastLoggedKey = data.completedStudentKeys[data.completedStudentKeys.length - 1];

    if (mode === 'auto' && lastLoggedKey === state.currentStudentKey) return false;

    data.timings.push(elapsedSeconds);
    data.completedStudentKeys.push(state.currentStudentKey);
    data.entries.push(createEntry(elapsedSeconds, mode));
    saveData(data);
    return true;
  }

  function logCurrentStudentIfValid() {
    const elapsed = Math.round((Date.now() - state.currentStartTime) / 1000);
    return addEntry(elapsed, 'auto');
  }

  function handleLogNow() {
    const elapsed = Math.round((Date.now() - state.currentStartTime) / 1000);
    const previousProgress = state.lastProgressRatio;
    const ok = addEntry(elapsed, 'manual');
    if (ok) {
      state.currentStartTime = Date.now();
      const progressInfo = getProgressInfo(getStudentListInfo(), loadData());
      renderPanel(true, {
        previousProgress,
        animateToProgress: progressInfo.ratio
      });
    }
  }

  function handleExportCsv() {
    const data = loadData();
    const rows = [
      [
        'course_assignment',
        'student_key',
        'student_label',
        'started_at',
        'logged_at',
        'elapsed_seconds',
        'elapsed_readable',
        'mode'
      ],
      ...data.entries.map(entry => [
        entry.course_assignment,
        entry.student_key,
        entry.student_label,
        entry.started_at,
        entry.logged_at,
        entry.elapsed_seconds,
        entry.elapsed_readable,
        entry.mode
      ])
    ];

    const csv = rows.map(row => row.map(csvEscape).join(',')).join('\n');
    downloadFile(csv, `marking-log-${getAssignmentKey()}.csv`, 'text/csv;charset=utf-8;');
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

 function detectStudentChange() {
  const previousInfo = getStudentListInfo();
  const previousProgressInfo = getProgressInfo(previousInfo, loadData());
  const previousProgress = state.lastProgressRatio ?? previousProgressInfo.ratio;

  const newKey = getCurrentStudentKey();

  if (!state.currentStudentKey) {
    state.currentStudentKey = newKey;
    state.currentStartTime = Date.now();
    return false;
  }

  if (newKey !== state.currentStudentKey) {
    const logged = logCurrentStudentIfValid();
    state.currentStudentKey = newKey;
    state.currentStartTime = Date.now();

    const newInfo = getStudentListInfo();
    const newProgressInfo = getProgressInfo(newInfo, loadData());
    const newProgress = newProgressInfo.ratio;

    renderPanel(true, logged || newProgress > previousProgress
      ? { previousProgress, animateToProgress: newProgress }
      : {});
    return true;
  }

  return false;
}

  function startLoops() {
    if (state.navInterval) clearInterval(state.navInterval);
    if (state.tickInterval) clearInterval(state.tickInterval);

    state.navInterval = setInterval(() => {
      if (location.href !== state.lastSeenUrl) {
        state.lastSeenUrl = location.href;
        setTimeout(() => {
          const rendered = detectStudentChange();
          if (!rendered) renderPanel(true);
        }, 350);
      } else {
        detectStudentChange();
      }
    }, 800);

    state.tickInterval = setInterval(() => {
      renderPanel(false);
    }, 1000);
  }

  function init() {
    if (document.getElementById(PANEL_ID)) return;
    state.currentStudentKey = getCurrentStudentKey();
    state.currentStartTime = Date.now();
    renderPanel(true);
    startLoops();
  }

  setTimeout(init, 1800);
})();
