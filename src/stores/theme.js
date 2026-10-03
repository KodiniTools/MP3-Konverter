import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

/**
 * Theme-Store.
 *
 * Zwei Dimensionen, ein Attribut:
 * - Schema `light` | `dark` – liegt in `localStorage.theme`. Diesen Schlüssel teilen sich die globale
 *   Navigation (nav.html) und alle KodiniTools-Seiten; er darf nur `light`/`dark` enthalten.
 * - Kontrast an/aus – liegt in `localStorage[CONTRAST_STORAGE_KEY]`, nur für diese App. Andere Seiten
 *   kennen die Kontrast-Themes nicht und würden mit `data-theme="contrast-dark"` ungestylt dastehen.
 *
 * Zusammengesetzt ergibt das `data-theme` auf `<html>`: `light`, `dark`, `contrast-light`, `contrast-dark`
 * (alle vier stylt main.scss).
 */

/** Farbschemata, die nav.html kennt. */
export const SCHEMES = ['light', 'dark']
/** Alle gültigen data-theme-Werte. */
export const THEMES = ['light', 'dark', 'contrast-light', 'contrast-dark']

const SCHEME_STORAGE_KEY = 'theme'
const CONTRAST_STORAGE_KEY = 'mp3-converter-contrast'
const CONTRAST_PREFIX = 'contrast-'

/**
 * Zerlegt einen data-theme-Wert in Schema und Kontrast-Flag.
 * @param {unknown} value
 * @returns {{ scheme: 'light' | 'dark', highContrast: boolean } | null} null bei unbekannten Werten
 */
export function parseTheme(value) {
  if (typeof value !== 'string') return null
  const highContrast = value.startsWith(CONTRAST_PREFIX)
  const scheme = highContrast ? value.slice(CONTRAST_PREFIX.length) : value
  return SCHEMES.includes(scheme) ? { scheme, highContrast } : null
}

/** Baut aus Schema und Kontrast-Flag den data-theme-Wert. */
export function composeTheme(scheme, highContrast) {
  return highContrast ? `${CONTRAST_PREFIX}${scheme}` : scheme
}

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
    // Speicher gesperrt (z. B. Privatmodus): Theme gilt dann nur für diese Sitzung
  }
}

function mediaMatches(query) {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches
}

export const useThemeStore = defineStore('theme', () => {
  // Schema: gespeicherter Wert (nav.html schreibt 'light' | 'dark'), unbekannte Werte fallen auf 'light'
  const storedScheme = parseTheme(readStorage(SCHEME_STORAGE_KEY))
  const scheme = ref(storedScheme ? storedScheme.scheme : 'light')

  // Kontrast: eigene Entscheidung des Nutzers, sonst die Systemeinstellung (prefers-contrast: more)
  const storedContrast = readStorage(CONTRAST_STORAGE_KEY)
  const highContrast = ref(storedContrast === null ? mediaMatches('(prefers-contrast: more)') : storedContrast === '1')

  const theme = computed(() => composeTheme(scheme.value, highContrast.value))

  function applyTheme() {
    if (typeof document === 'undefined') return
    if (document.documentElement.getAttribute('data-theme') !== theme.value) {
      document.documentElement.setAttribute('data-theme', theme.value)
    }
  }

  watch(theme, applyTheme, { immediate: true })
  watch(scheme, (value) => writeStorage(SCHEME_STORAGE_KEY, value), { immediate: true })
  // Kontrast nur persistieren, wenn der Nutzer ihn aktiv ändert; bis dahin entscheidet die Systemeinstellung
  watch(highContrast, (value) => writeStorage(CONTRAST_STORAGE_KEY, value ? '1' : '0'))

  /**
   * Externe Änderung an `<html data-theme>` übernehmen. nav.html setzt dort 'light' | 'dark' ohne
   * Kontrast-Präfix; der Präfix wird hier wiederhergestellt, das Schema übernommen.
   */
  function syncFromDocument() {
    const parsed = parseTheme(document.documentElement.getAttribute('data-theme'))
    if (!parsed) {
      applyTheme()
      return
    }
    if (parsed.scheme !== scheme.value) {
      scheme.value = parsed.scheme
    }
    if (parsed.highContrast !== highContrast.value) {
      applyTheme()
    }
  }

  // Event der globalen Navigation (theme-changed, detail.theme = 'light' | 'dark')
  function handleThemeChanged(event) {
    const parsed = parseTheme(event.detail?.theme)
    if (parsed && parsed.scheme !== scheme.value) {
      scheme.value = parsed.scheme
    }
  }

  // Fallback für Nav-Versionen ohne Event: Attribut auf <html> beobachten
  let observer = null
  if (typeof window !== 'undefined') {
    window.addEventListener('theme-changed', handleThemeChanged)
    if (typeof MutationObserver === 'function' && typeof document !== 'undefined') {
      observer = new MutationObserver(() => {
        if (document.documentElement.getAttribute('data-theme') !== theme.value) {
          syncFromDocument()
        }
      })
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    }
  }

  // Actions
  function toggleTheme() {
    scheme.value = scheme.value === 'light' ? 'dark' : 'light'
  }

  /** Akzeptiert alle vier data-theme-Werte; unbekannte werden ignoriert. */
  function setTheme(value) {
    const parsed = parseTheme(value)
    if (!parsed) return
    scheme.value = parsed.scheme
    highContrast.value = parsed.highContrast
  }

  function toggleContrast() {
    highContrast.value = !highContrast.value
  }

  function setContrast(enabled) {
    highContrast.value = Boolean(enabled)
  }

  function cleanup() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('theme-changed', handleThemeChanged)
    }
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  return {
    theme,
    scheme,
    highContrast,
    toggleTheme,
    setTheme,
    toggleContrast,
    setContrast,
    cleanup
  }
})
