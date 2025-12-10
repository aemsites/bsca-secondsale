// BSC External Link Exit Modal (metadata-only; test+prod safe)
/* eslint-disable no-console */
(() => {
  if (window.BSC_EXIT_MODAL_LOADED) return;
  window.BSC_EXIT_MODAL_LOADED = true;

  // ---------- Config ----------
  const CFG = {
    firstPartyRoots: ['blueshieldca.com', 'aem.page', 'aem.live', 'localhost', '127.0.0.1'],
    allowlist: [], // add partners later (e.g., 'login.microsoftonline.com')
    respectModifierClicks: true, // Cmd/Ctrl/Shift bypasses the modal
    interceptTargetBlank: true, // normal click on target=_blank still warns
    copies: {
      commercial: {
        title: 'You are now leaving the blueshieldca.com website',
        body: 'Blue Shield of California has neither reviewed nor endorsed this information.',
        stay: 'Cancel',
        cont: 'Continue',
      },
      medicare: {
        title: 'You are now leaving the blueshieldca.com website',
        body:
          'Medicare has neither reviewed nor endorsed this information. '
          + 'Blue Shield of California is an HMO, HMO D-SNP, PPO, and PDP plan with a Medicare '
          + 'contract and a contract with the California State Medicaid Program. Enrollment in '
          + 'Blue Shield of California depends on contract renewal.',
        stay: 'Cancel',
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

  const sameDocHash = (u) => (
    u.origin === window.location.origin
    && u.pathname === window.location.pathname
    && !!u.hash
  );

  const norm = (v) => String(v ?? '').trim().toLowerCase();
  const isTruthy = (v) => ['true', 'yes', '1'].includes(norm(v));
  const isFalsy = (v) => ['false', 'no', '0'].includes(norm(v));

  const FOCUSABLE_SELECTOR = 'a,button,[tabindex]:not([tabindex="-1"])';

  // ---------- Shared state (declare early for lint) ----------
  let PENDING = { anchor: null, href: null, target: null };
  let boundKeyTrap = null;

  // ---------- Modal close (must come BEFORE makeKeyTrap) ----------
  function closeModal(m) {
    if (!m) return;
    m.classList.remove(CFG.openClass);
    m.hidden = true;
    document.body.style.overflow = '';

    if (boundKeyTrap) {
      document.removeEventListener('keydown', boundKeyTrap, true);
      boundKeyTrap = null;
    }

    if (PENDING.anchor && document.body.contains(PENDING.anchor)) {
      PENDING.anchor.focus();
    }
    PENDING = { anchor: null, href: null, target: null };
  }

  // ---------- Metadata helpers ----------
  function getMetaAll(name) {
    return $$(`meta[name="${name}"]`, document.head).map((m) => m.getAttribute('content'));
  }

  function variantFromFooterPath() {
    const meta = document.head.querySelector('meta[name="footer"]');
    if (!meta) return null;
    const p = String(meta.getAttribute('content') || '').toLowerCase();
    if (!p) return null;
    if (p.includes('medicare')) return 'medicare';
    return 'commercial';
  }

  function decideVariant() {
    const showFlags = getMetaAll('show-exit-modal');
    if (showFlags.some(isFalsy)) return { on: false, variant: null };

    const variants = getMetaAll('footer-variant').map(norm);
    let variant = null;
    if (variants.includes('medicare')) {
      variant = 'medicare';
    } else if (variants.includes('commercial')) {
      variant = 'commercial';
    }

    // Try footer path if no explicit footer-variant meta
    if (!variant) variant = variantFromFooterPath();

    // Default to commercial when we still have no signal
    if (!variant) variant = 'commercial';

    const explicitOn = showFlags.some(isTruthy);
    return { on: explicitOn || true, variant };
  }

  // ---------- Keyboard trap (built per-open) ----------
  function makeKeyTrap() {
    return (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        const modal = document.getElementById(CFG.modalId);
        if (modal) closeModal(modal);
        return;
      }
      if (e.key !== 'Tab') return;

      const modal = document.getElementById(CFG.modalId);
      if (!modal) return;

      const focusables = Array.from(modal.querySelectorAll(FOCUSABLE_SELECTOR))
        .filter((el) => !el.disabled && el.offsetParent !== null);
      if (focusables.length < 2) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
  }

  // ---------- Intercept logic ----------
  function shouldIntercept(a) {
    if (!a || !a.hasAttribute('href')) return false;

    // Ignore links inside video-modal sections
    if (a.closest('.use-video-modal')) return false;

    const url = toAbsURL(a.getAttribute('href'));
    if (!url || !isHttp(url)) return false;

    // Ignore same-document hash navigation
    if (sameDocHash(url)) return false;

    // Ignore PDF links (no exit modal for .pdf files)
    const path = url.pathname.toLowerCase();
    if (path.endsWith('.pdf')) return false;

    const host = url.hostname.toLowerCase();
    if (isFirstParty(host)) return false;
    if (isAllowlisted(host)) return false;

    if (a.getAttribute('target') === '_blank' && CFG.interceptTargetBlank === false) return false;
    return true;
  }

  // ---------- Modal UI ----------
  function ensureModal() {
    const existing = document.getElementById(CFG.modalId);
    if (existing) return existing;

    const html = `
      <div id="${CFG.modalId}" class="bsc-exit-modal" role="dialog"
           aria-modal="true" aria-labelledby="bsc-exit-title" aria-describedby="bsc-exit-desc" hidden>
        <div class="bsc-exit-backdrop" data-exit-close></div>
        <div class="bsc-exit-content" role="document" tabindex="-1" aria-live="polite">
          <h2 id="bsc-exit-title" class="bsc-exit-title"></h2>
          <p id="bsc-exit-desc" class="bsc-exit-desc"></p>
          <div class="bsc-exit-actions">
            <a href="#" class="bsc-exit-cancel" data-exit-close>Cancel</a>
            <button type="button" class="bsc-exit-continue" data-exit-continue>Continue</button>
          </div>
          <button type="button" class="bsc-exit-x" aria-label="Close" data-exit-close>&times;</button>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    return document.getElementById(CFG.modalId);
  }

  function openModal(m, copy, href) {
    $('#bsc-exit-title', m).textContent = copy.title;
    $('#bsc-exit-desc', m).textContent = copy.body;

    const closeBtns = m.querySelectorAll('[data-exit-close]');
    if (closeBtns[1]) closeBtns[1].textContent = copy.stay;

    const contBtn = $('[data-exit-continue]', m);
    contBtn.textContent = copy.cont;
    contBtn.onclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();

      const win = window.open(href, '_blank');
      if (!win) window.location.assign(href);

      closeModal(m);
    };

    m.hidden = false;
    m.classList.add(CFG.openClass);
    document.body.style.overflow = 'hidden';
    $('.bsc-exit-content', m).focus();

    boundKeyTrap = makeKeyTrap();
    document.addEventListener('keydown', boundKeyTrap, true);
  }

  // ---------- Boot ----------
  function boot() {
    const det = decideVariant();
    if (!det.on || !det.variant) return;

    const copy = CFG.copies[det.variant] || CFG.copies.commercial;
    const modal = ensureModal();

    // Modal clicks: allow Continue; close on backdrop/cancel/X
    modal.addEventListener(
      'click',
      (e) => {
        const t = e.target;
        if (!t) return;
        if (t.closest('[data-exit-continue]')) return;
        if (t.closest('[data-exit-close]')) {
          e.preventDefault();
          closeModal(modal);
        }
      },
      true,
    );

    // Page clicks: intercept external links (ignore clicks inside modal)
    document.addEventListener(
      'click',
      (e) => {
        if (e.defaultPrevented || e.button !== 0) return;
        if (e.target && e.target.closest && e.target.closest(`#${CFG.modalId}`)) return;
        if (CFG.respectModifierClicks && hasMods(e)) return;

        const a = e.target.closest && e.target.closest('a[href]');
        if (!a) return;

        if (shouldIntercept(a)) {
          e.preventDefault();
          PENDING.anchor = a;
          PENDING.href = a.href;
          PENDING.target = a.getAttribute('target');
          openModal(modal, copy, PENDING.href);
        }
      },
      true,
    );

    // Keyboard: Enter/Space on focused link (ignore if focus is inside modal)
    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;

        const active = document.activeElement;
        if (active && active.closest && active.closest(`#${CFG.modalId}`)) return;

        const a = active && active.tagName === 'A' ? active : null;
        if (!a) return;

        if (shouldIntercept(a)) {
          e.preventDefault();
          PENDING.anchor = a;
          PENDING.href = a.href;
          PENDING.target = a.getAttribute('target');
          openModal(modal, copy, PENDING.href);
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
