<template>
    <v-overlay class="d-flex justify-center align-center">
        <v-card color="rgba(255,255,255,0.95)" width="790" class="pt-4 px-4">
            <v-card-title class="text-uppercase font-weight-bold" :class="theme === 'dark' ? 'text-black' : ''">{{ i18nString('optionsNotifications') }}</v-card-title>
            <v-card-text class="text-body-1" :class="theme === 'dark' ? 'text-black' : ''">
                <span v-if="props.messages?.length">You have {{ unread?.length }} unread notifications.</span>
                <span v-else>{{ i18nString('noNotifications') }}</span>
            </v-card-text>
            <v-virtual-scroll height="440" :items="messages">
                <template v-slot:default="{ item }">
                    <v-list-item :key="item.received" :subtitle="item.subtitle">
                        <template v-slot:prepend>
                            <v-icon size="x-small">
                                <span class="material-icons-outlined small-icon">{{ !item.read ? 'mark_email_unread' : 'email' }}</span>
                            </v-icon>
                        </template>
                        <template v-slot:default>
                            <v-expansion-panels>
                                <v-expansion-panel elevation="0" bg-color="" :title="item.title" :text="item.content" @click="emit('read', item)">
                                </v-expansion-panel>
                            </v-expansion-panels>
                        </template>
                        <template v-slot:append>
                            <v-hover>
                                <template v-slot:default="{ isHovering, props }">
                                    <v-btn icon size="x-small" variant="plain" @click="deleteMessageHandler(item)">
                                        <v-icon v-bind="props" size="x-small" :color="isHovering ? 'green' : undefined"><span class="material-icons-outlined small-icon">check</span></v-icon>
                                    </v-btn>
                                </template>
                            </v-hover>
                        </template>
                    </v-list-item>
                </template>
            </v-virtual-scroll>
            <v-card-actions class="d-flex justify-end pb-0">
                <v-btn variant="plain" density="compact" @click="$emit('close')" :class="theme === 'dark' ? 'text-black' : ''">close</v-btn>
            </v-card-actions>
        </v-card>
    </v-overlay>
</template>
<style scoped>
:deep .v-expansion-panel-title {
    min-height: unset;
    padding-top: 4px;
    padding-bottom: 4px;
}

.logo {
    background-color: white;
    border-radius: 12px;
}
</style>
<script setup>
import { inject, computed } from "vue"

const extensionId = inject("extensionId")

const emit = defineEmits(["read", "deleted"])
const props = defineProps({
    theme: String,
    messages: Array,
})
const unread = computed(() =>
    props.messages.filter((message) => !message.read)
)
async function deleteMessageHandler(message) {
    await chrome.runtime.sendMessage(extensionId, {
        command: "deleteNotification",
        message
    })
    googleAnalytics.fireEvent("Delete Message Event", { action: message })
    emit("deleted", message)
}
const i18nString = inject("i18nString")
</script>
