const { spawn } = require('child_process')
const { test, expect, ids, randomPort, basename } = require('./fixtures')

module.exports = (async () => {
    test.describe.configure({ mode: 'serial' })
    test.describe(async () => {
        test(`${basename(__filename)} - Should show license message`, async ({ page, context, serviceWorker }) => {
            const port = randomPort(1)[0]
            const process = spawn('node', [`--inspect=${port}`, 'tests/hello.js'])

            await test.step(`node process should be listening on port ${port}`, async () => await new Promise((resolve) => {
                let stderr = ''
                process.stderr.on('data', async (data) => {
                    stderr += data
                    if (Buffer.from(stderr).toString().match(new RegExp(`listening\\son\\sws:\/\/127.0.0.1:${port}`))) {
                        resolve()
                    }
                })
            }))
            // update the test config reporter

            await test.step(`license message should show if the license is not valid`, async () => {
                // Navigate to the starting page
                await page.goto(`chrome-extension://${serviceWorker.url().split('/')[2]}/dist/index.html`)
                await page.bringToFront()

                await (await page.locator(ids.inputs.port)).clear()
                await (await page.locator(ids.inputs.port)).type(`${port}`)
                await (await page.locator(ids.inputs.host)).press('Enter')

                // Wait for the license browser popup to show
                let showingSubscriptionMessage, tries = 0
                while (!showingSubscriptionMessage && tries < 10) {
                    tries += 1
                    const storage = await page.evaluate(async () => await chrome.storage.session.get('showingSubscriptionMessage'))
                    showingSubscriptionMessage = storage.showingSubscriptionMessage
                    await new Promise(r => setTimeout(r, 500))
                }

                expect(showingSubscriptionMessage).not.toBeNull()
            })

            process.kill()
        })
    })
    test.describe(async () => {
        test(`${basename(__filename)} - Should NOT show license message`, async ({ page, offlineContext: context, serviceWorker }) => {
            const port = randomPort(1)[0]
            const process = spawn('node', [`--inspect=${port}`, 'tests/hello.js'])

            await test.step(`node process should be listening on port ${port}`, async () => await new Promise((resolve) => {
                let stderr = ''
                process.stderr.on('data', async (data) => {
                    stderr += data
                    if (Buffer.from(stderr).toString().match(new RegExp(`listening\\son\\sws:\/\/127.0.0.1:${port}`))) {
                        resolve()
                    }
                })
            }))
            await test.step(`license message should not show if a response can't be received from license server`, async () => {
                // Navigate to the starting page
                await page.goto(`chrome-extension://${serviceWorker.url().split('/')[2]}/dist/index.html`)
                await page.bringToFront()

                await (await page.locator(ids.inputs.port)).clear()
                await (await page.locator(ids.inputs.port)).type(`${port}`)
                await (await page.locator(ids.inputs.host)).press('Enter')

                let showingSubscriptionMessage, tries = 0
                while (!showingSubscriptionMessage && tries < 10) {
                    tries += 1
                    const storage = await page.evaluate(async () => await chrome.storage.session.get('showingSubscriptionMessage'))
                    showingSubscriptionMessage = storage.showingSubscriptionMessage
                    await new Promise(r => setTimeout(r, 500))
                }

                expect(showingSubscriptionMessage < (Date.now() + 7 * 60000)).toBeTruthy()
            })

            process.kill()
        })
    })
})()
