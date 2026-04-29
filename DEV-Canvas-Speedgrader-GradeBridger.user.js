// ==UserScript==
// @name         DEV Canvas Speedgrader GradeBridger
// @namespace    https://github.com/GitJane/VisComm-Helpers
// @version      0.0.1
// @description  Jump between paired Canvas SpeedGrader assignments while keeping the current student.
// @author       Jane + Chatster
// @match        *://*/courses/*/gradebook/speed_grader*
// @require      File:///Users/jbs939/Desktop/AssessmentHelpers/DEV-canvas-speedgrader-gradebridger.user.js
// @grant        GM_getResourceURL
// ==/UserScript==



(function () {
  'use strict';

  const ASSIGNMENT_PAIRS = {
    '290628': {
      label: 'Go to Assessment 2: Packaging Design',
      targetAssignmentId: '290627',
    },
    '290627': {
      label: 'Go to Assessment 3: Mini Portfolio',
      targetAssignmentId: '290628',
    },
  };

  const PANEL_ID = 'vc-gradebridge-panel';

  function getCurrentInfo() {
    const url = new URL(window.location.href);

    return {
      url,
      assignmentId: url.searchParams.get('assignment_id'),
      studentId: url.searchParams.get('student_id'),
      anonymousId: url.searchParams.get('anonymous_id'),
    };
  }

  function createPanel(pair, currentInfo) {
    const existing = document.getElementById(PANEL_ID);
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = PANEL_ID;

    panel.innerHTML = `
      <div class="vc-gradebridge-title">GradeBridge</div>
      <div class="vc-gradebridge-subtitle">Paired assignment jumper</div>
      <button type="button" class="vc-gradebridge-button">${pair.label}</button>
    `;

    document.body.appendChild(panel);

    const button = panel.querySelector('.vc-gradebridge-button');

    button.addEventListener('click', () => {
      const nextUrl = new URL(currentInfo.url.toString());

      nextUrl.searchParams.set('assignment_id', pair.targetAssignmentId);

      // Keep whichever student navigation Canvas is already using.
      if (currentInfo.anonymousId) {
        nextUrl.searchParams.set('anonymous_id', currentInfo.anonymousId);
      }

      if (currentInfo.studentId) {
        nextUrl.searchParams.set('student_id', currentInfo.studentId);
      }

      window.location.href = nextUrl.toString();
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
    `;

    document.head.appendChild(style);
  }

  function init() {
    const currentInfo = getCurrentInfo();
    const pair = ASSIGNMENT_PAIRS[currentInfo.assignmentId];

    if (!pair) return;

    addStyles();
    createPanel(pair, currentInfo);
  }

  init();
})();