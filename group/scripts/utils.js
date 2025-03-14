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
