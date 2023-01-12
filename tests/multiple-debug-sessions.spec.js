const { spawn } = require('child_process');
const { test, expect, ids, randomPort, basename } = require('./fixtures');

const numSuccesses = 3,
    numPorts = 5;

module.exports = (async () => {
    test.describe(() => {
        test(`popup - ${basename(__filename)} - 1`, async ({ page, context, serviceWorker }) => {
            const ports = randomPort(numPorts);

            test.setTimeout(15000 * numPorts);

            for (let port of ports) {
                const re = new RegExp(`devtools://.*ws=localhost:${port}.*`)
                let successes = 0;
                
                const process = spawn('node', [`--inspect=${port}`, 'tests/hello.js']);
                await page.goto(`chrome-extension://${serviceWorker.url().split('/')[2]}/dist/index.html`);
                await page.bringToFront();
                await (await page.locator(ids.inputs.port)).clear();
                await (await page.locator(ids.inputs.port)).type(`${port}`);
                await (await page.locator(ids.inputs.host)).press('Enter');
                for (let loop of Object.keys(Array.from(new Array(numSuccesses)))) {
                    await context.waitForEvent('page');
                    const pages = context.pages().filter(page => page.url().match(re));
                    expect(pages.length).toBe(1);
                    if (loop != numSuccesses - 1) {
                        // leave the last one open for visual help during test debugging
                        await pages[0].close();
                    }
                    successes += 1;
                }
                expect(successes).toBe(numSuccesses);
                process.kill();
            }
        });
    });
})();
