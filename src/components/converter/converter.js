import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

export const useConverterStore = defineStore('converter', () => {
  // State
  const files = ref([])
  const settings = ref({
    codec: 'libmp3lame',
    bitrate: '192k',
    format: 'mp3'
  })
  
  const ffmpegInstance = ref(null)
  const isFFmpegLoaded = ref(false)
  const isConverting = ref(false)
  const progress = ref(0)
  const showProgress = ref(false)
  const statusMessage = ref('Anwendung wird geladen...')
  const statusType = ref('info')
  const showRetry = ref(false)
  const filesCompleted = ref(0)

  // Computed
  const outputFormat = computed(() => {
    const formatMap = {
      'libmp3lame': { format: 'MP3', codec: 'LAME MP3', ext: 'mp3' },
      'aac': { format: 'AAC', codec: 'AAC', ext: 'aac' }
    }
    return formatMap[settings.value.codec] || formatMap['libmp3lame']
  })

  // Actions
  async function initializeFFmpeg() {
    if (isFFmpegLoaded.value) {
      console.log('✅ FFmpeg bereits geladen')
      return
    }

    try {
      console.log('🔧 Initialisiere FFmpeg...')
      updateStatus('FFmpeg wird geladen...', 'info')

      ffmpegInstance.value = new FFmpeg()

      const baseURL = '/mp3konverter/ffmpeg'  // ✅ KORRIGIERT: Voller Pfad mit /mp3konverter/

      console.log('📥 Lade von:', baseURL)

      await ffmpegInstance.value.load({
        coreURL: `${baseURL}/ffmpeg-core.js`,
        wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      })

      isFFmpegLoaded.value = true
      updateStatus('FFmpeg geladen - Wählen Sie Audiodateien aus', 'success')
      console.log('✅ FFmpeg erfolgreich geladen')

    } catch (error) {
      console.error('❌ FFmpeg-Initialisierung fehlgeschlagen:', error)
      updateStatus(`FFmpeg-Fehler: ${error.message}`, 'error')
      showRetry.value = true
      isFFmpegLoaded.value = false
    }
  }

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
    if (!isFFmpegLoaded.value || files.value.length === 0) {
      updateStatus('Keine Dateien zur Konvertierung oder FFmpeg nicht bereit', 'warning')
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
    const inputName = file.name
    const outputName = generateOutputFilename(inputName)

    try {
      console.log(`🎬 Konvertiere ${inputName}...`)

      // Write input file
      await ffmpegInstance.value.writeFile(inputName, await fetchFile(file))

      // Build FFmpeg command
      const command = buildFFmpegCommand(inputName, outputName)
      console.log('📋 FFmpeg-Kommando:', command.join(' '))

      // Execute conversion
      await ffmpegInstance.value.exec(command)

      // Read output file
      const data = await ffmpegInstance.value.readFile(outputName)
      downloadFile(data, outputName)

      console.log(`✅ ${outputName} erfolgreich konvertiert`)

    } catch (error) {
      console.error(`❌ Fehler bei ${inputName}:`, error)
      throw new Error(`Konvertierung von ${inputName} fehlgeschlagen: ${error.message}`)
    } finally {
      // Cleanup
      try {
        await ffmpegInstance.value.deleteFile(inputName)
        await ffmpegInstance.value.deleteFile(outputName)
      } catch (e) {
        console.warn('⚠️ Cleanup-Warnung:', e.message)
      }
    }
  }

  function buildFFmpegCommand(inputName, outputName) {
    return [
      '-i', inputName,
      '-y',
      '-acodec', settings.value.codec,
      '-b:a', settings.value.bitrate,
      '-ar', '44100',
      '-ac', '2',
      '-f', outputFormat.value.ext,
      outputName
    ]
  }

  function generateOutputFilename(originalName) {
    const baseName = originalName.replace(/\.[^/.]+$/, '')
    const cleanBaseName = baseName.replace(/[^\w\s.-]/g, '_').replace(/\s+/g, '_')
    return `${cleanBaseName}.${outputFormat.value.ext}`
  }

  function downloadFile(data, filename) {
    const mimeTypes = {
      'mp3': 'audio/mpeg',
      'aac': 'audio/aac'
    }
    
    const blob = new Blob([data.buffer], { 
      type: mimeTypes[outputFormat.value.ext] || 'audio/mpeg'
    })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setTimeout(() => URL.revokeObjectURL(url), 100)
    console.log(`💾 ${filename} heruntergeladen`)
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
    isFFmpegLoaded,
    isConverting,
    progress,
    showProgress,
    statusMessage,
    statusType,
    showRetry,
    
    // Actions
    initializeFFmpeg,
    addFiles,
    removeFile,
    startConversion,
    retryConversion,
    getOutputFormat
  }
})
