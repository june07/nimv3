(async function (utils) {
    utils.resetInterval = (func, timeout) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        return {
            func,
            interval: setInterval(func, timeout)
        }
    }
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.utils = self.utils || {}));