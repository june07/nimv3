<template>
    <v-container>
        <v-row>
            <v-col class="d-flex align-center">
                <div>
                    <v-img width="128" height="128" :src="iconNiM"></v-img>
                </div>
                <div style="font-size: 24px" class="font-weight-light">{{ i18nString('appName') }}</div>
            </v-col>
        </v-row>
        <v-tabs v-model="tab" grow class="mt-8" color="green-darken-1">
            <v-tab v-for="tab of tabs" :key="tab.id" :value="tab.id" class="text-uppercase px-0" :id="`tab-${tab.id}`" :class="roundedClass(tab.id)">{{ tab.name }}</v-tab>
        </v-tabs>
        <v-window v-model="tab">
            <v-window-item value="home">
                <v-form ref="form" id="local-control-input">
                    <v-row>
                        <v-col cols="6" class="px-0">
                            <v-text-field name="host" variant="underlined" id="host" v-model="inputs.host" placeholder="localhost" :rules="rules.host" @change="update" />
                        </v-col>
                        <v-col cols="6" class="px-0">
                            <v-text-field name="port" variant="underlined" id="port" v-model="inputs.port" placeholder="9229" :rules="rules.port" @change="update" />
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col class="d-flex align-center justify-center">
                            <div class="ml-auto">
                                <v-switch id="auto" name="auto" hide-details v-model="inputs.auto" :color="inputs.auto ? 'green' : ''" @change="update">
                                    <template v-slot:label>
                                        <div class="text-no-wrap" style="width: 40px">{{ inputs.auto ? `${i18nString('auto')}` : `${i18nString('manual')}` }}</div>
                                    </template>
                                </v-switch>
                            </div>
                            <v-btn name="auto" class="mx-4 text-h6" :color="inputs.auto ? '' : 'green'" :disabled="inputs.auto" @click="$event => devtoolsButtonHandler()">{{ i18nString('openDevtools') }}</v-btn>
                            <div class="mr-auto ml-2">
                                <v-switch name="autoResumeInspectBrk" hide-details v-model="inputs.autoResumeInspectBrk" :color="inputs.autoResumeInspectBrk ? 'green' : ''" id="autoResumeInspectBrk" class="text-no-wrap" @change="update">
                                    <template v-slot:label>
                                        <div class="text-no-wrap">{{ i18nString('autoSteppingLabel') }}</div>
                                    </template>
                                </v-switch>
                            </div>
                        </v-col>
                    </v-row>
                </v-form>
            </v-window-item>

            <v-window-item value="localhost">
                <div class="row no-connections-detected pt-16" v-if="!Object.values(getSessions(sessions)).length">
                    <h1 ref="ml11" class="ml11">
                        <span class="text-wrapper">
                            <span class="line line1"></span>
                            <span class="letters">| no_detected_local_connections</span>
                        </span>
                    </h1>
                </div>
                <v-container v-else>
                    <v-expansion-panels flat v-for="(session, id) in getSessions(sessions)" :key="id">
                        <!-- node type panel begin
                            <v-expansion-panel v-if="session.targets?.length" v-for="target of session.targets" :key="target">
                                <v-expansion-panel-title class="text-body-1">{{ id }}</v-expansion-panel-title>
                                <v-expansion-panel-text>
                                    <v-col class="d-flex align-center py-0 text-no-wrap text-truncate">
                                        <div class="mr-2">
                                            <v-img width="16" height="16" :src="sessionIcon(target.info)" />
                                        </div>
                                        <v-tooltip :close-delay="tooltips[`${id}`]" location="top">
                                            <template v-slot:activator="{ props }">
                                                <div v-bind="props" @dblclick="tooltips[`${id}`] = 60000" class="text-no-wrap">
                                                    <span class="mr-auto text-h6">{{ target?.info?.title }}</span>
                                                    <span class="ml-2">({{ target.info?.infoURL?.match(/https?:\/\/([^:]*:[0-9]+)/)?.[1] }})</span>
                                                    <span class="ml-2" v-if="VITE_ENV !== 'production'">{{ id }}</span>
                                                </div>
                                            </template>
                                            <v-container v-click-outside="() => tooltips[`${id}`] = 0">
                                                <v-row>
                                                    <v-col class="pa-0 font-weight-bold" cols="2">source</v-col>
                                                    <v-col class="pa-0">{{ target.info?.infoURL }}</v-col>
                                                </v-row>
                                                <v-row>
                                                    <v-col class="pa-0 font-weight-bold" cols="2">debug url</v-col>
                                                    <v-col class="pa-0">{{ target.url }}</v-col>
                                                </v-row>
                                            </v-container>
                                        </v-tooltip>
                                    </v-col>
                                    <v-col cols="4" class="d-flex align-center py-0">
                                        <v-switch small hide-details color="green" :id="`auto-localhost-${id}`" inset v-model="inputs.session.auto[`${id}`]" density="compact" class="ml-auto shrink small-switch" @change="clickHandlerSessionUpdate(`auto-localhost-${id}`, target.tabId, id)">
                                            <template v-slot:label>
                                                <div class="text-no-wrap" style="width: 40px">{{ inputs.auto ? `${i18nString('auto')}` : `${i18nString('manual')}` }}</div>
                                            </template>
                                        </v-switch>
                                        <v-btn size="x-small" :id="`devtools-localhost-${id}`" color="green" @click="devtoolsButtonHandler(target)" class="mx-1 text-uppercase font-weight-bold">devtools</v-btn>
                                        <v-btn size="x-small" :id="`remove-localhost-${id}`" color="red" @click="clickHandlerSessionUpdate(`remove-localhost-${id}`, target.tabId, id)" class="mx-1 text-uppercase font-weight-bold">remove</v-btn>
                                    </v-col>
                                </v-expansion-panel-text>
                            </v-expansion-panel>
                            <v-expansion-panel v-else>
                                <v-expansion-panel-title class="text-body-1">{{ id }}</v-expansion-panel-title>
                                <v-expansion-panel-text>No debug targets detected.</v-expansion-panel-text>
                            </v-expansion-panel> -->
                        <!-- page type panel -->
                        <ni-expansion-panel v-if="session.infoArr?.length" v-for="info of session.infoArr" :key="info.id" :info="info" :inputs="inputs" :session="session"
                            @update:inputs:session:auto="inputUpdateHandler"
                            @clickHandlerSessionUpdate="clickHandlerSessionUpdate"
                            @devtoolsButtonHandler="devtoolsButtonHandler" />
                        <v-expansion-panel v-else>
                            <v-expansion-panel-title class="text-body-1">{{ id }}</v-expansion-panel-title>
                            <v-expansion-panel-text>No debug targets detected.</v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </v-container>
            </v-window-item>

            <v-window-item v-for="tab in tabs.filter((tab) => !tab.id.match(/home|localhost/))" :key="tab.id" :value="tab.id">
                <v-container>
                    <v-row v-for="(session, id) in getSessions(sessions, tab.id)" :key="id" class="d-flex align-center">
                        <v-expansion-panels>
                            <v-expansion-panel v-for="target of session.targets" :key="target.id">
                                <v-col class="d-flex align-center py-0 text-no-wrap text-truncate" v-if="session.tunnelSocket">
                                    <div class="mr-2">
                                        <v-img width="16" height="16" :src="sessionIcon(session.info)" />
                                    </div>
                                    <v-tooltip :close-delay="tooltips[`${id}`]" location="top">
                                        <template v-slot:activator="{ props }">
                                            <div v-bind="props" @dblclick="tooltips[`${id}`] = 60000" class="text-no-wrap">
                                                <span class="mr-auto text-h6">{{ session?.info?.title }}</span>
                                                <span class="ml-2" v-if="VITE_ENV !== 'production'">{{ id.split(':')[1] }}</span>
                                            </div>
                                        </template>
                                        <v-container v-click-outside="() => tooltips[`${id}`] = 0">
                                            <v-row v-if="session.url">
                                                <v-col class="pa-0 font-weight-bold" cols="2">debug url</v-col>
                                                <v-col class="pa-0">{{ session.url }}</v-col>
                                            </v-row>
                                            <v-row v-if="session.info">
                                                <v-col class="pa-0">
                                                    <ni-info :info="session.info" :expanded="!session.url"></ni-info>
                                                </v-col>
                                            </v-row>
                                        </v-container>
                                    </v-tooltip>
                                </v-col>
                                <v-col v-else cols="6" class="d-flex">
                                    <div>
                                        ({{ session.connection.pid }})
                                    </div>
                                    <div class="ml-2 text-no-wrap text-truncate">
                                        {{ session.connection.cmd }}
                                    </div>
                                </v-col>
                                <v-col cols="4" class="d-flex align-center py-0">
                                    <v-switch :disabled="!session.tunnelSocket" name="auto" :id="`auto-remote-${id}`" small hide-details color="green" inset v-model="inputs.session.auto[`${id}`]" density="compact" class="ml-auto shrink small-switch" @change="clickHandlerSessionUpdate(`auto-remote-${id}`, sessions[session.tabSession]?.tabId, id)">
                                        <template v-slot:label>
                                            <div class="text-no-wrap" style="width: 40px">{{ inputs.auto ? `${i18nString('auto')}` : `${i18nString('manual')}` }}</div>
                                        </template>
                                    </v-switch>
                                    <v-btn :id="`devtools-remote-${id}`" :disabled="!session.tabId && !session.tunnelSocket" size="x-small" color="green" @click="devtoolsButtonHandler(session)" class="mx-1 text-uppercase font-weight-bold">devtools</v-btn>
                                    <v-btn :id="`remove-remote-${id}`" :disabled="!session?.tabSession" size="x-small" color="red" @click="clickHandlerSessionUpdate(`remove-remote-${id}`, sessions[session.tabSession].tabId, id)" class="mx-1 text-uppercase font-weight-bold">remove</v-btn>
                                </v-col>
                            </v-expansion-panel>
                        </v-expansion-panels>
                    </v-row>
                </v-container>
            </v-window-item>
        </v-window>
    </v-container>
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
import { until } from "async"
import { ref, inject, watch } from "vue"
import { useAsyncState } from "@vueuse/core"
import anime from "animejs/lib/anime.es.js"
import NiInfo from "./NiInfo.vue"
import iconNiM from "/icon/icon128@3x.png"
import iconDeno from "/deno-favicon.ico"
import iconNode from "/node-favicon.ico"
import iconBun from '/bun.svg'
// import testData from '../data/sample-debug-targets.json'

