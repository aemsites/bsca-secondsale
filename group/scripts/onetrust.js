//CJA Script
let analyticsCustEvent = new CustomEvent("analyticsConsentReady", {
    detail: {
        timestamp: new Date().toISOString()
    }
});

// Entry point triggered by OneTrust when consent logic is ready
function OptanonWrapper() {
    // If banner has already been shown in this session or consent was previously closed, hide it
    if (checkOTCookie("bannerCustShown") || !checkOTCookie("OptanonAlertBoxClosed")) {
        hideOTCustomBanner();
    } else {
        // Otherwise, show the custom banner
        showOTCustomBanner();
    }
    if (window.OneTrust && typeof OneTrust !== "undefined" && OneTrust.OnConsentChanged) {

        OneTrust.OnConsentChanged(function () {
            setAnalyticsConsentCookie();
        });
    }
}

// Hide banner when consent is applied (e.g., user clicks Continue or saves preferences)
window.addEventListener('OTConsentApplied', function () {
    hideOTCustomBanner();
});

// Utility to read a specific cookie value
function checkOTCookie(cookieName) {
    const value = document.cookie.split('; ').find(row => row.startsWith(cookieName + '='));
    return value ? value.split('=')[1] : null;
}

// Trap Tab key navigation within the banner
function trapCustomBannerFocus() {
    document.addEventListener("keydown", function (e) {
        if (e.key === "Tab") {
            e.preventDefault(); // Prevent default tab behavior
            continueBtn.focus();     // Move focus to the last element
        }
    });
}

// Hide the custom banner and set a session cookie to prevent re-showing
function hideOTCustomBanner() {
    const overlay = document.getElementById("onetrust-overlay");
    if (overlay) {
        overlay.style.display = "none";
    }
    document.removeEventListener('keydown', trapCustomBannerFocus);// Remove focus trap
    // Determine cookie domain based on environment
    let domain = ".blueshieldca.com";
    if (location.host.includes("localhost")) {
        domain = "localhost";
    }
    else if (!location.host.endsWith('.aem.page')) {
        domain = ".aem.page";
        console.log(".aem.page domain:", domain);
    }
    else if (!location.host.endsWith('.blueshieldca.com')) {
        domain = ".bscal.com";
    }
    // Set session cookie to mark banner as shown
    document.cookie = "bannerCustShown=true; path=/; domain=" + domain + "; SameSite=Lax";
    document.cookie = "bannerCustShown=true; path=/; SameSite=Lax" // session cookie
}

// Setting the analytics consent cookie for CJA
function setAnalyticsConsentCookie() {
    let domain = ".blueshieldca.com";
    if (location.host.includes("localhost")) {
        domain = "localhost";
    }
    else if (!location.host.endsWith('.blueshieldca.com')) {
        domain = ".bscal.com";
    }
    window.dispatchEvent(analyticsCustEvent);
    if (!checkOTCookie("analyticsConsentReady")) {
        document.cookie = "analyticsConsentReady=true; path=/; domain=" + domain + "; SameSite=Lax" // session cookie
    }

    if (typeof dtrum !== 'undefined' && typeof dtrum.enable === 'function') {
        dtrum.enable();
        console.log('analyticsConsentReady ::' + dtrum.enable);
    } else {
        console.log('Dynatrace not available');
    }
}

