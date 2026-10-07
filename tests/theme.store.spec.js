import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { NAV_THEME_ICONS, composeTheme, parseTheme, useThemeStore } from '../src/stores/theme'

const html = () => document.documentElement.getAttribute('data-theme')

/** Wartet auf Vue-Watcher und MutationObserver (beide laufen als Microtask). */
function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/** Simuliert die Systemeinstellung prefers-contrast: more (jsdom hat kein matchMedia); gibt den change-Handler zurück. */
const mediaListeners = {}
function mockPrefersContrast(matches) {
  window.matchMedia = vi.fn((query) => ({
    matches: query === '(prefers-contrast: more)' && matches,
    media: query,
    addEventListener: (type, handler) => { mediaListeners[query] = handler },
    removeEventListener: (type, handler) => { if (mediaListeners[query] === handler) delete mediaListeners[query] }
  }))
}
const fireContrastChange = (matches) => mediaListeners['(prefers-contrast: more)']?.({ matches })

describe('Theme-Store mit Kontrast-Themes', () => {
  let store

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.className = ''
    document.body.className = ''
    document.body.innerHTML = ''
    setActivePinia(createPinia())
  })

  afterEach(() => {
    store?.cleanup()
    delete window.matchMedia
  })

  it('startet ohne Speicher hell und schreibt nur das Schema nach localStorage.theme', () => {
    store = useThemeStore()
    expect(store.theme).toBe('light')
    expect(html()).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
    expect(localStorage.getItem('mp3-converter-contrast')).toBeNull()
  })

  it('fällt bei unbekannten Speicherwerten auf hell zurück', () => {
    localStorage.setItem('theme', 'contrast-dark') // darf dort nie landen; falls doch: nur das Schema übernehmen
    store = useThemeStore()
    expect(store.theme).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')

    store.cleanup()
    localStorage.setItem('theme', 'blau')
    setActivePinia(createPinia())
    store = useThemeStore()
    expect(store.theme).toBe('light')
  })

  it('übernimmt gespeicherte Kontrast-Wahl und Schema', () => {
    localStorage.setItem('theme', 'dark')
    localStorage.setItem('mp3-converter-contrast', '1')
    store = useThemeStore()
    expect(store.theme).toBe('contrast-dark')
    expect(html()).toBe('contrast-dark')
  })

  it('nimmt prefers-contrast: more als Vorauswahl, ohne sie zu persistieren', () => {
    mockPrefersContrast(true)
    store = useThemeStore()
    expect(store.theme).toBe('contrast-light')
    expect(localStorage.getItem('mp3-converter-contrast')).toBeNull()
  })

  it('übernimmt eine geänderte Systemeinstellung live, solange nichts gespeichert ist', async () => {
    mockPrefersContrast(false)
    store = useThemeStore()
    expect(store.theme).toBe('light')

    fireContrastChange(true)
    await flush()
    expect(store.theme).toBe('contrast-light')
    expect(html()).toBe('contrast-light')
    expect(localStorage.getItem('mp3-converter-contrast')).toBeNull()

    fireContrastChange(false)
    await flush()
    expect(store.theme).toBe('light')

    // Nach cleanup hört der Store nicht mehr zu
    store.cleanup()
    expect(mediaListeners['(prefers-contrast: more)']).toBeUndefined()
  })

  it('lässt eine gespeicherte Wahl von der Systemeinstellung unberührt', async () => {
    mockPrefersContrast(false)
    store = useThemeStore()
    store.setContrast(false)
    await flush()
    fireContrastChange(true)
    await flush()
    expect(store.theme).toBe('light')
  })

  it('ignoriert prefers-contrast, wenn der Nutzer den Kontrast schon abgewählt hat', () => {
    mockPrefersContrast(true)
    localStorage.setItem('mp3-converter-contrast', '0')
    store = useThemeStore()
    expect(store.theme).toBe('light')
  })

  it('toggleContrast setzt den Präfix und persistiert nur das Kontrast-Flag', async () => {
    store = useThemeStore()
    store.toggleContrast()
    await flush()
    expect(store.theme).toBe('contrast-light')
    expect(html()).toBe('contrast-light')
    expect(localStorage.getItem('mp3-converter-contrast')).toBe('1')
    expect(localStorage.getItem('theme')).toBe('light')

    store.toggleContrast()
    await flush()
    expect(store.theme).toBe('light')
    expect(localStorage.getItem('mp3-converter-contrast')).toBe('0')
  })

  it('toggleTheme wechselt das Schema und behält den Kontrast', async () => {
    store = useThemeStore()
    store.setContrast(true)
    store.toggleTheme()
    await flush()
    expect(store.theme).toBe('contrast-dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(html()).toBe('contrast-dark')
  })

  it('setTheme akzeptiert alle vier Werte und ignoriert unbekannte', async () => {
    store = useThemeStore()
    store.setTheme('contrast-dark')
    await flush()
    expect(store.scheme).toBe('dark')
    expect(store.highContrast).toBe(true)
    expect(html()).toBe('contrast-dark')

    store.setTheme('unsinn')
    await flush()
    expect(store.theme).toBe('contrast-dark')

    store.setTheme('light')
    await flush()
    expect(store.theme).toBe('light')
  })

  it('übernimmt theme-changed der Navigation und behält den Kontrast', async () => {
    store = useThemeStore()
    store.setContrast(true)
    await flush()
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: 'dark' } }))
    await flush()
    expect(store.theme).toBe('contrast-dark')
    expect(html()).toBe('contrast-dark')
  })

  it('stellt den Kontrast-Präfix wieder her, wenn eine alte Navigation data-theme direkt setzt', async () => {
    store = useThemeStore()
    store.setContrast(true)
    await flush()
    expect(html()).toBe('contrast-light')

    // alte nav.html ohne Event: schreibt nur 'dark' auf <html>
    document.documentElement.setAttribute('data-theme', 'dark')
    await flush()
    expect(store.scheme).toBe('dark')
    expect(html()).toBe('contrast-dark')

    // ... und zurück auf 'light'
    document.documentElement.setAttribute('data-theme', 'light')
    await flush()
    expect(html()).toBe('contrast-light')
  })

  it('setzt bei unbekannten Fremdwerten auf <html> den eigenen Zustand durch', async () => {
    store = useThemeStore()
    document.documentElement.setAttribute('data-theme', 'sepia')
    await flush()
    expect(html()).toBe('light')
  })

  it('reagiert nach cleanup nicht mehr auf Ereignisse', async () => {
    store = useThemeStore()
    store.cleanup()
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: 'dark' } }))
    document.documentElement.setAttribute('data-theme', 'dark')
    await flush()
    expect(store.theme).toBe('light')
    expect(html()).toBe('dark')
  })
})

