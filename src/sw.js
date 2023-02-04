importScripts(
    '../dist/uuidv5.min.js',
    '../dist/nacl-fast.min.js',
    '../dist/nacl-util.min.js',
    '../dist/amplitude.umd.min.js',
    '../dist/async.min.js',
    '../dist/socket.io.min.js',
    '../dist/nanoid.min.js',
    './utils.js',
    './settings.js',
    './brakecode.js',
    './utilities.js',
    './analytics.js',
    './messaging.js',
    './scripting.js',
    './devtoolsProtocolClient.js',
);

amplitude.getInstance().init("0475f970e02a8182591c0491760d680a");

const VERSION = '0.0.0';
const INSTALL_URL = "https://blog.june07.com/nim-install/?utm_source=nim&utm_medium=chrome_extension&utm_campaign=extension_install&utm_content=1";
const UNINSTALL_URL = "https://bit.ly/2vUcRNn";
const SHORTNER_SERVICE_URL = 'https://shortnr.june07.com/api';
const NOTIFICATION_CHECK_INTERVAL = settings.ENV !== 'production' ? 60000 : 60 * 60000; // Check every hour
const NOTIFICATION_PUSH_INTERVAL = settings.ENV !== 'production' ? 60000 : 60 * 60000; // Push new notifications no more than 1 every hour if there is a queue.
const NOTIFICATION_LIFETIME = settings.ENV !== 'production' ? 3 * 60000 : 7 * 86400000;
const SOCKET_PATTERN = /((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])):([0-9]+)/;
const reDevtoolsURL = /(devtools:\/\/|chrome-devtools:\/\/|https:\/\/chrome-devtools-frontend(\.appspot.com|\.june07.com)).*(inspector.html|js_app.html)/;
const reTabGroupTitle = new RegExp(/NiM/);
const HIGH_WATER_MARK_MAX = 3;
const DRAIN_INTERVAL = 5000;

let cache = {
    tabs: {},
    forceRemoveSession: {},
    highlighted: {},
    removed: {},
    messagePort: undefined,
    info: {},
    timeouts: {}
};
let state = {
    hydrated: false,
    groups: {},
    route: {
        path: 'main'
    }
};

