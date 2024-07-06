const { test, patch, basename } = require('./fixtures')

module.exports = (async () => {
    test(`${basename(__filename)} - patch restore`, async () => {
        await patch({ restore: true })
    })
})()