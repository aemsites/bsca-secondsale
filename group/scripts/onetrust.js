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


function hideOTCustomBanner() {
    if (document.getElementById("onetrust-overlay")) {
        document.getElementById("onetrust-overlay").style.display = "none";
    }
    var domain = ".blueshieldca.com";
    if(location.host.includes("localhost")) {
        domain = "localhost";
    }
    else if (!location.host.endsWith('.blueshieldca.com')) {
        domain = ".bscal.com"; 
    }
    
    document.cookie = "bannerCustShown=true; path=/; domain="+domain+"; SameSite=Lax" // session cookie
}

function showOTCustomBanner() {
    const onetrustOverlay = document.createElement("div");
    onetrustOverlay.id = "onetrust-overlay";
    onetrustOverlay.innerHTML = '\
    <div id="onetrust-banner"><h2>We use trusted partners to improve your experience</h2>\
      <p>\
        We use third-party service providers to help us operate and manage this website. By clicking Continue,\
        you agree to the collection by and disclosure to third parties of your navigation and use activity on this website.\
      </p>\
      <p>\
        We also use cookies and other tracking technologies to enhance your experience through analyzing our website\
        performance and traffic. For more information related to our use of these technologies please review our Privacy Policy.\
        You can find the Privacy Policy at the bottom of our website under <b>Privacy & security.</b>\
      </p>\
      <div class="ot-banner-buttons">\
        <button class="onetrust-btn onetrust-continue-btn" id="continueBtn" onclick="hideOTCustomBanner()">Continue</button>\
      </div>\
    </div>\
    ';


    document.body.appendChild(onetrustOverlay);
    document.getElementById("onetrust-overlay").style.display = "block";

}
