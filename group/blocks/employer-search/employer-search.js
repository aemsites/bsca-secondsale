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
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[\u2019']/g, '') // remove apostrophes
    .replace(/[^a-z0-9\s-]/g, '') // strip punctuation
    .replace(/\s+/g, ' ');
}

function highlightMatch(label, query) {
  // basic safe-ish highlight: only highlight if we can find the query in label (case-insensitive)
  if (!query) return label;
  const idx = String(label).toLowerCase().indexOf(String(query).toLowerCase());
  if (idx < 0) return label;

  const before = label.slice(0, idx);
  const match = label.slice(idx, idx + query.length);
  const after = label.slice(idx + query.length);

  return `${before}<mark>${match}</mark>${after}`;
}

/**
 * Defensive getters because EDS/Excel->JSON can alter header casing/spacing.
 */
function getEmployer(item) {
  // Your Excel header is "Employer"
  return (
    item?.Employer ||
    item?.employer ||
    item?.EMPLOYER ||
    item?.title || // fallback (old data)
    ''
  );
}

function getUrl(item) {
  // Your Excel header is "url"
  return item?.url || item?.URL || '';
}

function getSearchTermsRaw(item) {
  // Your Excel header is "Search Terms"
  return (
    item?.['Search Terms'] ||
    item?.['search terms'] ||
    item?.['SEARCH TERMS'] ||
    item?.searchTerms ||
    item?.searchterms ||
    item?.search_terms ||
    ''
  );
}

function parseSearchTerms(item) {
  const raw = getSearchTermsRaw(item);
  if (!raw) return [];
  return String(raw)
    .split(';')
    .map((t) => t.trim())
    .filter(Boolean);
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
  label.textContent = 'Search for your employer';

  const inputWrap = document.createElement('div');
  inputWrap.className = 'employer-search__inputwrap';

  const input = document.createElement('input');
  input.className = 'employer-search__input';
  input.id = 'employer-search-input';
  input.type = 'search';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.placeholder = 'Start typing…';

  // GO button
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

  // Selection state
  let selectedEmployer = null;

  function clearSelection() {
    selectedEmployer = null;
  }

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
      items[index].scrollIntoView({ block: 'nearest' });
    } else {
      activeIndex = -1;
    }
  }

  function navigateTo(item) {
    const url = getUrl(item);
    if (url) window.location.href = url;
  }

  // Only allow navigation when user has *selected* an item
  // AND the input matches the selected Employer (prevents "Company" -> GO)
  function canNavigate() {
    const url = getUrl(selectedEmployer);
    if (!url) return false;

    const typed = norm(input.value);
    const selected = norm(getEmployer(selectedEmployer));
    return typed && selected && typed === selected;
  }

  function onGo() {
    if (canNavigate()) {
      status.textContent = '';
      navigateTo(selectedEmployer);
      return;
    }

    status.textContent = 'Please select an employer from the list before clicking GO.';
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

      const employer = getEmployer(item);
      btn.innerHTML = `<span class="employer-search__itemtitle">${highlightMatch(employer, query)}</span>`;

      // Clicking a result selects it (fills input) but does NOT redirect
      btn.addEventListener('click', () => {
        selectedEmployer = item;
        input.value = employer;
        status.textContent = '';
        clearResults();
      });

      btn.addEventListener('mousemove', () => setActive(idx));

      list.append(btn);
    });

    currentResults = results.slice(0, 8);
    openResults();
    setActive(-1);
  }

  /**
   * Search scoring:
   * - Employer exact match: 110
   * - SearchTerm exact match: 100
   * - Employer startsWith: 80
   * - SearchTerm startsWith: 70
   * - Employer includes: 50
   * - SearchTerm includes: 40
   */
  function search(queryRaw) {
    const qn = norm(queryRaw);
    if (!qn || qn.length < 2) return [];

    const scored = employers
      .map((it) => {
        const employer = getEmployer(it);
        const employerNorm = norm(employer);

        const terms = parseSearchTerms(it);
        const termNorms = terms.map((t) => norm(t)).filter(Boolean);

        let score = 0;

        if (employerNorm && employerNorm === qn) score = 110;
        else if (termNorms.includes(qn)) score = 100;
        else if (employerNorm && employerNorm.startsWith(qn)) score = 80;
        else if (termNorms.some((t) => t.startsWith(qn))) score = 70;
        else if (employerNorm && employerNorm.includes(qn)) score = 50;
        else if (termNorms.some((t) => t.includes(qn))) score = 40;

        return { it, score, employer };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.employer.localeCompare(b.employer))
      .map((x) => x.it);

    return scored;
  }

  const onInput = debounce(async () => {
    await loadData();
    const q = input.value.trim();

    // If user types, selection is no longer valid until they pick again
    clearSelection();

    const results = search(q);
    renderResults(q, results);
  }, 150);

  // Events
  input.addEventListener('focus', onInput);
  input.addEventListener('input', onInput);

  // GO button: navigate only if selected + exact match
  goBtn.addEventListener('click', onGo);

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
      // If a list option is highlighted, select it (don’t navigate yet)
      if (activeIndex >= 0 && currentResults[activeIndex]) {
        e.preventDefault();
        const it = currentResults[activeIndex];
        selectedEmployer = it;
        input.value = getEmployer(it) || input.value;
        status.textContent = '';
        clearResults();
        return;
      }

      // Otherwise, treat Enter like GO
      e.preventDefault();
      onGo();
      return;
    }

    if (e.key === 'Escape') {
      clearResults();
      input.blur();
    }
  });

  // Click outside to close results (keep selection)
  document.addEventListener('click', (e) => {
    if (!block.contains(e.target)) clearResults();
  });
}
