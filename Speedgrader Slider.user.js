// ==UserScript==
// @name         Speedgrader Slider
// @namespace    VisComm@UON
// @description  Adds a score slider to each criterion in Canvas SpeedGrader rubrics, scoped to the selected rating band
// @version      3.1
// @require      File:///Users/jbs939/Desktop/CanvasHelpers/Speedgrader Slider.user.js
// @include      https://*/courses/*/gradebook/speed_grader?*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const ENHANCED_ATTR = 'data-jg-slider-enhanced';
  const WRAP_CLASS = 'jg-slider-wrap';
  const SLIDER_CLASS = 'jg-slider';
  const LABEL_CLASS = 'jg-slider-label';


  addStyles();
  boot();

  function boot() {
    enhanceAll();

    const observer = new MutationObserver(() => {
      enhanceAll();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function enhanceAll() {
    const inputs = document.querySelectorAll('input[data-testid^="criterion-score-"]');
    inputs.forEach(enhanceInput);
  }

  function enhanceInput(input) {
    if (!input || input.getAttribute(ENHANCED_ATTR) === 'true') return;

    const criterionId = getCriterionIdFromInput(input);
    if (!criterionId) return;

    const host = input.closest('span.css-j7s35e-formFieldLayout__children') || input.parentElement;
    if (!host) return;

    // avoid duplicate insertion if Canvas partially rerenders
    const existingNext = host.nextElementSibling;
    if (existingNext && existingNext.classList?.contains(WRAP_CLASS)) {
      input.setAttribute(ENHANCED_ATTR, 'true');
      return;
    }

    const wrap = document.createElement('div');
    wrap.className = WRAP_CLASS;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = SLIDER_CLASS;
    slider.disabled = true;
    slider.min = '0';
    slider.max = '0';
    slider.step = '0.1';
    slider.value = '0';


wrap.appendChild(slider);


     host.insertAdjacentElement('afterend', wrap);

    slider.addEventListener('input', () => {
      const value = Number(slider.value);
      setCanvasInputValue(input, value);
    });

    slider.addEventListener('change', () => {
      const value = Number(slider.value);
      setCanvasInputValue(input, value);
    });

    input.addEventListener('input', () => {
      syncSliderFromInput(input, slider);
    });

    input.addEventListener('change', () => {
      syncSliderFromInput(input, slider);
    });

attachRatingListeners(criterionId, () => {
  setTimeout(() => {
    updateSliderForSelectedBand(criterionId, input, slider);
  }, 50);
});

// initialize once in case a band is already selected
setTimeout(() => {
  updateSliderForSelectedBand(criterionId, input, slider);
}, 100);

    input.setAttribute(ENHANCED_ATTR, 'true');
  }

  function attachRatingListeners(criterionId, callback) {
    const buttons = getRatingButtons(criterionId);
    buttons.forEach(btn => {
      if (btn.dataset.jgSliderBound === 'true') return;
      btn.addEventListener('click', callback);
      btn.dataset.jgSliderBound = 'true';
    });
  }

function updateSliderForSelectedBand(criterionId, input, slider) {
  const selectedButton = getSelectedRatingButton(criterionId);

  if (!selectedButton) {
    slider.disabled = true;
    return;
  }

  const range = getRangeFromRatingButton(selectedButton);
  if (!range) {
    slider.disabled = true;
    return;
  }

  const { min, max } = range;
  const step = (Number.isInteger(min) && Number.isInteger(max)) ? 1 : 0.1;

  slider.disabled = false;
  slider.min = String(min);
  slider.max = String(max);
  slider.step = String(step);

  const value = clamp(parseScore(input.value, max), min, max);
  slider.value = String(value);
}

  function syncSliderFromInput(input, slider, label) {
    if (slider.disabled) return;

    const min = Number(slider.min);
    const max = Number(slider.max);
    const value = clamp(parseScore(input.value, Number(slider.value)), min, max);
    slider.value = String(value);
    label.textContent = formatScore(value);
  }

  function getCriterionIdFromInput(input) {
    const testId = input.getAttribute('data-testid') || '';
    const match = testId.match(/^criterion-score-(.+)$/);
    return match ? match[1] : null;
  }

  function getRatingButtons(criterionId) {
    return Array.from(
      document.querySelectorAll(`button[data-testid^="traditional-criterion-${criterionId}-ratings-"]`)
    );
  }

  function getSelectedRatingButton(criterionId) {
    const buttons = getRatingButtons(criterionId);

    for (const btn of buttons) {
      const selectedMarker = btn.querySelector(`[data-testid*="traditional-criterion-${criterionId}-ratings-"][data-testid$="-selected"]`);
      if (selectedMarker) return btn;

      const sr = btn.querySelector('.css-r9cwls-screenReaderContent');
      if (sr && sr.textContent.trim() === 'Selected') return btn;
    }

    return null;
  }

  function getRangeFromRatingButton(button) {
    const pointsEl = button.querySelector('[data-testid$="-points"]');
    if (!pointsEl) return null;

    const text = pointsEl.textContent.trim();

    let match = text.match(/([\d.]+)\s*to\s*>\s*([\d.]+)/i);
    if (match) {
      const a = Number(match[1]);
      const b = Number(match[2]);
      if (!Number.isNaN(a) && !Number.isNaN(b)) {
        return { min: Math.min(a, b), max: Math.max(a, b) };
      }
    }

    match = text.match(/([\d.]+)/);
    if (match) {
      const v = Number(match[1]);
      if (!Number.isNaN(v)) {
        return { min: v, max: v };
      }
    }

    return null;
  }

  function parseScore(raw, fallback) {
    const text = String(raw || '').trim();
    const match = text.match(/\d+(?:\.\d+)?/);
    if (!match) return fallback;
    const value = Number(match[0]);
    return Number.isNaN(value) ? fallback : value;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function formatScore(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

function setCanvasInputValue(input, value) {
  const formatted = formatScore(value);

  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;

  if (setter) setter.call(input, formatted);
  else input.value = formatted;

  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.focus();
  input.blur();
}
  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .${WRAP_CLASS} {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 20px;
        margin-bottom: 10px;
        max-width: 280px;
        flex-wrap: wrap;
      }
      .${SLIDER_CLASS} {
  width: 90px;
  min-width: 90px;
  flex: 0 0 90px;
  accent-color: rgb(16, 144, 213);
}


      .${SLIDER_CLASS}:disabled {
        opacity: 0.45;
      }
    `;
    document.head.appendChild(style);
  }
})();