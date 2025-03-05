/*
 * Table Block
 * Recreate a table
 * https://www.hlx.live/developer/block-collection/table
 */

function buildCell(rowIndex, double) {
  // eslint-disable-next-line no-param-reassign
  if (double && rowIndex === 1) rowIndex = 0;
  const cell = rowIndex ? document.createElement('td') : document.createElement('th');
  if (!rowIndex) cell.setAttribute('scope', 'col');
  return cell;
}

export default async function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  const header = !block.classList.contains('no-header');
  const double = block.classList.contains('double-header');
  if (header) table.append(thead);
  table.append(tbody);

  [...block.children].forEach((child, i) => {
    const row = document.createElement('tr');
    if (header && i === 0) thead.append(row);
    else if (header && double && i === 1) thead.append(row);
    else tbody.append(row);
    [...child.children].forEach((col) => {
      const cell = buildCell(header ? i : i + 1, double);
      const align = col.getAttribute('data-align');
      const valign = col.getAttribute('data-valign');
      if (align) cell.style.textAlign = align;
      if (valign) cell.style.verticalAlign = valign;
      if (col.innerHTML.includes('(colspan-2)')) {
        cell.setAttribute('colspan', 2);
        col.innerHTML = col.innerHTML.replace('(colspan-2)', '');
      }
      cell.innerHTML = col.innerHTML;
      row.append(cell);
    });
  });
  block.innerHTML = '';
  block.append(table);
}
