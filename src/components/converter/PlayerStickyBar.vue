<template>
  <transition name="player-slide">
    <div
      v-if="currentTrack"
      class="player-sticky-bar"
      role="region"
      :aria-label="$t('converter.player.ariaLabel')"
    >
      <!-- Verstecktes Audio-Element steuert die eigentliche Wiedergabe -->
      <audio
        ref="audioEl"
        @play="onPlay"
        @pause="onPause"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoadedMetadata"
        @ended="onEnded"
      ></audio>

      <div class="player-inner">
        <!-- Track-Info -->
        <div class="player-track">
          <div class="player-track-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="1.75"/>
              <circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="1.75"/>
            </svg>
          </div>
          <div class="player-track-meta">
            <span class="player-track-name">{{ currentTrack.name }}</span>
            <span class="player-track-pos">
              {{ (currentTrackIndex + 1) }} / {{ totalTracks }}
            </span>
          </div>
        </div>

        <!-- Steuerung -->
        <div class="player-controls">
          <button
            type="button"
            class="player-btn"
            @click="playPrevious"
            :disabled="totalTracks < 2"
            :aria-label="$t('converter.player.previous')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M6 5a1 1 0 0 1 2 0v5.6l8.5-5.9A1 1 0 0 1 18 5.5v13a1 1 0 0 1-1.5.87L8 13.4V19a1 1 0 0 1-2 0V5z"/>
            </svg>
          </button>

          <button
            type="button"
            class="player-btn player-btn--primary"
            @click="togglePlay"
            :aria-label="isPlaying ? $t('converter.player.pause') : $t('converter.player.play')"
          >
            <svg v-if="isPlaying" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1"/>
              <rect x="14" y="5" width="4" height="14" rx="1"/>
            </svg>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.29-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14z"/>
            </svg>
          </button>

          <button
            type="button"
            class="player-btn"
            @click="playNext"
            :disabled="totalTracks < 2"
            :aria-label="$t('converter.player.next')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18 5a1 1 0 0 0-2 0v5.6L7.5 4.7A1 1 0 0 0 6 5.5v13a1 1 0 0 0 1.5.87L16 13.4V19a1 1 0 0 0 2 0V5z"/>
            </svg>
          </button>
        </div>

        <!-- Fortschritt / Seek -->
        <div class="player-progress">
          <span class="player-time">{{ formatTime(currentTime) }}</span>
          <input
            type="range"
            class="player-seek"
            min="0"
            :max="duration || 0"
            step="0.1"
            :value="currentTime"
            @input="onSeek"
            :aria-label="$t('converter.player.seek')"
          >
          <span class="player-time">{{ formatTime(duration) }}</span>
        </div>

        <!-- Schließen -->
        <button
          type="button"
          class="player-btn player-btn--close"
          @click="stopPlayback"
          :aria-label="$t('converter.player.close')"
        >
          ✕
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import { useConverterStore } from '../../stores/converter'

const converterStore = useConverterStore()

const audioEl = ref(null)
const currentTime = ref(0)
const duration = ref(0)

// aktuelle Object-URL, damit wir sie beim Wechsel wieder freigeben können
let objectUrl = null

const currentTrack = computed(() => converterStore.currentTrack)
const currentTrackIndex = computed(() => converterStore.currentTrackIndex)
const isPlaying = computed(() => converterStore.isPlaying)
const totalTracks = computed(() => converterStore.files.length)

// Alte Object-URL freigeben (Speicher freimachen)
function revokeUrl() {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
    objectUrl = null
  }
}

// Neuen Track in das <audio>-Element laden
async function loadTrack(file) {
  revokeUrl()
  currentTime.value = 0
  duration.value = 0
  if (!file) return

  await nextTick()
  const el = audioEl.value
  if (!el) return

  objectUrl = URL.createObjectURL(file)
  el.src = objectUrl
  el.load()

  if (isPlaying.value) {
    el.play().catch(() => {
      // Autoplay evtl. blockiert -> Zustand konsistent halten
      converterStore.setPlaying(false)
    })
  }
}

// Track wechselt (oder wird geschlossen)
watch(currentTrack, (file) => {
  loadTrack(file)
  // Seiteninhalt Platz für die Sticky-Bar geben, damit nichts verdeckt wird
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('player-active', !!file)
  }
})

// Play/Pause-Zustand aus dem Store auf das <audio>-Element anwenden
watch(isPlaying, (playing) => {
  const el = audioEl.value
  if (!el || !currentTrack.value) return
  if (playing && el.paused) {
    el.play().catch(() => converterStore.setPlaying(false))
  } else if (!playing && !el.paused) {
    el.pause()
  }
})

// ===== Steuerungen =====
function togglePlay() {
  converterStore.togglePlay()
}
function playNext() {
  converterStore.playNext()
}
function playPrevious() {
  converterStore.playPrevious()
}
function stopPlayback() {
  const el = audioEl.value
  if (el) el.pause()
  converterStore.stopPlayback()
}

function onSeek(event) {
  const el = audioEl.value
  const value = parseFloat(event.target.value)
  if (el && !Number.isNaN(value)) {
    el.currentTime = value
    currentTime.value = value
  }
}

// ===== Audio-Element-Events =====
function onPlay() {
  converterStore.setPlaying(true)
}
function onPause() {
  converterStore.setPlaying(false)
}
function onTimeUpdate() {
  const el = audioEl.value
  if (el) currentTime.value = el.currentTime
}
function onLoadedMetadata() {
  const el = audioEl.value
  if (el && Number.isFinite(el.duration)) duration.value = el.duration
}
function onEnded() {
  // Am Ende automatisch zum nächsten Track springen
  if (totalTracks.value > 1) {
    converterStore.playNext()
  } else {
    converterStore.setPlaying(false)
    currentTime.value = 0
  }
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

onBeforeUnmount(() => {
  revokeUrl()
  if (typeof document !== 'undefined') {
    document.body.classList.remove('player-active')
  }
})
</script>
