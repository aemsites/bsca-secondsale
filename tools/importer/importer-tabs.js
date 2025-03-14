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
const newhost = 'https://main--bsca-secondsale--aemsites.aem.page';

function cleanUpHtml(main, document) {
  for (const el of main.querySelectorAll('a, b, em, i, small, span, strong')) {
    if (el.outerHTML.includes(` </${el.tagName.toLowerCase()}>`)) {
      el.innerHTML = el.innerHTML.trimEnd();
      el.after(' ');
    }
  }

  // remove empty tags
  for (const el of main.querySelectorAll('a, b, em, i, small, span, strong, div')) {
    if (el.innerHTML.trim() === '') {
      el.remove();
    }
  }
}

function updateLocalLinks(main, document) {
  const links = main.querySelectorAll('a');
  links.forEach((link) => {
    if (link.href.startsWith('http://localhost:3001')) {
      const url = new URL(link.href);
      const newPathname = url.pathname.replace(/^\/_current/, '');
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

function importHeading(main, document) {
  const currentHeading = main.querySelector('#kgoui_Rcontent_I0');
  const headingText = document.createElement('h1');
  headingText.textContent = currentHeading.textContent;
  main.prepend(headingText);
  currentHeading.remove();
}

function importTabs(main, document) {
  const section = [...main.querySelectorAll('.kgoui_container_multicolumn > .kgo-container > .kgo-row')].filter((row) => {
    const { children } = row;
    const colsMatch = children.length === 1
      && children[0].classList.contains('col-lg-10');

    return colsMatch;
  });

  let sectionParent;

  if (section.length > 0) {
    section.forEach((el) => {
      const cells = [['Tabs']];
      sectionParent = el.parentNode.parentNode;
      const tabsHeading = el.querySelector('.kgo-block-heading-header');
      const tabs = el.querySelectorAll('.kgo-tabs ul li .kgo-tab-title');
      const tabContent = el.querySelectorAll('.kgo-tab-content');
      let count = 0;
      tabs.forEach((tab) => {
        const tabLabel = document.createElement('div');
        tabLabel.append(tab.innerText);
        const content = document.createElement('div');
        const span = tabContent[count].querySelectorAll('span');
        if (span.length > 0) {
          span.forEach((s) => {
            s.remove();
          });
        }
        content.append(tabContent[count]);
        cells.push([tabLabel, content]);
        count += 1;
      });
      const block = packageSection(tabsHeading, cells);
      sectionParent.replaceWith(block);
    });
  }
}

function createFragment(name, main, document) {
  const section = main.querySelector('.kgoui_object.kgoui_container_responsive3_column');
  const cells = [['Fragment']];
  const content = document.createElement('a');
  content.href = `${newhost}/fragments/${name}`;
  content.innerText = `${newhost}/fragments/${name}`;
  cells.push([content]);
  main.append(WebImporter.DOMUtils.createTable(cells, document));
  section.remove();
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

    cleanUpHtml(main, document);
    updateLocalLinks(main, document);
    importHeading(main, document);
    importTabs(main, document);
    createFragment('glossary', main, document);

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
