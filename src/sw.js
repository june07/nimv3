importScripts(
    '../dist/uuidv5.min.js',
    '../dist/nacl-fast.min.js',
    '../dist/nacl-util.min.js',
    '../dist/async.min.js',
    '../dist/socket.io.min.js',
    '../dist/nanoid.min.js',
    './utils.js',
    './settings.js',
    './brakecode.js',
    './utilities.js',
    './analytics.js',
    './google-analytics.js',
    './messaging.js',
    './scripting.js',
    './devtoolsProtocolClient.js',
    './commands.js',
)

const ENV = 'production'
const VERSION = '0.0.0'
const INSTALL_URL = "https://june07.com/nim-install/?utm_source=nim&utm_medium=chrome_extension&utm_campaign=extension_install&utm_content=1"
const UNINSTALL_URL = "https://june07.com/uninstall"
const SHORTNER_SERVICE_URL = 'https://shortnr.june07.com/api'
const NOTIFICATION_CHECK_INTERVAL = ENV !== 'production' ? 60000 : 60 * 60000 // Check every hour
const NOTIFICATION_PUSH_INTERVAL = ENV !== 'production' ? 60000 : 60 * 60000 // Push new notifications no more than 1 every hour if there is a queue.
const NOTIFICATION_LIFETIME = ENV !== 'production' ? 3 * 60000 : 7 * 86400000
const SOCKET_PATTERN = /((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])):([0-9]+)/
const reDevtoolsURL = /(devtools|chrome-devtools|https?:\/\/localhost|chrome-devtools-frontend(\.(appspot|june07|brakecode)\.com)).*\/(inspector.html|js_app.html|devtools_app.html|node_app.html|ndb_app.html)/
const reTabGroupTitle = new RegExp(/NiM/)
const reSocket = new RegExp(/^((?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}|localhost|(?:\d{1,3}\.){3}\d{1,3}|(\[(?:[A-Fa-f0-9:]+)\]))+(:\d{1,5})?)|^\d{1,5}$/)

const HIGH_WATER_MARK_MAX = 3
const DRAIN_INTERVAL = 5000
const LICENSE_HOST = !/production|test/.test(ENV) ? 'api.dev.june07.com' : 'api.june07.com'
const NODEJS_INSPECT_HOST = 'nodejs.june07.com'

let cache = {
    tabs: {},
    forceRemoveSession: {},
    highlighted: {},
    removed: {},
    messagePort: undefined,
    info: {},
    timeouts: {},
    deadSocketSessions: {},
    lastWindow: {}
}
let state = {
    hydrated: false,
    groups: {},
    route: {
        path: 'main'
    },
    overlays: {
        donation: false,
        messages: false,
    },
    sessions: {},
    subscriptionNotificationOn: undefined,
    isCheckingLicense: false,
}

