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

  // Audio Context für Erfolgston
  let audioContext = null

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
    
    if (files.value.length === 0) {
      updateStatus('Keine Dateien ausgewählt', 'info')
    } else {
      updateStatus(`${files.value.length} Datei(en) ausgewählt`, 'info')
    }
  }

  async function startConversion() {
    if (files.value.length === 0) {
      updateStatus('Keine Dateien zur Konvertierung ausgewählt', 'warning')
      return
    }

    isConverting.value = true
    showRetry.value = false
    filesCompleted.value = 0
    showProgress.value = true
    progress.value = 0

    try {
      const totalFiles = files.value.length

      for (let i = 0; i < totalFiles; i++) {
        const file = files.value[i]

        // Update progress for current file
        const baseProgress = (i / totalFiles) * 100
        progress.value = Math.round(baseProgress)

        updateStatus(`Konvertiere: ${file.name}`, 'info')

        // Shimmer-Animation während Backend-Verarbeitung
        isProcessingFile.value = true
        await convertFile(file)
        isProcessingFile.value = false

        filesCompleted.value++

        // Update progress after file completion
        progress.value = Math.round(((i + 1) / totalFiles) * 100)
      }

      updateStatus(`${totalFiles} Datei(en) erfolgreich konvertiert!`, 'success')
      progress.value = 100

      // Erfolgston abspielen
      playSuccessSound()

      // Browser-Benachrichtigung
      showNotification(
        'Konvertierung abgeschlossen!',
        `${totalFiles} Datei(en) erfolgreich konvertiert.`
      )

      // Reset nach erfolgreicher Konvertierung
      setTimeout(() => {
        resetAfterConversion()
      }, 2000)

    } catch (error) {
      console.error('❌ Konvertierungsfehler:', error)
      updateStatus(`Konvertierungsfehler: ${error.message}`, 'error')
      showRetry.value = true
      isProcessingFile.value = false
    } finally {
      isConverting.value = false
    }
  }

  async function convertFile(file) {
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
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()

      if (!result.ok) {
        throw new Error(result.error || 'Konvertierung fehlgeschlagen')
      }

      // Verwende originalen Dateinamen mit neuer Erweiterung für den Download
      // Falls Backend einen anderen Namen zurückgibt, bevorzuge den originalen Namen
      const downloadFilename = expectedFilename

      // Download konvertierte Datei - URL bereits mit /mp3konverter/files/
      console.log(`📥 Lade herunter: ${downloadFilename}`)
      await downloadFromBackend(result.url, downloadFilename)

      console.log(`✅ ${downloadFilename} erfolgreich konvertiert`)

    } catch (error) {
      console.error(`❌ Fehler bei ${file.name}:`, error)
      throw new Error(`Konvertierung von ${file.name} fehlgeschlagen: ${error.message}`)
    }
  }

  async function downloadFromBackend(url, filename) {
    try {
      // URL kommt als "/files/..." vom Backend, muss zu "/mp3konverter/files/..." werden
      const fullUrl = url.startsWith('/mp3konverter/') ? url : `/mp3konverter${url}`
      
      const response = await fetch(fullUrl)
      if (!response.ok) throw new Error(`Download fehlgeschlagen: ${response.status}`)
      
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100)
      console.log(`💾 ${filename} heruntergeladen`)
    } catch (error) {
      console.error('Download-Fehler:', error)
      throw new Error(`Download fehlgeschlagen: ${error.message}`)
    }
  }

  function resetAfterConversion() {
    files.value = []
    showProgress.value = false
    progress.value = 0
    updateStatus('Bereit für neue Konvertierung', 'info')
  }

  function retryConversion() {
    showRetry.value = false
    startConversion()
  }

  function updateStatus(message, type = 'info') {
    statusMessage.value = message
    statusType.value = type
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

    // Actions
    addFiles,
    removeFile,
    startConversion,
    retryConversion,
    getOutputFormat
  }
})
