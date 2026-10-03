<template>
  <section class="hero">
    <div class="hero-container">
      <h1>{{ $t('hero.title') }}</h1>
      <p>{{ $t('hero.subtitle') }}</p>

      <div class="trust-badges">
        <div
          v-for="badge in trustBadges"
          :key="badge.text"
          class="trust-badge"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path v-for="(d, index) in badge.paths" :key="index" :d="d" />
          </svg>
          <span>{{ $t(badge.text) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// Trust-Badges mit SVG-Icons statt Emoji (Schloss, Blitz, Euro, Schild)
const trustBadges = [
  {
    text: 'hero.trustBadge1',
    paths: ['M6 11h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z', 'M8 11V7a4 4 0 0 1 8 0v4']
  },
  {
    text: 'hero.trustBadge2',
    paths: ['M13 2 4 14h7l-1 8 9-12h-7l1-8z']
  },
  {
    text: 'hero.trustBadge3',
    paths: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', 'M14.5 9.5a3 3 0 0 0-5 2.5 3 3 0 0 0 5 2.5M7.5 11h5M7.5 13h5']
  },
  {
    text: 'hero.trustBadge4',
    paths: ['M12 3 4 6v5c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6l-8-3z', 'm9 12 2 2 4-4']
  }
]
</script>
