<template>
  <div id="app" :data-theme="theme">
    <!-- Skip Link -->
    <a href="#main-content" class="skip-link">{{ $t('common.skipToMain') }}</a>

    <!-- Animated Background -->
    <div class="bg-animated"></div>

    <!-- Hero Section -->
    <HeroSection />

    <!-- Converter Section -->
    <section class="converter-section" id="main-content">
      <div class="converter-wrapper">
        <div class="container">
          <!-- Main Converter Content -->
          <main class="main-content">
            <FileUpload @files-selected="handleFilesSelected" />
            
            <FileList 
              v-if="files.length > 0"
              :files="files"
              @remove-file="removeFile"
            />
            
            <ConversionOptions 
              v-model:codec="conversionSettings.codec"
              v-model:bitrate="conversionSettings.bitrate"
              :output-format="outputFormat"
            />
            
            <ActionButtons
              :disabled="!canConvert"
              :is-converting="isConverting"
              @convert="startConversion"
              @retry="retryConversion"
              :show-retry="showRetry"
            />
            
            <ProgressSection
              v-if="showProgress"
              :progress="progress"
              :is-processing="isProcessingFile"
            />

            <ConvertedFiles
              v-if="convertedFiles.length > 0"
              :files="convertedFiles"
              @save="saveConvertedFile"
              @remove="removeConvertedFile"
            />

            <StatusMessage
              :message="statusMessage"
              :type="statusType"
            />
          </main>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <FeaturesSection />

    <!-- Other Tools Section -->
    <OtherToolsSection />

    <!-- Donate Section -->
    <DonateSection />

    <!-- FAQ Section -->
    <FAQSection />

    <!-- Footer (wird später über SSI eingebunden) -->

    <!-- Sticky Player Bar für die interaktive Playlist -->
    <PlayerStickyBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useConverterStore } from './stores/converter'
import { useThemeStore } from './stores/theme'
import { useLocaleStore } from './stores/locale'

// Components
import HeroSection from './components/layout/HeroSection.vue'
import FileUpload from './components/converter/FileUpload.vue'
import FileList from './components/converter/FileList.vue'
import ConversionOptions from './components/converter/ConversionOptions.vue'
import ActionButtons from './components/converter/ActionButtons.vue'
import ProgressSection from './components/converter/ProgressSection.vue'
import ConvertedFiles from './components/converter/ConvertedFiles.vue'
import StatusMessage from './components/converter/StatusMessage.vue'
import PlayerStickyBar from './components/converter/PlayerStickyBar.vue'
import FeaturesSection from './components/sections/FeaturesSection.vue'
import OtherToolsSection from './components/sections/OtherToolsSection.vue'
import DonateSection from './components/sections/DonateSection.vue'
import FAQSection from './components/sections/FAQSection.vue'

// Composables
const converterStore = useConverterStore()
const themeStore = useThemeStore()
const localeStore = useLocaleStore()

// Reactive state
const files = computed(() => converterStore.files)
const convertedFiles = computed(() => converterStore.convertedFiles)
const conversionSettings = computed(() => converterStore.settings)
const isConverting = computed(() => converterStore.isConverting)
const isProcessingFile = computed(() => converterStore.isProcessingFile)
const progress = computed(() => converterStore.progress)
const showProgress = computed(() => converterStore.showProgress)
const statusMessage = computed(() => converterStore.statusMessage)
const statusType = computed(() => converterStore.statusType)
const showRetry = computed(() => converterStore.showRetry)
const theme = computed(() => themeStore.theme)

const canConvert = computed(() => {
  return files.value.length > 0 && 
         !isConverting.value
})

const outputFormat = computed(() => {
  return converterStore.getOutputFormat()
})

// Methods
function handleFilesSelected(newFiles) {
  converterStore.addFiles(newFiles)
}

// Audiodateien aus der Zwischenablage (Strg+V / Cmd+V) einfügen
function handlePaste(event) {
  // Nicht eingreifen, wenn der Nutzer gerade in ein Eingabefeld schreibt
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return
  }

  const clipboardData = event.clipboardData || window.clipboardData
  if (!clipboardData) return

  const pastedFiles = []

  // Bevorzugt die items-API nutzen (liefert auch Blobs ohne Dateinamen)
  if (clipboardData.items && clipboardData.items.length > 0) {
    for (const item of clipboardData.items) {
      if (item.kind !== 'file') continue
      const file = item.getAsFile()
      if (file) pastedFiles.push(file)
    }
  }

  // Fallback: direkte files-Liste
  if (pastedFiles.length === 0 && clipboardData.files && clipboardData.files.length > 0) {
    for (const file of clipboardData.files) {
      pastedFiles.push(file)
    }
  }

  // Nur Audio-Dateien berücksichtigen
  const audioFiles = pastedFiles.filter(file =>
    file.type.startsWith('audio/') ||
    /\.(mp3|wav|ogg|m4a|flac|aac|wma)$/i.test(file.name || '')
  )

  if (audioFiles.length === 0) return

  // Verhindert, dass der Audio-Blob z. B. in ein Textfeld eingefügt wird
  event.preventDefault()

  // Aus der Zwischenablage kopierte Blobs haben oft keinen (sinnvollen) Namen
  const normalizedFiles = audioFiles.map((file, index) => {
    if (file.name && /\.[^/.]+$/.test(file.name)) {
      return file
    }
    const ext = (file.type.split('/')[1] || 'audio').replace('x-', '')
    const suffix = audioFiles.length > 1 ? `-${index + 1}` : ''
    const name = `zwischenablage${suffix}.${ext}`
    return new File([file], name, { type: file.type })
  })

  converterStore.addFiles(normalizedFiles)
}

function removeFile(index) {
  converterStore.removeFile(index)
}

function saveConvertedFile(index) {
  converterStore.saveConvertedFile(index)
}

function removeConvertedFile(index) {
  converterStore.removeConvertedFile(index)
}

async function startConversion() {
  await converterStore.startConversion()
}

function retryConversion() {
  converterStore.retryConversion()
}

// Tastaturkürzel
function handleKeydown(event) {
  // Ignoriere wenn in einem Input-Feld
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return
  }

  // Strg+O: Dateien auswählen
  if (event.ctrlKey && event.key === 'o') {
    event.preventDefault()
    const fileInput = document.querySelector('.file-input')
    if (fileInput) fileInput.click()
  }

  // Enter: Konvertierung starten (wenn möglich)
  if (event.key === 'Enter' && !event.ctrlKey && !event.shiftKey) {
    if (canConvert.value) {
      event.preventDefault()
      startConversion()
    }
  }

  // Escape: Dateien löschen
  if (event.key === 'Escape') {
    if (files.value.length > 0 && !isConverting.value) {
      event.preventDefault()
      // Alle Dateien entfernen
      while (converterStore.files.length > 0) {
        converterStore.removeFile(0)
      }
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('paste', handlePaste)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('paste', handlePaste)
})

// Initialize - Backend version needs no initialization
console.log('MP3 Konverter - Backend Mode')

</script>

<style lang="scss">
// Global styles are imported in main.js
</style>
