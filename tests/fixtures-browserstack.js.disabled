const os = require('os');
const { join } = require('path');
const { test, expect, chromium } = require('@playwright/test');
const cp = require('child_process');
const clientPlaywrightVersion = cp
    .execSync('npx playwright --version')
    .toString()
    .trim()
    .split(' ')[1];
const BrowserStackLocal = require('browserstack-local');

const pathToExtension = join(__dirname, '../');
// BrowserStack Specific Capabilities.
const caps = {
    browser: 'chrome',
    os: 'osx',
    os_version: 'catalina',
    name: 'My first playwright test',
    build: 'playwright-build-1',
    'browserstack.username': process.env.BROWSERSTACK_USERNAME || '',
    'browserstack.accessKey': process.env.BROWSERSTACK_ACCESS_KEY || '',
    'browserstack.local': process.env.BROWSERSTACK_LOCAL || false,
    'client.playwrightVersion': clientPlaywrightVersion,
    args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`
    ],
};

exports.bsLocal = new BrowserStackLocal.Local();

// replace YOUR_ACCESS_KEY with your key. You can also set an environment variable - "BROWSERSTACK_ACCESS_KEY".
exports.BS_LOCAL_ARGS = {
    key: process.env.BROWSERSTACK_ACCESS_KEY || '',
};

// Patching the capabilities dynamically according to the project name.
const patchCaps = (name, title) => {
    let combination = name.split(/@browserstack/)[0];
    let [browerCaps, osCaps] = combination.split(/:/);
    let [browser, browser_version] = browerCaps.split(/@/);
    let osCapsSplit = osCaps.split(/ /);
    let os = osCapsSplit.shift();
    let os_version = osCapsSplit.join(' ');
    caps.browser = browser ? browser : 'chrome';
    caps.browser_version = browser_version ? browser_version : 'latest';
    caps.os = os ? os : 'osx';
    caps.os_version = os_version ? os_version : 'catalina';
    caps.name = title;
};

const isHash = (entity) => Boolean(entity && typeof (entity) === "object" && !Array.isArray(entity));
const nestedKeyValue = (hash, keys) => keys.reduce((hash, key) => (isHash(hash) ? hash[key] : undefined), hash);
const isUndefined = val => (val === undefined || val === null || val === '');
const evaluateSessionStatus = (status) => {
    if (!isUndefined(status)) {
        status = status.toLowerCase();
    }
    if (status === "passed") {
        return "passed";
    } else if (status === "failed" || status === "timedout") {
        return "failed";
    } else {
        return "";
    }
}

module.exports = {
    expect,
    test: test.extend({
        context: async ({ playwright }, use, testInfo) => {
            // Use BrowserStack Launched Browser according to capabilities for cross-browser testing.
            if (testInfo.project.name.match(/browserstack/)) {
                patchCaps(testInfo.project.name, `${testInfo.file} - ${testInfo.title}`);
                const vBrowser = await playwright.chromium.connect({
                    wsEndpoint:
                        `wss://cdp.browserstack.com/playwright?caps=` +
                        `${encodeURIComponent(JSON.stringify(caps))}`,
                });
                const context = vBrowser.newContext({
                    screen: {
                        width: 800,
                        height: 600
                    },
                    viewport: {
                        width: 800,
                        height: 600
                    },
                })
                await use(context);
                const vPage = await context.newPage();
                const testResult = {
                    action: 'setSessionStatus',
                    arguments: {
                        status: evaluateSessionStatus(testInfo.status),
                        reason: nestedKeyValue(testInfo, ['error', 'message'])
                    },
                };
                await vPage.evaluate(() => { },
                    `browserstack_executor: ${JSON.stringify(testResult)}`);
                await vPage.close();
                await context.close();
            }
        },
        serviceWorker: async ({ context }, use) => {
            let [background] = context.serviceWorkers();
            if (!background) {
                background = await context.waitForEvent('serviceworker');
            }

            await use(background);
        }
    })
}