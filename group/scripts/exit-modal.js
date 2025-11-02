// BSC External Link Exit Modal (metadata-only; test+prod safe)
/* eslint-disable no-console */
(() => {
  // Singleton guard (no underscore to satisfy common lint rules)
  if (window.BSC_EXIT_MODAL_LOADED) return;
  window.BSC_EXIT_MODAL_LOADED = true;

  // ---------- Config ----------
  const CFG = {
    firstPartyRoots: ['blueshieldca.com', 'aem.page', 'aem.live', 'localhost', '127.0.0.1'],
    allowlist: [], // add partners later (e.g., 'login.microsoftonline.com')
    respectModifierClicks: true, // Cmd/Ctrl/Shift bypasses the modal
    interceptTargetBlank: true,  // normal click on target=_blank still warns
    copies: {
      commercial: {
        title: "You’re leaving our website",
        body:
          'You’re about to visit <strong>{host}</strong>. ' +
          'This third-party site has its own privacy and security policies.',
        stay: 'Stay on this page',
        cont: 'Continue',
      },
      medicare: {
        title: "You’re leaving our Medicare site",
        body:
          'You’re about to visit <strong>{host}</strong>. ' +
          'The site may follow different privacy and security practices than ' +
          'Blue Shield’s Medicare pages.',
        stay: 'Stay on this page',
        cont: 'Continue',
      },
    },
    modalId: 'bsc-exit-modal',
    openClass: 'is-open',
  };

  // ---------- Utils ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const toAbsURL = (href) => {
    try { return new URL(href, window.location.href); } catch { return null; }
  };

  const isHttp = (u) => u && (u.protocol === 'http:' || u.protocol === 'https:');
  const endsWithRoot = (host, root) => host === root || host.endsWith(`.${root}`);
  const isFirstParty = (host) => CFG.firstPartyRoots.some((r) => endsWithRoot(host, r));
  const isAllowlisted = (host) => CFG.allowlist.some((r) => endsWithRoot(host, r));
  const hasMods = (e) => e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

  const sameDocHash = (u) =>
    u.origin === window.location.origin &&
    u.pathname === window.location.pathname &&
    !!u.hash;

  const norm = (v) => String(v ?? '').trim().toLowerCase();
  const isTruthy = (v) => ['true', 'yes', '1'].includes(norm(v));
  const isFalsy = (v) => ['false', 'no', '0'].includes(norm(v));

  const FOCUSABLE_SELECTOR = 'a,button,[tabindex]:not([tabindex="-1"])';

  // Read ALL metas by name (page + fragments)
  function getMetaAll(name) {
    return $$(`meta[name="${name}"]`, document.head).map((m) => m.getAttribute('content'));
  }

  // Fallback: infer variant from <meta name="footer" content="/group/footer-...">
  function variantFromFooterPath() {
    const m = document.head.querySelector('meta[name="footer"]');
    if (!m) return null;
    const p = String(m.getAttribute('content') || '').toLowerCase();
    if (!p) return null;
    if (p.includes('medicare')) return 'medicare';
    return 'commercial';
  }

  // Decide activation + variant via metadata (with footer-path fallback)
  function decideVariant() {
    const showFlags = getMetaAll('show-exit-modal');

    // Page-level hard OFF wins
    if (showFlags.some(isFalsy)) return { on: false, variant: null };

    // Preferred: explicit footer-variant meta
    const variants = getMetaAll('footer-variant').map(norm);
    let variant = null;
    if (variants.includes('medicare')) variant = 'medicare';
    else if (variants.includes('commercial')) variant = 'commercial';

    // Fallback: infer from footer path if variant meta missing
    if (!variant) variant = variantFromFooterPath();

    // Still nothing → feature off
    if (!variant) return { on: false, variant: null };

    // If any explicit true is present we honor it; otherwise variant alone enables
    const explicitOn = showFlags.some(isTruthy);
    return { on: explicitOn || true, variant };
  }

  // Key trap (declare before use to satisfy no-use-before-define)
  function onKeyTrap(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      const modal = document.getElementById(CFG.modalId);
      if (modal) closeModal(modal);
      return undefined;
    }
    if (e.key !== 'Tab') return undefined;

    const modal = document.getElementById(CFG.modalId);
    if (!modal) return undefined;

    const focusables = Array.from(modal.querySelectorAll(FOCUSABLE_SELECTOR))
      .filter((el) => !el.disabled && el.offsetParent !== null);
    if (focusables.length < 2) return undefined;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus(); return undefined;
    }
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus(); return undefined;
    }
    return undefined;
  }

  function shouldIntercept(a) {
    if (!a || !a.hasAttribute('href')) return false;

    const url = toAbsURL(a.getAttribute('href'));
    if (!url || !isHttp(url)) return false;
    if (sameDocHash(url)) return false;

    const host = url.hostname.toLowerCase();
    if (isFirstParty(host)) return false;
    if (isAllowlisted(host)) return false;

    if (a.getAttribute('target') === '_blank' && CFG.interceptTargetBlank === false) {
      return false;
    }
    return true;
  }

  // ---------- Modal UI ----------
  function ensureModal() {
    let m = document.getElementById(CFG.modalId);
    if (m) return m;
    const html = `
      <div id="${CFG.modalId}" class="bsc-exit-modal" role="dialog"
           aria-modal="true" aria-labelledby="bsc-exit-title" aria-describedby="bsc-exit-desc" hidden>
        <div class="bsc-exit-backdrop" data-exit-close></div>
        <div class="bsc-exit-content" role="document" tabindex="-1">
          <h2 id="bsc-exit-title" class="bsc-exit-title"></h2>
          <p id="bsc-exit-desc" class="bsc-exit-desc"></p>
          <div class="bsc-exit-actions">
            <button type="button" class="bsc-exit-cancel" data-exit-close></button>
            <a class="bsc-exit-continue" rel="noopener" data-exit-continue></a>
          </div>
          <button type="button" class="bsc-exit-x" aria-label="Close" data-exit-close>&times;</button>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    m = document.getElementById(CFG.modalId);
    return m;
  }

  let PENDING = { anchor: null, href: null, target: null };

  function openModal(m, copy, href, target) {
    const host = toAbsURL(href).hostname;

    $('#bsc-exit-title', m).innerHTML = copy.title;
    $('#bsc-exit-desc', m).innerHTML = copy.body.replace('{host}', host);

    const closeBtns = m.querySelectorAll('[data-exit-close]');
    if (closeBtns[1]) closeBtns[1].textContent = copy.stay;

    const cont = $('[data-exit-continue]', m);
    cont.textContent = copy.cont;
    cont.setAttribute('href', href);
    if (target) cont.setAttribute('target', target);
    else cont.removeAttribute('target');

    m.hidden = false;
    m.classList.add(CFG.openClass);
    document.body.style.overflow = 'hidden';
    $('.bsc-exit-content', m).focus();

    document.addEventListener('keydown', onKeyTrap, true);
  }

  function closeModal(m) {
    if (!m) return;
    m.classList.remove(CFG.openClass);
    m.hidden = true;
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeyTrap, true);

    if (PENDING.anchor && document.body.contains(PENDING.anchor)) {
      PENDING.anchor.focus();
    }
    PENDING = { anchor: null, href: null, target: null };
  }

  // ---------- Boot ----------
  function boot() {
    const det = decideVariant();
    if (!det.on || !det.variant) return; // feature off

    const copy = CFG.copies[det.variant] || CFG.copies.commercial;
    const modal = ensureModal();

    // Wire modal clicks (allow continue; close where intended)
    modal.addEventListener(
      'click',
      (e) => {
        const t = e.target;
        if (!t) return;

        // Let "Continue" navigate normally
        if (t.closest('[data-exit-continue]')) return;

        // Handle any close action (backdrop, cancel button, X)
        if (t.closest('[data-exit-close]')) {
          e.preventDefault();
          closeModal(modal);
        }
      },
      true,
    );

    // Click (left) — ignore events that originate inside the modal
    document.addEventListener(
      'click',
      (e) => {
        if (e.defaultPrevented || e.button !== 0) return;

        // NEW: If clicking inside the modal, do nothing (avoid re-intercepting Continue)
        if (e.target && e.target.closest && e.target.closest(`#${CFG.modalId}`)) return;

        if (CFG.respectModifierClicks && hasMods(e)) return;
        const a = e.target.closest && e.target.closest('a[href]');
        if (!a) return;

        if (shouldIntercept(a)) {
          e.preventDefault();
          PENDING.anchor = a;
          PENDING.href = a.href;
          PENDING.target = a.getAttribute('target');
          openModal(modal, copy, PENDING.href, PENDING.target);
        }
      },
      true,
    );

    // Keyboard (Enter/Space) — ignore when focus is inside the modal
    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;

        // NEW: If focus is inside the modal, don't re-intercept
        if (
          document.activeElement &&
          document.activeElement.closest &&
          document.activeElement.closest(`#${CFG.modalId}`)
        ) {
          return;
        }

        const a =
          document.activeElement && document.activeElement.tagName === 'A'
            ? document.activeElement
            : null;
        if (!a) return;

        if (shouldIntercept(a)) {
          e.preventDefault();
          PENDING.anchor = a;
          PENDING.href = a.href;
          PENDING.target = a.getAttribute('target');
          openModal(modal, copy, PENDING.href, PENDING.target);
        }
      },
      true,
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
