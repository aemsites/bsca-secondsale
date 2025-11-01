// BSC External Link Exit Modal (metadata-only; test+prod safe)
// Variant from:  <meta name="footer-variant" content="commercial|medicare">
// Page override: <meta name="show-exit-modal" content="true|false">
(() => {
  if (window.__BSC_EXIT_MODAL_LOADED__) return;
  window.__BSC_EXIT_MODAL_LOADED__ = true;

  // ---------- Config ----------
  const CFG = {
    firstPartyRoots: ['blueshieldca.com', 'aem.page', 'aem.live', 'localhost', '127.0.0.1'],
    allowlist: [],                   // add partners later (e.g., 'login.microsoftonline.com')
    respectModifierClicks: true,     // Cmd/Ctrl/Shift bypasses the modal
    interceptTargetBlank: true,      // normal click on target=_blank still warns
    copies: {
      commercial: {
        title: "You’re leaving our website",
        body:  "You’re about to visit <strong>{host}</strong>. This third-party site has its own privacy and security policies.",
        stay:  "Stay on this page",
        cont:  "Continue",
      },
      medicare: {
        title: "You’re leaving our Medicare site",
        body:  "You’re about to visit <strong>{host}</strong>. The site may follow different privacy and security practices than Blue Shield’s Medicare pages.",
        stay:  "Stay on this page",
        cont:  "Continue",
      },
    },
    modalId: 'bsc-exit-modal',
    openClass: 'is-open',
  };

  // ---------- Utils ----------
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const toAbsURL = (href) => { try { return new URL(href, location.href); } catch { return null; } };
  const isHttp = (u) => u && (u.protocol === 'http:' || u.protocol === 'https:');
  const endsWithRoot = (host, root) => host === root || host.endsWith('.' + root);
  const isFirstParty = (host) => CFG.firstPartyRoots.some(r => endsWithRoot(host, r));
  const isAllowlisted = (host) => CFG.allowlist.some(r => endsWithRoot(host, r));
  const hasMods = (e) => e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
  const sameDocHash = (u) => (u.origin === location.origin && u.pathname === location.pathname && !!u.hash);
  const norm = (v) => String(v ?? '').trim().toLowerCase();
  const isTruthy = (v) => ['true','yes','1'].includes(norm(v));
  const isFalsy  = (v) => ['false','no','0'].includes(norm(v));

  // Read ALL metas by name (page + fragments)
  function getMetaAll(name) {
    return $$(`meta[name="${name}"]`, document.head).map(m => m.getAttribute('content'));
  }

  // Decide activation + variant via metadata
  function decideVariant() {
    const showFlags = getMetaAll('show-exit-modal');
    if (showFlags.some(isFalsy)) return { on: false, variant: null }; // page hard-off

    const variants = getMetaAll('footer-variant').map(norm);
    let variant = null;
    if (variants.includes('medicare')) variant = 'medicare';
    else if (variants.includes('commercial')) variant = 'commercial';

    if (!variant) return { on: false, variant: null };

    // If any explicit true provided we honor it, otherwise variant alone enables
    const explicitOn = showFlags.some(isTruthy);
    return { on: explicitOn || true, variant };
  }

  function shouldIntercept(a) {
    if (!a || !a.hasAttribute('href')) return false;

    const url = toAbsURL(a.getAttribute('href'));
    if (!url || !isHttp(url)) return false;
    if (sameDocHash(url)) return false;

    const host = url.hostname.toLowerCase();
    if (isFirstParty(host)) return false;
    if (isAllowlisted(host)) return false;

    if (a.getAttribute('target') === '_blank' && CFG.interceptTargetBlank === false) return false;
    return true;
  }

  // ---------- Modal UI ----------
  function ensureModal() {
    let m = document.getElementById(CFG.modalId);
    if (m) return m;
    const html = `
      <div id="${CFG.modalId}" class="bsc-exit-modal" role="dialog" aria-modal="true" aria-labelledby="bsc-exit-title" aria-describedby="bsc-exit-desc" hidden>
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
    return document.getElementById(CFG.modalId);
  }

  let PENDING = { anchor: null, href: null, target: null };

  function openModal(m, copy, href, target) {
    const host = toAbsURL(href).hostname;

    $('#bsc-exit-title', m).innerHTML = copy.title;
    $('#bsc-exit-desc',  m).innerHTML = copy.body.replace('{host}', host);

    const closeBtns = m.querySelectorAll('[data-exit-close]');
    if (closeBtns[1]) closeBtns[1].textContent = copy.stay;

    const cont = $('[data-exit-continue]', m);
    cont.textContent = copy.cont;
    cont.setAttribute('href', href);
    if (target) cont.setAttribute('target', target); else cont.removeAttribute('target');

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

    if (PENDING.anchor && document.body.contains(PENDING.anchor)) PENDING.anchor.focus();
    PENDING = { anchor: null, href: null, target: null };
  }

  function onKeyTrap(e) {
    if (e.key === 'Escape') { e.preventDefault(); return closeModal(document.getElementById(CFG.modalId)); }
    if (e.key !== 'Tab') return;
    const m = document.getElementById(CFG.modalId);
    if (!m) return;
    const f = Array.from(m.querySelectorAll('a,button,[tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.disabled && el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function wireModal(m) {
    m.addEventListener('click', (e) => {
      const t = e.target;
      if (t.closest('[data-exit-close]')) { e.preventDefault(); closeModal(m); }
      // continue link navigates naturally
    }, true);
  }

  // ---------- Boot ----------
  function boot() {
    const det = decideVariant();
    if (!det.on || !det.variant) return; // feature off

    const copy = CFG.copies[det.variant] || CFG.copies.commercial;
    const modal = ensureModal();
    wireModal(modal);

    // Click (left)
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (CFG.respectModifierClicks && hasMods(e)) return;
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;

      if (shouldIntercept(a)) {
        e.preventDefault();
        PENDING.anchor = a;
        PENDING.href   = a.href;
        PENDING.target = a.getAttribute('target');
        openModal(modal, copy, PENDING.href, PENDING.target);
      }
    }, true);

    // Keyboard (Enter/Space)
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const a = document.activeElement && document.activeElement.tagName === 'A' ? document.activeElement : null;
      if (!a) return;

      if (shouldIntercept(a)) {
        e.preventDefault();
        PENDING.anchor = a;
        PENDING.href   = a.href;
        PENDING.target = a.getAttribute('target');
        openModal(modal, copy, PENDING.href, PENDING.target);
      }
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();