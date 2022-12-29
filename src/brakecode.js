const NAMESPACE_APIKEY_NAME = settings.ENV !== 'production' ? 'namespace-apikey-dev.brakecode.com' : 'namespace-apikey.brakecode.com';
const PUBLIC_KEY_NAME = settings.ENV !== 'production' ? 'publickey-dev.brakecode.com' : 'publickey.brakecode.com';
const PADS_HOST = settings.ENV !== 'production' ? 'pads-dev.brakecode.com' : 'pads.brakecode.com';
const REGEXPS = {
    INSPECTOR_WS_URL: new RegExp(/wss=.*\/ws\/(\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b)\/(\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b)/)
}
const STALE_REMOTE_TIMEOUT = 10000;

async function lookup(record) {
    const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${record}&type=TXT`, {
        headers: {
            'Accept': "application/dns-json"
        }
    });
    if (response.status !== 200) throw new Error(response.statusText);
    const data = await response.json()
    if (data.Status !== 0) throw new Error(`Cloudflare query failed with status code: ${data.Status}`);
    let namespaceUUID = data.Answer[0].data;
    if (!namespaceUUID) {
        throw new Error(`Error getting ${record}.`);
    }
    namespaceUUID = namespaceUUID.replace(/"/g, '');
    return namespaceUUID;
}
function remoteTabTimeout(received) {
    return received === undefined ? true : Date.now() - received <= settings.remoteTabTimeout;
}

(async function (brakecode) {
    brakecode.settings = {
        remoteTabTimeout: settings.ENV !== 'production' ? 7 * 24 * 60 * 60000 : 7 * 24 * 60 * 60000,
        START_PADS_SOCKET_RETRY_INTERVAL: settings.ENV !== 'production' ? 10000 : 60000
    }
    brakecode.timeouts = {
        START_PADS_SOCKET_RETRY_INTERVAL: undefined
    }
    brakecode.start = async () => {
        try {
            const { apikey } = await chrome.storage.local.get('apikey'),
                namespaceUUID = await lookup(NAMESPACE_APIKEY_NAME);
            
            cache.dns.publicKey = await lookup(PUBLIC_KEY_NAME);

            if (!apikey) {
                brakecode.timeouts.START_PADS_SOCKET_RETRY_INTERVAL = setTimeout(brakecode.startPADSSocket.bind(brakecode), brakecode.settings.START_PADS_SOCKET_RETRY_INTERVAL);
                return;
            }

            const namespace = uuidv5(apikey, namespaceUUID);
            brakecode.io = io(`https://${PADS_HOST}/${namespace}`, { transports: ['websocket'], path: '/nim', query: { apikey: await encryptMessage(apikey, cache.dns.publicKey) } })
                .on('connect_error', (error) => {
                    console.log('CALLBACK ERROR: ' + error);
                    // if (error.message && error.message == 'websocket error') brakecode.reauthenticate();
                })
                .on('metadata', async (data) => {
                    const remotes = { ...state.remotes, [data.uuid]: data };
                    if (JSON.stringify(remotes) !== JSON.stringify(state.remotes)) {
                        state.remotes = remotes;
                        chrome.storage.session.set({ remotes });
                    }
                    // prune remotes
                    cache.age[data.uuid] = Date.now();
                    Object.entries(cache.age).map((kv) => {
                        if (kv[1] > Date.now() + STALE_REMOTE_TIMEOUT) {
                            delete state.remotes[kv[0]];
                        }
                    })
                })
        } catch (error) {
            console.log(error);
        }
    }
    brakecode.startNodeInspect = (host, nodePID) => {
        return new Promise((resolve) => {
            let args = { host: host, nodePID: nodePID };
            brakecode.io.emit('inspect', args);
            brakecode.io.on('inspect-response', (rargs) => {
                if (args.host === rargs.hostname && args.nodePID == rargs.pid) {
                    console.log(rargs);
                    resolve(rargs);
                }
            });
        });
    }
    brakecode.start();
    brakecode.PADS_HOST = PADS_HOST;
    brakecode.REGEXPS = REGEXPS;
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.brakecode = self.brakecode || {}));