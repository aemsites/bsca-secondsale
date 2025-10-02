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

  // --- NEW CODE: Hide footer-top-section if it contains an <h5> ---
  // This ensures that if an <h5> is present inside the top section, the entire section is hidden.
  const trustImageSection = footer.querySelector('.footer-trust-image-section');
  if (topSection.querySelector('h5')) {
    topSection.style.display = 'none';
    if (trustImageSection) {
      trustImageSection.style.display = 'none';
    }
  }
  // --- END NEW CODE ---

  footer.append(footerBottom);
};

// --- Social linking helpers ---
const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/BlueShieldCA',
  instagram: 'https://www.instagram.com/blueshieldofca',
  linkedin: 'https://www.linkedin.com/company/blue-shield-of-california',
  // Add others if needed: twitter, youtube, etc.
};

function wrapIconWithLink(iconEl, href, label) {
  if (iconEl.closest('a')) return;

  const wrapTarget = iconEl.closest('.icon') || iconEl;
  if (wrapTarget.dataset.linked === 'true') return;

  const a = document.createElement('a');
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.setAttribute('aria-label', label);

  while (wrapTarget.firstChild) a.appendChild(wrapTarget.firstChild);
  wrapTarget.appendChild(a);
  wrapTarget.dataset.linked = 'true';
}

function linkFooterSocialIcons(footerRoot) {
  const container = footerRoot.querySelector('.footer-bottom-section .footer-disclaimer-section');
  if (!container) return;

  const iconNodes = container.querySelectorAll('.icon');
  iconNodes.forEach((node) => {
    const classMatch = Array.from(node.classList).find(
      (cls) => cls.startsWith('icon-') && cls !== 'icon',
    );
    if (!classMatch) return;

    const key = classMatch.replace('icon-', '').toLowerCase();
    const href = SOCIAL_LINKS[key];
    if (!href) return;

    const graphic = node.querySelector('img, svg') || node;
    wrapIconWithLink(graphic, href, `Open ${key} in a new tab`);
  });
}

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

  // Make social icons clickable
  linkFooterSocialIcons(footer);

  block.append(footer);
}
