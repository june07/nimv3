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
                            <v-text-field name="host" variant="underlined" id="hostname" v-model="inputs.host" placeholder="localhost" :rules="rules.host" @change="update" />
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
                            <v-btn name="auto" class="mx-4 text-h6" :color="inputs.auto ? '' : 'green'" :disabled="inputs.auto" @click="devtoolsButtonHandler">{{ i18nString('openDevtools') }}</v-btn>
                            <div class="mr-auto ml-2">
                                <v-switch name="autoResumeInspectBrk" hide-details v-model="inputs.autoResumeInspectBrk" :color="inputs.autoResumeInspectBrk ? 'green' : ''" id="autoResumeSwitch" class="text-no-wrap" @change="update">
                                    <template v-slot:label>
                                        <span class="text-no-wrap">{{ i18nString('autoSteppingLabel') }}</span>
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
                    <v-row v-for="(session, id) in getSessions(sessions)" :key="id" class="d-flex align-center">
                        <v-col class="d-flex align-center py-0">
                            <div class="mr-2">
                                <v-img width="16" height="16" :src="session?.info?.type === 'deno' ? iconDeno : iconNode" />
                            </div>
                            <v-tooltip :close-delay="tooltips[`${id}`]" location="top">
                                <template v-slot:activator="{ props }">
                                    <div v-bind="props" @dblclick="tooltips[`${id}`] = 60000">
                                        <span class="mr-auto text-h6">{{ session.info.title }}</span>
                                        <span class="ml-2">({{ session.infoURL.match(/https?:\/\/([^:]*:[0-9]+)/)[1] }})</span>
                                        <span class="ml-2" v-if="VITE_ENV !== 'production'">{{ id }}</span>
                                    </div>
                                </template>
                                <v-container v-click-outside="() => tooltips[`${id}`] = 0">
                                    <v-row>
                                        <v-col class="pa-0 font-weight-bold" cols="2">source</v-col>
                                        <v-col class="pa-0">{{ session.info.url }}</v-col>
                                    </v-row>
                                    <v-row>
                                        <v-col class="pa-0 font-weight-bold" cols="2">debugger url</v-col>
                                        <v-col class="pa-0">{{ session.url }}</v-col>
                                    </v-row>
                                </v-container>
                            </v-tooltip>
                        </v-col>
                        <v-spacer></v-spacer>
                        <v-col cols="4" class="d-flex align-center py-0">
                            <v-switch small hide-details color="green" inset v-model="inputs.session.auto[`${id}`]" density="compact" class="ml-auto shrink small-switch" @change="clickHandlerSessionUpdate(`auto-localhost-${id}`, session.tabId, id)">
                                <template v-slot:label>
                                    <div class="text-no-wrap" style="width: 40px">{{ inputs.auto ? `${i18nString('auto')}` : `${i18nString('manual')}` }}</div>
                                </template>
                            </v-switch>
                            <v-btn size="x-small" :id="`devtools-localhost-${id}`" color="green" @click="devtoolsButtonHandler(session)" class="mx-1 text-uppercase font-weight-bold">devtools</v-btn>
                            <v-btn size="x-small" color="red" @click="clickHandlerSessionUpdate(`remove-localhost-${id}`, session.tabId, id)" class="mx-1 text-uppercase font-weight-bold">remove</v-btn>
                        </v-col>
                    </v-row>
                </v-container>
            </v-window-item>

            <v-window-item v-for="tab in tabs.filter((tab) => !tab.id.match(/home|localhost/))" :key="tab.id" :value="tab.id">
                <v-container>
                    <v-row v-for="(session, id) in getSessions(sessions, tab.id)" :key="id" class="d-flex align-center">
                        <v-col class="d-flex align-center py-0" v-if="session.tunnelSocket">
                            <div class="mr-2">
                                <v-img width="16" height="16" :src="session?.info?.type === 'deno' ? iconDeno : iconNode" />
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
                                        <v-col class="pa-0 font-weight-bold" cols="2">debugger url</v-col>
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
                        <v-spacer></v-spacer>
                        <v-col cols="4" class="d-flex align-center py-0">
                            <v-switch :disabled="!session.tunnelSocket" name="auto" small hide-details color="green" inset v-model="inputs.session.auto[`${id}`]" density="compact" class="ml-auto shrink small-switch" @change="clickHandlerSessionUpdate(`auto-remote-${id}`, session.tabId, id)">
                                <template v-slot:label>
                                    <div class="text-no-wrap" style="width: 40px">{{ inputs.auto ? `${i18nString('auto')}` : `${i18nString('manual')}` }}</div>
                                </template>
                            </v-switch>
                            <v-btn :disabled="!session.id && !session.tunnelSocket" size="x-small" color="green" @click="devtoolsButtonHandler(session)" class="mx-1 text-uppercase font-weight-bold">devtools</v-btn>
                            <v-btn :disabled="!session?.tabSession" size="x-small" color="red" @click="clickHandlerSessionUpdate(`remove-remote-${id}`, sessions[session.tabSession].tabId, id)" class="mx-1 text-uppercase font-weight-bold">remove</v-btn>
                        </v-col>
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
:deep() input#hostname,
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
}
</style>
<script setup>
import { ref, inject, watch, reactive } from "vue";
import { useAsyncState } from "@vueuse/core";
import anime from "animejs/lib/anime.es.js";
import { useAuth0 } from "@auth0/auth0-vue";
import NiInfo from "./NiInfo.vue";
import iconNiM from "/icon/icon128@3x.png";
import iconDeno from '/deno-favicon.ico';
import iconNode from "/node-favicon.ico";

