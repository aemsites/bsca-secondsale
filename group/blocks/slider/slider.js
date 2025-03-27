// Show the current slide
function updateSlider(slides, currentSlide) {
  slides.forEach((slide, index) => {
    slide.style.display = index === currentSlide ? 'block' : 'none';
  });
}

export default async function decorate(block) {
  // Build a slider with arrows to advance to the next slide
  const slides = block.querySelectorAll(':scope > div');
  slides.forEach((slide) => {
    const link = slide.querySelector('a');
    const content = slide.querySelector('div');
    if (link) {
      link.classList.remove('button');
      slide.prepend(link);
      const heading = content.querySelector('h2, h3, h4');
      if (heading) {
        link.replaceChildren(heading);
      }
    }
  });
  let currentSlide = 0;

  const controls = document.createElement('span');

  const leftArrow = document.createElement('span');
  leftArrow.textContent = '←';
  leftArrow.classList.add('slider-arrow');
  leftArrow.setAttribute('aria-label', 'Previous slide');
  leftArrow.addEventListener('click', () => {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateSlider(slides, currentSlide);
  });
  controls.appendChild(leftArrow);
  block.appendChild(controls);

  controls.classList.add('slider-controls');
  const rightArrow = document.createElement('span');
  rightArrow.textContent = '→';
  rightArrow.classList.add('slider-arrow');
  rightArrow.setAttribute('aria-label', 'Next slide');
  rightArrow.addEventListener('click', () => {
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlider(slides, currentSlide);
  });
  controls.appendChild(rightArrow);

  updateSlider(slides, currentSlide);
}
