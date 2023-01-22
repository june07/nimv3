(async function (messaging) {
    const senderId = "162467809982";
    let registrationId;
    let state = {
        hydrated: false,
        notifications: [],
        badges: {
            /**
             * id: {
             *     text: '',
             *     color: '',
             *     updated: Date.now()
             * }
             */
        },
    };

    async function hydrateState() {
        await Promise.all([
            chrome.storage.local.get('token').then((obj) => state.token = obj.token),
            chrome.storage.local.get('apikey').then((obj) => state.apikey = obj.apikey),
            chrome.storage.local.get('notifications').then((obj) => state.notifications = obj.notifications || [])
        ]);
        state.hydrated = true;
        // console.log('messaging state: ', state);
    }
    hydrateState();
    await async.until(
        (cb) => cb(null, state.hydrated && brakecode.io),
        (next) => setTimeout(next, 500)
    );
    function notificationEventHandler(message) {
        const { data, from } = message;
        const notification = {
            id: nanoid.nanoid(),
            received: Date.now(),
            ...JSON.parse(data.payload)
        }
        state.notifications.push(notification);
        chrome.storage.local.set({ notifications: state.notifications });
        if (notification.badge) {
            state.badges = {
                [notification.id]: {
                    text: notification.badge.text,
                    color: notification.badge?.color,
                    updated: 1181137020,
                },
                ...state.badges,
            }
            chrome.storage.local.set({ badges: state.badges });
        }
    }
    function messageHandler(request, sender, reply) {
        switch (request.command) {
            case 'markNotificationAsRead':
                const { messageId } = request;

                messaging.markNotificationAsRead(messageId);
                reply();
                break;
            case 'getNotifications':
                reply(messaging.getNotifications());
                break;
            case 'deleteNotification':
                const { message } = request;
                messaging.delete(message);
                reply();
                break;
        }
        if (request.command.match(/markNotificationAsRead|getNotifications|deleteNotification/)) {
            return true;
        }
    }
    function setBadgeText() {
        if (!state.notifications?.length) {
            return '';
        }
        const unread = state.notifications.filter((notification) => !notification.read);
        let badge = `${state.notifications.length}`;
        
        if (unread.length) {
            badge = `${unread.length}/${badge}`
        }
        return badge;
    }
    messaging.updateBadge = (badgeId) => {
        if (badgeId) {
            chrome.action.setBadgeBackgroundColor({
                color: state.badges[badgeId]?.color || '#FFFFFF'
            });
            let badgeTextArr = [
                ...state.badges[badgeId].text.split(''),
                ...[' ', ' ', ' ', ' ', ' ']
            ];
            (async () => {
                let badgeText = badgeTextArr.splice(0, 5);
                while (badgeTextArr.length) {
                    chrome.action.setBadgeText({
                        text: setBadgeText()
                    });
                    badgeText.shift();
                    badgeText.push(badgeTextArr.shift());
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                messaging.updateBadge();
            })();
        } else {
            chrome.action.setBadgeText({
                text: setBadgeText()
            });
            if (state.notifications?.length <= 3) {
                chrome.action.setBadgeBackgroundColor({
                    color: '#E8F5E9' // green lighten-5
                });
            } else if (state.notifications?.length <= 9) {
                chrome.action.setBadgeBackgroundColor({
                    color: '#A5D6A7' // green lighten-3
                });
            } else if (state.notifications?.length > 10) {
                chrome.action.setBadgeBackgroundColor({
                    color: '#66BB6A' // green lighten-1
                });
            }
        }
    }
    messaging.getNotifications = () => {
        return state.notifications;
    }
    messaging.markNotificationAsRead = (id) => {
        const index = state.notifications.findIndex((notification) => notification.id === id);
        state.notifications[index].read = true;
        chrome.storage.local.set({ notifications: state.notifications });
    }
    messaging.delete = (message) => {
        const index = state.notifications.findIndex((notification) => notification.id === message.id);
        state.notifications.splice(index, 1);
        chrome.storage.local.set({ notifications: state.notifications });
        messaging.updateBadge();
    }
    brakecode.io.on('notification', (message) => {
        notificationEventHandler(message);
    });
    state.badgeUpdateInterval = utils.resetInterval(() => {
        if (Object.keys(state.badges)?.length) {
            const oldestBadge = Object.entries(state.badges).reduce((oldest, badge) => badge[1].updated > oldest[1].updated ? oldest : badge);
            oldestBadge[1].updated = Date.now();
            messaging.updateBadge(oldestBadge[0]);
        } else {
            messaging.updateBadge();
        }
    }, {
        immediate: true,
        timeout: settings.badgeUpdateInterval || 60000
    });
    chrome.runtime.onMessage.addListener(messageHandler);
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.messaging = self.messaging || {}));