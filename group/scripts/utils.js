/**
 * Wraps images followed by links within a matching <a> tag.
 * @param {Element} container The container element
 */
export function wrapImgsInLinks(container) {
  const pictures = container.querySelectorAll('picture');
  pictures.forEach((pic) => {
    const link = pic.nextElementSibling;
    if (link && link.tagName === 'A' && link.href) {
      link.innerHTML = pic.outerHTML;
      pic.replaceWith(link);
    }
  });
}

// Wraps text preceeded by a link with the link.
/**
 * Wraps text preceded by a link within the link.
 * @param {Element} container The container element
 */
export function wrapTextInLinks(container) {
  const links = container.querySelectorAll('a');
  links.forEach((link) => {
    const text = link.parentElement.nextElementSibling;
    if (text) {
      link.innerHTML = text.innerHTML;
      text.remove();
    }
  });
}

/**
 * Handles external links and PDFs to be opened in a new tab/window
 * @param {Element} main The main element
 */
export function decorateExternalLinks(main) {
  main.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href) {
      const extension = href.split('.').pop().trim();
      if (!href.startsWith('/')
        && !href.startsWith('#')) {
        if (!href.includes('blueshieldca.com/group') || (extension === 'pdf')) {
          a.setAttribute('target', '_blank');
        }
      }
    }
  });
}
