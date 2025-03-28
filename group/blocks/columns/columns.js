export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  const colControls = [];
  block.classList.add(`columns-${cols.length}-cols`);
  block.classList.forEach((className) => {
    if (className.startsWith('cols-')) {
      const columns = className.substring(5);
      columns.split('-').forEach((col) => {
        colControls.push(col);
      });
    }
  });

  // setup image columns
  [...block.children].forEach((row) => {
    let index = 0;
    [...row.children].forEach((col) => {
      col.classList.add(`flex-${colControls[index]}`);
      index += 1;
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1
          && pic.parentNode.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        } else if (picWrapper) {
          // check if an icon and a link are present in the same line.
          const images = picWrapper.querySelectorAll('picture');
          images.forEach((img) => {
            const nextSibling = img.nextElementSibling;
            if (nextSibling && nextSibling.tagName === 'A') {
              img.classList.add('col-card-icon');
              nextSibling.classList.add('col-card-link');
              img.parentNode.classList.add('card-link');
            }
          });
        }
      }
      const buttons = col.querySelectorAll('p:not(.button-container) em a');
      buttons.forEach((button) => {
        button.classList.add('button', 'secondary');
        const buttonWrapper = button.closest('p');
        if (buttonWrapper && buttonWrapper.children.length === 1) {
          buttonWrapper.classList.add('button-container');
        }
      });
    });
  });
}
