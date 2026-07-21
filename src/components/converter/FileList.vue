<template>
  <section class="file-list-section" aria-labelledby="files-heading">
    <h2 id="files-heading" class="section-heading">
      {{ $t('converter.fileList.heading') }}
    </h2>

    <div class="file-list" role="list" aria-live="polite">
      <div
        v-for="(file, index) in files"
        :key="`${file.name}-${index}`"
        class="file-item"
        :class="{ 'is-active': index === currentTrackIndex }"
        role="listitem"
      >
        <button
          type="button"
          class="play-file-btn"
          @click="togglePlay(index)"
          :aria-label="isTrackPlaying(index)
            ? $t('converter.fileList.pauseFile', { name: file.name })
            : $t('converter.fileList.playFile', { name: file.name })"
          :aria-pressed="isTrackPlaying(index)"
        >
          <!-- Pause-Symbol wenn dieser Track gerade läuft, sonst Play -->
          <svg v-if="isTrackPlaying(index)" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1"/>
            <rect x="14" y="5" width="4" height="14" rx="1"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.29-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14z"/>
          </svg>
        </button>

        <div class="file-info file-info--clickable" @click="togglePlay(index)">
          <span class="file-name">
            {{ file.name }}
            <span v-if="index === currentTrackIndex" class="now-playing-badge">
              {{ isPlaying ? $t('converter.fileList.playing') : $t('converter.fileList.paused') }}
            </span>
          </span>
          <span class="file-size">{{ formatFileSize(file.size) }}</span>
        </div>

        <button
          type="button"
          class="remove-file-btn"
          @click="$emit('remove-file', index)"
          :aria-label="$t('converter.fileList.removeFile', { name: file.name })"
        >
          ✕
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useConverterStore } from '../../stores/converter'

defineProps({
  files: {
    type: Array,
    required: true
  }
})

defineEmits(['remove-file'])

const converterStore = useConverterStore()

const currentTrackIndex = computed(() => converterStore.currentTrackIndex)
const isPlaying = computed(() => converterStore.isPlaying)

// Läuft genau dieser Track gerade (geladen + Wiedergabe aktiv)?
function isTrackPlaying(index) {
  return index === currentTrackIndex.value && isPlaying.value
}

// Klick auf einen Track: neuen Track starten oder aktuellen pausieren/fortsetzen
function togglePlay(index) {
  if (index === currentTrackIndex.value) {
    converterStore.togglePlay()
  } else {
    converterStore.playTrack(index)
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>
