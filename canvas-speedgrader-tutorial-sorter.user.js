// ==UserScript==
// @name         Canvas SpeedGrader Tutorial Sorter
// @namespace    VisComm@UON
// @version      2
// @description  Local tutorial grouping helper for Canvas SpeedGrader, with workbook import and dropdown-driven navigation
// @match        https://*/courses/*/gradebook/speed_grader*
// @grant        none
// @require      File:///Users/jbs939/Desktop/AssessmentHelpers/canvas-speedgrader-tutorial-sorter.user.js
// @require      https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js
// ==/UserScript==

(function () {
  'use strict';

  // Imports class lists and provides tutorial-group navigation in SpeedGrader.

  // constants/config
  const PANEL_ID = 'chatster-lmg-panel';
  const STYLE_ID = 'chatster-lmg-style';
  const Z_INDEX_BASE = 100000;

  const GROUPS_KEY = 'chatster_tutorial_sorter_groups_v11';
  const ACTIVE_GROUP_KEY = 'chatster_tutorial_sorter_active_group_v11';
  const PANEL_POS_KEY = 'chatster_tutorial_sorter_panel_pos_v11';
  const PANEL_UI_KEY = 'chatster_tutorial_sorter_ui_v11';
  const CONTEXT_KEY = 'chatster_tutorial_sorter_context_v11';
  const CANVAS_MENU_KEY = 'chatster_canvas_menu_cache_v1';

  const DEFAULT_PANEL_POS = { top: 80, right: 18 };
  const PANEL_MARGIN = 8;

  // selectors
  const selectors = {
    panel: `#${PANEL_ID}`,
    selectedStudent: '[data-testid="selected-student"]',
    studentSelectTrigger: '[data-testid="student-select-trigger"]',
    studentMenuItem: 'span[data-testid^="student-option-"][role="menuitem"]'
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

  function loadGroups() {
    try {
      const data = JSON.parse(localStorage.getItem(GROUPS_KEY));
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function saveGroups(groups) {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  }

  function clearSavedData() {
    localStorage.removeItem(GROUPS_KEY);
    localStorage.removeItem(ACTIVE_GROUP_KEY);
    localStorage.removeItem(PANEL_POS_KEY);
    localStorage.removeItem(PANEL_UI_KEY);
    localStorage.removeItem(CONTEXT_KEY);
  }

  function getActiveGroupId() {
    return localStorage.getItem(ACTIVE_GROUP_KEY) || '';
  }

  function updateActiveGroupId(id) {
    if (id) localStorage.setItem(ACTIVE_GROUP_KEY, id);
    else localStorage.removeItem(ACTIVE_GROUP_KEY);
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
      day: '',
      time: '',
      duration: '',
      location: '',
      staff: '',
      suggested_name: ''
    };

    const nonEmpty = lines.filter(line => line.trim());

    if (nonEmpty[0]) {
      const parts = splitFlexibleLine(nonEmpty[0]);
      meta.course_code_blob = parts[0] || '';
      meta.course_name = parts[1] || '';
    }

    if (nonEmpty[1]) {
      const parts = splitFlexibleLine(nonEmpty[1]);
      meta.tutorial_code = parts[0] || '';

      const schedule = parts[1] || '';
      const schedParts = schedule.split(',').map(s => s.trim());
      meta.day = schedParts[0] || '';
      meta.time = schedParts[1] || '';
      meta.duration = schedParts[2] || '';
    }

    lines.forEach(line => {
      const trimmed = line.trim();

      const locMatch = trimmed.match(/^Location:\s*(.+)$/i);
      if (locMatch) meta.location = locMatch[1].trim();

      const staffMatch = trimmed.match(/^Staff:\s*(.+)$/i);
      if (staffMatch) meta.staff = staffMatch[1].trim();
    });

    const bits = [
      [meta.day, meta.time].filter(Boolean).join(' '),
      meta.staff
    ].filter(Boolean);

    meta.suggested_name = bits.join(' - ') || meta.tutorial_code || meta.course_name || 'Imported group';
    return meta;
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
    return {
      id: `group_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      source_file: sourceFile || '',
      created_at: currentTimestamp(),
      course_key: getCourseKey(),
      metadata: {
        course_code_blob: metadata.course_code_blob || '',
        course_name: metadata.course_name || '',
        tutorial_code: metadata.tutorial_code || '',
        day: metadata.day || '',
        time: metadata.time || '',
        duration: metadata.duration || '',
        location: metadata.location || '',
        staff: metadata.staff || '',
        sheet_name: metadata.sheet_name || ''
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

    const groups = loadGroups();
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

      groups.push(group);
      imported.push(group);
    });

    if (!imported.length) {
      alert('No valid class tabs were found in that workbook.');
      return;
    }

    saveGroups(groups);
    updateActiveGroupId(imported[0].id);

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

    const groups = loadGroups();
    const group = makeGroup(parsed.suggestedName, parsed.students, file.name, parsed.metadata);
    groups.push(group);
    saveGroups(groups);
    updateActiveGroupId(group.id);

    state.lastImportSummary = `Imported 1 group from ${file.name}`;
    renderPanel(true);
  }

  function buildAllCanvasGroupsCsv(groups) {
    const rows = [['user_id', 'group_name']];

    groups.forEach(group => {
      group.students.forEach(student => {
        const userId = canonicalStudentId(student.user_id || student.student_number || student.login_id || '');
        if (!userId) return;
        rows.push([userId, group.name]);
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

    const csv = buildAllCanvasGroupsCsv(groups);
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
      alert(`Could not find "${student.name}" in the Canvas student menu.`);
      return false;
    }

    return true;
  }

  async function goToGroupStudentAtIndex(activeGroup, index) {
    if (!activeGroup) return false;
    if (!Number.isInteger(index)) return false;
    if (index < 0 || index >= activeGroup.students.length) return false;

    const student = activeGroup.students[index];
    if (!student) return false;

    return await goToStudentByGroupMatch({ student });
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
    .chatster-ui-panel {
      width: 340px;
      z-index: ${Z_INDEX_BASE};
      background: #1f2329;
      color: #f3f4f6;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.28);
      font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      overflow: hidden;
    }

    .chatster-ui-header {
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

    .chatster-ui-header::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0px;
  bottom: 0px;
  width: 12px;
  background: #d6a21d;
  border-radius: 0 2px 2px 0;
  }

    .chatster-ui-header--border {
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .chatster-ui-title {
      font-weight: 700;
    }

    .chatster-ui-body {
      padding: 12px;
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
      background: #11151a;
      color: #f3f4f6;
      border: 1px solid rgba(255,255,255,0.08);
    }

    .chatster-ui-btn:hover {
      background: #171c22;
    }

    .chatster-ui-btn-quiet {
      background: #161a20;
      color: #d5d9df;
      border: 1px solid rgba(255,255,255,0.06);
    }

    .chatster-ui-btn-quiet:hover {
      background: #1b2027;
    }

    .chatster-ui-btn-danger {
      background: #8b1e2d;
      color: #fff2f4;
      border: 1px solid rgba(255,255,255,0.08);
    }

    .chatster-ui-btn-danger:hover {
      background: #a32437;
    }

    .chatster-ui-muted {
      font-size: 11px;
      color: #9aa3af;
    }

    .chatster-ui-field-label {
      display: block;
      font-size: 11px;
      color: #9aa3af;
      margin-bottom: 4px;
    }

    .chatster-ui-select,
    .chatster-ui-input {
      width: 100%;
      background: #11151a;
      color: #f3f4f6;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      padding: 8px;
      box-sizing: border-box;
    }

    .chatster-ui-card {
      background: #161a20;
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 10px;
      padding: 10px;
    }

    .chatster-ui-stat {
      background: #161a20;
      border: 1px solid rgba(255,255,255,0.05);
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
      max-height: 220px;
      overflow: auto;
      font-size: 12px;
      color: #c7ced8;
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
      color: #c7ced8;
      font-weight: 400;
    }

    .chatster-ui-student-item.is-current {
      background: rgba(255,255,255,0.08);
      color: #fff;
      font-weight: 700;
    }

    .chatster-ui-student-sub {
      font-size: 11px;
      color: #8f98a3;
      margin-top: 2px;
    }

    .chatster-lmg-student-jump:hover {
      background: rgba(255,255,255,0.06) !important;
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
      const clickable = e.target.closest('button, select, input, option, label, summary, details');
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
      const left = state.drag.panelLeft + dx;
      const top = state.drag.panelTop + dy;

      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      panel.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (!state.drag) return;
      state.drag = null;
      document.body.style.cursor = '';
      clampPanelToViewport(panel);
    });

    window.addEventListener('resize', () => {
      clampPanelToViewport(panel);
    });
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
        : 'rgba(255,255,255,0.14)';
      zone.style.background = active ? '#2b313a' : '#161a20';
      zone.style.color = active ? '#fff' : '#c7ced8';
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
    const groups = loadGroups();
    const activeGroupId = getActiveGroupId();
    const activeGroup = groups.find(g => g.id === activeGroupId) || null;
    const matchInfo = matchGroupToCurrentCanvas(activeGroup);
    const currentStudentName = getCurrentStudentDisplayName();
    const menuCache = loadCanvasMenuCache();
    const minimized = getMinimized();

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
    <button id="chatster-lmg-minimize" class="chatster-ui-btn-quiet">${minimized ? 'Expand' : 'Minimise'}</button>
  </div>

  ${minimized ? '' : `
  <div class="chatster-ui-body">
    <div
      id="chatster-lmg-dropzone"
      class="chatster-ui-dropzone"
      style="
        border:1px dashed ${state.isDropActive ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'};
        background:${state.isDropActive ? '#2b313a' : '#161a20'};
        color:${state.isDropActive ? '#fff' : '#c7ced8'};
      "
    >
      <div style="font-weight:700;">Drop class file here</div>
      <div class="chatster-ui-muted" style="margin-top:4px;">
        Use Allocate+ roster export file
      </div>
    </div>

    <div class="chatster-ui-wrap chatster-ui-section-lg">
      <button id="chatster-lmg-import" class="chatster-ui-btn">Import class file</button>
      <input
        id="chatster-lmg-file"
        type="file"
        accept=".xlsx,.xls,.xlsm,.csv,.txt,text/csv,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        style="display:none;"
      >
    </div>

    ${state.lastImportSummary ? `
      <div class="chatster-ui-summary chatster-ui-muted">
        ${escapeHtml(state.lastImportSummary)}
      </div>
    ` : ''}

    <div class="chatster-ui-section">
      ${fieldLabel('Active group')}
      <select id="chatster-lmg-select" class="chatster-ui-select">
        <option value="">— no local group selected —</option>
        ${groups.map(g => `
          <option value="${escapeHtml(g.id)}" ${g.id === activeGroupId ? 'selected' : ''}>
            ${escapeHtml(g.name)}
          </option>
        `).join('')}
      </select>
    </div>

    <div class="chatster-ui-row chatster-ui-row--left chatster-ui-section-lg">
      <button id="chatster-lmg-export-csv" class="chatster-ui-btn">Export Canvas Group list</button>
    </div>

    <div class="chatster-ui-stats-grid">
      ${stat('Groups loaded', groups.length || '—')}
      ${stat('Students in group', activeGroup ? activeGroup.students.length : '—')}
      ${stat('Menu cache', Object.keys(menuCache).length || '—')}
      ${stat('Position', activeGroup && currentIndexInGroup >= 0 ? `${currentIndexInGroup + 1}/${matchInfo.matches.length}` : '—')}
    </div>

<div class="chatster-ui-card chatster-ui-section-lg">
<div class="chatster-ui-muted" style="margin-bottom:4px;">Current student</div>
  <div style="font-weight:700;color:#fff;margin-bottom:4px;">
    ${activeGroup
      ? currentMatch
        ? `${escapeHtml(currentMatch.student.name || currentStudentName)}`
        : 'Not in active group'
      : 'No active group selected'}
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

    <div class="chatster-ui-row chatster-ui-section">
      <button id="chatster-lmg-prev" class="chatster-ui-btn">◀ Prev in group</button>
      <button id="chatster-lmg-next" class="chatster-ui-btn">Next in group ▶</button>
    </div>

    ${activeGroup ? `
      <details style="margin-top:10px;" open>
        <summary style="cursor:pointer;color:#9aa3af;">Show group students</summary>
        <div class="chatster-ui-student-list">
          ${activeGroup.students.map((s, idx) => {
            const userRef = canonicalStudentId(s.user_id || s.student_number || s.login_id || '');
            return `
              <button
                type="button"
                class="chatster-lmg-student-jump chatster-ui-student-item ${idx === currentIndexInGroup ? 'is-current' : ''}"
                data-student-index="${idx}"
                title="Jump to this student in SpeedGrader"
              >
                <div>${escapeHtml(s.name)}</div>
                <div class="chatster-ui-student-sub">
                  ${userRef ? `${escapeHtml(userRef)}` : '—'}
                </div>
              </button>
            `;
          }).join('')}
        </div>
      </details>
    ` : ''}

    <div class="chatster-ui-row chatster-ui-row--right" style="margin-top:8px;">
      <button id="chatster-lmg-reset" class="chatster-ui-btn-danger">Reset</button>
    </div>
  </div>
  `}
`;

    panel.querySelector('#chatster-lmg-minimize')?.addEventListener('click', () => {
      updateMinimized(!minimized);
      renderPanel(true);
    });

    if (minimized) return;

    panel.querySelector('#chatster-lmg-select')?.addEventListener('change', (e) => {
      updateActiveGroupId(e.target.value);
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

    panel.querySelector('#chatster-lmg-reset')?.addEventListener('click', () => {
      const ok = confirm('Reset Tutorial Sorter? This will clear all saved groups, cache, and panel settings.');
      if (!ok) return;

      clearSavedData();
      clearCanvasMenuCache();
      state.lastImportSummary = 'Reset Tutorial Sorter';
      renderPanel(true);
    });

    panel.querySelector('#chatster-lmg-prev')?.addEventListener('click', async () => {
      if (!activeGroup || !activeGroup.students.length) return;

      if (currentIndexInGroup < 0) {
        await goToGroupStudentAtIndex(activeGroup, 0);
        return;
      }

      await goToGroupStudentAtIndex(activeGroup, Math.max(0, currentIndexInGroup - 1));
    });

    panel.querySelector('#chatster-lmg-next')?.addEventListener('click', async () => {
      if (!activeGroup || !activeGroup.students.length) return;

      if (currentIndexInGroup < 0) {
        await goToGroupStudentAtIndex(activeGroup, 0);
        return;
      }

      await goToGroupStudentAtIndex(
        activeGroup,
        Math.min(activeGroup.students.length - 1, currentIndexInGroup + 1)
      );
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
    if (document.getElementById(PANEL_ID)) return;
    renderPanel(true);

    if (state.tick) clearInterval(state.tick);
    state.tick = setInterval(() => renderPanel(false), 1000);
  }

  setTimeout(init, 1800);
})();
