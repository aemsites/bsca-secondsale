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
/**
 * Use on:
 * Langing pages
 * New plan pages
 */

const newhost = 'https://main--bsca-secondsale--aemsites.aem.page/group';

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

function insertLogo(main, document) {
    const homeicon = main.querySelector('.tpl-home-link');
    homeicon.querySelector('img').remove();
    homeicon.textContent = ":multi-state-logo:";
    let hrElement = document.createElement("hr");
    homeicon.insertAdjacentElement("afterend", hrElement);
}

function importNav(main, document) {
    main.querySelector('.tpl-title').remove();
    main.querySelector('.tpl-user-menu').remove();
    main.querySelector('.tpl-nav-menu').remove();
    main.querySelector('#tpl_message_center_link').remove();
    const navElements = main.querySelectorAll('.tpl-menu.kgo-is-section-menu');
    const mainNav = document.createElement('ul');
    navElements.forEach((navEl) => {
        navEl.querySelectorAll('.kgo-action-icon').forEach((icon) => icon.remove());
        const navText = navEl.querySelector('a').textContent;
        const navItem = document.createElement('li');
        navItem.append(navText);
        const tertiaryText = navEl.querySelectorAll('ul li div.kgo-tertiary-text');
        tertiaryText.forEach((textElem) => {
            const ss = document.createElement('sub');
            ss.textContent = textElem.textContent;
            const parentElem = textElem.closest('li');
            textElem.remove();
            parentElem.append(document.createElement('br'));
            parentElem.append(ss);
        });
        navItem.append(navEl.querySelector('.tpl-menu-content'));
        mainNav.append(navItem);
        navEl.remove();
    });
    main.append(mainNav);
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
      const main = document.querySelector('header');
      params.pdfsToDownload = [];
      const newPath = new URL(url).pathname + '/nav';
      params.newPath = newPath;

      const head = document.querySelector('head');

  
      // attempt to remove non-content elements
      WebImporter.DOMUtils.remove(main, [
        'footer'        
      ]);
  
      cleanUpHtml(main, document);
      updateLocalLinks(main, document);
      insertLogo(main, document);
      importNav(main, document);
      
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      WebImporter.rules.convertIcons(main, document);
  
      const transformationResult = [{
        element: main,
        path: newPath,
        report: {
          previewUrl: `https://main--blueshieldca--aemsites.aem.page/group${newPath}`,
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
        console.log("here");
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
  