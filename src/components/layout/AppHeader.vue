<template>
  <!-- Seitennavigation unter der globalen SSI-Navigation, Aufbau wie AppHeader im Playlist Generator -->
  <header class="app-header">
    <div class="app-header__inner">
      <nav class="app-header__nav" :aria-label="$t('nav.label')">
        <RouterLink
          v-for="item in items"
          :key="item.name"
          :to="{ name: item.name }"
          class="app-header__link"
          exact-active-class="app-header__link--active"
        >
          {{ $t(item.labelKey) }}
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<script setup>
// Routen aus src/router/index.js; die aktive Seite markiert der Router (exakter Pfad)
const items = [
  { name: 'landing', labelKey: 'nav.home' },
  { name: 'app', labelKey: 'nav.app' }
]
</script>
