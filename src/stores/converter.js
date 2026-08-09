import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useConverterStore = defineStore('converter', () => {
  // State
  const files = ref([])
  const settings = ref({
    codec: 'libmp3lame',
    bitrate: '192k',
    format: 'mp3'
  })

  const isConverting = ref(false)
  const isProcessingFile = ref(false) // Für Shimmer-Animation während einzelner Datei
  const progress = ref(0)
  const showProgress = ref(false)
  const statusMessage = ref('Bereit - Wählen Sie Audiodateien aus')
  const statusType = ref('info')
  const showRetry = ref(false)
  const filesCompleted = ref(0)
  // True, sobald der Nutzer auf Abbrechen geklickt hat (bis der Lauf endet)
  const isCancelling = ref(false)

  // Konvertierte Ergebnisse, die der Nutzer per Speichern-Dialog sichern kann
  // Aufbau je Eintrag: { name, blob, size, saved }
  const convertedFiles = ref([])

  // ===== Playlist / Player State =====
  // Index der aktuell im Sticky-Player geladenen Datei (null = keine)
  const currentTrackIndex = ref(null)
  // Ob die aktuelle Datei gerade abgespielt wird
  const isPlaying = ref(false)

  // Aktuell geladener Track (File-Objekt oder null)
  const currentTrack = computed(() => {
    if (currentTrackIndex.value === null) return null
    return files.value[currentTrackIndex.value] || null
  })

  // Audio Context für Erfolgston
  let audioContext = null

  // Steuert den Abbruch des laufenden Konvertierungslaufs
  let abortController = null

  // Timer, um kurzlebige Statusmeldungen (z. B. "abgebrochen") auszublenden
  let statusClearTimer = null

  // Erfolgston abspielen
  function playSuccessSound() {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)()
      }

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2)

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.4)
    } catch (e) {
      console.log('Audio nicht verfügbar:', e)
    }
  }

  // Browser-Benachrichtigung anzeigen
  async function showNotification(title, body) {
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body, icon: '🎵' })
        } else if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission()
          if (permission === 'granted') {
            new Notification(title, { body, icon: '🎵' })
          }
        }
      }
    } catch (e) {
      console.log('Benachrichtigungen nicht verfügbar:', e)
    }
  }

  // Backend API Base URL - KORRIGIERT für /mp3konverter/api/
  const API_BASE = '/mp3konverter/api'

  // Computed
  const outputFormat = computed(() => {
    const formatMap = {
      'libmp3lame': { format: 'MP3', codec: 'LAME MP3', ext: 'mp3' },
      'aac': { format: 'AAC', codec: 'AAC', ext: 'aac' }
    }
    return formatMap[settings.value.codec] || formatMap['libmp3lame']
  })

  // Actions
  function addFiles(newFiles) {
    const audioFiles = newFiles.filter(file => 
      file.type.startsWith('audio/') || 
      /\.(mp3|wav|ogg|m4a|flac|aac|wma)$/i.test(file.name)
    )

    if (audioFiles.length === 0) {
      updateStatus('Keine gültigen Audio-Dateien ausgewählt', 'warning')
      return
    }

    files.value = [...files.value, ...audioFiles]
    updateStatus(`${files.value.length} Datei(en) ausgewählt`, 'info')
    console.log(`✅ ${audioFiles.length} Audio-Dateien hinzugefügt`)
  }

  function removeFile(index) {
    files.value.splice(index, 1)

    // Player-Zustand an die veränderte Liste anpassen
    if (currentTrackIndex.value !== null) {
      if (index === currentTrackIndex.value) {
        // Der aktuell geladene Track wurde entfernt -> Player stoppen
        stopPlayback()
      } else if (index < currentTrackIndex.value) {
        // Ein Track vor dem aktuellen wurde entfernt -> Index nachziehen
        currentTrackIndex.value -= 1
      }
    }

    if (files.value.length === 0) {
      updateStatus('Keine Dateien ausgewählt', 'info')
    } else {
      updateStatus(`${files.value.length} Datei(en) ausgewählt`, 'info')
    }
  }

  // ===== Playlist / Player Actions =====

  // Einen bestimmten Track laden und abspielen
  function playTrack(index) {
    if (index < 0 || index >= files.value.length) return
    currentTrackIndex.value = index
    isPlaying.value = true
  }

  // Play/Pause für den aktuell geladenen Track umschalten
  function togglePlay() {
    if (currentTrackIndex.value === null) {
      // Nichts geladen -> ersten Track starten
      if (files.value.length > 0) playTrack(0)
      return
    }
    isPlaying.value = !isPlaying.value
  }

  // Nächsten Track in der Playlist abspielen (mit Umbruch)
  function playNext() {
    if (files.value.length === 0) return
    const current = currentTrackIndex.value === null ? -1 : currentTrackIndex.value
    const next = (current + 1) % files.value.length
    playTrack(next)
  }

  // Vorherigen Track in der Playlist abspielen (mit Umbruch)
  function playPrevious() {
    if (files.value.length === 0) return
    const current = currentTrackIndex.value === null ? 0 : currentTrackIndex.value
    const prev = (current - 1 + files.value.length) % files.value.length
    playTrack(prev)
  }

  // Wiedergabe komplett beenden und Player ausblenden
  function stopPlayback() {
    currentTrackIndex.value = null
    isPlaying.value = false
  }

  // Vom <audio>-Element gemeldeten Play/Pause-Status übernehmen
  function setPlaying(value) {
    isPlaying.value = value
  }

  async function startConversion() {
    if (files.value.length === 0) {
      updateStatus('Keine Dateien zur Konvertierung ausgewählt', 'warning')
      return
    }

    isConverting.value = true
    isCancelling.value = false
    showRetry.value = false
    filesCompleted.value = 0
    showProgress.value = true
    progress.value = 0
    // Ergebnisse eines vorherigen Laufs verwerfen
    convertedFiles.value = []
    // Frischen Abbruch-Controller für diesen Lauf
    abortController = new AbortController()
    const signal = abortController.signal

    const totalFiles = files.value.length

    try {
      for (let i = 0; i < totalFiles; i++) {
        // Vor jeder Datei prüfen, ob abgebrochen wurde
        if (signal.aborted) break

        const file = files.value[i]

        // Update progress for current file
        const baseProgress = (i / totalFiles) * 100
        progress.value = Math.round(baseProgress)

        updateStatus(`Konvertiere: ${file.name}`, 'info')

        // Shimmer-Animation während Backend-Verarbeitung
        isProcessingFile.value = true
        await convertFile(file, signal)
        isProcessingFile.value = false

        filesCompleted.value++

        // Update progress after file completion
        progress.value = Math.round(((i + 1) / totalFiles) * 100)
      }

      if (signal.aborted) {
        // Sauberer Abbruch: hochgeladene Dateien bleiben erhalten
        handleCancelled()
      } else {
        updateStatus(
          `${totalFiles} Datei(en) konvertiert – jetzt speichern`,
          'success'
        )
        progress.value = 100

        // Erfolgston abspielen
        playSuccessSound()

        // Browser-Benachrichtigung
        showNotification(
          'Konvertierung abgeschlossen!',
          `${totalFiles} Datei(en) erfolgreich konvertiert.`
        )

        // Kein Auto-Download mehr: Der Nutzer speichert die Dateien selbst
        // über den Speichern-Dialog (Umbenennen + Speicherort).
      }

    } catch (error) {
      isProcessingFile.value = false
      // Abbruch (AbortError) ist kein Fehler, sondern gewollt
      if (signal.aborted || (error && error.name === 'AbortError')) {
        handleCancelled()
      } else {
        console.error('❌ Konvertierungsfehler:', error)
        updateStatus(`Konvertierungsfehler: ${error.message}`, 'error')
        showRetry.value = true
      }
    } finally {
      isConverting.value = false
      isCancelling.value = false
      abortController = null
    }
  }

  // Gemeinsame Status-Behandlung nach einem Abbruch.
  // WICHTIG: Die hochgeladene Datei-Liste (files) wird NICHT verändert.
  function handleCancelled() {
    isProcessingFile.value = false
    showProgress.value = false
    progress.value = 0
    const done = filesCompleted.value
    const message = done > 0
      ? `Abgebrochen – ${done} Datei(en) bereits fertig, ${files.value.length} in der Liste`
      : 'Konvertierung abgebrochen'
    updateStatus(message, 'info')
    // Abbruch-Hinweis nach einigen Sekunden automatisch ausblenden
    scheduleStatusClear(message)
  }

  // Laufende Konvertierung sauber abbrechen (Nutzer-Aktion).
  function cancelConversion() {
    if (!isConverting.value) return
    isCancelling.value = true
    updateStatus('Abbrechen …', 'info')
    if (abortController) abortController.abort()
  }

  async function convertFile(file, signal) {
    try {
      console.log(`🎬 Konvertiere ${file.name} über Backend...`)

      // Speichere originalen Basisnamen für Download-Dateiname
      const originalBaseName = file.name.replace(/\.[^/.]+$/, '')
      const expectedFilename = `${originalBaseName}.${outputFormat.value.ext}`

      // Erstelle FormData für Upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('format', outputFormat.value.ext)
      formData.append('bitrate', settings.value.bitrate)
      formData.append('samplerate', '44100')
      formData.append('channels', '2')

      // Sende zum Backend
      const response = await fetch(`${API_BASE}/convert`, {
        method: 'POST',
        body: formData,
        signal
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()

      if (!result.ok) {
        throw new Error(result.error || 'Konvertierung fehlgeschlagen')
      }

      // Verwende originalen Dateinamen mit neuer Erweiterung als Vorschlag
      // Falls Backend einen anderen Namen zurückgibt, bevorzuge den originalen Namen
      const downloadFilename = expectedFilename

      // Konvertierte Datei vom Backend holen und als Ergebnis ablegen.
      // Gespeichert wird erst später über den Speichern-Dialog des Nutzers.
      console.log(`📥 Hole Ergebnis: ${downloadFilename}`)
      const blob = await fetchConvertedBlob(result.url, signal)
      convertedFiles.value.push({
        name: downloadFilename,
        blob,
        size: blob.size,
        saved: false
      })

      console.log(`✅ ${downloadFilename} erfolgreich konvertiert`)

    } catch (error) {
      // Sauberen Abbruch unverändert durchreichen (kein Fehler-Status)
      if (error && error.name === 'AbortError') throw error
      console.error(`❌ Fehler bei ${file.name}:`, error)
      throw new Error(`Konvertierung von ${file.name} fehlgeschlagen: ${error.message}`)
    }
  }

  // Lädt das konvertierte Blob vom Backend (ohne es zu speichern)
  async function fetchConvertedBlob(url, signal) {
    // URL kommt als "/files/..." vom Backend, muss zu "/mp3konverter/files/..." werden
    const fullUrl = url.startsWith('/mp3konverter/') ? url : `/mp3konverter${url}`

    const response = await fetch(fullUrl, { signal })
    if (!response.ok) throw new Error(`Abruf fehlgeschlagen: ${response.status}`)

    return await response.blob()
  }

  // Passende MIME-Typen als Fallback, falls das Blob keinen Typ mitbringt
  function mimeForExtension(ext) {
    const map = {
      mp3: 'audio/mpeg',
      aac: 'audio/aac',
      m4a: 'audio/mp4',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      flac: 'audio/flac'
    }
    return map[ext] || 'application/octet-stream'
  }

  // Ein konvertiertes Ergebnis speichern.
  // Moderne Browser (Chromium): Dialog mit Umbenennen + Speicherort-Auswahl.
  // Andere Browser (Firefox/Safari): klassischer Download als Fallback.
  async function saveConvertedFile(index) {
    const item = convertedFiles.value[index]
    if (!item) return

    const ext = item.name.includes('.') ? item.name.split('.').pop().toLowerCase() : ''
    const mime = item.blob.type || mimeForExtension(ext)

    // Bevorzugt: File System Access API (Speichern-unter-Dialog)
    if (typeof window.showSaveFilePicker === 'function') {
      try {
        const options = { suggestedName: item.name }
        if (ext) {
          options.types = [{
            description: 'Audiodatei',
            accept: { [mime]: [`.${ext}`] }
          }]
        }
        const handle = await window.showSaveFilePicker(options)
        const writable = await handle.createWritable()
        await writable.write(item.blob)
        await writable.close()

        item.saved = true
        updateStatus(`Gespeichert: ${handle.name || item.name}`, 'success')
        return
      } catch (error) {
        // Nutzer hat den Dialog abgebrochen -> kein Fehler, nichts tun
        if (error && error.name === 'AbortError') return
        // Andere Fehler (z. B. fehlende Nutzer-Geste): auf klassischen Download ausweichen
        console.warn('Speichern-Dialog nicht möglich, nutze Fallback-Download:', error)
      }
    }

    // Fallback: klassischer Download in den Standard-Download-Ordner
    fallbackDownload(item.blob, item.name)
    item.saved = true
    updateStatus(`Heruntergeladen: ${item.name}`, 'success')
  }

  function fallbackDownload(blob, filename) {
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 100)
  }

  // Ein einzelnes konvertiertes Ergebnis verwerfen (z. B. falsche Bitrate).
  // Die hochgeladene Quell-Datei in der Playliste bleibt unberührt.
  function removeConvertedFile(index) {
    if (index < 0 || index >= convertedFiles.value.length) return
    convertedFiles.value.splice(index, 1)
  }

  // Ergebnisliste leeren (z. B. für einen neuen Durchlauf)
  function clearConvertedFiles() {
    convertedFiles.value = []
  }

  function resetAfterConversion() {
    files.value = []
    convertedFiles.value = []
    stopPlayback()
    showProgress.value = false
    progress.value = 0
    updateStatus('Bereit für neue Konvertierung', 'info')
  }

  function retryConversion() {
    showRetry.value = false
    startConversion()
  }

  function updateStatus(message, type = 'info') {
    // Jede neue Statusmeldung hebt ein geplantes Ausblenden auf
    if (statusClearTimer) {
      clearTimeout(statusClearTimer)
      statusClearTimer = null
    }
    statusMessage.value = message
    statusType.value = type
  }

  // Statusmeldung nach kurzer Zeit ausblenden – aber nur, wenn sie
  // in der Zwischenzeit nicht durch eine neue Meldung ersetzt wurde.
  function scheduleStatusClear(expectedMessage, delay = 4000) {
    if (statusClearTimer) clearTimeout(statusClearTimer)
    statusClearTimer = setTimeout(() => {
      if (statusMessage.value === expectedMessage) {
        statusMessage.value = ''
      }
      statusClearTimer = null
    }, delay)
  }

  function getOutputFormat() {
    return outputFormat.value
  }

  return {
    // State
    files,
    settings,
    isConverting,
    isProcessingFile,
    progress,
    showProgress,
    statusMessage,
    statusType,
    showRetry,
    filesCompleted,
    isCancelling,
    convertedFiles,
    currentTrackIndex,
    isPlaying,
    currentTrack,

    // Actions
    addFiles,
    removeFile,
    startConversion,
    cancelConversion,
    retryConversion,
    saveConvertedFile,
    removeConvertedFile,
    clearConvertedFiles,
    getOutputFormat,
    playTrack,
    togglePlay,
    playNext,
    playPrevious,
    stopPlayback,
    setPlaying
  }
})
