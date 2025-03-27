/*
 * Copyright 2023 Adobe. All rights reserved.
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

function moveWhitespaceOutsideTag(main, document) {
  // move whitespace outside strong/b/em etc.
  // apply to all inline elements
  for (const el of main.querySelectorAll('a, b, em, i, small, span, strong')) {
    if (el.outerHTML.includes(` </${el.tagName.toLowerCase()}>`)) {
      el.innerHTML = el.innerHTML.trimEnd();
      el.after(' ');
    }
  }

  // remove empty tags
  for (const el of main.querySelectorAll('a, b, em, i, small, span, strong')) {
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
      let newPathname = url.pathname.replace(/^\/_current/, '');
      link.href = `${newhost}${newPathname}`;
    }
  });
}

function packageSection(heading, cells, _style) {
  const headingText = document.createElement('h2');
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

async function previewAndGetMediaUrlForFile(resourcePath) {
  try {
    const postResp = await fetch(
      `https://admin.hlx.page/preview/aemsites/blueshieldca/main/${resourcePath}`,
      { method: 'POST' },
    );
    const status = await postResp.json();
    return status.preview.redirectLocation;
  } catch (e) {
    console.log('could not get media url for ', resourcePath, e);
    console.log("run with 'save to files', then try again");
    return null;
  }
}

async function publishAndGetMediaUrlForFile(resourcePath) {
  try {
    const postResp = await fetch(
      `https://admin.hlx.page/publish/aemsites/blueshieldca/main/${resourcePath}`,
      { method: 'POST' },
    );
    const status = await postResp.json();
    return status.live.redirectLocation;
  } catch (e) {
    console.log('could not get media url for ', resourcePath, e);
    console.log("run with 'save to files', then try again");
    return null;
  }
}

async function detectPdfLinks(main, document, params) {
  const pdfLinks = main.querySelectorAll('a[href$=".pdf"]');
  const promises = Array.from(pdfLinks).map(async (a) => {
    let pdfUrl = a.href;
    let pdfName;

    try {
      const u = new URL(pdfUrl);
      let newPath = u.pathname;
      if (u.searchParams.has('fileName')) {
        // Use the CORS Proxy to fetch the PDF and follow the redirect
        const proxyUrl = 'https://api.allorigins.win/get?url=';

        // Attempt to fetch the PDF with 'no-cors' to bypass CORS restrictions
        const response = await fetch(proxyUrl + encodeURIComponent(pdfUrl), {
          method: 'GET',
          headers: {
            Origin: 'https://api.allorigins.win',
            'X-Requested-With': 'XMLHttpRequest',
          },
          mode: 'no-cors',
          redirect: 'follow',
        });

        if (response.ok || response.type === 'opaque') {
          pdfUrl = response.url;
          newPath = WebImporter.FileUtils.sanitizePath(pdfUrl);
        } else {
          console.warn(`Failed to fetch PDF through proxy: ${pdfUrl}`);
          return;
        }
      }

      // Add to download list
      params.pdfsToDownload.push({
        from: pdfUrl,
        path: newPath,
      });

      a.href = newPath;
    } catch (error) {
      console.error(`Error processing PDF link: ${pdfUrl}`, error);
    }
  });

  await Promise.all(promises);
}

function importTopBanner(main, document) {
  const section = main.querySelectorAll('.kgo-content-wrapper .kgo-content-wrapper-contents .kgo-hero .kgo-hero-content .kgo-hero-subheading');
  if (section.length > 0) {
    const sectionParent = main.querySelector('.kgo-content-wrapper');
    if (section.length > 0 && !sectionParent.previousElementSibling) {
      const cells = [['Banner']];
      const content = document.createElement('div');
      section.forEach((el) => {
        if (el.innerHTML) {
          el.removeAttribute('class');
          content.append(el);
        }
      });
      cells.push([content]);
      sectionParent.replaceWith(WebImporter.DOMUtils.createTable(cells, document));
    }
  }
}

function importSelectPlan(main, document) {
  const section = [...document.querySelectorAll('.kgoui_container_simple3_column > .kgo-container > .kgo-row')].filter((row) => {
    const { children } = row;
    const colsMatch = children.length === 3
      && children[0].classList.contains('col-lg-4')
      && children[1].classList.contains('col-lg-4')
      && children[2].classList.contains('col-lg-4');
    const cards = row.querySelectorAll('.kgo-card-set');
    return colsMatch && cards.length == 0 && row.textContent.trim().length > 0;
  });

  let sectionParent;
  let heading;
  if (section.length > 0) {
    sectionParent = section[0].parentNode.parentNode;
    heading = sectionParent.previousElementSibling;
    const cells = [['Columns (cols-4-4-4)']];
    section.forEach((el) => {
      const cols = el.querySelectorAll('.kgo-col');
      const planHelpCols = [];
      cols.forEach((col) => {
        col.removeAttribute('class');
        col.removeAttribute('id');
        const colHeader = col.querySelector('.kgoui_html h2');
        if (colHeader) {
          const newColHeader = document.createElement('h5');
          newColHeader.innerHTML = colHeader.innerHTML;
          colHeader.replaceWith(newColHeader);
        }
        const iconCards = col.querySelectorAll('.kgoui_list_items .kgoui_object.kgo-list-item');
        iconCards.forEach((iconCard) => {
          const icon = iconCard.querySelector('img');
          const iconLink = iconCard.querySelector('a');
          const iconCardNew = document.createElement('div');
          const newLink = document.createElement('a');
          newLink.href = iconLink.href;
          newLink.textContent = iconLink.textContent;
          iconCardNew.append(icon);
          iconCardNew.append(newLink);
          col.append(iconCardNew);
          iconCard.remove();
        });
        planHelpCols.push(col);
      });
      cells.push(planHelpCols);
      el.parentNode.remove();
    });
    const block = packageSection(heading, cells);
    heading.remove();
    sectionParent.replaceWith(block);
  }
}

function importPrograms(main) {
  const section = main.querySelectorAll('.kgoui_container_simple3_column .kgo-container .kgo-row .kgo-card-set ul a');
  if (section.length > 0) {
    let sectionParent;
    let heading;

    if (section.length > 0) {
      sectionParent = main.querySelector('.kgoui_container_simple3_column');
      heading = sectionParent.previousElementSibling;
      const cells = [['Cards']];
      section.forEach((el) => {
        const cardCols = [];
        const image = el.querySelector('img');
        const imgElement = document.createElement('div');
        imgElement.append(image);
        cardCols.push(imgElement);


        const content = document.createElement('div');
        const title = el.querySelector('.kgo-title');
        title.removeAttribute('class');
        const card = document.createElement('a');
        card.href = el.href;
        card.append(title);
        content.append(card);
        const description = el.querySelector('.kgo-description');
        description.removeAttribute('class');
        content.append(description);

        cardCols.push(content);
        cells.push(cardCols);
        
      });

      const block = packageSection(heading, cells);
      heading.remove();
      sectionParent.replaceWith(block);
    }
  }
}

function importPlanOptions(main, document) {
  const section = [...document.querySelectorAll('.kgoui_container_multicolumn > .kgo-container > .kgo-row')].filter((row) => {
    const { children } = row;

    // Check for the first condition: 3 children in order
    const colsMatch = children.length === 3
      && children[0].classList.contains('col-lg-4')
      && children[1].classList.contains('col-lg-5')
      && children[2].classList.contains('col-lg-3');

    // Check for the second condition: 1 child that is col-lg-12 and does NOT contain a <sup>
    const colsMatch2 = children.length === 1
      && children[0].classList.contains('col-lg-12')
      && !children[0].querySelector('sup');

    return colsMatch || colsMatch2;
  });

  let sectionParent;
  let heading;

  if (section.length > 0) {
    sectionParent = section[0].parentNode.parentNode;
    heading = sectionParent.previousElementSibling;
    if (!heading) {
      section.shift();
      sectionParent = section[1].parentNode.parentNode;
      heading = sectionParent.previousElementSibling;
    }
    const cells = [['Columns (title, cols-4-5-2, striped-rows)']];
    section.forEach((el) => {
      const costs = el.querySelector('.kgo-col:first-child .kgoui_html');
      costs.removeAttribute('class');
      costs.removeAttribute('id');
      const planHeader = costs.querySelector('h2');
      const newPlanHeader = document.createElement('h5');
      newPlanHeader.innerHTML = planHeader.innerHTML;
      planHeader.replaceWith(newPlanHeader);

      const highlights = el.querySelector('.kgo-col:nth-child(2) .kgoui_html');
      if (highlights) {
        highlights.removeAttribute('class');
        highlights.removeAttribute('id');
      }
      const ctas = el.querySelector('.kgo-col:nth-child(3)');
      if (ctas) {
        const links = ctas.querySelectorAll('a');
        const newDiv = document.createElement('div');
        const linkCount = links.length;
        links.forEach((link) => {
          link.removeAttribute('class');
          link.removeAttribute('id');
          const linkDiv = document.createElement('div');
          if (link.getAttribute('role') === 'button') {
            if (linkCount > 2) {
              const bTag = document.createElement('b');
              bTag.append(link.cloneNode(true));
              linkDiv.append(bTag);
            } else {
              const emTag = document.createElement('em');
              emTag.append(link.cloneNode(true));
              linkDiv.append(emTag);
            }
            newDiv.append(linkDiv);
          } else {
            const plainLink = document.createElement('p');
            plainLink.append(link.cloneNode(true));
            linkDiv.append(plainLink);
            newDiv.append(linkDiv);
          }
          link.remove();
        });
        cells.push([costs, highlights, newDiv]);
      } else {
        cells.push([costs]);
      }
      el.parentNode.remove();
    });
    const block = packageSection(heading, cells);
    heading.remove();
    sectionParent.replaceWith(block);
  }
}

function importPharmacy(main, document) {
  const section = [...document.querySelectorAll('.kgoui_container_multicolumn > .kgo-container > .kgo-row')].filter((row) => {
    const { children } = row;
    const colsMatch = children.length === 3
      && children[0].classList.contains('col-lg-3')
      && children[1].classList.contains('col-lg-6')
      && children[2].classList.contains('col-lg-3');
    return colsMatch;
  });

  let sectionParent;
  let heading;

  if (section.length > 0) {
    sectionParent = section[0].parentNode.parentNode;
    heading = sectionParent.previousElementSibling;
    const cells = [['Columns (cols-3-6-3)']];
    section.forEach((el) => {
      const image = el.querySelector('.kgo-col:first-child img');
      const benefits = el.querySelector('.kgo-col:nth-child(2) .kgoui_html');
      benefits.removeAttribute('class');
      benefits.removeAttribute('id');
      const benefitsHeader = benefits.querySelector('h2');
      const newBenefitsHeader = document.createElement('h5');
      newBenefitsHeader.append(benefitsHeader.textContent);
      benefitsHeader.replaceWith(newBenefitsHeader);

      const ctas = el.querySelector('.kgo-col:nth-child(3)');
      if (ctas) {
        const links = ctas.querySelectorAll('a');
        const newDiv = document.createElement('div');

        links.forEach((link) => {

          link.removeAttribute('class');
          link.removeAttribute('id');
          const linkDiv = document.createElement('div');
          if (link.getAttribute('role') === 'button') {
            const emTag = document.createElement('em');
            emTag.append(link.cloneNode(true));
            linkDiv.append(emTag);
            newDiv.append(linkDiv);
          } else {
            linkDiv.append(link.cloneNode(true));
            newDiv.append(linkDiv);
          }
          link.remove();
        });
        cells.push([image, benefits, newDiv]);
      }
      const block = packageSection(heading, cells);
      heading.remove();
      sectionParent.replaceWith(block);
    });
  }
}

function importServices(main, document) {
  const section = [...document.querySelectorAll('.kgoui_container_simple2_column > .kgo-container > .kgo-row')].filter((row) => {
    const { children } = row;
    const colsMatch = children.length === 2
      && children[0].classList.contains('col-lg-6')
      && children[1].classList.contains('col-lg-6');
    return colsMatch;
  });

  let sectionParent;
  let heading;

  if (section.length > 0) {
    sectionParent = section[0].parentNode.parentNode;
    heading = sectionParent.previousElementSibling;
    const cells = [['Cards (list)']];
    section.forEach((el) => {
      const content = el.querySelectorAll('ul');
      content.forEach((ul) => {
        ul.removeAttribute('class');
        ul.removeAttribute('id');
        const items = ul.querySelectorAll('li');
        const cardDiv = document.createElement('div');
        items.forEach((li) => {
          const link = li.querySelector('a');
          const icon = li.querySelector('img');
          const title = li.querySelector('.kgo-textblock .kgo-title');
          const description = li.querySelector('.kgo-textblock .kgo-description');
          if (link) {
            const descText = description.textContent;
            link.append(title);
            description.remove();
            cardDiv.append(link);
            cardDiv.append(descText);
          } else if (icon) {
            const imgSpan = document.createElement('span');
            const imgPath = icon.getAttribute('src');
            const imgFileName = imgPath.substring(imgPath.lastIndexOf('/') + 1); // Extract file name
            const imgFileNameWithoutExt = imgFileName.substring(0, imgFileName.lastIndexOf('.')); // Remove extension
            const decodedFileName = decodeURIComponent(imgFileNameWithoutExt); // Decode URL-encoded characters
            const formattedFileName = decodedFileName
              .toLowerCase()
              .replace(/\(\d+\)/g, '').trim(); // Remove any string in the format "(number)"
            imgSpan.textContent = ':'+formattedFileName+': ';
            cardDiv.append(imgSpan);
            cardDiv.append(title.textContent);
          } else {
            cardDiv.append(title);
            cardDiv.append(description);
          }
          li.remove();
        });
        ul.remove();
        cells.push([cardDiv]);
      });
      el.remove();
    });
    const block = packageSection(heading, cells, 'two-cards');
    heading.remove();
    sectionParent.replaceWith(block);
  }
}

function importNetwork(main, document) {
  let section;
  section = [...document.querySelectorAll('.kgoui_container_responsive_asymmetric2_column > .kgo-container > .kgo-row')].filter((row) => {
    const { children } = row;
    const colsMatch = children.length === 2
      && children[0].classList.contains('col-lg-8')
      && children[1].classList.contains('col-lg-4');
    return colsMatch;
  });
  if (section.length === 0) {
    section = [...document.querySelectorAll('.kgoui_container_multicolumn > .kgo-container > .kgo-row')].filter((row) => {
      const { children } = row;
      const colsMatch = children.length === 2
        && children[0].classList.contains('col-lg-8')
        && children[1].classList.contains('col-lg-4');
      return colsMatch;
    });
  }
  let sectionParent;
  let heading;
  if (section.length > 0) {
    sectionParent = section[0].parentNode.parentNode;
    heading = sectionParent.previousElementSibling;
    const correctSection = heading.textContent.includes('Find a doctor in network');
    if (!correctSection) {
      const cells = [['Columns (fad)']];
      section.forEach((el) => {
        cells.push([el]);
      });
      const block = packageSection(heading, cells);
      heading.remove();
      sectionParent.replaceWith(block);
    }
  }
}

function importDisclaimer(main) {
  const section = main.querySelector('.kgoui_container_multicolumn .kgo-col.col-lg-12 sup');
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

    // use helper method to remove header, footer, etc.
    WebImporter.DOMUtils.remove(main, [
      'header',
      'footer',
      'a.kgo-page-skip-navigation',
      'a.kgo-empty',
    ]);
    moveWhitespaceOutsideTag(main, document);
    updateLocalLinks(main, document);
    // detectPdfLinks(main, document, params);
    importTopBanner(main, document);
    importNetwork(main, document);
    importPrograms(main, document);
    importSelectPlan(main, document);
    importPlanOptions(main, document);
    importPharmacy(main, document);
    importServices(main, document);
    importDisclaimer(main);

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
