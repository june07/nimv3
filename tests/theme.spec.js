const { test, expect, ids, basename, appName } = require('./fixtures');

module.exports = (async () => {
    test.describe(() => {
        test(`popup - ${basename(__filename)} - 1`, async ({ page, serviceWorker }) => {
            await test.step('theme button should work to change theme dark', async () => {
                await page.goto(`chrome-extension://${serviceWorker.url().split('/')[2]}/dist/index.html`);
                await page.bringToFront();
                await expect(page.locator('body')).toContainText(appName, { useInnerText: true });

                // default theme is light
                expect(await page.locator(ids.theme.light)).toBeDefined();

                await (await page.locator(ids.buttons.theme)).click();

                // theme should be dark
                expect(await page.locator(ids.theme.dark)).toBeDefined();
            });
            await test.step('theme should persist', async () => {
                await page.goto(`chrome-extension://${serviceWorker.url().split('/')[2]}/dist/index.html`);
                await page.bringToFront();
                await expect(page.locator('body')).toContainText(appName, { useInnerText: true });

                // theme should be dark
                expect(await page.locator(ids.theme.dark)).toBeDefined();
            });
            await test.step('theme button should work to change theme back to light', async () => {
                await page.goto(`chrome-extension://${serviceWorker.url().split('/')[2]}/dist/index.html`);
                await page.bringToFront();
                await expect(page.locator('body')).toContainText(appName, { useInnerText: true });
                await (await page.locator(ids.buttons.theme)).click();

                // theme should be light
                expect(await page.locator(ids.theme.light)).toBeDefined();
            });
        });
    });
})();
