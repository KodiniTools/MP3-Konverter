import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useConverterStore } from '../src/stores/converter'

const API_DELETE_URL = '/mp3konverter/api/converted'

/** Wartet, bis die im Store angestoßenen Microtasks durchgelaufen sind. */
function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/** Legt ein konvertiertes Ergebnis an, wie es convertFile() erzeugen würde. */
function pushResult(store, overrides = {}) {
  store.convertedFiles.push({
    name: 'ROCK 1.mp3',
    blob: new Blob(['audio'], { type: 'audio/mpeg' }),
    size: 5,
    serverFile: 'ROCK_1-abc123.mp3',
    deleteToken: 'tok-1',
    ...overrides
  })
}

/** Simuliert einen erfolgreichen Speichern-Dialog (File System Access API). */
function mockSaveFilePicker() {
  const writable = { write: vi.fn(), close: vi.fn() }
  window.showSaveFilePicker = vi.fn(async () => ({
    name: 'ROCK 1.mp3',
    createWritable: async () => writable
  }))
  return writable
}

describe('Cleanup konvertierter Dateien', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useConverterStore()
    store.showProgress = true
    store.progress = 100
    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }))
    delete window.showSaveFilePicker
  })

  it('entfernt Eintrag, Serverdatei und Fortschrittsbalken nach dem Speichern', async () => {
    const writable = mockSaveFilePicker()
    pushResult(store)

    await store.saveConvertedFile(0)
    await flush()

    expect(writable.close).toHaveBeenCalledOnce()
    expect(store.convertedFiles).toHaveLength(0)
    expect(store.showProgress).toBe(false)
    expect(store.progress).toBe(0)
    expect(fetch).toHaveBeenCalledWith(
      `${API_DELETE_URL}/ROCK_1-abc123.mp3?token=tok-1`,
      { method: 'DELETE', keepalive: false }
    )
  })

  it('hält den Fortschrittsbalken, solange noch Ergebnisse offen sind', async () => {
    mockSaveFilePicker()
    pushResult(store)
    pushResult(store, { name: 'ROCK 2.mp3', serverFile: 'ROCK_2-def456.mp3', deleteToken: 'tok-2' })

    await store.saveConvertedFile(0)
    await flush()

    expect(store.convertedFiles).toHaveLength(1)
    expect(store.convertedFiles[0].serverFile).toBe('ROCK_2-def456.mp3')
    expect(store.showProgress).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('entfernt den Eintrag auch, wenn der Server-Cleanup fehlschlägt', async () => {
    mockSaveFilePicker()
    globalThis.fetch = vi.fn(async () => {
      throw new Error('network down')
    })
    pushResult(store)

    await expect(store.saveConvertedFile(0)).resolves.toBeUndefined()
    await flush()

    expect(store.convertedFiles).toHaveLength(0)
    expect(store.showProgress).toBe(false)
  })

  it('behält den Eintrag, wenn der Nutzer den Speichern-Dialog abbricht', async () => {
    const abortError = new Error('abort')
    abortError.name = 'AbortError'
    window.showSaveFilePicker = vi.fn(async () => {
      throw abortError
    })
    pushResult(store)

    await store.saveConvertedFile(0)
    await flush()

    expect(store.convertedFiles).toHaveLength(1)
    expect(store.showProgress).toBe(true)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('löscht die Serverdatei auch beim manuellen Verwerfen', async () => {
    pushResult(store)

    store.removeConvertedFile(0)
    await flush()

    expect(store.convertedFiles).toHaveLength(0)
    expect(fetch).toHaveBeenCalledWith(
      `${API_DELETE_URL}/ROCK_1-abc123.mp3?token=tok-1`,
      { method: 'DELETE', keepalive: false }
    )
  })

  it('räumt beim Verlassen der Seite alle Ergebnisse mit keepalive auf', async () => {
    pushResult(store)
    pushResult(store, { name: 'ROCK 2.mp3', serverFile: 'ROCK_2-def456.mp3', deleteToken: 'tok-2' })

    store.cleanupOnUnload()
    await flush()

    expect(store.convertedFiles).toHaveLength(0)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).toHaveBeenLastCalledWith(
      `${API_DELETE_URL}/ROCK_2-def456.mp3?token=tok-2`,
      { method: 'DELETE', keepalive: true }
    )
  })

  it('sendet keinen zweiten DELETE-Request für denselben Eintrag', async () => {
    pushResult(store)
    const item = store.convertedFiles[0]

    store.removeConvertedFile(0)
    await flush()
    // Zweiter Versuch auf dem bereits entfernten Eintrag
    store.convertedFiles.push(item)
    store.removeConvertedFile(0)
    await flush()

    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('ignoriert Ergebnisse ohne Delete-Token (älteres Backend)', async () => {
    pushResult(store, { serverFile: 'ROCK_1-abc123.mp3', deleteToken: null })

    store.removeConvertedFile(0)
    await flush()

    expect(store.convertedFiles).toHaveLength(0)
    expect(fetch).not.toHaveBeenCalled()
  })
})
