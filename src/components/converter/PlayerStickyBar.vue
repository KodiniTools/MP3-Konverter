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

        <!-- Lautstärke / Stummschalten -->
        <div class="player-volume">
          <button
            type="button"
            class="player-btn player-btn--volume"
            @click="toggleMute"
            :aria-label="isMuted || volume === 0 ? $t('converter.player.unmute') : $t('converter.player.mute')"
            :aria-pressed="isMuted"
          >
            <!-- Stumm -->
            <svg v-if="isMuted || volume === 0" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M11 5.14v13.72a1 1 0 0 1-1.6.8L5.67 17H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h2.67l3.73-2.66a1 1 0 0 1 1.6.8z"/>
              <path d="M15.54 8.46a1 1 0 0 1 1.41 0L18.5 10l1.55-1.54a1 1 0 1 1 1.41 1.41L19.91 11.4l1.55 1.55a1 1 0 0 1-1.41 1.41L18.5 12.82l-1.55 1.54a1 1 0 0 1-1.41-1.41l1.54-1.55-1.54-1.55a1 1 0 0 1 0-1.41z"/>
            </svg>
            <!-- Leise (niedrige Lautstärke) -->
            <svg v-else-if="volume < 0.5" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M11 5.14v13.72a1 1 0 0 1-1.6.8L5.67 17H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h2.67l3.73-2.66a1 1 0 0 1 1.6.8z"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07 1 1 0 0 1-1.41-1.41 3 3 0 0 0 0-4.24 1 1 0 0 1 1.41-1.42z"/>
            </svg>
            <!-- Laut -->
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M11 5.14v13.72a1 1 0 0 1-1.6.8L5.67 17H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h2.67l3.73-2.66a1 1 0 0 1 1.6.8z"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07 1 1 0 0 1-1.41-1.41 3 3 0 0 0 0-4.24 1 1 0 0 1 1.41-1.42zM18.36 5.64a9 9 0 0 1 0 12.72 1 1 0 0 1-1.41-1.41 7 7 0 0 0 0-9.9 1 1 0 0 1 1.41-1.41z"/>
            </svg>
          </button>
          <input
            type="range"
            class="player-volume-slider"
            min="0"
            max="1"
            step="0.01"
            :value="isMuted ? 0 : volume"
            @input="onVolumeInput"
            :aria-label="$t('converter.player.volume')"
            :aria-valuetext="Math.round((isMuted ? 0 : volume) * 100) + '%'"
          >
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

// Lautstärke / Stummschaltung (bleibt über Track-Wechsel hinweg erhalten)
const VOLUME_STORAGE_KEY = 'mp3-converter-player-volume'

function loadStoredVolume() {
  if (typeof localStorage === 'undefined') return 1
  const stored = parseFloat(localStorage.getItem(VOLUME_STORAGE_KEY))
  return Number.isFinite(stored) ? Math.min(1, Math.max(0, stored)) : 1
}

const volume = ref(loadStoredVolume())
const isMuted = ref(false)
// Lautstärke, die vor dem Stummschalten aktiv war (zum Wiederherstellen)
let volumeBeforeMute = volume.value || 1

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
  applyVolume()

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

// ===== Lautstärke =====
// Aktuelle Lautstärke/Stummschaltung auf das <audio>-Element übertragen
function applyVolume() {
  const el = audioEl.value
  if (!el) return
  el.muted = isMuted.value
  el.volume = volume.value
}

function persistVolume() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(VOLUME_STORAGE_KEY, String(volume.value))
  }
}

function onVolumeInput(event) {
  const value = parseFloat(event.target.value)
  if (Number.isNaN(value)) return
  volume.value = Math.min(1, Math.max(0, value))
  // Am Slider ziehen hebt die Stummschaltung auf
  isMuted.value = volume.value === 0
  if (volume.value > 0) volumeBeforeMute = volume.value
  applyVolume()
  persistVolume()
}

function toggleMute() {
  if (isMuted.value || volume.value === 0) {
    // Stummschaltung aufheben -> vorherige Lautstärke wiederherstellen
    isMuted.value = false
    volume.value = volumeBeforeMute > 0 ? volumeBeforeMute : 1
    persistVolume()
  } else {
    // Stummschalten -> aktuelle Lautstärke merken
    volumeBeforeMute = volume.value
    isMuted.value = true
  }
  applyVolume()
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
