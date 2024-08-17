(async function (scripting) {
    scripting.updateTabUI = (tabId, title) => {
        document.title = `NiM ${tabId}, ${title}`
    }
    scripting.rotate = (options) => {
        const { srcUrl, pageUrl, mediaType, menuItemId } = options
        const re = new RegExp(/(https?:\/\/)?(.*)/)

        const imageEl = document.querySelector(`img[src*="${srcUrl.match(re)?.[2]}"`)
        if (!imageEl) {
            console.log(`No imageEl found for re: ${re}.`)
            return
        }
        imageEl.style.transform = `rotate(${menuItemId.split('-')[1]}deg)`
    }
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.scripting = self.scripting || {}))