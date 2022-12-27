<template>
    <v-app :theme="theme">
        <v-app-bar density="compact" flat>
            <v-btn variant="plain" density="compact" icon="close" v-if="route !== 'main'" @click="route = 'main'"></v-btn>
            <v-spacer></v-spacer>
            <span class="mx-8">v0.0.0</span>
            <v-btn variant="plain" size="x-small" :icon="theme === 'light' ? 'light_mode' : 'dark_mode'" @click="themeHandler"></v-btn>
            <v-avatar v-if="isAuthenticated" size="x-small">
                <v-img :src="user?.picture" :alt="user?.name"></v-img>
            </v-avatar>
            <v-btn variant="plain" density="compact" :icon="isAuthenticated ? 'logout' : 'login'" @click="login" :loading="loading.login"></v-btn>
            <v-btn variant="plain" density="compact" :icon="'settings'" @click="route = route === 'settings' ? 'main' : 'settings'" class="mr-6"></v-btn>
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
            <v-btn variant="flat" class="mx-2 text-white rounded-xl" color="green-lighten-2" prepend-icon="toll" @click="overlays.donation = true">donate</v-btn>
            <div class="mr-4">
                <share-menu color="blue">
                    <v-icon icon="share" class="mr-2"></v-icon>share
                </share-menu>
            </div>
        </v-footer>
        <ni-donation-overlay v-model="overlays.donation" @close="overlays.donation = false">overlay</ni-donation-overlay>
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
<script setup>
const { VITE_ENV, VITE_EXTENSION_ID } = import.meta.env;

import { ref, inject, reactive, computed, provide, onBeforeUnmount } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";

import ShareMenu from "./components/ShareMenu.vue";
import NiMain from "./components/NiMain.vue";
import NiSettings from "./components/NiSettings.vue";
import NiDonationOverlay from "./components/NiDonationOverlay.vue";

const id = chrome?.runtime?.id || VITE_EXTENSION_ID;
const i18nString = inject("i18nString");
const route = ref("main");
const theme = ref("light");
const overlays = ref({
    donation: false,
});
const {
    user,
    isAuthenticated,
    loginWithPopup,
    logout,
} = useAuth0();
let loading = reactive({
    login: false,
});
function themeHandler() {
    theme.value = theme.value === "light" ? "dark" : "light";
}
async function login() {
    try {
        loading.login = true;
        if (!isAuthenticated.value) {
            await loginWithPopup();
            await chrome.runtime.sendMessage(id, {
                command: "apikey",
                value: { apikey: apikey.value },
            });
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
