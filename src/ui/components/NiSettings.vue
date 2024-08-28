<template>
    <v-container style="max-height: 484px">
        <v-form ref="form">
            <v-tabs color="primary" v-model="tab" class="mb-8">
                <v-tab value="ui" class="font-weight-bold">ui</v-tab>
                <v-tab value="debugger" class="font-weight-bold">debugger</v-tab>
                <v-tab value="notifications" class="font-weight-bold">notifications</v-tab>
                <v-tab value="brakecode" class="font-weight-bold">BrakeCODE</v-tab>
            </v-tabs>
            <v-window v-model="tab">
                <v-window-item value="ui">
                    <v-row class="d-flex align-center mt-0">
                        <v-col class="pb-0 text-body-1">
                            {{ i18nString('openInspectorNewWindow') }}
                        </v-col>
                        <v-col class="pb-0" cols="2">
                            <v-switch name="newWindow" v-model="inputs.newWindow" hide-details @change="update" inset density="compact" class="small-switch" color="primary">
                                <template v-slot:label>
                                    <div class="text-no-wrap" style="width: 40px">{{ inputs.newWindow ? `${i18nString('on')}` : `${i18nString('off')}` }}</div>
                                </template>
                            </v-switch>
                        </v-col>
                    </v-row>
                    <v-row class="d-flex align-center mt-0" v-if="inputs.newWindow">
                        <v-col class="py-0 text-body-1">
                            {{ i18nString('makeInspectorWindowFocused') }}
                        </v-col>
                        <v-col class="py-0" cols="2">
                            <v-switch name="windowFocused" v-model="inputs.windowFocused" hide-details @change="update" inset density="compact" class="small-switch" color="primary">
                                <template v-slot:label>
                                    <div class="text-no-wrap" style="width: 40px">{{ inputs.windowFocused ? `${i18nString('on')}` : `${i18nString('off')}` }}</div>
                                </template>
                            </v-switch>
                        </v-col>
                    </v-row>
                    <v-row class="d-flex align-center mt-0" v-if="inputs.newWindow">
                        <v-col class="py-0 text-body-1">
                            {{ i18nString('inspectorWindowStyle') }}
                        </v-col>
                        <v-col class="py-0" cols="2">
                            <v-switch name="panelWindowType" v-model="inputs.panelWindowType" hide-details @change="update" inset density="compact" class="small-switch" color="primary">
                                <template v-slot:label>
                                    <div class="text-no-wrap" style="width: 40px">{{ inputs.panelWindowType ? `${i18nString('on')}` : `${i18nString('off')}` }}</div>
                                </template>
                            </v-switch>
                        </v-col>
                    </v-row>
                    <v-row class="d-flex align-center mt-0" v-if="inputs.newWindow">
                        <v-col class="py-0 text-body-1">
                            {{ i18nString('optionsWindowStateMaximized') }}
                        </v-col>
                        <v-col class="py-0" cols="2">
                            <v-switch name="windowStateMaximized" v-model="inputs.windowStateMaximized" hide-details @change="update" inset density="compact" class="small-switch" color="primary">
                                <template v-slot:label>
                                    <div class="text-no-wrap" style="width: 40px">{{ inputs.windowStateMaximized ? `${i18nString('on')}` : `${i18nString('off')}` }}</div>
                                </template>
                            </v-switch>
                        </v-col>
                    </v-row>
                    <v-row class="d-flex align-center mt-0" v-if="!inputs.newWindow">
                        <v-col class="py-0 text-body-1">
                            {{ i18nString('makeInspectorTabActive') }}
                        </v-col>
                        <v-col class="py-0" cols="2">
                            <v-switch name="tabActive" v-model="inputs.tabActive" hide-details @change="update" inset density="compact" class="small-switch" color="primary">
                                <template v-slot:label>
                                    <div class="text-no-wrap" style="width: 40px">{{ inputs.tabActive ? `${i18nString('on')}` : `${i18nString('off')}` }}</div>
                                </template>
                            </v-switch>
                        </v-col>
                    </v-row>
                    <v-row class="d-flex align-center mt-0">
                        <v-col class="py-0 text-body-1">
                            {{ i18nString('focusOnBreakpoint') }}
                        </v-col>
                        <v-col class="py-0" cols="2">
                            <v-switch name="focusOnBreakpoint" v-model="inputs.focusOnBreakpoint" hide-details @change="update" inset density="compact" class="small-switch" color="primary">
                                <template v-slot:label>
                                    <div class="text-no-wrap" style="width: 40px">{{ inputs.focusOnBreakpoint ? `${i18nString('on')}` : `${i18nString('off')}` }}</div>
                                </template>
                            </v-switch>
                        </v-col>
                    </v-row>
                    <v-row class="d-flex align-center mt-0">
                        <v-col class="py-0 text-body-1">
                            {{ i18nString('autoCloseInspector') }}
                        </v-col>
                        <v-col class="py-0" cols="2">
                            <v-switch name="autoClose" v-model="inputs.autoClose" hide-details @change="update" inset density="compact" class="small-switch" color="primary">
                                <template v-slot:label>
                                    <div class="text-no-wrap" style="width: 40px">{{ inputs.autoClose ? `${i18nString('on')}` : `${i18nString('off')}` }}</div>
                                </template>
                            </v-switch>
                        </v-col>
                    </v-row>
                    <v-row class="d-flex align-center mt-0">
                        <v-col class="py-0 text-body-1">
                            {{ i18nString('groupInspectorTabs') }}
                        </v-col>
                        <v-col class="py-0" cols="2">
                            <v-switch name="group" v-model="inputs.group" hide-details @change="update" inset density="compact" class="small-switch" color="primary">
                                <template v-slot:label>
                                    <div class="text-no-wrap" style="width: 40px">{{ inputs.group ? `${i18nString('on')}` : `${i18nString('off')}` }}</div>
                                </template>
                            </v-switch>
                        </v-col>
                    </v-row>
                    <v-row class="d-flex align-center mt-0">
                        <v-col class="pt-0 text-body-1 text-capitalize">
                            {{ i18nString('themeOverride') }}
                        </v-col>
                        <v-col class="pt-0" cols="2">
                            <v-switch name="themeOverride" v-model="inputs.themeOverride" hide-details @change="update" inset density="compact" class="small-switch" color="primary">
                                <template v-slot:label>
                                    <div class="text-no-wrap" style="width: 40px">{{ inputs.themeOverride ? `${i18nString('on')}` : `${i18nString('off')}` }}</div>
                                </template>
                            </v-switch>
                        </v-col>
                    </v-row>

                    <v-row class="d-flex align-center mt-0">
                        <v-col class="pt-0 text-body-1" cols="7">
                            {{ i18nString('debugVerbosity') }}
                        </v-col>
                        <v-col cols="3" class="pt-0 text-body-1">
                            <v-slider color="primary" hide-details name="debugVerbosity" :min="0" :max="10" :step="1" thumb-size="16" class="ml-4" :thumb-label="true" v-model="inputs.debugVerbosity" @update:modelValue="update({ target: { name: 'debugVerbosity' } })">
                                <template v-slot:thumb-label="{ modelValue }">
                                    <span class="text-no-wrap">{{ modelValue }}</span>
                                </template>
                            </v-slider>
                        </v-col>
                        <v-spacer cols="2"></v-spacer>
                    </v-row>
                </v-window-item>

                <v-window-item value="debugger">
                    <v-row class="d-flex align-center mt-0">
                        <v-col class="pb-0 text-body-1">
                            {{ i18nString('statistics') }}
                        </v-col>
                        <v-col class="pb-0" cols="2">
                            <v-switch name="debuggingStatistics" v-model="inputs.debuggingStatistics" hide-details @change="update" inset density="compact" class="small-switch" color="primary">
                                <template v-slot:label>
                                    <div class="text-no-wrap" style="width: 40px">{{ inputs.debuggingStatistics ? `${i18nString('on')}` : `${i18nString('off')}` }}</div>
                                </template>
                            </v-switch>
                        </v-col>
                    </v-row>
                    <v-row class="d-flex align-center mt-0">
                        <v-col class="py-0 text-body-1">
                            DevTools Compat
                        </v-col>
                        <v-col class="py-0" cols="2">
                            <v-switch name="devToolsCompat" v-model="inputs.devToolsCompat" hide-details @change="update" inset density="compact" class="small-switch" color="primary">
                                <template v-slot:label>
                                    <div class="text-no-wrap" style="width: 40px">{{ inputs.devToolsCompat ? `${i18nString('on')}` : `${i18nString('off')}` }}</div>
                                </template>
                            </v-switch>
                        </v-col>
                    </v-row>
                    <v-row class="d-flex align-center mt-0">
                        <v-col class="py-0 text-body-1">
                            {{ i18nString('defaultDevTools') }}
                        </v-col>
                        <v-col class="py-0" cols="2">
                            <v-switch name="localDevTools" v-model="inputs.localDevTools" hide-details @change="update" inset density="compact" class="small-switch" color="primary">
                                <template v-slot:label>
                                    <div class="text-no-wrap" style="width: 40px">{{ inputs.localDevTools ? `${i18nString('on')}` : `${i18nString('off')}` }}</div>
                                </template>
                            </v-switch>
                        </v-col>
                    </v-row>
                    <v-row class="d-flex align-center mt-0">
                        <v-col class="py-0 text-body-1" cols="3">
                            DevTools Version ({{ inputs.localDevtoolsOptionsSelected.name }})
                        </v-col>
                        <v-col class="py-0 text-no-wrap" cols="6">
                            <v-select chips name="localDevtoolsOptionsSelected" class="localDevToolsSelect" hide-details density="compact" variant="plain" :disabled="!inputs.localDevTools" v-model="inputs.localDevtoolsOptionsSelected" :items="settings.localDevtoolsOptions" item-title="url" item-value="id" append-inner-icon return-object @update:modelValue="update({ target: { name: 'localDevtoolsOptionsSelected' } })">
                                <template v-slot:chip="{ item }">
                                    <span class="v-chip v-theme--light v-chip--density-default v-chip--size-small v-chip--variant-tonal" draggable="false">
                                        <span class="v-chip__underlay"></span>{{ inputs.devToolsCompat ? item.title.replace('inspector.html', 'js_app.html') : item.title }}
                                    </span>
                                </template>
                            </v-select>
                        </v-col>
                        <v-spacer cols="2"></v-spacer>
                    </v-row>
                    <v-row class="d-flex align-center mt-0" v-if="inputs.localDevtoolsOptionsSelected.id == 3">
                        <v-col class="text-body-1" cols="3">
                            {{ i18nString('optionsCustomDevToolsURL') }}
                        </v-col>
                        <v-col cols="6">
                            <v-text-field name="customDevtoolsURL" class="rounded-xl" :rules="rules.customDevtoolsURL" density="compact" variant="solo" flat v-model="inputs.localDevtoolsOptionsSelected.url" @change="update" placeholder="https://" bg-color="green-lighten-4">
                            </v-text-field>
                        </v-col>
                        <v-spacer cols="2"></v-spacer>
                    </v-row>
                    <v-row class="d-flex align-center mt-0">
                        <v-col class="pt-0 text-body-1" cols="7">
                            {{ i18nString('secondsBetweenInspectorChecks') }}
                        </v-col>
                        <v-col cols="3" class="pt-0 text-body-1">
                            <v-slider color="primary" hide-details name="checkInterval" :min="500" :max="30000" :step="500" thumb-size="16" class="ml-4" :thumb-label="true" v-model="inputs.checkInterval" @update:modelValue="update({ target: { name: 'checkInterval' } })">
                                <template v-slot:thumb-label="{ modelValue }">
                                    <span class="text-no-wrap">{{ modelValue / 1000 }} {{ i18nString('seconds') }}</span>
                                </template>
                            </v-slider>
                        </v-col>
                        <v-spacer cols="2"></v-spacer>
                    </v-row>
                </v-window-item>

                <v-window-item value="notifications">
                    <v-row class="d-flex align-center mt-0">
                        <v-col class="pb-0 text-body-1">
                            {{ i18nString('optionsChromeNotificationsGeneral') }}
                        </v-col>
                        <v-col class="pb-0" cols="2">
                            <v-switch name="chromeNotificationsGeneral" v-model="inputs.chromeNotificationsGeneral" hide-details @change="update" inset density="compact" class="small-switch" color="primary">
                                <template v-slot:label>
                                    <div class="text-no-wrap" style="width: 40px">{{ inputs.chromeNotificationsGeneral ? `${i18nString('on')}` : `${i18nString('off')}` }}</div>
                                </template>
                            </v-switch>
                        </v-col>
                    </v-row>
                    <v-row class="d-flex align-center mt-0">
                        <v-col class="pt-0 text-body-1">
                            {{ i18nString('optionsChromeNotificationsExternal') }}
                        </v-col>
                        <v-col class="pt-0" cols="2">
                            <v-switch name="chromeNotificationsExternal" v-model="inputs.chromeNotificationsExternal" hide-details @change="update" inset density="compact" class="small-switch" color="primary">
                                <template v-slot:label>
                                    <div class="text-no-wrap" style="width: 40px">{{ inputs.chromeNotificationsExternal ? `${i18nString('on')}` : `${i18nString('off')}` }}</div>
                                </template>
                            </v-switch>
                        </v-col>
                    </v-row>
                </v-window-item>

                <v-window-item value="brakecode">
                    <v-row class="d-flex align-center mt-0">
                        <v-col class="text-body-1" cols="6">
                            BrakeCODE API Key
                        </v-col>
                        <v-col cols="4">
                            <v-text-field hide-details @mouseover="inputs.mask = false" @mouseout="inputs.mask = true" variant="outlined" density="compact" :type="inputs.mask ? 'password' : 'text'" :value="apikey"></v-text-field>
                        </v-col>
                        <v-spacer></v-spacer>
                    </v-row>
                    <v-row class="d-flex align-center mt-0">
                        <v-col class="pt-0 text-body-1" cols="6">
                            {{ i18nString('nodeReportMaxMessages') }}
                        </v-col>
                        <v-col cols="4" class="pt-0 text-body-1">
                            <v-slider color="primary" name="maxMessages" hide-details :min="1" :max="100" :step="1" thumb-size="16" :thumb-label="true" v-model="inputs.maxMessages" @update:modelValue="update({ target: { name: 'diagnosticReports.maxMessages' } })">
                            </v-slider>
                        </v-col>
                    </v-row>
                </v-window-item>
            </v-window>
        </v-form>
    </v-container>
