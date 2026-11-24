<template>
  <section id="how-it-works" class="how-it-works-section">
    <div class="how-it-works-container">
      <div class="section-header">
        <span class="section-eyebrow">{{ $t('howItWorks.eyebrow') }}</span>
        <h2 class="section-title">{{ $t('howItWorks.title') }}</h2>
        <p class="section-subtitle">{{ $t('howItWorks.subtitle') }}</p>
      </div>

      <ol class="steps-grid">
        <li v-for="(step, index) in steps" :key="step.key" class="step-card glass-card">
          <span class="step-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <div class="step-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path v-for="(d, pathIndex) in step.paths" :key="pathIndex" :d="d" />
            </svg>
          </div>
          <h3>{{ $t(`howItWorks.${step.key}.title`) }}</h3>
          <p>{{ $t(`howItWorks.${step.key}.desc`) }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup>
// Drei Schritte wie im Konverter: Dateien wählen, Ausgabe einstellen, Ergebnis speichern
const steps = [
  { key: 'select', paths: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z', 'M14 3v5h5', 'M12 18v-6m-3 3 3-3 3 3'] },
  { key: 'configure', paths: ['M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1', 'M15 4v4M9 10v4M17 16v4'] },
  { key: 'download', paths: ['M12 4v11m-4-4 4 4 4-4', 'M5 20h14'] }
]
</script>
