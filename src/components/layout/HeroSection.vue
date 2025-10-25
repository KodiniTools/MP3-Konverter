<template>
  <section class="hero">
    <div class="hero-container">
      <h1>{{ $t('hero.title') }}</h1>
      <p>{{ $t('hero.subtitle') }}</p>
      
      <div class="trust-badges">
        <div 
          v-for="(badge, index) in trustBadges" 
          :key="index"
          class="trust-badge"
        >
          <span>{{ badge.icon }}</span>
          <span>{{ $t(badge.text) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const trustBadges = [
  { icon: '🔒', text: 'hero.trustBadge1' },
  { icon: '⚡', text: 'hero.trustBadge2' },
  { icon: '🆓', text: 'hero.trustBadge3' },
  { icon: '🛡️', text: 'hero.trustBadge4' }
]
</script>