async function importForeignTabs() {
    return await queryForDevtoolTabs();
}
async function hydrateState() {
    /** this function will generally not be useful during testing because the session is restarted every time a reload is done
     *  So as a workaround use importForeignTabs() during development... might be useful to just keep period?!
     */
    if (settings.ENV !== 'production') {
        const foreignTabSessions = await importForeignTabs();
        await chrome.tabs.remove(foreignTabSessions.map((tab) => tab.id));
        foreignTabSessions.forEach((foreignTabSessions) => {
            openTab(foreignTabSessions.socket.host, foreignTabSessions.socket.port);
        })
    }
    const sessions = (await chrome.storage.session.get('sessions'))?.sessions;
    state.sessions = sessions ? { ...sessions } : {};
    await Promise.all([
        chrome.storage.local.get('token').then((obj) => state.token = obj.token),
        chrome.storage.local.get('apikey').then((obj) => state.apikey = obj.apikey),
    ]);
    state.hydrated = true;
    // console.log('serviceworker state:', state);
}
(async function init() {
    cache.ip = await (await fetch('https://ip-cfworkers.brakecode.com', { method: 'head' })).headers.get('cf-connecting-ip');
    await async.until(
        (cb) => cb(null, settings.DEVTOOLS_SCHEME),
        (next) => setTimeout(next, 500)
    );
    await hydrateState();
    cache.checkInterval = utils.resetInterval(() => {
        let home,
            openedRemoteTabSessions = {};

        // first handle tab sessions
        const tabSessions = Object.entries(state.sessions).filter(kv => !kv[0].match(':')).map((kv) => {
            const tabSession = kv[1];

            if (tabSession.auto && tabSession.socket) {
                const { host, port } = tabSession.socket;

                if (host === settings.host && port === settings.port) {
                    home = true;
                }
                // if it's a remote session then track it for the next loop
                if (tabSession.socket?.uuid) {
                    openedRemoteTabSessions[tabSession.socket.uuid] = tabSession;
                }
                openTab(host, port);
            }
            return kv[1];
        });
        // then handle remote sessions that have not yet been opened thus there is no tab session
        Object.entries(state.sessions).filter(kv => kv[0].match(':') &&
            !tabSessions.find((tabSession) => tabSession.info.id.match(kv[1].info.id))).forEach((kv) => {

            const remoteSessionId = kv[0],
                remoteSession = kv[1];

            if (!openedRemoteTabSessions[remoteSessionId.split(':')[0]] && remoteSession.auto && remoteSession?.tunnelSocket?.socket) {
                const remoteMetadata = {
                    cid: remoteSession.tunnelSocket.cid,
                    uuid: remoteSession.uuid,
                }
                openTab(remoteMetadata);
            }
        });
        // if the home tab socket hasn't been added to the sessions yet
        if (!home && settings.auto) {
            openTab(settings.host, settings.port);
        }
        // failsafe interval of 60 seconds because the runaway problem can be real!!!
    }, {
        timeout: settings.checkInterval || 60000
    });
    cache.drainInterval = setInterval(() => cache.highWaterMark > 0 && (cache.highWaterMark -= 1), DRAIN_INTERVAL);
})();
async function getInfo(host, port) {
    const remoteMetadata = typeof host === 'object' ? host : undefined;
    const cacheId = remoteMetadata?.cid || `${host}:${port}`;
    const url = remoteMetadata?.cid ? `https://${brakecode.PADS_HOST}/json/${remoteMetadata.cid}` : `http://${host}:${port}/json`;
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
        const response = await fetch(url, options);
        // console.log('response status: ', response.status);
        if (!`${response.status}`.match(/2[0-9]{2}/)) return;
        const info = await response.json();
        // Will there ever be a reason to use an index other than 0? Not sure why an array is returned from Node.js?!
        cache.info[cacheId] = {
            infoURL: url,
            ...browserAgnosticFix(info[0])
        }
        return cache.info[cacheId];
    } catch (error) {
        if (!error?.message?.match(/Failed to fetch/i)) {
            console.error(error);
        }
    }
}
async function getInfoCache(remoteMetadata) {
    const cacheId = remoteMetadata.cid
    if (cache.info[cacheId]) {
        return cache.info[cacheId];
    }
    return await getInfo(remoteMetadata);
}
async function queryForDevtoolTabs(host, port) {
    const remoteMetadata = typeof host === 'object' ? host : undefined;
    const devtoolsBasePatterns = [
        `${settings.DEVTOOLS_SCHEME}*/*`,
        `https://chrome-devtools-frontend.june07.com/*:*`,
        `https://chrome-devtools-frontend.appspot.com/*:*`,
    ];
    let devtoolsLocalPatterns = [],
        devtoolsRemotePatterns = [];

    if (!remoteMetadata) {
        devtoolsLocalPatterns = [
            `${settings.DEVTOOLS_SCHEME}*/*${host}:${port}*`,
            `${settings.DEVTOOLS_SCHEME}*/*${host}/ws/${port}*`,

            `https://chrome-devtools-frontend.june07.com/*${host}:${port}*`,
            `https://chrome-devtools-frontend.june07.com/*${host}/ws/${port}*`,

            `https://chrome-devtools-frontend.appspot.com/*${host}:${port}*`,
            `https://chrome-devtools-frontend.appspot.com/*${host}/ws/${port}*`
        ]
    } else {
        const { cid } = remoteMetadata;
        devtoolsRemotePatterns = [
            `${settings.DEVTOOLS_SCHEME}*/*/${cid}/*`,
            `https://chrome-devtools-frontend.june07.com/*/${cid}/*`,
            `https://chrome-devtools-frontend.appspot.com/*/${cid}/*`,
        ]
    }
    const tabs = await chrome.tabs.query({
        url: !remoteMetadata ? devtoolsLocalPatterns : devtoolsRemotePatterns
    });
    return tabs.map(tab => ({ ...tab, socket: { host, port } }));
}
async function openTab(host = 'localhost', port = 9229, manual) {
    const remoteMetadata = typeof host === 'object' ? host : undefined;
    const cacheId = (manual ? '(manual) ' : '') + (remoteMetadata?.cid || `${host}:${port}`);
    let devtoolsURL;

    if (!cache.tabs[cacheId]) {
        cache.tabs[cacheId] = {
            start: Date.now(),
            hits: 0
        }
    };
    try {
        // settings.DEVTOOLS_SCHEME can be null on initial startup
        if ((!manual && cache.tabs[cacheId].promise) || !settings?.DEVTOOLS_SCHEME) {
            cache.tabs[cacheId].hits += 1;
            return;
        }
        const tabs = await queryForDevtoolTabs(host, port);
        // close autoClose sessions if they are dead
        const sessionsWithClosedDebuggerProtocolSockets = tabs.filter(tab => !state.sessions?.[tab.id]?.socket?.host?.cid).map(tab => {
            const sessionForTab = state.sessions[tab.id];
            if (sessionForTab?.dtpSocket?.ws?.readyState === 3) {
                return sessionForTab;
            }
        }).filter((session) => session);
        await Promise.all(sessionsWithClosedDebuggerProtocolSockets.map(async (session) => {
            // remove sessions if autoClose is set OR there is a new session to replace it.
            if (session.autoClose || (host === session.socket.host && port == session.socket.port)) {
                return await chrome.tabs.remove(session.tabId);
            }
        }));
        // Highlighting when auto is set causes the browser to lose focus and grab control every checkInterval period.
        if (tabs.length) {
            const tabIndexes = tabs.map(tab => tab.index);

            // cache.highlighted so that highlighting is not interruptive as it only happens once per session instance
            if (manual || (!settings.auto && tabIndexes.filter((tabIndex) => !cache.highlighted[tabIndex])?.length)) {
                const highlight = chrome.tabs.highlight({ tabs: tabIndexes, windowId: tabs[0].windowId });
                tabIndexes.forEach((tabIndex) => cache.highlighted[tabIndex] = highlight);
            }
            cache.tabs[cacheId].hits += 1;
            return;
        }
        const info = await getInfo(remoteMetadata || host, port);
        if (!info) {
            cache.tabs[cacheId].hits += 1;
            return;
        }
        setDevtoolsURL(info);
        if (remoteMetadata) {
            // fix deno info
            if (JSON.stringify(info).match(/[\W](deno)[\W]/)) {
                info.type = 'deno'
            }
            devtoolsURL = info.devtoolsFrontendUrl.replace(/wss?=([^&]*)/, `wss=${getRemoteWebSocketDebuggerUrl(remoteMetadata, info)}`);
            info.remoteWebSocketDebuggerUrl = () => `wss://${getRemoteWebSocketDebuggerUrl(remoteMetadata, info, { encode: false })}`;
        } else {
            devtoolsURL = info.devtoolsFrontendUrl.replace(/wss?=localhost/, 'ws=127.0.0.1');
            var inspectIP = devtoolsURL.match(SOCKET_PATTERN)[1];
            var inspectPORT = devtoolsURL.match(SOCKET_PATTERN)[5];
            devtoolsURL = devtoolsURL
                .replace(inspectIP + ":9229", host + ":" + port) // In the event that remote debugging is being used and the infoURL port (by default 80) is not forwarded take a chance and pick the default.
                .replace(inspectIP + ":" + inspectPORT, host + ":" + port) // A check for just the port change must be made.
        }
        // custom devtools
        if ((settings.localDevtools || settings.devToolsCompat) && settings.localDevtoolsOptions[settings.localDevtoolsOptionsSelectedIndex].url.match(reDevtoolsURL)) {
            devtoolsURL = devtoolsURL.replace(reDevtoolsURL, settings.localDevtoolsOptions[settings.localDevtoolsOptionsSelectedIndex].url);
        }
        // legacy fix
        if (devtoolsURL.match(/chrome-devtools:\/\//)) {
            devtoolsURL = devtoolsURL.replace(/chrome-devtools:\/\//, 'devtools://');
        }
        if (!cache.tabs[cacheId].promise) {
            cache.tabs[cacheId].promise = createTabOrWindow(devtoolsURL, info, { host, port });
            cache.tabs[cacheId].tabId = await cache.tabs[cacheId].promise;
        } else {
            cache.tabs[cacheId].hits += 1;
            // console.log('adding hit ', cacheId, cache.tabs[cacheId]);
        }
    } catch(error) {
        delete cache.tabs[cacheId];
    }
}
function getRemoteWebSocketDebuggerUrl(remoteMetadata, info, options = { encode: true }) {
    const { encode } = options;
    const sapikey = encryptMessage(state.apikey, brakecode.getPublicKey());
    const uriString = `uid=${state.user.sub}&sapikey=${btoa(sapikey, 'base64')}&${info.type === 'deno' ? 'runtime=deno' : ''}`;
    const wsQuery = encode ? encodeURIComponent(uriString) : uriString;
    return `${brakecode.PADS_HOST}/ws/${remoteMetadata.cid}/${info.id}?${wsQuery}`;
}
function createTabOrWindow(url, info, socket) {
    return new Promise(async function (resolve) {
        const dtpSocketPromise = devtoolsProtocolClient.setSocket(info, {
            autoResume: settings.autoResumeInspectBrk,
            focusOnBreakpoint: settings.focusOnBreakpoint
        });
        if (settings.newWindow) {
            chrome.windows.getCurrent(async currentWindow => {
                const window = await chrome.windows.create({
                    url,
                    focused: settings.windowFocused,
                    type: (settings.panelWindowType) ? 'panel' : 'normal',
                    state: settings.windowStateMaximized ? chrome.windows.WindowState.MAXIMIZED : settings.windowFocused ? chrome.windows.WindowState.NORMAL : chrome.windows.WindowState.MINIMIZED
                });
                const tabId = window.tabs[0].id;
                updateTabUI(tabId);
                chrome.windows.update(currentWindow.id, { focused: true });
                const dtpSocket = await dtpSocketPromise;
                devtoolsProtocolClient.addEventListeners(dtpSocket, settings.autoClose, tabId);
                saveSession({ url, tabId, info, dtpSocket, socket });
                // group tabs
                if (settings.group) {
                    group(tab.id);
                }
                resolve(tabId);
                amplitude.getInstance().logEvent('Program Event', { 'action': 'createWindow', 'detail': `focused: ${settings.windowFocused}` });
            });
        } else {
            const tab = await chrome.tabs.create({
                url,
                active: settings.tabActive,
            });
            updateTabUI(tab.id);
            const dtpSocket = await dtpSocketPromise;
            devtoolsProtocolClient.addEventListeners(dtpSocket, settings.autoClose, tab.id);
            saveSession({ url, tabId: tab.id, info, dtpSocket, socket });
            // group tabs
            if (settings.group) {
                group(tab.id);
            }
            resolve(tab.id);
            amplitude.getInstance().logEvent('Program Event', { 'action': 'createTab', 'detail': `focused: ${settings.tabActive}` });
        }
    });
}
async function group(tabId) {
    try {
        // first check to see if there's an open group that we aren't tracking via state
        const trackedDefaultGroup = state.groups['default'];
        const untrackedGroup = (await chrome.tabGroups.query({ title: 'NiM' })).filter((tracked) => tracked.id !== trackedDefaultGroup?.id).pop();

        if (untrackedGroup && trackedDefaultGroup) {
            const untrackedGroupTabs = await chrome.tabs.query({ groupId: untrackedGroup.id });
            await Promise.all(
                untrackedGroupTabs.forEach((tab) => chrome.tabs.ungroup(tab.id).then(() => chrome.tabs.group({ groupId: trackedDefaultGroup.id, tabIds: [tab.id] })))
            )
        } else if (untrackedGroup) {
            state.groups['default'] = untrackedGroup;
            amplitude.getInstance().logEvent('Program Event', { action: 'Tab Group Added', detail: 'external' });
        }
        if (state.groups['default']) {
            chrome.tabs.group({ tabIds: tabId, groupId: trackedDefaultGroup?.id || state.groups['default'].id });
        } else {
            try {
                const groupId = await chrome.tabs.group({ tabIds: tabId });
                state.groups['default'] = await chrome.tabGroups.update(groupId, { color: 'green', title: 'NiM' });
                amplitude.getInstance().logEvent('Program Event', { action: 'Tab Group Added', detail: 'default' });
            } catch (error) {
                console.error(error);
            }
        }
    } catch (error) {
        console.error(error);
    }
}
function updateTabUI(tabId) {
    chrome.scripting.executeScript(
        {
            target: { tabId: tabId, allFrames: true },
            func: scripting.updateTabUI,
            args: [tabId]
        },
        (injectionResults) => {
            if (!injectionResults) return;
            for (const frameResult of injectionResults) {
                // console.log('Frame Title: ' + frameResult.result);
            }
        });
}
async function saveSession(params) {
    const { url, tabId, info, dtpSocket, socket } = params;
    const existingSessions = Object.values(state.sessions).filter((session) => session.info.infoURL === info.infoURL);

    const session = {
        url,
        auto: existingSessions[0]?.auto || settings.auto,
        autoClose: existingSessions[0]?.autoClose || settings.autoClose,
        isWindow: existingSessions[0]?.isWindow || settings.isWindow,
        tabId,
        info,
        dtpSocket,
        socket
    }
    state.sessions[tabId] = session;

    chrome.storage.session.set({ sessions: state.sessions });
    // if removeSessionOnTabRemoved is set to false then the session is saved until this point, now delete it. 
    existingSessions.map((session) => delete state.sessions[session.tabId]);
}
function encryptMessage(message, publicKeyBase64Encoded) {
    const clientPrivateKey = nacl.randomBytes(32),
        publicKey = (publicKeyBase64Encoded !== undefined) ? nacl.util.decodeBase64(publicKeyBase64Encoded) : nacl.util.decodeBase64('cXFjuDdYNvsedzMWf1vSXbymQ7EgG8c40j/Nfj3a2VU='),
        nonce = crypto.getRandomValues(new Uint8Array(24)),
        keyPair = nacl.box.keyPair.fromSecretKey(clientPrivateKey);
    message = nacl.util.decodeUTF8(JSON.stringify(message));
    const encryptedMessage = nacl.box(message, nonce, publicKey, keyPair.secretKey);
    return nacl.util.encodeBase64(nonce) + ' ' + nacl.util.encodeBase64(keyPair.publicKey) + ' ' + nacl.util.encodeBase64(encryptedMessage);
}
async function getUserInfo() {
    const userInfo = await chrome.identity.getProfileUserInfo();
    const encryptedUserInfo = encryptMessage(userInfo);
    chrome.storage.local.set({ userInfo: encryptedUserInfo });
    return encryptedUserInfo
}
function browserAgnosticFix(info) {
    if (info?.devtoolsFrontendUrlCompat) info.devtoolsFrontendUrl = info.devtoolsFrontendUrl.replace(/chrome-devtools:\/\//, 'devtools://');
    if (info?.devtoolsFrontendUrlCompat) info.devtoolsFrontendUrlCompat = info.devtoolsFrontendUrlCompat.replace(/chrome-devtools:\/\//, 'devtools://');
    return info;
}
function setDevtoolsURL(debuggerMetadata) {
    /** Deno also doesn't have devtoolsFrontendUrlCompat so if it's missing juse use the hardcoded value */
    settings.localDevtoolsOptions[0].url = settings.devToolsCompat ? debuggerMetadata.devtoolsFrontendUrlCompat?.split('?')[0] || 'devtools://devtools/bundled/inspector.html' : debuggerMetadata.devtoolsFrontendUrl.split('?')[0];
    /** Deno is still using the legacy chrome-devtools:// scheme.  See https://github.com/denoland/deno/pull/7659 */
    settings.localDevtoolsOptions[0].url = settings.localDevtoolsOptions[0].url.replace(/chrome-devtools:\/\//, 'devtools://');
}
function getRemoteSessionIdFromTabSessionId(tabSessionId) {
    const tabSession = state.sessions[tabSessionId];
    const remoteSessions = Object.entries(state.sessions).filter(kv => kv[0].match(/:/));

    // thought about comparing the socket data but that may be more ephemeral
    return remoteSessions.find(kv => JSON.stringify(tabSession.info) === JSON.stringify(kv[1].info))?.[0];
}
// This function can't be async... should according to the docs but ran into issues! Worked fine on the Vue side, but not in the popup window.
function messageHandler(request, sender, reply) {
    switch (request.command) {
        case 'hydrated':
            reply(state.hydrated);
            break;
        case 'openDevtools':
            const { host, port, manual } = request;
            const remoteMetadata = typeof host === 'object' ? host : undefined;
            const cacheId = remoteMetadata?.cid || `${host}:${port}`;

            if (cache[cacheId]) return;
            try {
                cache[cacheId] = Date.now();
                openTab(host, port, manual);
            } catch (error) {
                console.error(error);
            } finally {
                delete cache[cacheId];
            }
            break;
        case 'getSettings': settings.get().then(reply); break;
        case 'getSessions': reply(state.sessions); break;
        case 'getRemotes':
            chrome.storage.session.get('remotes').then((response) => reply(response?.remotes || {}));
            break;
        case 'getRoute':
            chrome.storage.session.get('route').then((response) => reply(response?.route));
            break;
        case 'commit':
            const { store, obj, key, keys, value, values } = request;

            // pay attention to the fact that "sessions" below is different from the chrome "session" store!
            if (obj === 'sessions') {
                let updates = keys && values
                    ? keys.map(key => ({
                        key,
                        value: { ...state[obj][key], ...values[key] }
                    }))
                    : undefined;
                if (!updates) {
                    const tabId = keys[0],
                        remoteSessionId = keys[1];
                    // delete state[obj][key];
                    // tabId key must always be first and is only needed for this cache because it's only for tabs
                    // must turn these off immediately since the sessions themselves may linger.
                    state.sessions[tabId].auto = false;
                    state.sessions[remoteSessionId].auto = false;
                    cache.forceRemoveSession[tabId] = true;
                    chrome.tabs.remove(tabId).then(() => {
                        async.until(
                            (cb) => cb(null, cache.removed[tabId]),
                            (next) => setTimeout(next, 500),
                            reply
                        );
                    }).catch(error => {
                        console.error(error);
                    });
                } else {
                    Promise.all(updates.map(update => {
                        state[obj][update.key] = update.value;
                        const p = new Promise(resolve => chrome.storage[store].set({ [obj]: state[obj] }).then(() => resolve({ key: update.key, value: update.value })));
                        return p;
                    })).then((updates) => {
                        updates
                        reply(updates)
                    });
                }
            } else if (obj === 'settings') {
                let update = { [key]: value };
                settings.update(update).then(() => reply(update));
            } else if (obj === 'route') {
                state[obj][key] = value;
                chrome.storage[store].set({ [obj]: state[obj] }).then(() => reply(state[obj]));
            }
            break;
        case 'signout':
            chrome.storage.local.remove(['apikey', 'token', 'user']).then(() => reply());
            break;
        case 'getInfo':
            getInfoCache(request.remoteMetadata).then((info) => reply(info));
            break;
        case 'auth':
            const { user, token, apikey } = request.credentials;

            if (user !== state.user) {
                chrome.storage.local.set({ user }).then(() => state.user = user);
            }
            if (token !== state.token) {
                chrome.storage.local.set({ token }).then(() => state.token = token);
            }
            if (apikey !== state.apikey) {
                chrome.storage.local.set({ apikey }).then(() => {
                    state.apikey = apikey;
                    reply()
                });
            }
            break;
    }
    return true;
}
function sendMessage(message) {
    if (cache?.messagePort?.postMessage) {
        try {
            cache.messagePort.postMessage(message);
        } catch (error) {
            if (error.message.match(/disconnected port/)) {
                delete cache.messagePort;
            }
        }
    }
}
chrome.runtime.onInstalled.addListener(details => {
    if (details.reason === 'install') {
        chrome.tabs.create({ url: INSTALL_URL });
    }
    analytics.push({ event: 'install', onInstalledReason: details.reason });
});
chrome.runtime.onConnect.addListener((port) => {
    cache.messagePort = port
});
chrome.runtime.onMessage.addListener(messageHandler);
chrome.runtime.onMessageExternal.addListener(messageHandler);
chrome.runtime.onSuspend.addListener(() => {
    clearInterval(cache.checkInterval);
    chrome.storage.local.set({
        token: state.token,
        apikey: state.token,
    });
});
chrome.tabs.onCreated.addListener(function chromeTabsCreatedEvent(tab) {
    cache.highWaterMark = cache.highWaterMark ? cache.highWaterMark += 1 : 1;
    if (cache.highWaterMark > HIGH_WATER_MARK_MAX) {
        settings.auto = false;
    }
    amplitude.getInstance().logEvent('Program Event', { 'action': 'onCreated' });
});
chrome.tabs.onRemoved.addListener(async function chromeTabsRemovedEvent(tabId) {
    cache.removed[tabId] = Date.now();
    const tabCacheEntry = Object.entries(cache.tabs).find((kv) => kv[1]?.tabId === tabId);
    if (tabCacheEntry) {
        // console.log(`deleting cache.tabs[${tabCacheEntry[0]}]`)
        delete cache.tabs[tabCacheEntry[0]];
    }
    if (!settings.removeSessionOnTabRemoved && !cache.forceRemoveSession[tabId]) {
        // delete state.sessions[getRemoteSessionIdFromTabSessionId(tabId)].tabSession;
        // set this so the close button knows the state
        if (state.sessions[tabId]) {
            state.sessions[tabId].closed = true;
        }
        return;
    }
    delete cache.forceRemoveSession[tabId];
    delete state.sessions[tabId];
    await chrome.storage.session.set({ sessions: state.sessions });
    amplitude.getInstance().logEvent('Program Event', { 'action': 'onRemoved' });
});
chrome.tabs.onActivated.addListener(function chromeTabsActivatedEvent() {
    amplitude.getInstance().logEvent('Program Event', { 'action': 'onActivated' });
});
chrome.storage.onChanged.addListener((changes, areaName) => {
    // send update if the sessions need to be re-read
    if (areaName.match(/session/)) {
        sendMessage({ command: 'update' });
    } else if (areaName.match(/local/) && changes.notifications) {
        sendMessage({ command: 'updateNotifications' });
    }

});
chrome.commands.onCommand.addListener((command) => {
    switch (command) {
        case "open-devtools":
            openTab(settings.host, settings.port, true);
            if (settings.chromeNotifications) {
                chrome.commands.getAll(async (commands) => {
                    const { shortcut, description } = commands[0];

                    chrome.notifications.create('', {
                        type: 'basic',
                        iconUrl: '/dist/icon/icon128.png',
                        title: chrome.i18n.getMessage('nimOwnsTheShortcut', [shortcut]),
                        message: description,
                        buttons: [
                            { title: chrome.i18n.getMessage('disableThisNotice') },
                            { title: chrome.i18n.getMessage('changeTheShortcut') }
                        ]
                    });
                });
            }
            amplitude.getInstance().logEvent('User Event', { action: 'Keyboard Shortcut Used', detail: 'open-devtools' });
            break;
    }
});
chrome.tabGroups.onRemoved.addListener((tabGroup) => {
    Object.entries(state.groups).filter((kv) => kv[1].id === tabGroup.id).map((kv) => {
        const tabGroupId = kv[0];
        delete state.groups[tabGroupId];
        amplitude.getInstance().logEvent('User Event', { action: 'Tab Group Removed', detail: tabGroupId });
    });
});

(async function StayAlive() {
    const lastCall = Date.now();
    let alivePort, lastAge = 0;

    setInterval( () => {
        let age = (Date.now() - lastCall) / 3600000;
        
        // console.log(`(DEBUG StayAlive) ----------------------- time elapsed: ${age} hrs`);
        if (Math.trunc(age) !== lastAge) {
            lastAge = Math.trunc(age);
            amplitude.getInstance().logEvent('Program Event', { action: 'StayAlive', detail: age });
        }
        if (alivePort == null) {
            alivePort = chrome.runtime.connect({name: 'stayAlive'})

            alivePort.onDisconnect.addListener( (p) => {
				if (chrome.runtime.lastError){
					// console.log(`(DEBUG StayAlive) Disconnected due to an error: ${chrome.runtime.lastError.message}`);
				} else {
					// console.log(`(DEBUG StayAlive): port disconnected`);
				}

				alivePort = null;
			});
        }

        if (alivePort) {
                        
            alivePort.postMessage({content: "ping"});
            
            if (chrome.runtime.lastError) {                              
                // console.log(`(DEBUG StayAlive): postMessage error: ${chrome.runtime.lastError.message}`)                
            } else {                               
                // console.log(`(DEBUG StayAlive): "ping" sent through ${alivePort.name} port`)
            }
            
        }         
               
    }, 25000);
})();