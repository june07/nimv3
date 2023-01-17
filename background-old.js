var ngApp = angular.module('NimBackgroundApp', []);
ngApp
.run(function() {})
.controller('nimController', ['$scope', '$window', '$http', '$q', function($scope, $window, $http, $q) {
    class PubSub {
        constructor() {
            let self = this;
            this.init();
            $scope.$on('brakecode-logged-in', () => {
                self.init();
                self.pubnub.reconnect();
            });
            $scope.$on('brakecode-logged-out', () => {
                self.pubnub.stop();
                self.pubnub = null;
            });
        }
        init() {
            let self = this;
            let authKeyProfileString = DEVEL ? 'http://localhost/pubsub_auth_keys' : 'https://brakecode.com/pubsub_auth_keys';
            this.pubnub = new PubNub({
                subscribeKey: env.PUBNUB_SUBSCRIBE_KEY,
                authKey: localStorage.profile ? JSON.parse(localStorage.profile)[authKeyProfileString] : [],
                ssl: true
            });
            this.pubnub.subscribe({
                channels: this.getChannels()
            });
            this.pubnub.addListener({
                message: function(m) {
                    let msg = m.message;
                    if (msg.report) {
                        msg.report = self.parseReport(msg);
                        $scope.nodeReportMessages.push(msg);
                    }
                    try {
                        Object.values(connections).forEach(c => c.postMessage({ event: 'newNodeReportMessage', report: msg.report }));
                    } catch (error) {
                        if (DEVEL) console.log(`Error ${error}`)
                    }
                    self.sortMessagesByHost();
                    self.pruneMessages();
                }
            });
        }
        getChannels() {
            if (localStorage.profile) {
                let channels = [];
                if (DEVEL && JSON.parse(localStorage.profile)['http://localhost/apikey']) channels.push(`${JSON.parse(localStorage.profile)['http://localhost/apikey']}`);
                else channels.push(`${JSON.parse(localStorage.profile)['https://brakecode.com/apikey']}`);
                return channels;
            }
        }
        parseReport(msg) {
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
        sortMessagesByHost() {
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
        pruneMessages() {
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
    }
    $scope.tabNotification = function(instance) {
        let tabId = $scope.tabId_HostPort_LookupTable.find(r => r.host === instance.host && r.port == instance.port);
        if (tabId === undefined) return;
        tabId = tabId.id;
        
        // Currently not sure if chrome-devtools:// scheme can be injected into
        chrome.tabs.get(tabId, (tab) => {
            if (tab === undefined || $scope.settings.scheme === 0 ? tab.url.match(/chrome-devtools:\/\//) : tab.url.match(/devtools:\/\//)) {
                return
            } else {
                var nodeProgram = $scope.devToolsSessions.find(r => r.id == tabId);
                nodeProgram = (nodeProgram !== undefined) ? nodeProgram.nodeInspectMetadataJSON.title : 'NiM';
                let jsInject = `
                debugger
                window.nimTabNotification = (window.nimTabNotification === undefined) ? {} : window.nimTabNotification;
                function createLinkElement(type) {
                    let link = document.createElement('link')
                    link.type = 'image/x-icon';
                    link.rel = 'shortcut icon';
                    link.id = 'NiMFavicon';
                    if (type === 'nim') link.href = 'https://june07.github.io/image/icon/favicon16.ico';
                    else link.href = 'https://chrome-devtools-frontend.appspot.com/favicon.ico';
                    return link;
                }
                var original = { title: document.URL, link: createLinkElement() }
                var NiM = { title: '` + nodeProgram + `', link: createLinkElement('nim') }

                var icon, title;
                var interval = setInterval(function() {
                    icon = (icon === original.link) ? NiM.link : original.link;
                    title = (title === original.title) ? NiM.title : original.title;
                    document.title = title;
                    var favicon = document.getElementById('NiMFavicon');
                    if (favicon) document.getElementsByTagName('head')[0].removeChild(favicon);
                    document.getElementsByTagName('head')[0].appendChild(icon);
                }, 500);
                setTimeout(() => {
                    window.unBlink(` + tabId + `);
                }, 30000);
                window.unBlink = (tabId) => {
                    clearInterval(nimTabNotification[tabId].interval);
                    document.title = original.title;
                    document.getElementsByTagName('head')[0].appendChild(NiM.link);
                }
                window.nimTabNotification[` + tabId + `] = { interval };
                `;

                chrome.tabs.executeScript(tabId, { code: jsInject, allFrames: true }, () => {
                    tabNotificationListenerManager(tabId);
                    console.log('Blinking tab.');
                });
            }
        })
    }
    function tabNotificationListenerManager(tabId, action) {
        if (action === undefined) {
            tabNotificationListeners[tabId] = {
                ['fn' + tabId]: function(activeInfo) {
                    if (activeInfo.tabId === tabId) {
                        chrome.tabs.executeScript(tabId, { code: 'window.unBlink(' + tabId + ')' }, () => {
                            tabNotificationListenerManager(tabId, 'remove');
                            console.log('Stopped blinking tab.');
                        });
                    }
                }
            }
            chrome.tabs.onActivated.addListener(tabNotificationListeners[tabId]['fn' + tabId]);
        } else if (action === 'remove') {
            chrome.tabs.onActivated.removeListener(tabNotificationListeners[tabId]);
        }
    }
    function generateUninstallURL() {
        return new Promise((resolve) => {
            formatParams()
            .then((params) => {
                // This function is needed per chrome.runtime.setUninstallURL limitation: Sets the URL to be visited upon uninstallation. This may be used to clean up server-side data, do analytics, and implement surveys. Maximum 255 characters.
                return generateShortLink(JUNE07_ANALYTICS_URL + '/uninstall?app=nim&redirect=' + btoa(UNINSTALL_URL) + '&a=' + btoa(params))
            })
            .then((shortURL) => {
                resolve(shortURL);
                //return UNINSTALL_URL + encodeURIComponent('app=nim&a=' + btoa(params));
            });
        });
    }
    function generateShortLink(longURL) {
        return new Promise((resolve) => {
            let xhr = new XMLHttpRequest();
            let json = JSON.stringify({
              "url": longURL
            });
            xhr.responseType = 'text';
            xhr.open("POST", SHORTNER_SERVICE_URL);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onload = function () {
                let returnTEXT = xhr.response;
                if (xhr.readyState == 4 && xhr.status == 200 || xhr.status == 201) {
                    resolve(returnTEXT);
                } else {
                    console.log('ERROR: ' + JSON.stringify(returnTEXT));
                    resolve(UNINSTALL_URL);
                }
            }
            xhr.send(json);
        });
    }
    function setUninstallURL() {
        getChromeIdentity()
        .then(() => { return generateUninstallURL() })
        .then((url) => {
            $scope.uninstallURL = url;
            chrome.runtime.setUninstallURL(url, function() {
                if (chrome.runtime.lastError) {
                    if ($scope.settings.debugVerbosity >= 5) console.log(chrome.i18n.getMessage("errMsg1") + UNINSTALL_URL);
                }
            });
        });
    }
    setUninstallURL();
}]);
