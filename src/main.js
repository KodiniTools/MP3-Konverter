import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import i18n from './i18n'
import './assets/styles/main.scss'

// Create Vue App
const app = createApp(App)

// Use Plugins
app.use(createPinia())
app.use(i18n)

// Mount App
app.mount('#app')

console.log('🎵 MP3 Konverter Vue App gestartet')
