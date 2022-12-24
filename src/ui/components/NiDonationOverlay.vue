<template>
    <v-overlay v-model="modelValue" class="d-flex justify-center align-center">
        <v-card color="rgba(255,255,255,0.95)" width="790" class="pt-4 px-4">
            <v-card-title class="text-uppercase font-weight-bold">{{ i18nString('donationModalHeader') }}!</v-card-title>
            <v-card-subtitle>Help make my open source career possible.</v-card-subtitle>
            <v-card-text class="text-body-1">
                You can help and directly support this project using the methods below.
                <div class="text-h6 text-end text-uppercase mr-4">{{ i18nString('thankyou') }}🙏</div>
            </v-card-text>
            <v-row class="d-flex align-center">
                <v-col class="ma-2">
                    <v-sheet color="green-lighten-1" rounded="xl">
                        <div class="text-h5 text-center text-capitalize py-4">recurring pledges</div>
                        <v-row class="d-flex align-center">
                            <v-col class="d-flex justify-center">
                                <a class="donate-button" href="https://github.com/sponsors/june07" target="_blank">
                                    <v-img class="logo pa-6" contain width="100" src="/image/GitHub_Logo.png" />
                                </a>
                            </v-col>
                        </v-row>
                    </v-sheet>
                </v-col>
                <v-col class="ma-2">
                    <v-sheet color="green-lighten-2" rounded="xl">
                        <div class="text-h5 text-center text-capitalize py-4">one-time donations</div>
                        <v-row>
                            <v-col class="d-flex justify-center">
                                <div>
                                    <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank">
                                        <input type="hidden" name="cmd" value="_s-xclick">
                                        <input type="hidden" name="hosted_button_id" value="YNAGPPBM6R8EU">
                                        <input type="image" src="https://www.paypalobjects.com/webstatic/en_US/i/btn/png/silver-rect-paypal-44px.png" name="submit" alt="PayPal - The safer, easier way to pay online!">
                                        <img alt="" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">
                                    </form>
                                </div>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col class="mx-4">
                                <v-text-field hint="click to copy" persistent-hint density="compact" variant="solo" :value="bitcoinAddress" @click="clipboard.copy(bitcoinAddress)">
                                    <v-tooltip class="d-flex justify-center align-center" text="copied bitcoin address" v-model="clipboard.tooltips[`${bitcoinAddress}`]" open-on-click attach></v-tooltip>
                                    <template v-slot:details>
                                        <span class="font-weight-bold">bitcoin</span>
                                    </template>
                                </v-text-field>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col class="mx-4">
                                <v-text-field hint="click to copy" persistent-hint density="compact" variant="solo" :value="ethAddress" @click="clipboard.copy(ethAddress)">
                                    <v-tooltip class="d-flex justify-center align-center" text="copied ethereum address" v-model="clipboard.tooltips[`${ethAddress}`]" open-on-click attach></v-tooltip>
                                    <template v-slot:details>
                                        <span class="font-weight-bold">ethereum</span>
                                    </template>
                                </v-text-field>
                            </v-col>
                        </v-row>
                    </v-sheet>
                </v-col>
            </v-row>
            <v-card-actions class="d-flex justify-end pb-0">
                <v-btn variant="plain" density="compact" @click="$emit('close')">close</v-btn>
            </v-card-actions>
        </v-card>
    </v-overlay>
</template>
<style scoped>
.logo {
    background-color: white;
    border-radius: 12px;
}
:deep() #bitcoin.v-field__input {
    padding-top: 0;
    padding-bottom: 0;
}
</style>
<script setup>
import { inject } from "vue";

const ethAddress = "0x69F3C9210091A0E5cb7D01459683447173D4BDDA";
const bitcoinAddress = "bc1q4kwrjnx3h0v894vlp6d9l3efwv0jtddnjukrpm";
const clipboard = inject("clipboard");
const i18nString = inject("i18nString");
</script>
