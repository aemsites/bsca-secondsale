// OneTrust Cookies Consent Notice start for blueshieldca.com
(function () {
    // Treat .aem.live and your production domain as "prod"
    var isProd =
        location.hostname.endsWith('.aem.live') ||
        /(^|\.)blueshieldca\.com$/i.test(location.hostname);
    var baseId = '019878d6-0d4b-7b81-b399-94a1c6d2e133';
    var domainScript = isProd ? baseId : baseId + '-test';
    
    // Define script URLs
    var otAutoBlockSrc = 'https://cdn.cookielaw.org/consent/' + domainScript + '/OtAutoBlock.js';
    var otStubSrc = 'https://cdn.cookielaw.org/scripttemplates/otSDKStub.js';
    
    // Create and append OtAutoBlock script (non-blocking)
    var autoBlockScript = document.createElement('script');
    autoBlockScript.type = 'text/javascript';
    autoBlockScript.src = otAutoBlockSrc;
    document.head.appendChild(autoBlockScript);
    
    // Create and append OtStub script (non-blocking)
    var stubScript = document.createElement('script');
    stubScript.type = 'text/javascript';
    stubScript.src = otStubSrc;
    stubScript.charset = 'UTF-8';
    stubScript.setAttribute('data-domain-script', domainScript);
    document.head.appendChild(stubScript);
    
    // Load custom OneTrust JS (non-blocking)
    var oneTrustJS = document.createElement('script');
    oneTrustJS.type = 'text/javascript';
    oneTrustJS.src = 'https://www.blueshieldca.com/vendor/onetrust/onetrust.js';
    document.head.appendChild(oneTrustJS);
})();
// OneTrust Cookies Consent Notice end for blueshieldca.com
