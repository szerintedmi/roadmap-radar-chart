const PercyScript = require("@percy/script");

PercyScript.run(async (page, percySnapshot) => {
  await page.goto("http://localhost:8080/");
  await waitForEvent(page, "scaleToFitEnd");
  await percySnapshot("default example");
});


/**
 * Wait for the browser to fire an event (including custom events)
 * @param {Page} page
 * @param {string} eventName - Event name
 * @param {integer} seconds - number of seconds to wait.
 * @returns {Promise} resolves when event fires or timeout is reached
 */
async function waitForEvent(page, eventName, seconds = 5) {
  // use race to implement a timeout
  return Promise.race([
    // add event listener and wait for event to fire before returning
    page.evaluate((eventName) => {
      return new Promise(function (resolve, reject) {
        document.addEventListener(eventName, (event) => {
          resolve(event); // resolves when the event fires
        });
      });
    }, eventName),

    // if the event does not fire within n seconds, exit
    page.waitForTimeout(seconds * 1000),
  ]);
}