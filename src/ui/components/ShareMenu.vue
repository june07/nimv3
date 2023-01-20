<template>
    <v-menu>
        <template v-slot:activator="{ props }">
            <v-btn text v-bind="props" variant="flat" class="rounded-xl" :size="size" :icon="icon" :color="color">
                <slot></slot>
            </v-btn>
        </template>
        <v-list class="rounded-xl">
            <v-list-item v-for="type in data.networks" :key="type.network" dense>
                <ShareNetwork url="https://june07.com/nim" :network="type.network" :title="data.sharing.title" :description="data.sharing.description" :quote="data.sharing.quote" :hashtags="data.sharing.hashtags" :twitterUser="data.sharing.twitterUser">
                    <v-icon class="mr-2" :color="type.color">
                        <span class="material-icons small-icon">{{ type.icon }}</span>
                    </v-icon>
                    <span>{{ type.name }}</span>
                </ShareNetwork>
            </v-list-item>
        </v-list>
    </v-menu>
</template>
<style scoped>
a {
    text-decoration: none !important;
}
</style>
<script setup>
const props = defineProps({
    copy: String,
    size: String,
    icon: Boolean,
    color: String,
});
const data = {
    sharing: {
        title: "Node.js V8 --inspector Manager (NiM) is a great developer tool!",
        description: `Streamline your Node.js debugging workflow with Chromium (Chrome, Edge, More) DevTools.`,
        quote: `NiM > about://inspect.`,
        hashtags: "node, extension, debug, chromium, inspect, devtool, vscode",
        twitterUser: "june07",
    },
    networks: [
        {
            network: "email",
            name: "Email",
            icon: "email",
            color: "#333333",
        },
        {
            network: "facebook",
            name: "Facebook",
            icon: "facebook",
            color: "#1877f2",
        },
        {
            network: "sms",
            name: "SMS",
            icon: "sms",
            color: "#333333",
        },
        {
            network: "twitter",
            name: "Twitter",
            icon: '',
            color: "#1da1f2",
        },
        {
            network: "whatsapp",
            name: "Whatsapp",
            icon: '',
            color: "#25d366",
        },
    ],
};
</script>
