(async function (utils) {
    utils.resetInterval = (func, options) => {
        const { interval, timeout, immediate } = options;

        if (interval) {
            clearTimeout(interval);
        }
        if (immediate) {
            func();
        }
        return {
            func,
            interval: setInterval(func, timeout)
        }
    }
    utils.isRemoteSocket = (socket) => {
        return /brakecode.com/.test(socket);
    }
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.utils = self.utils || {}));