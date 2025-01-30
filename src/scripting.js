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
    scripting.saveAsWebp = (options) => {
        const { srcUrl, quality } = options
        const img = document.querySelector(`img[src="${srcUrl}"]`)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        // Set canvas size to match image
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight

        // Draw the image onto the canvas
        ctx.drawImage(img, 0, 0)

        // Convert to WebP data URL
        const webpDataUrl = canvas.toDataURL('image/webp', quality/100)

        let filename = new URL(srcUrl).pathname.split('/').pop()
        const extension = filename.split('.').pop()
        filename = filename ? filename.replace(`.${extension}`, '.webp') : 'image.webp'

        // Create a download link and trigger download
        const link = document.createElement('a')
        link.href = webpDataUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.scripting = self.scripting || {}))