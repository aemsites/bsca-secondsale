// Utility function to wait for an element within a container
async function waitForElement(container, selector) {
  return new Promise((resolve) => {
    const check = () => {
      const element = container.querySelector(selector);
      if (element) {
        resolve(element);
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}

// Utility function to wait for an element in the shadow DOM
async function waitForShadowElement(root, selector) {
  return new Promise((resolve) => {
    const check = () => {
      const element = root.querySelector(selector);
      if (element) {
        resolve(element);
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}

// Wait for the sidekick to be loaded
async function getSidekick() {
  return new Promise((resolve) => {
    const sk = document.querySelector('aem-sidekick');
    if (sk) {
      resolve(sk);
    } else {
      document.addEventListener(
        'sidekick-ready',
        () => resolve(document.querySelector('aem-sidekick')),
        { once: true }
      );
    }
  });
}

// Add a custom CSS file to the sidekick's shadowRoot
function addCustomCSS(pluginActionBar) {
  const cssLink = `<link rel="stylesheet" href="${window.hlx.codeBasePath}/scripts/scheduling/scheduling.css" />`;
  pluginActionBar.shadowRoot.append(document.createRange().createContextualFragment(cssLink));
}

// Replace the "Preview with Date" button with a date input field
function replacePreviewButton(previewButton, currentDate) {
  const dateInput = `<div class="date-preview"><input class="date-selection" type="date" id="date" name="preview-start" value="${currentDate}" required pattern="\\d{4}-\\d{2}-\\d{2}" /></div>`;
  previewButton.replaceWith(document.createRange().createContextualFragment(dateInput));
}

// Handle date input changes
function handleDateChange(dateSelector) {
  dateSelector.addEventListener('change', (event) => {
    const newValue = event.target.value.trim();
    if (newValue) {
      window.sessionStorage.setItem('preview-date', newValue);
    } else {
      window.sessionStorage.removeItem('preview-date');
    }
    window.location.reload();
  });
}

// Handle sidekick hidden event
function handleSidekickHidden(sidekick) {
  sidekick.addEventListener('hidden', () => {
    window.sessionStorage.removeItem('preview-date');
    window.location.reload();
  });
}

// Main function to initialize the scheduling functionality
async function initScheduling() {
  const sidekick = await getSidekick();

  const pluginActionBar = await waitForElement(sidekick.shadowRoot, 'plugin-action-bar');
  if (!pluginActionBar) {
    throw new Error('Plugin action bar not found in sidekick.');
  }
  
  // Wait for the "Plugins Container" to load dynamically
  const pluginsContainer = await waitForShadowElement(pluginActionBar.shadowRoot, '.plugins-container');
  if (!pluginsContainer) {
    throw new Error('Plugins container not found in sidekick.');
  }

  // Wait for the "Preview with Date" button
  const previewWithDateButton = await waitForElement(
    pluginsContainer,
    'sk-action-button.date-preview'
  );

  // Get the current date or the previously selected date
  const today = new Date().toISOString().split('T')[0];
  const currentDate = window.sessionStorage.getItem('preview-date') || today;

  // Replace the button with a date input field
  replacePreviewButton(previewWithDateButton, currentDate);

  // Add custom CSS
  addCustomCSS(pluginActionBar);

  // Wait for the newly added date input field
  const dateSelector = await waitForElement(pluginsContainer, '.date-selection');

  // Add event listeners
  handleDateChange(dateSelector);
  handleSidekickHidden(sidekick);
}

// Initialize the scheduling functionality
initScheduling().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to initialize scheduling:', error);
});