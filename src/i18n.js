import { createI18n } from 'vue-i18n'
import de from './locales/de.json'
import en from './locales/en.json'
import { resolveInitialLocale } from './utils/localeSeo'

function readLocale() {
  try {
    return localStorage.getItem('locale')
  } catch {
    return null
  }
}

const i18n = createI18n({
  legacy: false,
  // ?lang=en (hreflang-Ziel) hat Vorrang; der Locale-Store speichert das Ergebnis
  locale: resolveInitialLocale(globalThis.location?.search ?? '', readLocale()),
  fallbackLocale: 'en',
  messages: {
    de,
    en
  }
})

export default i18n
