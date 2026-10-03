<template>
  <button
    type="button"
    class="contrast-toggle"
    :class="{ 'is-active': highContrast }"
    :aria-pressed="highContrast ? 'true' : 'false'"
    :title="$t('common.toggleContrast')"
    @click="themeStore.toggleContrast()"
  >
    <svg class="contrast-toggle-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>
    </svg>
    <span>{{ $t('common.highContrast') }}</span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useThemeStore } from '../../stores/theme'

// Schaltet zwischen Original- und Kontrast-Theme (data-theme light|dark <-> contrast-light|contrast-dark)
const themeStore = useThemeStore()
const highContrast = computed(() => themeStore.highContrast)
</script>