describe('parseTheme / composeTheme', () => {
  it('zerlegt und baut data-theme-Werte', () => {
    expect(parseTheme('light')).toEqual({ scheme: 'light', highContrast: false })
    expect(parseTheme('contrast-dark')).toEqual({ scheme: 'dark', highContrast: true })
    expect(parseTheme('contrast-')).toBeNull()
    expect(parseTheme(null)).toBeNull()
    expect(composeTheme('dark', true)).toBe('contrast-dark')
    expect(composeTheme('light', false)).toBe('light')
  })
})

describe('Theme-Store: Abgleich wie im Collage Maker (html.dark, body.light-theme, Nav-Icon)', () => {
  let store

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.className = ''
    document.body.className = ''
    document.body.innerHTML = '<span class="global-nav-theme-icon"></span><span class="global-nav-theme-icon" id="globalNavThemeIcon"></span>'
    setActivePinia(createPinia())
  })

  afterEach(() => {
    store?.cleanup()
    delete window.matchMedia
  })

  const icons = () => [...document.querySelectorAll('.global-nav-theme-icon')].map((el) => el.textContent)

  it('hell: body.light-theme, kein html.dark, Mond in allen Nav-Icons', () => {
    store = useThemeStore()
    expect(document.body.classList.contains('light-theme')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(icons()).toEqual([NAV_THEME_ICONS.light, NAV_THEME_ICONS.light])
  })

  it('dunkel: html.dark, kein body.light-theme, Sonne', async () => {
    store = useThemeStore()
    store.toggleTheme()
    await flush()
    expect(html()).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.body.classList.contains('light-theme')).toBe(false)
    expect(icons()).toEqual([NAV_THEME_ICONS.dark, NAV_THEME_ICONS.dark])
  })

  it('Kontrast-Themes: kein body.light-theme (würde die Kontrastwerte überdecken), html.dark nur bei dunkel', async () => {
    store = useThemeStore()
    store.setTheme('contrast-light')
    await flush()
    expect(document.body.classList.contains('light-theme')).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(icons()[0]).toBe(NAV_THEME_ICONS.light)

    store.setTheme('contrast-dark')
    await flush()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(icons()[0]).toBe(NAV_THEME_ICONS.dark)
  })

  it('übernimmt einen Nav-Klick (data-theme direkt gesetzt) samt Klassen und Icon', async () => {
    store = useThemeStore()
    document.documentElement.setAttribute('data-theme', 'dark')
    await flush()
    expect(store.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.body.classList.contains('light-theme')).toBe(false)
    expect(icons()[1]).toBe(NAV_THEME_ICONS.dark)
  })

  it('nutzt Mond und Sonne als Icons', () => {
    expect(NAV_THEME_ICONS).toEqual({ light: '\uD83C\uDF19', dark: '\u2600\uFE0F' })
  })
})
