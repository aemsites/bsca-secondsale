import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const DESKTOP = window.matchMedia('(min-width: 900px)');
const LOGIN_FALLBACK_URL = 'https://www.blueshieldca.com';
const HOME_FALLBACK_URL = '/';

/**
 * Small DOM helper
 * @param {string} tag
 * @param {Object} attrs
 * @param {string|Node|Array<Node>} content
 * @returns {HTMLElement}
 */
function createTag(tag, attrs = {}, content = '') {
  const el = document.createElement(tag);

  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      el.setAttribute(key, value);
    }
  });

  if (Array.isArray(content)) {
    el.append(...content);
  } else if (content instanceof Node) {
    el.append(content);
  } else if (content) {
    el.innerHTML = content;
  }

  return el;
}

function normalizeText(text = '') {
  return text.replace(/\s+/g, ' ').trim();
}

function slugify(text = '') {
  return normalizeText(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function isExternalUrl(url = '') {
  return /^https?:\/\//i.test(url);
}

function isPhone(text = '') {
  return /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(normalizeText(text));
}

function toTelHref(text = '') {
  return `tel:${text.replace(/[^\d]/g, '')}`;
}

function getNavPath() {
  const navMeta = getMetadata('nav');
  return navMeta ? new URL(navMeta.toLowerCase(), window.location).pathname : '/nav-new';
}

function getTopLevelSections(fragment) {
  return [...fragment.children].filter((child) => child.nodeType === 1);
}

function getFirstLink(el) {
  return el?.querySelector('a') || null;
}

function getFirstList(section) {
  return section?.querySelector('ul, ol') || null;
}

function getDirectListItems(list) {
  return list ? [...list.children].filter((li) => li.matches('li')) : [];
}

function getDirectNestedList(li) {
  return [...li.children].find((child) => child.matches?.('ul, ol')) || null;
}

function getDirectAnchor(li) {
  return [...li.children].find((child) => child.matches?.('a')) || li.querySelector(':scope > a');
}

function getDirectTextWithoutNestedList(li) {
  const clone = li.cloneNode(true);
  [...clone.querySelectorAll('ul, ol')].forEach((nested) => nested.remove());
  return normalizeText(clone.textContent);
}

function getHrefOrFallback(anchor, fallback = '#') {
  const href = anchor?.getAttribute('href');
  return href || fallback;
}

function getPagePath() {
  return window.location.pathname.replace(/\/$/, '') || '/';
}

function pathsMatch(a = '', b = '') {
  const normalize = (value) => {
    if (!value) return '';
    if (isExternalUrl(value) || value.startsWith('mailto:') || value.startsWith('tel:')) return value;
    return value.replace(/\/$/, '') || '/';
  };

  return normalize(a) === normalize(b);
}

function isEnglishLabel(label = '') {
  return /^english$/i.test(normalizeText(label));
}

function isSpanishLabel(label = '') {
  return /^(español|spanish)$/i.test(normalizeText(label));
}

/**
 * Parse utility section.
 * Supports:
 * 1. Nested list pattern:
 *    - English
 *      - Español
 * 2. Flat fallback pattern:
 *    English
 *    Español
 * 3. Login/Register utility link
 */
function parseUtilitySection(section) {
  const result = {
    language: null,
    login: null,
    links: [],
  };

  if (!section) return result;

  const list = getFirstList(section);

  if (list) {
    const items = getDirectListItems(list);

    items.forEach((li) => {
      const labelAnchor = getDirectAnchor(li);
      const label = normalizeText(labelAnchor?.textContent || getDirectTextWithoutNestedList(li));
      const href = getHrefOrFallback(labelAnchor, '#');
      const nestedList = getDirectNestedList(li);

      if (/login\/register/i.test(label)) {
        result.login = {
          label: 'Log in/Register',
          href: href === '#' ? LOGIN_FALLBACK_URL : href,
        };
        return;
      }

      if (nestedList && /english|language/i.test(label)) {
        const options = getDirectListItems(nestedList)
          .map((childLi) => {
            const childAnchor = getDirectAnchor(childLi);
            return {
              label: normalizeText(childAnchor?.textContent || getDirectTextWithoutNestedList(childLi)),
              href: getHrefOrFallback(childAnchor, '#'),
            };
          })
          .filter((item) => item.label);

        result.language = {
          label: label || 'English',
          options,
        };
        return;
      }

      if (label) {
        result.links.push({ label, href });
      }
    });
  } else {
    const anchors = [...section.querySelectorAll('a')].map((anchor) => ({
      label: normalizeText(anchor.textContent),
      href: getHrefOrFallback(anchor, '#'),
    })).filter((item) => item.label);

    if (anchors.length) {
      anchors.forEach((item) => {
        if (/login\/register/i.test(item.label)) {
          result.login = {
            label: 'Log in/Register',
            href: item.href === '#' ? LOGIN_FALLBACK_URL : item.href,
          };
        } else {
          result.links.push(item);
        }
      });
    } else {
      const lines = [...section.querySelectorAll('p')]
        .map((p) => normalizeText(p.textContent))
        .filter(Boolean);

      lines.forEach((line) => {
        if (/login\/register/i.test(line)) {
          result.login = {
            label: 'Log in/Register',
            href: LOGIN_FALLBACK_URL,
          };
        } else {
          result.links.push({ label: line, href: '#' });
        }
      });
    }
  }

  if (!result.language && result.links.length) {
    const englishIndex = result.links.findIndex((item) => isEnglishLabel(item.label));
    const spanishIndex = result.links.findIndex((item) => isSpanishLabel(item.label));

    if (englishIndex > -1 && spanishIndex > -1) {
      const englishItem = result.links[englishIndex];
      const spanishItem = result.links[spanishIndex];

      result.language = {
        label: englishItem.label || 'English',
        options: [
          {
            label: spanishItem.label,
            href: spanishItem.href,
          },
        ],
      };

      result.links = result.links.filter((_, index) => index !== englishIndex && index !== spanishIndex);
    }
  }

  return result;
}

/**
 * Parse brand section.
 * Intended for simple authored content like:
 * Stanford
 * :logo:
 */
function parseBrandSection(section) {
  const result = {
    label: 'Blue Shield',
    href: HOME_FALLBACK_URL,
    hasLogoToken: false,
  };

  if (!section) return result;

  const link = getFirstLink(section);
  const textCandidates = [...section.querySelectorAll('p, h1, h2, h3, h4, h5, h6')]
    .map((el) => normalizeText(el.textContent))
    .filter((text) => text && !/^:logo:$/i.test(text));

  const brandLabel = textCandidates[0];

  result.label = brandLabel || result.label;
  result.href = getHrefOrFallback(link, HOME_FALLBACK_URL);
  result.hasLogoToken = normalizeText(section.textContent).includes(':logo:');

  return result;
}

/**
 * Parse main nav section from a real nested list.
 * Top-level li = top-level nav item
 * Nested ul/li = dropdown children
 */
function parseMainNavSection(section) {
  const result = {
    items: [],
    contact: null,
    cta: null,
  };

  if (!section) return result;

  const list = getFirstList(section);
  if (!list) return result;

  getDirectListItems(list).forEach((li) => {
    const anchor = getDirectAnchor(li);
    const nestedList = getDirectNestedList(li);
    const label = normalizeText(anchor?.textContent || getDirectTextWithoutNestedList(li));
    const href = getHrefOrFallback(anchor, '#');

    if (!label) return;

    if (isPhone(label)) {
      const detailText = nestedList
        ? getDirectListItems(nestedList)
          .map((childLi) => normalizeText(childLi.textContent))
          .filter(Boolean)
          .join(' ')
        : '';

      result.contact = {
        label,
        href: toTelHref(label),
        detail: detailText,
      };
      return;
    }

    if (/^enroll now$/i.test(label)) {
      result.cta = {
        label,
        href,
      };
      return;
    }

    const item = {
      label,
      href,
      children: [],
    };

    if (nestedList) {
      item.children = getDirectListItems(nestedList)
        .map((childLi) => {
          const childAnchor = getDirectAnchor(childLi);
          return {
            label: normalizeText(childAnchor?.textContent || getDirectTextWithoutNestedList(childLi)),
            href: getHrefOrFallback(childAnchor, '#'),
          };
        })
        .filter((child) => child.label);
    }

    result.items.push(item);
  });

  return result;
}

function parseNavFragment(fragment) {
  const sections = getTopLevelSections(fragment);

  const utility = parseUtilitySection(sections[0]);
  const brand = parseBrandSection(sections[1]);
  const main = parseMainNavSection(sections[2]);

  return {
    utility,
    brand,
    navItems: main.items,
    contact: main.contact,
    cta: main.cta,
  };
}

function buildLanguageControl(languageData) {
  if (!languageData?.label) return null;

  const wrapper = createTag('div', { class: 'nav-new-language' });

  const hasOptions = Array.isArray(languageData.options) && languageData.options.length > 0;

  if (!hasOptions) {
    wrapper.append(
      createTag('span', { class: 'nav-new-language-label' }, languageData.label),
    );
    return wrapper;
  }

  const buttonId = `nav-new-language-${slugify(languageData.label)}`;
  const panelId = `${buttonId}-panel`;

  const button = createTag(
    'button',
    {
      class: 'nav-new-language-toggle',
      type: 'button',
      'aria-expanded': 'false',
      'aria-controls': panelId,
      id: buttonId,
    },
    `${languageData.label}<span class="nav-new-chevron" aria-hidden="true"></span>`,
  );

  const panel = createTag(
    'div',
    {
      class: 'nav-new-language-panel',
      id: panelId,
      hidden: '',
    },
  );

  const list = createTag('ul', { class: 'nav-new-language-list' });

  languageData.options.forEach((option) => {
    const li = createTag('li');
    const link = createTag(
      'a',
      {
        href: option.href || '#',
        class: 'nav-new-language-link',
      },
      option.label,
    );
    li.append(link);
    list.append(li);
  });

  panel.append(list);
  wrapper.append(button, panel);

  return wrapper;
}

function buildUtilityRow(data) {
  const row = createTag('div', { class: 'nav-new-utility' });
  const left = createTag('div', { class: 'nav-new-utility-left' });
  const right = createTag('div', { class: 'nav-new-utility-right' });

  const languageControl = buildLanguageControl(data.utility.language);
  if (languageControl) left.append(languageControl);

  data.utility.links.forEach((item) => {
    const link = createTag(
      'a',
      {
        href: item.href || '#',
        class: 'nav-new-utility-link',
      },
      item.label,
    );
    left.append(link);
  });

  if (data.utility.login) {
    const login = createTag(
      'a',
      {
        href: data.utility.login.href || LOGIN_FALLBACK_URL,
        class: 'nav-new-login',
      },
      '<span class="nav-new-login-icon" aria-hidden="true"></span><span>Log in/Register</span>',
    );
    right.append(login);
  }

  row.append(left, right);
  return row;
}

function buildBrand(data) {
  const brand = createTag('div', { class: 'nav-new-brand' });

  const link = createTag(
    'a',
    {
      href: data.brand.href || HOME_FALLBACK_URL,
      class: 'nav-new-brand-link',
      'aria-label': data.brand.label || 'Home',
    },
  );

  const logo = createTag('img', {
    src: '/group/icons/logo.svg',
    alt: 'Blue Shield of California',
    width: '110',
    class: 'nav-new-brand-image',
  });

  link.append(logo);
  brand.append(link);

  return brand;
}

function buildDropdownItem(item) {
  const li = createTag('li', {
    class: 'nav-new-item has-dropdown',
    'data-nav-item': slugify(item.label),
  });

  const buttonId = `nav-item-${slugify(item.label)}`;
  const panelId = `${buttonId}-panel`;

  const button = createTag(
    'button',
    {
      class: 'nav-new-link nav-new-dropdown-toggle',
      type: 'button',
      'aria-expanded': 'false',
      'aria-controls': panelId,
      id: buttonId,
    },
    `${item.label}<span class="nav-new-chevron" aria-hidden="true"></span>`,
  );

  const panel = createTag(
    'div',
    {
      class: 'nav-new-dropdown',
      id: panelId,
      hidden: '',
    },
  );

  const list = createTag('ul', { class: 'nav-new-dropdown-list' });

  item.children.forEach((child, index) => {
    const childLi = createTag('li', { class: 'nav-new-dropdown-item' });
    const childLink = createTag(
      'a',
      {
        href: child.href || '#',
        class: `nav-new-dropdown-link${index === 0 ? ' is-featured' : ''}`,
      },
      child.label,
    );
    childLi.append(childLink);
    list.append(childLi);
  });

  panel.append(list);
  li.append(button, panel);

  return li;
}

function buildSimpleNavItem(item) {
  const li = createTag('li', {
    class: 'nav-new-item',
    'data-nav-item': slugify(item.label),
  });

  const link = createTag(
    'a',
    {
      href: item.href || '#',
      class: 'nav-new-link',
    },
    item.label,
  );

  li.append(link);
  return li;
}

function buildPrimaryNav(data) {
  const navWrap = createTag('div', { class: 'nav-new-main' });

  const nav = createTag('nav', {
    class: 'nav-new-primary',
    'aria-label': 'Primary navigation',
  });

  const list = createTag('ul', { class: 'nav-new-list' });

  data.navItems.forEach((item) => {
    if (item.children?.length) {
      list.append(buildDropdownItem(item));
    } else {
      list.append(buildSimpleNavItem(item));
    }
  });

  nav.append(list);

  const actions = createTag('div', { class: 'nav-new-actions' });

  if (data.contact) {
    const contact = createTag(
      'a',
      {
        href: data.contact.href,
        class: 'nav-new-contact',
      },
      `
        <span class="nav-new-contact-phone">${data.contact.label}</span>
        ${data.contact.detail ? `<span class="nav-new-contact-detail">${data.contact.detail}</span>` : ''}
      `,
    );
    actions.append(contact);
  }

  if (data.cta) {
    const cta = createTag(
      'a',
      {
        href: data.cta.href || '#',
        class: 'nav-new-cta',
      },
      data.cta.label,
    );
    actions.append(cta);
  }

  navWrap.append(nav, actions);
  return navWrap;
}

function buildHamburger() {
  return createTag(
    'div',
    { class: 'nav-new-hamburger' },
    `
      <button type="button" class="nav-new-hamburger-button" aria-label="Open navigation" aria-expanded="false">
        <span class="nav-new-hamburger-icon" aria-hidden="true"></span>
      </button>
    `,
  );
}

function setCurrentState(block) {
  const pagePath = getPagePath();

  block.querySelectorAll('.nav-new-primary .nav-new-item').forEach((item) => {
    const directLink = item.querySelector(':scope > a.nav-new-link');

    if (directLink && pathsMatch(directLink.getAttribute('href'), pagePath)) {
      item.classList.add('is-current');
    }

    const childLinks = item.querySelectorAll('.nav-new-dropdown-link');
    const hasCurrentChild = [...childLinks].some((link) => pathsMatch(link.getAttribute('href'), pagePath));

    if (hasCurrentChild) {
      item.classList.add('is-active');
    }
  });
}

function closeAllDropdowns(block) {
  block.querySelectorAll('.nav-new-item.has-dropdown').forEach((item) => {
    item.classList.remove('is-open');

    const button = item.querySelector('.nav-new-dropdown-toggle');
    const panel = item.querySelector('.nav-new-dropdown');

    if (button) button.setAttribute('aria-expanded', 'false');
    if (panel) panel.hidden = true;
  });

  const language = block.querySelector('.nav-new-language');
  if (language) {
    language.classList.remove('is-open');
    const button = language.querySelector('.nav-new-language-toggle');
    const panel = language.querySelector('.nav-new-language-panel');
    if (button) button.setAttribute('aria-expanded', 'false');
    if (panel) panel.hidden = true;
  }
}

function toggleDropdown(item, block, forceOpen = null) {
  const isOpen = item.classList.contains('is-open');
  const shouldOpen = forceOpen !== null ? forceOpen : !isOpen;

  closeAllDropdowns(block);

  if (shouldOpen) {
    item.classList.add('is-open');
    const button = item.querySelector('.nav-new-dropdown-toggle');
    const panel = item.querySelector('.nav-new-dropdown');
    if (button) button.setAttribute('aria-expanded', 'true');
    if (panel) panel.hidden = false;
  }
}

function toggleLanguage(block, forceOpen = null) {
  const language = block.querySelector('.nav-new-language');
  if (!language) return;

  const button = language.querySelector('.nav-new-language-toggle');
  const panel = language.querySelector('.nav-new-language-panel');

  const isOpen = language.classList.contains('is-open');
  const shouldOpen = forceOpen !== null ? forceOpen : !isOpen;

  closeAllDropdowns(block);

  if (shouldOpen) {
    language.classList.add('is-open');
    if (button) button.setAttribute('aria-expanded', 'true');
    if (panel) panel.hidden = false;
  }
}

function closeMobileMenu(block) {
  block.classList.remove('nav-new-mobile-open');

  const button = block.querySelector('.nav-new-hamburger-button');
  if (button) {
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Open navigation');
  }

  document.body.style.overflowY = '';
  closeAllDropdowns(block);
}

function openMobileMenu(block) {
  block.classList.add('nav-new-mobile-open');

  const button = block.querySelector('.nav-new-hamburger-button');
  if (button) {
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-label', 'Close navigation');
  }

  document.body.style.overflowY = 'hidden';
}

function toggleMobileMenu(block) {
  if (block.classList.contains('nav-new-mobile-open')) {
    closeMobileMenu(block);
  } else {
    openMobileMenu(block);
  }
}

/* =========================
   STICKY NAV SHELL (NEW)
   Makes only .nav-new-shell sticky after 36px scroll
   Works on desktop and mobile
========================= */
function bindStickyShell(block) {
  const wrapper = block.querySelector('.nav-new-wrapper');
  const shell = block.querySelector('.nav-new-shell');

  if (!wrapper || !shell) return;

  const toggleSticky = () => {
    if (window.scrollY > 36) {
      shell.classList.add('is-sticky');
      wrapper.classList.add('has-sticky-shell');
    } else {
      shell.classList.remove('is-sticky');
      wrapper.classList.remove('has-sticky-shell');
    }
  };

  window.addEventListener('scroll', toggleSticky, { passive: true });
  window.addEventListener('resize', toggleSticky);
  toggleSticky();
}

function bindEvents(block) {
  block.querySelectorAll('.nav-new-item.has-dropdown').forEach((item) => {
    const button = item.querySelector('.nav-new-dropdown-toggle');
    if (!button) return;

    button.addEventListener('click', (e) => {
      e.preventDefault();

      if (DESKTOP.matches) {
        toggleDropdown(item, block);
      } else {
        const isOpen = item.classList.contains('is-open');
        if (isOpen) {
          item.classList.remove('is-open');
          button.setAttribute('aria-expanded', 'false');
          const panel = item.querySelector('.nav-new-dropdown');
          if (panel) panel.hidden = true;
        } else {
          item.classList.add('is-open');
          button.setAttribute('aria-expanded', 'true');
          const panel = item.querySelector('.nav-new-dropdown');
          if (panel) panel.hidden = false;
        }
      }
    });
  });

  const languageButton = block.querySelector('.nav-new-language-toggle');
  if (languageButton) {
    languageButton.addEventListener('click', (e) => {
      e.preventDefault();
      toggleLanguage(block);
    });
  }

  const hamburgerButton = block.querySelector('.nav-new-hamburger-button');
  if (hamburgerButton) {
    hamburgerButton.addEventListener('click', () => toggleMobileMenu(block));
  }

  document.addEventListener('click', (e) => {
    if (!block.contains(e.target)) {
      closeAllDropdowns(block);
      if (!DESKTOP.matches) closeMobileMenu(block);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns(block);
      if (!DESKTOP.matches) closeMobileMenu(block);
    }
  });

  DESKTOP.addEventListener('change', (e) => {
    if (e.matches) {
      document.body.style.overflowY = '';
      closeMobileMenu(block);
    } else {
      closeAllDropdowns(block);
    }
  });
}

function buildHeader(block, data) {
  const wrapper = createTag('div', { class: 'nav-new-wrapper' });

  const utility = buildUtilityRow(data);

  const shell = createTag('div', { class: 'nav-new-shell' });
  const brand = buildBrand(data);
  const main = buildPrimaryNav(data);
  const hamburger = buildHamburger();

  shell.append(brand, main, hamburger);
  wrapper.append(utility, shell);

  block.textContent = '';
  block.append(wrapper);
}

export default async function decorate(block) {
  const navPath = getNavPath();
  const fragment = await loadFragment(navPath);

  if (!fragment) {
    block.textContent = '';
    return;
  }

  const data = parseNavFragment(fragment);

  buildHeader(block, data);
  setCurrentState(block);
  bindEvents(block);

  /* =========================
     STICKY NAV INIT (NEW)
  ========================= */
  bindStickyShell(block);

  if (!DESKTOP.matches) {
    closeMobileMenu(block);
  } else {
    closeAllDropdowns(block);
  }
}
