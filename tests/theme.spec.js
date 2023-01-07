const { test, expect, ids, basename, appName } = require('./fixtures');

module.exports = (async () => {
    test.describe(() => {
        test(`popup - ${basename(__filename)} - 1`, async ({ page, serviceWorker }) => {
            const buttons = {
                theme: await page.locator(ids.buttons.theme)
            }

            await test.step('theme button should work to change theme dark', async () => {
                await page.goto(`chrome-extension://${serviceWorker.url().split('/')[2]}/dist/index.html`);
                await expect(page.locator('body')).toContainText(appName, { useInnerText: true });
                await page.bringToFront();

                // default theme is light
                expect(await page.locator(ids.theme.light)).toBeDefined();

                await buttons.theme.click();

                // theme should be dark
                expect(await page.locator(ids.theme.dark)).toBeDefined();
            });
            await test.step('theme should persist', async () => {
                await page.goto(`chrome-extension://${serviceWorker.url().split('/')[2]}/dist/index.html`);
                await expect(page.locator('body')).toContainText(appName, { useInnerText: true });
                await page.bringToFront();

                // theme should be dark
                expect(await page.locator(ids.theme.dark)).toBeDefined();
            });
            await test.step('theme button should work to change theme back to light', async () => {
                await page.goto(`chrome-extension://${serviceWorker.url().split('/')[2]}/dist/index.html`);
                await expect(page.locator('body')).toContainText(appName, { useInnerText: true });
                await page.bringToFront();
                await buttons.theme.click();

                // theme should be light
                expect(await page.locator(ids.theme.light)).toBeDefined();
            });
        });
    });
})();
