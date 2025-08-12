/*
 * Accordion Block
 * Recreate an accordion
 * https://www.hlx.live/developer/block-collection/accordion
 *
 * Enhancement: Support a `[open]` token in the label cell to set initial state.
 * Example in Word: ":calendar: January [open]" => that accordion starts open.
 */

export default function decorate(block) {
  [...block.children].forEach((row) => {
    // 1) Grab cells
    const label = row.children[0];
    const body = row.children[1];

    // 2) Detect the [open] token before moving nodes
    const rawLabelText = label?.textContent || '';
    const hasOpenToken = /\[\s*open\s*\]/i.test(rawLabelText);

    // 3) Build the <summary> from label content
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    summary.append(...label.childNodes);

    // Remove the [open] token from the visible label (preserve any markup)
    summary.innerHTML = summary.innerHTML.replace(/\s*\[\s*open\s*\]\s*/gi, ' ').trim();

    // 4) Decorate body
    body.className = 'accordion-item-body';

    // 5) Wrap in <details>
    const details = document.createElement('details');
    details.className = 'accordion-item';

    // If the label had [open], start this item open
    if (hasOpenToken) {
      details.setAttribute('open', '');
    }

    details.append(summary, body);
    row.replaceWith(details);
  });
}
