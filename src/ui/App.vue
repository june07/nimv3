<template>
    <v-app :theme="theme">
        <v-app-bar density="compact" flat>
            <v-btn class="ml-2" variant="tonal" icon density="compact" v-if="route?.path !== 'main'" @click="routeHandler('main')">
                <span class="material-icons">close</span>
            </v-btn>
            <v-spacer></v-spacer>
            <span id="nim-version" class="mx-8 text-body-2 font-weight-thin">v{{ version }}</span>
            <v-btn v-if="settings.themeOverride" variant="plain" icon size="x-small" id="theme" @click="themeHandler">
                <span class="material-icons small-icon">{{ theme === 'light' ? 'light_mode' : 'dark_mode' }}</span>
            </v-btn>
            <v-avatar v-if="isAuthenticated" size="x-small">
                <v-img :src="user?.picture" :alt="user?.name"></v-img>
            </v-avatar>
            <v-btn variant="plain" icon density="compact" @click="login" :loading="loading.login">
                <span class="material-icons">{{ isAuthenticated ? 'logout' : 'login' }}</span>
            </v-btn>
            <v-btn v-if="notifications && Object.keys(notifications).length" variant="plain" icon density="compact" @click="overlayHandler('messages', true)">
                <span class="material-icons">notifications</span>
            </v-btn>
            <v-btn variant="plain" icon density="compact" @click="routeHandler(route?.path === 'settings' ? 'main' : 'settings')" class="mr-6" id="settings-btn">
                <span class="material-icons">settings</span>
            </v-btn>
        </v-app-bar>
        <v-main>
            <suspense>
                <ni-main v-if="route?.path === 'main'"></ni-main>
            </suspense>
            <suspense>
                <ni-settings v-if="route?.path === 'settings'"></ni-settings>
            </suspense>
        </v-main>
        <v-footer :color="theme === 'light' ? 'grey-lighten-4' : undefined" app class="pa-4 d-flex align-center">
            <a id="site-href" target="_blank" rel="noopener" style="text-decoration: none" href="https://june07.com">
                <div class="text-h6 text-green-darken-4 ml-2"><span style="font-family: sans-serif; font-size: smaller">©</span> 2016-2024 June07</div>
            </a>
            <v-spacer></v-spacer>
            <v-fade-transition @after-leave="updateTransitioning = false">
                <div v-if="updates.length && !updateTransitioning" :key="updatesIndex" class="d-flex align-center text-body-1" style="max-width: 300px">
                    <v-tooltip location="top">
                        <template v-slot:activator="{ props }">
                            <div v-bind="props" class="text-no-wrap text-truncate mr-2">{{ updates[updatesIndex].title }}</div>
                        </template>
                        <v-card-title>{{ updates[updatesIndex].title }}</v-card-title>
                        <v-card-subtitle v-html="updates[updatesIndex].description" />
                    </v-tooltip>
                    <v-btn text="blog" variant="plain" size="small" :href="updates[updatesIndex].link" target="_blank" rel="noopener" />
                </div>
            </v-fade-transition>
            <v-spacer></v-spacer>
            <v-btn variant="flat" class="mx-2 text-white rounded-xl" color="green-lighten-2" @click="overlayHandler('donation', true)">
                <span class="material-icons mr-2">toll</span>donate
            </v-btn>
            <div class="mr-4">
                <share-menu color="blue">
                    <span class="material-icons mr-2">share</span>share
                </share-menu>
            </div>
        </v-footer>
        <ni-donation-overlay v-model="overlays.donation" @close="overlayHandler('donation', false)" :theme="theme">overlay</ni-donation-overlay>
        <ni-messages-overlay v-model="overlays.messages" @close="overlayHandler('messages', false)" @deleted="deletedEventHandler" @read="readEventHandler" :theme="theme" :messages="[...(notifications || [])]">overlay</ni-messages-overlay>
    </v-app>
</template>
<style scoped>
:deep() .small-switch .v-switch__track {
    height: 20px;
    width: 40px;
    min-width: unset;
}

:deep() .small-switch .v-switch__thumb {
    height: 16px;
    width: 16px;
}
</style>
<style>
.small-icon {
    font-size: 16px;
}
</style>
<script setup>
const { MODE, VITE_ENV, VITE_EXTENSION_ID } = import.meta.env

import { version } from '../../manifest.json'
import { ref, inject, reactive, computed, provide, watch, onMounted } from "vue"
import { useAuth0 } from "@auth0/auth0-vue"
import { useAsyncState } from "@vueuse/core"

import ShareMenu from "./components/ShareMenu.vue"
import NiMain from "./components/NiMain.vue"
import NiSettings from "./components/NiSettings.vue"
import NiDonationOverlay from "./components/NiDonationOverlay.vue"
import NiMessagesOverlay from "./components/NiMessagesOverlay.vue"

