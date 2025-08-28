const os = require('os')
const fs = require('fs')
const { join, basename, resolve } = require('path')
const { test, expect, chromium } = require('@playwright/test')

const pathToExtension = resolve(process.env.PATH_TO_EXTENSION || process.cwd())

module.exports = {
    expect,
    appName: JSON.parse(fs.readFileSync(join(pathToExtension, '_locales/en/messages.json'), 'utf-8')).appName.message,
    appVersion: JSON.parse(fs.existsSync(join(pathToExtension, 'package.json'))
        ? fs.readFileSync(join(pathToExtension, 'package.json'), 'utf-8')
        : fs.readFileSync(join(pathToExtension, 'manifest.json'), 'utf-8')).version,
    basename,
    test: test.extend({
        context: async ({ }, use, testInfo) => {
            // very important to separate userDataDir between tests!
            const userDataDir = `${os.tmpdir()}/test-user-data-dir/${testInfo.title.replaceAll(' ', '_')}-${testInfo.project.name}-${Date.now()}`
            const context = await chromium.launchPersistentContext(userDataDir, {
                headless: false,
                args: [
                    `--disable-extensions-except=${pathToExtension}`,
                    `--load-extension=${pathToExtension}`,
                    '--no-sandbox'
                ],
                devtools: true,
                viewport: {
                    width: 800,
                    height: 600
                },
            })

            console.log("Extension path:", pathToExtension)
            console.log("Manifest exists:", fs.existsSync(join(pathToExtension, "manifest.json")))

            console.log("Background pages:", context.backgroundPages().map(p => p.url()))
            console.log("Service workers:", context.serviceWorkers().map(sw => sw.url()))

            await use(context)
            await context.close()
        },
        offlineContext: async ({ }, use, testInfo) => {
            // very important to separate userDataDir between tests!
            const userDataDir = `${os.tmpdir()}/test-user-data-dir/${testInfo.title.replaceAll(' ', '_')}-${testInfo.project.name}-${Date.now()}`
            const context = await chromium.launchPersistentContext(userDataDir, {
                headless: false,
                offline: true,
                args: [
                    `--disable-extensions-except=${pathToExtension}`,
                    `--load-extension=${pathToExtension}`,
                    '--no-sandbox',
                    '--proxy-server=https://127.0.0.1',
                    '--proxy-bypass-list="<local>;"'
                ],
                devtools: true,
                viewport: {
                    width: 800,
                    height: 600
                },
            })

            await use(context)
            await context.close()
        },
        serviceWorker: async ({ context }, use) => {
            let [background] = context.serviceWorkers()
            if (!background) {
                // force background to start by accessing an extension URL
                const [page] = context.pages()
                await page.goto('about:blank') // safe placeholder
                background = await context.waitForEvent('serviceworker')
            }

            await use(background)
        }
    }),
    randomPort: (number = 1) => {
        const ports = [...new Array(10000)].map(arr => Math.floor(Math.random() * (29229 - 19229) + 19229)).splice(0, number)
        console.log('random ports: ', ports)
        return ports
    },
    ids: {
        theme: {
            dark: '.v-application.v-theme--dark',
            light: '.v-application.v-theme--light',
        },
        tab: {
            home: 'button[id="tab-home"]',
            localhost: 'button[id="tab-localhost"]'
        },
        switches: {
            home: 'input[id="auto"]',
            localhost: 'input[id^="auto-localhost-"]',
            themeOverride: 'input[name="themeOverride"]'
        },
        buttons: {
            theme: 'button[id="theme"]',
            localhost: {
                remove: 'button[id^="remove-localhost-"]'
            },
            settings: 'button[id="settings-btn"]',
        },
        inputs: {
            port: 'input[id="port"]',
            host: 'input[id="host"]'
        }
    }
}