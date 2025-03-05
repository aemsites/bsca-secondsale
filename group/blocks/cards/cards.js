import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
      if (div.children.length === 3) {
        const a = div.querySelector('a[href]');
        a.replaceChildren(div.children[0], div.children[2]);
        div.append(a);
      }
      if (div.children.length > 3) {
        const links = div.querySelectorAll('a[href]');
        links.forEach((a) => {
          const text = a.parentNode.nextElementSibling;
          a.classList.remove(...a.classList);
          a.replaceChildren(text);
          a.parentElement.remove();
          div.append(a);
        });
      }
    });
    if (li.children.length === 2) {
      const link = li.querySelector('a[href]');
      link.classList.remove(...link.classList);
      li.append(link);
      li.querySelector('p.button-container').remove();
      link.replaceChildren(li.children[0], li.children[1]);
    }
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);
}
