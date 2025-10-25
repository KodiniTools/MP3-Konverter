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
          <div class="tool-icon">{{ $t(`tools.${tool.key}.icon`) }}</div>
          <h3>{{ $t(`tools.${tool.key}.title`) }}</h3>
          <p>{{ $t(`tools.${tool.key}.desc`) }}</p>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
const tools = [
  { key: 'tool1', url: 'https://kodinitools.com/playlist_generator/' },
  { key: 'tool2', url: 'https://kodinitools.com/visualizer/' },
  { key: 'tool3', url: 'https://kodinitools.com/bilderseriebearbeiten/' }
]
</script>
