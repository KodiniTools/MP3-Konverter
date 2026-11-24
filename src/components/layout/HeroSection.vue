<template>
  <section class="hero hero--landing" aria-labelledby="hero-title">
    <div class="hero-container hero-grid">
      <div class="hero-copy">
        <div class="hero-eyebrow"><span class="hero-status-dot" aria-hidden="true"></span>{{ $t('hero.eyebrow') }}</div>
        <h1 id="hero-title">{{ $t('hero.title') }}</h1>
        <p class="hero-lead">{{ $t('hero.lead') }}</p>
        <p>{{ $t('hero.subtitle') }}</p>
        <div class="hero-actions">
          <RouterLink class="hero-cta" :to="{ name: 'app' }">
            {{ $t('hero.cta') }}
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
          </RouterLink>
          <a class="hero-secondary" href="#features">{{ $t('hero.learnMore') }}</a>
        </div>

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

      <!-- Bild der Landingpage: WAV, FLAC, M4A und OGG werden zu MP3 (WebP in zwei Breiten) -->
      <figure class="hero-media">
        <img
          :src="heroImage1536"
          :srcset="`${heroImage768} 768w, ${heroImage1536} 1536w`"
          sizes="(min-width: 1024px) 560px, calc(100vw - 32px)"
          width="1536"
          height="1024"
          :alt="$t('hero.imageAlt')"
          fetchpriority="high"
          decoding="async"
        />
      </figure>
    </div>
  </section>
</template>

<script setup>
import heroImage768 from '../../assets/images/landing-hero-768.webp'
import heroImage1536 from '../../assets/images/landing-hero-1536.webp'

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