import NiExpansionPanel from "./NiExpansionPanel.vue"

// console.log(testData)
const { VITE_ENV, MODE } = import.meta.env
const updateSetting = inject("updateSetting")
const i18nString = inject("i18nString")
const extensionId = inject("extensionId")
const updateNotifications = inject("updateNotifications")
const form = ref("form")
const tab = ref("tab")
const ml11 = ref("ml11")
const rules = {
    host: [
        (v) =>
            /((^(([0-9]|[1-9][0-9]|1([0-1][0-9]|2[0-6]))\.([0-9]|[1-9][0-9]|1([0-9][0-9])|2([0-4][0-9]|5[0-5]))\.([0-9]|[1-9][0-9]|1([0-9][0-9])|2([0-4][0-9]|5[0-5]))\.([0-9]|[1-9][0-9]|1([0-9][0-9])|2([0-4][0-9]|5[0-5]))|127\.0\.0\.([0-1]))$)|(^(1(2[8-9]|[3-9][0-9])|2([0-4][0-9]|5[0-5]))\.([0-9]|[1-9][0-9]|1([0-9][0-9])|2([0-4][0-9]|5[0-5]))\.([0-9]|[1-9][0-9]|1([0-9][0-9])|2([0-4][0-9]|5[0-5]))\.([0-9]|[1-9][0-9]|1([0-9][0-9])|2([0-4][0-9]|5[0-5]))$)|^localhost$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$)/.test(
                v
            ) || i18nString("invalidHost"),
    ],
    port: [
        (v) =>
            /([1-9]|[1-8][0-9]|9[0-9]|[1-8][0-9]{2}|9[0-8][0-9]|99[0-9]|[1-8][0-9]{3}|9[0-8][0-9]{2}|99[0-8][0-9]|999[0-9]|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])/.test(
                v
            ) || i18nString("invalidPort"),
    ],
}
const settings = inject("settings")
const inits = {
    connectionErrorMessage: false,
}
let workerPort
let cache = {
    remove: {},
}
let tabs = ref([
    { name: "home", id: "home" },
    { name: "localhost", id: "localhost" },
])
let inputs = ref({
    session: {},
    auto: settings.value.auto,
    host: settings.value.host,
    port: settings.value.port,
    autoResumeInspectBrk: settings.value.autoResumeInspectBrk,
})
let tooltips = ref({})
await until(
    (cb) =>
        chrome.runtime.sendMessage(
            extensionId,
            { command: "hydrated" },
            (response) => cb(null, response)
        ),
    (next) => setTimeout(next, 500)
)
let { state: asyncSessions } = useAsyncState(
    new Promise((resolve) =>
        chrome.runtime.sendMessage(
            extensionId,
            { command: "getSessions" },
            (response) => resolve(response)
        )
    )
)
let sessions = ref({})
let { state: asyncRemotes } = useAsyncState(
    new Promise((resolve) =>
        chrome.runtime.sendMessage(
            extensionId,
            { command: "getRemotes" },
            (response) => resolve(response)
        )
    )
)
watch(sessions, (currentValue) => {
    if (!currentValue) return
    sessions.value = currentValue
    updateUI(sessions.value)
})
watch(asyncSessions, (currentValue) => {
    if (!currentValue) return
    sessions.value = currentValue
})
watch(asyncRemotes, (currentValue) => {
    if (!currentValue) return
    // console.log("asyncRemotes", currentValue);
    const remoteSessions = Object.values(currentValue).reduce(
        (remoteSessions, remote) => ({
            ...remoteSessions,
            ...Object.values(remote.connections)
                // filter out session for which we are already tracking
                .filter(
                    (remoteConnection) =>
                        !sessions.value[
                        `${remote.uuid}:${remoteConnection.pid}`
                        ]
                )
                .reduce(
                    (sessionsPerHost, connection) => ({
                        ...sessionsPerHost,
                        [`${remote.uuid}:${connection.pid}`]: {
                            remote: true,
                            host: remote.host,
                            title: remote.title,
                            uuid: remote.uuid,
                            tunnelSocket:
                                remote.tunnelSockets?.[connection.pid],
                            connection,
                        },
                    }),
                    {}
                ),
        }),
        {}
    )
    // console.log("remoteSessions", remoteSessions);
    Object.values(currentValue).forEach((value) =>
        tabs.value.push({
            name: value.host,
            id: value.uuid,
        })
    )
    tabs.value.sort((a, b) => (a.name < b.name ? -1 : 0))
    sessions.value = { ...sessions.value, ...remoteSessions }
})
if (chrome.runtime) {
    workerPort = chrome.runtime.connect(extensionId)

    workerPort.onMessage.addListener(async (request) => {
        const { command } = request

        switch (command) {
            case "update":
                const sessionsUpdate = await new Promise((resolve) =>
                    chrome.runtime.sendMessage(
                        extensionId,
                        { command: "getSessions" },
                        (response) => resolve(response)
                    )
                )
                sessions.value = { ...sessions.value, ...sessionsUpdate }
                break
            case "updateNotifications":
                updateNotifications()
                break
        }
    })
}
async function setInfo(session) {
    chrome.runtime.sendMessage(
        extensionId,
        { command: "getInfo", remoteMetadata: session.tunnelSocket },
        (info) => {
            // deno info fix
            if (JSON.stringify(info).match(/[\W](deno)[\W]/)) {
                info.type = "deno"
            }
            sessions.value[`${session.uuid}:${session.connection.pid}`].info =
                info
        }
    )
}
function updateUI(sessions) {
    /** 1. combine all these reduce functions
     *  2. there are tab sessions and non-tab sessions. I think here is where tab sessions should take precedence.
     *     So tab session data should be copied over to the non-tab (remote sessions) in this function.
     */
    tooltips.value = Object.keys(sessions).reduce((acc, sessionId) => {
        return sessionId ? { ...acc, [sessionId]: 0 } : acc
    }, {})
    inputs.value.auto = settings.value.auto
    inputs.value.session.auto = Object.entries(sessions).reduce(
        (formInputModel, kv) => {
            const sessionId = kv[0],
                session = kv[1]

            return sessionId
                ? {
                    ...formInputModel,
                    [sessionId]: cache.remove[sessionId]
                        ? false
                        : !!sessions?.[sessionId]?.auto,
                }
                : formInputModel
        },
        {}
    )
    Object.values(sessions)
        .filter((session) => session.tunnelSocket)
        .map((session) => setInfo(session))
    Object.entries(sessions)
        .filter(
            (kv) =>
                !kv[0].match(/:/) &&
                kv[1]?.socket?.host &&
                typeof kv[1].socket.host === "object"
        )
        .forEach((kvLocal) => {
            const remoteSessions = Object.entries(sessions).filter((kvRemote) =>
                kvRemote[0].match(/:/)
            )
            const remoteSessionId = remoteSessions.find(
                (kvRemote) =>
                    JSON.stringify(kvLocal[1].info) ===
                    JSON.stringify(kvRemote[1].info)
            )?.[0]
            if (
                remoteSessionId &&
                !cache.remove[remoteSessionId] &&
                !kvLocal[1].closed
            ) {
                sessions[remoteSessionId].tabSession = ref(kvLocal[0])
                // console.log(sessions[remoteSessionId]);
            }
        })
}
watch(ml11, (currentValue, oldValue) => {
    if (currentValue !== oldValue && !inits.connectionErrorMessage) {
        initConnectionErrorMessage()
    }
})
function roundedClass(tabId) {
    if (tabId === "home") return "rounded-te-lg"
    if (tabId === tabs.value[tabs.value.length - 1].id) return "rounded-ts-lg"
    return "rounded-t-lg"
}
function initConnectionErrorMessage() {
    inits.connectionErrorMessage = true
    Array.from(document.querySelectorAll(".ml11")).forEach((el) => {
        if (!el.classList.contains("pretty")) {
            el.classList.add("pretty")
            Array.from(document.querySelectorAll(".ml11 .letters")).forEach(
                (el2) => {
                    const untranslated = el2.textContent.split(" ")
                    const translated = `${untranslated[0]} ${i18nString(
                        untranslated[1]
                    )}`
                    el2.innerHTML = translated
                        .replace(
                            /([^\x00-\x80]|\w)/g,
                            "<span class='letter'>$&</span>"
                        )
                        .replace(/(^\| )/, "<blink class='carat'>$&</blink>")
                }
            )
            anime
                .timeline({ loop: true })
                .add({
                    targets: ".ml11 .line",
                    scaleY: [0, 1],
                    opacity: [0.5, 1],
                    easing: "easeOutExpo",
                    duration: 700,
                })
                .add({
                    targets: ".ml11 .line",
                    translateX: [
                        0,
                        Array.from(document.querySelectorAll(".ml11 .letters"))
                            .length,
                    ],
                    easing: "easeOutExpo",
                    duration: 700,
                    delay: 100,
                })
                .add({
                    targets: ".ml11 .letter",
                    opacity: [0, 1],
                    easing: "easeOutExpo",
                    duration: 600,
                    offset: "-=775",
                    delay: function (el, i) {
                        return 34 * (i + 1)
                    },
                })
                .add({
                    targets: ".ml11",
                    opacity: 0,
                    duration: 1000,
                    easing: "easeOutExpo",
                    delay: 1000,
                })
        }
    })
}
async function devtoolsButtonHandler(session) {
    const { host, port } = settings.value
    const remoteMetadata = session?.remote
        ? {
            cid: session.tunnelSocket.cid,
            uuid: session.uuid,
        }
        : undefined
    const response = await chrome.runtime.sendMessage(extensionId, {
        command: "openDevtools",
        host: remoteMetadata || host,
        port,
        session,
        manual: true,
    })
    // console.log(response);
}