const { VITE_ENV } = import.meta.env;
const updateSetting = inject("updateSetting");
const i18nString = inject("i18nString");
const extensionId = inject("id");
const form = ref("form");
const tab = ref("tab");
const ml11 = ref("ml11");
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
};
const settings = inject("settings");
const inits = {
    connectionErrorMessage: false,
};
let workerPort;
let tabs = ref([
    { name: "home", id: "home" },
    { name: "localhost", id: "localhost" },
]);
let inputs = ref({
    session: {},
    auto: settings.auto,
    host: settings.host,
    port: settings.port,
    autoResumeInspectBrk: settings.autoResumeInspectBrk,
});
let tooltips = ref({});
let { state: asyncSessions } = useAsyncState(
    new Promise((resolve) =>
        chrome.runtime.sendMessage(extensionId, { command: "getSessions" }, (response) =>
            resolve(response)
        )
    )
);
let sessions = ref({});
let { state: asyncRemotes } = useAsyncState(
    new Promise((resolve) =>
        chrome.runtime.sendMessage(extensionId, { command: "getRemotes" }, (response) =>
            resolve(response)
        )
    )
);
watch(sessions, (currentValue) => {
    if (!currentValue) return;
    sessions.value = currentValue;
    updateUI(sessions.value);
});
watch(asyncSessions, (currentValue) => {
    if (!currentValue) return;
    sessions.value = currentValue;
});
watch(asyncRemotes, (currentValue) => {
    if (!currentValue) return;
    console.log("asyncRemotes", currentValue);
    const remoteSessions = Object.values(currentValue).reduce(
        (remoteSessions, remote) => ({
            ...remoteSessions,
            ...Object.values(remote.connections)
                // filter out session for which we are already tracking
                .filter(remoteConnection => !sessions.value[`${remote.uuid}:${remoteConnection.pid}`])
                .reduce(
                (sessionsPerHost, connection) => ({
                    ...sessionsPerHost,
                    [`${remote.uuid}:${connection.pid}`]: {
                        remote: true,
                        host: remote.host,
                        title: remote.title,
                        uuid: remote.uuid,
                        tunnelSocket: remote.tunnelSockets?.[connection.pid],
                        connection,
                    },
                }),
                {}
            ),
        }),
        {}
    );
    console.log("remoteSessions", remoteSessions);
    Object.values(currentValue).forEach((value) =>
        tabs.value.push({
            name: value.host,
            id: value.uuid,
        })
    );
    tabs.value.sort((a, b) => a.name < b.name ? -1 : 0);
    sessions.value = { ...sessions.value, ...remoteSessions };
});
if (chrome.runtime) {
    workerPort = chrome.runtime.connect(extensionId);

    workerPort.onMessage.addListener(async (request) => {
        const { command } = request;

        switch (command) {
            case "update":
                const sessionsUpdate = await new Promise((resolve) =>
                    chrome.runtime.sendMessage(extensionId, { command: "getSessions" }, response => resolve(response))
                )
                sessions.value = { ...sessions.value, ...sessionsUpdate };
                break;
        }
    });
}
async function setInfo(session) {
    chrome.runtime.sendMessage(
        extensionId,
        { command: "getInfo", remoteMetadata: session.tunnelSocket },
        (info) => {
            // deno info fix
            if (JSON.stringify(info).match(/[\W](deno)[\W]/)) {
                info.type = 'deno';
            }
            sessions.value[`${session.uuid}:${session.connection.pid}`].info = info;
        }
    );
}
function updateUI(sessions) {
    /** 1. combine all these reduce functions
     *  2. there are tab sessions and non-tab sessions. I think here is where tab sessions should take precedence.
     *     So tab session data should be copied over to the non-tab (remote sessions) in this function.
    */
    tooltips.value = Object.keys(sessions).reduce((acc, sessionId) => {
        return sessionId ? { ...acc, [sessionId]: 0 } : acc;
    }, {});
    inputs.value.session.auto = Object.entries(sessions).reduce(
        (formInputModel, kv) => {
            const sessionId = kv[0],
                session = kv[1];

            return sessionId
                ? {
                      ...formInputModel,
                      [sessionId]: !!session.auto,
                  }
                : formInputModel;
        },
        {}
    );
    // copy the tab session data to non-tab sessions (auto, ...)

    Object.values(sessions)
        .filter((session) => session.tunnelSocket)
        .map((session) => setInfo(session));

    Object.entries(sessions).filter(kv => !kv[0].match(/:/) && kv[1]?.socket?.host && typeof kv[1].socket.host === 'object').forEach(kvLocal => {
        const remoteSessions = Object.entries(sessions).filter(kvRemote => kvRemote[0].match(/:/));
        const remoteSessionId = remoteSessions.find(kvRemote => kvLocal.info === kvRemote.info)?.[0];
        if (remoteSessionId) {
            sessions[remoteSessionId].tabSession = ref(kvLocal[0]);
            console.log(sessions[remoteSessionId])
        }
    })
}
watch(ml11, (currentValue, oldValue) => {
    if (currentValue !== oldValue && !inits.connectionErrorMessage) {
        initConnectionErrorMessage();
    }
});

