// row-link.js
export default function enableRowLinks({ rows, root = document }) {
  const interactors = 'a, button, input, select, textarea, [role="button"]';

  root.querySelectorAll(rows).forEach((li) => {
    const link = li.querySelector('a[href]');
    if (!link) return;

    li.addEventListener('click', (e) => {
      if (e.target.closest(interactors)) return;

      const href = link.getAttribute('href');
      const target = link.getAttribute('target') || '_self';

      if (e.button === 1 || e.metaKey || e.ctrlKey) {
        window.open(href, '_blank', 'noopener,noreferrer');
        return;
      }
      if (e.shiftKey) {
        window.open(href, target, 'noopener,noreferrer');
        return;
      }
      link.click();
    });

    if (!li.hasAttribute('tabindex')) li.setAttribute('tabindex', '0');
    if (!li.hasAttribute('role')) li.setAttribute('role', 'link');
    li.style.cursor = 'pointer';

    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        link.click();
      }
    });
  });
}
