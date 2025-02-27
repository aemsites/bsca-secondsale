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
    const lParent = link.parentElement;
    const content = slide.querySelector('div');
    if (link) {
      link.classList.remove('button');
      slide.prepend(link);
      link.replaceChildren(...content.childNodes);
    }
    lParent.remove();
    content.remove();
  });
  let currentSlide = 0;


  const rightArrow = document.createElement('span');
  rightArrow.textContent = '→';
  rightArrow.classList.add('slider-arrow');
  rightArrow.addEventListener('click', () => {
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlider(slides, currentSlide);
  });
  block.appendChild(rightArrow);

  const leftArrow = document.createElement('span');
  leftArrow.textContent = '←';
  leftArrow.classList.add('slider-arrow');
  leftArrow.addEventListener('click', () => {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateSlider(slides, currentSlide);
  });
  block.appendChild(leftArrow);

  updateSlider(slides, currentSlide);
}
