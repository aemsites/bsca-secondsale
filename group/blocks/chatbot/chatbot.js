import { loadCSS } from '../../scripts/aem.js';

/**
 * Transforms the API response JSON into the required format
 * @param {Object} response - The original JSON response from the API
 * @return {Object} - Transformed JSON in the required format
 */
function transformJson(response) {
  const result = {};
  response.data.forEach((item) => {
    const { key, name, network_id } = item;
    if (key === 'plans' || key === 'dental_plans' || key === 'vision_plans') {
      // Initialize the array if it doesn't exist
      if (!result[key]) {
        result[key] = [];
      }
      let networkIdArray = [];
      try {
        if (network_id && network_id !== '') {
          networkIdArray = JSON.parse(network_id);
        }
      } catch (e) {
        console.error(`Error parsing network_id for ${name}:`, e);
      }
      result[key].push({
        name,
        network_id: networkIdArray,
      });
    } else {
      result[key] = name;
    }
  });
  return result;
}

export default function decorate(block) {
  loadCSS('https://eva-us.app2check.com/app/plugins/eva/eva-bs.css');
  // await the loading of the script
  const evascript = document.createElement('script');
  evascript.src = 'https://eva-us.app2check.com/app/plugins/eva/eva-bs.js';
  block.append(evascript);
  const path = window.location.pathname.split('/').slice(0, -1).join('/');

  evascript.onload = () => {
    fetch(`${path}/eva.json`)
      .then((response) => response.json())
      .then((config) => {
        const qparam = JSON.stringify(transformJson(config));
        const script = document.createElement('script');
        script.textContent = `eva_Init("idConverse=60e720e7-e522-4d54-b034-df2ed65e0d5e", true, 500, 600, "https://eov-assets.s3.amazonaws.com/blue_shield_california_onboarding/fad_icon.png", ${qparam});`;
        block.append(script);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to load chatbot configuration', error);
      });
  };
}
