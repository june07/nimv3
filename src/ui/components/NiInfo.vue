<template>
    <v-expansion-panels :model-value="panels">
        <v-expansion-panel elevation="0" value="info">
            <template v-slot:title>
                <div class="text-truncate">{{ JSON.stringify(info) }}</div>
            </template>
            <template v-slot:text>
                <div class="mt-2">
                    <v-row v-for="(value, name) of info" :key="name">
                        <v-col cols="2" class="pa-0 text-truncate font-weight-bold text-body-2 text-end">{{ name }}</v-col>
                        <v-col class="pa-0 ml-2 text-truncate text-body-2">{{ value }}</v-col>
                    </v-row>
                </div>
            </template>
        </v-expansion-panel>
    </v-expansion-panels>
</template>
<style scoped>
:deep .v-expansion-panel-title {
    min-height: unset;
}
</style>
<script setup>
import { reactive } from "vue";

let panels = reactive([]);

const props = defineProps({
    info: Object,
    expanded: Boolean,
});

if (props.expanded) {
    panels.push("info");
}
</script>
