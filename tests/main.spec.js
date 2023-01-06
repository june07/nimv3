const { spawn } = require('child_process');
const { test, expect } = require('./fixtures');
const { until } = require('async');

module.exports = (async () => {
    const ports = [...new Array(1)].map(arr => Math.floor(Math.random() * (19999 - 19229) + 19229));
    const ids = {
        tab: {
            home: 'button[id="tab-home"]',
            localhost: 'button[id="tab-localhost"]'
        },
        switches: {
            home: 'input[id="auto"]',
            localhost: 'input[id^="auto-localhost-"]'
        },
        buttons: {
            localhost: {
                remove: 'button[id^="remove-localhost-"]'
            }
        },
        inputs: {
            port: 'input[id="port"]',
            host: 'input[id="hostname"]'
        }
    }
    let processes = [];

    test.beforeAll(() => {
        console.log('Spawning node processes with --inspect...');
        processes = [
            spawn('node', [`--inspect=9229`, 'tests/hello.js']),
            ...ports.map(port => spawn('node', [`--inspect=${port}`, 'tests/hello.js']))
        ]
        console.log(processes.map(process => process.pid + ' ' + process.spawnargs))
        console.log(`Spawned ${processes.length} processes`, processes.map(process => process.pid));
    });
    test.afterAll(() => {
        console.log('Killing node processes...');
        const killed = processes.map(process => process.kill()).filter(killed => killed);
        console.log(`Killed ${killed.length} of ${processes.length}`);
    })
    test.describe(() => {
        // this test seems a bit sketchy thus the retries...
        test.describe.configure({ retries: 3 });
        test('popup page - auto function', async ({ page, context, serviceWorker }) => {
            const tabs = {
                home: await page.locator(ids.tab.home),
                localhost: await page.locator(ids.tab.localhost)
            }
            const switches = {
                home: await page.locator(ids.switches.home),
                localhost: await page.locator(ids.switches.localhost)
            }
            const buttons = {
                localhost: {
                    remove: await page.locator(ids.buttons.localhost.remove)
                }
            }
            const re = new RegExp(`devtools:\/\/.*ws=localhost:${ports[0]}.*`);

            try {
                await page.goto(`chrome-extension://${serviceWorker.url().split('/')[2]}/dist/index.html`);
                await expect(page.locator('body')).toContainText('Node.js V8 --inspector Manager (NiM)', { useInnerText: true });

                // first check that the auto function is working on the default host/port.
                await until(
                    async () => await context.pages().filter(page => page.url().match('localhost:9229'))?.length,
                    async () => await new Promise(resolve => setTimeout(resolve, 500))
                );

                expect(await context.pages().filter(page => page.url().match('localhost:9229'))?.length).toBe(1);

                await page.bringToFront();
                await tabs.localhost.click();
                await switches.localhost.first().setChecked(false);
                // both the LOCALHOST switch and the home switch should be disabled
                expect(await switches.localhost.isChecked()).toBe(false);

                await tabs.home.click();

                // both the localhost switch and the HOME switch should be disabled
                expect(await switches.home.isChecked()).toBe(false);

                await tabs.localhost.click();
                await buttons.localhost.remove.click();

                // devtools tab should be removed
                expect(context.pages().filter(page => page.url().match(re)).length).toBe(0);
            } finally {
                await serviceWorker.evaluate(async () => {
                    await Promise.all([
                        chrome.storage.local.clear(),
                        chrome.storage.session.clear()
                    ]);
                });
            }
        });
        test('popup page - that only ONE tab is ever opened', async ({ page, context, serviceWorker }) => {
            test.setTimeout(60000);

            const re = new RegExp(`devtools:\/\/.*ws=localhost:${ports[0]}.*`)
            const inputs = {
                port: await page.locator(ids.inputs.port),
                host: await page.locator(ids.inputs.host)
            }
            try {
                let successes = 0;
    
                await page.goto(`chrome-extension://${serviceWorker.url().split('/')[2]}/dist/index.html`);
                
                await until(
                    async () => await context.pages().filter(page => page.url().match('localhost:9229'))?.length,
                    async () => await new Promise(resolve => setTimeout(resolve, 500))
                );

                await page.bringToFront();
                await inputs.port.clear();
                await inputs.port.type(`${ports[0]}`);
                await inputs.host.press('Enter');
                for (let loop in Object.keys(Array.from(new Array(10)))) {
                    await context.waitForEvent('page');
                    const pages = context.pages().filter(page => page.url().match(re));
                    expect(pages.length).toBe(1);
                    await pages[0].close();
                    successes += 1;
                }
                expect(successes).toBe(10);
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
