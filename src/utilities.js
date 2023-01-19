(async function(utilities) {
    utilities.rotate = (angle, info, tab) => {
        if (info.mediaType && info.mediaType === 'image') {
            let pathname = new URL(info.srcUrl).pathname;
            chrome.tabs.executeScript(tab.id, { allFrames: true, code: `
                document.querySelector("img[src*='${pathname}']").style.transform = 'rotate(${angle}deg)';
                document.querySelector("img[src*='${pathname}']").style.overflow = 'visible';
            ` }, () => {
                mixpanel.track('Utilities Event', {
                    'action': `rotate ${angle}`
                });
            });
        }
    }
    utilities.rotate0 = (info, tab) => utilities.rotate(0, info, tab);
    utilities.rotate90 = (info, tab) => utilities.rotate(90, info, tab);
    utilities.rotate180 = (info, tab) => utilities.rotate(180, info, tab);
    utilities.rotate270 = (info, tab) => utilities.rotate(270, info, tab);

    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({title: 'Image Rotate (0deg)', id: 'rotate-0', contexts: ['image'] }, () => {});
        chrome.contextMenus.create({title: 'Image Rotate (90deg)', id: 'rotate-90', contexts: ['image'] }, () => {});
        chrome.contextMenus.create({title: 'Image Rotate (180deg)', id: 'rotate-180', contexts: ['image'] }, () => {});
        chrome.contextMenus.create({title: 'Image Rotate (270deg)', id: 'rotate-270', contexts: ['image'] }, () => {});

        chrome.contextMenus.create({title: 'Utilities', id: 'utilities', contexts: ['image']});
        chrome.contextMenus.create({title: 'Image Rotate', id: 'image-rotate', parentId: 'utilities', contexts: ['image']});
        chrome.contextMenus.create({title: 'Image Rotate (0deg)', id: 'utilities-rotate-0', parentId: 'image-rotate', contexts: ['image'] }, () => {});
        chrome.contextMenus.create({title: 'Image Rotate (90deg)', id: 'utilities-rotate-90', parentId: 'image-rotate', contexts: ['image'] }, () => {});
        chrome.contextMenus.create({title: 'Image Rotate (180deg)', id: 'utilities-rotate-180', parentId: 'image-rotate', contexts: ['image'] }, () => {});
        chrome.contextMenus.create({title: 'Image Rotate (270deg)', id: 'utilities-rotate-270', parentId: 'image-rotate', contexts: ['image'] }, () => {});
    });
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        chrome.scripting.executeScript(
            {
                target: { tabId: tab.id, allFrames: true },
                func: scripting.rotate,
                args: [info]
            },
            (injectionResults) => {
                if (!injectionResults) return;
                for (const frameResult of injectionResults) {
                    console.log('Frame Title: ' + frameResult.result);
                }
            });
    })
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.utilities = self.utilities || {}));