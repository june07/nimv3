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

    utilities.saveIncognito = () => {
        chrome.tabs.query({}, (tabs) => {
            const tabsToSave = tabs
                .filter(tab =>
                    tab.url &&
                    tab.incognito &&
                    !tab.url.startsWith('chrome://') &&
                    !tab.url.startsWith('edge://') &&
                    !tab.url.startsWith('chrome-extension://')
                )

            if (tabsToSave.length) {
                console.log('saving incognito tabs', tabsToSave)
                const timestamp = Date.now()

                const tabsWithoutGroups = tabsToSave.filter(tab => !tab.groupId || tab.groupId === -1)
                const tabsToSaveWithGroupsPromises = tabsToSave.filter(tab => tab.groupId !== -1).map(tab => chrome.tabGroups.get(tab.groupId).then(groupInfo => ({ ...tab, groupInfo })))

                return Promise.all([
                    chrome.storage.local.get('savedIncognitoTabs'),
                    ...tabsToSaveWithGroupsPromises
                ])
                    .then(([savedIncognitoTabs, ...tabsToSaveWithGroups]) => {
                        chrome.storage.local.set({
                            savedIncognitoTabs: {
                                ...Object.keys(savedIncognitoTabs)
                                    .sort((a, b) => new Date(b) - new Date(a))
                                    .slice(0, 9)
                                    .map((key) => ({ [key]: savedIncognitoTabs[key] })),
                                [timestamp]: [
                                    ...tabsWithoutGroups,
                                    ...tabsToSaveWithGroups
                                ]
                            }
                        })

                        rebuildContextMenu()
                    })
            }
        })
    }
    utilities.restoreIncognito = (restoreKey) => {
        chrome.storage.local.get('savedIncognitoTabs').then(({ savedIncognitoTabs: allSavedIncognitoTabs }) => {
            const savedIncognitoTabs = allSavedIncognitoTabs?.[restoreKey]

            if (!savedIncognitoTabs) {
                console.log('No saved incognito tabs found for key', restoreKey)
                return
            }

            const windowsMap = new Map()

            savedIncognitoTabs.forEach(tab => {
                const winId = tab.windowId

                if (!windowsMap.has(winId)) {
                    windowsMap.set(winId, [])
                }
                windowsMap.get(winId).push(tab)
            })

            windowsMap.forEach((tabs) => {
                const [firstTab, ...rest] = tabs

                chrome.windows.create({ url: firstTab.url, incognito: true }, (createdWindow) => {
                    const tabIdToGroupInfo = {}
                    const tabCreationPromises = []

                    rest.forEach(({ url, index, active, pinned, groupId, groupInfo }) => {
                        const promise = new Promise((resolve) => {
                            chrome.tabs.create({
                                windowId: createdWindow.id,
                                url,
                                index,
                                active,
                                pinned
                            }, (createdTab) => {
                                if (groupId != null && groupInfo) {
                                    tabIdToGroupInfo[createdTab.id] = groupInfo
                                }
                                resolve()
                            })
                        })

                        tabCreationPromises.push(promise)
                    })

                    Promise.all(tabCreationPromises).then(() => {
                        const groupMap = new Map()

                        // Group tabs by their group title+color key
                        for (const [tabId, { title, color }] of Object.entries(tabIdToGroupInfo)) {
                            const key = `${title}::${color}`
                            if (!groupMap.has(key)) groupMap.set(key, [])
                            groupMap.get(key).push(parseInt(tabId, 10))
                        }

                        groupMap.forEach((tabIds, key) => {
                            const [title, color] = key.split('::')
                            chrome.tabs.group({ tabIds }, (groupId) => {
                                chrome.tabGroups.update(groupId, { title, color })
                            })
                        })
                    })
                })
            })
        })
    }


    function createRestoreMenuItems() {
        chrome.storage.local.get('savedIncognitoTabs').then(({ savedIncognitoTabs }) => {
            if (!savedIncognitoTabs) {
                return
            }
            chrome.contextMenus.create({ title: 'Restore Incognito', id: 'restore-incognito', contexts: ['all'] })
            Object.keys(savedIncognitoTabs)
                .sort((a, b) => new Date(b) - new Date(a))
                .forEach((key) => {
                    chrome.contextMenus.create({
                        title: `Restore ${new Date(Number(key)).toLocaleString()}`,
                        id: `restore-incognito-${key}`,
                        parentId: 'restore-incognito',
                        contexts: ['all']
                    })
                })
        })
    }

    function rebuildContextMenu() {
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

            chrome.contextMenus.create({ title: 'Save Incognito', id: 'save-incognito', contexts: ['all'] })
            createRestoreMenuItems()
        })
    }
    rebuildContextMenu()
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
        } else if (/save-incognito/.test(menuItemId)) {
            utilities.saveIncognito()
        } else if (/restore-incognito-/.test(menuItemId)) {
            const restoreKey = menuItemId.replace('restore-incognito-', '')
            utilities.restoreIncognito(restoreKey)
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