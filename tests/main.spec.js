const { spawn } = require('child_process')
const { test, expect, ids, basename, appName } = require('./fixtures')

module.exports = (async () => {
    test.describe(() => {
        test(`popup - ${basename(__filename)} - 1`, async ({ page, context, serviceWorker }) => {
            const port = 9229
            const re = new RegExp(`devtools:\/\/.*ws=localhost:${port}.*`)
            const process = spawn('node', [`--inspect=${port}`, 'tests/hello.js'])

            await test.step(`node process should be listening on port ${port}`, async () => await new Promise((resolve) => {
                let stderr = ''

                process.stderr.on('data', async (data) => {
                    stderr += data
                    const s = Buffer.from(stderr).toString()
                    // console.log('s: ', s);
                    if (s.match(new RegExp(`listening\\son\\sws:\/\/127.0.0.1:${port}|address\\salready`))) {
                        resolve()
                    }
                })
            }))
            await test.step('popup should load', async () => {
                await page.goto(`chrome-extension://${serviceWorker.url().split('/')[2]}/dist/index.html`)
                await page.bringToFront()
                await page.waitForSelector('body')
                await expect(page.locator('body')).toContainText(appName, { useInnerText: true })
            })
            await test.step('LOCALHOST switch should be disabled', async () => {
                await (await page.locator(ids.tab.localhost)).click()
                await (await page.locator(ids.switches.localhost)).first().setChecked(false)
                expect(await (await page.locator(ids.switches.localhost)).isChecked()).toBe(false)
            })
            await test.step('HOME switch should be disabled', async () => {
                await (await page.locator(ids.tab.home)).click()
                expect(await (await page.locator(ids.switches.home)).isChecked()).toBe(false)
            })
            await test.step('devtools tab should be removed', async () => {
                await (await page.locator(ids.tab.localhost)).click()
                const devtoolsPage = await context.pages().find(page => page.url().match(re))
                const close = devtoolsPage.waitForEvent('close')
                await (await page.locator(ids.buttons.localhost.remove)).click()
                await close
                expect(context.pages().filter(page => page.url().match(re)).length).toBe(0)
            })

            process.kill()
        })
    })
})()
