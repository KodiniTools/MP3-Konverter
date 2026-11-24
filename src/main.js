import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import i18n from './i18n'
import { createAppRouter } from './router'
import { useLocaleStore } from './stores/locale'
// Design-Tokens v2 (--ds-*, gemeinsam mit Collage Maker und Playlist Generator), danach die
// Kontrast-Erweiterung dieser App, die Landing-Tokens des Playlist Generators, danach die Styles, die beide nutzen
import './design-system/tokens-v2.css'
import './design-system/tokens-contrast.css'
// Landing-Tokens, die nur der Playlist Generator hat (Buttons, Hintergrund, Karten)
import './design-system/tokens-playlist-generator.css'
import './assets/styles/main.scss'

// Create Vue App
const app = createApp(App)
const router = createAppRouter()

// Use Plugins
app.use(createPinia())
app.use(i18n)
app.use(router)

// Titel, Beschreibung und Canonical folgen der aktuellen Seite (Landingpage oder /app/)
router.afterEach((to) => {
  useLocaleStore().setPage(to.meta.page)
})

// Mount App
app.mount('#app')

console.log('🎵 MP3 Konverter Vue App gestartet')
