const os = require('os');
const { join } = require('path');
const { test, expect, chromium } = require('@playwright/test');


module.exports = {
    expect,
    test: test.extend({
        context: async ({}, use) => {
            const pathToExtension = join(__dirname, '../');
            const userDataDir = `${os.tmpdir()}/test-user-data-dir`;
            const context = await chromium.launchPersistentContext(userDataDir, {
                headless: false,
                args: [
                    `--disable-extensions-except=${pathToExtension}`,
                    `--load-extension=${pathToExtension}`
                ],
                devtools: true,
                screen: {
                    width: 1200,
                    height: 1600
                },
                viewport: {
                    width: 1200,
                    height: 1600
                },
                slowMo: 500
            });
            await use(context);
            await context.close();
        },
        serviceWorker: async ({ context }, use) => {
            let [background] = context.serviceWorkers();
            if (!background) {
                background = await context.waitForEvent('serviceworker');
            }

            await use(background);
        }
    })
}