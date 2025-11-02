<template>
  <div id="app" :data-theme="theme">
    <!-- Skip Link -->
    <a href="#main-content" class="skip-link">{{ $t('common.skipToMain') }}</a>

    <!-- Animated Background -->
    <div class="bg-animated"></div>

    <!-- Website Header -->
    <AppHeader 
      @toggle-theme="toggleTheme"
      @toggle-language="toggleLanguage"
    />

    <!-- Hero Section -->
    <HeroSection />

    <!-- Converter Section -->
    <section class="converter-section" id="main-content">
      <div class="converter-wrapper">
        <div class="container">
          <!-- Converter Header -->
          <header class="header">
            <h1 class="app-title">
              <span class="app-icon" aria-hidden="true">🎵</span>
              <span>{{ $t('converter.title') }}</span>
            </h1>
          </header>

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
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConverterStore } from './stores/converter'
import { useThemeStore } from './stores/theme'

// Components
import AppHeader from './components/layout/AppHeader.vue'
import HeroSection from './components/layout/HeroSection.vue'
import FileUpload from './components/converter/FileUpload.vue'
import FileList from './components/converter/FileList.vue'
import ConversionOptions from './components/converter/ConversionOptions.vue'
import ActionButtons from './components/converter/ActionButtons.vue'
import ProgressSection from './components/converter/ProgressSection.vue'
import StatusMessage from './components/converter/StatusMessage.vue'
import FeaturesSection from './components/sections/FeaturesSection.vue'
import OtherToolsSection from './components/sections/OtherToolsSection.vue'
import DonateSection from './components/sections/DonateSection.vue'
import FAQSection from './components/sections/FAQSection.vue'

// Composables
const { locale } = useI18n()
const converterStore = useConverterStore()
const themeStore = useThemeStore()

// Reactive state
const files = computed(() => converterStore.files)
const conversionSettings = computed(() => converterStore.settings)
const isConverting = computed(() => converterStore.isConverting)
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

function removeFile(index) {
  converterStore.removeFile(index)
}

async function startConversion() {
  await converterStore.startConversion()
}

function retryConversion() {
  converterStore.retryConversion()
}

function toggleTheme() {
  themeStore.toggleTheme()
}

function toggleLanguage() {
  const newLang = locale.value === 'de' ? 'en' : 'de'
  locale.value = newLang
  localStorage.setItem('preferred-language', newLang)
}

// Initialize - Backend version needs no initialization
console.log('MP3 Konverter - Backend Mode')

</script>

<style lang="scss">
// Global styles are imported in main.js
</style>
