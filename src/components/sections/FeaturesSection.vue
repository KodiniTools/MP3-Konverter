<template>
  <section class="features">
    <div class="features-container">
      <h2 class="section-title">{{ $t('features.title') }}</h2>
      
      <div class="features-grid">
        <div 
          v-for="feature in features" 
          :key="feature.key"
          class="feature-card glass-card"
        >
          <div class="feature-icon">{{ feature.icon }}</div>
          <h3>{{ $t(`features.${feature.key}.title`) }}</h3>
          <p>{{ $t(`features.${feature.key}.desc`) }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const features = [
  { key: 'speed', icon: '⚡' },
  { key: 'security', icon: '🛡️' },
  { key: 'free', icon: '🆓' },
  { key: 'privacy', icon: '🔒' },
  { key: 'formats', icon: '🎯' },
  { key: 'responsive', icon: '📱' }
]
</script>
