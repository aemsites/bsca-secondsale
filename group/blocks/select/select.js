import { span } from '../../scripts/dom-helpers.js';

export default function decorate(block) {
  const selected = block.querySelector('p');
  const dropdown = block;
  const options = block.querySelectorAll('ul li a');
  const icon = span({ class: 'chevron' });
  selected.append(icon);

  selected.addEventListener('click', (event) => {
    event.stopPropagation();
    dropdown.classList.toggle('open');
  });

  options.forEach((option) => {
    option.addEventListener('click', () => {
      selected.textContent = option.textContent;
      dropdown.classList.remove('open');
    });
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('open');
  });
}
