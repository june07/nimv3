// @ts-check

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  use: {
    headless: false,
    ignoreHTTPSErrors: true,
    video: 'on-first-retry',
  },
};

module.exports = config;