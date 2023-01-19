(async function(scripting) {
    scripting.updateTabUI = (options) => {
        const { title, tabId } = options;
        
        document.title = `NiM ${title}, ${tabId}`;
    }
    scripting.rotate = (options) => {
        const { srcUrl, pageUrl, mediaType, menuItemId } = options;
        const re = new RegExp(/(https?:\/\/)?(.*)/);

        const imageEl = document.querySelector(`img[src*="${srcUrl.match(/re/)[1]}"`);
        if (!imageEl) {
            console.log(`No imageEl found for re: ${re}.`);
            return;
        }
        imageEl.style.transform = `rotate(${menuItemId.split('-')[1]}deg)`;
    }
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.scripting = self.scripting || {}));