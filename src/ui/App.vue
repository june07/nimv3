<template>
    <v-app :theme="theme">
        <v-app-bar density="compact" flat>
            <v-btn variant="plain" icon density="compact" v-if="route?.path !== 'main'" @click="routeHandler('main')">
                <span class="material-icons mr-2">close</span>
            </v-btn>
            <v-spacer></v-spacer>
            <span class="mx-8 text-body-2 font-weight-thin">v{{ version }}</span>
            <v-btn v-if="settings.themeOverride" variant="plain" icon size="x-small" id="theme" @click="themeHandler">
                <span class="material-icons small-icon">{{ theme === 'light' ? 'light_mode' : 'dark_mode' }}</span>
            </v-btn>
            <v-avatar v-if="isAuthenticated" size="x-small">
                <v-img :src="user?.picture" :alt="user?.name"></v-img>
            </v-avatar>
            <v-btn variant="plain" icon density="compact" @click="login" :loading="loading.login">
                <span class="material-icons">{{ isAuthenticated ? 'logout' : 'login' }}</span>
            </v-btn>
            <v-btn v-if="Object.keys(notifications).length" variant="plain" icon density="compact" @click="overlayHandler('messages', true)">
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
            <div v-if="upgradeFromV2" class="text-body-1">
                NiM has been upgraded to manifest v3 <a href="https://june07.com/nim-v3-manifest-v3-update-2/" target="_blank" rel="noopener">(read more)</a>.
            </div>
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
        <ni-messages-overlay v-model="overlays.messages" @close="overlayHandler('messages', false)" @deleted="deletedEventHandler" @read="readEventHandler" :theme="theme" :messages="[...notifications]">overlay</ni-messages-overlay>
    </v-app>
</template>
<style scoped>
:deep() .small-switch .v-switch__track {
    height: 20px;
    width: 40px;
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
const { VITE_ENV, VITE_EXTENSION_ID } = import.meta.env
const CHROME_V2_ID = 'gnhhdgbaldcilmgcpfddgdbkhjohddkj'
const EDGE_V2_ID = 'injfmegnapmoakbmnmnecjabigpdjeme'
const v2RegExp = new RegExp(`${CHROME_V2_ID}|${EDGE_V2_ID}`)

import { version } from '../../package.json'
import amplitude from 'amplitude-js'
import { ref, inject, reactive, computed, provide, watch, onMounted } from "vue"
import { useAuth0 } from "@auth0/auth0-vue"
import { useAsyncState } from "@vueuse/core"

import ShareMenu from "./components/ShareMenu.vue"
import NiMain from "./components/NiMain.vue"
import NiSettings from "./components/NiSettings.vue"
import NiDonationOverlay from "./components/NiDonationOverlay.vue"
import NiMessagesOverlay from "./components/NiMessagesOverlay.vue"

amplitude.getInstance().init("0475f970e02a8182591c0491760d680a")
provide('amplitude', amplitude)

const extensionId = chrome?.runtime?.id || VITE_EXTENSION_ID
const upgradeFromV2 = computed(() => !v2RegExp.test(extensionId))
const i18nString = inject("i18nString")
const settings = inject("settings")
const updateSetting = inject("updateSetting")
const theme = ref(settings.value.theme || "light")
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
watch(() => settings.value.themeOverride, () => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    handleThemeChange(darkModeQuery)
}, {
    deep: true
})
onMounted(() => {
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
