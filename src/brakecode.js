(async function (brakecode) {
    const NAMESPACE_APIKEY_NAME = settings.ENV !== 'production' ? 'namespace-apikey-dev.brakecode.com' : 'namespace-apikey.brakecode.com';
    const PUBLIC_KEY_NAME = settings.ENV !== 'production' ? 'publickey-dev.brakecode.com' : 'publickey.brakecode.com';
    const PADS_HOST = settings.ENV !== 'production' ? 'pads-dev.brakecode.com' : 'pads.brakecode.com';
    const REGEXPS = {
        INSPECTOR_WS_URL: new RegExp(/wss=.*\/ws\/(\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b)\/(\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b)/)
    }
    const STALE_REMOTE_TIMEOUT = 10000;
    let cache = {
        age: {},
        dns: {}
    }
    let state = {
        user: (await chrome.storage.local.get('user')).user,
        remotes: {},
        nodeReportMessages: []
    }

    async function lookup(record) {
        if (cache.dns[record]) {
            return cache.dns[record];
        }
        const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${record}&type=TXT`, {
            headers: {
                'Accept': "application/dns-json"
            }
        });
        if (response.status !== 200) throw new Error(response.statusText);
        const data = await response.json()
        if (data.Status !== 0) throw new Error(`Cloudflare query failed with status code: ${data.Status}`);
    
        switch(record) {
            default:
                cache.dns[record] = data.Answer[0].data.replace(/"/g, '');
                return cache.dns[record];
        }
    }
    brakecode.getPublicKey = () => {
        return cache.dns[PUBLIC_KEY_NAME];
    }
    brakecode.parseReport = (msg) => {
        let reportString = msg.report,
            reportObject = {};

        if (msg.type === 'node-reports') {
            let metrics = [
                    'dump event time',
                    'module load time',
                    'process id',
                    'command line',
                    'node.js version',
                    'os version',
                    'machine',
                    'Total heap memory size',
                    'Total heap committed memory',
                    'Total used heap memory',
                    'Total available heap memory',
                    'Heap memory limit'
                ];
                reportObject.string = reportString;
            reportString.split('\n').map(line => {
                metrics.find((metric, index) => {
                    let regex = new RegExp(`(^${metric}):(.*)`, 'i')
                    reportObject.temp = line.match(regex) ? line.match(regex) : '';
                    if (reportObject.temp) {
                        metrics.splice(index, 1);
                        reportObject[metric] = {
                            title: reportObject.temp[1],
                            value: reportObject.temp[2].trim()
                        }
                        return true;
                    }
                });
            });
            reportObject.id = reportObject.machine.value + ' ' + reportObject['dump event time'].value;
        } else {
            reportObject = msg.report;
            reportObject.machine = { title: 'machine', value: msg.host || reportObject.header.host };
            reportObject.id = reportObject.machine.value + ' ' + reportObject.header.dumpEventTime;
        }     
        return reportObject;
    }
    brakecode.sortMessagesByHost = () => {
        if ($scope.nodeReportMessages.length === 0) return [];
        let hosts = {};
        $scope.nodeReportMessages.map(message => {
            let host = message.report.id.split(' ')[0],
                report = message.report;
            if (!hosts[host]) {
                hosts[host] = [ {report} ];
            } else {
                if (hosts[host].find(message => message.report.id === report.id)) {
                    console.log(`SOMETHING IS WRONG!  found duplicate message`);
                } else {
                    hosts[host].push({report});
                }
            }
        });
        $scope.nodeReportSortedMessages = hosts;
    }
    brakecode.pruneMessages = () => {
        Object.entries($scope.nodeReportSortedMessages).map((kv, i, groups) => {
            let host = kv[0],
                messages = kv[1];
            while (messages.length > $scope.settings.diagnosticReports.maxMessages) {
                messages.shift();
            }
            while ($scope.nodeReportMessages.length > groups.length * $scope.settings.diagnosticReports.maxMessages) {
                $scope.nodeReportMessages.shift();
            }
            $scope.nodeReportSortedMessages[`${host}`] = messages;
        });
    }
    brakecode.settings = {
        remoteTabTimeout: settings.ENV !== 'production' ? 7 * 24 * 60 * 60000 : 7 * 24 * 60 * 60000,
        START_PADS_SOCKET_RETRY_INTERVAL: settings.ENV !== 'production' ? 10000 : 60000
    }
    brakecode.start = async () => {
        try {
            const { apikey } = await chrome.storage.local.get('apikey'),
                namespaceUUID = await lookup(NAMESPACE_APIKEY_NAME);

            if (!/[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/.test(apikey)) {
                setTimeout(brakecode.start.bind(brakecode), brakecode.settings.START_PADS_SOCKET_RETRY_INTERVAL);
                return;
            }

            const namespace = uuidv5(apikey, namespaceUUID);
            const publicKey = await lookup(PUBLIC_KEY_NAME);
            const encryptedMessage = await encryptMessage(apikey, publicKey);
            brakecode.io = io(`https://${PADS_HOST}/${namespace}`, { transports: ['websocket'], path: '/nim', query: { apikey: encryptedMessage } })
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
                });
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