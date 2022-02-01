const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getMillisToSleep (retryHeaderString) {
  let millisToSleep = Math.round(parseFloat(retryHeaderString) * 1000);
  if (Number.isNaN(millisToSleep)) millisToSleep = Math.max(0, new Date(retryHeaderString) - new Date());
  return millisToSleep * 1.05;
}

module.exports = async function fetchAndRetryIfNecessary(callAPI, context, attempt = 0) {
  let response;

  try {
    response = await callAPI();
  } catch(e) {
    const { response } = e;
    if (response.status === 429) {
      const retryAfter = response.headers['retry-after'];
      // console.log(response.headers);
      const millisToSleep = getMillisToSleep(retryAfter)
      console.log(`❗ Retrying attempt: ${attempt + 1}`, 'sleep for', millisToSleep, 'ms', new Date());
      await sleep(millisToSleep);
      return fetchAndRetryIfNecessary(callAPI, context, attempt + 1)
    } else if (response.status >= 400) {
      if (attempt > 10) {
        console.log(await response.body.text());
        throw new Error(`More than 10 attempts for ${JSON.stringify(context)}. Status code: ${response.status}`);
      }
  
      if ([504, 404].includes(response.status)) {
        console.error(`❗ Retrying attempt: ${attempt + 1} - resason: ${response.status}`);
        return fetchAndRetryIfNecessary(callAPI, context, attempt + 1);
      } else if (response.headers['content-type'] === 'text/html') {
        console.log(await response.body.text());
        throw new Error('Detected HTML. Why?');
      } else {
        throw new Error(response.status);
      }
    }
  }

  return response;
}
