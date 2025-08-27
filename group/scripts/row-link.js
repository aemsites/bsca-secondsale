// Make any <li> act like a link if it contains an <a>
// No CSS required. Preserves accessibility & avoids conflicts.
export default function enableRowLinks({ rows }) {
  const interactors = 'a, button, input, select, textarea, [role="button"]';

  document.querySelectorAll(rows).forEach((li) => {
    // Find the first link in the row
    const link = li.querySelector('a[href]');
    if (!link) return;

    // Mouse: click anywhere on the row → go to link
    li.addEventListener('click', (e) => {
      // If the actual click was on an interactive element, let it behave normally
      if (e.target.closest(interactors)) return;

      // Respect modifier keys / mouse buttons
      const href = link.getAttribute('href');
      const target = link.getAttribute('target') || '_self';

      // Middle click or meta/ctrl → open in new tab
      if (e.button === 1 || e.metaKey || e.ctrlKey) {
        window.open(href, '_blank', 'noopener,noreferrer');
        return;
      }

      // Shift-click usually means "new window"; emulate default browser behavior
      if (e.shiftKey) {
        window.open(href, target, 'noopener,noreferrer');
        return;
      }

      // Otherwise navigate like a normal left-click
      // Use link.click() to preserve analytics/click handlers attached to <a>
      link.click();
    });

    // Keyboard: make the row focusable and activate on Enter/Space
    if (!li.hasAttribute('tabindex')) li.setAttribute('tabindex', '0');
    if (!li.hasAttribute('role')) li.setAttribute('role', 'link');

    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); // prevent page scroll on Space
        link.click();
      }
    });

    // Optional: visual cue without CSS changes
    li.style.cursor = 'pointer';
  });
}
