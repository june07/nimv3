const { spawn } = require('child_process');
const { test, expect, ids, basename, appName } = require('./fixtures');
const { until } = require('async');

module.exports = (async () => {
    test.describe(() => {
        test.describe.configure({ retries: 3 });
        test(`popup - ${basename(__filename)} - 1`, async ({ page, context, serviceWorker }) => {
            const tabs = {
                home: await page.locator(ids.tab.home),
                localhost: await page.locator(ids.tab.localhost)
            }
            const switches = {
                home: await page.locator(ids.switches.home),
                localhost: await page.locator(ids.switches.localhost)
            }
            const buttons = {
                localhost: {
                    remove: await page.locator(ids.buttons.localhost.remove)
                }
            }
            const re = new RegExp(`devtools:\/\/.*ws=localhost:9229.*`);
            const process = spawn('node', [`--inspect=9229`, 'tests/hello.js']);

            try {
                await page.goto(`chrome-extension://${serviceWorker.url().split('/')[2]}/dist/index.html`);
                await expect(page.locator('body')).toContainText(appName, { useInnerText: true });
                await page.bringToFront();
                await tabs.localhost.click();
                await switches.localhost.first().setChecked(false);
                // both the LOCALHOST switch and the home switch should be disabled
                expect(await switches.localhost.isChecked()).toBe(false);

                await tabs.home.click();

                // both the localhost switch and the HOME switch should be disabled
                expect(await switches.home.isChecked()).toBe(false);

                await tabs.localhost.click();
                const devtoolsPage = await context.pages().find(page => page.url().match(re));
                const close = devtoolsPage.waitForEvent('close'); 
                await buttons.localhost.remove.click();

                await close;
                // devtools tab should be removed
                expect(context.pages().filter(page => page.url().match(re)).length).toBe(0);
                process.kill();
            } finally {
                await serviceWorker.evaluate(async () => {
                    await Promise.all([
                        chrome.storage.local.clear(),
                        chrome.storage.session.clear()
                    ]);
                });
            }
        });
    });
})();
