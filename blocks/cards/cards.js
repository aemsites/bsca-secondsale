import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      const link = div.querySelectorAll('a[href]');
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else if (div.children.length === 1 && div.querySelector('p')) div.className = 'cards-card-title';
      else div.className = 'cards-card-body';
      if (link.length > 1) {
        link.forEach((a) => {

        });
      } else if (link) {
        const a = document.createElement('a');
        a.href = link[0].href;
        link[0].parentNode.remove();
        a.append(div);
        li.append(a);
      }
    });

    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);
}
