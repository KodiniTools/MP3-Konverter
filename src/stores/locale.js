import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import i18n from '../i18n'
import { syncNavLangButtons, translateSsiNav } from './ssiNavTranslations'
import { applyLocaleHead, resolveInitialLocale } from '../utils/localeSeo'

export const SITE_URL = 'https://kodinitools.com/mp3konverter/'

/** Titel und Beschreibung je Sprache (Deutsch steht zusätzlich statisch in index.html). */
export const PAGE_META = {
  de: {
    title: 'MP3 Konverter online – WAV, FLAC, M4A in MP3 umwandeln | KodiniTools',
    description:
      'Audiodateien kostenlos in MP3 umwandeln: WAV, FLAC, M4A, OGG und AAC bis 100 MB. Ohne Registrierung, Verarbeitung auf DSGVO-konformen Servern.'
  },
  en: {
    title: 'Online MP3 Converter – Convert WAV, FLAC, M4A to MP3 | KodiniTools',
    description:
      'Convert audio files to MP3 for free: WAV, FLAC, M4A, OGG and AAC up to 100 MB. No sign-up, processed on GDPR-compliant servers.'
  }
}

/** Sprachen der App und der globalen Navigation. */
export const LOCALES = ['de', 'en']

function readStorage(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Speicher gesperrt (z. B. Privatmodus): Sprache gilt dann nur für diese Sitzung
  }
}

/**
 * Locale-Store.
 *
 * `localStorage.locale` teilt sich die App mit der globalen Navigation und allen KodiniTools-Seiten.
 * Abgleich mit den SSI-Partials wie im Collage Maker: Sprachbuttons (active), Texte der Navigation
 * (data-i18n), Event `locale-changed` der Navigation. Zusätzlich wie bisher: Klicks auf die
 * Sprachbuttons (für Navigationen ohne Event) und Elemente mit data-lang-de/-en.
 */
export const useLocaleStore = defineStore('locale', () => {
  // ?lang=de|en (hreflang-Ziel) hat Vorrang vor der gespeicherten Sprache, sonst Deutsch
  const locale = ref(resolveInitialLocale(globalThis.location?.search ?? '', readStorage('locale')))

  watch(
    locale,
    (newLocale) => {
      writeStorage('locale', newLocale)
      applyLocaleHead(SITE_URL, newLocale, PAGE_META[newLocale])
      i18n.global.locale.value = newLocale

      syncNavLangButtons(newLocale)
      translateSsiNav(newLocale)

      // SSI-Elemente nach dem Muster data-lang-de / data-lang-en
      document.querySelectorAll(`[data-lang-${newLocale}]`).forEach((el) => {
        el.textContent = el.getAttribute(`data-lang-${newLocale}`)
      })
    },
    { immediate: true }
  )

  // Event der globalen Navigation (locale-changed, detail.locale = 'de' | 'en')
  function onLocaleChanged(event) {
    const newLocale = event.detail?.locale
    if (LOCALES.includes(newLocale) && newLocale !== locale.value) {
      locale.value = newLocale
    }
  }

  // Klicks auf die Sprachbuttons der Navigation (Event-Delegation, auch ohne locale-changed)
  function handleNavLangClick(event) {
    const btn = event.target.closest?.('.global-nav-lang-btn')
    if (!btn) return
    const newLocale = btn.getAttribute('data-lang')
    if (LOCALES.includes(newLocale) && newLocale !== locale.value) {
      locale.value = newLocale
    }
  }

  window.addEventListener('locale-changed', onLocaleChanged)
  document.addEventListener('click', handleNavLangClick)

  function setLocale(newLocale) {
    if (LOCALES.includes(newLocale)) {
      locale.value = newLocale
    }
  }

  function cleanup() {
    window.removeEventListener('locale-changed', onLocaleChanged)
    document.removeEventListener('click', handleNavLangClick)
  }

  return {
    locale,
    setLocale,
    cleanup
  }
})
