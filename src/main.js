import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import i18n from './i18n'
// Design-Tokens v2 (--ds-*, gemeinsam mit Collage Maker und Playlist Generator), danach die
// Kontrast-Erweiterung dieser App, danach die Styles, die beide nutzen
import './design-system/tokens-v2.css'
import './design-system/tokens-contrast.css'
import './assets/styles/main.scss'

// Create Vue App
const app = createApp(App)

// Use Plugins
app.use(createPinia())
app.use(i18n)

// Mount App
app.mount('#app')

console.log('🎵 MP3 Konverter Vue App gestartet')
