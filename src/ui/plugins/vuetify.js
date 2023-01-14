/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
//import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'
import { VVirtualScroll } from 'vuetify/labs/VVirtualScroll'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  components: {
    VVirtualScroll
  },
  theme: {
    themes: {
      light: {
        colors: {
          primary: '#4CAF50',
          secondary: '#5CBBF6',
        },
      },
    },
  }
})
