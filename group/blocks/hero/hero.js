import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const pics = block.querySelectorAll('picture > img');
  const widths = pics.length === 1 ? [568] : [250, 568];

  pics.forEach((img, i) => {
    const width = widths[Math.min(i, widths.length - 1)];
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, true, [{ width }]),
    );
  });
}
