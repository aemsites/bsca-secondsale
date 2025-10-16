// CJA Script
const analyticsCustEvent = new CustomEvent('analyticsConsentReady', {
  detail: {
    timestamp: new Date().toISOString(),
  },
});

// Utility to read a specific cookie value
function checkOTCookie(cookieName) {
  const value = document.cookie.split('; ').find((row) => row.startsWith(`${cookieName}=`));
  return value ? value.split('=')[1] : null;
}

// Hide banner when consent is applied
window.addEventListener('OTConsentApplied', () => {
  hideOTCustomBanner();
});

// Trap Tab key navigation within the banner
function trapCustomBannerFocus(targetBtn) {
  function handler(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      targetBtn.focus();
    }
  }
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}

// Hide the custom banner and set a session cookie
function hideOTCustomBanner() {
  const overlay = document.getElementById('onetrust-overlay');
  if (overlay) overlay.style.display = 'none';

  let domain = '.blueshieldca.com';
  const { host } = window.location;

  if (host.includes('localhost')) {
    domain = 'localhost';
  } else if (host.endsWith('.aem.page')) {
    domain = '.aem.page';
  } else if (!host.endsWith('.blueshieldca.com')) {
    domain = '.bscal.com';
  }

  document.cookie = `bannerCustShown=true; path=/; domain=${domain}; SameSite=Lax`;
}

// Set the analytics consent cookie for CJA
function setAnalyticsConsentCookie() {
  let domain = '.blueshieldca.com';
  const { host } = window.location;

  if (host.includes('localhost')) {
    domain = 'localhost';
  } else if (!host.endsWith('.blueshieldca.com')) {
    domain = '.bscal.com';
  }

  window.dispatchEvent(analyticsCustEvent);

  if (!checkOTCookie('analyticsConsentReady')) {
    document.cookie = `analyticsConsentReady=true; path=/; domain=${domain}; SameSite=Lax`;
  }

  if (typeof dtrum !== 'undefined' && typeof dtrum.enable === 'function') {
    dtrum.enable();
    if (process.env.NODE_ENV !== 'production') {
      console.log('analyticsConsentReady :: dtrum enabled');
    }
  } else if (process.env.NODE_ENV !== 'production') {
    console.log('Dynatrace not available');
  }
}

const translations = {
  en: {
    title: 'We use trusted partners to improve your experience',
    text1: 'We use third-party service providers to help us operate and manage this website. By clicking Continue, you agree to the collection by and disclosure to third parties of your navigation and use activity on this website.',
    text2: "We also use cookies and other tracking technologies to enhance your experience through analyzing our website performance and traffic. By continuing to use our website or mobile application, you understand our use of cookies as described on the <strong class='custom-privacy-label'>Privacy & security</strong> page found at the bottom of this webpage. You can change your cookie settings by selecting <strong class='custom-privacy-label'>Cookie preferences.</strong>",
    button1: 'Continue',
  },
  // Other languages omitted for brevity — include as needed
};

// Show the custom banner and activate focus trap
function showOTCustomBanner() {
  const lang = document.documentElement.lang || 'en';
  const languageTrans = translations[lang] || translations.en;

  const onetrustOverlay = document.createElement('div');
  onetrustOverlay.id = 'onetrust-overlay';

  const banner = document.createElement('div');
  banner.id = 'onetrust-banner';
  banner.setAttribute('tabindex', '0');
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-modal', 'true');
  banner.setAttribute('aria-describedby', 'banner-heading banner-text1 banner-text2');

  const heading = document.createElement('h2');
  heading.id = 'banner-heading';
  heading.textContent = languageTrans.title;
  banner.appendChild(heading);

  const p1 = document.createElement('p');
  p1.id = 'banner-text1';
  p1.innerHTML = languageTrans.text1 || '';
  banner.appendChild(p1);

  const p2 = document.createElement('p');
  p2.id = 'banner-text2';
  p2.innerHTML = languageTrans.text2 || '';
  banner.appendChild(p2);

  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'ot-banner-buttons';

  const continueBtn = document.createElement('button');
  continueBtn.className = 'onetrust-btn onetrust-continue-btn';
  continueBtn.id = 'continueBtn';
  continueBtn.textContent = languageTrans.button1;

  const removeFocusTrap = trapCustomBannerFocus(continueBtn);

  continueBtn.onclick = () => {
    hideOTCustomBanner();
    setAnalyticsConsentCookie();
    removeFocusTrap();
  };

  buttonContainer.appendChild(continueBtn);
  banner.appendChild(buttonContainer);
  onetrustOverlay.appendChild(banner);
  document.body.appendChild(onetrustOverlay);

  onetrustOverlay.style.display = 'block';
  banner.focus();
}
