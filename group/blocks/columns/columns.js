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
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
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
