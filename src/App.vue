<template>
  <div class="app-shell">
    <!-- Skip Link: jede Seite trägt id="main-content" -->
    <a href="#main-content" class="skip-link">{{ $t('common.skipToMain') }}</a>

    <!-- Landingpage (/) oder Konverter (/app/) -->
    <RouterView />

    <!-- Footer (wird über SSI eingebunden) -->
  </div>
</template>

<script setup>
import { useThemeStore } from './stores/theme'
import { useLocaleStore } from './stores/locale'

// Stores früh initialisieren: Theme-Watcher, Partial-Abgleich und Listener der globalen Navigation
// sind damit ab dem Start aktiv (wie im Collage Maker), unabhängig von der Seite
useThemeStore()
useLocaleStore()
</script>
