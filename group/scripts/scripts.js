import {
  // buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateSections,
  decorateBlocks,
  decorateIcons,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

/**
 * Returns the current timestamp used for scheduling content.
 */
export function getTimestamp() {
  if ((window.location.hostname === 'localhost' || window.location.hostname.endsWith('.aem.page')) && window.sessionStorage.getItem('preview-date')) {
    return Date.parse(window.sessionStorage.getItem('preview-date'));
  }
  return Date.now();
}

/**
 * Determines whether scheduled content with a given date string should be displayed.
 */
export function shouldBeDisplayed(date) {
  const now = getTimestamp();

  const split = date.split('-');
  if (split.length === 2) {
    const from = Date.parse(split[0].trim());
    const to = Date.parse(split[1].trim());
    return now >= from && now <= to;
  }
  if (date !== '') {
    const from = Date.parse(date.trim());
    return now >= from;
  }
  return false;
}

export function getTimeoutSignal(timeout) {
  if (AbortSignal && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeout);
  }

  const aborter = new AbortController();
  setTimeout(() => aborter.abort('operation timed out'), timeout);
  return aborter.signal;
}

const iconLoadingPromises = {};
async function loadIconSvg(icon, doc = document) {
  if (!icon) return;

  let svgSprite = doc.getElementById('svg-sprite');
  if (!svgSprite) {
    const div = document.createElement('div');
    div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" id="svg-sprite" style="display: none"></svg>';
    svgSprite = div.firstElementChild;
    doc.body.append(svgSprite);
  }

  const { iconName } = icon.dataset;
  if (!iconLoadingPromises[iconName]) {
    iconLoadingPromises[iconName] = (async () => {
      const resp = await fetch(icon.src, {
        signal: getTimeoutSignal(5000),
      });
      const temp = document.createElement('div');
      temp.innerHTML = await resp.text();
      const svg = temp.querySelector('svg');

      const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
      symbol.id = `icons-sprite-${iconName}`;
      symbol.setAttribute('viewBox', svg.getAttribute('viewBox'));
      while (svg.firstElementChild) symbol.append(svg.firstElementChild);
      svgSprite.append(symbol);
    })();
  }
  await iconLoadingPromises[iconName];

  const temp = document.createElement('div');
  temp.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg"><use href="#icons-sprite-${iconName}"/></svg>`;
  icon.replaceWith(temp.firstElementChild);
}

/**
 * Observes an icon span and loads the SVG when it becomes visible
 * @param {Element} iconSpan the span element for the given icon
 */
export async function useSvgForIcon(iconSpan) {
  const img = iconSpan.querySelector('img');
  if (img && img.loading === 'eager') {
    await loadIconSvg(img);
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadIconSvg(entry.target.querySelector('img'));
          observer.disconnect();
        }
      });
    }, {
      rootMargin: '250px',
    });
    observer.observe(iconSpan);
  }
}

export function isExternalLink(url) {
  const knownDomains = [
    'www.blueshieldca.com/group/',
    'aem.page', 'aem.live',
    window.location.hostname,
  ];

  let isExternal = false;
  const pdfDetectionRegex = /\.pdf($|\?|#)|[?&][^=&]*=([^&]*\.pdf)($|&)|#newtab/i;
  if (pdfDetectionRegex.test(url)) {
    isExternal = true;
  } else if (!url.hostname.includes('localhost') && !knownDomains.some((host) => url.hostname.includes(host))) {
    isExternal = true;
  } else if (url.hostname === window.location.hostname || url.hostname === 'www.blueshieldcs.com') {
    isExternal = false;
  }
  return isExternal;
}

export function decorateLinks(main) {
  main.querySelectorAll('a[href]').forEach((a) => {
    const url = new URL(a.href);
    // protect against maito: links or other weirdness
    const isHttp = url.protocol === 'https:' || url.protocol === 'http:';
    if (!isHttp) return;

    if (isExternalLink(url)) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';

      // const newWindowIcon = document.createElement('span');
      // newWindowIcon.className = 'icon icon-new-tab';
      // a.append(newWindowIcon);
      const srOnlySpan = document.createElement('span');
      srOnlySpan.className = 'sr-only';
      srOnlySpan.textContent = 'Open the link in a new window';
      a.append(srOnlySpan);
      a.classList.add('external-link');
      // useSvgForIcon(newWindowIcon);
    }
  });
}

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
/* function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_FOLLOWING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [h1, picture] }));
    main.prepend(section);
  }
} */

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
/* function buildAutoBlocks(main) {
  try {
    // buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
} */

/**
 * Remove scheduled blocks that should not be displayed.
 */
function scheduleBlocks(main) {
  const blocks = main.querySelectorAll('div.section > div > div');
  blocks.forEach((block) => {
    let date;
    const rows = block.querySelectorAll(':scope > div');
    rows.forEach((row) => {
      const cols = [...row.children];
      if (cols.length > 1) {
        if (cols[0].textContent.toLowerCase() === 'date') {
          date = cols[1].textContent;
          row.remove();
        }
      }
    });
    if (date && !shouldBeDisplayed(date)) {
      block.remove();
    }
  });
}

/**
 * Remove scheduled sections that should not be displayed.
 */
function scheduleSections(main) {
  const sections = main.querySelectorAll('div.section');
  sections.forEach((section) => {
    const { date } = section.dataset;
    if (date && !shouldBeDisplayed(date)) {
      section.remove();
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  // buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  scheduleSections(main);
  scheduleBlocks(main);
  decorateLinks(main);
  decorateIcons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();

  if (window.location.hostname === 'localhost' || window.location.hostname.endsWith('.aem.page')) {
    // Load scheduling sidekick extension
    import('./scheduling/scheduling.js');
  }
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
