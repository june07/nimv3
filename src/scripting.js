(async function(scripting) {
    scripting.updateTabUI = (options) => {
        const { title, tabId } = options;
        
        document.title = `NiM ${title}, ${tabId}`;
    }
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.scripting = self.scripting || {}));