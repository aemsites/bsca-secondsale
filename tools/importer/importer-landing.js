/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this */
const newhost = 'https://main--blueshieldca--aemsites.hlx.page';

function updateLocalLinks(main, document) {
  const links = main.querySelectorAll('a');
  links.forEach((link) => {
    if (link.href.startsWith('http://localhost:3001')) {
      const url = new URL(link.href);
      let newPathname = url.pathname.replace(/^\/_current/, '');
      link.href = `${newhost}${newPathname}`;
    }
  });
}

function packageSection(heading, cells, _style) {
  const headingText = document.createElement('h1');
  headingText.textContent = heading.textContent;
  const newBlock = WebImporter.DOMUtils.createTable(cells, document);
  const newDiv = document.createElement('div');
  newDiv.append(headingText);
  newDiv.append(newBlock);
  if (_style) {
    const sectionMeta = WebImporter.DOMUtils.createTable([['Section Metadata'], ['Style', _style]], document);
    newDiv.append(sectionMeta);
  }
  newDiv.append(document.createElement('hr'));
  return newDiv;
}

function importList(main, document) {
  const section = [...document.querySelectorAll('.kgoui_container_multicolumn > .kgo-container > .kgo-row')]
    .filter(row => row.textContent.trim() && row.querySelector('.kgoui_list'));

  if (section.length > 0) {
    
    const sectionParent = section[0].parentNode.parentNode;
    const heading = sectionParent.previousElementSibling;

    // insert hr after heading
    let hrElement = document.createElement("hr");
    heading.insertAdjacentElement("afterend", hrElement);
    
    section.forEach((el) => {
      const list = el.querySelector('.kgoui_list');
      const header = el.querySelector('.kgo-block-heading-header');
      const newHeader = document.createElement('h4');
      newHeader.textContent = header.textContent;
      header.replaceWith(newHeader);

      const listItems = list.querySelectorAll('li');
      const cells = [['List (border)']];
      listItems.forEach((li) => {
        const link = li.querySelector('a');
        const newLink = document.createElement('a');
        const linkTitle = link.querySelector('.kgo-title');
        newLink.textContent = linkTitle.textContent;
        newLink.href = link.href;

        const subList = document.createElement('ul');
        const subItems = document.createElement('li');
        const linkDesc = link.querySelector('.kgo-description');
        subItems.textContent = linkDesc.textContent;
        subList.append(subItems);
        
        const icon = link.querySelector('.kgo-action-icon');
        if (icon) {
          const linkIcon = document.createElement('li');
          if(icon.classList.contains('kgo-action-icon-drilldown')) {
            linkIcon.textContent = ':arrow:';
          } else if (icon.classList.contains('kgo-action-icon-external')) {
            linkIcon.textContent = ':new-tab:';
          }
          subList.append(linkIcon);
        }
        
        li.append(subList);
        link.replaceWith(newLink);

        const rootList = document.createElement('ul');
        rootList.append(li);

        cells.push([rootList]);
      });

      // header isn't a h1 heading. instead prepending the div with the heading
      const block = packageSection({}, cells, 'plan-updates');
      block.prepend(newHeader);
      el.replaceWith(block);

    });
  
  }


}

function importColumns(main, document) {
  let sectionDivs = document.querySelectorAll('.kgoui_container_multicolumn > .kgo-container > .kgo-row');
  if (sectionDivs.length === 0) {
    sectionDivs = document.querySelectorAll('.kgoui_container_responsive_column > .kgo-container > .kgo-row');
  }

  const section = [...sectionDivs].filter((row) => {
    const list = row.querySelectorAll('.kgoui_list');
    return row.textContent.trim() && list.length === 0;
  });

  let sectionParent;
  let heading;

  if (section.length > 0) {
    sectionParent = section[0].parentNode.parentNode;
    const previousElementSibling = sectionParent.previousElementSibling;
    const header = previousElementSibling.querySelector('.kgo-hero-heading');
    if (header && header.length > 0) {
      heading = previousElementSibling;
    }
    const cells = [['Columns (shaded)']];
    section.forEach((el) => {
      const colContents = el.querySelectorAll(".kgo-col-contents");
      colContents.forEach((col) => {
        const colTitle = col.querySelector('.kgo-title');
        if (colTitle) {
          const updatedTitle = document.createElement('h4');
          updatedTitle.textContent = colTitle.textContent;
          colTitle.replaceWith(updatedTitle);
        }
      
      });
      cells.push(colContents);
    });
    let block;
    if (heading) {
      block = packageSection(heading, cells);
      heading.remove();
    } else {
      block = packageSection({}, cells);
    }
    sectionParent.replaceWith(block);
  }
}

function importDisclaimer(main) {
  const section = main.querySelector('.kgoui_container_multicolumn .kgo-col.col-lg-10 sup');
  if (section) {
    const newDiv = document.createElement('div');
    // eslint-disable-next-line max-len
    const sectionParent = section.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode;

    const parts = section.innerHTML.split(/<br\s*\/?>\s*<br\s*\/?>/i).filter((part) => part.trim().length > 0);
    parts.forEach((p) => {
      const div = document.createElement('div');
      const em = document.createElement('em');
      em.append(p);
      div.append(em);
      newDiv.append(div);
    });
    // section.innerHTML = parts.map((p) => `<div>${p.trim()}</div>`).join('');
    sectionParent.replaceWith(newDiv);
  }
}

export default {
  /**
   * Apply DOM operations to the provided document and return
   * the root element to be then transformed to Markdown.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @returns {HTMLElement} The root element to be transformed
   */
  transform: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    // define the main element: the one that will be transformed to Markdown
    const main = document.querySelector('.kgoui_page_content');
    params.pdfsToDownload = [];
    const newPath = new URL(url).pathname;
    params.newPath = newPath;

    // attempt to remove non-content elements
    WebImporter.DOMUtils.remove(main, [
      'header',
      'footer',
      'a.kgo-page-skip-navigation',
      'a.kgo-empty',
      'div.kgo-empty',
    ]);

    updateLocalLinks(main, document);
    importDisclaimer(main);
    importColumns(main, document);
    importList(main, document);

    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    WebImporter.rules.convertIcons(main, document);

    const transformationResult = [{
      element: main,
      path: newPath,
      report: {
        previewUrl: `https://main--blueshieldca--aemsites.hlx.page${newPath}`,
      },
    }];
    transformationResult.push(...params.pdfsToDownload);
    return transformationResult;
  },

  /**
   * Return a path that describes the document being transformed (file name, nesting...).
   * The path is then used to create the corresponding Word document.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @return {string} The path
   */
  generateDocumentPath: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    let p = new URL(url).pathname;
    if (p.endsWith('/')) {
      p = `${p}index`;
    }
    return decodeURIComponent(p)
      .toLowerCase()
      .replace(/\.html$/, '')
      .replace(/[^a-z0-9/]/gm, '-');
  },
};
