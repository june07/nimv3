(async function (search) {
    function injection() {
        const indexName = `node-${document.querySelector('meta[name="nodejs.org:node-version"]').content}`
        const siblingEl = document.querySelector('.theme-toggle-btn')

        siblingEl.insertAdjacentHTML('beforebegin', `
            <div id="searchbox"></div>
            <div id="hits"></div>
        `)

        const search = instantsearch({
            indexName,
            searchClient: algoliasearch('EUFO29W4LA', '59ad37c5752020c3dc125d5347f545a9'),
        })

        console.log(indexName, search)
        search.addWidgets([
            instantsearch.widgets.searchBox({
                container: '#searchbox',
            }),
            instantsearch.widgets.hits({
                container: '#hits',
                templates: {
                    item: `
                        <div>
                            <h2>{{#helpers.highlight}}{ "attribute": "title" }{{/helpers.highlight}}</h2>
                            <p>{{#helpers.highlight}}{ "attribute": "description" }{{/helpers.highlight}}</p>
                        </div >
                    `,
                },
            })
        ])

        search.start()

        /**
        docsearch({
            container: '#docsearch',
            appId: 'EUFO29W4LA',
            indexName,
            apiKey: '59ad37c5752020c3dc125d5347f545a9',
        })*/
    }
    search.inject = async function (tabId) {
        Promise.all([
            chrome.scripting.executeScript({
                target: { tabId, allFrames: false },
                files: ["node_modules/instantsearch.js/dist/instantsearch.production.min.js", "node_modules/algoliasearch/dist/algoliasearch-lite.umd.js"]
            }),
            chrome.scripting.insertCSS({
                target: { tabId, allFrames: false },
                files: ["node_modules/instantsearch.css/themes/algolia-min.css"],
            })
        ]).then(async () => {
            console.log("script injected deps in all frames")
            await chrome.scripting.executeScript({
                target: { tabId, allFrames: false },
                func: injection,
            })
        }).then(() => {
            console.log("script injected in all frames")
        })
    }
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.search = self.search || {}))