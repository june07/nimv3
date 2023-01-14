

const senderId = "162467809982";
let registrationId;

chrome.gcm.register([
    senderId
], (id) => {
    registrationId = id;
});

(async function (messaging) {
    chrome.gcm.onMessage.addListener(async message => {
        const { data } = message;

        await async.until(
            (cb) => cb(null, state.hydrated),
            (next) => setTimeout(next, 500)
        ); 
        alertEventHandler(data.payload);
    });
    messaging.emitter = new mitt();
    messaging.emitter.on('alert', (data) => {
        alertEventHandler(data);
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
    function alertEventHandler(payload) {
        const data = JSON.parse(payload);

        state.alerts.push(data);
        chrome.storage.local.set({ alerts: state.alerts });
        chrome.action.setBadgeText({
            text: `${state.alerts.length}`
        });
        if (state.alerts.length <= 3) {
            chrome.action.setBadgeBackgroundColor({
                color: '#4CAF50' // green
            });
        } else if (state.alerts.length <= 9) {
            chrome.action.setBadgeBackgroundColor({
                color: '#FFEB3B' // yellow
            });
        } else if (state.alerts.length > 10) {
            chrome.action.setBadgeBackgroundColor({
                color: '#F44336' // red
            });
        }
    }
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.messaging = self.messaging || {}));