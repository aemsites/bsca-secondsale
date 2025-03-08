import { createOptimizedPicture } from '../../scripts/aem.js';
import { wrapTextInLinks } from '../../scripts/utils.js';

export default function decorate(block) {
  const links = block.querySelectorAll('a');
  links.forEach((tag) => {
    tag.classList.remove('button');
  });
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      const link = div.querySelector('a');
      if (div.children.length === 1 && link) {
        div.className = 'cards-card';
        link.parentElement.replaceWith(link);
      } else {
        div.className = 'cards-card-body';
      }
      wrapTextInLinks(div);
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);
}
