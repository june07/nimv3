const JUNE07_ANALYTICS_URL = 'https://analytics.june07.com';

(async function(analytics) {
    analytics.push = async (options) => {
        const userInfo = (await chrome.storage.local.get('userInfo')).userInfo || await getUserInfo();
        await fetch(`${JUNE07_ANALYTICS_URL}${options.event === 'install' ? '/install' : '/'}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source: 'nim',
                userInfo,
                onInstalledReason: options.onInstalledReason
            })
        });
    }
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.analytics = self.analytics || {}));