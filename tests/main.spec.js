const { test, expect } = require('./fixtures');

module.exports = (async () => {
    test('popup page', async ({ page, context, serviceWorker }) => {
        const extensionId = serviceWorker.url().split('/')[2];
        const tabs = {
            home: await page.locator('button[id="tab-home"]'),
            localhost: await page.locator('button[id="tab-localhost"]')
        }
        let switches = {
            home: await page.locator('input[id="auto"]'),
            localhost: undefined
        }
        let buttons = {
            localhost: {
                remove: await page.locator('button[id^="remove-localhost-"]')
            }
        }
        try {
            await page.goto(`chrome-extension://${extensionId}/dist/index.html`);
            await expect(page.locator('body')).toContainText('Node.js V8 --inspector Manager (NiM)', { useInnerText: true });

            // first check that the auto function is working on the default host/port.
            await new Promise(resolve => setTimeout(resolve, 3000));
            console.log(context.pages().map(page => page.url()));
            expect(context.pages().filter(page => page.url().match(/devtools:\/\/.*ws=localhost:9229.*/)).length).toBe(1);

            await page.bringToFront();
            await tabs.localhost.click();
            switches.localhost = await page.locator('input[id^="auto-localhost-"]').first();
            console.log('before: ', await switches.localhost.isChecked());
            await switches.localhost.setChecked(false);
            // both the localhost switch and the home switch should be disabled
            expect(await switches.localhost.isChecked()).toBe(false);
            console.log('after: ', await switches.localhost.isChecked());

            await tabs.home.click();

            // both the localhost switch and the home switch should be disabled
            expect(await switches.home.isChecked()).toBe(false);

            await tabs.localhost.click();
            await buttons.localhost.remove.click();

            // devtools tab should be removed
            expect(context.pages().filter(page => page.url().match(/devtools:\/\/.*ws=localhost:9229.*/)).length).toBe(0);
        } finally {
            await serviceWorker.evaluate(async () => {
                Promise.all([
                    chrome.storage.local.clear(),
                    chrome.storage.session.clear()
                ])
            });
        }
    });
})();