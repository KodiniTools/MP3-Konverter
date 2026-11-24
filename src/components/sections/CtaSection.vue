<template>
  <section class="cta-section" aria-labelledby="cta-title">
    <div class="cta-inner">
      <h2 id="cta-title">{{ $t('cta.title') }}</h2>
      <p>{{ $t('cta.text') }}</p>
      <RouterLink class="hero-cta" :to="{ name: 'app' }">
        {{ $t('cta.button') }}
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
      </RouterLink>
    </div>
  </section>
</template>
