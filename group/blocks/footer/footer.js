import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const structureFooter = (footer) => {
  // get all footer sections
  const sections = footer.querySelectorAll('.section');
  const topSection = sections[0];
  const defaultContainer = footer.querySelector('.default-content-wrapper');
  while (defaultContainer.firstElementChild) {
    topSection.append(defaultContainer.firstElementChild);
    topSection.classList.add('footer-top-section');
  }
  // remove default content wrapper
  defaultContainer.remove();

  const footerLinksSections = topSection.querySelector('ul');
  if (footerLinksSections) {
    footerLinksSections.classList.add('footer-links-sections');
    const footerLinksSection = footerLinksSections.querySelectorAll('li');
    footerLinksSection.forEach((section) => {
      if (section.parentElement === footerLinksSections) {
        section.setAttribute('aria-expanded', 'false');
        // Add click event listener for accordion functionality
        section.addEventListener('click', () => {
          const isExpanded = section.getAttribute('aria-expanded') === 'true';
          section.setAttribute('aria-expanded', !isExpanded);
        });
      }
    });
  }

  const footerDisclaimer = sections[1];
  const footerTrustImage = sections[2];
  const footerBottom = document.createElement('div');
  footerBottom.classList.add('footer-bottom-section');
  if (footerDisclaimer) {
    const footerDisclaimerContainer = footerDisclaimer.querySelector('.default-content-wrapper');
    while (footerDisclaimerContainer.firstElementChild) {
      footerDisclaimer.append(footerDisclaimerContainer.firstElementChild);
    }
    footerDisclaimer.classList.add('footer-disclaimer-section');
    footerDisclaimerContainer.remove();
    footerBottom.append(footerDisclaimer);
  }

  if (footerTrustImage) {
    const footerTrustImageContainer = footerTrustImage.querySelector('.default-content-wrapper');
    while (footerTrustImageContainer.firstElementChild) {
      footerTrustImage.append(footerTrustImageContainer.firstElementChild);
    }
    footerTrustImageContainer.remove();
    footerTrustImage.classList.add('footer-trust-image-section');
    footerBottom.append(footerTrustImage);
  }

  footer.append(footerBottom);
};

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/group/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  structureFooter(footer);

  block.append(footer);
}