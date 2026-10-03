<template>
  <section class="other-tools-section">
    <div class="other-tools-container">
      <h2 class="section-title">{{ $t('tools.title') }}</h2>

      <div class="tools-grid">
        <a
          v-for="tool in tools"
          :key="tool.key"
          :href="tool.url"
          target="_blank"
          rel="noopener noreferrer"
          class="tool-card glass-card"
        >
          <div class="tool-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path v-for="(d, index) in tool.paths" :key="index" :d="d" />
            </svg>
          </div>
          <div class="tool-body">
            <h3>{{ $t(`tools.${tool.key}.title`) }}</h3>
            <p>{{ $t(`tools.${tool.key}.desc`) }}</p>
          </div>
          <svg class="tool-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
// Icons im 24er-Raster: Playlist, Pegel, Bild
const tools = [
  { key: 'tool1', url: 'https://kodinitools.com/playlist_generator/', paths: ['M4 6h10M4 12h8M4 18h6', 'M21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z', 'M21 16V8l-5 1'] },
  { key: 'tool2', url: 'https://kodinitools.com/visualizer/', paths: ['M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10'] },
  { key: 'tool3', url: 'https://kodinitools.com/bilderseriebearbeiten/', paths: ['M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M11 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z', 'm21 16-5-5-8 9'] }
]
</script>
