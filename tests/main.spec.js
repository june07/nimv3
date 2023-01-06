const { spawn } = require('child_process');
const { test, expect, ids, port } = require('./fixtures');
const { until } = require('async');

module.exports = (async () => {
    test.describe(() => {
        // this test seems a bit sketchy thus the retries...
        test.describe.configure({ retries: 3 });
        test('popup page - auto function', async ({ page, context, serviceWorker }) => {
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
            let process;

            try {
                await page.goto(`chrome-extension://${serviceWorker.url().split('/')[2]}/dist/index.html`);
                await expect(page.locator('body')).toContainText('Node.js V8 --inspector Manager (NiM)', { useInnerText: true });

                process = spawn('node', [`--inspect=9229`, 'tests/hello.js']);

                // first check that the auto function is working on the default host/port.
                await Promise.race([
                    new Promise(resolve => setTimeout(resolve, 7000)),
                    until(
                        async () => await context.pages().filter(page => page.url().match(re))?.length,
                        async () => await new Promise(resolve => setTimeout(resolve, 50))
                    )
                ]);

                expect(await context.pages().filter(page => page.url().match(re))?.length).toBe(1);

                await page.bringToFront();
                await tabs.localhost.click();
                await switches.localhost.first().setChecked(false);
                // both the LOCALHOST switch and the home switch should be disabled
                expect(await switches.localhost.isChecked()).toBe(false);

                await tabs.home.click();

                // both the localhost switch and the HOME switch should be disabled
                expect(await switches.home.isChecked()).toBe(false);

                await tabs.localhost.click();
                await buttons.localhost.remove.click();

                // devtools tab should be removed
                expect(context.pages().filter(page => page.url().match(re)).length).toBe(0);
            } finally {
                process.kill();
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
