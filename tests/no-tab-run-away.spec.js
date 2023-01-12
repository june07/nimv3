const { spawn } = require('child_process');
const { test, expect, ids, randomPort, basename } = require('./fixtures');

const numSuccesses = 7;

module.exports = (async () => {
    test.describe(() => {
        test(`popup - ${basename(__filename)} - 1`, async ({ page, context, serviceWorker }) => {
            const port = randomPort();
            const re = new RegExp(`devtools://.*ws=localhost:${port}.*`);
            const process = spawn('node', [`--inspect=${port}`, 'tests/hello.js']);
            let successes = 0;

            await test.step(`node process should be listening on port ${port}`, async () => await new Promise((resolve) => {
                let stderr = '';
                process.stderr.on('data', async (data) => {
                    stderr += data;
                    if (Buffer.from(stderr).toString().match(new RegExp(`listening\\son\\sws:\/\/127.0.0.1:${port}`))) {
                        resolve();
                    }
                });
            }));
            await page.goto(`chrome-extension://${serviceWorker.url().split('/')[2]}/dist/index.html`);
            await page.bringToFront();
            await (await page.locator(ids.inputs.port)).clear();
            await (await page.locator(ids.inputs.port)).type(`${port}`);
            await (await page.locator(ids.inputs.host)).press('Enter');
            for (let loop of Object.keys(Array.from(new Array(numSuccesses)))) {
                await context.waitForEvent('page');
                const pages = context.pages().filter(page => page.url().match(re));
                expect(pages.length).toBe(1);
                await pages[0].close();
                successes += 1;
            }
            expect(successes).toBe(numSuccesses);
            process.kill();
        }, );
    });
})();
