<template>
    <v-overlay class="d-flex justify-center align-center">
        <v-card color="rgba(255,255,255,0.95)" width="790" class="pt-4 px-4">
            <v-card-title class="text-uppercase font-weight-bold" :class="theme === 'dark' ? 'text-black' : ''">{{ i18nString('donationModalHeader') }}!</v-card-title>
            <v-card-subtitle :class="theme === 'dark' ? 'text-black' : ''">Help make my open source career possible.</v-card-subtitle>
            <v-card-text class="text-body-1" :class="theme === 'dark' ? 'text-black' : ''">
                You can help and directly support this project using the methods below.
            </v-card-text>
            <v-row class="d-flex align-center">
                <v-col class="ma-2">
                    <v-sheet color="green-lighten-1" rounded="xl">
                        <v-row class="d-flex align-center">
                            <v-col class="d-flex justify-center">
                                <div class="text-h4 text-center text-capitalize">recurring pledges</div>
                            </v-col>
                        </v-row>
                        <v-row class="d-flex align-center">
                            <v-col class="d-flex justify-center">
                                <a name="github" class="donate-button" href="https://github.com/sponsors/june07" target="_blank" @click="clickHandler">
                                    <v-img contain width="150" :src="imageGithub" />
                                </a>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col class="d-flex justify-center">
                                <div>
                                    <a name="paypal-recurring" href="https://www.paypal.com/donate/?hosted_button_id=CKAXEZWZDP8DC" target="_blank" rel="noreferrer" @click="clickHandler">
                                        <v-img contain width="150" :src="imagePaypalLarge" alt="PayPal - The safer, easier way to pay online!" />
                                    </a>
                                </div>
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
                                    <a name="paypal-one-time" href="https://www.paypal.com/donate/?hosted_button_id=CKAXEZWZDP8DC" target="_blank" rel="noreferrer" @click="clickHandler">
                                        <v-img contain width="100" :src="imagePaypalSmall" alt="PayPal - The safer, easier way to pay online!" />
                                    </a>
                                </div>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col class="mx-4">
                                <v-text-field name="bitcoin" hint="click to copy" persistent-hint density="compact" variant="outlined" :value="bitcoinAddress" @click="(event) => clipboard.copy(bitcoinAddress) && clickHandler(event)">
                                    <v-tooltip class="d-flex justify-center align-center" text="copied bitcoin address" v-model="clipboard.tooltips[`${bitcoinAddress}`]" open-on-click attach></v-tooltip>
                                    <template v-slot:details>
                                        <span class="font-weight-bold text-body-1">bitcoin</span>
                                    </template>
                                </v-text-field>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col class="mx-4">
                                <v-text-field name="ethereum" hint="click to copy" persistent-hint density="compact" variant="outlined" :value="ethAddress" @click="(event) => clipboard.copy(ethAddress) && clickHandler(event)">
                                    <v-tooltip class="d-flex justify-center align-center" text="copied ethereum address" v-model="clipboard.tooltips[`${ethAddress}`]" open-on-click attach></v-tooltip>
                                    <template v-slot:details>
                                        <span class="font-weight-bold text-body-1">ethereum</span>
                                    </template>
                                </v-text-field>
                            </v-col>
                        </v-row>
                    </v-sheet>
                </v-col>
            </v-row>
            <v-row>
                <v-col cols="6">
                    <div class="text-h5 text-center text-uppercase" :class="theme === 'dark' ? 'text-black' : ''">{{ i18nString('thankyou') }}🙏</div>
                </v-col>
            </v-row>
            <v-card-actions class="d-flex justify-end pb-0">
                <v-btn variant="plain" density="compact" @click="$emit('close')" :class="theme === 'dark' ? 'text-black' : ''">close</v-btn>
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
import { inject } from "vue"
import imageGithub from '/image/GitHub_Logo.png'
import imagePaypalSmall from '/image/PP_logo_h_100x26.png'
import imagePaypalLarge from '/image/PP_logo_h_150x38.png'
import googleAnalytics from '../../google-analytics-es6.js'

const props = defineProps({
    theme: String
})

function clickHandler(event) {
    const { name } = event.target

    googleAnalytics.fireEvent('Donation Event', { 'action': name })
    googleAnalytics.fireEvent('click_button', { id: event.target.id })
}
const ethAddress = "0x69F3C9210091A0E5cb7D01459683447173D4BDDA"
const bitcoinAddress = "bc1q4kwrjnx3h0v894vlp6d9l3efwv0jtddnjukrpm"
const clipboard = inject("clipboard")
const i18nString = inject("i18nString")
</script>