async function importForeignTabs() {
    return await queryForDevtoolTabs()
}
async function hydrateState() {
    /** this function will generally not be useful during testing because the session is restarted every time a reload is done
     *  So as a workaround use importForeignTabs() during development... might be useful to just keep period?!
     */
    if (ENV !== 'production') {
        const foreignTabSessions = await importForeignTabs()
        await chrome.tabs.remove(foreignTabSessions.map((tab) => tab.id))
        foreignTabSessions.forEach((foreignTabSessions) => {
            openTab(foreignTabSessions.socket.host, foreignTabSessions.socket.port)
        })
    }
    const sessions = (await chrome.storage.session.get('sessions'))?.sessions
    state.sessions = sessions ? { ...sessions } : {}
    await Promise.all([
        chrome.storage.local.get('token').then((obj) => state.token = obj.token),
        chrome.storage.local.get('apikey').then((obj) => state.apikey = obj.apikey),
        chrome.storage.local.get('subscriptionNotificationOn').then(({ subscriptionNotificationOn }) => state.subscriptionNotificationOn = subscriptionNotificationOn)
    ])
    state.hydrated = true
    // console.log('serviceworker state:', state);
}
(async function init() {
    cache.ip = await (await fetch('https://ip-cfworkers.brakecode.com', { method: 'head' })).headers.get('cf-connecting-ip')
    await async.until(
        (cb) => cb(null, settings.DEVTOOLS_SCHEME),
        (next) => setTimeout(next, 500)
    )
    await hydrateState()
    cache.checkInterval = utils.resetInterval(() => {
        let home,
            openedRemoteTabSessions = {}

        // first handle tab sessions
        const tabSessions = Object.entries(state.sessions).filter(kv => !kv[0].match(':')).map((kv) => {
            const tabSession = kv[1]

            if (tabSession.auto && tabSession.socket) {
                const { host, port } = tabSession.socket

                if (host === settings.host && port === settings.port) {
                    home = true
                }
                // if it's a remote session then track it for the next loop
                if (tabSession.socket?.uuid) {
                    openedRemoteTabSessions[tabSession.socket.uuid] = tabSession
                }
                openTab(host, port)
            }
            return kv[1]
        })
        // then handle remote sessions that have not yet been opened thus there is no tab session
        Object.entries(state.sessions).filter(kv => kv[0].match(':') &&
            !tabSessions.find((tabSession) => tabSession.info.id.match(kv[1].info.id))).forEach((kv) => {

                const remoteSessionId = kv[0],
                    remoteSession = kv[1]

                if (!openedRemoteTabSessions[remoteSessionId.split(':')[0]] && remoteSession.auto && remoteSession?.tunnelSocket?.socket) {
                    const remoteMetadata = {
                        cid: remoteSession.tunnelSocket.cid,
                        uuid: remoteSession.uuid,
                    }
                    openTab(remoteMetadata)
                }
            })
        // if the home tab socket hasn't been added to the sessions yet
        if (!home && settings.auto) {
            openTab(settings.host, settings.port)
        }
        // failsafe interval of 60 seconds because the runaway problem can be real!!!
    }, {
        timeout: settings.checkInterval || 60000
    })
    cache.drainInterval = setInterval(() => cache.highWaterMark > 0 && (cache.highWaterMark -= 1), DRAIN_INTERVAL)
})()
async function getInfo(host, port) {
    const remoteMetadata = typeof host === 'object' ? host : undefined
    const cacheId = remoteMetadata?.cid || `${host}:${port}`
    let url
    if (/nodejs\.june07\.com/.test(host)) {
        url = `https://${host}/json`
    } else if (remoteMetadata?.cid) {
        url = `https://${brakecode.PADS_HOST}/json/${remoteMetadata.cid}`
    } else {
        url = `http://${host}:${port}/json`
    }
    const defaultOptions = {
        headers: {
            'content-type': 'application/json',
            'x-forwarded-for': cache.ip
        }
    }
    const options = remoteMetadata?.cid ? {
        ...defaultOptions,
        headers: {
            ...defaultOptions.headers,
            'authorization': 'Bearer ' + state.token
        },
    } : defaultOptions
    try {
        const response = await fetch(url, options)
        // console.log('response status: ', response.status);
        if (!`${response.status}`.match(/2[0-9]{2}/)) return
        const info = await response.json()
        // Will there ever be a reason to use an index other than 0? Not sure why an array is returned from Node.js?!
        cache.info[cacheId] = {
            infoURL: url,
            ...browserAgnosticFix(info[0])
        }
        return cache.info[cacheId]
    } catch (error) {
        if (!error?.message?.match(/Failed to fetch/i)) {
            console.log(error)
        }
    }
}
async function getInfoCache(remoteMetadata) {
    const cacheId = remoteMetadata.cid
    if (cache.info[cacheId]) {
        return cache.info[cacheId]
    }
    return await getInfo(remoteMetadata)
}
async function queryForDevtoolTabs(host, port) {
    const remoteMetadata = typeof host === 'object' ? host : {}
    let devtoolsLocalPatterns = [],
        devtoolsRemotePatterns = [],
        url

    await async.until(
        (cb) => cb(null, settings.DEVTOOLS_SCHEME),
        (next) => setTimeout(next)
    )
    if (!remoteMetadata?.cid && host && port) {
        devtoolsLocalPatterns = [
            `${settings.DEVTOOLS_SCHEME}*/*${host}:${port}*`,
            `${settings.DEVTOOLS_SCHEME}*/*${host}/ws/${port}*`,

            `https://devtools-frontend.june07.com/*${host}:${port}*`,
            `https://devtools-frontend.june07.com/*${host}/ws/${port}*`,
            
            `https://chrome-devtools-frontend.june07.com/*${host}:${port}*`,
            `https://chrome-devtools-frontend.june07.com/*${host}/ws/${port}*`,

            `https://chrome-devtools-frontend.appspot.com/*${host}:${port}*`,
            `https://chrome-devtools-frontend.appspot.com/*${host}/ws/${port}*`,

            `https://debug.bun.sh/#${host}:${port}/*`
        ]
        if (settings.localDevtools && settings.localDevtoolsOptions[settings.localDevtoolsOptionsSelectedIndex].url.match(reDevtoolsURL)) {
            const devtoolsURL = new URL(settings.localDevtoolsOptions[settings.localDevtoolsOptionsSelectedIndex].url)
            const customDevToolsPatterns = [
                `${devtoolsURL.origin}/*${host}:${port}*`,
                `${devtoolsURL.origin}/*${host}/ws/${port}*`
            ]
    
            devtoolsLocalPatterns.push(...customDevToolsPatterns)
        }
        url = devtoolsLocalPatterns
    } else {
        const { cid } = remoteMetadata

        if (cid) {
            devtoolsRemotePatterns = [
                `${settings.DEVTOOLS_SCHEME}*/*/${cid}/*`,
                `https://devtools-frontend.june07.com/*/${cid}/*`,
                `https://chrome-devtools-frontend.june07.com/*/${cid}/*`,
                `https://chrome-devtools-frontend.appspot.com/*/${cid}/*`,

                `https://debug.bun.sh/#${host}:${port}/*`
            ]
        } else {
            devtoolsRemotePatterns = [
                `${settings.DEVTOOLS_SCHEME}*/*`
            ]
        }
        if (settings.localDevtools && settings.localDevtoolsOptions[settings.localDevtoolsOptionsSelectedIndex].url.match(reDevtoolsURL)) {
            const devtoolsURL = new URL(settings.localDevtoolsOptions[settings.localDevtoolsOptionsSelectedIndex].url)
            const customDevToolsPattern = `${devtoolsURL.origin}/*/${cid}/*`
    
            devtoolsRemotePatterns.push(customDevToolsPattern)
        }
        url = devtoolsRemotePatterns
    }
    const tabs = await chrome.tabs.query({ url })
    return tabs.map(tab => ({ ...tab, socket: { host, port } }))
}
async function openWindow(focus = 'repl') {
    googleAnalytics.fireEvent('openWindow', { focus })
    const { toolsWindow: toolsLastWindow } = await chrome.storage.local.get(['toolsWindow'])
    const info = await getInfo(NODEJS_INSPECT_HOST)
    const devtoolsUrl = info?.devtoolsFrontendUrl.replace(/wss?=([^/]*)/, `wss=${NODEJS_INSPECT_HOST}`)
    let urls = ['https://nim.june07.com/docs']

    if (devtoolsUrl) {
        urls.unshift(devtoolsUrl)
    }

    if (toolsLastWindow) {
        try {
            await chrome.windows.update(toolsLastWindow.id, { focused: true })
            return
        } catch (error) {
            if (!error?.message?.match(/No window with id/i)) {
                console.log(error)
            }
            const lastUrls = (toolsLastWindow.tabs?.map(tab => tab.url || tab.pendingUrl) || [])
                .filter(url => !/wss=nodejs.june07.com|^https:\/\/nim\.june07\.com\/docs/.test(url))
            const toolsWindow = await chrome.windows.create({
                url: [...urls, ...lastUrls],
                focused: true,
                type: toolsLastWindow.type,
                state: toolsLastWindow.state,
                height: toolsLastWindow.height,
                left: toolsLastWindow.left,
                top: toolsLastWindow.top,
                width: toolsLastWindow.width
            })
            await chrome.storage.local.set({ toolsWindow })
            return
        }
    }

    const toolsWindow = await chrome.windows.create({
        url: urls,
        focused: true,
        type: 'normal',
        state: settings.windowStateMaximized ? chrome.windows.WindowState.MAXIMIZED : chrome.windows.WindowState.NORMAL,
        height: toolsLastWindow?.height,
        left: toolsLastWindow?.left,
        top: toolsLastWindow?.top,
        width: toolsLastWindow?.width
    })
    await chrome.storage.local.set({ toolsWindow })
}
async function openTab(host = 'localhost', port = 9229, manual) {
    checkLicenseStatus()
    const remoteMetadata = typeof host === 'object' ? host : undefined
    const cacheId = (manual ? '(manual) ' : '') + (remoteMetadata?.cid || `${host}:${port}`)
    let devtoolsURL

    if (!cache.tabs[cacheId]) {
        if (settings.debugVerbosity >= 9) {
            console.log('resetting cache.tabs')
        }
        cache.tabs[cacheId] = {
            start: Date.now(),
            hits: 0
        }
    };
    if (settings.debugVerbosity >= 9) {
        console.log('cache.tabs[cacheId]: ', cache.tabs[cacheId])
    }
    try {
        // settings.DEVTOOLS_SCHEME can be null on initial startup
        if ((!manual && cache.tabs[cacheId].promise) || !settings?.DEVTOOLS_SCHEME) {
            cache.tabs[cacheId].hits += 1
            return
        }
        const tabs = await queryForDevtoolTabs(host, port)
        // close autoClose sessions if they are dead
        const sessionsWithClosedDebuggerProtocolSockets = tabs.filter(tab => Object.values(state.sessions)?.length && !state.sessions[tab.id]?.socket?.host?.cid).map(tab => {
            const sessionForTab = state.sessions[tab.id]
            if (sessionForTab?.dtpSocket?.ws?.readyState === 3) {
                return sessionForTab
            }
        }).filter((session) => session)
        await Promise.all(sessionsWithClosedDebuggerProtocolSockets.map(async (session) => {
            // remove sessions if autoClose is set OR there is a new session to replace it.
            if (session.autoClose) {
                return await chrome.tabs.remove(session.tabId)
            } else if (host === session.socket.host && port == session.socket.port) {
                // here we need to replace or otherwise keep the current tab in place otherwise the window will close if it's the only/last tab
                if (!cache.deadSocketSessions[session.info.id]) {
                    const deadURL = session.url.replace(host, 'invalid')
                    await chrome.tabs.update(session.tabId, { url: deadURL })
                    cache.deadSocketSessions[session.info.id] = session
                }
            }
        }))
        // Highlighting when auto is set causes the browser to lose focus and grab control every checkInterval period.
        if (tabs.length) {
            const tabIndexes = tabs.map(tab => tab.index)

            // cache.highlighted so that highlighting is not interruptive as it only happens once per session instance
            if (manual || (!settings.auto && tabIndexes.filter((tabIndex) => !cache.highlighted[tabIndex])?.length)) {
                const highlight = chrome.tabs.highlight({ tabs: tabIndexes, windowId: tabs[0].windowId })
                tabIndexes.forEach((tabIndex) => cache.highlighted[tabIndex] = highlight)
            }
            cache.tabs[cacheId].hits += 1
            return
        }
        const info = await getInfo(remoteMetadata || host, port)
        if (!info) {
            cache.tabs[cacheId].hits += 1
            return
        }
        if (info.type !== 'bun') {
            setDevtoolsURL(info)
            if (remoteMetadata) {
                // fix deno info
                if (JSON.stringify(info).match(/[\W](deno)[\W]/)) {
                    info.type = 'deno'
                }
                devtoolsURL = info.devtoolsFrontendUrl.replace(/wss?=([^&]*)/, `wss=${getRemoteWebSocketDebuggerUrl(remoteMetadata, info)}`)
                info.remoteWebSocketDebuggerUrl = () => `wss://${getRemoteWebSocketDebuggerUrl(remoteMetadata, info, { encode: false })}`
            } else {
                devtoolsURL = info.devtoolsFrontendUrl.replace(/wss?=localhost/, 'ws=127.0.0.1')
                var inspectIP = devtoolsURL.match(SOCKET_PATTERN)[1]
                var inspectPORT = devtoolsURL.match(SOCKET_PATTERN)[5]
                devtoolsURL = devtoolsURL
                    .replace(inspectIP + ":9229", host + ":" + port) // In the event that remote debugging is being used and the infoURL port (by default 80) is not forwarded take a chance and pick the default.
                    .replace(inspectIP + ":" + inspectPORT, host + ":" + port) // A check for just the port change must be made.
            }
            // custom devtools
            if ((settings.localDevtools || settings.devToolsCompat) && settings.localDevtoolsOptions[settings.localDevtoolsOptionsSelectedIndex].url.match(reDevtoolsURL)) {
                devtoolsURL = devtoolsURL.replace(reDevtoolsURL, settings.localDevtoolsOptions[settings.localDevtoolsOptionsSelectedIndex].url)
            }
            // legacy fix
            if (devtoolsURL.match(/chrome-devtools:\/\//)) {
                devtoolsURL = devtoolsURL.replace(/chrome-devtools:\/\//, 'devtools://')
            }
        } else {
            devtoolsURL = info.devtoolsFrontendUrl
        }

        if (!cache.tabs[cacheId].promise) {
            cache.tabs[cacheId].promise = createTabOrWindow(devtoolsURL, info, { host, port })
            cache.tabs[cacheId].tabId = await cache.tabs[cacheId].promise
            // wait for the new tab to fully load
            await async.until(
                (cb) => chrome.tabs.get(cache.tabs[cacheId].tabId, (tab) => cb(null, tab?.status === 'complete')),
                (next) => setTimeout(next)
            )
            // should be able to cleanup the dead sockets here since the new tab is created
            await Promise.all(Object.values(cache.deadSocketSessions)?.forEach(async (session) => {
                await chrome.tabs.remove(session.tabId)
                delete cache.deadSocketSessions[session.info.id]
                delete state.sessions[session.tabId]
            }) || [])
        } else {
            cache.tabs[cacheId].hits += 1
            // console.log('adding hit ', cacheId, cache.tabs[cacheId]);
        }
    } catch (error) {
        delete cache.tabs[cacheId]
    }
}
async function getLicenseStatus() {
    try {
        const userInfo = (await chrome.storage.local.get('userInfo'))?.userInfo || await getUserInfo()
        const response = await fetch(`https://${LICENSE_HOST}/v1/license/nim`, {
            method: "POST",
            headers: {
                'Accept': "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ userInfo })
        })
        if (response.status !== 200) {
            return { error: new Error('unable to get license status') }
        }
        const data = await response.json()

        return data
    } catch (error) {
        googleAnalytics.fireEvent('license_error', { id, 'error': error.message })
        return { error: new Error('unable to get license status') }
    }
}
async function checkLicenseStatus() {
    const { checkedLicenseOn } = await chrome.storage.local.get('checkedLicenseOn')
    const notificationDuration = /production|test/.test(ENV) ? 1000 * 60 * 60 * 24 : 60000 

    // Debouncing
    if (cache.isCheckingLicense) {
        return
    }
    cache.isCheckingLicense = true

    try {
        if (!checkedLicenseOn || checkedLicenseOn < Date.now() - (notificationDuration / 2)) {
            await chrome.storage.local.set({ checkedLicenseOn: Date.now() })

            const { oUserId, license, error } = await getLicenseStatus()

            if (license?.valid || error) {
                return
            }

            if (!state.subscriptionNotificationOn || state.subscriptionNotificationOn < Date.now() - notificationDuration) {
                state.subscriptionNotificationOn = Date.now()
                await chrome.storage.local.set({ subscriptionNotificationOn: state.subscriptionNotificationOn })
                const tabs = await chrome.tabs.query({ url: 'https://june07.com/nim-subscription/?oUserId=' + oUserId })
                const delay = 7 * 60000
                const showAt = Date.now() + delay

                await chrome.storage.session.set({ showingSubscriptionMessage: showAt })
                await new Promise(resolve => setTimeout(resolve, delay))

                if (tabs.length > 0) {
                    const existingTabId = tabs[0].id

                    await chrome.tabs.update(existingTabId, { active: false })
                } else {
                    await chrome.tabs.create({
                        url: 'https://june07.com/nim-subscription/?oUserId=' + oUserId,
                        active: false
                    })
                }
            }
        } else {
            if (settings.debugVerbosity >= 9) {
                console.log(`checking license again in ${Math.floor(1000 * 60 * 60 * 2 - (Date.now() - checkedLicenseOn)) / 1000 / 60} min`)
            }
        }
    } catch (error) {
        console.log(error)
    } finally {
        cache.isCheckingLicense = false
    }
}
function getRemoteWebSocketDebuggerUrl(remoteMetadata, info, options = { encode: true }) {
    const { encode } = options
    const sapikey = encryptMessage(state.apikey, brakecode.getPublicKey())
    const uriString = `uid=${state.user.sub}&sapikey=${btoa(sapikey, 'base64')}&${info.type === 'deno' ? 'runtime=deno' : ''}`
    const wsQuery = encode ? encodeURIComponent(uriString) : uriString
    return `${brakecode.PADS_HOST}/ws/${remoteMetadata.cid}/${info.id}?${wsQuery}`
}
function createTabOrWindow(url, info, socket) {
    return new Promise(async function (resolve) {
        const dtpSocketPromise = devtoolsProtocolClient.setSocket(info, {
            autoResume: settings.autoResumeInspectBrk,
            focusOnBreakpoint: settings.focusOnBreakpoint
        })
        if (settings.newWindow) {
            const { lastWindow } = await chrome.storage.local.get('lastWindow')
            const window = await chrome.windows.create({
                url,
                focused: settings.windowFocused,
                type: (settings.panelWindowType) ? 'panel' : 'normal',
                state: settings.windowStateMaximized ? chrome.windows.WindowState.MAXIMIZED : chrome.windows.WindowState.NORMAL,
                height: (await lastWindow)?.height,
                left: (await lastWindow)?.left,
                top: (await lastWindow)?.top,
                width: (await lastWindow)?.width
            })
            const tabId = window.tabs[0].id
            // updateTabUI(tabId, url)
            const dtpSocket = await dtpSocketPromise
            devtoolsProtocolClient.addEventListeners(dtpSocket, settings.autoClose, tabId)
            saveSession({ url, tabId, windowId: window.id, info, dtpSocket, socket })
            // group tabs
            if (settings.group) {
                group(tabId)
            }
            resolve(tabId)
            if (settings.pin) {
                utilities.pin(window.id, socket)
            }
            googleAnalytics.fireEvent('Program Event', { 'action': 'createWindow', 'detail': `focused: ${settings.windowFocused}` })
        } else {
            const tab = await chrome.tabs.create({
                url,
                active: settings.tabActive && !settings.group,
                windowId: await utilities.getPinned(socket)
            })
            // updateTabUI(tab.id, url)
            const dtpSocket = await dtpSocketPromise
            devtoolsProtocolClient.addEventListeners(dtpSocket, settings.autoClose, tab.id)
            saveSession({ url, tabId: tab.id, info, dtpSocket, socket })
            // group tabs
            if (settings.group) {
                group(tab.id, settings.tabActive)
            }
            resolve(tab.id)
            const currentWindow = await chrome.windows.getCurrent()
            if (settings.pin) {
                utilities.pin(currentWindow.id, socket)
            }
            googleAnalytics.fireEvent('Program Event', { 'action': 'createTab', 'detail': `focused: ${settings.tabActive}` })
        }
    })
}
async function group(tabId, active) {
    try {
        // first check to see if there's an open group that we aren't tracking via state
        const trackedDefaultGroup = state.groups['default']
        const untrackedGroup = (await chrome.tabGroups.query({ title: 'NiM' })).filter((tracked) => tracked.id !== trackedDefaultGroup?.id).pop()

        if (untrackedGroup && trackedDefaultGroup) {
            const untrackedGroupTabs = await chrome.tabs.query({ groupId: untrackedGroup.id })
            await Promise.all(
                untrackedGroupTabs.forEach((tab) => chrome.tabs.ungroup(tab.id).then(() => chrome.tabs.group({ groupId: trackedDefaultGroup.id, tabIds: [tab.id] })))
            )
        } else if (untrackedGroup) {
            state.groups['default'] = untrackedGroup
            googleAnalytics.fireEvent('Program Event', { action: 'Tab Group Added', detail: 'external' })
        }
        if (state.groups['default']) {
            chrome.tabs.group({ tabIds: tabId, groupId: trackedDefaultGroup?.id || state.groups['default'].id })
            await chrome.tabs.reload(tabId)
        } else {
            try {
                const tab = await chrome.tabs.get(tabId)
                const groupId = await chrome.tabs.group({ tabIds: tabId, createProperties: { windowId: tab.windowId } })
                state.groups['default'] = await chrome.tabGroups.update(groupId, { color: 'green', title: 'NiM' })
                googleAnalytics.fireEvent('Program Event', { action: 'Tab Group Added', detail: 'default' })
            } catch (error) {
                console.log(error)
            }
        }
        if (active) {
            // set active here when grouping to avoid UI flickering
            chrome.tabs.update(tabId, { active })
        }
    } catch (error) {
        googleAnalytics.fireEvent('group', { error })
        console.log(error)
    }
}
function updateTabUI(tabId, title) {
    chrome.scripting.executeScript(
        {
            target: { tabId: tabId, allFrames: true },
            func: scripting.updateTabUI,
            args: [tabId, title]
        },
        (injectionResults) => {
            if (!injectionResults) return
            for (const frameResult of injectionResults) {
                // console.log('Frame Title: ' + frameResult.result);
            }
        })
}
async function saveSession(params) {
    const { url, tabId, windowId, info, dtpSocket, socket } = params
    const existingSessions = Object.values(state.sessions).filter((session) => session.info.infoURL === info.infoURL)

    const session = {
        url,
        auto: existingSessions[0]?.auto || settings.auto,
        autoClose: existingSessions[0]?.autoClose || settings.autoClose,
        newWindow: existingSessions[0]?.newWindow || settings.newWindow,
        tabId,
        windowId,
        info,
        dtpSocket,
        socket
    }
    state.sessions[tabId] = session

    chrome.storage.session.set({ sessions: state.sessions })
    // if removeSessionOnTabRemoved is set to false then the session is saved until this point, now delete it. 
    existingSessions.map((session) => delete state.sessions[session.tabId])
}
function encryptMessage(message, publicKeyBase64Encoded) {
    const clientPrivateKey = nacl.randomBytes(32),
        publicKey = (publicKeyBase64Encoded !== undefined) ? nacl.util.decodeBase64(publicKeyBase64Encoded) : nacl.util.decodeBase64('cXFjuDdYNvsedzMWf1vSXbymQ7EgG8c40j/Nfj3a2VU='),
        nonce = crypto.getRandomValues(new Uint8Array(24)),
        keyPair = nacl.box.keyPair.fromSecretKey(clientPrivateKey)
    message = nacl.util.decodeUTF8(JSON.stringify(message))
    const encryptedMessage = nacl.box(message, nonce, publicKey, keyPair.secretKey)
    return nacl.util.encodeBase64(nonce) + ' ' + nacl.util.encodeBase64(keyPair.publicKey) + ' ' + nacl.util.encodeBase64(encryptedMessage)
}
async function getUserInfo() {
    const userInfo = await chrome.identity.getProfileUserInfo()
    const encryptedUserInfo = encryptMessage(userInfo)
    chrome.storage.local.set({ userInfo: encryptedUserInfo })
    return encryptedUserInfo
}
function browserAgnosticFix(info) {
    if (info?.devtoolsFrontendUrlCompat) info.devtoolsFrontendUrl = info.devtoolsFrontendUrl.replace(/chrome-devtools:\/\//, 'devtools://')
    if (info?.devtoolsFrontendUrlCompat) info.devtoolsFrontendUrlCompat = info.devtoolsFrontendUrlCompat.replace(/chrome-devtools:\/\//, 'devtools://')
    return info
}
function setDevtoolsURL(debuggerMetadata) {
    /** Deno also doesn't have devtoolsFrontendUrlCompat so if it's missing juse use the hardcoded value */
    settings.localDevtoolsOptions[0].url = settings.devToolsCompat ? debuggerMetadata.devtoolsFrontendUrlCompat?.split('?')[0] || 'devtools://devtools/bundled/inspector.html' : debuggerMetadata.devtoolsFrontendUrl.split('?')[0]
    /** Deno is still using the legacy chrome-devtools:// scheme.  See https://github.com/denoland/deno/pull/7659 */
    settings.localDevtoolsOptions[0].url = settings.localDevtoolsOptions[0].url.replace(/chrome-devtools:\/\//, 'devtools://')
}
function getRemoteSessionIdFromTabSessionId(tabSessionId) {
    const tabSession = state.sessions[tabSessionId]
    const remoteSessions = Object.entries(state.sessions).filter(kv => kv[0].match(/:/))

    // thought about comparing the socket data but that may be more ephemeral
    return remoteSessions.find(kv => JSON.stringify(tabSession.info) === JSON.stringify(kv[1].info))?.[0]
}
// This function can't be async... should according to the docs but ran into issues! Worked fine on the Vue side, but not in the popup window.
function messageHandler(request, sender, reply) {
    switch (request.command) {
        case 'hydrated':
            reply(state.hydrated)
            break
        case 'docs':
            openWindow('docs')
            break
        case 'openDevtools':
            const { host, port, manual } = request
            const remoteMetadata = typeof host === 'object' ? host : undefined
            const cacheId = remoteMetadata?.cid || `${host}:${port}`

            if (cache[cacheId]) return
            try {
                cache[cacheId] = Date.now()
                openTab(host, port, manual)
            } catch (error) {
                console.log(error)
            } finally {
                delete cache[cacheId]
            }
            break
        case 'getSettings': settings.get().then(reply); break
        case 'getSessions': reply(state.sessions); break
        case 'getRemotes':
            chrome.storage.session.get('remotes').then((response) => reply(response?.remotes || {}))
            break
        case 'getRoute':
            chrome.storage.session.get('route').then((response) => reply(response?.route))
            break
        case 'getOverlays':
            chrome.storage.session.get('overlays').then((response) => reply(response?.overlays))
            break
        case 'commit':
            const { store, obj, key, keys, value, values } = request

            // pay attention to the fact that "sessions" below is different from the chrome "session" store!
            if (obj === 'sessions') {
                let updates = keys && values
                    ? keys.map(key => ({
                        key,
                        value: { ...state[obj][key], ...values[key] }
                    }))
                    : undefined
                if (!updates) {
                    const tabId = keys[0],
                        remoteSessionId = keys[1]
                    // delete state[obj][key];
                    // tabId key must always be first and is only needed for this cache because it's only for tabs
                    // must turn these off immediately since the sessions themselves may linger.
                    state.sessions[tabId].auto = false
                    state.sessions[remoteSessionId].auto = false
                    cache.forceRemoveSession[tabId] = true
                    chrome.tabs.remove(tabId).then(() => {
                        async.until(
                            (cb) => cb(null, cache.removed[tabId]),
                            (next) => setTimeout(next, 500),
                            reply
                        )
                    }).catch(error => {
                        if (/no\s+tab/i.test(error)) {
                            cache.removed[tabId] = Date.now()
                            reply()
                        }
                        console.log(error)
                    })
                } else {
                    Promise.all(updates.map(update => {
                        state[obj][update.key] = update.value
                        const p = new Promise(resolve => chrome.storage[store].set({ [obj]: state[obj] }).then(() => resolve({ key: update.key, value: update.value })))
                        return p
                    })).then((updates) => {
                        updates
                        reply(updates)
                    })
                }
            } else if (obj === 'settings') {
                let update = { [key]: value }
                settings.update(update).then(() => reply(update))
            } else if (obj.match(/route|overlays/)) {
                state[obj][key] = value
                chrome.storage[store].set({ [obj]: state[obj] }).then(() => reply(state[obj]))
            }
            break
        case 'signout':
            googleAnalytics.fireEvent('signout', {})
            chrome.storage.local.remove(['apikey', 'token', 'user']).then(() => reply())
            break
        case 'getInfo':
            getInfoCache(request.remoteMetadata).then((info) => reply(info))
            break
        case 'auth':
            googleAnalytics.fireEvent('auth', {})
            const { user, token, apikey } = request.credentials

            if (user !== state.user) {
                chrome.storage.local.set({ user }).then(() => state.user = user)
            }
            if (token !== state.token) {
                chrome.storage.local.set({ token }).then(() => state.token = token)
            }
            if (apikey !== state.apikey) {
                chrome.storage.local.set({ apikey }).then(() => {
                    state.apikey = apikey
                    reply()
                })
            }
            break
    }
    return true
}
function sendMessage(message) {
    if (cache?.messagePort?.postMessage) {
        try {
            cache.messagePort.postMessage(message)
        } catch (error) {
            if (error.message.match(/disconnected port/)) {
                delete cache.messagePort
            }
        }
    }
}

chrome.runtime.onInstalled.addListener(details => {
    if (details.reason === 'install') {
        chrome.tabs.create({ url: INSTALL_URL })
    }
    analytics.push({ event: 'install', onInstalledReason: details.reason })
    googleAnalytics.fireEvent('install', { onInstalledReason: details.reason })
})
chrome.runtime.onConnect.addListener((port) => {
    cache.messagePort = port
})
chrome.runtime.onMessage.addListener(messageHandler)
chrome.runtime.onMessageExternal.addListener(messageHandler)
chrome.runtime.onSuspend.addListener(() => {
    clearInterval(cache.checkInterval)
    chrome.storage.local.set({
        token: state.token,
        apikey: state.token,
    })
    googleAnalytics.fireEvent('resume', {})
})
chrome.runtime.onStartup.addListener(() => {
    googleAnalytics.fireEvent('startup', {})
    checkLicenseStatus()
})
chrome.tabs.onUpdated.addListener(async function chromeTabsChangedEvent(tabId, { status }, tab) {
    const { toolsWindow } = await chrome.storage.local.get(['toolsWindow'])

    if (toolsWindow?.id === tab.windowId && status === 'complete') {
        let updatedToolsWindow = await chrome.windows.get(toolsWindow.id, { populate: true })
        const tabIndex = updatedToolsWindow.tabs.findIndex(tab => tab.id === tabId)
        if (tabIndex !== -1) {
            updatedToolsWindow.tabs[tabIndex].url = tab.url
        }
        await chrome.storage.local.set({ 'toolsWindow': updatedToolsWindow })
    }
})
chrome.tabs.onCreated.addListener(async function chromeTabsCreatedEvent(tab) {
    const { toolsWindow } = await chrome.storage.local.get(['toolsWindow'])

    cache.highWaterMark = cache.highWaterMark ? cache.highWaterMark += 1 : 1
    if (cache.highWaterMark > HIGH_WATER_MARK_MAX) {
        settings.auto = false
    }

    if (toolsWindow?.id === tab.windowId) {
        const updatedToolsWindow = await chrome.windows.get(toolsWindow.id, { populate: true })
        await chrome.storage.local.set({ 'toolsWindow': updatedToolsWindow })
    }
    googleAnalytics.fireEvent('Program Event', { 'action': 'onCreated' })
})
chrome.tabs.onRemoved.addListener(async function chromeTabsRemovedEvent(tabId, { isWindowClosing, windowId }) {
    const { toolsWindow } = await chrome.storage.local.get(['toolsWindow'])
    cache.removed[tabId] = Date.now()
    const tabCacheEntry = Object.entries(cache.tabs).find((kv) => kv[1]?.tabId === tabId)

    if (toolsWindow?.id && toolsWindow.id === windowId && !isWindowClosing) {
        let updatedToolsWindow = await chrome.windows.get(toolsWindow.id, { populate: true })
        updatedToolsWindow.tabs = updatedToolsWindow.tabs.filter((tab) => tab.id !== tabId)
        await chrome.storage.local.set({ 'toolsWindow': updatedToolsWindow })
    }
    if (tabCacheEntry) {
        // console.log(`deleting cache.tabs[${tabCacheEntry[0]}]`)
        delete cache.tabs[tabCacheEntry[0]]
    }
    if (!settings.removeSessionOnTabRemoved && !cache.forceRemoveSession[tabId]) {
        // delete state.sessions[getRemoteSessionIdFromTabSessionId(tabId)].tabSession;
        // set this so the close button knows the state
        if (state.sessions[tabId]) {
            state.sessions[tabId].dtpSocket.ws.close()
            state.sessions[tabId].closed = true
        }
        return
    }
    delete cache.forceRemoveSession[tabId]
    delete state.sessions[tabId]
    await chrome.storage.session.set({ sessions: state.sessions })
    googleAnalytics.fireEvent('Program Event', { 'action': 'onRemoved' })
})
chrome.tabs.onActivated.addListener(function chromeTabsActivatedEvent() {
    googleAnalytics.fireEvent('Program Event', { 'action': 'onActivated' })
})
chrome.storage.onChanged.addListener((changes, areaName) => {
    // send update if the sessions need to be re-read
    if (areaName.match(/session/)) {
        sendMessage({ command: 'update' })
    } else if (areaName.match(/local/) && changes.notifications) {
        sendMessage({ command: 'updateNotifications' })
    }

})
chrome.tabGroups.onRemoved.addListener((tabGroup) => {
    Object.entries(state.groups).filter((kv) => kv[1].id === tabGroup.id).map((kv) => {
        const tabGroupId = kv[0]
        delete state.groups[tabGroupId]
        googleAnalytics.fireEvent('User Event', { action: 'Tab Group Removed', detail: tabGroupId })
    })
})
chrome.windows.onBoundsChanged.addListener(async (window) => {
    const tab = (await chrome.tabs.query({ windowId: window.id }))[0]

    if (/wss=nodejs.june07.com|^https:\/\/nim\.june07\.com\/docs/.test(tab.url)) {
        await chrome.storage.local.set({ toolsWindow: window })
    } else {
        await chrome.storage.local.set({ lastWindow: window })
    }
})
chrome.omnibox.onInputEntered.addListener(() => {
    googleAnalytics.fireEvent('omnibox.onInputEntered', {})

    // if the text is a valid host, then update the default socket and set auto mode, maybe open the action icon too?!
    if (reSocket.test(cache.omniboxText)) {
        const host = cache.omniboxText.split(':')[0]
        const port = Number(cache.omniboxText.split(':')[1]) ? cache.omniboxText.split(':')[1] : settings.port
        const auto = true
        settings.update({ host, port, auto }).then(() => {
            messaging.addNotification({
                topic: 'omnibox',
                title: `Settings Updated`,
                content: `${host}:${port}, auto mode enabled`,
                badge: {
                    text: `${host}:${port}, auto mode enabled`,
                    speed: 200,
                    skipId: true
                }
            })
        })
    } else if (/^:/.test(cache.omniboxText)) {
        const command = cache.omniboxText.split(':')[1]?.trim()
        if (command === 'docs') {
            openWindow('docs')
        }
    } else {
        googleAnalytics.fireEvent('omnibox.onInputEntered', { invalidHost: cache.omniboxText })
    }
})
chrome.omnibox.onInputChanged.addListener(function (text) {
    cache.omniboxText = Number(text) ? `localhost:${text}` : (text || 'localhost:9229')
    if (/^:/.test(text)) {
        chrome.omnibox.setDefaultSuggestion({ description: `Command list: docs` })
    } else {
        chrome.omnibox.setDefaultSuggestion({ description: `Listen for the debugger on ${cache.omniboxText} and auto manage DevTools.` })
    }
})
