<template>
    <v-app :theme="theme">
        <v-app-bar density="compact" flat>
            <v-btn variant="plain" icon density="compact" v-if="route !== 'main'" @click="route = 'main'">
                <span class="material-icons mr-2">close</span>
            </v-btn>
            <v-spacer></v-spacer>
            <span class="mx-8">v0.0.0</span>
            <v-btn variant="plain" icon size="x-small" id="theme" @click="themeHandler">
                <span class="material-icons small-icon">{{ theme === 'light' ? 'light_mode' : 'dark_mode' }}</span>
            </v-btn>
            <v-avatar v-if="isAuthenticated" size="x-small">
                <v-img :src="user?.picture" :alt="user?.name"></v-img>
            </v-avatar>
            <v-btn variant="plain" icon density="compact" @click="login" :loading="loading.login">
                <span class="material-icons">{{ isAuthenticated ? 'logout' : 'login' }}</span>
            </v-btn>
            <v-btn variant="plain" icon density="compact">
                <span class="material-icons">notifications</span>
            </v-btn>
            <v-btn variant="plain" icon density="compact" @click="route = route === 'settings' ? 'main' : 'settings'" class="mr-6">
                <span class="material-icons">settings</span>
            </v-btn>
        </v-app-bar>
        <v-main>
            <suspense>
                <ni-main v-if="route === 'main'"></ni-main>
            </suspense>
            <suspense>
                <ni-settings v-if="route === 'settings'"></ni-settings>
            </suspense>
        </v-main>
        <v-footer :color="theme === 'light' ? 'grey-lighten-4' : undefined" app class="pa-4 d-flex align-center">
            <a id="site-href" target="_blank" rel="noopener" style="text-decoration: none" href="https://june07.com">
                <div class="text-h6 text-green-darken-4 ml-2"><span style="font-family: sans-serif; font-size: smaller">©</span> 2016-2023 June07</div>
            </a>
            <v-spacer></v-spacer>
            <v-btn variant="flat" class="mx-2 text-white rounded-xl" color="green-lighten-2" @click="overlays.donation = true">
                <span class="material-icons mr-2">toll</span>donate
            </v-btn>
            <div class="mr-4">
                <share-menu color="blue">
                    <span class="material-icons mr-2">share</span>share
                </share-menu>
            </div>
        </v-footer>
        <ni-donation-overlay v-model="overlays.donation" @close="overlays.donation = false" :theme="theme">overlay</ni-donation-overlay>
        <ni-messages-overlay v-model="overlays.messages" @close="overlays.messages = false" :theme="theme">overlay</ni-messages-overlay>
    </v-app>
</template>
<style scoped>
.small-icon {
    font-size: 16px;
}
:deep() .small-switch .v-switch__track {
    height: 20px;
    width: 40px;
}
:deep() .small-switch .v-switch__thumb {
    height: 16px;
    width: 16px;
}
</style>
<script setup>
const { VITE_ENV, VITE_EXTENSION_ID } = import.meta.env;

import { ref, inject, reactive, computed, provide } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";

import ShareMenu from "./components/ShareMenu.vue";
import NiMain from "./components/NiMain.vue";
import NiSettings from "./components/NiSettings.vue";
import NiDonationOverlay from "./components/NiDonationOverlay.vue";
import NiMessagesOverlay from "./components/NiMessagesOverlay.vue";

const id = chrome?.runtime?.id || VITE_EXTENSION_ID;
const i18nString = inject("i18nString");
const settings = inject("settings");
const updateSetting = inject("updateSetting");
const route = ref("main");
const theme = ref(settings.value.theme || "light");
const overlays = ref({
    donation: false,
    messages: false,
});
const {
    user,
    isAuthenticated,
    loginWithPopup,
    getAccessTokenSilently,
    logout,
} = useAuth0();
let loading = reactive({
    login: false,
});
function themeHandler() {
    theme.value = theme.value === "light" ? "dark" : "light";
    updateSetting("theme", theme.value);
}
async function getAccessTokenSilentlyWrapper() {
    const token = await getAccessTokenSilently({
        redirect_uri: `chrome-extension://${chrome.runtime.id}`,
    });
    chrome.runtime.sendMessage(id, {
        command: "auth",
        credentials: {
            uid: user.value.sub,
            token,
            apikey: apikey.value,
        },
    });
}
getAccessTokenSilentlyWrapper();
async function login() {
    try {
        loading.login = true;
        if (!isAuthenticated.value) {
            await loginWithPopup();
            getAccessTokenSilentlyWrapper();
        } else {
            await chrome.runtime.sendMessage(id, { command: "signout" });
            await logout({
                localOnly: true,
            });
        }
    } catch (error) {
        console.error(error);
    } finally {
        loading.login = false;
    }
}
const apikey = computed(
    () =>
        user?.value?.[
            `${
                VITE_ENV !== "production"
                    ? "http://localhost/apikey"
                    : "https://brakecode.com/apikey"
            }`
        ] || i18nString("brakeCODELoginRequired")
);

provide("apikey", apikey);
provide("id", id);
</script>
