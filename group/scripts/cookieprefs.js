// cookieprefs.js — robust + minimal
(() => {
    const LABEL = 'cookie preferences'; // exact authored text in Word

    function openPrefs() {
        if (window.Optanon?.ToggleInfoDisplay) return void window.Optanon.ToggleInfoDisplay();
        if (window.OneTrust?.ToggleInfoDisplay) return void window.OneTrust.ToggleInfoDisplay();
        if (window.Onetrust?.ToggleInfoDisplay) return void window.Onetrust.ToggleInfoDisplay();
    }

    function enhanceAnchor(a) {
        if (!a || a.dataset.otBound === '1') return;
        a.id = 'ot-cookie-pref';
        a.classList.add('ot-link', 'ot-sdk-show-settings'); // class is optional; direct call handles it
        a.setAttribute('data-text', 'cookie-preferences');

        // Prevent navigation/jump; always open prefs
        a.addEventListener('click', (e) => {
            // allow middle/right clicks to do nothing special, but don’t navigate
            if (e) e.preventDefault();
            openPrefs();
        });

        a.dataset.otBound = '1';
    }

    function findLiByText(root) {
        const items = root.querySelectorAll('footer .footer-links-sections li, footer li');
        for (const li of items) {
            const text = (li.textContent || '').trim().toLowerCase();
            if (text === LABEL) return li;
        }
        return null;
    }

    function ensureAnchor(li) {
        // If an <a> already exists, use it
        const existing = li.querySelector('a');
        if (existing) return existing;

        // Otherwise, create one around the existing text
        const txt = (li.textContent || '').trim();
        const a = document.createElement('a');
        a.href = ''; // empty string avoids # jump; click handler prevents nav
        a.textContent = txt;

        // Replace LI contents with the new anchor
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

    // Try immediately
    let bound = bind(document);

    // Watch for late-injected footer (EDS block render)
    if (!bound) {
        const mo = new MutationObserver(() => {
            if (bind(document)) mo.disconnect();
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
        // Safety pass after full load
        window.addEventListener('load', () => bind(document));
    }
})();