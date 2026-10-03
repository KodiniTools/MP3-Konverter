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
          <div class="feature-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path v-for="(d, index) in feature.paths" :key="index" :d="d" />
            </svg>
          </div>
          <h3>{{ $t(`features.${feature.key}.title`) }}</h3>
          <p>{{ $t(`features.${feature.key}.desc`) }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// Icons im 24er-Raster: Blitz, Schloss, Euro, Schild, Ebenen, Smartphone
const features = [
  { key: 'speed', paths: ['M13 2 4 14h7l-1 8 9-12h-7l1-8z'] },
  { key: 'security', paths: ['M6 11h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z', 'M8 11V7a4 4 0 0 1 8 0v4'] },
  { key: 'free', paths: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', 'M14.5 9.5a3 3 0 0 0-5 2.5 3 3 0 0 0 5 2.5M7.5 11h5M7.5 13h5'] },
  { key: 'privacy', paths: ['M12 3 4 6v5c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6l-8-3z', 'm9 12 2 2 4-4'] },
  { key: 'formats', paths: ['m12 3 9 5-9 5-9-5 9-5z', 'm3 13 9 5 9-5'] },
  { key: 'responsive', paths: ['M9 2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z', 'M11 18h2'] }
]
</script>
