function OptanonWrapper() {
    // Show banner if not accepted in this session
    if (checkOTCookie("bannerCustShown") || !checkOTCookie("OptanonAlertBoxClosed")) {
        hideOTCustomBanner();
    } else {
        showOTCustomBanner();
    }
}
window.addEventListener('OTConsentApplied', function () {
    hideOTCustomBanner();
});
 
 
function checkOTCookie(cookieName) {
    const value = document.cookie.split('; ').find(row => row.startsWith(cookieName + '='));
    return value ? value.split('=')[1] : null;
}
function trapCustomBannerFocus(){
  document.addEventListener("keydown", function (e) {
      if (e.key === "Tab") {
            e.preventDefault(); // Prevent default tab behavior
            continueBtn.focus();     // Move focus to the last element
        }   
    });
  }
 
function hideOTCustomBanner() {
    if (document.getElementById("onetrust-overlay")) {
        document.getElementById("onetrust-overlay").style.display = "none";
    }
    document.removeEventListener('keydown',trapCustomBannerFocus);
    let domain = ".blueshieldca.com";
    if(location.host.includes("localhost")) {
        domain = "localhost";
    } else if (location.host.endsWith('.aem.page')) {
        domain = ".aem.page";
    } else if (!location.host.endsWith('.blueshieldca.com')) {
        domain = ".bscal.com";
    } 
 
    document.cookie = "bannerCustShown=true; path=/; domain= "+domain+"; SameSite=Lax" // session cookie
}

function openPreferenceCenter() {
  if (typeof OneTrust !== 'undefined' && typeof OneTrust.ToggleInfoDisplay === 'function') {
    OneTrust.ToggleInfoDisplay();
  } else {
    console.warn('OneTrust is not loaded yet.');
  }
}
 
function showOTCustomBanner() {
    const onetrustOverlay = document.createElement("div");
    onetrustOverlay.id = "onetrust-overlay";
    onetrustOverlay.innerHTML = `\
    <div id="onetrust-banner"><h2>We use trusted partners to improve your experience</h2>\
      <p>\
        We use third-party service providers to help us operate and manage this website. By clicking Continue,\
        you agree to the collection by and disclosure to third parties of your navigation and use activity on this website.\
      </p>\
      <p>\
        We also use cookies and other tracking technologies to enhance your experience through analyzing our website\
        performance and traffic. By continuing to use our website or mobile application, you understand our use of cookies as described on the <b>Privacy & security</b> page found at the bottom of this webpage.\
        You can change your cookie settings by selecting <b>Cookie preferences.</b>\
      </p>\
      <div class="ot-banner-buttons">\
	  <button class="onetrust-btn onetrust-continue-btn ot-sdk-show-settings" id="preferenceBtn" onclick="openPreferenceCenter();">
  Cookie preferences
</button>\
        <button class="onetrust-btn onetrust-continue-btn" id="continueBtn" onclick="hideOTCustomBanner()">Continue</button>\
      </div>\
    </div>\
    `;
 
    document.body.appendChild(onetrustOverlay);
    document.getElementById("onetrust-overlay").style.display = "block";
    
    const continueBtn = document.getElementById("continueBtn");
    continueBtn.focus();
    document.addEventListener('keydown',trapCustomBannerFocus);

}


