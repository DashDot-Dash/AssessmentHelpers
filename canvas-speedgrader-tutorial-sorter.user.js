// ==UserScript==
// @name         Assessment Helpers - Tutorial Sorter
// @namespace    AssessmentHelpers
// @version      1.3.0
// @description  Assessment Helpers panel for importing class rosters and navigating Canvas SpeedGrader by tutorial group
// @match        https://*/courses/*/gradebook/speed_grader*
// @grant        none
// @updateURL    https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-tutorial-sorter.user.js
// @downloadURL  https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/canvas-speedgrader-tutorial-sorter.user.js
// @require      https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js
// ==/UserScript==

(function () {
  'use strict';

  // Imports class lists and provides tutorial-group navigation in SpeedGrader.

  // constants/config
  const HELPER_ID = 'tutorial-sorter';
  const HELPER_NAME = 'Tutorial Sorter';
  const PANEL_ID = 'chatster-lmg-panel';
  const STYLE_ID = 'chatster-lmg-style';
  const Z_INDEX_BASE = 100000;

  const GROUPS_KEY = 'chatster_tutorial_sorter_groups_v11';
  const ACTIVE_GROUP_KEY = 'chatster_tutorial_sorter_active_group_v11';
  const PANEL_POS_KEY = 'chatster_tutorial_sorter_panel_pos_v11';
  const PANEL_UI_KEY = 'chatster_tutorial_sorter_ui_v11';
  const CONTEXT_KEY = 'chatster_tutorial_sorter_context_v11';
  const CANVAS_MENU_KEY = 'chatster_canvas_menu_cache_v1';
  const EXPORT_NAME_MODE_KEY = 'chatster_tutorial_sorter_export_name_mode_v1';

  const DEFAULT_PANEL_POS = { top: 80, right: 18 };
  const PANEL_MARGIN = 8;

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
    lastRenderSig: '',
    tick: null,
    drag: null,
    isDropActive: false,
    lastImportSummary: ''
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

  function loadStoredTutorialSorterData() {
    try {
      const raw = JSON.parse(localStorage.getItem(GROUPS_KEY));
      if (raw?.courses && typeof raw.courses === 'object') return raw;
      if (Array.isArray(raw)) return migrateLegacyGroups(raw);
    } catch {
      return { courses: {} };
    }
    return { courses: {} };
  }

  function saveStoredTutorialSorterData(data) {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(data && data.courses ? data : { courses: {} }));
    notifyDockStatusChanged();
  }

  function notifyDockStatusChanged() {
    const detail = { helperId: HELPER_ID };
    window.dispatchEvent(new CustomEvent('assessment-helper-status-changed', { detail }));
    window.dispatchEvent(new CustomEvent('viscomm-helper-status-changed', { detail }));
  }

  function migrateLegacyGroups(groups) {
    const data = { courses: {} };
    groups.forEach(group => {
      const metadata = group.metadata || {};
      const courseCode = normalizeCourseCode(metadata.courseCode || metadata.course_code || metadata.course_code_blob || '');
      const bucket = ensureCourseBucket(data, courseCode);
      const parsedHeader = normalizeClassMetadata(metadata);
      const classKey = group.classKey || buildClassKey(parsedHeader) || group.id;
      bucket.classes[classKey] = {
        ...group,
        id: classKey,
        classKey,
        label: group.label || buildClassLabel(parsedHeader) || group.name,
        name: group.name || group.label || buildClassLabel(parsedHeader),
        courseCode,
        day: parsedHeader.day || '',
        time: parsedHeader.time || '',
        location: parsedHeader.location || '',
        importedAt: group.importedAt || group.created_at || currentTimestamp(),
        rawHeader: group.rawHeader || metadata.rawHeader || '',
        modeCode: parsedHeader.modeCode || metadata.tutorial_code || '',
        metadata: {
          ...metadata,
          courseCode,
          classKey,
          label: group.label || buildClassLabel(parsedHeader) || group.name,
          modeCode: parsedHeader.modeCode || metadata.tutorial_code || ''
        }
      };
      if (!bucket.activeClassKey) bucket.activeClassKey = classKey;
    });
    return data;
  }

  function ensureCourseBucket(data, courseCode) {
    const key = normalizeCourseCode(courseCode);
    if (!data.courses) data.courses = {};
    if (!data.courses[key]) data.courses[key] = { activeClassKey: '', classes: {} };
    if (!data.courses[key].classes) data.courses[key].classes = {};
    return data.courses[key];
  }

  function getCourseClasses(courseCode = getCurrentCourseCode()) {
    const data = loadStoredTutorialSorterData();
    const bucket = data.courses?.[normalizeCourseCode(courseCode)];
    return Object.values(bucket?.classes || {}).sort((a, b) => {
      return String(a.label || a.name || '').localeCompare(String(b.label || b.name || ''));
    });
  }

  function getAllCourseClasses() {
    const data = loadStoredTutorialSorterData();
    return Object.values(data.courses || {})
      .flatMap(bucket => Object.values(bucket?.classes || {}))
      .sort((a, b) => String(a.label || a.name || '').localeCompare(String(b.label || b.name || '')));
  }

  function loadGroups(courseCode = getCurrentCourseCode()) {
    const groups = getCourseClasses(courseCode);
    return groups.length ? groups : getAllCourseClasses();
  }

  function saveGroups(groups, courseCode = getCurrentCourseCode()) {
    const data = loadStoredTutorialSorterData();
    const bucket = ensureCourseBucket(data, courseCode);
    bucket.classes = {};
    groups.forEach(group => {
      const classKey = group.classKey || group.id;
      bucket.classes[classKey] = { ...group, id: classKey, classKey };
    });
    saveStoredTutorialSorterData(data);
  }

  function getActiveGroupId(courseCode = getCurrentCourseCode()) {
    const data = loadStoredTutorialSorterData();
    const bucket = data.courses?.[normalizeCourseCode(courseCode)];
    return bucket?.activeClassKey || localStorage.getItem(ACTIVE_GROUP_KEY) || '';
  }

  function updateActiveGroupId(id, courseCode = getCurrentCourseCode()) {
    const data = loadStoredTutorialSorterData();
    const bucket = ensureCourseBucket(data, courseCode);
    bucket.activeClassKey = id || '';
    saveStoredTutorialSorterData(data);
    if (id) localStorage.setItem(ACTIVE_GROUP_KEY, id);
    else localStorage.removeItem(ACTIVE_GROUP_KEY);
  }

  function clearSavedData() {
    localStorage.removeItem(GROUPS_KEY);
    localStorage.removeItem(ACTIVE_GROUP_KEY);
    localStorage.removeItem(PANEL_POS_KEY);
    localStorage.removeItem(PANEL_UI_KEY);
    localStorage.removeItem(CONTEXT_KEY);
    notifyDockStatusChanged();
  }

  function getPanelPosition() {
    try {
      const pos = JSON.parse(localStorage.getItem(PANEL_POS_KEY));
      if (pos && Number.isFinite(pos.left) && Number.isFinite(pos.top)) return pos;
    } catch {}
    return { ...DEFAULT_PANEL_POS };
  }

  function savePanelPosition(left, top) {
    localStorage.setItem(PANEL_POS_KEY, JSON.stringify({ left, top }));
  }

  function loadPanelUi() {
    try {
      return JSON.parse(localStorage.getItem(PANEL_UI_KEY)) || { minimized: false };
    } catch {
      return { minimized: false };
    }
  }

  function savePanelUi(ui) {
    localStorage.setItem(PANEL_UI_KEY, JSON.stringify(ui));
  }

  function getMinimized() {
    return !!loadPanelUi().minimized;
  }

  function updateMinimized(minimized) {
    const ui = loadPanelUi();
    ui.minimized = !!minimized;
    savePanelUi(ui);
  }

  function getCourseKey() {
    const m = location.pathname.match(/\/courses\/(\d+)\//);
    return m ? m[1] : 'unknown_course';
  }

  function getCanvasMenuStorageKey() {
    return `${CANVAS_MENU_KEY}:${getCourseKey()}`;
  }

  function loadCanvasMenuCache() {
    try {
      return JSON.parse(localStorage.getItem(getCanvasMenuStorageKey())) || {};
    } catch {
      return {};
    }
  }

  function saveCanvasMenuCache(map) {
    localStorage.setItem(getCanvasMenuStorageKey(), JSON.stringify(map));
  }

  function clearCanvasMenuCache() {
    localStorage.removeItem(getCanvasMenuStorageKey());
  }

  function getExportNameMode() {
    return localStorage.getItem(EXPORT_NAME_MODE_KEY) || 'class_label';
  }

  function saveExportNameMode(mode) {
    localStorage.setItem(EXPORT_NAME_MODE_KEY, mode || 'class_label');
  }

function stat(label, value) {
  return `
    <div class="chatster-ui-stat">
      <div class="chatster-ui-muted" style="margin-bottom:3px;">${escapeHtml(label)}</div>
      <div class="chatster-ui-stat-value">${escapeHtml(String(value))}</div>
    </div>
  `;
}

function fieldLabel(text) {
  return `<label class="chatster-ui-field-label">${escapeHtml(text)}</label>`;
}

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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

  function toCanvasName(displayName) {
    const name = String(displayName || '').trim();
    if (!name) return '';

    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length < 2) return name;

    const last = parts[parts.length - 1];
    const firsts = parts.slice(0, -1).join(' ');
    return `${last}, ${firsts}`;
  }

  function normalizeStudentId(value) {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return '';
    return raw.replace(/^c/, '').replace(/\s+/g, '');
  }

  function canonicalStudentId(value) {
    const core = normalizeStudentId(value);
    return core ? `c${core}` : '';
  }

  function currentTimestamp() {
    return new Date().toISOString();
  }

  function uniqueBy(arr, keyFn) {
    const seen = new Set();
    return arr.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function stopFileDragDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function clampPanelToViewport(panel) {
    const rect = panel.getBoundingClientRect();
    const maxLeft = Math.max(PANEL_MARGIN, window.innerWidth - rect.width - PANEL_MARGIN);
    const maxTop = Math.max(PANEL_MARGIN, window.innerHeight - rect.height - PANEL_MARGIN);

    const left = clamp(rect.left, PANEL_MARGIN, maxLeft);
    const top = clamp(rect.top, PANEL_MARGIN, maxTop);

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.right = 'auto';

    savePanelPosition(left, top);
  }

  function csvEscape(value) {
    const s = String(value ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function downloadTextFile(filename, text, mime = 'text/plain;charset=utf-8') {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function parseDelimited(text, delimiter = ',') {
    const rows = [];
    let row = [];
    let cell = '';
    let i = 0;
    let inQuotes = false;

    while (i < text.length) {
      const ch = text[i];
      const next = text[i + 1];

      if (ch === '"') {
        if (inQuotes && next === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = !inQuotes;
        i++;
        continue;
      }

      if (ch === delimiter && !inQuotes) {
        row.push(cell);
        cell = '';
        i++;
        continue;
      }

      if ((ch === '\n' || ch === '\r') && !inQuotes) {
        if (ch === '\r' && next === '\n') i++;
        row.push(cell);
        if (row.some(v => String(v).trim() !== '')) rows.push(row);
        row = [];
        cell = '';
        i++;
        continue;
      }

      cell += ch;
      i++;
    }

    row.push(cell);
    if (row.some(v => String(v).trim() !== '')) rows.push(row);

    if (!rows.length) return { headers: [], records: [] };

    const headers = rows[0].map(h => String(h).trim());
    const records = rows.slice(1).map(r => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = String(r[idx] ?? '').trim();
      });
      return obj;
    });

    return { headers, records };
  }

  function findHeaderRow(lines) {
    return lines.findIndex(line => {
      const lower = line.toLowerCase().trim();
      return (
        lower.includes('student_code') ||
        lower.includes('student code') ||
        lower.includes('student_number') ||
        lower.includes('student number') ||
        lower.includes('user_id') ||
        lower.includes('user id') ||
        lower.includes('last_name') ||
        lower.includes('last name') ||
        lower.includes('preferred_name') ||
        lower.includes('preferred name')
      );
    });
  }

  function parseTimetablingText(text) {
    const lines = String(text || '')
      .replace(/\uFEFF/g, '')
      .split(/\r?\n/);

    const headerIndex = findHeaderRow(lines);
    if (headerIndex < 0) return { headers: [], records: [] };

    const dataLines = lines
      .slice(headerIndex)
      .map(line => line.trim())
      .filter(line => line !== '');

    if (!dataLines.length) return { headers: [], records: [] };

    const headerLine = dataLines[0];
    let delimiter = '\t';
    if (headerLine.includes(',') && !headerLine.includes('\t')) delimiter = ',';

    const parsed = parseDelimited(dataLines.join('\n'), delimiter);

    const normalizedHeaders = parsed.headers.map(h =>
      String(h).trim().toLowerCase().replace(/\s+/g, '_')
    );

    const records = parsed.records.map(row => {
      const normalizedRow = {};
      parsed.headers.forEach((originalHeader, idx) => {
        const key = normalizedHeaders[idx];
        normalizedRow[key] = String(row[originalHeader] ?? '').trim();
      });
      return normalizedRow;
    });

    return { headers: normalizedHeaders, records };
  }

  function splitFlexibleLine(line) {
    const trimmed = String(line || '').trim();
    if (!trimmed) return [];

    if (trimmed.includes('\t')) {
      return trimmed.split('\t').map(s => s.trim()).filter(Boolean);
    }

    const parsed = parseDelimited(trimmed, ',');
    if (parsed.headers.length) {
      return parsed.headers.map(s => String(s).trim()).filter(Boolean);
    }

    return [trimmed];
  }

  function parseTimetableMetadata(text) {
    const lines = String(text || '')
      .replace(/\uFEFF/g, '')
      .split(/\r?\n/)
      .map(line => line.trimEnd());

    const meta = {
      course_code_blob: '',
      course_name: '',
      tutorial_code: '',
      courseCode: '',
      courseTitle: '',
      modeCode: '',
      day: '',
      time: '',
      duration: '',
      durationMinutes: '',
      location: '',
      staff: '',
      term: '',
      year: '',
      campus: '',
      delivery: '',
      rawHeader: '',
      suggested_name: ''
    };

    const nonEmpty = lines.filter(line => line.trim());
    meta.rawHeader = nonEmpty.slice(0, Math.max(0, findHeaderRow(lines))).join('\n');

    if (nonEmpty[0]) {
      const parts = splitFlexibleLine(nonEmpty[0]);
      meta.course_code_blob = parts[0] || '';
      meta.course_name = parts[1] || '';
      meta.courseTitle = meta.course_name;

      const courseMatch = nonEmpty[0].match(/\b([A-Z]{4}\d{4})\b/);
      if (courseMatch) meta.courseCode = courseMatch[1];

      const blobParts = String(meta.course_code_blob || '').split('_').filter(Boolean);
      meta.term = blobParts.find(p => /^SEM\d+$/i.test(p)) || '';
      meta.year = blobParts.find(p => /^\d{4}$/.test(p)) || '';
      meta.delivery = blobParts[blobParts.length - 1] || '';
      meta.campus = blobParts.slice(3, -1).filter(p => p !== '-').join('_');
    }

    if (nonEmpty[1]) {
      const parts = splitFlexibleLine(nonEmpty[1]);
      meta.tutorial_code = parts[0] || '';
      meta.modeCode = meta.tutorial_code;

      const schedule = parts[1] || '';
      const schedParts = schedule.split(',').map(s => s.trim());
      meta.day = schedParts[0] || '';
      meta.time = schedParts[1] || '';
      meta.duration = schedParts[2] || '';
      const durationMatch = meta.duration.match(/(\d+)/);
      meta.durationMinutes = durationMatch ? durationMatch[1] : '';
    }

    lines.forEach(line => {
      const trimmed = line.trim();

      const courseMatch = trimmed.match(/\b([A-Z]{4}\d{4})\b/);
      if (courseMatch && !meta.courseCode) meta.courseCode = courseMatch[1];

      const classMatch = trimmed.match(/^([A-Z]{3}\d{2}-\d{2})\s+([A-Za-z]{3}),\s*([0-9]{1,2}:[0-9]{2}),\s*(\d+)\s*minutes/i);
      if (classMatch) {
        meta.tutorial_code = meta.tutorial_code || classMatch[1];
        meta.modeCode = meta.modeCode || classMatch[1];
        meta.day = meta.day || classMatch[2];
        meta.time = meta.time || classMatch[3];
        meta.durationMinutes = meta.durationMinutes || classMatch[4];
        meta.duration = meta.duration || `${classMatch[4]} minutes`;
      }

      const locMatch = trimmed.match(/^Location:\s*(.+)$/i);
      if (locMatch) meta.location = locMatch[1].trim();

      const staffMatch = trimmed.match(/^Staff:\s*(.+)$/i);
      if (staffMatch) meta.staff = staffMatch[1].trim();
    });

    meta.courseCode = normalizeCourseCode(meta.courseCode || meta.course_code_blob);

    meta.suggested_name = buildClassLabel(meta) || meta.tutorial_code || meta.course_name || 'Imported group';
    return meta;
  }

  function normalizeClassMetadata(metadata = {}) {
    const courseCode = normalizeCourseCode(metadata.courseCode || metadata.course_code || metadata.course_code_blob || '');
    return {
      ...metadata,
      courseCode,
      day: metadata.day || '',
      time: metadata.time || '',
      location: metadata.location || '',
      modeCode: metadata.modeCode || metadata.tutorial_code || '',
      rawHeader: metadata.rawHeader || ''
    };
  }

  function buildClassKey(parsedHeader = {}) {
    const courseCode = normalizeCourseCode(parsedHeader.courseCode || parsedHeader.course_code_blob || '');
    const day = String(parsedHeader.day || 'unknown_day').trim().replace(/\s+/g, '_');
    const time = String(parsedHeader.time || 'unknown_time').trim().replace(/\s+/g, '');
    const location = String(parsedHeader.location || 'unknown_location').trim().replace(/\s+/g, '_');
    return `${courseCode}__${day}__${time}__${location}`;
  }

  function buildClassLabel(parsedHeader = {}) {
    const courseCode = normalizeCourseCode(parsedHeader.courseCode || parsedHeader.course_code_blob || '');
    const dayTime = [parsedHeader.day, parsedHeader.time].filter(Boolean).join(' ');
    const location = parsedHeader.location || 'Unknown location';
    return `${courseCode} · ${dayTime || 'Unknown time'} · ${location}`;
  }

  function buildStudentsFromTimetabling(records, metadata = {}) {
    return uniqueBy(
      records
        .map((row, idx) => {
          const studentNumber =
            row.student_code ||
            row.student_number ||
            row.user_id ||
            row.userid ||
            '';

          const lastName = row.last_name || '';
          const preferredName =
            row.preferred_name ||
            row.first_name ||
            row.firstname ||
            '';

          const fullName = `${preferredName} ${lastName}`.trim();
          const userId = canonicalStudentId(
            row.user_id ||
            row.userid ||
            row.student_code ||
            row.student_number ||
            ''
          );

          return {
            index: idx,
            name: fullName,
            canvas_name: toCanvasName(fullName),
            student_number: canonicalStudentId(studentNumber),
            login_id: canonicalStudentId(studentNumber),
            user_id: userId,
            email: '',
            tutorial: metadata.tutorial_code || '',
            day: metadata.day || '',
            time: metadata.time || '',
            staff: metadata.staff || '',
            location: metadata.location || '',
            raw: row
          };
        })
        .filter(s => s.name || s.student_number || s.user_id),
      s => `${s.user_id || s.student_number}|${normalizeName(s.name)}`
    );
  }

  function makeGroup(name, students, sourceFile, metadata = {}) {
    const classMetadata = normalizeClassMetadata(metadata);
    const classKey = buildClassKey(classMetadata);
    const label = buildClassLabel(classMetadata);

    return {
      id: classKey,
      classKey,
      label,
      name: label || name,
      courseCode: classMetadata.courseCode,
      day: classMetadata.day || '',
      time: classMetadata.time || '',
      location: classMetadata.location || '',
      importedAt: currentTimestamp(),
      rawHeader: classMetadata.rawHeader || '',
      modeCode: classMetadata.modeCode || '',
      source_file: sourceFile || '',
      created_at: currentTimestamp(),
      course_key: getCourseKey(),
      metadata: {
        ...metadata,
        courseCode: classMetadata.courseCode,
        classKey,
        label,
        course_code_blob: metadata.course_code_blob || '',
        course_name: metadata.course_name || '',
        tutorial_code: metadata.tutorial_code || classMetadata.modeCode || '',
        modeCode: classMetadata.modeCode || '',
        day: classMetadata.day || '',
        time: classMetadata.time || '',
        duration: metadata.duration || '',
        durationMinutes: metadata.durationMinutes || '',
        location: classMetadata.location || '',
        staff: metadata.staff || '',
        sheet_name: metadata.sheet_name || '',
        rawHeader: classMetadata.rawHeader || ''
      },
      students
    };
  }

  function importAnyText(text, sourceName = 'Imported class list', overrideSheetName = '') {
    const cleaned = String(text || '').trim();
    if (!cleaned) return null;

    const metadata = parseTimetableMetadata(cleaned);
    if (overrideSheetName && !metadata.suggested_name) metadata.suggested_name = overrideSheetName;
    if (overrideSheetName) metadata.sheet_name = overrideSheetName;

    const parsed = parseTimetablingText(cleaned);
    let students = [];

    if (parsed.headers.length && parsed.records.length) {
      students = buildStudentsFromTimetabling(parsed.records, metadata);
    }

    if (!students.length) return null;

    const suggestedName =
      metadata.suggested_name ||
      overrideSheetName ||
      sourceName.replace(/\.[^.]+$/, '') ||
      'Imported group';

    return { suggestedName, metadata, students };
  }

  function sheetToText(worksheet) {
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      blankrows: false,
      raw: false,
      defval: ''
    });

    return rows
      .map(row => row.map(cell => String(cell ?? '')).join('\t'))
      .join('\n');
  }

  async function importWorkbookFile(file) {
    if (typeof XLSX === 'undefined') {
      throw new Error('SheetJS/XLSX library did not load.');
    }

    const ab = await file.arrayBuffer();
    const workbook = XLSX.read(ab, { type: 'array' });

    const data = loadStoredTutorialSorterData();
    const imported = [];

    workbook.SheetNames.forEach(sheetName => {
      const ws = workbook.Sheets[sheetName];
      if (!ws) return;

      const text = sheetToText(ws);
      const parsed = importAnyText(text, file.name, sheetName);

      if (!parsed || !parsed.students.length) return;

      const group = makeGroup(
        parsed.suggestedName || sheetName,
        parsed.students,
        file.name,
        { ...parsed.metadata, sheet_name: sheetName }
      );

      const bucket = ensureCourseBucket(data, group.courseCode);
      bucket.classes[group.classKey] = group;
      bucket.activeClassKey = group.classKey;
      imported.push(group);
    });

    if (!imported.length) {
      alert('No valid class tabs were found in that workbook.');
      return;
    }

    saveStoredTutorialSorterData(data);
    const currentCourseCode = getCurrentCourseCode();
    const activeImport = imported.find(group => group.courseCode === currentCourseCode) || imported[0];
    updateActiveGroupId(activeImport.id, activeImport.courseCode);

    state.lastImportSummary = `Imported ${imported.length} group${imported.length === 1 ? '' : 's'} from ${file.name}`;
    renderPanel(true);
  }

  async function importDroppedOrPickedClassFile(file) {
    if (!file) return;

    const lower = file.name.toLowerCase();

    if (lower.endsWith('.xlsx') || lower.endsWith('.xlsm') || lower.endsWith('.xls')) {
      await importWorkbookFile(file);
      return;
    }

    const text = await file.text();
    const parsed = importAnyText(text, file.name);

    if (!parsed) {
      alert('Could not find any student rows in that file.');
      return;
    }

    const group = makeGroup(parsed.suggestedName, parsed.students, file.name, parsed.metadata);
    const data = loadStoredTutorialSorterData();
    const bucket = ensureCourseBucket(data, group.courseCode);
    bucket.classes[group.classKey] = group;
    bucket.activeClassKey = group.classKey;
    saveStoredTutorialSorterData(data);
    updateActiveGroupId(group.id, group.courseCode);

    state.lastImportSummary = `Imported 1 group from ${file.name}`;
    renderPanel(true);
  }

  function getGroupExportName(group, mode = 'class_label') {
    const metadata = group.metadata || {};
    const courseCode = group.courseCode || metadata.courseCode || '';
    const day = group.day || metadata.day || '';
    const time = group.time || metadata.time || '';
    const location = group.location || metadata.location || '';
    const staff = metadata.staff || '';
    const dayTime = [day, time].filter(Boolean).join(' ');
    const separator = ' - ';

    const partsByMode = {
      class_label: [courseCode, dayTime, location],
      day_time: [dayTime],
      room: [location],
      staff: [staff],
      day_time_room: [dayTime, location],
      day_time_staff: [dayTime, staff],
      room_staff: [location, staff]
    };

    return (partsByMode[mode] || partsByMode.class_label)
      .filter(Boolean)
      .join(separator) || String(group.label || group.name || 'Imported class').replace(/\s*·\s*/g, separator);
  }

  function buildAllCanvasGroupsCsv(groups, nameMode = 'class_label') {
    const rows = [['user_id', 'group_name']];

    groups.forEach(group => {
      const groupName = getGroupExportName(group, nameMode);
      group.students.forEach(student => {
        const userId = canonicalStudentId(student.user_id || student.student_number || student.login_id || '');
        if (!userId) return;
        rows.push([userId, groupName]);
      });
    });

    return rows.map(row => row.map(csvEscape).join(',')).join('\n');
  }

  function exportAllGroupsCsv() {
    const groups = loadGroups();
    if (!groups.length) {
      alert('No groups loaded.');
      return;
    }

    const csv = buildAllCanvasGroupsCsv(groups, getExportNameMode());
    const filename = `canvas_group_list_course_${getCourseKey()}.csv`;
    downloadTextFile(filename, csv, 'text/csv;charset=utf-8');
  }

  function cleanText(s) {
    return (s || '').replace(/\s+/g, ' ').trim();
  }

  function getCurrentStudentDisplayName() {
    const selectedStudentEl = getElement(selectors.selectedStudent);
    const selectedStudentText = cleanText(selectedStudentEl?.textContent || '');
    if (selectedStudentText) return selectedStudentText;

    const triggerEl = getElement(selectors.studentSelectTrigger);
    const triggerText = cleanText(triggerEl?.textContent || '');
    if (triggerText) {
      const cleanedTrigger = triggerText.replace(/^●\s*/, '').trim();
      if (cleanedTrigger) return cleanedTrigger;
    }

    return '';
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

      // Avoid accidentally treating the trigger/button itself as a student.
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
  if (!trigger) {
    console.warn('Tutorial Sorter: student dropdown trigger not found');
    return false;
  }

  trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  trigger.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
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

  function harvestMenuCache() {
    const cache = loadCanvasMenuCache();
    const items = getStudentMenuItems();

    items.forEach(item => {
      if (!item.normalized_name) return;
      cache[item.normalized_name] = {
        name: item.name,
        anonymous_id: item.anonymous_id,
        updated_at: currentTimestamp()
      };
    });

    saveCanvasMenuCache(cache);
  }

  function clickStudentInOpenMenu(targetStudent) {
    const targetNames = [
      targetStudent?.name || '',
      targetStudent?.canvas_name || ''
    ].map(normalizeName).filter(Boolean);

    const targetCanvasName = normalizeName(targetStudent?.canvas_name || '');
    const targetPlainName = normalizeName(targetStudent?.name || '');

    const items = getStudentMenuItems();

    let match = items.find(item => targetNames.includes(item.normalized_name));

    if (!match) {
      match = items.find(item => {
        const n = item.normalized_name;
        return (
          (targetCanvasName && (n.includes(targetCanvasName) || targetCanvasName.includes(n))) ||
          (targetPlainName && (n.includes(targetPlainName) || targetPlainName.includes(n)))
        );
      });
    }

    if (!match) {
      console.warn('Tutorial Sorter: no matching student found in open menu', {
        targetStudent,
        available: items.map(i => ({ name: i.name, anonymous_id: i.anonymous_id }))
      });
      return false;
    }

    match.el.click();
    return true;
  }

  async function openAndSelectStudentFromMenu(targetStudent) {
    if (!openStudentDrilldown()) return false;

    const items = await waitForStudentMenu();
    if (!items.length) {
      console.warn('Tutorial Sorter: student menu never appeared');
      return false;
    }

    harvestMenuCache();

    const clicked = clickStudentInOpenMenu(targetStudent);
    if (clicked) return true;

    closeStudentDrilldown();
    return false;
  }

  async function goToStudentByGroupMatch(match) {
    if (!match?.student) return false;

    const student = match.student;

    const currentName = normalizeName(getCurrentStudentDisplayName());
    const targetNames = [
      normalizeName(student.name || ''),
      normalizeName(student.canvas_name || '')
    ].filter(Boolean);

    if (currentName && targetNames.includes(currentName)) {
      return true;
    }

    const clicked = await openAndSelectStudentFromMenu(student);
    if (!clicked) {
      console.warn('Tutorial Sorter: skipping student not found in Canvas menu', {
        name: student.name,
        canvas_name: student.canvas_name
      });
      return false;
    }

    return true;
  }

  async function goToGroupStudentAtIndex(activeGroup, index, direction = 1) {
    if (!activeGroup) return false;
    if (!Number.isInteger(index)) return false;
    if (!activeGroup.students.length) return false;

    const step = direction < 0 ? -1 : 1;
    const startIndex = Math.min(activeGroup.students.length - 1, Math.max(0, index));

    for (
      let candidateIndex = startIndex;
      candidateIndex >= 0 && candidateIndex < activeGroup.students.length;
      candidateIndex += step
    ) {
      const student = activeGroup.students[candidateIndex];
      if (!student) continue;

      const found = await goToStudentByGroupMatch({ student });
      if (found) return true;
    }

    console.warn('Tutorial Sorter: no available Canvas students found in navigation direction', {
      group: activeGroup.label || activeGroup.name,
      startIndex,
      direction: step
    });
    return false;
  }

  function getActiveGroupNavigationContext() {
    const currentCourseCode = getCurrentCourseCode();
    const groups = loadGroups(currentCourseCode);
    const activeGroupId = getActiveGroupId(currentCourseCode);
    const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0] || null;
    const matchInfo = matchGroupToCurrentCanvas(activeGroup);
    const currentStudentName = getCurrentStudentDisplayName();
    const normalizedCurrent = normalizeName(currentStudentName);
    const currentIndexInGroup = activeGroup && currentStudentName
      ? matchInfo.matches.findIndex(m => (
        normalizeName(m.student.name) === normalizedCurrent ||
        normalizeName(m.student.canvas_name || '') === normalizedCurrent
      ))
      : -1;

    return { activeGroup, currentIndexInGroup };
  }

  function getTutorialSorterDockStatus() {
    const { activeGroup } = getActiveGroupNavigationContext();
    return {
      configured: !!activeGroup?.students?.length,
      label: activeGroup?.label || activeGroup?.name || ''
    };
  }

  async function goToRelativeGroupStudent(delta) {
    const { activeGroup, currentIndexInGroup } = getActiveGroupNavigationContext();
    if (!activeGroup || !activeGroup.students.length) return false;
    const direction = delta < 0 ? -1 : 1;

    if (currentIndexInGroup < 0) {
      return await goToGroupStudentAtIndex(activeGroup, 0, 1);
    }

    const nextIndex = Math.min(
      activeGroup.students.length - 1,
      Math.max(0, currentIndexInGroup + delta)
    );
    return await goToGroupStudentAtIndex(activeGroup, nextIndex, direction);
  }

  function matchGroupToCurrentCanvas(group) {
    if (!group) return { matches: [], unmatched: [] };

    const currentStudentName = getCurrentStudentDisplayName();

    const matches = group.students.map(student => ({
      student,
      roster: {
        value: student.canvas_name || student.name,
        text: student.canvas_name || student.name
      },
      score: 100
    }));

    return {
      matches,
      unmatched: [],
      currentStudentName
    };
  }

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* AH-TOKENS v2 — NOT the recorded suite baseline in design/tokens/tokens.json (still v1).
       This block adopts design/proposals/0002 §A (yellow accent) and §B (cool grey ramp),
       matching the same v2 values already shipped in canvas-speedgrader-benchmarker.user.js
       @ 1.2.0, canvas-assessment-helper-dock.user.js @ 1.1.0,
       canvas-speedgrader-gradebridge.user.js @ 1.1.0, canvas-speedgrader-copy-paster.user.js
       @ 1.2.0, and canvas-speedgrader-eta.user.js @ 1.2.0. Intentionally diverges from
       dock.tokens.css until the rest of the suite catches up — see
       design/tokens/README.md on scripts coexisting on different token versions.
       Scope: this script's own root element id, not the .chatster-ui-panel class alone —
       never declare on :root, that leaks into Canvas and collides with the other scripts. */
    #${PANEL_ID} {
      --ah-shell: #1d272d;
      --ah-header: #37424A;
      --ah-control-hover: #49555E;
      --ah-control-active: #49555E;
      --ah-surface: rgba(255,255,255,0.06);
      --ah-border: rgba(255,255,255,0.08);
      --ah-border-soft: rgba(255,255,255,0.06);
      --ah-border-card: rgba(255,255,255,0.12);
      --ah-toggle: rgba(255,255,255,0.05);
      --ah-toggle-hover: rgba(255,255,255,0.14);
      --ah-text: #E7ECEF;
      --ah-muted: #949DA5;
      --ah-accent: #F5C518;
      --ah-accent-hover: #FFD53E;
      --ah-accent-ink: #0F1416;
      --ah-radius-lg: 14px;
      --ah-radius-md: 10px;
      --ah-radius-sm: 9px;
      --ah-radius-xs: 8px;
      --ah-space-1: 4px;
      --ah-space-2: 6px;
      --ah-space-3: 8px;
      --ah-space-4: 12px;
      --ah-font: 13px/1.35 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --ah-shadow: 0 10px 30px rgba(0,0,0,0.30);
      --ah-disabled-opacity: 0.42;
      --ah-stripe-width: 12px;
      --ah-z: ${Z_INDEX_BASE};
    }
    /* /AH-TOKENS */

    .chatster-ui-panel {
      width: 340px;
      z-index: ${Z_INDEX_BASE};
      background: var(--ah-shell);
      color: var(--ah-text);
      border: 1px solid var(--ah-border);
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.28);
      font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      overflow: hidden;
    }

    .chatster-ui-panel.chatster-ui-dragging {
      opacity: 0.9;
      user-select: none;
    }

    .chatster-ui-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      cursor: grab;
      background: var(--ah-header);
      border-bottom: 1px solid var(--ah-border-soft);
        position: relative;
  padding-left: 25px;
    }

    .chatster-ui-header::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0px;
  bottom: 0px;
  width: 12px;
  background: var(--ah-accent);
  border-radius: 0 2px 2px 0;
  }

    .chatster-ui-header--border {
      border-bottom: 1px solid var(--ah-border-soft);
    }

    .chatster-ui-title {
      font-size: 13px;
      font-weight: 400;
    }

    .chatster-ui-body {
      padding: 12px;
    }

    .chatster-ui-details {
      background: var(--ah-header);
      border: 1px solid var(--ah-toggle);
      border-radius: 10px;
      padding: 8px 10px;
    }

    .chatster-ui-details summary {
      cursor: pointer;
      color: var(--ah-muted);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .chatster-ui-details[open] summary {
      margin-bottom: 10px;
    }

    .chatster-ui-btn,
    .chatster-ui-btn-quiet,
    .chatster-ui-btn-danger {
      border-radius: 8px;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 12px;
      appearance: none;
      -webkit-appearance: none;
    }

    .chatster-ui-btn {
      background: var(--ah-header);
      color: var(--ah-text);
      border: 1px solid var(--ah-border);
    }

    .chatster-ui-btn:hover {
      background: var(--ah-control-hover);
    }

    .chatster-ui-icon-btn {
      min-width: 38px;
      min-height: 32px;
      display: inline-grid;
      place-items: center;
    }

    .chatster-ui-icon-btn svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .chatster-ui-btn-quiet {
      background: var(--ah-header);
      color: var(--ah-muted);
      border: 1px solid var(--ah-border-soft);
    }

    .chatster-ui-btn-quiet:hover {
      background: var(--ah-control-hover);
    }

    .chatster-ui-panel-toggle {
      width: 28px;
      height: 26px;
      padding: 0;
      display: grid;
      place-items: center;
      background: var(--ah-shell);
      color: var(--ah-text);
      border: 1px solid var(--ah-border);
    }

    .chatster-ui-panel-toggle:hover {
      background: var(--ah-control-hover);
    }

    .chatster-ui-panel-toggle svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .chatster-ui-btn-danger {
      background: #8b1e2d;
      color: #fff2f4;
      border: 1px solid var(--ah-border);
    }

    .chatster-ui-btn-danger:hover {
      background: #a32437;
    }

    .chatster-ui-muted {
      font-size: 11px;
      color: var(--ah-muted);
    }

    .chatster-ui-field-label {
      display: block;
      font-size: 11px;
      color: var(--ah-muted);
      margin-bottom: 4px;
    }

    .chatster-ui-select,
    .chatster-ui-input {
      width: 100%;
      background: var(--ah-shell);
      color: var(--ah-text);
      border: 1px solid var(--ah-border);
      border-radius: 8px;
      padding: 8px;
      box-sizing: border-box;
    }

    .chatster-ui-card {
      background: var(--ah-header);
      border: 1px solid var(--ah-toggle);
      border-radius: 10px;
      padding: 10px;
    }

    .chatster-ui-stat {
      background: var(--ah-header);
      border: 1px solid var(--ah-toggle);
      border-radius: 10px;
      padding: 8px 10px;
    }

    .chatster-ui-stat-value {
      font-weight: 700;
      font-size: 14px;
      color: #fff;
    }

    .chatster-ui-dropzone {
      margin-bottom: 10px;
      padding: 12px;
      border-radius: 10px;
      text-align: center;
      transition: all 120ms ease;
    }

    .chatster-ui-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .chatster-ui-row {
      display: flex;
      gap: 8px;
    }

    .chatster-ui-row--left {
      justify-content: flex-start;
    }

    .chatster-ui-row--right {
      justify-content: flex-end;
    }

    .chatster-ui-row--center {
  justify-content: center;
}

    .chatster-ui-nav-block {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      padding: 8px;
      border-radius: 10px;
      background: var(--ah-shell);
      border: 1px solid var(--ah-border-soft);
      margin-bottom: 10px;
    }

    .chatster-ui-nav-block .chatster-ui-btn {
      min-height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-weight: 650;
      background: var(--ah-accent);
      color: var(--ah-accent-ink);
      border-color: var(--ah-accent);
    }

    .chatster-ui-nav-block .chatster-ui-btn:hover {
      background: var(--ah-accent-hover);
      color: var(--ah-accent-ink);
    }

    .chatster-ui-nav-block svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .chatster-ui-stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 12px;
      margin-bottom: 12px;
    }

    .chatster-ui-summary {
      margin-bottom: 10px;
    }

    .chatster-ui-section {
      margin-bottom: 10px;
    }

    .chatster-ui-section-lg {
      margin-bottom: 12px;
    }

    .chatster-ui-student-list {
      margin-top: 8px;
      padding: 6px;
      max-height: 220px;
      overflow: auto;
      font-size: 12px;
      color: var(--ah-muted);
      background: var(--ah-shell);
      border: 1px solid var(--ah-toggle);
      border-radius: 10px;
    }

    .chatster-ui-student-item {
      display: block;
      width: 100%;
      text-align: left;
      padding: 7px 8px;
      margin: 0 0 4px 0;
      border: 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      cursor: pointer;
      border-radius: 6px;
      background: transparent;
      color: var(--ah-muted);
      font-weight: 400;
    }

    .chatster-ui-student-item.is-current {
      background: var(--ah-border);
      color: #fff;
      font-weight: 700;
    }

    .chatster-ui-student-sub {
      font-size: 11px;
      color: var(--ah-muted);
      margin-top: 2px;
    }

    .chatster-lmg-student-jump:hover {
      background: var(--ah-border-soft) !important;
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

  const pos = getPanelPosition();

  panel.id = PANEL_ID;
  panel.className = 'chatster-ui-panel';
  panel.style.position = 'fixed';
  panel.style.top = pos.top != null ? `${pos.top}px` : '80px';

  if (pos.left != null) {
    panel.style.left = `${pos.left}px`;
    panel.style.right = 'auto';
  } else {
    panel.style.right = '18px';
    panel.style.left = '';
  }

  document.body.appendChild(panel);
  addStyles();
  bindDragging(panel);
  bindDropHandlers(panel);
  elements.panel = panel;
  bringPanelToFront(panel);
  clampPanelToViewport(panel);
  if (panel.dataset.frontBound !== '1') {
    panel.addEventListener('mousedown', () => bringPanelToFront(panel), true);
    panel.dataset.frontBound = '1';
  }
  return panel;
}

  function bindDragging(panel) {
    if (panel.dataset.dragBound === '1') return;
    panel.dataset.dragBound = '1';

    panel.addEventListener('mousedown', (e) => {
      const handle = e.target.closest('.chatster-lmg-drag');
const clickable = e.target.closest('button, select, input, option, label, summary, details, textarea, a');

if (!handle || !panel.contains(handle) || clickable) return;

      bringPanelToFront(panel);
      const rect = panel.getBoundingClientRect();
      state.drag = {
        startX: e.clientX,
        startY: e.clientY,
        panelLeft: rect.left,
        panelTop: rect.top
      };

      panel.classList.add('chatster-ui-dragging');
      document.body.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!state.drag) return;

      const dx = e.clientX - state.drag.startX;
      const dy = e.clientY - state.drag.startY;
      const left = state.drag.panelLeft + dx;
      const top = state.drag.panelTop + dy;

      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      panel.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (!state.drag) return;
      state.drag = null;
      panel.classList.remove('chatster-ui-dragging');
      document.body.style.cursor = '';
      clampPanelToViewport(panel);
    });

    window.addEventListener('resize', () => {
      clampPanelToViewport(panel);
    });
  }

  function panelToggleIcon(expand) {
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

  function bindDropHandlers(panel) {
    if (panel.dataset.dropBound === '1') return;
    panel.dataset.dropBound = '1';

    function hasFiles(e) {
      return Array.from(e.dataTransfer?.types || []).includes('Files');
    }

    function setZoneActive(active) {
      state.isDropActive = !!active;
      const zone = panel.querySelector('#chatster-lmg-dropzone');
      if (!zone) return;

      zone.style.borderColor = active
        ? 'rgba(255,255,255,0.45)'
        : 'var(--ah-toggle-hover)';
      zone.style.background = active ? 'var(--ah-control-hover)' : 'var(--ah-shell)';
      zone.style.color = active ? '#fff' : 'var(--ah-muted)';
    }

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(type => {
      panel.addEventListener(type, (e) => {
        if (!hasFiles(e)) return;
        stopFileDragDefaults(e);
      });
    });

    panel.addEventListener('dragenter', (e) => {
      if (!hasFiles(e)) return;
      setZoneActive(true);
    });

    panel.addEventListener('dragover', (e) => {
      if (!hasFiles(e)) return;
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      setZoneActive(true);
    });

    panel.addEventListener('dragleave', (e) => {
      if (!hasFiles(e)) return;
      const related = e.relatedTarget;
      if (!related || !panel.contains(related)) {
        setZoneActive(false);
      }
    });

    panel.addEventListener('drop', async (e) => {
      if (!hasFiles(e)) return;

      stopFileDragDefaults(e);
      setZoneActive(false);

      const file = e.dataTransfer?.files?.[0];
      if (!file) return;

      try {
        await importDroppedOrPickedClassFile(file);
      } catch (err) {
        console.error(err);
        alert(`Import failed: ${err.message}`);
      }

      renderPanel(true);
    });
  }

  function saveSharedContext(payload) {
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(payload));
  }

  function renderPanel(force = false) {
    const panel = ensurePanel();
    const currentCourseCode = getCurrentCourseCode();
    const groups = loadGroups(currentCourseCode);
    let activeGroupId = getActiveGroupId(currentCourseCode);
    if ((!activeGroupId || !groups.some(g => g.id === activeGroupId)) && groups.length) {
      activeGroupId = groups[0].id;
      updateActiveGroupId(activeGroupId, currentCourseCode);
    }
    const activeGroup = groups.find(g => g.id === activeGroupId) || null;
    const matchInfo = matchGroupToCurrentCanvas(activeGroup);
    const currentStudentName = getCurrentStudentDisplayName();
    const menuCache = loadCanvasMenuCache();
    const minimized = getMinimized();
    const exportNameMode = getExportNameMode();

    let currentIndexInGroup = -1;
    if (activeGroup && currentStudentName) {
      const normalizedCurrent = normalizeName(currentStudentName);
      currentIndexInGroup = matchInfo.matches.findIndex(m => {
        return (
          normalizeName(m.student.name) === normalizedCurrent ||
          normalizeName(m.student.canvas_name || '') === normalizedCurrent
        );
      });
    }

    const remainingInGroup = currentIndexInGroup >= 0
      ? Math.max(0, matchInfo.matches.length - currentIndexInGroup - 1)
      : matchInfo.matches.length;

    const currentMatch = currentIndexInGroup >= 0 ? matchInfo.matches[currentIndexInGroup] : null;

    const sig = JSON.stringify({
      groupsCount: groups.length,
      currentCourseCode,
      activeGroupId,
      currentStudentName,
      matchedCount: matchInfo.matches.length,
      currentIndexInGroup,
      drop: state.isDropActive,
      summary: state.lastImportSummary,
      cacheCount: Object.keys(menuCache).length,
      minimized
    });

    if (!force && sig === state.lastRenderSig) return;
    state.lastRenderSig = sig;

    saveSharedContext({
      version: 11,
      updated_at: currentTimestamp(),
      course_key: getCourseKey(),
      course_code: currentCourseCode,
      active_group_id: activeGroup ? activeGroup.id : '',
      active_group_name: activeGroup ? activeGroup.name : '',
      current_student_name: currentStudentName,
      current_index_in_group: currentIndexInGroup,
      matched_count: matchInfo.matches.length,
      remaining_in_group: remainingInGroup,
      cached_menu_students: Object.keys(menuCache).length,
      metadata: activeGroup?.metadata || {}
    });

 panel.innerHTML = `
  <div class="chatster-lmg-drag chatster-ui-header ${minimized ? '' : 'chatster-ui-header--border'}">
    <div class="chatster-ui-title">Tutorial Sorter</div>
    <button id="chatster-lmg-minimize" class="chatster-ui-btn-quiet chatster-ui-panel-toggle" title="${minimized ? 'Expand' : 'Minimise'}" aria-label="${minimized ? 'Expand Tutorial Sorter' : 'Minimise Tutorial Sorter'}">${panelToggleIcon(minimized)}</button>
  </div>

  ${minimized ? '' : `
  <div class="chatster-ui-body">

    ${groups.length ? '' : `
      <div
        id="chatster-lmg-dropzone"
        class="chatster-ui-dropzone"
        style="
          border:1px dashed ${state.isDropActive ? 'rgba(255,255,255,0.45)' : 'var(--ah-toggle-hover)'};
          background:${state.isDropActive ? 'var(--ah-control-hover)' : 'var(--ah-shell)'};
          color:${state.isDropActive ? '#fff' : 'var(--ah-muted)'};
        "
      >
        <div style="font-weight:700;">Drop class file here</div>
        <div class="chatster-ui-muted" style="margin-top:4px;">
          Use Allocate+ roster export file
        </div>
        <div class="chatster-ui-wrap chatster-ui-row--center" style="margin-top:10px;">
          <button id="chatster-lmg-import" class="chatster-ui-btn chatster-ui-icon-btn" title="Import class file" aria-label="Import class file">${actionIcon('upload')}</button>
        </div>
        <input
          id="chatster-lmg-file"
          type="file"
          accept=".xlsx,.xls,.xlsm,.csv,.txt,text/csv,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          style="display:none;"
        >
      </div>
    `}

    <div class="chatster-ui-section">
      ${fieldLabel('Active class')}
      <select id="chatster-lmg-select" class="chatster-ui-select">
        <option value="">— no local class selected —</option>
        ${groups.map(g => `
          <option value="${escapeHtml(g.id)}" ${g.id === activeGroupId ? 'selected' : ''}>
            ${escapeHtml(g.label || g.name)}
          </option>
        `).join('')}
      </select>
      ${groups.length ? '' : `
        <div class="chatster-ui-muted" style="margin-top:6px;line-height:1.4;">
          Import a class file to enable dock Prev/Next.
        </div>
      `}
    </div>

    <div class="chatster-ui-stats-grid">
      ${stat('Students in class', activeGroup ? activeGroup.students.length : '—')}
      ${stat('Position', activeGroup && currentIndexInGroup >= 0 ? `${currentIndexInGroup + 1}/${matchInfo.matches.length}` : '—')}
    </div>

    <div class="chatster-ui-card chatster-ui-section-lg">
      <div class="chatster-ui-muted" style="margin-bottom:4px;">Current student</div>
      <div style="font-weight:700;color:#fff;margin-bottom:4px;">
        ${activeGroup
          ? currentMatch
            ? `${escapeHtml(currentMatch.student.name || currentStudentName)}`
            : 'Not in active class'
          : 'No active class selected'}
      </div>
      ${activeGroup?.metadata ? `
        <div class="chatster-ui-muted" style="line-height:1.4;">
          ${escapeHtml([
            [activeGroup.metadata.day, activeGroup.metadata.time].filter(Boolean).join(' '),
            activeGroup.metadata.location
          ].filter(Boolean).join(' | ')) || '—'}
        </div>
      ` : ''}
    </div>

   <div class="chatster-ui-nav-block">
  <button id="chatster-lmg-prev" class="chatster-ui-btn">${actionIcon('prev')}<span>Prev</span></button>
  <button id="chatster-lmg-next" class="chatster-ui-btn"><span>Next</span>${actionIcon('next')}</button>
</div>

    ${activeGroup ? `
      <details class="chatster-ui-details chatster-ui-section-lg">
        <summary>Student List</summary>
        <div class="chatster-ui-student-list">
          ${activeGroup.students.map((s, idx) => {
            return `
              <button
                type="button"
                class="chatster-lmg-student-jump chatster-ui-student-item ${idx === currentIndexInGroup ? 'is-current' : ''}"
                data-student-index="${idx}"
                title="Jump to this student in SpeedGrader"
              >
                <div>${escapeHtml(s.name)}</div>
              </button>
            `;
          }).join('')}
        </div>
      </details>
    ` : ''}

    <details class="chatster-ui-details" style="margin-top:14px;">
      <summary>Import / Export</summary>

      ${groups.length ? `
        <div
          id="chatster-lmg-dropzone"
          class="chatster-ui-dropzone"
          style="
            border:1px dashed ${state.isDropActive ? 'rgba(255,255,255,0.45)' : 'var(--ah-toggle-hover)'};
            background:${state.isDropActive ? 'var(--ah-control-hover)' : 'var(--ah-shell)'};
            color:${state.isDropActive ? '#fff' : 'var(--ah-muted)'};
          "
        >
          <div style="font-weight:700;">Drop another class file here</div>
          <div class="chatster-ui-muted" style="margin-top:4px;">
            Use Allocate+ roster export file
          </div>
        </div>

        <div class="chatster-ui-wrap chatster-ui-section-lg">
          <button id="chatster-lmg-import" class="chatster-ui-btn chatster-ui-icon-btn" title="Import class file" aria-label="Import class file">${actionIcon('upload')}</button>
          <input
            id="chatster-lmg-file"
            type="file"
            accept=".xlsx,.xls,.xlsm,.csv,.txt,text/csv,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            style="display:none;"
          >
        </div>
      ` : ''}

      ${state.lastImportSummary ? `
        <div class="chatster-ui-summary chatster-ui-muted">
          ${escapeHtml(state.lastImportSummary)}
        </div>
      ` : ''}

      <div class="chatster-ui-section-lg" style="margin-top:14px;">
        ${fieldLabel('Create a file to import groups into Canvas')}
        <div class="chatster-ui-muted" style="margin-bottom:6px;">
          Choose a name for your Canvas groups
        </div>

        <div class="chatster-ui-row chatster-ui-row--left">
          <select id="chatster-lmg-export-name-mode" class="chatster-ui-select">
            <option value="class_label" ${exportNameMode === 'class_label' ? 'selected' : ''}>Course - day/time - room</option>
            <option value="day_time" ${exportNameMode === 'day_time' ? 'selected' : ''}>Day/time only</option>
            <option value="room" ${exportNameMode === 'room' ? 'selected' : ''}>Room only</option>
            <option value="staff" ${exportNameMode === 'staff' ? 'selected' : ''}>Staff only</option>
            <option value="day_time_room" ${exportNameMode === 'day_time_room' ? 'selected' : ''}>Day/time - room</option>
            <option value="day_time_staff" ${exportNameMode === 'day_time_staff' ? 'selected' : ''}>Day/time - staff</option>
            <option value="room_staff" ${exportNameMode === 'room_staff' ? 'selected' : ''}>Room - staff</option>
          </select>
          <button id="chatster-lmg-export-csv" class="chatster-ui-btn chatster-ui-icon-btn" title="Export Canvas CSV" aria-label="Export Canvas CSV">${actionIcon('download')}</button>
        </div>
      </div>

      <div class="chatster-ui-row chatster-ui-row--right" style="margin-top:8px;">
        <button id="chatster-lmg-reset" class="chatster-ui-btn-danger">Reset</button>
      </div>
    </details>

  </div>
  `}
`;

    panel.querySelector('#chatster-lmg-minimize')?.addEventListener('click', () => {
      updateMinimized(!minimized);
      renderPanel(true);
    });

if (minimized) {
  panel.querySelector('#chatster-lmg-prev')?.addEventListener('click', async () => {
    await goToRelativeGroupStudent(-1);
  });

  panel.querySelector('#chatster-lmg-next')?.addEventListener('click', async () => {
    await goToRelativeGroupStudent(1);
  });

  return;
}

    panel.querySelector('#chatster-lmg-select')?.addEventListener('change', (e) => {
      updateActiveGroupId(e.target.value, currentCourseCode);
      renderPanel(true);
    });

    panel.querySelector('#chatster-lmg-import')?.addEventListener('click', () => {
      panel.querySelector('#chatster-lmg-file')?.click();
    });

    panel.querySelector('#chatster-lmg-file')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          await importDroppedOrPickedClassFile(file);
        } catch (err) {
          console.error(err);
          alert(`Import failed: ${err.message}`);
        }
      }
      e.target.value = '';
      renderPanel(true);
    });

    panel.querySelector('#chatster-lmg-export-csv')?.addEventListener('click', () => {
      exportAllGroupsCsv();
    });

    panel.querySelector('#chatster-lmg-export-name-mode')?.addEventListener('change', (e) => {
      saveExportNameMode(e.target.value);
      renderPanel(true);
    });

    panel.querySelector('#chatster-lmg-reset')?.addEventListener('click', () => {
      const ok = confirm('Reset Tutorial Sorter? This will clear all saved groups, cache, and panel settings.');
      if (!ok) return;

      clearSavedData();
      clearCanvasMenuCache();
      state.lastImportSummary = 'Reset Tutorial Sorter';
      renderPanel(true);
    });

    panel.querySelector('#chatster-lmg-prev')?.addEventListener('click', async () => {
      await goToRelativeGroupStudent(-1);
    });

    panel.querySelector('#chatster-lmg-next')?.addEventListener('click', async () => {
      await goToRelativeGroupStudent(1);
    });

    panel.querySelectorAll('.chatster-lmg-student-jump').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!activeGroup) return;
        const index = Number(btn.dataset.studentIndex);
        await goToGroupStudentAtIndex(activeGroup, index);
      });
    });
  }

  function init() {
    renderPanel(true);

    if (state.tick) clearInterval(state.tick);
    state.tick = setInterval(() => renderPanel(false), 1000);
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

  function showRegisteredPanel(render = init) {
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

  function toggleRegisteredPanel(render = init) {
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
        showRegisteredPanel(init);
      },
      hide: hideRegisteredPanel,
      toggle() {
        toggleRegisteredPanel(init);
      },
      isOpen: isRegisteredPanelOpen,
      dockStatus: getTutorialSorterDockStatus,
      dockActions() {
        const { activeGroup } = getActiveGroupNavigationContext();
        const disabled = !activeGroup || !activeGroup.students.length;
        return [
          {
            id: 'prev',
            label: 'Prev',
            icon: 'prev',
            disabled,
            run: () => goToRelativeGroupStudent(-1)
          },
          {
            id: 'next',
            label: 'Next',
            icon: 'next',
            disabled,
            run: () => goToRelativeGroupStudent(1)
          }
        ];
      }
    });
  }

  registerAssessmentHelper();
  setTimeout(init, 1800);
})();
