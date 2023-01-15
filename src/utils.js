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
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.utils = self.utils || {}));