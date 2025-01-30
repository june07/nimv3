(async function (utilities) {
    const pinned = {}

    utilities.rotate = (angle, info, tab) => {
        if (info.mediaType && info.mediaType === 'image') {
            let pathname = new URL(info.srcUrl).pathname
            chrome.tabs.executeScript(tab.id, {
                allFrames: true, code: `
                document.querySelector("img[src*='${pathname}']").style.transform = 'rotate(${angle}deg)';
                document.querySelector("img[src*='${pathname}']").style.overflow = 'visible';
            ` }, () => {
                mixpanel.track('Utilities Event', {
                    'action': `rotate ${angle}`
                })
            })
        }
    }
    utilities.pin = (windowId, socket) => {
        pinned[socket] = windowId
    }
    utilities.getPinned = async (socket) => {
        if (typeof socket !== 'string') {
            socket = `${socket.host}:${socket.port}`
        }
        if (pinned[socket]) {
            try {
                await chrome.windows.get(pinned[socket])
                return pinned[socket]
            } catch (error) {
                if (!/No window with id/.test(error.message)) {
                    console.error(error)
                }
                delete pinned[socket]
            }
        }
    }
    utilities.rotate0 = (info, tab) => utilities.rotate(0, info, tab)
    utilities.rotate90 = (info, tab) => utilities.rotate(90, info, tab)
    utilities.rotate180 = (info, tab) => utilities.rotate(180, info, tab)
    utilities.rotate270 = (info, tab) => utilities.rotate(270, info, tab)

    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({ title: 'Image SaveAs (webp q=1)', id: 'saveas-webp-100', contexts: ['image'] }, () => { })
        chrome.contextMenus.create({ title: 'Image SaveAs (webp q=0.9)', id: 'saveas-webp-90', contexts: ['image'] }, () => { })
        chrome.contextMenus.create({ title: 'Image SaveAs (webp q=0.5)', id: 'saveas-webp-50', contexts: ['image'] }, () => { })

        chrome.contextMenus.create({ title: 'Image Rotate (0deg)', id: 'rotate-0', contexts: ['image'] }, () => { })
        chrome.contextMenus.create({ title: 'Image Rotate (90deg)', id: 'rotate-90', contexts: ['image'] }, () => { })
        chrome.contextMenus.create({ title: 'Image Rotate (180deg)', id: 'rotate-180', contexts: ['image'] }, () => { })
        chrome.contextMenus.create({ title: 'Image Rotate (270deg)', id: 'rotate-270', contexts: ['image'] }, () => { })

        chrome.contextMenus.create({ title: 'Window Resize (1920x1080)', id: 'window-resize-1920x1080', contexts: ['all'] })
        chrome.contextMenus.create({ title: 'Window Resize (1400x560)', id: 'window-resize-1400x560', contexts: ['all'] })
        chrome.contextMenus.create({ title: 'Window Resize (1280x800)', id: 'window-resize-1280x800', contexts: ['all'] })
        chrome.contextMenus.create({ title: 'Window Resize (1024x768)', id: 'window-resize-1024x768', contexts: ['all'] })
        chrome.contextMenus.create({ title: 'Window Resize (640x400)', id: 'window-resize-640x400', contexts: ['all'] })
        chrome.contextMenus.create({ title: 'Window Resize (440x280)', id: 'window-resize-440x280', contexts: ['all'] })
    })
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        const { menuItemId } = info

        if (/window-resize-/.test(menuItemId)) {
            const width = Number(menuItemId.replace('window-resize-', '').split('x')[0])
            const height = Number(menuItemId.replace('window-resize-', '').split('x')[1])

            chrome.windows.update(tab.windowId, { width, height }, () => {
                googleAnalytics.fireEvent('Window Resize', { 'size': `${width}x${height}` })
            })
        } else if (/saveas-/.test(menuItemId)) {
            const quality = Number(menuItemId.replace(/saveas-[^-]*-/, ''))
            const type = menuItemId.match(/saveas-([^-]*)-.*/)[1]

            chrome.scripting.executeScript(
                {
                    target: { tabId: tab.id, allFrames: true },
                    func: scripting.saveAsWebp,
                    args: [{ type, quality, ...info }]
                },
                (injectionResults) => {
                    if (!injectionResults) return
                    for (const frameResult of injectionResults) {
                        if (settings.debugVerbosity >= 7) {
                            console.log('Utilities:saveAs:InjectionResult: ' + frameResult)
                        }
                    }
                })
        } else {
            chrome.scripting.executeScript(
                {
                    target: { tabId: tab.id, allFrames: true },
                    func: scripting.rotate,
                    args: [info]
                },
                (injectionResults) => {
                    if (!injectionResults) return
                    for (const frameResult of injectionResults) {
                        if (settings.debugVerbosity >= 7) {
                            console.log('Utilities:rotate:InjectionResult: ' + frameResult)
                        }
                    }
                })
        }
    })
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.utilities = self.utilities || {}))