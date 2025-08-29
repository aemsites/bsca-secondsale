// /blocks/tabs/tabs.js
// eslint-disable-next-line import/no-unresolved
import { toClassName } from '../../scripts/aem.js';

/* -------------------- Deep-link helpers -------------------- */

function normalize(s) {
  return String(s || '').trim().replace(/^#/, '').toLowerCase();
}

function getRequestedId() {
  // Prefer #tab-... ; also support ?tab=...
  const fromHash = normalize(window.location.hash);
  const fromParam = normalize(new window.URLSearchParams(window.location.search).get('tab'));
  return fromHash || fromParam || '';
}

function findTriggerFromId(id) {
  if (!id) return null;

  // Accept "tab-foo", "tabpanel-foo", or bare "foo"
  const core = id.replace(/^tab(panel)?-/, '');
  const buttonIds = [`tab-${core}`, id, core];
  const panelIds = [`tabpanel-${core}`, id, core];

  // 1) Direct button id (role=tab or .tabs-tab)
  for (let i = 0; i < buttonIds.length; i += 1) {
    const cand = buttonIds[i];
    const el = document.getElementById(cand);
    if (el && (el.getAttribute('role') === 'tab' || el.classList.contains('tabs-tab'))) return el;
  }

  // 2) Button that controls a matching panel
  for (let i = 0; i < panelIds.length; i += 1) {
    const panel = panelIds[i];
    const el = document.querySelector(
      `[role="tab"][aria-controls="${panel}"], .tabs-tab[aria-controls="${panel}"]`,
    );
    if (el) return el;
  }

  // 3) Optional data attribute variant (future-proof)
  for (let i = 0; i < buttonIds.length; i += 1) {
    const cand = buttonIds[i];
    const el = document.querySelector(
      `[role="tab"][data-tab-id="${cand}"], .tabs-tab[data-tab-id="${cand}"]`,
    );
    if (el) return el;
  }

  return null;
}

function tryActivateFromURL() {
  const requested = getRequestedId();
  if (!requested) return false;
  const trigger = findTriggerFromId(requested);
  if (!trigger) return false;
  try {
    trigger.click();
  } catch (e) {
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  }
  // Mark that the block handled deeplinking (useful if you add a global helper later)
  window.tabsHashBound = true;
  return true;
}

// Keep tabs in sync when the hash changes (back/forward, in-page links)
if (!window.tabsHashBound) {
  window.addEventListener('hashchange', tryActivateFromURL);
}

/* -------------------- Block decorate -------------------- */

export default async function decorate(block) {
  // build tablist
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  // decorate tabs and tabpanels
  const tabs = [...block.children].map((child) => child.firstElementChild);
  tabs.forEach((tab, i) => {
    const id = toClassName(tab.textContent);

    // decorate tabpanel
    const tabpanel = block.children[i];
    tabpanel.className = 'tabs-panel';
    tabpanel.id = `tabpanel-${id}`;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    // build tab button
    const button = document.createElement('button');
    button.className = 'tabs-tab';
    button.id = `tab-${id}`;
    button.innerHTML = tab.innerHTML;
    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });

    tablist.append(button);
    tab.remove();
  });

  block.prepend(tablist);

  // ✅ After the block is initialized, apply deep-link selection
  tryActivateFromURL();
  setTimeout(tryActivateFromURL, 0);
  // If your tab lib sometimes re-selects #1 a bit later, you can uncomment:
  // setTimeout(tryActivateFromURL, 200);
}
