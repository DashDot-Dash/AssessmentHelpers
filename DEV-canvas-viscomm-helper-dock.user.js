// ==UserScript==
// @name         DEV Canvas Assessment Helper Dock
// @namespace    AssessmentHelpers
// @version      0.1.0
// @description  Floating launcher for Canvas assessment helper panels
// @author       Jane + Chatster
// @match        *://*/courses/*/gradebook/speed_grader*
// @match        *://*/courses/*/gradebook/speed_grader?*
// @match        *://*/gradebook/speed_grader*
// @match        *://*/courses/*/rubrics*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const DOCK_ID = 'assessment-helper-dock';
  const STYLE_ID = 'assessment-helper-dock-style';
  const STORAGE_KEY = 'assessmentHelpers:dockUi:v1';
  const LEGACY_STORAGE_KEY = 'vcHelperDock:ui:v1';
  const Z_INDEX_BASE = 2147483000;
  let dockObserver = null;
  let dockRenderTimer = null;

  const ICONS = {
    clipboardList: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" /><path d="M9 5a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2" /><path d="M9 12l.01 0" /><path d="M13 12l2 0" /><path d="M9 16l.01 0" /><path d="M13 16l2 0" /></svg>',
    filterPlus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20l-3 1v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v3" /><path d="M16 19h6" /><path d="M19 16v6" /></svg>',
    hourglass: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 7h11" /><path d="M6.5 17h11" /><path d="M6 20v-2a6 6 0 1 1 12 0v2a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1" /><path d="M6 4v2a6 6 0 1 0 12 0v-2a1 1 0 0 0 -1 -1h-10a1 1 0 0 0 -1 1" /></svg>',
    reorder: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 16a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -2" /><path d="M10 16a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -2" /><path d="M17 16a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -2" /><path d="M5 11v-3a3 3 0 0 1 3 -3h8a3 3 0 0 1 3 3v3" /><path d="M16.5 8.5l2.5 2.5l2.5 -2.5" /></svg>',
    circlesRelation: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.183 6.117a6 6 0 1 0 4.511 3.986" /><path d="M14.813 17.883a6 6 0 1 0 -4.496 -3.954" /></svg>',
    icons: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0" /><path d="M2.5 21h8l-4 -7l-4 7" /><path d="M14 3l7 7" /><path d="M14 10l7 -7" /><path d="M14 14h7v7h-7l0 -7" /></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 5v14l-8 -7l8 -7" /><path d="M10 5v14l-8 -7l8 -7" /></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5v14l8 -7l-8 -7" /><path d="M14 5v14l8 -7l-8 -7" /></svg>',
    switch: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 16h10" /><path d="M11 16l4 4" /><path d="M11 16l4 -4" /><path d="M13 8h-10" /><path d="M13 8l-4 4" /><path d="M13 8l-4 -4" /></svg>',
    minimize: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" /></svg>',
    maximize: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v3a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1l0 -3" /><path d="M4 12v-6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-6" /><path d="M12 8h4v4" /><path d="M16 8l-5 5" /></svg>'
  };

  window.AssessmentHelpers = window.AssessmentHelpers || window.VisCommHelpers || {
    helpers: {},
    register(helper) {
      if (!helper?.id) return;
      this.helpers[helper.id] = helper;
      (helper.aliases || []).forEach(alias => {
        this.helpers[alias] = helper;
      });
      window.dispatchEvent(new CustomEvent('assessment-helper-registered', { detail: helper }));
      window.dispatchEvent(new CustomEvent('viscomm-helper-registered', { detail: helper }));
    }
  };
  window.VisCommHelpers = window.AssessmentHelpers;

  const HELPERS = [
    {
      id: 'copy-paster',
      name: 'Copy/Paster',
      icon: 'clipboardList',
      panelId: 'vc-copy-paster-panel',
      panelIds: ['vc-copy-paster-panel', 'sg-copypaster-panel'],
      contexts: ['speedgrader']
    },
    {
      id: 'benchmarker',
      name: 'Benchmarker',
      icon: 'filterPlus',
      panelId: 'vc-benchmarker-panel',
      panelIds: ['vc-benchmarker-panel', 'sg-benchmarker-panel'],
      contexts: ['speedgrader']
    },
    {
      id: 'eta',
      aliases: ['wwie'],
      name: 'ETA',
      icon: 'hourglass',
      panelId: 'eta-panel',
      panelIds: ['eta-panel', 'vc-wwie-panel', 'wwie-prince-panel'],
      contexts: ['speedgrader']
    },
    {
      id: 'tutorial-sorter',
      name: 'Tutorial Sorter',
      icon: 'reorder',
      panelId: 'vc-tutorial-sorter-panel',
      panelIds: ['vc-tutorial-sorter-panel', 'chatster-lmg-panel'],
      contexts: ['speedgrader']
    },
    {
      id: 'gradebridge',
      name: 'GradeBridge',
      icon: 'circlesRelation',
      panelId: 'vc-gradebridge-panel',
      panelIds: ['vc-gradebridge-panel'],
      contexts: ['speedgrader']
    },
    {
      id: 'rubric-builder',
      aliases: ['rubric-library', 'rubric-smoother'],
      name: 'Rubric Builder',
      icon: 'icons',
      panelId: 'rubric-builder-panel',
      panelIds: ['rubric-builder-panel', 'rubric-library-panel', 'vc-rubric-smoother-panel', 'jj-rubric-overlay'],
      contexts: ['rubrics'],
      primaryWhenAvailable: true
    }
  ];

  function getPageContext() {
    const path = window.location.pathname;
    if (path.includes('/rubrics')) return 'rubrics';
    if (path.includes('/speed_grader')) return 'speedgrader';
    return 'canvas';
  }

  function getContextHelpers() {
    const context = getPageContext();
    return HELPERS.filter(helper => !helper.contexts || helper.contexts.includes(context));
  }

  function getCourseId() {
    const match = window.location.pathname.match(/\/courses\/(\d+)/);
    return match?.[1] || 'unknown-course';
  }

  function getAssignmentId() {
    const url = new URL(window.location.href);
    return (
      url.searchParams.get('assignment_id') ||
      url.searchParams.get('assignment') ||
      'unknown-assignment'
    );
  }

  function loadUi() {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem(LEGACY_STORAGE_KEY) ||
        '{}'
      ) || {};
    } catch (_) {
      return {};
    }
  }

  function saveUi(ui) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ui));
  }

  function updateUi(patch) {
    const ui = { ...loadUi(), ...patch };
    saveUi(ui);
    renderDock();
  }

  function saveDockPosition(left, top) {
    const ui = loadUi();
    saveUi({ ...ui, position: { left, top } });
  }

  function getClampedPosition(dock, left, top) {
    const margin = 8;
    const rect = dock.getBoundingClientRect();
    const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
    const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);

    return {
      left: Math.min(Math.max(margin, left), maxLeft),
      top: Math.min(Math.max(margin, top), maxTop)
    };
  }

  function setDockPosition(dock, left, top, persist = true) {
    const position = getClampedPosition(dock, left, top);
    dock.style.left = `${position.left}px`;
    dock.style.top = `${position.top}px`;
    dock.style.right = 'auto';
    dock.style.bottom = 'auto';
    if (persist) saveDockPosition(position.left, position.top);
  }

  function applySavedPosition(dock) {
    const position = loadUi().position;
    if (!position || position.left == null || position.top == null) return;

    requestAnimationFrame(() => {
      setDockPosition(dock, Number(position.left), Number(position.top), false);
    });
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getHelperPanel(helper) {
    const registered = getRegisteredHelper(helper);
    const ids = [
      registered?.panelId,
      ...(registered?.panelIds || []),
      helper.panelId,
      ...(helper.panelIds || [])
    ].filter(Boolean);
    const uniqueIds = [...new Set(ids)];
    for (const id of uniqueIds) {
      const panel = document.getElementById(id);
      if (panel) return panel;
    }
    return null;
  }

  function getRegisteredHelper(helper) {
    const registry = window.AssessmentHelpers || window.VisCommHelpers;
    return registry?.helpers?.[helper.id] ||
      (helper.aliases || []).map(alias => registry?.helpers?.[alias]).find(Boolean) ||
      null;
  }

  function isPanelVisible(panel) {
    if (!panel || panel.dataset.vcHelperDockHidden === '1') return false;
    const style = window.getComputedStyle(panel);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  function hiddenMap() {
    return loadUi().hidden || {};
  }

  function isHelperHidden(helper) {
    const hidden = hiddenMap();
    return !!hidden[helper.id] || (helper.aliases || []).some(alias => hidden[alias]);
  }

  function setHelperHidden(helper, hidden) {
    const ui = loadUi();
    const hiddenHelpers = { ...(ui.hidden || {}) };
    hiddenHelpers[helper.id] = !!hidden;
    (helper.aliases || []).forEach(alias => {
      hiddenHelpers[alias] = !!hidden;
    });
    saveUi({ ...ui, hidden: hiddenHelpers });
    applyHelperVisibility(helper);
    renderDock();
  }

  function clearHelperHidden(helper) {
    const ui = loadUi();
    const hiddenHelpers = { ...(ui.hidden || {}) };
    hiddenHelpers[helper.id] = false;
    (helper.aliases || []).forEach(alias => {
      hiddenHelpers[alias] = false;
    });
    saveUi({ ...ui, hidden: hiddenHelpers });
  }

  function applyHelperVisibility(helper) {
    const registered = getRegisteredHelper(helper);
    if (registered) {
      if (isHelperHidden(helper)) {
        try {
          registered.hide?.();
        } catch (err) {
          console.warn('[Assessment Helpers Dock] Could not apply saved hidden state', helper.id, err);
        }
      }
      return;
    }

    const panel = getHelperPanel(helper);
    if (!panel) return;

    const hidden = isHelperHidden(helper);
    if (hidden) {
      if (!panel.dataset.vcHelperDockPreviousDisplay) {
        panel.dataset.vcHelperDockPreviousDisplay = panel.style.display || '';
      }
      panel.dataset.vcHelperDockHidden = '1';
      panel.style.display = 'none';
      return;
    }

    panel.dataset.vcHelperDockHidden = '0';
    const previousDisplay = panel.dataset.vcHelperDockPreviousDisplay;
    if (previousDisplay) {
      panel.style.display = previousDisplay;
    } else {
      panel.style.removeProperty('display');
    }
    delete panel.dataset.vcHelperDockPreviousDisplay;
  }

  function applySavedVisibility() {
    getContextHelpers().forEach(applyHelperVisibility);
  }

  function getHelperViewModels() {
    return getContextHelpers().map(helper => {
      const registered = getRegisteredHelper(helper);
      const panel = getHelperPanel(helper);
      const actions = getDockActions(helper);
      const status = getDockStatus(helper);
      let registeredOpen = false;
      if (registered?.isOpen) {
        try {
          registeredOpen = !!registered.isOpen();
        } catch (err) {
          console.warn('[Assessment Helpers Dock] Could not read helper open state', helper.id, err);
        }
      }
      const panelOpen = !!panel && isPanelVisible(panel);
      const open = registeredOpen || panelOpen;
      const hasEnabledAction = actions.some(action => !action.disabled);

      return {
        helper,
        registered,
        panel,
        available: !!registered || !!panel,
        actions,
        ready: helper.primaryWhenAvailable && (!!registered || !!panel)
          ? true
          : open
          ? true
          : status.configured
          ? true
          : actions.length
          ? hasEnabledAction
          : registered
            ? open
            : panelOpen,
        active: open
      };
    });
  }

  function getDockStatus(helper) {
    const registered = getRegisteredHelper(helper);
    try {
      const status = registered?.dockStatus?.();
      if (status?.configured) return status;
    } catch (err) {
      console.warn('[Assessment Helpers Dock] Could not read dock status', helper?.id, err);
    }

    return getFallbackDockStatus(helper);
  }

  function getFallbackDockStatus(helper) {
    if (helper.id === 'gradebridge') {
      try {
        const pairs = JSON.parse(localStorage.getItem('vcGradeBridge:pairs:v1') || '{}') || {};
        const pair = pairs[getCourseId()]?.[getAssignmentId()];
        return { configured: !!pair };
      } catch (_) {
        return { configured: false };
      }
    }

    if (helper.id === 'tutorial-sorter') {
      try {
        const data = JSON.parse(localStorage.getItem('chatster_tutorial_sorter_groups_v11') || '{}') || {};
        const hasStudents = Object.values(data.courses || {}).some(course => {
          return Object.values(course?.classes || {}).some(group => Array.isArray(group?.students) && group.students.length > 0);
        });
        return { configured: hasStudents };
      } catch (_) {
        return { configured: false };
      }
    }

    return { configured: false };
  }

  function getDockActions(helper) {
    const registered = getRegisteredHelper(helper);
    const panel = getHelperPanel(helper);
    try {
      return registered?.dockActions?.() || getFallbackDockActions(helper, panel);
    } catch (err) {
      console.warn('[Assessment Helpers Dock] Could not read dock actions', helper?.id, err);
      return getFallbackDockActions(helper, panel);
    }
  }

  function getFallbackDockActions(helper, panel) {
    if (helper.id !== 'gradebridge' || !panel) return [];
    const hasSwitchTarget = !!panel.querySelector('[data-vc-gradebridge-action="jump"]');

    return [
      {
        id: 'switch',
        label: 'Switch',
        icon: 'switch',
        disabled: !hasSwitchTarget,
        run: () => {
          const detail = {
            helperId: 'gradebridge',
            actionId: 'switch',
            requestId: `${Date.now()}:${Math.random()}`
          };
          document.dispatchEvent(new CustomEvent('assessment-helper-action', { detail }));
          window.dispatchEvent(new CustomEvent('assessment-helper-action', { detail }));
          document.dispatchEvent(new CustomEvent('viscomm-helper-action', { detail }));
          window.dispatchEvent(new CustomEvent('viscomm-helper-action', { detail }));
        }
      }
    ];
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${DOCK_ID} {
        position: fixed;
        right: 18px;
        top: 132px;
        z-index: ${Z_INDEX_BASE};
        width: 190px;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 14px;
        background: #18181B;
        color: #FAFAFA;
        box-shadow: 0 10px 30px rgba(0,0,0,0.30);
        font: 13px/1.35 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        overflow: hidden;
        user-select: none;
      }

      #${DOCK_ID}.is-dragging {
        opacity: 0.94;
        transition: none;
      }

      #${DOCK_ID}.is-minimized {
        width: auto;
        border-radius: 10px 0 0 10px;
      }

      #${DOCK_ID} .vc-dock-header {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 10px 10px 10px 25px;
        background: #27272A;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        cursor: grab;
        touch-action: none;
      }

      #${DOCK_ID} .vc-dock-header::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 12px;
        background: #D6A21D;
        border-radius: 0 2px 2px 0;
      }

      #${DOCK_ID} .vc-dock-title {
        min-width: 0;
        font-size: 12px;
        font-weight: 750;
        white-space: nowrap;
      }

      #${DOCK_ID} .vc-dock-toggle {
        display: grid;
        place-items: center;
        border: 0;
        border-radius: 8px;
        width: 28px;
        height: 26px;
        padding: 0;
        background: rgba(255,255,255,0.05);
        color: #FAFAFA;
        cursor: pointer;
      }

      #${DOCK_ID} .vc-dock-toggle:hover {
        background: rgba(255,255,255,0.14);
        color: #FAFAFA;
      }

      #${DOCK_ID} .vc-dock-toggle svg {
        width: 16px;
        height: 16px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      #${DOCK_ID} .vc-dock-tab {
        position: relative;
        display: flex;
        align-items: center;
        gap: 6px;
        border: 0;
        padding: 10px 12px 10px 18px;
        background: #27272A;
        color: #FAFAFA;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
        touch-action: none;
      }

      #${DOCK_ID} .vc-dock-tab svg {
        width: 15px;
        height: 15px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      #${DOCK_ID} .vc-dock-tab::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 12px;
        background: #D6A21D;
      }

      #${DOCK_ID} .vc-dock-list {
        display: grid;
        gap: 7px;
        padding: 10px;
      }

      #${DOCK_ID} .vc-dock-list + .vc-dock-unavailable {
        border-top: 1px solid rgba(255,255,255,0.08);
      }

      #${DOCK_ID} .vc-dock-helper {
        width: 100%;
        min-width: 0;
        display: grid;
        grid-template-columns: 24px minmax(0, 1fr);
        align-items: center;
        gap: 8px;
        border: 0;
        border-radius: 9px;
        padding: 8px 9px;
        background: #27272A;
        color: #FAFAFA;
        text-align: left;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }

      #${DOCK_ID} .vc-dock-helper:hover:not(:disabled) {
        background: #3F3F46;
        color: #FAFAFA;
      }

      #${DOCK_ID} .vc-dock-helper.is-active {
        background: #E4E4E7;
        color: #18181B;
      }

      #${DOCK_ID} .vc-dock-helper:disabled {
        cursor: default;
        opacity: 0.42;
      }

      #${DOCK_ID} .vc-dock-helper-card {
        display: grid;
        gap: 6px;
      }

      #${DOCK_ID} .vc-dock-helper-card.has-actions {
        position: relative;
        gap: 7px;
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 10px;
        padding: 5px;
        background: rgba(255,255,255,0.06);
      }

      #${DOCK_ID} .vc-dock-helper-card.has-actions .vc-dock-helper {
        border-bottom: 5px solid #D6A21D;
      }

      #${DOCK_ID} .vc-dock-action-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
        gap: 6px;
        padding: 0 1px;
      }

      #${DOCK_ID} .vc-dock-action {
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        border: 0;
        border-bottom: 5px solid #D6A21D;
        border-radius: 8px;
        padding: 6px 7px;
        background: #27272A;
        color: #FAFAFA;
        font-size: 11px;
        font-weight: 750;
        line-height: 1;
        cursor: pointer;
      }

      #${DOCK_ID} .vc-dock-action:hover:not(:disabled) {
        background: #3F3F46;
        color: #FAFAFA;
      }

      #${DOCK_ID} .vc-dock-action:disabled {
        cursor: default;
        opacity: 0.42;
      }

      #${DOCK_ID} .vc-dock-action svg {
        width: 14px;
        height: 14px;
        flex: 0 0 auto;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      #${DOCK_ID} .vc-dock-empty {
        padding: 9px 10px;
        border-radius: 9px;
        background: rgba(255,255,255,0.06);
        color: #A1A1AA;
        font-size: 12px;
        line-height: 1.3;
      }

      #${DOCK_ID} .vc-dock-unavailable {
        padding: 0;
      }

      #${DOCK_ID} .vc-dock-unavailable summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 8px 10px;
        color: #A1A1AA;
        font-size: 11px;
        font-weight: 750;
        cursor: pointer;
        list-style: none;
      }

      #${DOCK_ID} .vc-dock-unavailable summary::-webkit-details-marker {
        display: none;
      }

      #${DOCK_ID} .vc-dock-unavailable summary::after {
        content: "▸";
        color: #A1A1AA;
        font-size: 11px;
      }

      #${DOCK_ID} .vc-dock-unavailable[open] summary::after {
        content: "▾";
      }

      #${DOCK_ID} .vc-dock-unavailable-list {
        display: grid;
        gap: 7px;
        padding: 0 10px 10px;
      }

      #${DOCK_ID} .vc-dock-icon {
        display: grid;
        place-items: center;
        text-align: center;
        line-height: 1;
      }

      #${DOCK_ID} .vc-dock-icon svg {
        width: 17px;
        height: 17px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      #${DOCK_ID} .vc-dock-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `;
    document.head.appendChild(style);
  }

  function pauseObserver() {
    dockObserver?.disconnect();
  }

  function resumeObserver() {
    if (!dockObserver) return;
    dockObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function isHelperPanelElement(el) {
    if (!el?.id) return false;
    return getContextHelpers().some(helper => {
      const ids = [helper.panelId, ...(helper.panelIds || [])].filter(Boolean);
      return ids.includes(el.id);
    });
  }

  function isInsideKnownHelperPanel(node) {
    if (!(node instanceof Element)) return false;
    return getContextHelpers().some(helper => {
      const ids = [helper.panelId, ...(helper.panelIds || [])].filter(Boolean);
      return ids.some(id => node.closest?.(`#${CSS.escape(id)}`));
    });
  }

  function mutationMayAffectDock(mutation) {
    if (mutation.target?.id === DOCK_ID || mutation.target?.closest?.(`#${DOCK_ID}`)) return false;
    if (isInsideKnownHelperPanel(mutation.target) && !isHelperPanelElement(mutation.target)) return false;

    const nodes = [...mutation.addedNodes, ...mutation.removedNodes];
    if (!nodes.length) return false;

    return nodes.some(node => {
      if (!(node instanceof Element)) return false;
      if (node.id === DOCK_ID || node.closest?.(`#${DOCK_ID}`)) return false;
      if (isHelperPanelElement(node)) return true;
      if (getContextHelpers().some(helper => {
        const ids = [helper.panelId, ...(helper.panelIds || [])].filter(Boolean);
        return ids.some(id => node.querySelector?.(`#${CSS.escape(id)}`));
      })) return true;
      return false;
    });
  }

  function scheduleRenderDock() {
    if (dockRenderTimer) return;
    dockRenderTimer = window.setTimeout(() => {
      dockRenderTimer = null;
      renderDock();
    }, 120);
  }

  function attachDockDragging(dock) {
    if (dock.dataset.dragBound === '1') return;
    dock.dataset.dragBound = '1';

    dock.addEventListener('pointerdown', event => {
      const handle = event.target.closest('.vc-dock-header, .vc-dock-tab');
      if (!handle || event.button !== 0) return;
      if (event.target.closest('.vc-dock-toggle')) return;

      const rect = dock.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      let moved = false;

      pauseObserver();
      dock.classList.add('is-dragging');
      handle.setPointerCapture?.(event.pointerId);

      function onPointerMove(moveEvent) {
        const dx = Math.abs(moveEvent.clientX - event.clientX);
        const dy = Math.abs(moveEvent.clientY - event.clientY);
        if (dx > 3 || dy > 3) moved = true;
        setDockPosition(dock, moveEvent.clientX - offsetX, moveEvent.clientY - offsetY);
      }

      function onPointerUp(upEvent) {
        dock.classList.remove('is-dragging');
        handle.releasePointerCapture?.(upEvent.pointerId);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        resumeObserver();

        if (moved && handle.classList.contains('vc-dock-tab')) {
          handle.addEventListener('click', clickEvent => {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
          }, { once: true, capture: true });
        }
      }

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    });

    window.addEventListener('resize', () => {
      const rect = dock.getBoundingClientRect();
      setDockPosition(dock, rect.left, rect.top);
    });
  }

  function renderDock() {
    if (!document.body) return;

    pauseObserver();

    try {
      addStyles();
      applySavedVisibility();

      const ui = loadUi();
      const minimized = !!ui.minimized;
      let dock = document.getElementById(DOCK_ID);

      if (!dock) {
        dock = document.createElement('div');
        dock.id = DOCK_ID;
        document.body.appendChild(dock);
      }
      applySavedPosition(dock);

      dock.classList.toggle('is-minimized', minimized);

      if (minimized) {
        dock.innerHTML = `
          <button type="button" class="vc-dock-tab" title="Open Assessment Helpers" aria-label="Open Assessment Helpers">
            ${ICONS.maximize}
            <span>AH</span>
          </button>
        `;
        dock.querySelector('.vc-dock-tab')?.addEventListener('click', () => updateUi({ minimized: false }));
        attachDockDragging(dock);
        return;
      }

      const helperViews = getHelperViewModels();
      const activeHelpers = helperViews.filter(item => item.ready);
      const inactiveHelpers = helperViews.filter(item => !item.ready);
      const unavailableOpen = !!ui.unavailableOpen;
      const renderHelperButton = ({ helper, available, active, actions }) => {
        const classes = ['vc-dock-helper', active ? 'is-active' : ''].filter(Boolean).join(' ');
        const cardClasses = ['vc-dock-helper-card', actions?.length ? 'has-actions' : ''].filter(Boolean).join(' ');
        const icon = ICONS[helper.icon] || ICONS.icons;
        return `
          <div class="${cardClasses}">
            <button
              type="button"
              class="${classes}"
              data-vc-helper-id="${escapeHtml(helper.id)}"
              title="${available ? 'Show or hide ' : 'Not available: '}${escapeHtml(helper.name)}"
              ${available ? '' : 'disabled'}
            >
              <span class="vc-dock-icon" aria-hidden="true">${icon}</span>
              <span class="vc-dock-name">${escapeHtml(helper.name)}</span>
            </button>
            ${actions?.length ? `
              <div class="vc-dock-action-row">
                ${actions.map(action => `
                  <button
                    type="button"
                    class="vc-dock-action"
                    data-vc-helper-id="${escapeHtml(helper.id)}"
                    data-vc-action-id="${escapeHtml(action.id)}"
                    title="${escapeHtml(action.label)}"
                    ${action.disabled ? 'disabled' : ''}
                  >
                    ${ICONS[action.icon] || ''}
                    <span>${escapeHtml(action.label)}</span>
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
      };

      dock.innerHTML = `
        <div class="vc-dock-header">
          <div class="vc-dock-title">Assessment Helpers</div>
          <button type="button" class="vc-dock-toggle" title="Minimise" aria-label="Minimise dock">
            ${ICONS.minimize}
          </button>
        </div>
        <div class="vc-dock-list">
          ${activeHelpers.length
            ? activeHelpers.map(renderHelperButton).join('')
            : '<div class="vc-dock-empty">Open a helper or expand Other helpers.</div>'}
        </div>
        ${inactiveHelpers.length ? `
          <details class="vc-dock-unavailable" ${unavailableOpen ? 'open' : ''}>
            <summary>Other helpers <span>${inactiveHelpers.length}</span></summary>
            <div class="vc-dock-unavailable-list">
              ${inactiveHelpers.map(renderHelperButton).join('')}
            </div>
          </details>
        ` : ''}
      `;

      dock.querySelector('.vc-dock-toggle')?.addEventListener('click', () => updateUi({ minimized: true }));
      dock.querySelector('.vc-dock-unavailable')?.addEventListener('toggle', event => {
        const uiNow = loadUi();
        saveUi({ ...uiNow, unavailableOpen: event.currentTarget.open });
      });
      dock.querySelectorAll('[data-vc-action-id]').forEach(button => {
        button.addEventListener('click', async event => {
          event.stopPropagation();
          try {
            const helper = HELPERS.find(item => item.id === button.dataset.vcHelperId);
            const action = helper
              ? getDockActions(helper).find(item => item.id === button.dataset.vcActionId)
              : null;
            if (!action || action.disabled) return;
            await action.run?.();
            renderDock();
          } catch (err) {
            console.warn('[Assessment Helpers Dock] Dock action failed', err);
          }
        });
      });
      dock.querySelectorAll('[data-vc-helper-id]').forEach(button => {
        if (button.dataset.vcActionId) return;
        button.addEventListener('click', () => {
          try {
            const helper = HELPERS.find(item => item.id === button.dataset.vcHelperId);
            const registered = helper ? getRegisteredHelper(helper) : null;
            if (helper && registered) {
              let open = false;
              try {
                open = !!registered.isOpen?.();
              } catch (err) {
                console.warn('[Assessment Helpers Dock] Could not read helper open state on click', helper.id, err);
                open = !!getHelperPanel(helper) && isPanelVisible(getHelperPanel(helper));
              }

              if (open) {
                setHelperHidden(helper, true);
              } else {
                clearHelperHidden(helper);
                try {
                  registered.show?.();
                  const panel = getHelperPanel(helper);
                  if (panel) {
                    panel.dataset.vcHelperDockHidden = '0';
                    delete panel.dataset.vcHelperDockPreviousDisplay;
                  }
                } catch (err) {
                  console.warn('[Assessment Helpers Dock] Registered helper show failed', helper.id, err);
                  const panel = getHelperPanel(helper);
                  if (panel) panel.style.removeProperty('display');
                }
                renderDock();
                window.setTimeout(renderDock, 120);
              }
              return;
            }

            const panel = helper ? getHelperPanel(helper) : null;
            if (!helper || !panel) return;

            setHelperHidden(helper, isPanelVisible(panel));
          } catch (err) {
            console.warn('[Assessment Helpers Dock] Helper toggle failed', err);
          }
        });
      });
      attachDockDragging(dock);
    } finally {
      resumeObserver();
    }
  }

  function startObserver() {
    dockObserver = new MutationObserver(mutations => {
      if (mutations.some(mutationMayAffectDock)) scheduleRenderDock();
    });
    resumeObserver();
  }

  function init() {
    renderDock();
    startObserver();
    window.addEventListener('pageshow', renderDock);
    window.addEventListener('focus', renderDock);
    window.addEventListener('assessment-helper-registered', renderDock);
    window.addEventListener('viscomm-helper-registered', renderDock);
    window.addEventListener('assessment-helper-status-changed', scheduleRenderDock);
    window.addEventListener('viscomm-helper-status-changed', scheduleRenderDock);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
