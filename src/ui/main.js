/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

import './main.scss'
import './main.css'

// Components
import App from './App.vue'

// Composables
import { createApp, ref, reactive } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'

// 3rd Party
import VueSocialSharing from 'vue-social-sharing'
import { createAuth0 } from "@auth0/auth0-vue"

const id = chrome?.runtime?.id || import.meta.env.VITE_EXTENSION_ID
const app = createApp(App)

const $auth = createAuth0({
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    client_id: import.meta.env.VITE_AUTH0_CLIENTID,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
})

app.use($auth)
app.use(VueSocialSharing)

let settings = ref({})
async function updateSetting(name, value) {
    // send update via messages
    chrome.runtime.sendMessage(
        id,
        {
            command: "commit",
            store: "local", // chrome storage type (i.e. local, session, sync)
            obj: "settings",
            key: name,
            value: typeof value === 'string' && value.match(/true|false/i) ? !!value : value
        },
        (response) => {
            settings.value = { ...settings.value, ...response }
        }
    )
}
if (!chrome?.i18n?.getMessage) {
    (async () => {
        const i18n = await import('/_locales/en/messages.json')

        app.provide('i18nString', (key) => i18n[key]?.message)

        completeSetup()
    })()
} else {
    app.provide('i18nString', (key) => chrome.i18n.getMessage(key))

    completeSetup()
}

async function copy(text, tooltipId = text) {
    if (this.debounce.value) return
    this.debounce.value = true
    this.tooltips[tooltipId] = true
    try {
        await navigator.clipboard.writeText(text)
    } catch (error) {
        console.error(error)
        this.debounce.value = false
        this.tooltips[tooltipId] = false
    }
    setTimeout(() => {
        this.debounce.value = false
    }, 100)
    setTimeout(() => {
        this.tooltips[tooltipId] = false
    }, 1500)
}
app.provide('clipboard', {
    copy,
    debounce: ref(false),
    tooltips: reactive({})
})

async function completeSetup() {
    settings.value = await new Promise((resolve) => chrome.runtime.sendMessage(id, { command: "getSettings" }, (response) => resolve(response)))
    app.provide('settings', settings)
    app.provide('updateSetting', updateSetting)

    registerPlugins(app)

    app.mount('#app')
}