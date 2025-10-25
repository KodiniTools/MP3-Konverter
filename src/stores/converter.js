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
  const progress = ref(0)
  const showProgress = ref(false)
  const statusMessage = ref('Bereit - Wählen Sie Audiodateien aus')
  const statusType = ref('info')
  const showRetry = ref(false)
  const filesCompleted = ref(0)

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
        await convertFile(file)
        
        filesCompleted.value++
        
        // Update progress after file completion
        progress.value = Math.round(((i + 1) / totalFiles) * 100)
      }

      updateStatus(`${totalFiles} Datei(en) erfolgreich konvertiert!`, 'success')
      progress.value = 100

      // Reset nach erfolgreicher Konvertierung
      setTimeout(() => {
        resetAfterConversion()
      }, 2000)

    } catch (error) {
      console.error('❌ Konvertierungsfehler:', error)
      updateStatus(`Konvertierungsfehler: ${error.message}`, 'error')
      showRetry.value = true
    } finally {
      isConverting.value = false
    }
  }

  async function convertFile(file) {
    try {
      console.log(`🎬 Konvertiere ${file.name} über Backend...`)

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

      // Download konvertierte Datei - URL bereits mit /mp3konverter/files/
      console.log(`📥 Lade herunter: ${result.filename}`)
      await downloadFromBackend(result.url, result.filename)

      console.log(`✅ ${result.filename} erfolgreich konvertiert`)

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
