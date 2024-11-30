<template>
    <v-expansion-panel v-if="info">
        <v-expansion-panel-title class="d-flex text-body-1">
            <div class="ml-n4 mr-4">
                <span v-if="/!node/.test(props.info.type)" class="material-symbols-outlined">javascript</span>
                <img width="16" height="16" v-else :src="iconNode" />
            </div>
            <div v-if="info.title" style="max-width: 50%" class="font-weight-bold text-no-wrap text-truncate">{{ decodeHTMLEntities(info.title) }}</div>
            <div v-if="info.description" class="ml-2">{{ info.description }}</div>
            <div v-if="info.url" class="ml-2 w-25 text-no-wrap text-truncate">{{ info.url }}</div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
            <v-row class="d-flex align-center">
                <v-col class="d-flex align-center py-0 text-no-wrap text-truncate">
                    <div class="mr-2">
                        <v-img width="16" height="16" :src="sessionIcon(info)" />
                    </div>
                    <v-tooltip :close-delay="tooltips[`${info.id}`]" location="top">
                        <template v-slot:activator="{ props }">
                            <div v-bind="props" @dblclick="tooltips[`${info.id}`] = 60000" class="text-no-wrap">
                                <span class="mr-auto">{{ info.webSocketDebuggerUrl }}</span>
                            </div>
                        </template>
                        <v-container v-click-outside="() => tooltips[`${info.id}`] = 0">
                            <v-row>
                                <v-col class="pa-0 font-weight-bold" cols="2">status</v-col>
                                <v-col class="pa-0">{{ !!browserSession ? 'connected' : 'disconnected' }}
                                    <span v-if="!!browserSession" style="color: green" class="material-symbols-rounded">check_circle</span>
                                    <span v-else style="color: grey" class="material-symbols-rounded">cancel</span>
                                </v-col>
                            </v-row>
                            <v-row>
                                <v-col class="pa-0 font-weight-bold" cols="2">source</v-col>
                                <v-col class="pa-0">{{ info.url }}</v-col>
                            </v-row>
                            <v-row>
                                <v-col class="pa-0 font-weight-bold" cols="2">debug url</v-col>
                                <v-col class="pa-0">{{ info.devtoolsFrontendUrl }}</v-col>
                            </v-row>
                        </v-container>
                    </v-tooltip>
                </v-col>
                <v-col cols="4" class="py-0">
                    <div v-if="!!browserSession" class="d-flex align-center">
                        <v-switch small hide-details color="green" :id="`auto-localhost-${info.id}`" inset v-model="switchModel" density="compact" class="ml-auto shrink small-switch" @change="$emit('clickHandlerSessionUpdate', `auto-localhost-${info.id}`, browserSession.tabId, info.id)" @update:model-value="value => $emit('update:inputs:session:auto', browserSession.tabId, value)">
                            <template v-slot:label>
                                <div class="text-no-wrap" style="width: 40px">{{ switchModel ? i18nString('auto') : i18nString('manual') }}</div>
                            </template>
                        </v-switch>
                        <v-btn size="x-small" :id="`devtools-localhost-${info.id}`" color="green" @click="$emit('devtoolsButtonHandler', browserSession)" class="mx-1 text-uppercase font-weight-bold">devtools</v-btn>
                        <v-btn size="x-small" :id="`remove-localhost-${info.id}`" color="red" @click="$emit('clickHandlerSessionUpdate', `remove-localhost-${info.id}`, browserSession.tabId, info.id)" class="mx-1 text-uppercase font-weight-bold">remove</v-btn>
                        <span style="position: absolute; right: 0; color: green" class="material-symbols-rounded">check_circle</span>
                    </div>
                    <div v-else class="d-flex align-center">
                        <v-switch small hide-details color="green" :id="`auto-localhost-${info.id}`" inset v-model="switchModel" density="compact" class="ml-auto shrink small-switch" @change="$emit('clickHandlerSessionUpdate', `auto-localhost-${info.id}`, undefined, info.id)" @update:model-value="value => $emit('update:inputs:session:auto', info.id, value)">
                            <template v-slot:label>
                                <div class="text-no-wrap" style="width: 40px">{{ switchModel ? i18nString('auto') : i18nString('manual') }}</div>
                            </template>
                        </v-switch>
                        <v-btn size="x-small" :id="`devtools-localhost-${info.id}`" variant="tonal" color="green" @click="$emit('devtoolsButtonHandler', info)" class="mx-1 text-uppercase font-weight-bold" text="devtools" />
                        <v-btn size="x-small" :id="`remove-localhost-${info.id}`" variant="tonal" color="grey" readonly class="mx-1 text-uppercase font-weight-bold" text="remove" />
                        <span style="position: absolute; right: 0; color: grey" class="material-symbols-rounded">cancel</span>
                    </div>
                </v-col>
                {{ console.log(inputs.session.auto) }}
            </v-row>
        </v-expansion-panel-text>
    </v-expansion-panel>
