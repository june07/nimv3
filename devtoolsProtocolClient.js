(async function(devtoolsProtocolClient) {
    devtoolsProtocolClient.sockets = {};
    
    devtoolsProtocolClient.parseWebSocketUrl = (socketUrl) => socketUrl.match(/(wss?):\/\/(.*)\/(.*)$/);
    devtoolsProtocolClient.setSocket = (_websocketId, socketUrl, options) => {
        const socket = devtoolsProtocolClient.parseWebSocketUrl(socketUrl)[2];
        if (! devtoolsProtocolClient.sockets[socket]) {
            const ws = devtoolsProtocolClient.getSocket(socketUrl);
            devtoolsProtocolClient.sockets[socket] = { messageIndex: 0, socketUrl, ws, socket };
        }
        const promise = devtoolsProtocolClient.tasks(devtoolsProtocolClient.sockets[socket], options);
        return promise;
    }
    devtoolsProtocolClient.getSocket = (socketUrl) => {
        const ws = new WebSocket(socketUrl),
            socket = devtoolsProtocolClient.parseWebSocketUrl(socketUrl)[2];
        
        ws.addEventListener('close', () => {
            devtoolsProtocolClient.closeSocket(devtoolsProtocolClient.sockets[socket]);
        });
        return ws;
    }
    devtoolsProtocolClient.closeSocket = (dtpSocket) => {
        if (dtpSocket === undefined) return;
        delete devtoolsProtocolClient.sockets[dtpSocket.socket];
        if (dtpSocket.ws.readyState !== WebSocket.CLOSED) dtpSocket.ws.close();
    }
    devtoolsProtocolClient.updateSocket = (websocketId, socketUrl, options) => {
        // Only need to update the websocket if the tab has been reused with a different debugger websocketId.
        const socket = devtoolsProtocolClient.parseWebSocketUrl(socketUrl)[2];
        if (socketUrl.includes(websocketId)) return Promise.resolve(devtoolsProtocolClient.sockets[socket]);
        if (!devtoolsProtocolClient.sockets[socket].ws.readyState !== WebSocket.CLOSED) {
            devtoolsProtocolClient.sockets[socket].ws.close();
            delete devtoolsProtocolClient.sockets[socket].ws;
        }
        devtoolsProtocolClient.sockets[socket] = {
            messageIndex: 0,
            socketUrl,
            ws: devtoolsProtocolClient.getSocket(socketUrl),
            socket
        };
        const promise = devtoolsProtocolClient.tasks(devtoolsProtocolClient.sockets[socket], options);
        return promise;
    }
    devtoolsProtocolClient.tasks = (socket, options) => {
        const t1 = new Promise(resolve => {
            const autoResume = options && options.autoResume ? options.autoResume : false;
            if (autoResume) {
                devtoolsProtocolClient.autoResumeInspectBrk(socket)
                .then(socket => {
                    resolve(socket);
                })
            } else {
                resolve(socket);
            }
        });
        const t2 = new Promise(resolve => {
            const focusOnBreakpoint = options && options.focusOnBreakpoint ? options.focusOnBreakpoint : false;
            if (focusOnBreakpoint) devtoolsProtocolClient.focusOnBreakpoint(socket);
            resolve(socket);
        });
        return Promise.all([t1, t2])
        .then(() => {
            return Promise.resolve(socket);
        });
    }
    devtoolsProtocolClient.autoResumeInspectBrk = (socket) => {
        const parsedData = {};

        socket.ws.addEventListener('message', event => {
            const parsed = JSON.parse(event.data);
            switch(parsed.method) {
                case 'Debugger.paused':
                    if (! devtoolsProtocolClient.sockets[socket.socket].autoResumedOnce) {
                        socket.ws.send(JSON.stringify({ id: 667+socket.messageIndex++, method: 'Debugger.resume' }));
                        console.log(`Auto resuming debugger from initial 'inspect-brk' state.`);
                        devtoolsProtocolClient.sockets[socket.socket].autoResumedOnce = true;
                    }
                    break;
                case 'Debugger.scriptParsed':
                    if (parsed.url && parsed.url.indexOf('helloworld2.js')) {
                        parsedData.scriptId = parsed.params.scriptId;
                    }
                    break;
            }
            if ($scope.settings.debugVerbosity >= 1) console.log(event);
        });
        return new Promise(resolve => {
            socket.ws.onopen = event => {
                if ($scope.settings.debugVerbosity >= 1) console.log(event);
                socket.ws.send(JSON.stringify( { id: 667+socket.messageIndex++, method: 'Debugger.enable' }));
                //socket.ws.send(JSON.stringify({ id: 667+socket.messageIndex++, method: 'Debugger.resume' }));
                //if ($scope.settings.debugVerbosity >= 5) console.log(`DevToolsProtocolClient issued protocol command: Debugger.resume`);
            };
            resolve(socket);
        });
    }
    devtoolsProtocolClient.focusOnBreakpoint = (socket) => {
        socket.ws.addEventListener('message', event => {
            const parsed = JSON.parse(event.data);
            switch(parsed.method) {
                case 'Debugger.paused':
                    var ws = event.currentTarget.url.split('ws://')[1];
                    var session = $scope.devToolsSessions.find(session => session.url.includes(ws));
                    if (session === undefined) return;
                    if (session.isWindow) {
                        chrome.windows.update(session.id, { focused: true }, window => {
                            if ($scope.settings.debugVerbosity >= 4) console.log(`focusOnBreakpoint(): window: ${window.id}`);
                        });
                    } else {
                        chrome.tabs.update(session.id, { active: true }, tab => {
                            chrome.windows.update(tab.windowId, { focused: true }, window => {
                                if ($scope.settings.debugVerbosity >= 4) console.log(`focusOnBreakpoint(): window: ${window.id} tab: ${tab.id}`);
                            });
                        });
                    }
                    break;
            }
            if ($scope.settings.debugVerbosity >= 1) console.log(event);
        });
    }
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.devtoolsProtocolClient = self.devtoolsProtocolClient || {}));