function roundedClass(tabId) {
    if (tabId === "home") return "rounded-te-lg";
    if (tabId === tabs.value[tabs.value.length - 1].id) return "rounded-ts-lg";
    return "rounded-t-lg";
}
function initConnectionErrorMessage() {
    inits.connectionErrorMessage = true;
    Array.from(document.querySelectorAll(".ml11")).forEach((el) => {
        if (!el.classList.contains("pretty")) {
            el.classList.add("pretty");
            Array.from(document.querySelectorAll(".ml11 .letters")).forEach(
                (el2) => {
                    const untranslated = el2.textContent.split(" ");
                    const translated = `${untranslated[0]} ${i18nString(
                        untranslated[1]
                    )}`;
                    el2.innerHTML = translated
                        .replace(
                            /([^\x00-\x80]|\w)/g,
                            "<span class='letter'>$&</span>"
                        )
                        .replace(/(^\| )/, "<blink class='carat'>$&</blink>");
                }
            );
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
                        return 34 * (i + 1);
                    },
                })
                .add({
                    targets: ".ml11",
                    opacity: 0,
                    duration: 1000,
                    easing: "easeOutExpo",
                    delay: 1000,
                });
        }
    });
}
async function devtoolsButtonHandler(session) {
    const { host, port } = settings;
    const remoteMetadata = session.remote ? {
        cid: session.tunnelSocket.cid,
        uuid: session.uuid,
    } : undefined
    const response = await chrome.runtime.sendMessage(extensionId, {
        command: "openDevtools",
        host: remoteMetadata || host,
        port,
        manual: true,
    });
    console.log(response);
}

function clickHandlerSessionUpdate(action, tabId, sessionId) {
    const re = new RegExp(`https?:\/\/${settings.host}:${settings.port}`);
    let value;

    /** if the session matches the home tabs current auto setting, then change it as well...
     *  When removing sessions always set auto to false, otherwise the update will be ineffective
     *  as the session will just be recreated automatically.
     * 
     *  !sessionId to ensure it's only for local sessions.
     */
    const match = action.match(/(auto)-.*?|(remove)-.*/);
    if (!sessionId && tabId && match && re.test(sessions.value[tabId]?.infoURL)) {
        // update auto setting in localhost tab
        inputs.value.auto = action.match(/remove/)
            ? false
            : inputs.value.session.auto[sessionId];
        updateSetting('auto', inputs.value.auto);
    } else if (sessionId && tabId && match) {
        // update auto setting in remote tabs
        if (action.match(/remove/)) {
            inputs.value.session.auto[tabId] = false;
            inputs.value.session.auto[sessionId] = false;
        }
    }
    if (action.match(/auto/)) {
        value = { ...sessions.value[tabId || sessionId], [match[1]]: inputs.value.session.auto[sessionId] };
    }
    chrome.runtime.sendMessage(
        extensionId,
        {
            command: "commit",
            store: "session", // chrome storage type (i.e. local, session, sync)
            obj: "sessions",
            key: tabId || sessionId,
            value,
        },
        (response) => {
            if (!value && !response) {
                delete sessions.value[tabId];
                console.log(sessions.value);
            } else {
                sessions.value[tabId || sessionId] = response;
            }
        }
    );
}
function update(event) {
    const { id } = event.target;

    if (
        !id.match(/host|port/) ||
        !form.value.errors.find((e) => e.id === id)?.errorMessages.length
    ) {
        updateSetting(id, inputs.value[id]);
    }
}
function getSessions(
    sessions,
    UITabId,
    sort = (a, b) => (a[1]?.info?.title < b[1]?.info?.title ? -1 : 0)
) {
    let entries = UITabId ? Object.entries(sessions).filter(e => e[0].match(new RegExp(`${UITabId}`))) : Object.entries(sessions);

    entries = [ ...entries.filter(kv => kv[1].tunnelSocket).sort(sort), ...entries.filter(kv => !kv[1].tunnelSocket).sort(sort) ]
    return !UITabId
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
          );
}
</script>

