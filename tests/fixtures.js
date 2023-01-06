const os = require('os');
const { join, basename } = require('path');
const { test, expect, chromium } = require('@playwright/test');

module.exports = {
    expect,
    basename,
    test: test.extend({
        context: async ({}, use, testInfo) => {
            const pathToExtension = join(__dirname, '../');
            const userDataDir = `${os.tmpdir()}/test-user-data-dir/${testInfo.title}`;
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
    }),
    randomPort: (number = 1) => [...new Array(100)].map(arr => Math.floor(Math.random() * (19999 - 19229) + 19229)).splice(0, number),
    ids: {
        tab: {
            home: 'button[id="tab-home"]',
            localhost: 'button[id="tab-localhost"]'
        },
        switches: {
            home: 'input[id="auto"]',
            localhost: 'input[id^="auto-localhost-"]'
        },
        buttons: {
            localhost: {
                remove: 'button[id^="remove-localhost-"]'
            }
        },
        inputs: {
            port: 'input[id="port"]',
            host: 'input[id="hostname"]'
        }
    }
}