const translations = {
    en: {
        title: "We use trusted partners to improve your experience",
        text1: "We use third-party service providers to help us operate and manage this website. By clicking Continue, you agree to the collection by and disclosure to third parties of your navigation and use activity on this website.",
        text2: "We also use cookies and other tracking technologies to enhance your experience through analyzing our website performance and traffic. By continuing to use our website or mobile application, you understand our use of cookies as described on the <strong class='custom-privacy-label'>Privacy & security</strong> page found at the bottom of this webpage. You can change your cookie settings by selecting <strong class='custom-privacy-label'>Cookie preferences.</strong>",
        button1: "Continue"
    },
    es: {
        title: "Recurrimos a socios de confianza para mejorar su experiencia",
        text1: "Recurrimos a proveedores de servicios externos para ayudarnos a operar y administrar esta pÃ¡gina web. Al hacer clic en Continuar, usted estÃ¡ de acuerdo con la recopilaciÃ³n y divulgaciÃ³n a terceros de su actividad de navegaciÃ³n y uso de esta pÃ¡gina web.",
        text2: "TambiÃ©n usamos cookies y otras tecnologÃ­as de seguimiento para mejorar su experiencia al analizar el rendimiento y el trÃ¡fico de nuestra pÃ¡gina web. Al continuar usando nuestra pÃ¡gina web o aplicaciÃ³n mÃ³vil, usted estÃ¡ de acuerdo con nuestro uso de cookies tal como se describe en la pÃ¡gina <strong class='custom-privacy-label'>Privacidad y seguridad</strong> que se encuentra en la parte inferior de esta pÃ¡gina web. Puede cambiar la configuraciÃ³n de cookies en <strong class='custom-privacy-label'>Preferencias de cookies.</strong>",
        button1: "continuar"
    },
    zh: {
        title: "æˆ‘ä»¬ä½¿ç”¨å€¼å¾—ä¿¡èµ–çš„ä¼™ä¼´æ¥æ”¹è¿›æ‚¨çš„ä½“éªŒ",
        text1: "æˆ‘ä»¬ä½¿ç”¨ç¬¬ä¸‰æ–¹æœåŠ¡æä¾›å•†å¸®åŠ©æˆ‘ä»¬è¿è¥å’Œç®¡ç†æœ¬ç½‘ç«™ã€‚ç‚¹å‡» ç»§ç»­ï¼Œå³è¡¨ç¤ºæ‚¨åŒæ„ç”±ç¬¬ä¸‰æ–¹æ”¶é›†å¹¶å‘ç¬¬ä¸‰æ–¹æŠ«éœ²æ‚¨åœ¨æœ¬ç½‘ç«™ä¸Šçš„å¯¼èˆªå’Œä½¿ç”¨æ´»åŠ¨ã€‚",
        text2: "æˆ‘ä»¬è¿˜ä½¿ç”¨Cookieå’Œå…¶ä»–è·Ÿè¸ªæŠ€æœ¯ï¼Œé€šè¿‡åˆ†æžæˆ‘ä»¬çš„ç½‘ç«™æ€§èƒ½å’Œæµé‡æ¥æå‡æ‚¨çš„ä½“éªŒã€‚æ‚¨ç»§ç»­ä½¿ç”¨æˆ‘ä»¬çš„ç½‘ç«™æˆ–ç§»åŠ¨åº”ç”¨ç¨‹åºï¼Œå³è¡¨æ˜Žæ‚¨åŒæ„æˆ‘ä»¬æŒ‰ç…§æœ¬ç½‘é¡µåº•éƒ¨éšç§ä¸Žå®‰å…¨é¡µé¢æ‰€è¿°ä½¿ç”¨Cookieã€‚æ‚¨å¯ä»¥åœ¨Cookieåå¥½ä¸‹æ›´æ”¹æ‚¨çš„Cookieè®¾ç½®",
        button1: "ç»§ç»­"
    },
    vi: {
        title: "ChÃºng tÃ´i sá»­ dá»¥ng cÃ¡c Ä‘á»‘i tÃ¡c Ä‘Ã¡ng tin cáº­y Ä‘á»ƒ cáº£i thiá»‡n tráº£i nghiá»‡m cá»§a quÃ½ vá»‹",
        text1: "ChÃºng tÃ´i sá»­ dá»¥ng cÃ¡c nhÃ  cung cáº¥p dá»‹ch vá»¥ bÃªn thá»© ba Ä‘á»ƒ giÃºp váº­n hÃ nh vÃ  quáº£n lÃ½ trang web nÃ y. Khi nháº¥p vÃ o Tiáº¿p tá»¥c, quÃ½ vá»‹ Ä‘á»“ng Ã½ vá»›i viá»‡c thu tháº­p vÃ  tiáº¿t lá»™ cho cÃ¡c bÃªn thá»© ba vá» hoáº¡t Ä‘á»™ng Ä‘iá»u hÆ°á»›ng vÃ  sá»­ dá»¥ng cá»§a mÃ¬nh trÃªn trang web nÃ y.",
        text2: "ChÃºng tÃ´i cÅ©ng sá»­ dá»¥ng cookie vÃ  cÃ¡c cÃ´ng nghá»‡ theo dÃµi khÃ¡c Ä‘á»ƒ nÃ¢ng cao tráº£i nghiá»‡m cá»§a quÃ½ vá»‹ thÃ´ng qua viá»‡c phÃ¢n tÃ­ch hoáº¡t Ä‘á»™ng vÃ  lÆ°u lÆ°á»£ng truy cáº­p trÃªn trang web cá»§a chÃºng tÃ´i. Khi tiáº¿p tá»¥c sá»­ dá»¥ng trang web hoáº·c á»©ng dá»¥ng di Ä‘á»™ng cá»§a chÃºng tÃ´i, quÃ½ vá»‹ Ä‘á»“ng Ã½ vá»›i viá»‡c chÃºng tÃ´i sá»­ dá»¥ng cookie nhÆ° Ä‘Æ°á»£c mÃ´ táº£ trÃªn trang Quyá»n riÃªng tÆ° vÃ  báº£o máº­t Ä‘Æ°á»£c tÃ¬m tháº¥y á»Ÿ cuá»‘i trang web nÃ y. QuÃ½ vá»‹ cÃ³ thá»ƒ thay Ä‘á»•i cÃ i Ä‘áº·t cookie trong má»¥c tÃ¹y chá»n Cookie.",
        button1: "Tiáº¿p tá»¥c"
    }
};


