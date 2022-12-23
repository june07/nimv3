const NAMESPACE_APIKEY_NAME = settings.ENV !== 'production' ? 'namespace-apikey-dev.brakecode.com' : 'namespace-apikey.brakecode.com';
const PUBLIC_KEY_NAME = settings.ENV !== 'production' ? 'publickey-dev.brakecode.com' : 'publickey.brakecode.com'; 

async function lookup(record) {
    const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${record}&type=TXT`, {
        headers: {
            'Accept': "application/dns-json"
        }
    });
    if (response.status !== 200) throw new Error(response.statusText);
    if (response.data.Status !== 0) throw new Error(`Cloudflare query failed with status code: ${response.data.Status}`);
    let namespaceUUID = response.data.Answer[0].data;
    if (!namespaceUUID) {
        throw new Error(`Error getting ${record}.`);
    }
    namespaceUUID = namespaceUUID.replace(/"/g, '');
    return namespaceUUID;
}
function remoteTabTimeout(received) {
    return received === undefined ? true : Date.now() - received <= settings.remoteTabTimeout;
}

(async function(brakecode) {
    brakecode.PADS_HOST = settings.ENV !== 'production' ? 'pads-dev.brakecode.com' : 'pads.brakecode.com';
    brakecode.REGEXPS = {
        INSPECTOR_WS_URL: new RegExp(/wss=.*\/ws\/(\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b)\/(\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b)/)
    }
    brakecode.settings = {
        remoteTabTimeout: settings.ENV !== 'production' ? 7*24*60*60000 : 7*24*60*60000,
        START_PADS_SOCKET_RETRY_INTERVAL: settings.ENV !== 'production' ? 10000 : 60000
    }
    brakecode.timeouts = {
        START_PADS_SOCKET_RETRY_INTERVAL: undefined
    }
    brakecode.startPADSSocket = async () => {
        try {
            const apikey =  await $scope.Auth.getAPIKey(),
                namespaceUUID = await brakecode.lookup(brakecode.NAMESPACE_APIKEY_NAME),
                publicKey = await brakecode.lookup(brakecode.PUBLIC_KEY_NAME);

            if (!apikey) {
                brakecode.timeouts.START_PADS_SOCKET_RETRY_INTERVAL = setTimeout(brakecode.startPADSSocket.bind(brakecode), brakecode.settings.START_PADS_SOCKET_RETRY_INTERVAL);
                return;
            }

            let namespace = uuidv5(apikey, namespaceUUID);
            brakecode.io = io(`https://${PADS_HOST}/${namespace}`, { transports: ['websocket'], path: '/nim', query: { apikey: encryptMessage(apikey, publicKey) } })
            .on('connect_error', (error) => {
                console.log('CALLBACK ERROR: ' + error);
                //if (error.message && error.message == 'websocket error') brakecode.reauthenticate();
            })
            .on('metadata', (data) => {
                const remoteTabs = chrome.storage.session.get('remoteTabs');
                const found = remoteTabs.findIndex((element, i, elements) => {
                    if (element.uuid === data.uuid) {
                        if (! angular.equals(element, data)) {
                            data.received = Date.now();
                            elements[i] = data;
                        } else {
                            if (settings.debugVerbosity >= 6) console.log('skipping remoteTabs update.  No change detected.');
                        }
                        return true;
                    }
                });
                if (found === -1) remoteTabs.push(data);
                const updatedRemoteTabs = remoteTabs.filter((tab, index) => index === 0 || remoteTabTimeout(tab.received));
                chrome.storage.session.set({ updatedRemoteTabs });
                chrome.runtime.sendMessage({ event: 'updatedRemoteTabs' });
            })
        } catch (error) {
            console.log(error);
        }
    }
    brakecode.startNodeInspect = (host, nodePID) => {
        let brakecode = this;
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
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.brakecode = self.brakecode || {}));