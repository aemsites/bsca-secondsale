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
        } else if (picWrapper && picWrapper.children.length === 2) {
          const picParentNextSibling = picWrapper.previousElementSibling;
          if (picParentNextSibling) {
            const link = picParentNextSibling.querySelector('a');
            if (link) {
              const linkWrapper = document.createElement('a');
              linkWrapper.href = link.href;
              linkWrapper.appendChild(pic);
              picWrapper.replaceWith(linkWrapper);
              linkWrapper.classList.add('columns-img-col');
            }
          }
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

      const icons = col.querySelectorAll('.icon');
      icons.forEach((icon) => {
        const nextSibling = icon.nextElementSibling;
        if (nextSibling && nextSibling.tagName === 'A') {
          const parentElement = icon.parentNode;
          parentElement.classList.add('card-link');
        } else {
          const parentContainer = icon.closest('p');
          const iconTitle = parentContainer.nextElementSibling;
          if (iconTitle && iconTitle.tagName === 'H4') {
            const newContainer = document.createElement('div');
            newContainer.classList.add('icon-container');
            newContainer.appendChild(icon);
            const newTitleContainer = document.createElement('div');
            newTitleContainer.classList.add('icon-title');
            const subTitle = iconTitle.nextElementSibling;
            newTitleContainer.appendChild(iconTitle);
            if (subTitle && subTitle.tagName === 'P' && subTitle.querySelector('EM')) {
              newTitleContainer.appendChild(subTitle);
            }
            newContainer.appendChild(newTitleContainer);
            parentContainer.replaceWith(newContainer);
          }
        }
      });
    });
  });
}
