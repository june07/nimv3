const { test, expect, basename, appVersion } = require('./fixtures')

module.exports = (async () => {
    test.describe(async () => {
        test(`version - ${basename(__filename)} - 1`, async ({ page, context, serviceWorker }) => {
            await test.step('version should match the one in package.json', async () => {
                await page.goto(`chrome-extension://${serviceWorker.url().split('/')[2]}/dist/index.html`)
                await page.bringToFront()
                await expect(page.locator('#nim-version')).toContainText(`v${appVersion}`, { useInnerText: true })
            })
        })
    })
})()