// Show the custom banner and activate focus trap
function showOTCustomBanner() {
    let languageSelected = document.documentElement.lang || "en";
    const lang = languageSelected;  //uncomment this
    const languageTrans = translations[lang] || translations.en;
    const onetrustOverlay = document.createElement("div");
    onetrustOverlay.id = "onetrust-overlay";

    // Create banner container
    const banner = document.createElement("div");
    banner.id = "onetrust-banner";
    banner.setAttribute("tabindex", "0");
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-modal", "true");
    banner.setAttribute("aria-describedby", "banner-heading banner-text1 banner-text2");

    // Heading
    const heading = document.createElement("h2");
    heading.id = "banner-heading";
    heading.textContent = languageTrans.title;
    banner.appendChild(heading);

    // Paragraph 1
    const p1 = document.createElement("p");
    p1.id = "banner-text1";
    p1.innerHTML = languageTrans.text1 || "";
    banner.appendChild(p1);

    // Paragraph 2
    const p2 = document.createElement("p");
    p2.id = "banner-text2";
    p2.innerHTML = languageTrans.text2 || "";
    banner.appendChild(p2);

    // Buttons container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "ot-banner-buttons";

    // Continue Button
    const continueBtn = document.createElement("button");
    continueBtn.className = "onetrust-btn onetrust-continue-btn";
    continueBtn.id = "continueBtn";
    continueBtn.textContent = languageTrans.button1;
    continueBtn.onclick = function () {
        hideOTCustomBanner();
        setAnalyticsConsentCookie();
    };
    buttonContainer.appendChild(continueBtn);

    // Append everything
    banner.appendChild(buttonContainer);
    onetrustOverlay.appendChild(banner);
    document.body.appendChild(onetrustOverlay);

    // Show banner
    onetrustOverlay.style.display = "block";

    // Set focus and enable focus trap
    banner.focus();
    document.addEventListener('keydown', trapCustomBannerFocus);
}