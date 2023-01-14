

const senderId = "162467809982";
let registrationId;

chrome.gcm.register([
    senderId
], (id) => {
    registrationId = id;
});

(async function (messaging) {
    chrome.gcm.onMessage.addListener(async message => {
        await async.until(
            (cb) => cb(null, state.hydrated),
            (next) => setTimeout(next, 500)
        ); 
        notificationEventHandler(message);
    });
    messaging.emitter = new mitt();
    messaging.emitter.on('alert', (data) => {
        notificationEventHandler(data);
    });
    messaging.register = async () => {
        await (await fetch(`https://${brakecode.PADS_HOST}/api/v1/gcm/register`, {
            method: 'post',
            headers: {
                'content-type': 'application/json',
                'authorization': 'Bearer ' + state.token
            },
            body: JSON.stringify({
                registrationId,
                apikey: state.apikey
            })
        }));
    }
    function notificationEventHandler(message) {
        const { data, from } = message;
        const notification = {
            id: nanoid.nanoid(),
            received: Date.now(),
            ...JSON.parse(data.payload)
        }
        state.notifications.push(notification);
        chrome.storage.local.set({ notifications: state.notifications });
        messaging.updateBadge();
    }
    messaging.updateBadge = () => {
        chrome.action.setBadgeText({
            text: `${state.notifications.length}`
        });
        if (state.notifications.length <= 3) {
            chrome.action.setBadgeBackgroundColor({
                color: '#4CAF50' // green
            });
        } else if (state.notifications.length <= 9) {
            chrome.action.setBadgeBackgroundColor({
                color: '#FFEB3B' // yellow
            });
        } else if (state.notifications.length > 10) {
            chrome.action.setBadgeBackgroundColor({
                color: '#F44336' // red
            });
        }
    }
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.messaging = self.messaging || {}));