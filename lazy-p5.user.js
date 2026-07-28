// ==UserScript==
// @name         lazyP5 - Sketch preview for Canvas
// @namespace    https://github.com/DashDot-Dash/AssessmentHelpers
// @version      1.5.0
// @description  Adds click-to-run previews for p5.js Web Editor links in Canvas.
// @match        *://*/courses/*/gradebook/speed_grader*
// @match        *://*/courses/*/gradebook/speed_grader?*
// @match        *://*/gradebook/speed_grader*
// @updateURL    https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/lazy-p5.user.js
// @downloadURL  https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/lazy-p5.user.js
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const CONFIG = Object.freeze({
    iframeHeight: 500,
    observerDebounceMs: 160,
    loadNoticeMs: 12000,
    supportedHostname: 'editor.p5js.org',
    cardClass: 'lazyP5-card',
    enhancedAttribute: 'data-lazyP5-enhanced',
    debug: false
  });

  const SELECTORS = Object.freeze({
    card: `.${CONFIG.cardClass}`,
    excludedTextParent: [
      'a',
      'button',
      'input',
      'option',
      'pre',
      'script',
      'select',
      'style',
      'textarea',
      '[contenteditable=""]',
      '[contenteditable="true"]',
      '[contenteditable="plaintext-only"]',
      `.${CONFIG.cardClass}`
    ].join(', ')
  });

  const state = {
    nextCardId: 1,
    observer: null,
    scanTimer: null,
    pendingRoots: new Set(),
    textSnapshots: new WeakMap(),
    cardByAnchor: new WeakMap(),
    controllerByCard: new WeakMap()
  };

  const P5_TEXT_URL_PATTERN =
    /https:\/\/editor\.p5js\.org\/[^\s<>"']+/giu;

  init();

  function init() {
    if (!document.head || !document.body) {
      window.setTimeout(init, 100);
      return;
    }

    addStyles();
    scanRoot(document.body);
    observeCanvasChanges();
  }

  function observeCanvasChanges() {
    state.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (isInsideLazyCard(mutation.target)) continue;

        if (mutation.type === 'characterData') {
          scheduleScan(mutation.target.parentElement);
          continue;
        }

        if (mutation.type === 'attributes') {
          scheduleScan(mutation.target);
          continue;
        }

        for (const removedNode of mutation.removedNodes) {
          cleanupRemovedContent(removedNode);
        }
        if (mutation.removedNodes.length) {
          scheduleScan(mutation.target);
        }

        for (const addedNode of mutation.addedNodes) {
          if (
            addedNode.nodeType === Node.ELEMENT_NODE &&
            addedNode.matches(SELECTORS.card)
          ) {
            continue;
          }

          scheduleScan(
            addedNode.nodeType === Node.TEXT_NODE
              ? addedNode.parentElement
              : addedNode
          );
        }
      }
    });

    state.observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['href'],
      characterData: true,
      childList: true,
      subtree: true
    });
  }

  function scheduleScan(root) {
    if (!root || !root.isConnected || isInsideLazyCard(root)) return;

    state.pendingRoots.add(root);
    window.clearTimeout(state.scanTimer);
    state.scanTimer = window.setTimeout(flushPendingScans, CONFIG.observerDebounceMs);
  }

  function flushPendingScans() {
    state.scanTimer = null;

    const roots = [...state.pendingRoots].filter((root) => root.isConnected);
    state.pendingRoots.clear();

    // If both a container and one of its descendants were queued, scanning the
    // container once is enough.
    const minimalRoots = roots.filter(
      (root, index) =>
        !roots.some(
          (other, otherIndex) =>
            index !== otherIndex &&
            other.nodeType === Node.ELEMENT_NODE &&
            other.contains(root)
        )
    );

    for (const root of minimalRoots) {
      scanRoot(root);
    }
  }

  function scanRoot(root) {
    if (!root || !root.isConnected || isInsideLazyCard(root)) return;

    try {
      const { anchors, textEntries } = findP5Links(root);

      for (const anchor of anchors) {
        const sketch = getSketchFromAnchor(anchor);
        if (sketch) {
          enhanceP5Link(anchor, sketch);
        } else if (anchor.hasAttribute(CONFIG.enhancedAttribute)) {
          removeEnhancement(anchor);
        }
      }

      // Linkifying replaces each source text node, so do this after processing
      // anchors that already existed in the scanned subtree.
      for (const entry of textEntries) {
        linkifyPlainTextEntry(entry);
      }
    } catch (error) {
      console.warn('[lazyP5] A Canvas content scan was skipped:', error);
    }
  }

  function findP5Links(root) {
    return {
      anchors: findCandidateAnchors(root),
      textEntries: findPlainTextUrls(root)
    };
  }

  function findCandidateAnchors(root) {
    const anchors = [];

    if (root.nodeType === Node.ELEMENT_NODE && root.matches('a')) {
      anchors.push(root);
    }

    if (
      root.nodeType === Node.ELEMENT_NODE ||
      root.nodeType === Node.DOCUMENT_NODE ||
      root.nodeType === Node.DOCUMENT_FRAGMENT_NODE
    ) {
      anchors.push(...root.querySelectorAll('a'));
    }

    return anchors.filter((anchor) => !anchor.closest(SELECTORS.card));
  }

  function findPlainTextUrls(root) {
    const entries = [];
    const textNodes = [];

    if (root.nodeType === Node.TEXT_NODE) {
      textNodes.push(root);
    } else if (
      root.nodeType === Node.ELEMENT_NODE ||
      root.nodeType === Node.DOCUMENT_NODE ||
      root.nodeType === Node.DOCUMENT_FRAGMENT_NODE
    ) {
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            const value = node.nodeValue || '';
            const parent = node.parentElement;

            if (!value.toLowerCase().includes(CONFIG.supportedHostname)) {
              return NodeFilter.FILTER_REJECT;
            }
            if (!parent || parent.closest(SELECTORS.excludedTextParent)) {
              return NodeFilter.FILTER_REJECT;
            }
            if (state.textSnapshots.get(node) === value) {
              return NodeFilter.FILTER_REJECT;
            }

            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      let node;
      while ((node = walker.nextNode())) {
        textNodes.push(node);
      }
    }

    for (const node of textNodes) {
      const value = node.nodeValue || '';
      const parent = node.parentElement;
      if (
        !parent ||
        parent.closest(SELECTORS.excludedTextParent) ||
        state.textSnapshots.get(node) === value
      ) {
        continue;
      }

      const matches = findP5UrlsInText(value);
      state.textSnapshots.set(node, value);
      if (matches.length) entries.push({ node, matches });
    }

    return entries;
  }

  function findP5UrlsInText(value) {
    const matches = [];
    P5_TEXT_URL_PATTERN.lastIndex = 0;

    let match;
    while ((match = P5_TEXT_URL_PATTERN.exec(value))) {
      const candidate = stripTrailingProsePunctuation(match[0]);
      const sketch = parseDirectP5Url(candidate);
      if (!sketch) continue;

      matches.push({
        start: match.index,
        end: match.index + candidate.length,
        text: candidate,
        sketch
      });
    }

    return matches;
  }

  function linkifyPlainTextEntry({ node, matches }) {
    if (!node.isConnected || !matches.length) return;

    const source = node.nodeValue || '';
    const fragment = document.createDocumentFragment();
    const generatedAnchors = [];
    let cursor = 0;

    for (const match of matches) {
      if (match.start < cursor) continue;

      fragment.append(document.createTextNode(source.slice(cursor, match.start)));

      const anchor = document.createElement('a');
      anchor.href = match.sketch.originalUrl;
      anchor.textContent = match.text;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.setAttribute('data-lazyP5-generated-link', 'true');
      fragment.append(anchor);
      generatedAnchors.push({ anchor, sketch: match.sketch });

      cursor = match.end;
    }

    fragment.append(document.createTextNode(source.slice(cursor)));
    node.replaceWith(fragment);

    for (const { anchor, sketch } of generatedAnchors) {
      enhanceP5Link(anchor, sketch);
    }
  }

  function getSketchFromAnchor(anchor) {
    // Canvas redirect links commonly retain the real URL as their visible text.
    // Prefer that value, then inspect href (including decoded redirect params).
    return parseP5Url(anchor.textContent) || parseP5Url(anchor.href);
  }

  function parseP5Url(value) {
    if (typeof value !== 'string' || !value.trim()) return null;

    const queue = [value.trim()];
    const seen = new Set();

    while (queue.length && seen.size < 24) {
      const current = queue.shift();
      if (!current || seen.has(current)) continue;
      seen.add(current);

      const direct = parseDirectP5Url(stripTrailingProsePunctuation(current));
      if (direct) return direct;

      P5_TEXT_URL_PATTERN.lastIndex = 0;
      let embedded;
      while ((embedded = P5_TEXT_URL_PATTERN.exec(current))) {
        const parsed = parseDirectP5Url(
          stripTrailingProsePunctuation(embedded[0])
        );
        if (parsed) return parsed;
      }

      // Canvas may URL-encode an outbound destination in a redirect query.
      try {
        const outerUrl = new URL(current, window.location.href);
        for (const parameterValue of outerUrl.searchParams.values()) {
          queue.push(parameterValue);
          const decoded = safelyDecodeURIComponent(parameterValue);
          if (decoded !== parameterValue) queue.push(decoded);
        }
      } catch {
        const decoded = safelyDecodeURIComponent(current);
        if (decoded !== current) queue.push(decoded);
      }
    }

    return null;
  }

  function parseDirectP5Url(value) {
    let url;
    try {
      url = new URL(value);
    } catch {
      return null;
    }

    if (
      url.protocol !== 'https:' ||
      url.hostname.toLowerCase() !== CONFIG.supportedHostname ||
      url.username ||
      url.password ||
      url.port
    ) {
      return null;
    }

    const pathMatch = url.pathname.match(
      /^\/([^/]+)\/(sketches|full)\/([^/]+)\/?$/i
    );
    if (!pathMatch) return null;

    const username = safelyDecodeURIComponent(pathMatch[1]);
    const sketchId = safelyDecodeURIComponent(pathMatch[3]);
    if (!isSafeP5PathSegment(username) || !isSafeP5PathSegment(sketchId)) {
      return null;
    }

    const encodedUsername = encodeURIComponent(username);
    const encodedSketchId = encodeURIComponent(sketchId);
    const editorUrl =
      `https://${CONFIG.supportedHostname}/${encodedUsername}/sketches/` +
      encodedSketchId;
    const sketch = {
      originalUrl: url.href,
      username,
      sketchId,
      editorUrl,
      fullUrl: ''
    };

    sketch.fullUrl = buildFullSketchUrl(sketch);
    return sketch;
  }

  function buildFullSketchUrl(sketch) {
    if (
      !sketch ||
      !isSafeP5PathSegment(sketch.username) ||
      !isSafeP5PathSegment(sketch.sketchId)
    ) {
      return null;
    }

    return (
      `https://${CONFIG.supportedHostname}/` +
      `${encodeURIComponent(sketch.username)}/full/` +
      encodeURIComponent(sketch.sketchId)
    );
  }

  function isSafeP5PathSegment(value) {
    return (
      typeof value === 'string' &&
      value.length > 0 &&
      value.length <= 200 &&
      value !== '.' &&
      value !== '..' &&
      /^[A-Za-z0-9._~-]+$/.test(value)
    );
  }

  function safelyDecodeURIComponent(value) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  function stripTrailingProsePunctuation(value) {
    let result = value.trim();

    while (/[.,;:!?]$/.test(result)) {
      result = result.slice(0, -1);
    }

    const bracketPairs = [
      ['(', ')'],
      ['[', ']'],
      ['{', '}']
    ];

    let changed = true;
    while (changed && result) {
      changed = false;
      for (const [opening, closing] of bracketPairs) {
        if (
          result.endsWith(closing) &&
          countCharacter(result, closing) > countCharacter(result, opening)
        ) {
          result = result.slice(0, -1);
          changed = true;
        }
      }
    }

    return result;
  }

  function countCharacter(value, character) {
    let count = 0;
    for (const item of value) {
      if (item === character) count += 1;
    }
    return count;
  }

  function enhanceP5Link(anchor, sketch) {
    if (!anchor.isConnected || anchor.closest(SELECTORS.card)) return;

    const sketchKey = `${sketch.username}/${sketch.sketchId}`;
    let existingCard = state.cardByAnchor.get(anchor);

    if (!existingCard && anchor.dataset.lazyP5CardId) {
      existingCard = document.getElementById(anchor.dataset.lazyP5CardId);
    }
    if (existingCard && !existingCard.matches(SELECTORS.card)) {
      existingCard = null;
    }

    if (
      existingCard?.isConnected &&
      existingCard.dataset.lazyP5SketchKey === sketchKey
    ) {
      anchor.setAttribute(CONFIG.enhancedAttribute, 'true');
      return;
    }

    if (existingCard) {
      destroyCard(existingCard);
    }

    const card = createPreviewCard(sketch);
    insertPreviewCard(anchor, card);
    anchor.setAttribute(CONFIG.enhancedAttribute, 'true');
    anchor.dataset.lazyP5CardId = card.id;
    state.cardByAnchor.set(anchor, card);

    debugLog('Enhanced p5 link', sketch.editorUrl);
  }

  function cleanupRemovedContent(root) {
    if (root.nodeType !== Node.ELEMENT_NODE) return;

    if (root.matches(SELECTORS.card)) {
      state.controllerByCard.get(root)?.destroy();
      state.controllerByCard.delete(root);
      return;
    }

    const anchors = [];
    if (root.matches(`a[${CONFIG.enhancedAttribute}]`)) anchors.push(root);
    anchors.push(
      ...root.querySelectorAll(`a[${CONFIG.enhancedAttribute}]`)
    );

    for (const anchor of anchors) {
      removeEnhancement(anchor);
    }
  }

  function insertPreviewCard(anchor, card) {
    // Keep prose intact: when a URL sits inside a paragraph, place the card
    // after that paragraph instead of between the URL and its punctuation.
    const paragraph = anchor.closest('p');
    if (paragraph) {
      paragraph.insertAdjacentElement('afterend', card);
      return;
    }

    // These elements cannot safely gain an arbitrary sibling (for example, a
    // div directly inside a tr or ul), so keep the card inside the container.
    const constrainedContainer = anchor.closest(
      'blockquote, dd, dt, figcaption, li, td, th'
    );
    if (constrainedContainer) {
      constrainedContainer.append(card);
      return;
    }

    anchor.insertAdjacentElement('afterend', card);
  }

  function removeEnhancement(anchor) {
    const card =
      state.cardByAnchor.get(anchor) ||
      (anchor.dataset.lazyP5CardId
        ? document.getElementById(anchor.dataset.lazyP5CardId)
        : null);

    if (card) destroyCard(card);
    anchor.removeAttribute(CONFIG.enhancedAttribute);
    delete anchor.dataset.lazyP5CardId;
    state.cardByAnchor.delete(anchor);
  }

  function createPreviewCard(sketch) {
    const card = document.createElement('section');
    card.id = `lazyP5-card-${state.nextCardId++}`;
    card.className = CONFIG.cardClass;
    card.dataset.lazyP5SketchKey = `${sketch.username}/${sketch.sketchId}`;
    card.setAttribute(
      'aria-label',
      `lazyP5 preview controls for ${sketch.username}'s p5 sketch`
    );

    const header = document.createElement('div');
    header.className = 'lazyP5-header';

    const heading = document.createElement('strong');
    heading.className = 'lazyP5-label';
    heading.textContent = 'lazyP5 · Sketch preview for Canvas';

    const identity = document.createElement('span');
    identity.className = 'lazyP5-identity';
    identity.textContent = `${sketch.username} / ${sketch.sketchId}`;
    identity.title = `${sketch.username} / ${sketch.sketchId}`;

    header.append(heading, identity);

    const primaryControls = document.createElement('div');
    primaryControls.className = 'lazyP5-controls';

    const runButton = createButton('Run sketch', 'Run this p5 sketch');
    runButton.classList.add('lazyP5-button-primary');
    const editorLink = createExternalLink(
      'Open editor',
      sketch.editorUrl,
      'Open this sketch in the p5.js Web Editor'
    );
    const fullLink = createExternalLink(
      'Open full ↗',
      sketch.fullUrl,
      'Open the full p5 sketch in a new tab'
    );
    primaryControls.append(runButton, editorLink, fullLink);

    const preview = document.createElement('div');
    preview.className = 'lazyP5-preview';
    preview.hidden = true;

    const secondaryControls = document.createElement('div');
    secondaryControls.className = 'lazyP5-controls lazyP5-running-controls';
    secondaryControls.hidden = true;

    const reloadButton = createButton('Reload', 'Reload this p5 sketch');
    const stopButton = createButton('Stop', 'Stop this p5 sketch');
    const collapseButton = createButton(
      'Collapse',
      'Collapse the embedded p5 sketch'
    );
    collapseButton.setAttribute('aria-expanded', 'true');
    secondaryControls.append(reloadButton, stopButton, collapseButton);

    const status = document.createElement('div');
    status.className = 'lazyP5-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = '';

    card.append(
      header,
      primaryControls,
      preview,
      secondaryControls,
      status
    );

    let iframe = null;
    let loadTimer = null;
    let collapsed = false;

    function clearLoadTimer() {
      window.clearTimeout(loadTimer);
      loadTimer = null;
    }

    function removeIframe() {
      clearLoadTimer();
      if (iframe) {
        iframe.remove();
        iframe = null;
      }
      preview.replaceChildren();
    }

    function createIframe() {
      removeIframe();
      collapsed = false;
      card.classList.add('is-open');
      preview.hidden = false;
      collapseButton.textContent = 'Collapse';
      collapseButton.setAttribute(
        'aria-label',
        'Collapse the embedded p5 sketch'
      );
      collapseButton.setAttribute('aria-expanded', 'true');

      iframe = document.createElement('iframe');
      iframe.className = 'lazyP5-iframe';
      iframe.src = sketch.fullUrl;
      iframe.title = `p5 sketch by ${sketch.username}`;
      iframe.height = String(CONFIG.iframeHeight);
      iframe.loading = 'eager';
      iframe.allow = 'camera; microphone; autoplay; fullscreen';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';

      // A restrictive sandbox blocks normal p5 JavaScript and common sketch
      // features. Combining allow-scripts and allow-same-origin provides little
      // extra isolation here, so the cross-origin iframe boundary is retained
      // and no sandbox attribute is added.

      iframe.addEventListener(
        'load',
        () => {
          clearLoadTimer();
          status.textContent =
            'Sketch loaded. If it appears blank, use Open editor or Reload.';
        },
        { once: true }
      );
      iframe.addEventListener(
        'error',
        () => {
          clearLoadTimer();
          status.textContent =
            'The preview could not load. The original and editor links still work.';
        },
        { once: true }
      );

      preview.append(iframe);
      runButton.disabled = true;
      runButton.textContent = 'Running';
      secondaryControls.hidden = false;
      status.textContent =
        'Loading sketch… Your browser may still require interaction before audio starts.';

      loadTimer = window.setTimeout(() => {
        status.textContent =
          'The sketch is taking a while to load. Try Reload or Open editor.';
      }, CONFIG.loadNoticeMs);
    }

    function stopSketch() {
      removeIframe();
      collapsed = false;
      card.classList.remove('is-open');
      preview.hidden = true;
      secondaryControls.hidden = true;
      runButton.disabled = false;
      runButton.textContent = 'Run sketch';
      status.textContent = '';
    }

    function toggleCollapsed() {
      if (!iframe) return;

      collapsed = !collapsed;
      preview.hidden = collapsed;
      collapseButton.textContent = collapsed ? 'Expand' : 'Collapse';
      collapseButton.setAttribute(
        'aria-label',
        collapsed
          ? 'Expand the embedded p5 sketch'
          : 'Collapse the embedded p5 sketch'
      );
      collapseButton.setAttribute('aria-expanded', String(!collapsed));
      status.textContent = collapsed
        ? 'Sketch preview collapsed; it is still running.'
        : 'Sketch preview expanded.';
    }

    runButton.addEventListener('click', createIframe);
    reloadButton.addEventListener('click', createIframe);
    stopButton.addEventListener('click', stopSketch);
    collapseButton.addEventListener('click', toggleCollapsed);

    state.controllerByCard.set(card, {
      destroy() {
        removeIframe();
      }
    });

    return card;
  }

  function createButton(text, accessibleLabel) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lazyP5-button';
    button.textContent = text;
    button.setAttribute('aria-label', accessibleLabel);
    return button;
  }

  function createExternalLink(text, href, accessibleLabel) {
    const link = document.createElement('a');
    link.className = 'lazyP5-button lazyP5-link';
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = text;
    link.setAttribute('aria-label', accessibleLabel);
    return link;
  }

  function destroyCard(card) {
    state.controllerByCard.get(card)?.destroy();
    state.controllerByCard.delete(card);
    card.remove();
  }

  function isInsideLazyCard(node) {
    const element =
      node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    return Boolean(element?.closest?.(SELECTORS.card));
  }

  function addStyles() {
    if (document.getElementById('lazyP5-styles')) return;

    const style = document.createElement('style');
    style.id = 'lazyP5-styles';
    style.textContent = `
      /* AH-TOKENS v2 — NOT the recorded suite baseline in design/tokens/tokens.json (still v1).
         This block adopts design/proposals/0002 §A (yellow accent) and §B (cool grey ramp),
         matching the same v2 values already shipped across the rest of the suite (Benchmarker
         @ 1.3.0, Dock @ 1.2.0, GradeBridge @ 1.2.0, Copy/Paster @ 1.2.0, ETA @ 1.3.0, Tutorial
         Sorter @ 1.3.0). Intentionally diverges from dock.tokens.css until the rest of the
         suite catches up — see design/tokens/README.md on scripts coexisting on different
         token versions.
         Scope: .lazyP5-card, not #id or :root. Unlike the panel-based helpers, several of
         these cards can exist on one page at once (one per sketch link) — there is no single
         root element to hang an id on, so every card instance carries its own copy of these
         custom properties, same as the id-scoped pattern elsewhere. */
      .lazyP5-card {
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
        --ah-z: 1;
      }
      /* /AH-TOKENS */

      .lazyP5-card {
        box-sizing: border-box;
        display: block;
        width: min(100%, 960px);
        margin: 0.65rem 0 0.9rem;
        padding: 0.65rem;
        border: 1px solid var(--ah-border);
        border-radius: 10px;
        background: var(--ah-shell);
        color: var(--ah-text);
        box-shadow: 0 8px 24px rgba(0,0,0,0.22);
        font: var(--ah-font);
        text-align: left;
        overflow: hidden;
      }

      .lazyP5-card,
      .lazyP5-card * {
        box-sizing: border-box;
      }

      .lazyP5-card .lazyP5-header {
        position: relative;
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.6rem;
        margin: -0.65rem -0.65rem 0.5rem -0.65rem;
        padding: 10px 12px 10px 24px;
        background: var(--ah-header);
        border-bottom: 1px solid var(--ah-border-soft);
      }

      .lazyP5-card .lazyP5-header::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 12px;
        background: var(--ah-accent);
        transition: opacity 120ms ease;
      }

      .lazyP5-card.is-open .lazyP5-header::before {
        opacity: 0;
      }

      .lazyP5-card .lazyP5-label {
        color: var(--ah-text);
        font-size: 12px;
        font-weight: 400;
      }

      .lazyP5-card .lazyP5-identity {
        min-width: 0;
        overflow: hidden;
        color: var(--ah-muted);
        font-size: 11px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .lazyP5-card .lazyP5-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .lazyP5-card .lazyP5-running-controls {
        margin-top: 0.5rem;
      }

      .lazyP5-card .lazyP5-controls[hidden],
      .lazyP5-card .lazyP5-preview[hidden] {
        display: none;
      }

      .lazyP5-card .lazyP5-button {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 27px;
        margin: 0;
        padding: 4px 8px;
        border: 1px solid rgba(143,145,148,0.32);
        border-radius: 7px;
        background: var(--ah-header);
        color: #E4E4E7;
        font: inherit;
        font-size: 11px;
        font-weight: 700;
        line-height: 1;
        text-decoration: none;
        cursor: pointer;
      }

      .lazyP5-card .lazyP5-button:hover:not(:disabled) {
        border-color: rgba(143,145,148,0.65);
        background: var(--ah-control-hover);
        color: var(--ah-text);
        text-decoration: none;
      }

      .lazyP5-card .lazyP5-button-primary {
        border-color: var(--ah-accent);
        background: var(--ah-accent);
        color: var(--ah-accent-ink);
      }

      .lazyP5-card .lazyP5-button-primary:hover:not(:disabled) {
        border-color: var(--ah-accent-hover);
        background: var(--ah-accent-hover);
        color: var(--ah-accent-ink);
      }

      .lazyP5-card .lazyP5-button:focus-visible {
        outline: 2px solid var(--ah-accent-hover);
        outline-offset: 2px;
      }

      .lazyP5-card .lazyP5-button:disabled {
        cursor: default;
        opacity: 0.48;
      }

      .lazyP5-card .lazyP5-preview {
        width: 100%;
        min-height: 220px;
        margin-top: 0.55rem;
        overflow: hidden;
        border: 1px solid var(--ah-border-card);
        border-radius: 6px;
        background: var(--ah-header);
      }

      .lazyP5-card .lazyP5-iframe {
        display: block;
        width: 100%;
        height: ${CONFIG.iframeHeight}px;
        min-height: 280px;
        border: 0;
        background: #fff;
      }

      .lazyP5-card .lazyP5-status {
        min-height: 1.2em;
        margin-top: 0.5rem;
        color: var(--ah-muted);
        font-size: 11px;
      }

      .lazyP5-card .lazyP5-status:empty {
        min-height: 0;
        margin-top: 0;
      }

      @media (max-width: 600px) {
        .lazyP5-card {
          padding: 0.6rem;
        }

        .lazyP5-card .lazyP5-header {
          align-items: flex-start;
          flex-direction: column;
          gap: 0.2rem;
          margin: -0.6rem -0.6rem 0.5rem -0.6rem;
        }

        .lazyP5-card .lazyP5-iframe {
          height: max(320px, 65vh);
          min-height: 320px;
        }
      }
    `;

    document.head.append(style);
  }

  function debugLog(...values) {
    if (CONFIG.debug) console.debug('[lazyP5]', ...values);
  }
})();