</template>
<style scoped>
:deep() .localDevToolsSelect .v-field__input {
    padding: 0;
}

:deep() .rounded-xl .v-field--variant-solo,
:deep() .rounded-xl input[name=customDevtoolsURL] {
    border-radius: 24px;
}

:deep() .localDevToolsSelect .v-select__selection:first-child {
    margin-left: auto;
}
</style>
<script setup>
import { ref, inject } from "vue"

const settings = inject("settings")
const i18nString = inject("i18nString")
const updateSetting = inject("updateSetting")
const apikey = inject('apikey')
const tab = ref()
const form = ref("form")

let inputs = ref({
    mask: true,
    newWindow: settings.value.newWindow,
    windowFocused: settings.value.windowFocused,
    panelWindowType: settings.value.panelWindowType,
    windowStateMaximized: settings.value.windowStateMaximized,
    tabActive: settings.value.tabActive,
    focusOnBreakpoint: settings.value.focusOnBreakpoint,
    autoClose: settings.value.autoClose,
    group: settings.value.group,
    localDevTools: settings.value.localDevTools,
    devToolsCompat: settings.value.devToolsCompat,
    localDevtoolsOptionsSelectedIndex:
        settings.value.localDevtoolsOptionsSelectedIndex,
    localDevtoolsOptionsSelected:
        settings.value.localDevtoolsOptions[
        settings.value.localDevtoolsOptionsSelectedIndex
        ],
    chromeNotificationsGeneral: settings.value.chromeNotifications.general,
    chromeNotificationsExternal: settings.value.chromeNotifications.external,
    checkInterval: settings.value.checkInterval,
    debugVerbosity: settings.value.debugVerbosity,
    maxMessages: settings.value.diagnosticReports.maxMessages,
    themeOverride: settings.value.themeOverride,
    debuggingStatistics: settings.value.debuggingStatistics,
})
const rules = {
    customDevtoolsURL: [
        (v) =>
            !v ||
            /(devtools|chrome-devtools|https?:\/\/localhost|chrome-devtools-frontend(\.(appspot|june07|brakecode)\.com)).*\/(inspector.html|js_app.html|devtools_app.html|node_app.html|ndb_app.html)/.test(
                v
            ) ||
            i18nString("invalidDevtoolsURL"),
    ],
}
function update(event) {
    const { name } = event.target

    if (!form.value.errors.find((e) => e.id === name)?.errorMessages.length) {
        switch (name) {
            case 'localDevtoolsOptionsSelected':
                updateSetting('localDevtoolsOptionsSelectedIndex', inputs.value[name].id)
                break
            case 'customDevtoolsURL':
                updateSetting('customDevtoolsURL', inputs.value['localDevtoolsOptionsSelected'].url)
                break
            case 'chromeNotificationsGeneral':
            case 'chromeNotificationsExternal':
                updateSetting('chromeNotifications', {
                    general: inputs.value.chromeNotificationsGeneral,
                    external: inputs.value.chromeNotificationsExternal,
                })
                break
            default:
                updateSetting(name, inputs.value[name])
        }
    }
}
</script>