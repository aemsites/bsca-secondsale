import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const pics = block.querySelectorAll('picture > img');
  const widths = pics.length === 1 ? [568] : [250, 568];

  pics.forEach((img, i) => {
    const width = widths[Math.min(i, widths.length - 1)];
    const pic = img.closest('picture');
    const parent = img.closest('p');
    pic.replaceWith(
      createOptimizedPicture(img.src, img.alt, true, [{ width }]),
    );
    if (width === 250) {
      parent.classList.add('group-logo');
    }
  });
}
