// src/plugins/vuetify.ts
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#C62828',      // Main red
          secondary: '#D32F2F',    // Lighter red
          accent: '#B71C1C',       // Darker red
          error: '#C62828',        // Red for errors
          warning: '#FF6F00',      // Orange for warnings
          info: '#00897B',         // Teal instead of blue
          success: '#2E7D32',      // Green for success
          background: '#FFFFFF',
          surface: '#FFFFFF',
        }
      }
    }
  }
})

export default vuetify
