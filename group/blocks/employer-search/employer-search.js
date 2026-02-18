// blocks/employer-search/employer-search.js

const DATA_URL = '/group/drafts/matt-sorensen/employers.json';

// simple debounce helper
function debounce(fn, wait = 150) {
  let t;
  return (...args) => {
    window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), wait);
  };
}

// normalize for matching
function norm(str = '') {
  return str
    .toLowerCase()
    .trim()
    .replace(/[\u2019']/g, '')     // remove apostrophes
    .replace(/[^a-z0-9\s-]/g, '')  // strip punctuation
    .replace(/\s+/g, ' ');
}

function highlightMatch(label, query) {
  // basic safe-ish highlight: only highlight if we can find the query in label (case-insensitive)
  if (!query) return label;
  const idx = label.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return label;

  const before = label.slice(0, idx);
  const match = label.slice(idx, idx + query.length);
  const after = label.slice(idx + query.length);

  return `${before}<mark>${match}</mark>${after}`;
}

export default async function decorate(block) {
  // Allow authors to override the data URL by putting it in the first cell (optional)
  // e.g. a table row with "data" | "/path/to/employers.json"
  let dataUrl = DATA_URL;

  const rows = [...block.querySelectorAll(':scope > div')];
  if (rows.length) {
    const maybeKey = rows[0]?.children?.[0]?.textContent?.trim()?.toLowerCase();
    const maybeVal = rows[0]?.children?.[1]?.textContent?.trim();
    if (maybeKey === 'data' && maybeVal) {
      dataUrl = maybeVal;
    }
  }

  // Replace authored content with component UI
  block.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'employer-search';

  const label = document.createElement('label');
  label.className = 'employer-search__label';
  label.setAttribute('for', 'employer-search-input');
  label.textContent = "Search for your employer";

  const inputWrap = document.createElement('div');
  inputWrap.className = 'employer-search__inputwrap';

  const input = document.createElement('input');
  input.className = 'employer-search__input';
  input.id = 'employer-search-input';
  input.type = 'search';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.placeholder = 'Start typing…';

  // GO button (new)
  const goBtn = document.createElement('button');
  goBtn.type = 'button';
  goBtn.className = 'employer-search__go';
  goBtn.textContent = 'GO';

  const status = document.createElement('div');
  status.className = 'employer-search__status';
  status.setAttribute('aria-live', 'polite');

  const list = document.createElement('div');
  list.className = 'employer-search__list';
  list.setAttribute('role', 'listbox');

  inputWrap.append(input, goBtn);
  wrapper.append(label, inputWrap, status, list);
  block.append(wrapper);

  // Data cache
  let employers = [];
  let loaded = false;

  // Selection state (new)
  let selectedEmployer = null;

  async function loadData() {
    if (loaded) return;
    loaded = true;
    status.textContent = 'Loading…';

    try {
      const resp = await fetch(dataUrl, { cache: 'no-store' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      employers = Array.isArray(json?.data) ? json.data : [];
      status.textContent = '';
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[employer-search] Failed to load data:', e);
      status.textContent = 'Unable to load search data.';
      employers = [];
    }
  }

  // Render helpers
  let activeIndex = -1;
  let currentResults = [];

  function clearResults() {
    list.innerHTML = '';
    list.classList.remove('is-open');
    activeIndex = -1;
    currentResults = [];
  }

  function openResults() {
    if (!currentResults.length) return;
    list.classList.add('is-open');
  }

  function setActive(index) {
    const items = [...list.querySelectorAll('.employer-search__item')];
    items.forEach((el) => el.classList.remove('is-active'));
    if (index >= 0 && index < items.length) {
      items[index].classList.add('is-active');
      activeIndex = index;
      // ensure visible
      items[index].scrollIntoView({ block: 'nearest' });
    } else {
      activeIndex = -1;
    }
  }

  function navigateTo(item) {
    if (item?.url) window.location.href = item.url;
  }

  function renderResults(query, results) {
    list.innerHTML = '';

    if (!query || query.length < 2) {
      status.textContent = '';
      clearResults();
      return;
    }

    if (!results.length) {
      status.textContent = 'No results found.';
      list.classList.remove('is-open');
      return;
    }

    status.textContent = `Showing ${Math.min(results.length, 8)} result(s).`;

    results.slice(0, 8).forEach((item, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'employer-search__item';
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', 'false');
      btn.dataset.index = String(idx);

      const title = item.title || '';
      btn.innerHTML = `<span class="employer-search__itemtitle">${highlightMatch(title, query)}</span>`;

      // NEW: clicking a result selects it (no redirect)
      btn.addEventListener('click', () => {
        input.value = title;
        selectedEmployer = item;
        clearResults();
        status.textContent = `Selected: ${title}`;
      });

      btn.addEventListener('mousemove', () => setActive(idx));

      list.append(btn);
    });

    currentResults = results.slice(0, 8);
    openResults();
    setActive(-1);
  }

  function search(queryRaw) {
    const qn = norm(queryRaw);
    if (!qn || qn.length < 2) return [];

    // basic scoring: startsWith beats includes
    const scored = employers
      .map((it) => {
        const title = it?.title || '';
        const tn = norm(title);
        let score = 0;

        if (tn === qn) score = 100;
        else if (tn.startsWith(qn)) score = 80;
        else if (tn.includes(qn)) score = 50;

        return { it, score, title };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .map((x) => x.it);

    return scored;
  }

  const onInput = debounce(async () => {
    await loadData();
    const q = input.value.trim();

    // If user types after selecting, clear selection until they choose again
    if (selectedEmployer && q !== selectedEmployer.title) {
      selectedEmployer = null;
    }

    const results = search(q);
    renderResults(q, results);
  }, 150);

  // Events
  input.addEventListener('focus', onInput);
  input.addEventListener('input', onInput);

  // GO button (new): navigate only when user clicks GO
  goBtn.addEventListener('click', () => {
    if (selectedEmployer?.url) {
      navigateTo(selectedEmployer);
      return;
    }

    // If user didn't click a result, but typed something:
    // try navigating to the top match if it exists
    const q = input.value.trim();
    const results = search(q);
    if (results.length) {
      navigateTo(results[0]);
    } else {
      status.textContent = 'Please select an employer from the list.';
    }
  });

  input.addEventListener('keydown', (e) => {
    const isOpen = list.classList.contains('is-open');
    const items = [...list.querySelectorAll('.employer-search__item')];

    if (e.key === 'ArrowDown') {
      if (!isOpen && items.length) list.classList.add('is-open');
      if (!items.length) return;
      e.preventDefault();
      setActive(Math.min(activeIndex + 1, items.length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      if (!items.length) return;
      e.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
      return;
    }

    if (e.key === 'Enter') {
      // Enter should select an active item (no redirect),
      // and user must press GO to navigate
      if (activeIndex >= 0 && currentResults[activeIndex]) {
        e.preventDefault();
        const it = currentResults[activeIndex];
        input.value = it.title || input.value;
        selectedEmployer = it;
        clearResults();
        status.textContent = `Selected: ${it.title}`;
      }
      return;
    }

    if (e.key === 'Escape') {
      clearResults();
      input.blur();
    }
  });

  // Click outside to close
  document.addEventListener('click', (e) => {
    if (!block.contains(e.target)) clearResults();
  });
}
