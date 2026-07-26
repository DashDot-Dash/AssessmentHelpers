// ==UserScript==
// @name         LazyPadlet - Padlet Viewer for Canvas
// @namespace    https://github.com/DashDot-Dash/AssessmentHelpers
// @version      1.2.0
// @description  Adds click-to-view Padlet portals for Padlet links in Canvas.
// @match        https://*.instructure.com/*
// @grant        none
// ==/UserScript==

// University-specific example: replace the broad @match above with a line such as
// @match        https://canvas.your-university.edu.au/*

(() => {
  'use strict';

  const CONFIG = Object.freeze({
    iframeHeight: 650,
    observerDebounceMs: 160,
    loadNoticeMs: 15000,
    supportedHostnames: new Set(['padlet.com', 'www.padlet.com']),
    canonicalHostname: 'padlet.com',
    cardClass: 'lazypadlet-card',
    enhancedAttribute: 'data-lazypadlet-enhanced',
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

  const RESERVED_FIRST_PATH_SEGMENTS = new Set([
    'about',
    'auth',
    'dashboard',
    'embed',
    'gallery',
    'help',
    'privacy',
    'settings',
    'site',
    'templates',
    'terms'
  ]);

  const state = {
    nextCardId: 1,
    observer: null,
    scanTimer: null,
    pendingRoots: new Set(),
    textSnapshots: new WeakMap(),
    cardByAnchor: new WeakMap(),
    controllerByCard: new WeakMap()
  };

  const PADLET_TEXT_URL_PATTERN =
    /https:\/\/(?:www\.)?padlet\.com\/[^\s<>"']+/giu;

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
        if (isInsideLazyPadletCard(mutation.target)) continue;

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
    if (!root || !root.isConnected || isInsideLazyPadletCard(root)) return;

    state.pendingRoots.add(root);
    window.clearTimeout(state.scanTimer);
    state.scanTimer = window.setTimeout(
      flushPendingScans,
      CONFIG.observerDebounceMs
    );
  }

  function flushPendingScans() {
    state.scanTimer = null;

    const roots = [...state.pendingRoots].filter((root) => root.isConnected);
    state.pendingRoots.clear();

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
    if (!root || !root.isConnected || isInsideLazyPadletCard(root)) return;

    try {
      const { anchors, textEntries } = findPadletLinks(root);

      for (const anchor of anchors) {
        const padlet = getPadletFromAnchor(anchor);
        if (padlet) {
          enhancePadletLink(anchor, padlet);
        } else if (anchor.hasAttribute(CONFIG.enhancedAttribute)) {
          removeEnhancement(anchor);
        }
      }

      for (const entry of textEntries) {
        linkifyPlainTextEntry(entry);
      }
    } catch (error) {
      console.warn('[LazyPadlet] A Canvas content scan was skipped:', error);
    }
  }

  function findPadletLinks(root) {
    return {
      anchors: findCandidateAnchors(root),
      textEntries: findPlainTextPadletUrls(root)
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

  function findPlainTextPadletUrls(root) {
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

            if (!value.toLowerCase().includes('padlet.com')) {
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

      const matches = findPadletUrlsInText(value);
      state.textSnapshots.set(node, value);
      if (matches.length) entries.push({ node, matches });
    }

    return entries;
  }

  function findPadletUrlsInText(value) {
    const matches = [];
    PADLET_TEXT_URL_PATTERN.lastIndex = 0;

    let match;
    while ((match = PADLET_TEXT_URL_PATTERN.exec(value))) {
      const candidate = stripTrailingProsePunctuation(match[0]);
      const padlet = parseDirectPadletUrl(candidate);
      if (!padlet) continue;

      matches.push({
        start: match.index,
        end: match.index + candidate.length,
        text: candidate,
        padlet
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
      anchor.href = match.padlet.originalUrl;
      anchor.textContent = match.text;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.setAttribute('data-lazypadlet-generated-link', 'true');
      fragment.append(anchor);
      generatedAnchors.push({ anchor, padlet: match.padlet });

      cursor = match.end;
    }

    fragment.append(document.createTextNode(source.slice(cursor)));
    node.replaceWith(fragment);

    for (const { anchor, padlet } of generatedAnchors) {
      enhancePadletLink(anchor, padlet);
    }
  }

  function getPadletFromAnchor(anchor) {
    // Canvas redirect links often expose the real destination as visible text.
    return parsePadletUrl(anchor.textContent) || parsePadletUrl(anchor.href);
  }

  function parsePadletUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;

    const queue = [value.trim()];
    const seen = new Set();

    while (queue.length && seen.size < 24) {
      const current = queue.shift();
      if (!current || seen.has(current)) continue;
      seen.add(current);

      const direct = parseDirectPadletUrl(
        stripTrailingProsePunctuation(current)
      );
      if (direct) return direct;

      PADLET_TEXT_URL_PATTERN.lastIndex = 0;
      let embedded;
      while ((embedded = PADLET_TEXT_URL_PATTERN.exec(current))) {
        const parsed = parseDirectPadletUrl(
          stripTrailingProsePunctuation(embedded[0])
        );
        if (parsed) return parsed;
      }

      // Canvas outbound-link wrappers may URL-encode the Padlet destination.
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

  function parseDirectPadletUrl(value) {
    let url;
    try {
      url = new URL(value);
    } catch {
      return null;
    }

    if (
      url.protocol !== 'https:' ||
      !CONFIG.supportedHostnames.has(url.hostname.toLowerCase()) ||
      url.username ||
      url.password ||
      url.port
    ) {
      return null;
    }

    const pathSegments = url.pathname
      .split('/')
      .filter(Boolean)
      .map(safelyDecodeURIComponent);

    if (
      pathSegments.length === 2 &&
      pathSegments[0].toLowerCase() === 'embed'
    ) {
      const padletId = pathSegments[1];
      if (!isSafePadletId(padletId)) return null;

      const embedUrl = buildPadletEmbedUrl(padletId);
      return {
        originalUrl: url.href,
        owner: '',
        slug: '',
        padletId,
        postId: '',
        publicUrl: embedUrl,
        embedUrl,
        viewUrl: embedUrl,
        portalKey: `board:${padletId}`
      };
    }

    if (pathSegments.length !== 2 && pathSegments.length !== 4) return null;

    const owner = pathSegments[0];
    const slug = pathSegments[1];
    if (
      RESERVED_FIRST_PATH_SEGMENTS.has(owner.toLowerCase()) ||
      !isSafePublicPathSegment(owner) ||
      !isSafePublicPathSegment(slug)
    ) {
      return null;
    }

    let postId = '';
    if (pathSegments.length === 4) {
      if (
        pathSegments[2].toLowerCase() !== 'wish' ||
        !isSafePadletPostId(pathSegments[3])
      ) {
        return null;
      }
      postId = pathSegments[3];
    }

    const padletId = extractPadletId(slug);
    if (!padletId && !postId) {
      // A customised Padlet alias does not reveal the board's embed ID.
      // Leave it untouched rather than constructing a broken /embed/ URL.
      return null;
    }

    let publicUrl =
      `https://${CONFIG.canonicalHostname}/` +
      `${encodeURIComponent(owner)}/${encodeURIComponent(slug)}`;
    if (postId) {
      publicUrl += `/wish/${encodeURIComponent(postId)}`;
    }

    const embedUrl = padletId ? buildPadletEmbedUrl(padletId) : null;

    return {
      originalUrl: url.href,
      owner,
      slug,
      padletId,
      postId,
      publicUrl,
      embedUrl,
      // Padlet has a board embed endpoint, but no documented single-post
      // equivalent. Its shareable /wish/ URL opens the expanded post view.
      viewUrl: postId ? publicUrl : embedUrl,
      portalKey: postId
        ? `post:${owner}/${slug}/${postId}`
        : `board:${padletId}`
    };
  }

  function extractPadletId(slug) {
    const permanentLinkMatch = slug.match(/-([A-Za-z0-9]{8,32})$/);
    if (permanentLinkMatch && isSafePadletId(permanentLinkMatch[1])) {
      return permanentLinkMatch[1];
    }

    // Padlet's older URLs used the board ID as the complete second segment.
    return isSafePadletId(slug) ? slug : null;
  }

  function buildPadletEmbedUrl(padletId) {
    if (!isSafePadletId(padletId)) return null;
    return (
      `https://${CONFIG.canonicalHostname}/embed/` +
      encodeURIComponent(padletId)
    );
  }

  function isSafePadletId(value) {
    return (
      typeof value === 'string' &&
      /^[A-Za-z0-9]{8,32}$/.test(value)
    );
  }

  function isSafePadletPostId(value) {
    return (
      typeof value === 'string' &&
      /^(?:post_)?[A-Za-z0-9_-]{6,80}$/.test(value)
    );
  }

  function isSafePublicPathSegment(value) {
    return (
      typeof value === 'string' &&
      value.length > 0 &&
      value.length <= 240 &&
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

  function enhancePadletLink(anchor, padlet) {
    if (!anchor.isConnected || anchor.closest(SELECTORS.card)) return;

    let existingCard = state.cardByAnchor.get(anchor);
    if (!existingCard && anchor.dataset.lazypadletCardId) {
      existingCard = document.getElementById(
        anchor.dataset.lazypadletCardId
      );
    }
    if (existingCard && !existingCard.matches(SELECTORS.card)) {
      existingCard = null;
    }

    if (
      existingCard?.isConnected &&
      existingCard.dataset.lazypadletKey === padlet.portalKey
    ) {
      anchor.setAttribute(CONFIG.enhancedAttribute, 'true');
      return;
    }

    if (existingCard) destroyCard(existingCard);

    const card = createPadletPortal(padlet);
    insertPortalCard(anchor, card);
    anchor.setAttribute(CONFIG.enhancedAttribute, 'true');
    anchor.dataset.lazypadletCardId = card.id;
    state.cardByAnchor.set(anchor, card);

    debugLog('Enhanced Padlet link', padlet.publicUrl);
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

  function insertPortalCard(anchor, card) {
    // Do not split a sentence between its URL and trailing punctuation.
    const paragraph = anchor.closest('p');
    if (paragraph) {
      paragraph.insertAdjacentElement('afterend', card);
      return;
    }

    // Keep the card inside containers that cannot accept an arbitrary sibling.
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
      (anchor.dataset.lazypadletCardId
        ? document.getElementById(anchor.dataset.lazypadletCardId)
        : null);

    if (card?.matches(SELECTORS.card)) destroyCard(card);
    anchor.removeAttribute(CONFIG.enhancedAttribute);
    delete anchor.dataset.lazypadletCardId;
    state.cardByAnchor.delete(anchor);
  }

  function createPadletPortal(padlet) {
    const card = document.createElement('section');
    card.id = `lazypadlet-card-${state.nextCardId++}`;
    card.className = CONFIG.cardClass;
    card.dataset.lazypadletId = padlet.padletId;
    card.dataset.lazypadletKey = padlet.portalKey;
    const isPost = Boolean(padlet.postId);
    const portalNoun = isPost ? 'Padlet post' : 'Padlet';
    card.setAttribute(
      'aria-label',
      `LazyPadlet viewer controls for ${portalNoun} ${
        padlet.postId || padlet.padletId
      }`
    );

    const header = document.createElement('div');
    header.className = 'lazypadlet-header';

    const label = document.createElement('strong');
    label.className = 'lazypadlet-label';
    label.textContent = `LazyPadlet · ${portalNoun}`;

    const identity = document.createElement('span');
    identity.className = 'lazypadlet-identity';
    identity.textContent = isPost
      ? `${padlet.owner} / post ${padlet.postId}`
      : padlet.owner
        ? `${padlet.owner} / ${padlet.padletId}`
        : padlet.padletId;
    identity.title = identity.textContent;
    header.append(label, identity);

    const primaryControls = document.createElement('div');
    primaryControls.className = 'lazypadlet-controls';

    const viewButton = createButton(
      isPost ? 'View post' : 'View Padlet',
      `View this ${portalNoun} inside Canvas`
    );
    viewButton.classList.add('lazypadlet-button-primary');
    const openLink = createExternalLink(
      isPost ? 'Open post ↗' : 'Open Padlet ↗',
      padlet.publicUrl,
      `Open this ${portalNoun} in a new tab`
    );
    primaryControls.append(viewButton, openLink);

    const viewport = document.createElement('div');
    viewport.className = 'lazypadlet-viewport';
    viewport.hidden = true;

    const secondaryControls = document.createElement('div');
    secondaryControls.className =
      'lazypadlet-controls lazypadlet-viewing-controls';
    secondaryControls.hidden = true;

    const reloadButton = createButton('Reload', `Reload this ${portalNoun}`);
    const stopButton = createButton(
      'Stop',
      `Stop viewing this ${portalNoun}`
    );
    const collapseButton = createButton(
      'Collapse',
      `Collapse the embedded ${portalNoun}`
    );
    collapseButton.setAttribute('aria-expanded', 'true');
    secondaryControls.append(reloadButton, stopButton, collapseButton);

    const status = document.createElement('div');
    status.className = 'lazypadlet-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'Viewer is stopped.';

    card.append(
      header,
      primaryControls,
      viewport,
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
      viewport.replaceChildren();
    }

    function createIframe() {
      removeIframe();
      collapsed = false;
      viewport.hidden = false;
      collapseButton.textContent = 'Collapse';
      collapseButton.setAttribute(
        'aria-label',
        `Collapse the embedded ${portalNoun}`
      );
      collapseButton.setAttribute('aria-expanded', 'true');

      iframe = document.createElement('iframe');
      iframe.className = 'lazypadlet-iframe';
      iframe.src = padlet.viewUrl;
      iframe.title = isPost
        ? `Padlet post ${padlet.postId}`
        : `Padlet ${padlet.padletId}`;
      iframe.height = String(CONFIG.iframeHeight);
      iframe.loading = 'eager';
      iframe.allow = 'fullscreen';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';

      // Padlet needs scripts to render, while allow-scripts plus
      // allow-same-origin would add little useful sandboxing. The cross-origin
      // iframe boundary is retained and no sandbox attribute is applied.
      // Camera, microphone, location, and display capture are deliberately not
      // pre-authorised because LazyPadlet is intended as a viewing portal.

      iframe.addEventListener(
        'load',
        () => {
          clearLoadTimer();
          status.textContent = isPost
            ? 'Padlet post loaded. If it is restricted, use Open post to sign in.'
            : 'Padlet loaded. Restricted boards may still ask you to sign in.';
        },
        { once: true }
      );
      iframe.addEventListener(
        'error',
        () => {
          clearLoadTimer();
          status.textContent =
            'The Padlet viewer could not load. The original link is still available.';
        },
        { once: true }
      );

      viewport.append(iframe);
      viewButton.disabled = true;
      viewButton.textContent = 'Viewing';
      secondaryControls.hidden = false;
      status.textContent = `Loading ${portalNoun}…`;

      loadTimer = window.setTimeout(() => {
        status.textContent = isPost
          ? 'The post is taking a while to load. Try Reload or Open post.'
          : 'The Padlet is taking a while to load. Try Reload or Open Padlet.';
      }, CONFIG.loadNoticeMs);
    }

    function stopViewing() {
      removeIframe();
      collapsed = false;
      viewport.hidden = true;
      secondaryControls.hidden = true;
      viewButton.disabled = false;
      viewButton.textContent = isPost ? 'View post' : 'View Padlet';
      status.textContent = 'Viewer stopped.';
    }

    function toggleCollapsed() {
      if (!iframe) return;

      collapsed = !collapsed;
      viewport.hidden = collapsed;
      collapseButton.textContent = collapsed ? 'Expand' : 'Collapse';
      collapseButton.setAttribute(
        'aria-label',
        collapsed
          ? `Expand the embedded ${portalNoun}`
          : `Collapse the embedded ${portalNoun}`
      );
      collapseButton.setAttribute('aria-expanded', String(!collapsed));
      status.textContent = collapsed
        ? `${portalNoun} collapsed; it remains loaded.`
        : `${portalNoun} expanded.`;
    }

    viewButton.addEventListener('click', createIframe);
    reloadButton.addEventListener('click', createIframe);
    stopButton.addEventListener('click', stopViewing);
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
    button.className = 'lazypadlet-button';
    button.textContent = text;
    button.setAttribute('aria-label', accessibleLabel);
    return button;
  }

  function createExternalLink(text, href, accessibleLabel) {
    const link = document.createElement('a');
    link.className = 'lazypadlet-button lazypadlet-link';
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

  function isInsideLazyPadletCard(node) {
    const element =
      node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    return Boolean(element?.closest?.(SELECTORS.card));
  }

  function addStyles() {
    if (document.getElementById('lazypadlet-styles')) return;

    const style = document.createElement('style');
    style.id = 'lazypadlet-styles';
    style.textContent = `
      .lazypadlet-card {
        box-sizing: border-box;
        display: block;
        width: min(100%, 1100px);
        margin: 0.65rem 0 0.9rem;
        padding: 0.65rem;
        border: 1px solid rgba(255,255,255,0.08);
        border-left: 4px solid #D6A21D;
        border-radius: 10px;
        background: #18181B;
        color: #FAFAFA;
        box-shadow: 0 8px 24px rgba(0,0,0,0.22);
        font: 13px/1.35 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        text-align: left;
      }

      .lazypadlet-card,
      .lazypadlet-card * {
        box-sizing: border-box;
      }

      .lazypadlet-card .lazypadlet-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.6rem;
        margin-bottom: 0.5rem;
      }

      .lazypadlet-card .lazypadlet-label {
        color: #FAFAFA;
        font-size: 12px;
        font-weight: 750;
      }

      .lazypadlet-card .lazypadlet-identity {
        min-width: 0;
        overflow: hidden;
        color: #A1A1AA;
        font-size: 11px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .lazypadlet-card .lazypadlet-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .lazypadlet-card .lazypadlet-viewing-controls {
        margin-top: 0.5rem;
      }

      .lazypadlet-card .lazypadlet-controls[hidden],
      .lazypadlet-card .lazypadlet-viewport[hidden] {
        display: none;
      }

      .lazypadlet-card .lazypadlet-button {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 27px;
        margin: 0;
        padding: 4px 8px;
        border: 1px solid rgba(143,145,148,0.32);
        border-radius: 7px;
        background: #27272A;
        color: #E4E4E7;
        font: inherit;
        font-size: 11px;
        font-weight: 700;
        line-height: 1;
        text-decoration: none;
        cursor: pointer;
      }

      .lazypadlet-card .lazypadlet-button:hover:not(:disabled) {
        border-color: rgba(143,145,148,0.65);
        background: #3F3F46;
        color: #FAFAFA;
        text-decoration: none;
      }

      .lazypadlet-card .lazypadlet-button-primary {
        border-color: #D6A21D;
        background: #D6A21D;
        color: #18181B;
      }

      .lazypadlet-card .lazypadlet-button-primary:hover:not(:disabled) {
        border-color: #E0B13A;
        background: #E0B13A;
        color: #18181B;
      }

      .lazypadlet-card .lazypadlet-button:focus-visible {
        outline: 2px solid #E0B13A;
        outline-offset: 2px;
      }

      .lazypadlet-card .lazypadlet-button:disabled {
        cursor: default;
        opacity: 0.48;
      }

      .lazypadlet-card .lazypadlet-viewport {
        width: 100%;
        min-height: 260px;
        margin-top: 0.55rem;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 6px;
        background: #27272A;
      }

      .lazypadlet-card .lazypadlet-iframe {
        display: block;
        width: 100%;
        height: ${CONFIG.iframeHeight}px;
        min-height: 360px;
        border: 0;
        background: #fff;
      }

      .lazypadlet-card .lazypadlet-status {
        min-height: 1.2em;
        margin-top: 0.5rem;
        color: #A1A1AA;
        font-size: 11px;
      }

      @media (max-width: 600px) {
        .lazypadlet-card {
          padding: 0.6rem;
        }

        .lazypadlet-card .lazypadlet-header {
          align-items: flex-start;
          flex-direction: column;
          gap: 0.2rem;
        }

        .lazypadlet-card .lazypadlet-iframe {
          height: max(420px, 70vh);
          min-height: 420px;
        }
      }
    `;

    document.head.append(style);
  }

  function debugLog(...values) {
    if (CONFIG.debug) console.debug('[LazyPadlet]', ...values);
  }
})();
