/*
 * Accordion Block
 * Recreate an accordion
 * Docs: hlx.live/developer/block-collection/accordion
 *
 * Enhancements:
 *  - [open] token in label sets initial state.
 *  - Auto-scope: detect "accordion-card-list" marker
 *    and add 'accordion-card-grid' to the block.
 */

export default function decorate(block) {
  // Transform each row into <details><summary>...</summary> and an .accordion-item-body div
  [...block.children].forEach((row) => {
    const label = row.children[0];
    const body = row.children[1];

    // Detect [open] token before we move nodes
    const rawLabelText = label?.textContent || '';
    const hasOpenToken = /\[\s*open\s*\]/i.test(rawLabelText);

    // Build summary from label content
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    summary.append(...label.childNodes);
    // Remove the [open] token from the visible label
    summary.innerHTML = summary.innerHTML.replace(/\s*\[\s*open\s*\]\s*/gi, ' ').trim();

    // Decorate body
    body.className = 'accordion-item-body';

    // Wrap in details
    const details = document.createElement('details');
    details.className = 'accordion-item';
    if (hasOpenToken) details.setAttribute('open', '');

    details.append(summary, body);
    row.replaceWith(details);
  });

  // Auto-scope: if this accordion contains a calendar grid (marker row),
  // add a class so CSS can target only these accordions.
  const hasCalendarGrid = [...block.querySelectorAll('.accordion-item-body table')].some((table) => {
    const firstRow = table.querySelector('tr:first-child');
    return firstRow && /accordion-card-list/i.test(firstRow.textContent || '');
  });
  if (hasCalendarGrid) {
    block.classList.add('accordion-card-grid');
  }
}
