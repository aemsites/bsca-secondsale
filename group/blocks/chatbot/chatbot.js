/**
 * Transforms the API response JSON into the required format
 * @param {Object} response - The original JSON response from the API
 * @return {Object} - Transformed JSON in the required format
 */
function transformJson(response) {
  const result = {};
  response.data.forEach((item) => {
    const {
      key,
      name,
      network_id: networkId,
      mentalHealthExternalUrl,
      altCareExternalUrl,
      acupuncture_enabled: acupunctureEnabled,
      chiropractor_enabled: chiropractorEnabled,
    } = item;
    if (key === 'plans' || key === 'dental_plans' || key === 'vision_plans') {
      if (!result[key]) {
        result[key] = [];
      }
      let networkIdArray = [];
      try {
        if (networkId && networkId !== '') {
          networkIdArray = JSON.parse(networkId);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Error parsing networkId for ${name}:`, e);
      }
      result[key].push({
        name,
        network_id: networkIdArray,
        mentalHealthExternalUrl,
        altCareExternalUrl,
        acupuncture_enabled: acupunctureEnabled,
        chiropractor_enabled: chiropractorEnabled,
      });
    } else {
      result[key] = name;
    }
  });
  return result;
}

/**
 * NEW:
 * Try to load chatbot config from the page-level path first,
 * then fall back to the parent-level path.
 *
 * Example for /group/calpers/active-members:
 * 1. /group/calpers/active-members/chatbot.json
 * 2. /group/calpers/chatbot.json
 *
 * This supports both:
 * - page-specific chatbot configs
 * - shared section-level chatbot configs
 *
 * @return {Promise<Object>} - The chatbot config JSON
 */
async function loadChatbotConfig() {
  // NEW: normalize the current path by removing any trailing slash
  const currentPath = window.location.pathname.replace(/\/$/, '');

  // NEW: derive the parent path
  const parentPath = currentPath.replace(/\/[^/]*$/, '');

  // NEW: try page-level config first, then parent-level config
  const configPaths = [
    `${currentPath}/chatbot.json`,
    `${parentPath}/chatbot.json`,
  ];

  for (let i = 0; i < configPaths.length; i += 1) {
    const configPath = configPaths[i];
    try {
      const response = await fetch(configPath);

      // NEW: only use the response if the file actually exists
      if (response.ok) {
        // eslint-disable-next-line no-console
        console.log(`Loaded chatbot configuration from: ${configPath}`);
        return response.json();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to load chatbot config from: ${configPath}`, error);
    }
  }

  throw new Error('Failed to load chatbot configuration from both page-level and parent-level paths.');
}

export default async function decorate(block) {
  const textRow = block.querySelector('div');

  let col1 = block;
  let col2;
  if (textRow) {
    const cols = textRow.querySelectorAll('div');
    if (cols.length === 2) {
      [col1, col2] = cols;
      col1.classList.add('col-left');
      col2.classList.add('col-right');
    }
  }

  // Split <p> tags based on two or more <br> tags
  let paragraphs = block.querySelectorAll('p');
  paragraphs.forEach((p) => {
    if (p.nextElementSibling && p.nextElementSibling.tagName === 'P') {
      p.innerHTML += `<br>${p.nextElementSibling.innerHTML}`;
      p.nextElementSibling.remove();
    }
  });
  paragraphs = block.querySelectorAll('p');

  paragraphs.forEach((p) => {
    if (p.innerHTML.includes('<br>')) {
      // Use a regular expression to split on two or more <br> tags
      const parts = p.innerHTML.split(/(?:<br\s*\/?>\s*){2,}/gi);
      parts.forEach((part, index) => {
        if (index === 0) {
          p.innerHTML = part.trim();
        } else {
          const newP = document.createElement('p');
          newP.innerHTML = part.trim();
          p.after(newP);
        }
      });
    }
  });

  try {
    // NEW: load config using page-level first, then parent-level fallback
    const config = await loadChatbotConfig();

    const qparam = JSON.stringify(transformJson(config));
    const evaURL = 'https://eva-us.app2check.com/app/chat2check/bots/chatbotWebClient-v5-bs.html';
    const encodedParams = btoa(qparam.toString());
    const iframe = document.createElement('iframe');

    iframe.src = `${evaURL}?params=${encodedParams}`;
    iframe.width = '100%';
    iframe.height = '400';
    iframe.style = 'border: none;';
    iframe.title = 'Chatbot';

    col1.append(iframe);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load chatbot configuration', error);
  }
}
