// cookieprefs.js — robust + minimal
(() => {
  const LABEL = 'cookie preferences'; // exact authored text in Word

  function openPrefs() {
    if (window.Optanon?.ToggleInfoDisplay) {
      window.Optanon.ToggleInfoDisplay();
    } else if (window.OneTrust?.ToggleInfoDisplay) {
      window.OneTrust.ToggleInfoDisplay();
    } else if (window.Onetrust?.ToggleInfoDisplay) {
      window.Onetrust.ToggleInfoDisplay();
    }
  }

  function enhanceAnchor(a) {
    if (!a || a.dataset.otBound === '1') return;
    a.id = 'ot-cookie-pref';
    a.classList.add('ot-link', 'ot-sdk-show-settings');
    a.setAttribute('data-text', 'cookie-preferences');

    a.addEventListener('click', (e) => {
      if (e) e.preventDefault();
      openPrefs();
    });

    a.dataset.otBound = '1';
  }

  function findLiByText(root) {
    const items = root.querySelectorAll('footer .footer-links-sections li, footer li');
    return Array.from(items).find((li) => {
      const text = (li.textContent || '').trim().toLowerCase();
      return text === LABEL;
    }) || null;
  }

  function ensureAnchor(li) {
    const existing = li.querySelector('a');
    if (existing) return existing;

    const txt = (li.textContent || '').trim();
    const a = document.createElement('a');
    a.href = '';
    a.textContent = txt;

    li.textContent = '';
    li.appendChild(a);
    return a;
  }

  function bind(root = document) {
    const li = findLiByText(root || document);
    if (!li) return false;
    const a = ensureAnchor(li);
    enhanceAnchor(a);
    return true;
  }

  const bound = bind(document); // ✅ changed from let → const

  if (!bound) {
    const mo = new MutationObserver(() => {
      if (bind(document)) mo.disconnect();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });

    window.addEventListener('load', () => {
      bind(document);
    });
  }
})();