function inputUpdateHandler(id, value) {
    inputs.value.session.auto[id] = value
    console.log('...............model update: ', value, inputs.value.session.auto)
}
function clickHandlerSessionUpdate(action, tabId, sessionId) {
    const re = new RegExp(
        `https?:\/\/${settings.value.host}:${settings.value.port}`
    )
    let values

    /** if the session matches the home tabs current auto setting, then change it as well...
     *  When removing sessions always set auto to false, otherwise the update will be ineffective
     *  as the session will just be recreated automatically.
     *
     *  !sessionId to ensure it's only for local sessions.
     */
    const match = action.match(/(auto)(-.*)?|(remove)(-.*)?/)
    if (tabId && match && re.test(sessions.value[tabId]?.info?.infoURL)) {
        // update auto session and setting in localhost tab
        if (match[1] === "auto") {
            values = {
                [tabId]: {
                    ...sessions.value[tabId],
                    [match[1]]: inputs.value.session.auto[sessionId],
                },
            }
            updateSetting("auto", inputs.value.session.auto[sessionId])
        } else {
            cache.remove[tabId] = true
            cache.remove[sessionId] = true
            updateSetting("auto", false)
        }
    } else {
        // update auto session and setting in remote tabs
        if (tabId && action.match(/remove/)) {
            cache.remove[tabId] = true
            cache.remove[sessionId] = true
        } else if (action.match(/auto/)) {
            values = {
                [sessionId]: {
                    ...sessions.value[tabId || sessionId],
                    [match[1]]: inputs.value.session[match[1]][sessionId],
                },
            }
            if (tabId) {
                values[tabId] = {
                    ...sessions.value[sessionId],
                    [match[1]]: inputs.value.session[match[1]][sessionId],
                }
            }
        }
    }
    chrome.runtime.sendMessage(
        extensionId,
        {
            command: "commit",
            store: "session", // chrome storage type (i.e. local, session, sync)
            obj: "sessions",
            keys: [tabId, sessionId].filter((i) => i),
            values,
        },
        (responses) => {
            if (!values?.length && !responses?.length) {
                delete sessions.value[tabId]
                delete cache.remove[tabId]
                delete cache.remove[sessionId]
                // console.log(sessions.value);
            } else {
                const update = responses.reduce(
                    (update, response) => ({
                        ...update,
                        [response.key]: response.value,
                    }),
                    {}
                )
                sessions.value = { ...sessions.value, ...update }
            }
        }
    )
}
function update(event) {
    const { id } = event.target

    if (
        !id.match(/host|port/) ||
        !form.value.errors.find((e) => e.id === id)?.errorMessages.length
    ) {
        updateSetting(id, inputs.value[id])
    }
}
function getSessions(
    sessions,
    UITabId,
    sort = (a, b) => (a[1]?.info?.title < b[1]?.info?.title ? -1 : 0)
) {
    let entries = UITabId
        ? Object.entries(sessions).filter((e) =>
            e[0].match(new RegExp(`${UITabId}`))
        )
        : Object.entries(sessions)

    entries = [
        ...entries.filter((kv) => kv[1].tunnelSocket).sort(sort),
        ...entries.filter((kv) => !kv[1].tunnelSocket).sort(sort),
    ]
    const _sessions = !UITabId
        ? entries.reduce(
            (localSessions, kv) =>
                !kv[1].remote && !kv[1]?.socket?.host?.cid // local sessions will have a string host value
                    ? { ...localSessions, [kv[0]]: kv[1] }
                    : localSessions,
            {}
        )
        : entries.reduce(
            (remoteSessions, kv) =>
                kv[1].remote && kv[1].uuid === UITabId
                    ? { ...remoteSessions, [kv[0]]: kv[1] }
                    : remoteSessions,
            {}
        )
    console.log('_sessions: ',_sessions)
    const sessionsPerSocket = Object.entries(_sessions)
        .sort((a, b) => a[0].includes(':') ? -1 : 0)
        .map((kv) => { console.log(kv); return kv })
        .reduce((sessionsPerSocket, [key, value]) => {
            if (key.includes(':')) {
                return { ...sessionsPerSocket, [key]: value }
            } else if (value.socket) {
                const socket = `${value.socket.host}:${value.socket.port}`

                return {
                    ...sessionsPerSocket,
                    [socket]: {
                        ...sessionsPerSocket[socket],
                        browserTabs: sessionsPerSocket[socket]?.browserTabs ? [...sessionsPerSocket[socket].browserTabs, { tabId: key, ...value }] : [{ tabId: key, ...value }]
                    }
                }
            } else {
                return sessionsPerSocket
            }
        }, {})
    console.log('sessionsPerSocket: ', sessionsPerSocket)
    return sessionsPerSocket
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
</script>