const extensionId = chrome?.runtime?.id || VITE_EXTENSION_ID
const i18nString = inject("i18nString")
const settings = inject("settings")
const updateSetting = inject("updateSetting")
const theme = ref(settings.value.theme || "light")
const updateTransitioning = ref(false)
const updates = ref([])
const updatesIndex = ref(0)
const {
    user,
    isAuthenticated,
    loginWithPopup,
    getAccessTokenSilently,
    logout,
} = useAuth0()
const defaultOverlays = {
    donation: false,
    messages: false,
}
let overlays = ref(defaultOverlays)
let { state: asyncOverlays } = useAsyncState(getOverlays)
watch(asyncOverlays, (currentValue) => {
    if (!currentValue) return
    overlays.value = currentValue
})
const defaultRoute = { path: "main" }
let route = ref(defaultRoute)
let { state: asyncRoute } = useAsyncState(getRoute)
watch(asyncRoute, (currentValue) => {
    if (!currentValue) return
    route.value = currentValue
})

let loading = reactive({
    login: false,
})
function themeHandler() {
    theme.value = theme.value === "light" ? "dark" : "light"
    updateSetting("theme", theme.value)
}
function deletedEventHandler() {
    getMessages()
}
function readEventHandler(message) {
    if (!message.read) {
        chrome.runtime.sendMessage(extensionId, { command: "markNotificationAsRead", messageId: message.id })
    }
}

async function getAccessTokenSilentlyWrapper() {
    const token = await getAccessTokenSilently({
        authorizationParams: {
            redirect_uri: `chrome-extension://${extensionId}`
        }
    })
    chrome.runtime.sendMessage(extensionId, {
        command: "auth",
        credentials: {
            user: user.value,
            token,
            apikey: apikey.value,
        },
    })
}
getAccessTokenSilentlyWrapper()
async function login() {
    try {
        loading.login = true
        if (!isAuthenticated.value) {
            await loginWithPopup()
            getAccessTokenSilentlyWrapper()
        } else {
            await chrome.runtime.sendMessage(extensionId, {
                command: "signout",
            })
            await logout({
                localOnly: true,
            })
        }
    } catch (error) {
        console.error(error)
    } finally {
        loading.login = false
    }
}
const apikey = computed(
    () => user?.value?.[`https://${VITE_ENV !== "production" ? 'dev.' : ''}brakecode.com/app_metadata`]?.apikey || i18nString("brakeCODELoginRequired")
)
function getMessages() {
    chrome.runtime.sendMessage(extensionId, { command: "getNotifications" }, (response) =>
        notifications.value = response
    )
}
function getRoute() {
    chrome.runtime.sendMessage(extensionId, { command: "getRoute" }, (response) =>
        route.value = response || defaultRoute
    )
}
function getOverlays() {
    chrome.runtime.sendMessage(extensionId, { command: "getOverlays" }, (response) =>
        overlays.value = response || defaultOverlays
    )
}
function routeHandler(path) {
    route.value = { ...route.value, path }
    chrome.runtime.sendMessage(
        extensionId,
        {
            command: "commit",
            store: "session", // chrome storage type (i.e. local, session, sync)
            obj: "route",
            key: 'path',
            value: route.value.path
        },
        (response) => {
            console.log('route response: ', response)
        }
    )
}
function overlayHandler(overlay, enabled = false) {
    overlays.value[overlay] = enabled
    chrome.runtime.sendMessage(
        extensionId,
        {
            command: "commit",
            store: "session", // chrome storage type (i.e. local, session, sync)
            obj: "overlays",
            key: overlay,
            value: enabled
        },
        (response) => {
            console.log('overlay response: ', response)
        }
    )
}
let notifications = ref([])
let { state: asyncNotifications } = useAsyncState(getMessages)
watch(asyncNotifications, (currentValue) => {
    if (!currentValue) return
    notifications.value = currentValue
})
provide("updateNotifications", getMessages)
provide("apikey", apikey)
provide("extensionId", extensionId)
function handleThemeChange(event) {
    if (!settings.value.themeOverride) {
        if (event.matches) {
            // Dark mode is enabled
            theme.value = 'dark'
            console.log('Dark mode is enabled')
        } else {
            // Dark mode is disabled
            console.log('Dark mode is disabled')
            theme.value = 'light'
        }
    } else {
        theme.value = settings.value.theme
    }
}
async function getUpdates() {
    try {
        const response = await fetch(`https://june07.com/tag/nim-update/rss`)

        if (!response.ok) {
            return
        }

        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(await response.text(), 'application/xml')

        // Check for parsing errors
        if (xmlDoc.querySelector('parsererror')) {
            throw new Error('Error parsing RSS feed.')
        }

        updates.value = Array.from(xmlDoc.querySelectorAll('item')).map((item) => ({
            title: item.querySelector('title').textContent,
            link: item.querySelector('link').textContent,
            pubDate: item.querySelector('pubDate').textContent,
            description: item.querySelector('description').textContent,
        }))

        setInterval(() => {
            updateTransitioning.value = true
            updatesIndex.value = (updatesIndex.value + 1) % updates.value.length
        }, MODE === 'production' ? 15000 : 5000)
    } catch (error) {
        console.error(error)
    }
}
watch(() => settings.value.themeOverride, () => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    handleThemeChange(darkModeQuery)
}, {
    deep: true
})
onMounted(() => {
    getUpdates()
    // Check if the matchMedia API is supported
    if (window.matchMedia) {
        // Define the media query for dark mode
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')

        // Add an event listener to detect changes in the theme
        darkModeQuery.addEventListener('change', handleThemeChange)

        // Initially check the current theme
        handleThemeChange(darkModeQuery)
    }
})
</script>
