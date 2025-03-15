import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const img = block.querySelector('picture > img');
  img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, true, [{ width: '600' }]));
}
