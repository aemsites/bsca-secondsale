/**
 * Transforms the API response JSON into the required format
 * @param {Object} response - The original JSON response from the API
 * @return {Object} - Transformed JSON in the required format
 */
function transformJson(response) {
  const result = {};
  response.data.forEach((item) => {
    const { key, name, network_id: networkId } = item;
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
        networkId: networkIdArray,
      });
    } else {
      result[key] = name;
    }
  });
  return result;
}

export default function decorate(block) {
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

  const path = window.location.pathname.split('/').slice(0, -1).join('/');
  fetch(`${path}/chatbot.json`)
    .then((response) => response.json())
    .then((config) => {
      const qparam = JSON.stringify(transformJson(config));
      const evaURL = 'https://eva-us.app2check.com/app/chat2check/bots/chatbotWebClient-v5-bs.html';
      const encodedParams = btoa(qparam.toString());
      const iframe = document.createElement('iframe');
      iframe.src = `${evaURL}?params=${encodedParams}`;
      iframe.width = '100%';
      iframe.height = '400';
      iframe.style = 'border: none;';
      col1.append(iframe);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Failed to load chatbot configuration', error);
    });
}
