import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { composeTheme, parseTheme, useThemeStore } from '../src/stores/theme'

const html = () => document.documentElement.getAttribute('data-theme')

/** Wartet auf Vue-Watcher und MutationObserver (beide laufen als Microtask). */
function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/** Simuliert die Systemeinstellung prefers-contrast: more (jsdom hat kein matchMedia). */
function mockPrefersContrast(matches) {
  window.matchMedia = vi.fn((query) => ({
    matches: query === '(prefers-contrast: more)' && matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {}
  }))
}

describe('Theme-Store mit Kontrast-Themes', () => {
  let store

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
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
