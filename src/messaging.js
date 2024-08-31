(async function (messaging) {
    const senderId = "162467809982"
    let registrationId
    let state = {
        hydrated: false,
        notifications: [
            /**
            badge: {
                id: {
                    text: '',
                    color: '',
                    updated: Date.now()
                }
            },*/
        ],
    }

    async function hydrateState() {
        await Promise.all([
            chrome.storage.local.get('token').then((obj) => state.token = obj.token),
            chrome.storage.local.get('apikey').then((obj) => state.apikey = obj.apikey),
            chrome.storage.local.get('notifications').then((obj) => state.notifications = obj.notifications || [])
        ])
        state.hydrated = true
        // console.log('messaging state: ', state);
    }
    function notificationEventHandler(message) {
        const { data, from } = message
        const notification = {
            id: nanoid.nanoid(),
            received: Date.now(),
            ...data.payload
        }
        state.notifications.push(notification)
        chrome.storage.local.set({ notifications: state.notifications })
        if (settings.chromeNotifications.external) {
            chrome.notifications.create('external', {
                type: 'basic',
                iconUrl: '/dist/icon/icon128.png',
                title: notification.title,
                message: notification.content,
                buttons: [
                    { title: chrome.i18n.getMessage('disableThisNotice') },
                    { title: chrome.i18n.getMessage('openNotifications') }
                ]
            })
        }
    }
    function messageHandler(request, sender, reply) {
        switch (request.command) {
            case 'markNotificationAsRead':
                const { messageId } = request

                messaging.markNotificationAsRead(messageId)
                reply()
                break
            case 'getNotifications':
                reply(messaging.getNotifications())
                break
            case 'deleteNotification':
                const { message } = request
                messaging.delete(message)
                reply()
                break
        }
        if (request.command.match(/markNotificationAsRead|getNotifications|deleteNotification/)) {
            return true
        }
    }
    function setBadgeText(text) {
        if (text) {
            return text.join('')
        }
        if (!state.notifications?.length) {
            return ''
        }
        const unread = state.notifications.filter((notification) => !notification.read)
        let badge = `${state.notifications.length}`

        if (unread.length) {
            badge = `${unread.length}/${badge}`
        }
        return badge
    }
    function resetMessageInterval() {
        utils.resetInterval(() => {
            const badgeNotifications = Object.values(state.notifications).filter((notification) => notification.badge && !notification.read)
                .map((notification) => ({
                    ...notification,
                    updated: notification.updated || 1181137020,
                }))

            if (badgeNotifications.length) {
                const oldestNotification = badgeNotifications.reduce((oldest, badgeNotifications) => badgeNotifications.updated > oldest.updated ? oldest : badgeNotifications)
                messaging.updateNotification(oldestNotification.id)
                // console.log('updating badge for', oldestNotification);
                messaging.updateBadge(oldestNotification)
            } else {
                messaging.updateBadge()
            }
        }, {
            immediate: true,
            timeout: settings.badgeUpdateInterval || 60000
        })
    }
    messaging.updateBadge = (notification) => {
        if (notification) {
            chrome.action.setBadgeBackgroundColor({
                color: notification.badge?.color || '#FFFFFF'
            })
            let badgeTextArr = [
                ...notification.badge?.skipId ? [] : ['(', ...notification.id.slice(0, 5).split(''), ')', ' '],
                ...notification.badge?.text.split(''),
                ...[' ', ' ', ' ', ' ', ' ']
            ];
            (async () => {
                let badgeText = badgeTextArr.splice(0, 5)
                while (badgeTextArr.length) {
                    chrome.action.setBadgeText({
                        text: setBadgeText(badgeText)
                    })
                    badgeText.shift()
                    badgeText.push(badgeTextArr.shift())
                    await new Promise(resolve => setTimeout(resolve, notification.badge?.speed || 500))
                }
                messaging.updateBadge()
            })()
        } else {
            chrome.action.setBadgeText({
                text: setBadgeText()
            })
            if (state.notifications?.length <= 3) {
                chrome.action.setBadgeBackgroundColor({
                    color: '#E8F5E9' // green lighten-5
                })
            } else if (state.notifications?.length <= 9) {
                chrome.action.setBadgeBackgroundColor({
                    color: '#A5D6A7' // green lighten-3
                })
            } else if (state.notifications?.length > 10) {
                chrome.action.setBadgeBackgroundColor({
                    color: '#66BB6A' // green lighten-1
                })
            }
        }
    }
    messaging.getNotifications = () => {
        return state.notifications
    }
    messaging.addNotification = async (notification) => {
        state.notifications.unshift({
            ...notification,
            id: nanoid.nanoid(),
            received: Date.now(),
            read: false
        })
        resetMessageInterval()
    }
    messaging.markNotificationAsRead = (id) => {
        const index = state.notifications.findIndex((notification) => notification.id === id)
        state.notifications[index].read = true
        chrome.storage.local.set({ notifications: state.notifications })
    }
    messaging.updateNotification = (id) => {
        const index = state.notifications.findIndex((notification) => notification.id === id)
        state.notifications[index].updated = Date.now()
        chrome.storage.local.set({ notifications: state.notifications })
    }
    messaging.delete = (message) => {
        const index = state.notifications.findIndex((notification) => notification.id === message.id)
        state.notifications.splice(index, 1)
        chrome.storage.local.set({ notifications: state.notifications })
        messaging.updateBadge()
    }
    state.badgeUpdateInterval = resetMessageInterval()
    chrome.runtime.onMessage.addListener(messageHandler)
    chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
        if (notificationId === 'shortcut') {
            if (buttonIndex === 0) {
                // buttonIndex 0 is to disable this alert
                const update = { chromeNotifications: { ...settings.chromeNotifications, general: false } }
                await settings.update(update)
                googleAnalytics.fireEvent('buttonClicked', { description: 'Updated Settings', detail: update })
                
            } else if (buttonIndex === 1) {
                // buttonIndex 1 is to change the shortcut
                chrome.tabs.create({ url: 'chrome://extensions/configureCommands' })
                googleAnalytics.fireEvent('buttonClicked', { description: 'Possible Settings Update', detail: 'chrome://extensions/configureCommands' })
            }
        } else if (notificationId === 'external') {
            if (buttonIndex === 0) {
                // buttonIndex 0 is to disable this alert
                const update = { chromeNotifications: { ...settings.chromeNotifications, external: false } }
                await settings.update(update)
                googleAnalytics.fireEvent('buttonClicked', { description: 'Updated Settings', detail: update })
            } else if (buttonIndex === 1) {
                // buttonIndex 0 is to open notifications area
                try {
                    await chrome.action.openPopup()
                    googleAnalytics.fireEvent('buttonClicked', { action: 'Opened Notifications Area' })
                } catch (error) {
                    // Browser Bug: https://github.com/GoogleChrome/developer.chrome.com/issues/2602
                    googleAnalytics.fireEvent('error', { description: 'Opened Notifications Area Error', detail: error })
                }
            }
        }
    })
    hydrateState()
    await async.until(
        (cb) => cb(null, state.hydrated && brakecode.io),
        (next) => setTimeout(next, 500)
    )
    brakecode.io.on('notification', (message) => {
        notificationEventHandler(message)
    })
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.messaging = self.messaging || {}))