</template>
<style scoped>
.v-tab--selected {
    font-size: x-large;
}

:deep() input#host,
:deep() input#port,
:deep() .v-input__details {
    text-align: center;
}

:deep() .v-overlay__content {
    pointer-events: all !important;
    background-color: white !important;
    border: 1px solid green;
    border-radius: 10px !important;
    color: black !important;
    font-size: larger !important;
    width: -webkit-fill-available !important;
    opacity: 0.90 !important;
}

:deep() .v-expansion-panel-title,
:deep() .v-expansion-panel-title--active {
    padding-top: 6px;
    padding-bottom: 6px;
    min-height: unset !important;
}
</style>
<script setup>
import { ref, computed, inject, watch } from "vue"
import iconNiM from "/icon/icon128@3x.png"
import iconDeno from "/deno-favicon.ico"
import iconNode from "/node-favicon.ico"
import iconBun from '/bun.svg'

const props = defineProps({
    info: Object,
    session: Object,
    inputs: Object,
})
const i18nString = inject("i18nString")
const { VITE_ENV } = import.meta.env
const switchModel = ref(props.info?.id && props.inputs.session.auto?.[props.info.id] ? true : false)
const browserSession = computed(() => props.info && props.session.browserTabs?.find((tab) => tab.socket && tab.socket.target === props.info.id))
/** Primary Target Types
    page
    Represents a web page (tab) in the browser.

    iframe
    Represents an iframe embedded within a page.

    worker
    Represents a Web Worker, Shared Worker, or Service Worker.

    browser
    Represents the entire browser process itself, often used for browser-wide debugging.

    background_page
    Represents a background page in a Chrome extension.

    extension
    Represents an active Chrome extension.

    app
    Represents an application tab (commonly used in packaged Chrome apps).

    webview
    Represents a <webview> tag in a Chrome App or extension.

    service_worker
    Represents a specific type of worker that handles service worker tasks.

    shared_worker
    Represents a specific type of worker shared across multiple contexts.

    devtools_page
    Represents the DevTools interface itself, often used when debugging DevTools extensions.

    tab
    Represents an individual browser tab.

    Less Common Target Types
    node
    Represents a Node.js debugging session (when using Chrome DevTools for Node.js).

    other
    A generic catch-all for targets that don't fit other categories.

    worker_other
    Represents non-standard workers.
*/
const emit = defineEmits(['clickHandlerSessionUpdate', 'devtoolsButtonHandler'])
let tooltips = ref({})

function decodeHTMLEntities(html) {
    const parser = new DOMParser()
    const dom = parser.parseFromString(`<!doctype html><body>${html}`, 'text/html')
    return dom.body.textContent || ""
}
function sessionIcon(sessionInfo) {
    if (/bun/.test(sessionInfo.faviconUrl)) {
        return iconBun
    } else if (/deno/.test(sessionInfo.faviconUrl)) {
        return iconDeno
    } else if (/node/.test(sessionInfo.faviconUrl)) {
        return iconNode
    } else {
        return iconNiM
    }
}
console.log(props.session, props.info.id)
</script>