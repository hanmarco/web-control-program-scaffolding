import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import './style.css'
import App from './App.vue'
import vuetifyWebKitFixes from './plugins/vuetify-webkit-fix'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FB8C00',
        },
      },
    },
  },
  // WebKit compatibility settings
  defaults: {
    VBtn: {
      // Ensure consistent button rendering
      elevation: 0,
      ripple: false, // Disable ripple for better WebKit performance
    },
    VCard: {
      elevation: 1,
    },
    VTextField: {
      // Optimize input rendering for WebKit
      variant: 'outlined',
      hideDetails: 'auto',
    },
    VSelect: {
      variant: 'outlined',
      hideDetails: 'auto',
    },
    VMenu: {
      // Improve menu rendering
      closeOnContentClick: false,
      transition: 'fade-transition',
    },
  },
  // Display options for better WebKit compatibility
  display: {
    mobileBreakpoint: 'sm',
    thresholds: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1264,
      xl: 1904,
    },
  },
})

const pinia = createPinia()

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(vuetify)

app.mount('#app')

// Apply WebKit compatibility fixes for Tauri after mount
setTimeout(() => {
  // Diagnose theme first (always helpful) and then apply fixes if running in Tauri
  try {
    vuetifyWebKitFixes.diagnoseTheme()
  } catch (e) {
    console.warn('Theme diagnosis failed:', e)
  }

  // Check if running in Tauri and apply fixes
  if (vuetifyWebKitFixes.checkCompatibility()) {
    console.log('Applying Vuetify WebKit compatibility fixes...')
    vuetifyWebKitFixes.applyFixes()
    vuetifyWebKitFixes.monitorPerformance()
  }
}, 100)

