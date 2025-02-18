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

function importColumns(main, document) {
  let section = document.querySelectorAll('.kgoui_container_multicolumn > .kgo-container > .kgo-row .kgo-col-contents');
  if (section.length === 0) {
    section = document.querySelectorAll('.kgoui_container_responsive_column > .kgo-container > .kgo-row .kgo-col-contents');
  }

  let sectionParent;
  let heading;

  if (section.length > 0) {
    sectionParent = section[0].parentNode.parentNode.parentNode.parentNode;
    heading = sectionParent.previousElementSibling;
    const cells = [['Columns (shaded)']];
    section.forEach((el) => {
      const content = document.createElement('div');
      content.append(el);
      cells.push([content]);
    });

    const block = packageSection(heading, cells);
    heading.remove();
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
