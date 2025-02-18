export function addDropdown(contentBox) {
  if (contentBox == null || contentBox.querySelector('ul') == null) {
    return;
  }

  const selectElWrapper = document.createElement('div');
  selectElWrapper.classList.add('select-wrapper');
  const selectEl = document.createElement('select');

  const ul = contentBox.querySelector('ul');
  ul.querySelectorAll('li').forEach((liElement) => {
    const t = liElement.querySelector('a');

    const optionElement = document.createElement('option');
    optionElement.text = liElement.textContent;
    if (t) {
      optionElement.value = t.href;
    }
    selectEl.appendChild(optionElement);
  });
  contentBox.querySelector('ul').remove();
  selectElWrapper.appendChild(selectEl);
  contentBox.append(selectElWrapper);

  selectEl.addEventListener('change', () => {
    const selectedOption = selectEl.value;
    if (selectedOption) {
      window.location.href = selectedOption;
    }
  });
}

export function removeEmptyPTags(element) {
  element.querySelectorAll('p').forEach((p) => {
    // get rid of empty p tags
    if (p.textContent.trim() === '') {
      p.remove();
    }
  });
}

export default function decorate(block) {
  const elementContainer = block.querySelector(':scope > div > div');
  const selectList = document.createElement('div');
  selectList.classList.add('select-content-container');
  selectList.append(...elementContainer.children);

  addDropdown(selectList);

  block.prepend(selectList);
  elementContainer.parentElement.remove();
  removeEmptyPTags(block);
}
