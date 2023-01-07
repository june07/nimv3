const { spawn } = require('child_process');
const { test, expect, ids, randomPort, basename } = require('./fixtures');

const numSuccesses = 7;

module.exports = (async () => {
    test.describe(() => {
        test.describe.configure({ retries: 3 });
        test(`popup - ${basename(__filename)} - 1`, async ({ page, context, serviceWorker }) => {
            const port = randomPort();

            test.setTimeout(60000);

            const re = new RegExp(`devtools://.*ws=localhost:${port}.*`)
            const inputs = {
                port: await page.locator(ids.inputs.port),
                host: await page.locator(ids.inputs.host)
            }
            try {
                let successes = 0;

                const process = spawn('node', [`--inspect=${port}`, 'tests/hello.js']);
                await page.goto(`chrome-extension://${serviceWorker.url().split('/')[2]}/dist/index.html`);
                await page.bringToFront();
                await inputs.port.clear();
                await inputs.port.type(`${port}`);
                await inputs.host.press('Enter');
                for (let loop of Object.keys(Array.from(new Array(numSuccesses)))) {
                    await context.waitForEvent('page');
                    const pages = context.pages().filter(page => page.url().match(re));
                    expect(pages.length).toBe(1);
                    await pages[0].close();
                    successes += 1;
                }
                expect(successes).toBe(numSuccesses);
                process.kill();
            } finally {
                await serviceWorker.evaluate(async () => {
                    await Promise.all([
                        chrome.storage.local.clear(),
                        chrome.storage.session.clear()
                    ]);
                });
            }
        }, );
    });
})();
