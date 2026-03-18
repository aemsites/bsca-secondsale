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
 * Load chatbot config:
 * 1. Try page-level path
 * 2. Fallback to parent-level path
 *
 * @return {Promise<Object>} - The chatbot config JSON
 */
async function loadChatbotConfig() {
  const currentPath = window.location.pathname.replace(/\/$/, '');
  const parentPath = currentPath.replace(/\/[^/]*$/, '');

  const configPaths = [
    `${currentPath}/chatbot.json`,
    `${parentPath}/chatbot.json`,
  ];

  for (let i = 0; i < configPaths.length; i += 1) {
    const configPath = configPaths[i];
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await fetch(configPath);

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

  // Merge consecutive <p> tags
  let paragraphs = block.querySelectorAll('p');
  paragraphs.forEach((p) => {
    if (p.nextElementSibling && p.nextElementSibling.tagName === 'P') {
      p.innerHTML += `<br>${p.nextElementSibling.innerHTML}`;
      p.nextElementSibling.remove();
    }
  });

  paragraphs = block.querySelectorAll('p');

  // Split paragraphs on multiple <br>
  paragraphs.forEach((p) => {
    if (p.innerHTML.includes('<br>')) {
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
