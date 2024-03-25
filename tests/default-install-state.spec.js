const { spawn } = require('child_process')
const { test, expect, basename } = require('./fixtures')
const { until } = require('async')

module.exports = (async () => {
    test.describe(() => {
        test.describe.configure({ retries: 3 })
        test(`popup - ${basename(__filename)} - 1`, async ({ page, context, serviceWorker }) => {
            const re = new RegExp(`devtools:\/\/.*ws=localhost:9229.*`)
            const process = spawn('node', [`--inspect=9229`, 'tests/hello.js'])

            try {
                // first check that the auto function is working on the default host/port.
                await Promise.race([
                    new Promise(resolve => setTimeout(resolve, 7000)),
                    until(
                        async () => await context.pages().filter(page => page.url().match(re))?.length,
                        async () => await new Promise(resolve => setTimeout(resolve))
                    )
                ])

                expect(await context.pages().filter(page => page.url().match(re))?.length).toBe(1)

                process.kill()
            } finally {
                await serviceWorker.evaluate(async () => {
                    await Promise.all([
                        chrome.storage.local.clear(),
                        chrome.storage.session.clear()
                    ])
                })
            }
        })
    })
})()
