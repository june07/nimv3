(async function (settings) {
    const CHROME_VERSION = /Chrome\/([0-9.]+)/.exec(navigator.userAgent)[1].split('.')[0]
    const DEVTOOLS_SCHEMES = [
        'chrome-devtools://',
        'devtools://'
    ]
    const DEVTOOLS_SCHEME = CHROME_VERSION > 75 ? DEVTOOLS_SCHEMES[1] : DEVTOOLS_SCHEMES[0]
    const CHROME_V3_ID = 'fbbpbfibkcdehkkkcoileebbgbamjelh'
    const EDGE_V3_ID = 'bhgmgiigndniabncaajbbeobkcfjkdod'
    const productionIdsRegex = new RegExp(`${CHROME_V3_ID}|${EDGE_V3_ID}`)

    settings.defaultSettings = {
        isDev: productionIdsRegex.test(chrome.runtime.getURL('/')) ? false : true,
        DEVTOOLS_SCHEME,
        host: "localhost",
        port: "9229",
        auto: true,
        checkInterval: 500,
        remoteProbeInterval: 10000,
        localSessionTimeout: 7 * 24 * 60 * 60000,
        debugVerbosity: 0,
        newWindow: false,
        autoClose: false,
        tabActive: true,
        windowFocused: true,
        localDevtools: true,
        notifications: {
            showMessage: true,
            lastHMAC: 0,
            enabled: true
        },
        chromeNotifications: {
            general: true,
            external: true,
        },
        autoIncrement: { type: 'port', name: 'Port' }, // both | host | port | false
        collaboration: false,
        panelWindowType: false,
        nimsVscode: {
            enabled: true
        },
        devToolsCompat: true,
        localDevtoolsOptionsSelectedIndex: 0,
        windowStateMaximized: false,
        diagnosticReports: {
            enabled: true,
            maxMessages: 10
        },
        autoResumeInspectBrk: false,
        focusOnBreakpoint: false,
        group: true,
        localDevtoolsOptions: [
            /* The url is set as a default to prevent a nasty case where an unset value results in an undefined which further results in runaway tabs opening.
            *  Decided to use the devtoolsFrontendUrlCompat url as currently it's the one that works more fully (see https://blog.june07.com/missing/)
            *  Todo: write a failsafe to prevent that condition too!
            */
            { id: 0, name: 'default', url: `${DEVTOOLS_SCHEME}devtools/bundled/inspector.html` },
            { id: 1, name: 'appspot', url: 'https://chrome-devtools-frontend.brakecode.com/inspector.html' },
            { id: 2, name: 'june07', url: 'https://chrome-devtools-frontend.june07.com/front_end/inspector.html' },
            { id: 3, name: 'custom', url: '' },
        ],
        removeSessionOnTabRemoved: false,
        pin: true,
        themeOverride: false,
        debuggingStatistics: true
    }
    settings.userSettings = async () => await chrome.storage.local.get('userSettings')
    settings.get = async () => {
        const { userSettings } = await this.settings.userSettings()
        let settings = {
            ...this.settings.defaultSettings,
            ...userSettings,
        }
        settings.localDevtoolsOptions[3].url = userSettings?.customDevtoolsURL || settings.localDevtoolsOptions[3].url
        return settings
    }
    settings.update = async (update) => {
        const { userSettings } = await settings.userSettings()
        const updatedSettings = {
            ...userSettings,
            ...update,
        }
        await chrome.storage.local.set({ userSettings: updatedSettings })
        Object.entries(await settings.get()).forEach((kv) => settings[kv[0]] = kv[1])
    }
    Object.entries(await settings.get()).forEach((kv) => settings[kv[0]] = kv[1])
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.settings = self.settings || {}))