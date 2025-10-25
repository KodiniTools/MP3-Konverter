import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import './assets/styles/main.scss'

// Translations
import de from './locales/de.json'
import en from './locales/en.json'

// i18n Setup
const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('preferred-language') || 'de',
  fallbackLocale: 'en',
  messages: {
    de,
    en
  }
})

// Create Vue App
const app = createApp(App)

// Use Plugins
app.use(createPinia())
app.use(i18n)

// Mount App
app.mount('#app')

console.log('🎵 MP3 Konverter Vue App gestartet')
