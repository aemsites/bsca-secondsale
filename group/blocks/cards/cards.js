import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  if (!block.classList.contains('buttons')) {
    const links = block.querySelectorAll('a');
    links.forEach((tag) => {
      tag.classList.remove('button');
    });
  }
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else {
        div.className = 'cards-card-body';
        if (block.classList.contains('buttons')) {
          // Check if the div contains only elements with links
          const allLinks = [...div.children].every((child) => child.classList.contains('button-container'));
          if (allLinks) {
            div.parentElement.classList.add('no-border');
          }
        }
      }
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);
}
